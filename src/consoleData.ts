import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact } from "./artifacts.js";
import { projectDir, slugifyProject } from "./paths.js";
import { loadRecords } from "./vault.js";
import type {
  CheckRecord,
  ControlReport,
  ConsoleData,
  DecisionRecord,
  EvaluationPlan,
  EvaluationRun,
  ExecutionRun,
  GsdRoadmap,
  InfraRegistry,
  InfraSnapshot,
  PlaywrightEvidenceRecord,
  PrdDocument,
  ReviewRecord,
  SourceHygieneReport
} from "./types.js";

export async function generateConsoleData(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; data: ConsoleData }> {
  const project = slugifyProject(input.project);
  const data = await collectConsoleData(input.vaultRoot, project);
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "console", "console-data.json", data);
  return { jsonPath, data };
}

export async function collectConsoleData(vaultRoot: string, projectInput: string): Promise<ConsoleData> {
  const project = slugifyProject(projectInput);
  const dir = projectDir(vaultRoot, project);
  const records = await loadRecords(vaultRoot, project);
  const prd = await readProjectJson<PrdDocument>(vaultRoot, project, "requirements", "prd.json");
  const roadmap = await readProjectJson<GsdRoadmap>(vaultRoot, project, "gsd", "roadmap.json");
  const readiness = await readProjectJson<ControlReport>(vaultRoot, project, "control", "merge-readiness.json");
  const evaluationPlan = await readProjectJson<EvaluationPlan>(vaultRoot, project, "evaluation", "evaluation-plan.json");
  const registry = await readProjectJson<InfraRegistry>(vaultRoot, project, "infrastructure", "registry.json");
  const checks = await readJsonl<CheckRecord>(path.join(dir, "control", "check-history.jsonl"));
  const reviews = await readJsonl<ReviewRecord>(path.join(dir, "control", "reviews.jsonl"));
  const executionRuns = await readJsonFiles<ExecutionRun>(path.join(dir, "execution"), isExecutionRun);
  const decisions = await readJsonFiles<DecisionRecord>(path.join(dir, "decisions"), isDecisionRecord);
  const playwrightEvidence = await readJsonFiles<PlaywrightEvidenceRecord>(
    path.join(dir, "verification"),
    isPlaywrightEvidence
  );
  const evaluations = await readJsonFiles<EvaluationRun>(path.join(dir, "evaluation"), isEvaluationRun);
  const infraSnapshots = await readJsonFiles<InfraSnapshot>(path.join(dir, "infrastructure"), isInfraSnapshot);
  const sources = await Promise.all(
    records.map(async (record) => ({
      id: record.id,
      fileName: record.fileName,
      kind: record.kind,
      sensitivity: record.sensitivity,
      sha256: record.sha256,
      ingestedAt: record.ingestedAt,
      hasExtractedText: Boolean(record.extractedTextPath),
      hasHandoff: Boolean(record.handoffPath),
      hygieneStatus: record.hygieneReportPath
        ? (await readJsonFromPath<SourceHygieneReport>(record.hygieneReportPath))?.status
        : undefined
    }))
  );
  const tasks =
    roadmap?.milestones.flatMap((milestone) =>
      milestone.tasks.map((task) => ({
        ...task,
        milestoneId: milestone.id,
        milestoneTitle: milestone.title
      }))
    ) ?? [];

  const data: ConsoleData = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    projectDir: vaultRelative(vaultRoot, dir),
    summary: {
      sources: sources.length,
      requirements: prd?.requirements.length ?? 0,
      tasks: tasks.length,
      executionRuns: executionRuns.length,
      checks: checks.length,
      reviews: reviews.length,
      decisions: decisions.length,
      evaluations: evaluations.length,
      infraSnapshots: infraSnapshots.length,
      readinessStatus: readiness?.status,
      latestEvaluationScore: evaluations.at(-1)?.overallScore
    },
    sources,
    requirements: prd?.requirements ?? [],
    tasks,
    executionRuns,
    checks,
    reviews,
    decisions,
    playwrightEvidence,
    evaluations,
    infrastructure: {
      registry,
      snapshots: infraSnapshots
    },
    readiness,
    artifacts: {
      hotIndex: await existingPath(vaultRoot, path.join(dir, "HOT_INDEX.md")),
      prd: await existingPath(vaultRoot, path.join(dir, "requirements", "prd.json")),
      roadmap: await existingPath(vaultRoot, path.join(dir, "gsd", "roadmap.json")),
      control: await existingPath(vaultRoot, path.join(dir, "control", "merge-readiness.json")),
      evaluationPlan: evaluationPlan ? vaultRelative(vaultRoot, path.join(dir, "evaluation", "evaluation-plan.json")) : undefined
    }
  };
  return makePortable(data, vaultRoot);
}

async function readProjectJson<T>(
  vaultRoot: string,
  project: string,
  dirName: string,
  fileName: string
): Promise<T | undefined> {
  return readJsonFromPath<T>(path.join(projectDir(vaultRoot, project), dirName, fileName));
}

async function readJsonFromPath<T>(filePath: string): Promise<T | undefined> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function readJsonl<T>(filePath: string): Promise<T[]> {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as T);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function readJsonFiles<T>(dir: string, predicate: (value: unknown) => value is T): Promise<T[]> {
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const values: T[] = [];
  for (const name of names.filter((item) => item.endsWith(".json")).sort()) {
    const value = await readJsonFromPath<unknown>(path.join(dir, name));
    if (predicate(value)) {
      values.push(value);
    }
  }
  return values;
}

async function existingPath(vaultRoot: string, filePath: string): Promise<string | undefined> {
  try {
    await fs.access(filePath);
    return vaultRelative(vaultRoot, filePath);
  } catch {
    return undefined;
  }
}

function vaultRelative(vaultRoot: string, filePath: string): string {
  return path.relative(vaultRoot, filePath);
}

function makePortable<T>(value: T, vaultRoot: string): T {
  const workspaceRoot = path.dirname(vaultRoot);
  return replaceStrings(value, [
    [vaultRoot, "<VAULT_ROOT>"],
    [workspaceRoot, "<WORKSPACE_ROOT>"]
  ]) as T;
}

function replaceStrings(value: unknown, replacements: Array<[string, string]>): unknown {
  if (typeof value === "string") {
    return replacements.reduce((current, [needle, replacement]) => current.split(needle).join(replacement), value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceStrings(item, replacements));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, replaceStrings(item, replacements)])
    );
  }
  return value;
}

function hasSchema(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isExecutionRun(value: unknown): value is ExecutionRun {
  return hasSchema(value) && value.schemaVersion === 1 && typeof value.id === "string" && Array.isArray(value.taskIds);
}

function isDecisionRecord(value: unknown): value is DecisionRecord {
  return hasSchema(value) && value.schemaVersion === 1 && typeof value.id === "string" && "decision" in value;
}

function isPlaywrightEvidence(value: unknown): value is PlaywrightEvidenceRecord {
  return hasSchema(value) && value.schemaVersion === 1 && typeof value.id === "string" && value.id.startsWith("playwright-");
}

function isEvaluationRun(value: unknown): value is EvaluationRun {
  return (
    hasSchema(value) &&
    value.schemaVersion === 1 &&
    typeof value.id === "string" &&
    value.id.startsWith("evaluation-") &&
    typeof value.overallScore === "number"
  );
}

function isInfraSnapshot(value: unknown): value is InfraSnapshot {
  return hasSchema(value) && value.schemaVersion === 1 && "snapshotKind" in value && "summary" in value;
}
