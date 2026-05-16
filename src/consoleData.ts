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
  BenchmarkRun,
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
  Gsd2ProcessSnapshot,
  HealerProposalRecord,
  HermesCronProposal,
  HermesCronSnapshot,
  GithubSnapshot,
  GsdRoadmap,
  InfraRegistry,
  InfraSnapshot,
  LiveAdapterApprovalPack,
  LiveAdapterApprovalReview,
  LiveAdapterNextActionsReport,
  LiveAdapterReadinessReport,
  MemoryProposalRecord,
  MutationDryRunRecord,
  MutationExecutionRecord,
  MutationReadinessAudit,
  MutationReadinessPlan,
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
  const mutationReadinessAudit = await readProjectJson<MutationReadinessAudit>(
    vaultRoot,
    project,
    "control",
    "mutation-readiness-audit.json"
  );
  const liveAdapterReadiness = await readProjectJson<LiveAdapterReadinessReport>(
    vaultRoot,
    project,
    "control",
    "live-adapter-readiness.json"
  );
  const liveAdapterNextActions = await readProjectJson<LiveAdapterNextActionsReport>(
    vaultRoot,
    project,
    "control",
    "live-adapter-next-actions.json"
  );
  const liveAdapterApprovalPack = await readProjectJson<LiveAdapterApprovalPack>(
    vaultRoot,
    project,
    "control",
    "live-adapter-approval-pack.json"
  );
  const liveAdapterApprovalReviews = await readJsonFiles<LiveAdapterApprovalReview>(
    path.join(dir, "control", "live-adapter-approval-reviews"),
    isLiveAdapterApprovalReview
  );
  const recovery = await readProjectJson<RecoveryReport>(vaultRoot, project, "control", "recovery-report.json");
  const gbrainExport = await readProjectJson<GbrainExportBundle>(vaultRoot, project, "integrations/gbrain", "gbrain-export.json");
  const checks = await readJsonl<CheckRecord>(path.join(dir, "control", "check-history.jsonl"));
  const reviews = await readJsonl<ReviewRecord>(path.join(dir, "control", "reviews.jsonl"));
  const approvals = await readJsonFiles<ApprovalRecord>(path.join(dir, "control", "approvals"), isApprovalRecord);
  const mutationReadinessPlans = await readJsonFiles<MutationReadinessPlan>(
    path.join(dir, "control", "mutation-readiness"),
    isMutationReadinessPlan
  );
  const mutationDryRuns = await readJsonFiles<MutationDryRunRecord>(
    path.join(dir, "control", "mutation-dry-runs"),
    isMutationDryRun
  );
  const mutationDryRunsForConsole = mutationDryRuns.map(redactMutationDryRunForConsole);
  const mutationExecutions = await readJsonFiles<MutationExecutionRecord>(
    path.join(dir, "control", "mutation-executions"),
    isMutationExecution
  );
  const mutationExecutionsForConsole = mutationExecutions.map(redactMutationExecutionForConsole);
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
  const benchmarkRuns = await readJsonFiles<BenchmarkRun>(path.join(dir, "evaluation"), isBenchmarkRun);
  const infraSnapshots = await readJsonFiles<InfraSnapshot>(path.join(dir, "infrastructure"), isInfraSnapshot);
  const gsd2ProcessSnapshots = await readJsonFiles<Gsd2ProcessSnapshot>(path.join(dir, "gsd", "process"), isGsd2ProcessSnapshot);
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
  const hermesCronProposals = await readJsonFiles<HermesCronProposal>(
    path.join(dir, "coordination", "hermes"),
    isHermesCronProposal
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
      benchmarkRuns: benchmarkRuns.length,
      infraSnapshots: infraSnapshots.length,
      gsd2ProcessSnapshots: gsd2ProcessSnapshots.length,
      sleepRoutines: sleepRoutines.length,
      memoryProposals: memoryProposals.length,
      agentMail: agentMail.length,
      agentLeases: agentLeases.length,
      hermesCronSnapshots: hermesCronSnapshots.length,
      hermesCronProposals: hermesCronProposals.length,
      deploymentSnapshots: deploymentSnapshots.length,
      healerProposals: healerProposals.length,
      githubSnapshots: githubSnapshots.length,
      approvals: approvals.length,
      pendingApprovals: approvals.filter((approval) => approval.status === "requested").length,
      mutationReadinessPlans: mutationReadinessPlans.length,
      mutationDryRuns: mutationDryRuns.length,
      mutationExecutions: mutationExecutions.length,
      mutationReadinessAuditStatus: mutationReadinessAudit?.status,
      liveAdapterReadinessStatus: liveAdapterReadiness?.status,
      liveAdapterReady: liveAdapterReadiness?.summary.ready,
      liveAdapterBlocked: liveAdapterReadiness?.summary.blocked,
      liveAdapterActionItems: liveAdapterNextActions?.summary.actionItems,
      liveAdapterApprovalPackets: liveAdapterApprovalPack?.summary.packets,
      liveAdapterApprovalReviews: liveAdapterApprovalReviews.length,
      acceptedLiveAdapterApprovalReviews: liveAdapterApprovalReviews.filter((review) => review.status === "accepted").length,
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
    mutationReadinessPlans,
    mutationDryRuns: mutationDryRunsForConsole,
    mutationExecutions: mutationExecutionsForConsole,
    mutationReadinessAudit,
    liveAdapterReadiness,
    liveAdapterNextActions,
    liveAdapterApprovalPack,
    liveAdapterApprovalReviews,
    decisions,
    playwrightEvidence,
    healerProposals,
    evaluations,
    benchmarkRuns,
    evaluationTrends,
    consoleVisualChecks,
    consoleBrowserChecks,
    behaviorChecks,
    gsd2ProcessSnapshots,
    gbrain: {
      exportBundle: gbrainExport,
      reports: gbrainReports
    },
    coordination: {
      sleepRoutines,
      memoryProposals,
      agentMail,
      agentLeases,
      hermesCronSnapshots,
      hermesCronProposals
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
      benchmarkRuns: await existingPath(vaultRoot, path.join(dir, "evaluation")),
      artifactChecks: await existingPath(vaultRoot, path.join(dir, "evaluation", "artifact-checks.json")),
      evaluationTrends: await existingPath(vaultRoot, path.join(dir, "evaluation", "evaluation-trends.json")),
      usageReport: await existingPath(vaultRoot, path.join(dir, "evaluation", "usage-report.json")),
      behaviorChecks: await existingPath(vaultRoot, path.join(dir, "evaluation", "behavior-checks.json")),
      gsd2ProcessSnapshots: await existingPath(vaultRoot, path.join(dir, "gsd", "process")),
      gbrainExport: await existingPath(vaultRoot, path.join(dir, "integrations", "gbrain", "gbrain-export.json")),
      consoleVisualChecks: await existingPath(vaultRoot, path.join(dir, "console", "visual-checks.json")),
      consoleBrowserChecks: await existingPath(vaultRoot, path.join(dir, "console", "browser-checks.json")),
      githubSnapshots: await existingPath(vaultRoot, path.join(dir, "integrations", "github")),
      approvals: await existingPath(vaultRoot, path.join(dir, "control", "approvals")),
      mutationReadinessPlans: await existingPath(vaultRoot, path.join(dir, "control", "mutation-readiness")),
      mutationDryRuns: await existingPath(vaultRoot, path.join(dir, "control", "mutation-dry-runs")),
      mutationExecutions: await existingPath(vaultRoot, path.join(dir, "control", "mutation-executions")),
      mutationReadinessAudit: await existingPath(vaultRoot, path.join(dir, "control", "mutation-readiness-audit.json")),
      liveAdapterReadiness: await existingPath(vaultRoot, path.join(dir, "control", "live-adapter-readiness.json")),
      liveAdapterNextActions: await existingPath(vaultRoot, path.join(dir, "control", "live-adapter-next-actions.json")),
      liveAdapterApprovalPack: await existingPath(vaultRoot, path.join(dir, "control", "live-adapter-approval-pack.json")),
      liveAdapterApprovalReviews: await existingPath(vaultRoot, path.join(dir, "control", "live-adapter-approval-reviews")),
      recoveryReport: await existingPath(vaultRoot, path.join(dir, "control", "recovery-report.json")),
      extractionResults: await existingPath(vaultRoot, path.join(dir, "extractions")),
      healerProposals: await existingPath(vaultRoot, path.join(dir, "verification", "healer-proposals")),
      hermesCronSnapshots: await existingPath(vaultRoot, path.join(dir, "coordination", "hermes")),
      hermesCronProposals: await existingPath(vaultRoot, path.join(dir, "coordination", "hermes"))
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

function isBenchmarkRun(value: unknown): value is BenchmarkRun {
  if (!hasSchema(value)) return false;
  const summary = value.summary;
  const steps = value.steps;
  return (
    value.schemaVersion === 1 &&
    typeof value.id === "string" &&
    value.id.startsWith("benchmark-run-") &&
    (value.set === "smoke" || value.set === "realistic" || value.set === "stress") &&
    (value.status === "passed" || value.status === "failed") &&
    typeof value.generatedAt === "string" &&
    Array.isArray(value.targetProjects) &&
    value.targetProjects.every((item) => typeof item === "string") &&
    hasSchema(summary) &&
    typeof summary.steps === "number" &&
    typeof summary.passed === "number" &&
    typeof summary.failed === "number" &&
    typeof summary.missingRequiredArtifacts === "number" &&
    Array.isArray(steps) &&
    steps.every(
      (step) =>
        hasSchema(step) &&
        typeof step.id === "string" &&
        typeof step.project === "string" &&
        (step.status === "passed" || step.status === "failed") &&
        typeof step.detail === "string" &&
        Array.isArray(step.evidenceRefs) &&
        step.evidenceRefs.every((item) => typeof item === "string")
    )
  );
}

function isInfraSnapshot(value: unknown): value is InfraSnapshot {
  return hasSchema(value) && value.schemaVersion === 1 && "snapshotKind" in value && "summary" in value;
}

function isGsd2ProcessSnapshot(value: unknown): value is Gsd2ProcessSnapshot {
  return (
    hasSchema(value) &&
    value.schemaVersion === 1 &&
    value.mode === "read_only" &&
    typeof value.version === "string" &&
    Array.isArray(value.subcommands)
  );
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

function isLiveAdapterApprovalReview(value: unknown): value is LiveAdapterApprovalReview {
  return (
    hasSchema(value) &&
    value.schemaVersion === 1 &&
    typeof value.id === "string" &&
    value.id.startsWith("approval-review-") &&
    isNonGenericMutationTarget(value.target) &&
    (value.status === "accepted" || value.status === "needs_changes" || value.status === "rejected") &&
    value.mutationApproved === false
  );
}

function isMutationReadinessPlan(value: unknown): value is MutationReadinessPlan {
  return (
    hasSchema(value) &&
    value.schemaVersion === 1 &&
    typeof value.id === "string" &&
    value.id.startsWith("mutation-readiness-") &&
    typeof value.generatedAt === "string" &&
    isMutationTarget(value.target) &&
    (value.status === "approval_required" ||
      value.status === "approval_rejected" ||
      value.status === "ready_for_bounded_review") &&
    (value.risk === "low" || value.risk === "medium" || value.risk === "high") &&
    typeof value.scope === "string" &&
    optionalString(value.approvalRef) &&
    isApprovalStatus(value.approvalStatus) &&
    Array.isArray(value.authEvidenceRefs) &&
    value.authEvidenceRefs.every((item) => typeof item === "string") &&
    Array.isArray(value.evidenceRefs) &&
    value.evidenceRefs.every((item) => typeof item === "string") &&
    typeof value.dryRunCommand === "string" &&
    typeof value.proposedLiveCommand === "string" &&
    typeof value.rollback === "string" &&
    value.execute === false &&
    Array.isArray(value.requiredGates) &&
    value.requiredGates.every((item) => typeof item === "string")
  );
}

function isMutationDryRun(value: unknown): value is MutationDryRunRecord {
  return (
    hasSchema(value) &&
    value.schemaVersion === 1 &&
    typeof value.id === "string" &&
    value.id.startsWith("mutation-dry-run-") &&
    typeof value.planId === "string" &&
    (value.status === "passed" || value.status === "failed" || value.status === "timed_out") &&
    value.execute === false
  );
}

function redactMutationDryRunForConsole(record: MutationDryRunRecord): MutationDryRunRecord {
  return {
    ...record,
    stdout: `<REDACTED: ${Buffer.byteLength(record.stdout, "utf8")} bytes; see mutation dry-run artifact>`,
    stderr: `<REDACTED: ${Buffer.byteLength(record.stderr, "utf8")} bytes; see mutation dry-run artifact>`
  };
}

function isMutationExecution(value: unknown): value is MutationExecutionRecord {
  return (
    hasSchema(value) &&
    value.schemaVersion === 1 &&
    typeof value.id === "string" &&
    value.id.startsWith("mutation-execution-") &&
    typeof value.planId === "string" &&
    typeof value.liveCommand === "string" &&
    typeof value.liveStdout === "string" &&
    typeof value.liveStderr === "string" &&
    typeof value.postVerificationCommand === "string" &&
    typeof value.postVerificationStdout === "string" &&
    typeof value.postVerificationStderr === "string" &&
    (value.status === "passed" ||
      value.status === "failed" ||
      value.status === "timed_out" ||
      value.status === "post_verify_failed" ||
      value.status === "post_verify_skipped") &&
    value.execute === true
  );
}

function redactMutationExecutionForConsole(record: MutationExecutionRecord): MutationExecutionRecord {
  return {
    ...record,
    liveStdout: `<REDACTED: ${Buffer.byteLength(record.liveStdout, "utf8")} bytes; see mutation execution artifact>`,
    liveStderr: `<REDACTED: ${Buffer.byteLength(record.liveStderr, "utf8")} bytes; see mutation execution artifact>`,
    postVerificationStdout: `<REDACTED: ${Buffer.byteLength(record.postVerificationStdout, "utf8")} bytes; see mutation execution artifact>`,
    postVerificationStderr: `<REDACTED: ${Buffer.byteLength(record.postVerificationStderr, "utf8")} bytes; see mutation execution artifact>`
  };
}

function isApprovalStatus(value: unknown): value is ApprovalRecord["status"] | undefined {
  return (
    value === undefined ||
    value === "requested" ||
    value === "approved" ||
    value === "rejected" ||
    value === "expired"
  );
}

function isMutationTarget(value: unknown): value is MutationReadinessPlan["target"] {
  return (
    value === "github" ||
    value === "deployment" ||
    value === "hermes-cron" ||
    value === "openscorpion" ||
    value === "gsd2" ||
    value === "notebooklm" ||
    value === "generic"
  );
}

function isNonGenericMutationTarget(value: unknown): value is Exclude<MutationReadinessPlan["target"], "generic"> {
  return isMutationTarget(value) && value !== "generic";
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

function isHermesCronProposal(value: unknown): value is HermesCronProposal {
  return (
    hasSchema(value) &&
    value.schemaVersion === 1 &&
    value.mode === "proposal_only" &&
    typeof value.generatedAt === "string" &&
    isHermesCronProposalSummary(value.summary) &&
    Array.isArray(value.proposedActions) &&
    value.proposedActions.every(isHermesCronProposedAction)
  );
}

function isHermesCronProposalSummary(value: unknown): value is HermesCronProposal["summary"] {
  return (
    hasSchema(value) &&
    typeof value.snapshots === "number" &&
    typeof value.jobs === "number" &&
    typeof value.enabled === "number" &&
    typeof value.disabled === "number" &&
    typeof value.proposedActions === "number" &&
    Array.isArray(value.warnings) &&
    value.warnings.every((item) => typeof item === "string")
  );
}

function isHermesCronProposedAction(value: unknown): value is HermesCronProposal["proposedActions"][number] {
  return (
    hasSchema(value) &&
    typeof value.id === "string" &&
    (value.kind === "keep" || value.kind === "review" || value.kind === "create-candidate") &&
    typeof value.title === "string" &&
    typeof value.rationale === "string" &&
    optionalString(value.schedule) &&
    optionalString(value.sourceJob) &&
    Array.isArray(value.evidenceRefs) &&
    value.evidenceRefs.every((item) => typeof item === "string")
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
