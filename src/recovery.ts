import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { collectConsoleData } from "./consoleData.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { RecoveryReport } from "./types.js";

export async function generateRecoveryReport(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; report: RecoveryReport }> {
  const project = slugifyProject(input.project);
  const data = await collectConsoleData(input.vaultRoot, project);
  const executionDir = path.join(projectDir(input.vaultRoot, project), "execution");
  const missingGates = data.readiness?.missing ?? [];
  const failedChecks = data.checks.filter((check) => check.status === "failed");
  const pendingReviews = data.reviews.filter(
    (review) => review.status === "pending" || review.status === "changes_requested" || review.status === "failed"
  );
  const incompleteRuns = data.executionRuns.filter((run) => run.status !== "complete");
  const guardStatus = await Promise.all(
    data.executionRuns.map(async (run) => ({
      run,
      path: path.join(executionDir, `${run.id}-worktree-guard.json`),
      exists: await exists(path.join(executionDir, `${run.id}-worktree-guard.json`))
    }))
  );
  const missingWorktreeGuards = guardStatus.filter((item) => !item.exists);
  const issues: RecoveryReport["issues"] = [
    ...incompleteRuns.map((run) => ({
      kind: "execution" as const,
      severity: "warning" as const,
      detail: `Execution run ${run.id} is ${run.status}.`,
      evidenceRef: `execution/${run.id}.json`
    })),
    ...missingWorktreeGuards.map(({ run }) => ({
      kind: "guard" as const,
      severity: "warning" as const,
      detail: `Execution run ${run.id} has no worktree guard report.`,
      evidenceRef: `execution/${run.id}.json`
    })),
    ...failedChecks.map((check) => ({
      kind: "check" as const,
      severity: "blocking" as const,
      detail: `Check ${check.name} failed.`,
      evidenceRef: check.evidence
    })),
    ...pendingReviews.map((review) => ({
      kind: "review" as const,
      severity: review.status === "changes_requested" ? ("blocking" as const) : ("warning" as const),
      detail: `Review ${review.source} is ${review.status}: ${review.summary}`,
      evidenceRef: review.evidence
    })),
    ...missingGates.map((gate) => ({
      kind: "gate" as const,
      severity: "blocking" as const,
      detail: gate,
      evidenceRef: data.artifacts.control
    }))
  ];
  const report: RecoveryReport = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status: issues.some((issue) => issue.severity === "blocking" || issue.severity === "warning")
      ? "attention_required"
      : "ready",
    summary: {
      executionRuns: data.executionRuns.length,
      incompleteRuns: incompleteRuns.length,
      missingWorktreeGuards: missingWorktreeGuards.length,
      failedChecks: failedChecks.length,
      pendingReviews: pendingReviews.length,
      missingGates: missingGates.length
    },
    resumes: data.executionRuns.map((run) => {
      const guard = guardStatus.find((item) => item.run.id === run.id);
      return {
        runId: run.id,
        runStatus: run.status,
        createdAt: run.createdAt,
        nextAction: nextAction(run.status, Boolean(guard?.exists), failedChecks.length, pendingReviews.length, missingGates.length),
        evidenceRefs: [
          `execution/${run.id}.json`,
          ...(guard?.exists ? [`execution/${run.id}-worktree-guard.json`] : []),
          ...(data.artifacts.control ? [data.artifacts.control] : [])
        ]
      };
    }),
    issues
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "recovery-report.json", report);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "control", "recovery-report.md", renderReport(report));
  return { jsonPath, markdownPath, report };
}

function nextAction(
  status: string,
  hasGuard: boolean,
  failedChecks: number,
  pendingReviews: number,
  missingGates: number
): string {
  if (!hasGuard) return "Run worktree-guard before resuming execution.";
  if (failedChecks > 0) return "Fix failed checks, rerun verification, then refresh control and recovery reports.";
  if (pendingReviews > 0) return "Resolve pending review feedback before marking the run complete.";
  if (missingGates > 0) return "Refresh or satisfy missing merge gates before continuing.";
  if (status === "complete") return "No resume action required.";
  return "Resume from the recorded execution run and keep artifacts append-only.";
}

function renderReport(report: RecoveryReport): string {
  return [
    "# Recovery Report",
    "",
    `Project: ${report.project}`,
    `Status: ${report.status}`,
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Execution runs: ${report.summary.executionRuns}`,
    `- Incomplete runs: ${report.summary.incompleteRuns}`,
    `- Missing worktree guards: ${report.summary.missingWorktreeGuards}`,
    `- Failed checks: ${report.summary.failedChecks}`,
    `- Pending reviews: ${report.summary.pendingReviews}`,
    `- Missing gates: ${report.summary.missingGates}`,
    "",
    "## Resume Actions",
    "",
    "| Run | Status | Next action |",
    "| --- | --- | --- |",
    ...report.resumes.map((resume) => `| ${resume.runId} | ${resume.runStatus} | ${escapeTable(resume.nextAction)} |`),
    "",
    "## Issues",
    "",
    "| Kind | Severity | Detail |",
    "| --- | --- | --- |",
    ...report.issues.map((issue) => `| ${issue.kind} | ${issue.severity} | ${escapeTable(issue.detail)} |`),
    ""
  ].join("\n");
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|");
}
