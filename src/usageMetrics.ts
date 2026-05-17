import fs from "node:fs/promises";
import path from "node:path";
import { ensureArtifactDir, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { UsageMetricRecord, UsageMetricsReport } from "./types.js";

export async function importUsageMetrics(input: {
  project: string;
  vaultRoot: string;
  sourcePath: string;
  source?: UsageMetricRecord["source"];
}): Promise<UsageMetricRecord[]> {
  const project = slugifyProject(input.project);
  const sourcePath = path.resolve(input.sourcePath);
  const raw = await readJsonFile(sourcePath);
  const entries = Array.isArray(raw) ? raw : [raw];
  const records = entries
    .map((entry, index) => normaliseMetric(entry, { project, sourcePath, index, source: input.source }))
    .filter((record): record is UsageMetricRecord => record !== undefined);

  if (records.length === 0) {
    throw new Error(`No usage metric records found in ${sourcePath}.`);
  }

  const dir = await ensureArtifactDir(input.vaultRoot, project, "evaluation");
  await fs.appendFile(
    path.join(dir, "usage-metrics.jsonl"),
    records.map((record) => JSON.stringify(record)).join("\n") + "\n"
  );
  return records;
}

export async function generateUsageMetricsReport(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; report: UsageMetricsReport }> {
  const project = slugifyProject(input.project);
  const records = await readUsageMetrics(input.vaultRoot, project);
  const totalInputTokens = sum(records.map((record) => record.inputTokens ?? 0));
  const totalOutputTokens = sum(records.map((record) => record.outputTokens ?? 0));
  const totalTokens = sum(records.map((record) => record.totalTokens ?? 0));
  const totalCostUsd = roundMoney(sum(records.map((record) => record.costUsd ?? 0)));
  const report: UsageMetricsReport = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    recordCount: records.length,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    totalCostUsd,
    bySource: aggregate(records, (record) => record.source),
    byModel: aggregate(records, (record) => record.model ?? "unknown"),
    latest: records.at(-1)
  };

  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "evaluation", "usage-report.json", report);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "evaluation",
    "usage-report.md",
    renderReport(report)
  );
  return { jsonPath, markdownPath, report };
}

async function readUsageMetrics(vaultRoot: string, project: string): Promise<UsageMetricRecord[]> {
  const filePath = path.join(projectDir(vaultRoot, project), "evaluation", "usage-metrics.jsonl");
  try {
    const text = await fs.readFile(filePath, "utf8");
    const records: UsageMetricRecord[] = [];
    for (const line of text
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)) {
      try {
        records.push(JSON.parse(line) as UsageMetricRecord);
      } catch {
        continue;
      }
    }
    return records.sort((left, right) => left.recordedAt.localeCompare(right.recordedAt));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function readJsonFile(filePath: string): Promise<unknown> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON from ${filePath}: ${message}`);
  }
}

function normaliseMetric(
  value: unknown,
  context: { project: string; sourcePath: string; index: number; source?: UsageMetricRecord["source"] }
): UsageMetricRecord | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const obj = value as Record<string, unknown>;
  const usage = objectValue(obj.usage) ?? objectValue(obj.metrics) ?? obj;
  const inputTokens = numberValue(usage.inputTokens ?? usage.input_tokens ?? usage.prompt_tokens ?? usage.promptTokens);
  const outputTokens = numberValue(
    usage.outputTokens ?? usage.output_tokens ?? usage.completion_tokens ?? usage.completionTokens
  );
  const totalTokens =
    numberValue(usage.totalTokens ?? usage.total_tokens ?? usage.tokens) ?? sumDefined(inputTokens, outputTokens);
  const costUsd = numberValue(usage.costUsd ?? usage.cost_usd ?? usage.usd ?? usage.cost);
  const source = context.source ?? sourceValue(obj.source ?? obj.provider ?? obj.tool) ?? "manual";

  if (inputTokens === undefined && outputTokens === undefined && totalTokens === undefined && costUsd === undefined) {
    return undefined;
  }

  const recordedAt = stringValue(obj.recordedAt ?? obj.timestamp ?? obj.created_at) ?? new Date().toISOString();
  return {
    schemaVersion: 1,
    id: `usage-${source}-${recordedAt.replace(/[:.]/g, "-")}-${context.index + 1}`,
    project: context.project,
    recordedAt,
    source,
    model: stringValue(obj.model ?? usage.model),
    operation: stringValue(obj.operation ?? obj.task ?? obj.name),
    inputTokens,
    outputTokens,
    totalTokens,
    costUsd,
    durationMs: numberValue(obj.durationMs ?? obj.duration_ms ?? usage.durationMs ?? usage.duration_ms),
    evidence: context.sourcePath
  };
}

function aggregate(
  records: UsageMetricRecord[],
  keyFn: (record: UsageMetricRecord) => string
): UsageMetricsReport["bySource"] {
  const groups = new Map<string, UsageMetricRecord[]>();
  for (const record of records) {
    const key = keyFn(record);
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, group]) => ({
      name,
      records: group.length,
      inputTokens: sum(group.map((record) => record.inputTokens ?? 0)),
      outputTokens: sum(group.map((record) => record.outputTokens ?? 0)),
      totalTokens: sum(group.map((record) => record.totalTokens ?? 0)),
      costUsd: roundMoney(sum(group.map((record) => record.costUsd ?? 0)))
    }));
}

function renderReport(report: UsageMetricsReport): string {
  return [
    "# Usage Metrics Report",
    "",
    `Project: ${report.project}`,
    `Generated: ${report.generatedAt}`,
    `Records: ${report.recordCount}`,
    `Input tokens: ${report.totalInputTokens}`,
    `Output tokens: ${report.totalOutputTokens}`,
    `Total tokens: ${report.totalTokens}`,
    `Cost USD: ${report.totalCostUsd.toFixed(4)}`,
    "",
    "## By Source",
    "",
    renderTable(report.bySource),
    "",
    "## By Model",
    "",
    renderTable(report.byModel),
    "",
    "## Latest",
    "",
    report.latest
      ? [
          `- Source: ${report.latest.source}`,
          `- Model: ${report.latest.model ?? "unknown"}`,
          `- Total tokens: ${report.latest.totalTokens ?? 0}`,
          `- Cost USD: ${(report.latest.costUsd ?? 0).toFixed(4)}`
        ].join("\n")
      : "- none",
    ""
  ].join("\n");
}

function renderTable(rows: UsageMetricsReport["bySource"]): string {
  if (rows.length === 0) return "- none";
  return [
    "| Name | Records | Input | Output | Total | Cost USD |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| ${row.name} | ${row.records} | ${row.inputTokens} | ${row.outputTokens} | ${row.totalTokens} | ${row.costUsd.toFixed(4)} |`
    )
  ].join("\n");
}

function sourceValue(value: unknown): UsageMetricRecord["source"] | undefined {
  if (
    value === "hermes" ||
    value === "coderabbit" ||
    value === "openai" ||
    value === "ci" ||
    value === "local-llm" ||
    value === "manual"
  ) {
    return value;
  }
  return undefined;
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

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function sumDefined(left?: number, right?: number): number | undefined {
  if (left === undefined && right === undefined) return undefined;
  return (left ?? 0) + (right ?? 0);
}

function roundMoney(value: number): number {
  return Math.round(value * 10000) / 10000;
}
