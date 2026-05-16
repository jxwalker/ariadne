import fs from "node:fs/promises";
import path from "node:path";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { HermesCronProposal, HermesCronSnapshot } from "./types.js";

type JsonObject = Record<string, unknown>;
type SnapshotEvidence = { snapshot: HermesCronSnapshot; artifactRef: string };

export async function importHermesCronSnapshot(input: {
  project: string;
  vaultRoot: string;
  sourcePath: string;
  host?: string;
}): Promise<{ jsonPath: string; markdownPath: string; snapshot: HermesCronSnapshot }> {
  const project = slugifyProject(input.project);
  const importedAt = new Date();
  const raw = await readJson(input.sourcePath);
  const jobs = extractJobs(raw);
  const warnings = cronWarnings(jobs);
  const snapshot: HermesCronSnapshot = {
    schemaVersion: 1,
    project,
    importedAt: importedAt.toISOString(),
    sourcePath: portablePath(input.vaultRoot, path.resolve(input.sourcePath)),
    host: input.host,
    mode: "read_only",
    summary: {
      jobs: jobs.length,
      enabled: jobs.filter((job) => job.enabled === true).length,
      disabled: jobs.filter((job) => job.enabled === false).length,
      schedules: unique(jobs.map((job) => job.schedule).filter(isString)).slice(0, 12),
      nextRuns: unique(jobs.map((job) => job.nextRun).filter(isString)).slice(0, 12),
      warnings
    },
    jobs,
    raw: redactSecrets(raw)
  };
  const name = `hermes-cron-${timestampFile(importedAt)}`;
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "coordination/hermes", `${name}.json`, snapshot);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "coordination/hermes",
    `${name}.md`,
    renderSnapshot(snapshot)
  );
  return { jsonPath, markdownPath, snapshot };
}

export async function generateHermesCronProposal(input: {
  project: string;
  vaultRoot: string;
  scope?: string;
}): Promise<{ jsonPath: string; markdownPath: string; proposal: HermesCronProposal }> {
  const project = slugifyProject(input.project);
  const generatedAt = new Date();
  const snapshots = await readHermesCronSnapshots(input.vaultRoot, project);
  const snapshotRefs = snapshots.map((item) => item.artifactRef);
  const actions = proposedActions(snapshots, input.scope);
  const warnings = proposalWarnings(snapshots);
  const jobs = snapshots.flatMap((item) => item.snapshot.jobs);
  const proposal: HermesCronProposal = {
    schemaVersion: 1,
    id: `hermes-cron-proposal-${timestampFile(generatedAt)}`,
    project,
    generatedAt: generatedAt.toISOString(),
    mode: "proposal_only",
    snapshotRefs,
    summary: {
      snapshots: snapshots.length,
      jobs: jobs.length,
      enabled: jobs.filter((job) => job.enabled === true).length,
      disabled: jobs.filter((job) => job.enabled === false).length,
      proposedActions: actions.length,
      warnings
    },
    proposedActions: actions
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "coordination/hermes", `${proposal.id}.json`, proposal);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "coordination/hermes",
    `${proposal.id}.md`,
    renderProposal(proposal)
  );
  return { jsonPath, markdownPath, proposal };
}

