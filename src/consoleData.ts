import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact } from "./artifacts.js";
import { projectDir, slugifyProject } from "./paths.js";
import { loadRecords } from "./vault.js";
import type {
  CheckRecord,
  AgentLeaseRecord,
  AgentMailRecord,
  ApprovalRecord,
  BehaviorCheckReport,
  ConsoleVisualCheckReport,
  ControlReport,
  ConsoleData,
  ConsoleBrowserCheckReport,
  DecisionRecord,
  DeploymentSnapshot,
  EvaluationPlan,
  EvaluationRun,
  EvaluationTrendReport,
  ExecutionRun,
  ExtractionResultRecord,
  GbrainExportBundle,
  GbrainReportImport,
  HealerProposalRecord,
  HermesCronSnapshot,
  GithubSnapshot,
  GsdRoadmap,
  InfraRegistry,
  InfraSnapshot,
  MemoryProposalRecord,
  PlaywrightEvidenceRecord,
  PrdDocument,
  RecoveryReport,
  ReviewRecord,
  SleepRoutineRecord,
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
  const evaluationTrends = await readProjectJson<EvaluationTrendReport>(vaultRoot, project, "evaluation", "evaluation-trends.json");
  const registry = await readProjectJson<InfraRegistry>(vaultRoot, project, "infrastructure", "registry.json");
  const consoleVisualChecks = await readProjectJson<ConsoleVisualCheckReport>(
    vaultRoot,
    project,
    "console",
    "visual-checks.json"
  );
  const consoleBrowserChecks = await readProjectJson<ConsoleBrowserCheckReport>(
    vaultRoot,
    project,
    "console",
    "browser-checks.json"
  );
  const behaviorChecks = await readProjectJson<BehaviorCheckReport>(vaultRoot, project, "evaluation", "behavior-checks.json");
  const recovery = await readProjectJson<RecoveryReport>(vaultRoot, project, "control", "recovery-report.json");
  const gbrainExport = await readProjectJson<GbrainExportBundle>(vaultRoot, project, "integrations/gbrain", "gbrain-export.json");
  const checks = await readJsonl<CheckRecord>(path.join(dir, "control", "check-history.jsonl"));
  const reviews = await readJsonl<ReviewRecord>(path.join(dir, "control", "reviews.jsonl"));
  const approvals = await readJsonFiles<ApprovalRecord>(path.join(dir, "control", "approvals"), isApprovalRecord);
  const extractionResults = await readJsonFiles<ExtractionResultRecord>(path.join(dir, "extractions"), isExtractionResult);
  const executionRuns = await readJsonFiles<ExecutionRun>(path.join(dir, "execution"), isExecutionRun);
  const decisions = await readJsonFiles<DecisionRecord>(path.join(dir, "decisions"), isDecisionRecord);
  const playwrightEvidence = await readJsonFiles<PlaywrightEvidenceRecord>(
    path.join(dir, "verification"),
    isPlaywrightEvidence
  );
  const healerProposals = await readJsonFiles<HealerProposalRecord>(
    path.join(dir, "verification", "healer-proposals"),
    isHealerProposal
  );
  const evaluations = await readJsonFiles<EvaluationRun>(path.join(dir, "evaluation"), isEvaluationRun);
  const infraSnapshots = await readJsonFiles<InfraSnapshot>(path.join(dir, "infrastructure"), isInfraSnapshot);
  const gbrainReports = await readJsonFiles<GbrainReportImport>(path.join(dir, "integrations", "gbrain"), isGbrainReport);
  const githubSnapshots = await readJsonFiles<GithubSnapshot>(path.join(dir, "integrations", "github"), isGithubSnapshot);
  const sleepRoutines = await readJsonFiles<SleepRoutineRecord>(path.join(dir, "coordination"), isSleepRoutine);
  const memoryProposals = await readJsonFiles<MemoryProposalRecord>(path.join(dir, "coordination"), isMemoryProposal);
  const agentMail = await readJsonFiles<AgentMailRecord>(path.join(dir, "coordination", "mail"), isAgentMail);
  const agentLeases = await readJsonFiles<AgentLeaseRecord>(path.join(dir, "coordination", "leases"), isAgentLease);
  const hermesCronSnapshots = await readJsonFiles<HermesCronSnapshot>(
    path.join(dir, "coordination", "hermes"),
    isHermesCronSnapshot
  );
  const deploymentSnapshots = await readJsonFiles<DeploymentSnapshot>(path.join(dir, "deployment"), isDeploymentSnapshot);
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
      extractionResults: extractionResults.length,
      requirements: prd?.requirements.length ?? 0,
      tasks: tasks.length,
      executionRuns: executionRuns.length,
      checks: checks.length,
      reviews: reviews.length,
      decisions: decisions.length,
      evaluations: evaluations.length,
      infraSnapshots: infraSnapshots.length,
      sleepRoutines: sleepRoutines.length,
      memoryProposals: memoryProposals.length,
      agentMail: agentMail.length,
      agentLeases: agentLeases.length,
      hermesCronSnapshots: hermesCronSnapshots.length,
      deploymentSnapshots: deploymentSnapshots.length,
      healerProposals: healerProposals.length,
      githubSnapshots: githubSnapshots.length,
      approvals: approvals.length,
      pendingApprovals: approvals.filter((approval) => approval.status === "requested").length,
      recoveryIssues: recovery?.issues.length ?? 0,
      consoleBrowserChecks: consoleBrowserChecks?.status,
      readinessStatus: readiness?.status,
      latestEvaluationScore: evaluations.at(-1)?.overallScore,
      evaluationTrendStatus: evaluationTrends?.status
    },
    sources,
    extractionResults,
    requirements: prd?.requirements ?? [],
    tasks,
    executionRuns,
    checks,
    reviews,
    approvals,
    decisions,
    playwrightEvidence,
    healerProposals,
    evaluations,
    evaluationTrends,
    consoleVisualChecks,
    consoleBrowserChecks,
    behaviorChecks,
    gbrain: {
      exportBundle: gbrainExport,
      reports: gbrainReports
    },
    coordination: {
      sleepRoutines,
      memoryProposals,
      agentMail,
      agentLeases,
      hermesCronSnapshots
    },
    infrastructure: {
      registry,
      snapshots: infraSnapshots
    },
    deployment: {
      snapshots: deploymentSnapshots
    },
    github: {
      snapshots: githubSnapshots
    },
    recovery,
    readiness,
    artifacts: {
      hotIndex: await existingPath(vaultRoot, path.join(dir, "HOT_INDEX.md")),
      prd: await existingPath(vaultRoot, path.join(dir, "requirements", "prd.json")),
      roadmap: await existingPath(vaultRoot, path.join(dir, "gsd", "roadmap.json")),
      control: await existingPath(vaultRoot, path.join(dir, "control", "merge-readiness.json")),
      evaluationPlan: evaluationPlan ? vaultRelative(vaultRoot, path.join(dir, "evaluation", "evaluation-plan.json")) : undefined,
      artifactChecks: await existingPath(vaultRoot, path.join(dir, "evaluation", "artifact-checks.json")),
      evaluationTrends: await existingPath(vaultRoot, path.join(dir, "evaluation", "evaluation-trends.json")),
      usageReport: await existingPath(vaultRoot, path.join(dir, "evaluation", "usage-report.json")),
      behaviorChecks: await existingPath(vaultRoot, path.join(dir, "evaluation", "behavior-checks.json")),
      gbrainExport: await existingPath(vaultRoot, path.join(dir, "integrations", "gbrain", "gbrain-export.json")),
      consoleVisualChecks: await existingPath(vaultRoot, path.join(dir, "console", "visual-checks.json")),
      consoleBrowserChecks: await existingPath(vaultRoot, path.join(dir, "console", "browser-checks.json")),
      githubSnapshots: await existingPath(vaultRoot, path.join(dir, "integrations", "github")),
      approvals: await existingPath(vaultRoot, path.join(dir, "control", "approvals")),
      recoveryReport: await existingPath(vaultRoot, path.join(dir, "control", "recovery-report.json")),
      extractionResults: await existingPath(vaultRoot, path.join(dir, "extractions")),
      healerProposals: await existingPath(vaultRoot, path.join(dir, "verification", "healer-proposals")),
      hermesCronSnapshots: await existingPath(vaultRoot, path.join(dir, "coordination", "hermes"))
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

function isExtractionResult(value: unknown): value is ExtractionResultRecord {
  return hasSchema(value) && value.schemaVersion === 1 && typeof value.id === "string" && value.id.startsWith("extraction-");
}

function isDecisionRecord(value: unknown): value is DecisionRecord {
  return hasSchema(value) && value.schemaVersion === 1 && typeof value.id === "string" && "decision" in value;
}

function isPlaywrightEvidence(value: unknown): value is PlaywrightEvidenceRecord {
  return hasSchema(value) && value.schemaVersion === 1 && typeof value.id === "string" && value.id.startsWith("playwright-");
}

function isHealerProposal(value: unknown): value is HealerProposalRecord {
  return hasSchema(value) && value.schemaVersion === 1 && typeof value.id === "string" && value.id.startsWith("healer-");
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

function isGbrainReport(value: unknown): value is GbrainReportImport {
  return hasSchema(value) && value.schemaVersion === 1 && "query" in value && "resultCount" in value;
}

function isGithubSnapshot(value: unknown): value is GithubSnapshot {
  return hasSchema(value) && value.schemaVersion === 1 && value.mode === "read_only" && "pullRequests" in value;
}

function isApprovalRecord(value: unknown): value is ApprovalRecord {
  return hasSchema(value) && value.schemaVersion === 1 && typeof value.id === "string" && value.id.startsWith("approval-");
}

function isSleepRoutine(value: unknown): value is SleepRoutineRecord {
  return hasSchema(value) && value.schemaVersion === 1 && typeof value.id === "string" && value.id.startsWith("sleep-");
}

function isMemoryProposal(value: unknown): value is MemoryProposalRecord {
  return hasSchema(value) && value.schemaVersion === 1 && typeof value.id === "string" && value.id.startsWith("memory-");
}

function isAgentMail(value: unknown): value is AgentMailRecord {
  return hasSchema(value) && value.schemaVersion === 1 && typeof value.id === "string" && value.id.startsWith("mail-");
}

function isAgentLease(value: unknown): value is AgentLeaseRecord {
  return hasSchema(value) && value.schemaVersion === 1 && typeof value.id === "string" && value.id.startsWith("lease-");
}

function isHermesCronSnapshot(value: unknown): value is HermesCronSnapshot {
  if (!hasSchema(value) || value.schemaVersion !== 1 || value.mode !== "read_only") {
    return false;
  }
  const summary = value.summary;
  const jobs = value.jobs;
  return (
    typeof value.importedAt === "string" &&
    isHermesCronSummary(summary) &&
    Array.isArray(jobs) &&
    jobs.every(isHermesCronJob)
  );
}

function isDeploymentSnapshot(value: unknown): value is DeploymentSnapshot {
  return hasSchema(value) && value.schemaVersion === 1 && value.mode === "read_only" && "system" in value;
}

function isHermesCronSummary(value: unknown): value is HermesCronSnapshot["summary"] {
  return (
    hasSchema(value) &&
    typeof value.jobs === "number" &&
    typeof value.enabled === "number" &&
    typeof value.disabled === "number" &&
    Array.isArray(value.schedules) &&
    value.schedules.every((item) => typeof item === "string") &&
    Array.isArray(value.nextRuns) &&
    value.nextRuns.every((item) => typeof item === "string") &&
    Array.isArray(value.warnings) &&
    value.warnings.every((item) => typeof item === "string")
  );
}

function isHermesCronJob(value: unknown): value is HermesCronSnapshot["jobs"][number] {
  return (
    hasSchema(value) &&
    optionalString(value.id) &&
    typeof value.name === "string" &&
    optionalString(value.schedule) &&
    optionalBoolean(value.enabled) &&
    optionalString(value.status) &&
    optionalString(value.nextRun) &&
    optionalString(value.lastRun) &&
    optionalString(value.intent)
  );
}

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function optionalBoolean(value: unknown): boolean {
  return value === undefined || typeof value === "boolean";
}
