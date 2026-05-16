import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { projectDir, slugifyProject } from "./paths.js";
import type {
  ApprovalRecord,
  BehaviorCheckReport,
  ExecutionRun,
  InfraSnapshot,
  OpenScorpionActivityDraft,
  ReviewRecord
} from "./types.js";

type CheckStatus = BehaviorCheckReport["checks"][number]["status"];

export async function generateBehaviorCheckReport(input: {
  project: string;
  vaultRoot: string;
  approvedFixturePath?: string;
}): Promise<{ jsonPath: string; markdownPath: string; report: BehaviorCheckReport }> {
  const project = slugifyProject(input.project);
  const dir = projectDir(input.vaultRoot, project);
  const reviews = await readJsonl<ReviewRecord>(path.join(dir, "control", "reviews.jsonl"));
  const approvals = await readJsonFiles<ApprovalRecord>(path.join(dir, "control", "approvals"), isApprovalRecord);
  const executionRuns = await readJsonFiles<ExecutionRun>(path.join(dir, "execution"), isExecutionRun);
  const infraSnapshots = await readJsonFiles<InfraSnapshot>(path.join(dir, "infrastructure"), isInfraSnapshot);
  const activityDrafts = await readJsonFiles<OpenScorpionActivityDraft>(
    path.join(dir, "infrastructure"),
    isOpenScorpionDraft
  );
  const approvedFixture = input.approvedFixturePath ? await readApprovedFixture(input.approvedFixturePath) : undefined;

  const worktreeGuard = await worktreeGuardCheck(input.vaultRoot, dir);
  const checks: BehaviorCheckReport["checks"] = [
    approvedFixtureCheck(reviews, approvedFixture),
    executionGateCheck(executionRuns),
    approvalWorkflowCheck(approvals),
    infraReadOnlyCheck(infraSnapshots),
    openScorpionDraftCheck(activityDrafts),
    worktreeGuard
  ];
  const summary = {
    passed: checks.filter((check) => check.status === "passed").length,
    warnings: checks.filter((check) => check.status === "warning").length,
    failed: checks.filter((check) => check.status === "failed").length
  };
  const report: BehaviorCheckReport = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status: summary.failed > 0 ? "failed" : summary.warnings > 0 ? "warning" : "passed",
    summary,
    checks
  };

  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "evaluation", "behavior-checks.json", report);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "evaluation",
    "behavior-checks.md",
    renderReport(report)
  );
  return { jsonPath, markdownPath, report };
}

function approvedFixtureCheck(
  reviews: ReviewRecord[],
  fixture: { approved: boolean; evidence: string[] } | undefined
): BehaviorCheckReport["checks"][number] {
  const approvedReviews = reviews.filter((review) => review.status === "approved");
  const passed = fixture?.approved || approvedReviews.length > 0;
  return {
    id: "approved-fixture",
    label: "Approved review fixture",
    status: passed ? "passed" : "warning",
    evidence: [...approvedReviews.map((review) => review.id), ...(fixture?.evidence ?? [])],
    notes: passed
      ? "At least one approved review or approved fixture is present."
      : "No approved review or approved fixture is present yet."
  };
}

function executionGateCheck(executionRuns: ExecutionRun[]): BehaviorCheckReport["checks"][number] {
  if (executionRuns.length === 0) {
    return {
      id: "execution-mutation-gates",
      label: "Execution mutation gates",
      status: "warning",
      evidence: [],
      notes: "No execution run exists to inspect."
    };
  }

  const missing = executionRuns.filter(
    (run) => !run.gates.some((gate) => gate.toLowerCase().includes("human approval"))
  );
  return {
    id: "execution-mutation-gates",
    label: "Execution mutation gates",
    status: missing.length === 0 ? "passed" : "failed",
    evidence: executionRuns.map((run) => run.id),
    notes:
      missing.length === 0
        ? "Execution runs include explicit human approval gates before external mutation."
        : `${missing.length} execution run(s) lack an explicit human approval gate.`
  };
}

function approvalWorkflowCheck(approvals: ApprovalRecord[]): BehaviorCheckReport["checks"][number] {
  return {
    id: "approval-workflow-records",
    label: "Mutation approval workflow records",
    status: approvals.length > 0 ? "passed" : "warning",
    evidence: approvals.map((approval) => approval.id),
    notes:
      approvals.length > 0
        ? `${approvals.length} approval workflow record(s) are present.`
        : "No explicit approval request records exist yet for mutation-capable adapters."
  };
}

