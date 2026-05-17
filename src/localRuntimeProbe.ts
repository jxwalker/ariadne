import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { ensureArtifactDir, timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { slugifyProject } from "./paths.js";
import type {
  LocalRuntimeProbe,
  RuntimeCommandProbe,
  RuntimeModelEndpointProbe,
  RuntimeServiceProbe,
  UsageMetricRecord
} from "./types.js";

const execFileAsync = promisify(execFile);
export type RuntimeModelEndpointId = "ollama" | "ds4-openai" | "lmstudio" | "atlas";

// Keep ordinary reachability checks quick when runtimes are offline.
const DEFAULT_RUNTIME_PROBE_TIMEOUT_MS = 8_000;
// Give reasoning-style local models room to reach the strict READY health token.
const CANARY_RESPONSE_TOKEN_BUDGET = 128;
// Canary generation floors caller timeouts so slow local models are not false negatives.
const CANARY_GENERATION_TIMEOUT_MS = 30_000;

interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

interface HttpResult {
  ok: boolean;
  status: number;
  text: string;
  json?: unknown;
  error?: string;
}

interface RuntimeProbeDeps {
  runCommand?: (command: string, args: string[], timeoutMs: number) => Promise<CommandResult>;
  fetchJson?: (url: string, init: RequestInit | undefined, timeoutMs: number) => Promise<HttpResult>;
}

export async function collectLocalRuntimeProbe(
  input: {
    project: string;
    vaultRoot: string;
    canary?: boolean;
    hermesDashboardUrl?: string;
    ollamaUrl?: string;
    ds4Url?: string;
    lmStudioUrl?: string;
    atlasUrl?: string;
    canaryEndpointIds?: RuntimeModelEndpointId[];
    canaryModels?: Partial<Record<RuntimeModelEndpointId, string>>;
    timeoutMs?: number;
  },
  deps: RuntimeProbeDeps = {}
): Promise<{ jsonPath: string; markdownPath: string; probe: LocalRuntimeProbe }> {
  const project = slugifyProject(input.project);
  const generatedAt = new Date();
  const timeoutMs = input.timeoutMs ?? DEFAULT_RUNTIME_PROBE_TIMEOUT_MS;
  const fetchJson = deps.fetchJson ?? defaultFetchJson;
  const runCommand = deps.runCommand ?? defaultRunCommand;

  const hermesDashboard = await probeHttpService(
    "hermes-dashboard",
    input.hermesDashboardUrl ?? "http://127.0.0.1:9119",
    fetchJson,
    timeoutMs
  );
  const [hermesStatus, hermesDoctor, hermesGateway] = await Promise.all([
    probeCommand("hermes status", "hermes", ["status"], runCommand, timeoutMs),
    probeCommand("hermes doctor", "hermes", ["doctor"], runCommand, timeoutMs),
    probeCommand("hermes gateway status", "hermes", ["gateway", "status"], runCommand, timeoutMs)
  ]);

  const endpointInputs: Array<{
    id: RuntimeModelEndpointId;
    kind: RuntimeModelEndpointProbe["kind"];
    url: string;
    canaryModel?: string;
  }> = [
    {
      id: "ollama",
      kind: "ollama",
      url: input.ollamaUrl ?? "http://127.0.0.1:11434",
      canaryModel: input.canaryModels?.ollama
    },
    {
      id: "ds4-openai",
      kind: "openai-compatible",
      url: input.ds4Url ?? "http://127.0.0.1:8000/v1",
      canaryModel: input.canaryModels?.["ds4-openai"]
    },
    {
      id: "lmstudio",
      kind: "openai-compatible",
      url: input.lmStudioUrl ?? "http://127.0.0.1:1234/v1",
      canaryModel: input.canaryModels?.lmstudio
    },
    {
      id: "atlas",
      kind: "openai-compatible",
      url: input.atlasUrl ?? "http://127.0.0.1:8888/v1",
      canaryModel: input.canaryModels?.atlas
    }
  ];
  const canaryEndpointIds = input.canary
    ? new Set<RuntimeModelEndpointId>(input.canaryEndpointIds ?? endpointInputs.map((endpoint) => endpoint.id))
    : new Set<RuntimeModelEndpointId>();
  const modelEndpoints: RuntimeModelEndpointProbe[] = [];
  for (const endpoint of endpointInputs) {
    modelEndpoints.push(await probeModelEndpoint(endpoint, canaryEndpointIds.has(endpoint.id), fetchJson, timeoutMs));
  }

  const usageRecords = modelEndpoints.flatMap((endpoint, index) =>
    endpoint.canary?.usage
      ? [
          usageRecordFromCanary({
            project,
            generatedAt,
            endpoint,
            index
          })
        ]
      : []
  );

  const statuses = [hermesDashboard.status, hermesStatus.status, hermesDoctor.status, hermesGateway.status].concat(
    modelEndpoints.map((endpoint) => endpoint.status)
  );
  const warnings = [
    ...modelEndpoints
      .filter((endpoint) => endpoint.status !== "reachable")
      .map((endpoint) => `${endpoint.id}: ${endpoint.detail}`),
    ...(hermesDashboard.status === "reachable" ? [] : [`hermes-dashboard: ${hermesDashboard.detail}`]),
    ...[hermesStatus, hermesDoctor, hermesGateway]
      .filter((command) => command.status !== "reachable")
      .map((command) => `${command.command}: ${command.detail}`)
  ];
  const probe: LocalRuntimeProbe = {
    schemaVersion: 1,
    project,
    generatedAt: generatedAt.toISOString(),
    mode: input.canary ? "read_only_with_canary" : "read_only",
    summary: {
      services: statuses.length,
      reachable: statuses.filter((status) => status === "reachable").length,
      degraded: statuses.filter((status) => status === "degraded").length,
      unreachable: statuses.filter((status) => status === "unreachable").length,
      models: modelEndpoints.reduce((sum, endpoint) => sum + endpoint.models.length, 0),
      usageRecords: usageRecords.length,
      warnings
    },
    hermes: {
      dashboard: hermesDashboard,
      statusCommand: hermesStatus,
      doctorCommand: hermesDoctor,
      gatewayCommand: hermesGateway
    },
    modelEndpoints,
    usageRecords
  };

  const name = `local-runtime-probe-${timestampFile(generatedAt)}`;
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "infrastructure/runtime", `${name}.json`, probe);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "infrastructure/runtime",
    `${name}.md`,
    renderProbe(probe)
  );
  if (usageRecords.length > 0) {
    const evidence = path.relative(input.vaultRoot, jsonPath).split(path.sep).join("/");
    await appendUsageRecords(
      input.vaultRoot,
      project,
      usageRecords.map((record) => ({ ...record, evidence }))
    );
  }
  return { jsonPath, markdownPath, probe };
}

