import fs from "node:fs/promises";
import path from "node:path";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { clampCommandTimeout, execMutationCommand, readMutationPlan } from "./mutationCommand.js";
import { generateMutationReadinessAudit } from "./mutationReadinessAudit.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { MutationDryRunRecord, MutationExecutionRecord } from "./types.js";

export async function runMutationExecution(input: {
  project: string;
  vaultRoot: string;
  plan: string;
  confirmPlan: string;
  timeoutMs?: number;
}): Promise<{ jsonPath: string; markdownPath: string; record: MutationExecutionRecord }> {
  const project = slugifyProject(input.project);
  const plan = await readMutationPlan(input.vaultRoot, project, input.plan);
  if (input.confirmPlan !== plan.id) {
    throw new Error(`--confirm-plan must exactly match ${plan.id}.`);
  }
  const audit = await generateMutationReadinessAudit({ project, vaultRoot: input.vaultRoot });
  const auditCheck = audit.audit.checks.find((check) => check.planId === plan.id);
  if (!auditCheck || auditCheck.status !== "passed") {
    throw new Error(`Readiness plan ${plan.id} is not audit-passed.`);
  }
  const dryRun = await latestPassedDryRun(input.vaultRoot, project, plan.id);
  if (!dryRun) {
    throw new Error(`Readiness plan ${plan.id} has no passed mutation dry-run evidence.`);
  }

  const started = new Date();
  const timeoutMs = clampCommandTimeout(input.timeoutMs);
  const live = await execMutationCommand(plan.proposedLiveCommand, timeoutMs);
  const liveStatus = live.timedOut ? "timed_out" : live.exitCode === 0 ? "passed" : "failed";
  const hasPostVerification = Boolean(plan.postVerificationCommand?.trim());
  const postVerify =
    liveStatus === "passed" && hasPostVerification
      ? await execMutationCommand(plan.postVerificationCommand?.trim() ?? "", timeoutMs)
      : undefined;
  const postVerifyStatus = postVerify
    ? postVerify.timedOut
      ? "timed_out"
      : postVerify.exitCode === 0
        ? "passed"
        : "failed"
    : undefined;
  let status: MutationExecutionRecord["status"];
  if (liveStatus === "timed_out") {
    status = "timed_out";
  } else if (liveStatus === "failed") {
    status = "failed";
  } else if (!hasPostVerification) {
    status = "post_verify_skipped";
  } else if (postVerifyStatus === "timed_out") {
    status = "timed_out";
  } else {
    status = postVerifyStatus === "passed" ? "passed" : "post_verify_failed";
  }

  const record: MutationExecutionRecord = {
    schemaVersion: 1,
    id: `mutation-execution-${timestampFile(started)}`,
    project,
    planId: plan.id,
    target: plan.target,
    startedAt: started.toISOString(),
    finishedAt: new Date().toISOString(),
    status,
    liveCommand: plan.proposedLiveCommand,
    liveExitCode: live.exitCode,
    liveSignal: live.signal,
    liveBufferExceeded: live.bufferExceeded,
    liveStdout: live.stdout,
    liveStderr: live.stderr,
    postVerificationCommand: plan.postVerificationCommand ?? "",
    postVerificationExitCode: postVerify?.exitCode,
    postVerificationSignal: postVerify?.signal,
    postVerificationBufferExceeded: postVerify?.bufferExceeded,
    postVerificationStdout: postVerify?.stdout ?? "",
    postVerificationStderr: postVerify?.stderr ?? "",
    durationMs: live.durationMs + (postVerify?.durationMs ?? 0),
    auditRef: path.relative(input.vaultRoot, audit.jsonPath),
    dryRunRef: dryRun.id,
    rollback: plan.rollback,
    execute: true
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control/mutation-executions", `${record.id}.json`, record);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control/mutation-executions",
    `${record.id}.md`,
    renderRecord(record)
  );
  return { jsonPath, markdownPath, record };
}

async function latestPassedDryRun(vaultRoot: string, project: string, planId: string): Promise<MutationDryRunRecord | undefined> {
  const dir = path.join(projectDir(vaultRoot, project), "control", "mutation-dry-runs");
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
  const records = await Promise.all(
    names
      .filter((name) => name.endsWith(".json"))
      .sort()
      .map(async (name) => JSON.parse(await fs.readFile(path.join(dir, name), "utf8")) as MutationDryRunRecord)
  );
  return records.filter((record) => record.planId === planId && record.status === "passed").at(-1);
}

function renderRecord(record: MutationExecutionRecord): string {
  return [
    "# Mutation Execution",
    "",
    `Id: ${record.id}`,
    `Plan: ${record.planId}`,
    `Target: ${record.target}`,
    `Status: ${record.status}`,
    `Started: ${record.startedAt}`,
    `Finished: ${record.finishedAt}`,
    `Duration ms: ${record.durationMs}`,
    `Execute: ${record.execute}`,
    `Audit: ${record.auditRef}`,
    `Dry run: ${record.dryRunRef}`,
    "",
    "## Live Command",
    "",
    "```bash",
    record.liveCommand,
    "```",
    "",
    `Exit code: ${record.liveExitCode ?? "none"}`,
    "",
    "## Post Verification",
    "",
    "```bash",
    record.postVerificationCommand,
    "```",
    "",
    `Exit code: ${record.postVerificationExitCode ?? "none"}`,
    "",
    "## Rollback",
    "",
    record.rollback,
    ""
  ].join("\n");
}
