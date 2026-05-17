import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { isLiveAdapterTarget, LIVE_ADAPTER_TARGETS, type LiveAdapterTarget } from "./liveAdapterTargets.js";
import { generateMutationReadinessAudit } from "./mutationReadinessAudit.js";
import { projectDir, slugifyProject } from "./paths.js";
import type {
  LiveAdapterApprovalReview,
  LiveAdapterReadinessReport,
  MutationDryRunRecord,
  MutationExecutionRecord,
  MutationReadinessAudit,
  MutationReadinessPlan
} from "./types.js";

const EXECUTE_COMMANDS: Record<LiveAdapterTarget, string> = {
  github: "github-mutation-execute",
  deployment: "deployment-mutation-execute",
  "hermes-cron": "hermes-cron-mutation-execute",
  openscorpion: "openscorpion-mutation-execute",
  gsd2: "gsd2-mutation-execute",
  notebooklm: "notebooklm-mutation-execute"
};

const TARGETS: Array<{ target: LiveAdapterTarget; executeCommand: string }> = LIVE_ADAPTER_TARGETS.map((target) => ({
  target,
  executeCommand: EXECUTE_COMMANDS[target]
}));

export async function generateLiveAdapterReadiness(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; report: LiveAdapterReadinessReport }> {
  const project = slugifyProject(input.project);
  const audit = await generateMutationReadinessAudit({ project, vaultRoot: input.vaultRoot });
  const dryRuns = await readRecords<MutationDryRunRecord>(
    input.vaultRoot,
    project,
    path.join("control", "mutation-dry-runs"),
    isMutationDryRunRecord
  );
  const executions = await readRecords<MutationExecutionRecord>(
    input.vaultRoot,
    project,
    path.join("control", "mutation-executions"),
    isMutationExecutionRecord
  );
  const approvalReviews = await readRecords<LiveAdapterApprovalReview>(
    input.vaultRoot,
    project,
    path.join("control", "live-adapter-approval-reviews"),
    isLiveAdapterApprovalReview
  );

  const targets = TARGETS.map(({ target, executeCommand }) =>
    targetReadiness(target, executeCommand, audit.audit, dryRuns, executions, approvalReviews)
  );
  const summary = {
    targets: targets.length,
    ready: targets.filter((item) => item.status === "ready_for_adapter").length,
    blocked: targets.filter((item) => item.status === "blocked").length,
    passedPlans: targets.reduce((sum, item) => sum + item.passedPlanCount, 0),
    passedDryRuns: targets.reduce((sum, item) => sum + item.passedDryRunCount, 0),
    passedExecutions: targets.reduce((sum, item) => sum + item.passedExecutionCount, 0),
    acceptedApprovalReviews: targets.reduce((sum, item) => sum + item.acceptedApprovalReviewCount, 0)
  };
  const report: LiveAdapterReadinessReport = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status: summary.blocked === 0 ? "ready" : "blocked",
    summary,
    targets
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "live-adapter-readiness.json", report);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control",
    "live-adapter-readiness.md",
    renderReport(report)
  );
  return { jsonPath, markdownPath, report };
}