async function probeHttpService(
  id: string,
  url: string,
  fetchJson: NonNullable<RuntimeProbeDeps["fetchJson"]>,
  timeoutMs: number
): Promise<RuntimeServiceProbe> {
  const result = await fetchJson(url, undefined, timeoutMs);
  return {
    id,
    url,
    status: result.ok ? "reachable" : "unreachable",
    httpStatus: result.status || undefined,
    detail: result.ok ? "HTTP endpoint responded." : result.error ?? `HTTP ${result.status || "unreachable"}.`
  };
}

async function probeCommand(
  label: string,
  command: string,
  args: string[],
  runCommand: NonNullable<RuntimeProbeDeps["runCommand"]>,
  timeoutMs: number
): Promise<RuntimeCommandProbe> {
  const result = await runCommand(command, args, timeoutMs);
  return {
    command: label,
    status: result.exitCode === 0 ? "reachable" : "degraded",
    exitCode: result.exitCode,
    stdoutPreview: preview(result.stdout),
    stderrPreview: preview(result.stderr),
    detail: result.exitCode === 0 ? "Command completed." : `Command exited ${result.exitCode}.`
  };
}

async function probeModelEndpoint(
  endpoint: { id: RuntimeModelEndpointId; kind: RuntimeModelEndpointProbe["kind"]; url: string; canaryModel?: string },
  canary: boolean,
  fetchJson: NonNullable<RuntimeProbeDeps["fetchJson"]>,
  timeoutMs: number
): Promise<RuntimeModelEndpointProbe> {
  const modelsResult =
    endpoint.kind === "ollama"
      ? await fetchJson(`${endpoint.url.replace(/\/$/, "")}/api/tags`, undefined, timeoutMs)
      : await fetchJson(`${endpoint.url.replace(/\/$/, "")}/models`, undefined, timeoutMs);
  if (!modelsResult.ok) {
    return {
      ...endpoint,
      status: "unreachable",
      models: [],
      detail: modelsResult.error ?? `Model list failed with HTTP ${modelsResult.status || "unreachable"}.`,
      canary: canary ? { status: "skipped" } : undefined
    };
  }

  const models = endpoint.kind === "ollama" ? ollamaModels(modelsResult.json) : openAiModels(modelsResult.json);
  const base: RuntimeModelEndpointProbe = {
    ...endpoint,
    status: models.length > 0 ? "reachable" : "degraded",
    models,
    detail: models.length > 0 ? `Discovered ${models.length} model(s).` : "Endpoint responded without model ids."
  };
  if (!canary || models.length === 0) {
    return canary ? { ...base, canary: { status: "skipped" } } : base;
  }

  const model = endpoint.canaryModel ?? models[0];
  const canaryResult =
    endpoint.kind === "ollama"
      ? await runOllamaCanary(endpoint.url, model, fetchJson, timeoutMs)
      : await runOpenAiCanary(endpoint.url, model, fetchJson, timeoutMs);
  const canaryDetail =
    canaryResult.status === "passed"
      ? base.detail
      : `Discovered ${models.length} model(s); canary ${canaryResult.status}.`;
  return {
    ...base,
    status: canaryResult.status === "passed" ? base.status : "degraded",
    detail: canaryDetail,
    canary: canaryResult
  };
}