function infraReadOnlyCheck(snapshots: InfraSnapshot[]): BehaviorCheckReport["checks"][number] {
  const mutating = snapshots.filter((snapshot) => !["manual", "manifest", "live_read_only"].includes(snapshot.snapshotKind));
  return {
    id: "infra-read-only",
    label: "Infrastructure snapshots are read-only",
    status: mutating.length === 0 ? "passed" : "failed",
    evidence: snapshots.map((snapshot) => snapshot.sourcePath),
    notes:
      mutating.length === 0
        ? "Infrastructure evidence is limited to manual, manifest, or live_read_only snapshot kinds."
        : `${mutating.length} infrastructure snapshot(s) use an unsupported mode.`
  };
}

function openScorpionDraftCheck(drafts: OpenScorpionActivityDraft[]): BehaviorCheckReport["checks"][number] {
  const submitted = drafts.filter((draft) => draft.submit !== false);
  return {
    id: "governance-drafts-non-submitting",
    label: "Governance drafts do not submit",
    status: submitted.length === 0 ? "passed" : "failed",
    evidence: drafts.map((draft) => draft.title),
    notes:
      submitted.length === 0
        ? "OpenScorpion activity records are drafts with submit=false."
        : `${submitted.length} governance draft(s) are not marked submit=false.`
  };
}

async function worktreeGuardCheck(vaultRoot: string, dir: string): Promise<BehaviorCheckReport["checks"][number]> {
  const executionDir = path.join(dir, "execution");
  let guardFiles: string[] = [];
  try {
    guardFiles = (await fs.readdir(executionDir))
      .filter((name) => name.endsWith("-worktree-guard.json"))
      .map((name) => path.join(executionDir, name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  return {
    id: "worktree-guard-fixture",
    label: "Worktree guard fixture",
    status: guardFiles.length > 0 ? "passed" : "warning",
    evidence:
      guardFiles.length > 0
        ? guardFiles.map((filePath) => path.relative(vaultRoot, filePath))
        : [path.relative(vaultRoot, path.join(dir, "execution", "run-*-worktree-guard.json"))],
    notes:
      guardFiles.length > 0
        ? `${guardFiles.length} worktree guard record(s) are present.`
        : "Worktree guard is available as a behavior fixture; record it for each real execution run before applying worktrees."
  };
}

async function readApprovedFixture(filePath: string): Promise<{ approved: boolean; evidence: string[] }> {
  const sourcePath = path.resolve(filePath);
  const text = await fs.readFile(sourcePath, "utf8");
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const status = String(parsed.status ?? parsed.conclusion ?? "").toLowerCase();
    return {
      approved: status === "approved" || status === "passed" || parsed.approved === true,
      evidence: [sourcePath]
    };
  } catch {
    const lower = text.toLowerCase();
    const explicitApproval = /(^|\n)\s*(approved|lgtm)\s*($|\n)/.test(lower);
    const reviewerApproval = /(^|\n)\s*(review|reviewer|coderabbit|human)\s*:\s*(approved|lgtm)\b/.test(lower);
    const negativeApproval = /\bnot approved\b|\bhave not approved\b|\bdo not approve\b|\bcannot approve\b/.test(lower);
    return {
      approved: (explicitApproval || reviewerApproval) && !negativeApproval,
      evidence: [sourcePath]
    };
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
    const text = await fs.readFile(path.join(dir, name), "utf8");
    const value = JSON.parse(text) as unknown;
    if (predicate(value)) values.push(value);
  }
  return values;
}

function hasSchema(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isExecutionRun(value: unknown): value is ExecutionRun {
  return hasSchema(value) && value.schemaVersion === 1 && Array.isArray(value.taskIds);
}

function isApprovalRecord(value: unknown): value is ApprovalRecord {
  return hasSchema(value) && value.schemaVersion === 1 && typeof value.id === "string" && value.id.startsWith("approval-");
}

function isInfraSnapshot(value: unknown): value is InfraSnapshot {
  return hasSchema(value) && value.schemaVersion === 1 && "snapshotKind" in value;
}

function isOpenScorpionDraft(value: unknown): value is OpenScorpionActivityDraft {
  return hasSchema(value) && value.schemaVersion === 1 && "activityType" in value && "submit" in value;
}

function renderReport(report: BehaviorCheckReport): string {
  return [
    "# Behavior Checks",
    "",
    `Project: ${report.project}`,
    `Status: ${report.status}`,
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Passed: ${report.summary.passed}`,
    `- Warnings: ${report.summary.warnings}`,
    `- Failed: ${report.summary.failed}`,
    "",
    "## Checks",
    "",
    "| Id | Status | Notes |",
    "| --- | --- | --- |",
    ...report.checks.map((check) => `| ${check.id} | ${check.status} | ${check.notes} |`),
    ""
  ].join("\n");
}