async function readJson(sourcePath: string): Promise<unknown> {
  try {
    return JSON.parse(await fs.readFile(sourcePath, "utf8")) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse JSON from ${sourcePath}: ${error.message}`);
    }
    throw error;
  }
}

function extractJobs(raw: unknown): HermesCronSnapshot["jobs"] {
  const values = candidateJobArrays(raw).flatMap((items) => items);
  return values.map(normaliseJob).filter((job): job is HermesCronSnapshot["jobs"][number] => Boolean(job));
}

async function readHermesCronSnapshots(vaultRoot: string, project: string): Promise<SnapshotEvidence[]> {
  const dir = path.join(projectDir(vaultRoot, project), "coordination", "hermes");
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const snapshots: SnapshotEvidence[] = [];
  for (const name of names.filter((item) => item.startsWith("hermes-cron-") && item.endsWith(".json")).sort()) {
    const artifactPath = path.join(dir, name);
    const value = await readJson(artifactPath);
    if (isHermesCronSnapshot(value)) {
      snapshots.push({ snapshot: value, artifactRef: path.relative(vaultRoot, artifactPath) });
    }
  }
  return snapshots;
}

function proposedActions(snapshots: SnapshotEvidence[], scope?: string): HermesCronProposal["proposedActions"] {
  const actions: HermesCronProposal["proposedActions"] = [];
  const jobs = snapshots.flatMap((item) =>
    item.snapshot.jobs.map((job) => ({
      artifactRef: item.artifactRef,
      job
    }))
  );

  for (const { artifactRef, job } of jobs.slice(-20)) {
    const evidenceRefs = [artifactRef];
    if (job.enabled === false) {
      actions.push({
        id: `review-${slugFor(job.name)}`,
        kind: "review",
        title: `Review disabled Hermes job: ${job.name}`,
        rationale: "Disabled scheduler evidence should be reviewed before Ariadne relies on it for sleep or memory routines.",
        schedule: job.schedule,
        sourceJob: job.id ?? job.name,
        evidenceRefs
      });
    } else {
      actions.push({
        id: `keep-${slugFor(job.name)}`,
        kind: "keep",
        title: `Keep Hermes job visible: ${job.name}`,
        rationale: "Track this existing schedule as evidence before adding mutation-capable cron automation.",
        schedule: job.schedule,
        sourceJob: job.id ?? job.name,
        evidenceRefs
      });
    }
  }

  if (jobs.length === 0) {
    actions.push({
      id: "create-candidate-sleep-review",
      kind: "create-candidate",
      title: `Draft ${scope ?? "nightly"} Ariadne sleep review job`,
      rationale: "No imported Hermes scheduler evidence exists yet; create only a proposal until a real Hermes export is imported.",
      schedule: "0 2 * * *",
      evidenceRefs: []
    });
  }

  return dedupeActions(actions);
}

function proposalWarnings(snapshots: SnapshotEvidence[]): string[] {
  if (snapshots.length === 0) {
    return ["No Hermes cron snapshots were available; proposal is a candidate only."];
  }
  return snapshots.flatMap((item) => item.snapshot.summary.warnings).slice(0, 12);
}

function candidateJobArrays(raw: unknown): unknown[][] {
  if (Array.isArray(raw)) return [raw];
  if (!isObject(raw)) return [];

  const directKeys = ["jobs", "cron", "crons", "cronJobs", "scheduledJobs", "schedules", "tasks"];
  const direct = directKeys.flatMap((key) => {
    const value = raw[key];
    return Array.isArray(value) ? [value] : [];
  });
  if (direct.length > 0) return direct;

  return Object.values(raw).flatMap((value) => (Array.isArray(value) && looksLikeJobArray(value) ? [value] : []));
}

function looksLikeJobArray(values: unknown[]): boolean {
  return values.some((value) => isObject(value) && ("schedule" in value || "cron" in value || "prompt" in value));
}

function normaliseJob(value: unknown): HermesCronSnapshot["jobs"][number] | undefined {
  if (!isObject(value)) return undefined;
  const id = redactText(firstString(value, ["id", "jobId", "uuid"]));
  const name = redactText(firstString(value, ["name", "title", "label", "description"])) ?? id ?? "unnamed Hermes cron job";
  const status = redactText(firstString(value, ["status", "state"]));
  const enabled = enabledValue(value, status);
  return {
    id,
    name,
    schedule: redactText(firstString(value, ["schedule", "cron", "expression", "rrule"])),
    enabled,
    status,
    nextRun: redactText(firstString(value, ["nextRun", "next_run", "nextAt", "next_at"])),
    lastRun: redactText(firstString(value, ["lastRun", "last_run", "lastAt", "last_at"])),
    intent: summarizeIntent(redactText(firstString(value, ["prompt", "command", "task", "message", "body"])))
  };
}

function firstString(value: JsonObject, keys: string[]): string | undefined {
  for (const key of keys) {
    const item = value[key];
    if (typeof item === "string" && item.trim()) return item.trim();
    if (typeof item === "number" || typeof item === "boolean") return String(item);
  }
  return undefined;
}

function enabledValue(value: JsonObject, status?: string): boolean | undefined {
  if (typeof value.enabled === "boolean") return value.enabled;
  if (typeof value.disabled === "boolean") return !value.disabled;
  const lower = status?.toLowerCase();
  if (!lower) return undefined;
  if (["enabled", "active", "running", "scheduled"].includes(lower)) return true;
  if (["disabled", "paused", "stopped", "inactive"].includes(lower)) return false;
  return undefined;
}

function summarizeIntent(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.replace(/\s+/g, " ").slice(0, 180);
}

function cronWarnings(jobs: HermesCronSnapshot["jobs"]): string[] {
  const warnings: string[] = [];
  if (jobs.length === 0) {
    warnings.push("No Hermes cron jobs were found in the imported snapshot.");
  }
  const missingSchedule = jobs.filter((job) => !job.schedule).length;
  if (missingSchedule > 0) {
    warnings.push(`${missingSchedule} job(s) do not expose a schedule.`);
  }
  const runnable = jobs.filter((job) => job.enabled !== false).length;
  if (runnable > 0) {
    warnings.push("Imported jobs are evidence only; Ariadne did not create, enable, disable, or run any Hermes cron job.");
  }
  return warnings;
}

function redactSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    return redactText(value) ?? value;
  }
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /(password|passwd|pwd|secret|token|api[_-]?key|authorization)/i.test(key) ? "[redacted]" : redactSecrets(item)
      ])
    );
  }
  return value;
}

function renderSnapshot(snapshot: HermesCronSnapshot): string {
  return [
    "# Hermes Cron Snapshot",
    "",
    `Imported: ${snapshot.importedAt}`,
    `Mode: ${snapshot.mode}`,
    snapshot.host ? `Host: ${snapshot.host}` : undefined,
    `Source: ${snapshot.sourcePath}`,
    "",
    "## Summary",
    "",
    `- Jobs: ${snapshot.summary.jobs}`,
    `- Enabled: ${snapshot.summary.enabled}`,
    `- Disabled: ${snapshot.summary.disabled}`,
    `- Schedules: ${snapshot.summary.schedules.join(", ") || "none"}`,
    "",
    "## Warnings",
    "",
    ...list(snapshot.summary.warnings),
    "",
    "## Jobs",
    "",
    ...jobLines(snapshot.jobs),
    ""
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
}

function renderProposal(proposal: HermesCronProposal): string {
  return [
    "# Hermes Cron Proposal",
    "",
    `Generated: ${proposal.generatedAt}`,
    `Mode: ${proposal.mode}`,
    "",
    "## Summary",
    "",
    `- Snapshots: ${proposal.summary.snapshots}`,
    `- Jobs: ${proposal.summary.jobs}`,
    `- Enabled: ${proposal.summary.enabled}`,
    `- Disabled: ${proposal.summary.disabled}`,
    `- Proposed actions: ${proposal.summary.proposedActions}`,
    "",
    "## Warnings",
    "",
    ...list(proposal.summary.warnings),
    "",
    "## Proposed Actions",
    "",
    ...proposal.proposedActions.map(
      (action) =>
        `- ${action.kind}: ${action.title}${action.schedule ? ` (${action.schedule})` : ""}. ${action.rationale}`
    ),
    ""
  ].join("\n");
}

function jobLines(jobs: HermesCronSnapshot["jobs"]): string[] {
  if (jobs.length === 0) return ["- none"];
  return jobs.map((job) => {
    const parts = [job.schedule, job.enabled === undefined ? undefined : `enabled=${job.enabled}`, job.status].filter(
      isString
    );
    return `- ${job.name}${parts.length ? ` (${parts.join(", ")})` : ""}${job.intent ? `: ${job.intent}` : ""}`;
  });
}

function list(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function dedupeActions(actions: HermesCronProposal["proposedActions"]): HermesCronProposal["proposedActions"] {
  const seen = new Set<string>();
  return actions.filter((action) => {
    if (seen.has(action.id)) return false;
    seen.add(action.id);
    return true;
  });
}

function slugFor(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function isHermesCronSnapshot(value: unknown): value is HermesCronSnapshot {
  return isObject(value) && value.schemaVersion === 1 && value.mode === "read_only" && Array.isArray(value.jobs);
}

function portablePath(vaultRoot: string, value: string): string {
  const workspaceRoot = path.dirname(vaultRoot);
  const relativeToVault = path.relative(vaultRoot, value);
  if (!relativeToVault.startsWith("..") && !path.isAbsolute(relativeToVault)) {
    return path.join("<VAULT_ROOT>", relativeToVault);
  }
  const relativeToWorkspace = path.relative(workspaceRoot, value);
  if (!relativeToWorkspace.startsWith("..") && !path.isAbsolute(relativeToWorkspace)) {
    return path.join("<WORKSPACE_ROOT>", relativeToWorkspace);
  }
  return path.join("<EXTERNAL_PATH>", path.basename(value));
}

function redactText(value: string | undefined): string | undefined {
  return value
    ?.replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-[redacted]")
    .replace(/gh[pousr]_[A-Za-z0-9_]{8,}/g, "gh_[redacted]")
    .replace(/AKIA[0-9A-Z]{8,}/g, "AKIA[redacted]")
    .replace(/\b(password|passwd|pwd|secret|token|api[_-]?key)(\s*[:=]\s*["']?)[^"'\s]{8,}/gi, "$1$2[redacted]");
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