async function runOllamaCanary(
  url: string,
  model: string,
  fetchJson: NonNullable<RuntimeProbeDeps["fetchJson"]>,
  timeoutMs: number
): Promise<NonNullable<RuntimeModelEndpointProbe["canary"]>> {
  const canaryTimeoutMs = Math.max(timeoutMs, CANARY_GENERATION_TIMEOUT_MS);
  const result = await fetchJson(
    `${url.replace(/\/$/, "")}/api/generate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: "Ariadne local runtime probe. Reply READY only.",
        stream: false,
        options: { temperature: 0, num_predict: CANARY_RESPONSE_TOKEN_BUDGET }
      })
    },
    canaryTimeoutMs
  );
  if (!result.ok) return { status: "failed", model, responsePreview: result.error ?? result.text };
  const body = objectValue(result.json);
  const response = stringValue(body?.response) ?? "";
  const inputTokens = numberValue(body?.prompt_eval_count);
  const outputTokens = numberValue(body?.eval_count);
  return {
    status: isReadyResponse(response) ? "passed" : response ? "degraded" : "failed",
    model,
    responsePreview: preview(response),
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: sumDefined(inputTokens, outputTokens),
      durationMs: durationMsFromNs(numberValue(body?.total_duration))
    }
  };
}

async function runOpenAiCanary(
  url: string,
  model: string,
  fetchJson: NonNullable<RuntimeProbeDeps["fetchJson"]>,
  timeoutMs: number
): Promise<NonNullable<RuntimeModelEndpointProbe["canary"]>> {
  const canaryTimeoutMs = Math.max(timeoutMs, CANARY_GENERATION_TIMEOUT_MS);
  const result = await fetchJson(
    `${url.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Ariadne local runtime probe. Reply READY only." }],
        temperature: 0,
        max_tokens: CANARY_RESPONSE_TOKEN_BUDGET
      })
    },
    canaryTimeoutMs
  );
  if (!result.ok) return { status: "failed", model, responsePreview: result.error ?? result.text };
  const body = objectValue(result.json);
  const response = stringValue(firstChoiceMessage(body)) ?? "";
  const usage = objectValue(body?.usage);
  const inputTokens = numberValue(usage?.prompt_tokens);
  const outputTokens = numberValue(usage?.completion_tokens);
  return {
    status: isReadyResponse(response) ? "passed" : response ? "degraded" : "failed",
    model,
    responsePreview: preview(response),
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: numberValue(usage?.total_tokens) ?? sumDefined(inputTokens, outputTokens)
    }
  };
}

function usageRecordFromCanary(input: {
  project: string;
  generatedAt: Date;
  endpoint: RuntimeModelEndpointProbe;
  index: number;
}): UsageMetricRecord {
  const usage = input.endpoint.canary?.usage ?? {};
  return {
    schemaVersion: 1,
    id: `usage-local-llm-${timestampFile(input.generatedAt)}-${input.index + 1}`,
    project: input.project,
    recordedAt: input.generatedAt.toISOString(),
    source: "local-llm",
    model: input.endpoint.canary?.model,
    operation: `${input.endpoint.id} canary`,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
    durationMs: usage.durationMs
  };
}

async function appendUsageRecords(vaultRoot: string, project: string, records: UsageMetricRecord[]): Promise<void> {
  const dir = await ensureArtifactDir(vaultRoot, project, "evaluation");
  await fs.appendFile(path.join(dir, "usage-metrics.jsonl"), records.map((record) => JSON.stringify(record)).join("\n") + "\n");
}

