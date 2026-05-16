import path from "node:path";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { clampCommandTimeout, execMutationCommand, readMutationPlan } from "./mutationCommand.js";
import { generateMutationReadinessAudit } from "./mutationReadinessAudit.js";
import { slugifyProject } from "./paths.js";
import type { MutationDryRunRecord } from "./types.js";

export async function runMutationDryRun(input: {
  project: string;
  vaultRoot: string;
  plan: string;
  timeoutMs?: number;
}): Promise<{ jsonPath: string; markdownPath: string; record: MutationDryRunRecord }> {
  const project = slugifyProject(input.project);
  const plan = await readMutationPlan(input.vaultRoot, project, input.plan);
  const audit = await generateMutationReadinessAudit({ project, vaultRoot: input.vaultRoot });
  const auditCheck = audit.audit.checks.find((check) => check.planId === plan.id);
  if (!auditCheck) {
    throw new Error(`Readiness plan ${plan.id} was not found in the mutation readiness audit.`);
  }
  if (auditCheck.status !== "passed") {
    throw new Error(`Readiness plan ${plan.id} is blocked: ${auditCheck.blockers.join("; ")}`);
  }

  const started = new Date();
  const result = await execMutationCommand(plan.dryRunCommand, clampCommandTimeout(input.timeoutMs));
  const finished = new Date();
  const status = result.timedOut ? "timed_out" : result.exitCode === 0 ? "passed" : "failed";
  const record: MutationDryRunRecord = {
    schemaVersion: 1,
    id: `mutation-dry-run-${timestampFile(started)}`,
    project,
    planId: plan.id,
    target: plan.target,
    startedAt: started.toISOString(),
    finishedAt: finished.toISOString(),
    status,
    command: plan.dryRunCommand,
    exitCode: result.exitCode,
    signal: result.signal,
    bufferExceeded: result.bufferExceeded,
    durationMs: result.durationMs,
    stdout: result.stdout,
    stderr: result.stderr,
    auditRef: path.relative(input.vaultRoot, audit.jsonPath),
    execute: false
  };

  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control/mutation-dry-runs", `${record.id}.json`, record);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control/mutation-dry-runs",
    `${record.id}.md`,
    renderRecord(record)
  );
  return { jsonPath, markdownPath, record };
}

function renderRecord(record: MutationDryRunRecord): string {
  return [
    "# Mutation Dry Run",
    "",
    `Id: ${record.id}`,
    `Plan: ${record.planId}`,
    `Target: ${record.target}`,
    `Status: ${record.status}`,
    `Started: ${record.startedAt}`,
    `Finished: ${record.finishedAt}`,
    `Duration ms: ${record.durationMs}`,
    `Exit code: ${record.exitCode ?? "none"}`,
    `Signal: ${record.signal ?? "none"}`,
    `Execute: ${record.execute}`,
    `Audit: ${record.auditRef}`,
    "",
    "## Command",
    "",
    "```bash",
    record.command,
    "```",
    "",
    "## Stdout",
    "",
    "```text",
    record.stdout.trim() || "(empty)",
    "```",
    "",
    "## Stderr",
    "",
    "```text",
    record.stderr.trim() || "(empty)",
    "```",
    ""
  ].join("\n");
}