function targetReadiness(
  target: LiveAdapterTarget,
  executeCommand: string,
  audit: MutationReadinessAudit,
  dryRuns: MutationDryRunRecord[],
  executions: MutationExecutionRecord[],
  approvalReviews: LiveAdapterApprovalReview[]
): LiveAdapterReadinessReport["targets"][number] {
  const checks = audit.checks.filter((check) => check.target === target);
  const passedChecks = checks.filter((check) => check.status === "passed");
  const passedPlanIds = new Set(passedChecks.map((check) => check.planId));
  const passedDryRuns = dryRuns.filter((record) => record.target === target && record.status === "passed" && passedPlanIds.has(record.planId));
  const passedDryRunPlanIds = new Set(passedDryRuns.map((record) => record.planId));
  const passedExecutions = executions.filter(
    (record) => record.target === target && record.status === "passed" && passedDryRunPlanIds.has(record.planId)
  );
  const targetApprovalReviews = approvalReviews.filter((record) => record.target === target);
  const acceptedApprovalReviews = targetApprovalReviews.filter((record) => record.status === "accepted");
  const latestReadyPlanId = Array.from(passedPlanIds).sort().at(-1);
  const latestAcceptedApprovalReviewId = acceptedApprovalReviews.map((record) => record.id).sort().at(-1);
  const blockers: string[] = [];
  if (acceptedApprovalReviews.length === 0) {
    blockers.push("no accepted operator review exists for live-adapter approval packet");
  }
  if (checks.length === 0) {
    blockers.push("no target-specific readiness plan exists");
  }
  if (passedChecks.length === 0) {
    blockers.push("no readiness plan passes audit");
  }
  if (passedDryRuns.length === 0) {
    blockers.push("no passed dry-run evidence exists for an audit-passed plan");
  }
  if (passedExecutions.length === 0) {
    blockers.push("no passed target-guarded execution evidence exists");
  }

  return {
    target,
    status: blockers.length === 0 ? "ready_for_adapter" : "blocked",
    planCount: checks.length,
    passedPlanCount: passedChecks.length,
    passedDryRunCount: passedDryRuns.length,
    passedExecutionCount: passedExecutions.length,
    approvalReviewCount: targetApprovalReviews.length,
    acceptedApprovalReviewCount: acceptedApprovalReviews.length,
    latestReadyPlanId,
    latestAcceptedApprovalReviewId,
    executeCommand,
    blockers,
    evidenceRefs: [
      "control/mutation-readiness-audit.json",
      ...passedChecks.map((check) => `control/mutation-readiness/${check.planId}.json`),
      ...passedDryRuns.map((record) => `control/mutation-dry-runs/${record.id}.json`),
      ...passedExecutions.map((record) => `control/mutation-executions/${record.id}.json`),
      ...acceptedApprovalReviews.map((record) => `control/live-adapter-approval-reviews/${record.id}.json`)
    ]
  };
}

async function readRecords<T>(
  vaultRoot: string,
  project: string,
  relativeDir: string,
  predicate: (value: unknown) => value is T
): Promise<T[]> {
  const dir = path.join(projectDir(vaultRoot, project), relativeDir);
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const records: T[] = [];
  for (const name of names.filter((item) => item.endsWith(".json")).sort()) {
    const value = JSON.parse(await fs.readFile(path.join(dir, name), "utf8")) as unknown;
    if (predicate(value)) records.push(value);
  }
  return records;
}

function isMutationDryRunRecord(value: unknown): value is MutationDryRunRecord {
  return isRecord(value) && value.schemaVersion === 1 && value.execute === false && typeof value.planId === "string";
}

function isMutationExecutionRecord(value: unknown): value is MutationExecutionRecord {
  return isRecord(value) && value.schemaVersion === 1 && value.execute === true && typeof value.planId === "string";
}

function isLiveAdapterApprovalReview(value: unknown): value is LiveAdapterApprovalReview {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    typeof value.id === "string" &&
    value.id.startsWith("approval-review-") &&
    isLiveAdapterTarget(value.target) &&
    (value.status === "accepted" || value.status === "needs_changes" || value.status === "rejected") &&
    typeof value.reviewedBy === "string" &&
    value.reviewedBy.trim().length > 0 &&
    typeof value.packetRef === "string" &&
    Array.isArray(value.evidenceRefs) &&
    value.evidenceRefs.every((item) => typeof item === "string") &&
    value.mutationApproved === false
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function renderReport(report: LiveAdapterReadinessReport): string {
  return [
    "# Live Adapter Readiness",
    "",
    `Project: ${report.project}`,
    `Status: ${report.status}`,
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Targets: ${report.summary.targets}`,
    `- Ready: ${report.summary.ready}`,
    `- Blocked: ${report.summary.blocked}`,
    `- Passed plans: ${report.summary.passedPlans}`,
    `- Passed dry-runs: ${report.summary.passedDryRuns}`,
    `- Passed executions: ${report.summary.passedExecutions}`,
    `- Accepted approval reviews: ${report.summary.acceptedApprovalReviews}`,
    "",
    "## Targets",
    "",
    "| Target | Status | Reviews | Plans | Dry-runs | Executions | Execute command | Blockers |",
    "| --- | --- | ---: | ---: | ---: | ---: | --- | --- |",
    ...report.targets.map(
      (target) =>
        `| ${target.target} | ${target.status} | ${target.acceptedApprovalReviewCount}/${target.approvalReviewCount} | ${target.passedPlanCount}/${target.planCount} | ${target.passedDryRunCount} | ${target.passedExecutionCount} | ${target.executeCommand} | ${inlineList(target.blockers)} |`
    ),
    ""
  ].join("\n");
}

function inlineList(items: string[]): string {
  return items.length > 0 ? items.join("<br>") : "none";
}