function renderProbe(probe: LocalRuntimeProbe): string {
  return [
    "# Local Runtime Probe",
    "",
    `Project: ${probe.project}`,
    `Generated: ${probe.generatedAt}`,
    `Mode: ${probe.mode}`,
    "",
    "## Summary",
    "",
    `- Services: ${probe.summary.services}`,
    `- Reachable: ${probe.summary.reachable}`,
    `- Degraded: ${probe.summary.degraded}`,
    `- Unreachable: ${probe.summary.unreachable}`,
    `- Models: ${probe.summary.models}`,
    `- Usage records: ${probe.summary.usageRecords}`,
    "",
    "## Hermes",
    "",
    `- Dashboard: ${probe.hermes.dashboard.status} (${probe.hermes.dashboard.detail})`,
    `- Status command: ${probe.hermes.statusCommand.status}`,
    `- Doctor command: ${probe.hermes.doctorCommand.status}`,
    `- Gateway command: ${probe.hermes.gatewayCommand.status}`,
    "",
    "## Model Endpoints",
    "",
    "| Id | Kind | Status | Models | Canary |",
    "| --- | --- | --- | --- | --- |",
    ...probe.modelEndpoints.map(
      (endpoint) =>
        `| ${endpoint.id} | ${endpoint.kind} | ${endpoint.status} | ${endpoint.models.length} | ${endpoint.canary?.status ?? "not-run"} |`
    ),
    "",
    "## Warnings",
    "",
    ...(probe.summary.warnings.length > 0 ? probe.summary.warnings.map((warning) => `- ${warning}`) : ["- none"]),
    ""
  ].join("\n");
}

async function defaultRunCommand(command: string, args: string[], timeoutMs: number): Promise<CommandResult> {
  try {
    const result = await execFileAsync(command, args, { timeout: timeoutMs, maxBuffer: 256 * 1024, encoding: "utf8" });
    return { exitCode: 0, stdout: sanitize(String(result.stdout ?? "")), stderr: sanitize(String(result.stderr ?? "")) };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: string | number };
    return {
      exitCode: typeof err.code === "number" ? err.code : 127,
      stdout: sanitize(String(err.stdout ?? "")),
      stderr: sanitize(String(err.stderr ?? err.message ?? ""))
    };
  }
}

async function defaultFetchJson(url: string, init: RequestInit | undefined, timeoutMs: number): Promise<HttpResult> {
  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    const text = sanitize(await response.text());
    return {
      ok: response.ok,
      status: response.status,
      text,
      json: parseJson(text),
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      text: "",
      error: error instanceof Error ? sanitize(error.message) : "request failed"
    };
  }
}

function ollamaModels(value: unknown): string[] {
  const models = Array.isArray(objectValue(value)?.models) ? (objectValue(value)?.models as unknown[]) : [];
  return models.map((item) => stringValue(objectValue(item)?.name)).filter(isString).sort();
}

function openAiModels(value: unknown): string[] {
  const data = Array.isArray(objectValue(value)?.data) ? (objectValue(value)?.data as unknown[]) : [];
  return data.map((item) => stringValue(objectValue(item)?.id)).filter(isString).sort();
}

function firstChoiceMessage(value: Record<string, unknown> | undefined): unknown {
  const choices = Array.isArray(value?.choices) ? value.choices : [];
  const first = objectValue(choices[0]);
  return objectValue(first?.message)?.content ?? first?.text;
}

function parseJson(text: string): unknown | undefined {
  try {
    return text ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    return undefined;
  }
}

function preview(value: string | undefined): string | undefined {
  const clean = sanitize(value ?? "").replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, 280) : undefined;
}

function sanitize(value: string): string {
  const home = process.env.HOME;
  return value
    .replace(home ? new RegExp(escapeRegExp(home), "g") : /$a/, "<HOME>")
    .replace(new RegExp(escapeRegExp(process.cwd()), "g"), "<WORKSPACE_ROOT>")
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-[redacted]")
    .replace(/gh[pousr]_[A-Za-z0-9_]{8,}/g, "gh_[redacted]");
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function durationMsFromNs(value: number | undefined): number | undefined {
  return value === undefined ? undefined : Math.round(value / 1_000_000);
}

function sumDefined(left?: number, right?: number): number | undefined {
  if (left === undefined && right === undefined) return undefined;
  return (left ?? 0) + (right ?? 0);
}

function isString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

function isReadyResponse(value: string): boolean {
  return value.trim().toUpperCase() === "READY";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
