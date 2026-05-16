import { exec } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateMutationReadinessAudit } from "./mutationReadinessAudit.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { MutationDryRunRecord, MutationReadinessPlan } from "./types.js";

export async function runMutationDryRun(input: {
  project: string;
  vaultRoot: string;
  plan: string;
  timeoutMs?: number;
}): Promise<{ jsonPath: string; markdownPath: string; record: MutationDryRunRecord }> {
  const project = slugifyProject(input.project);
  const plan = await readPlan(input.vaultRoot, project, input.plan);
  const audit = await generateMutationReadinessAudit({ project, vaultRoot: input.vaultRoot });
  const auditCheck = audit.audit.checks.find((check) => check.planId === plan.id);
  if (!auditCheck) {
    throw new Error(`Readiness plan ${plan.id} was not found in the mutation readiness audit.`);
  }
  if (auditCheck.status !== "passed") {
    throw new Error(`Readiness plan ${plan.id} is blocked: ${auditCheck.blockers.join("; ")}`);
  }

  const started = new Date();
  const startedMs = Date.now();
  const result = await execCommand(plan.dryRunCommand, clampTimeout(input.timeoutMs));
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
    durationMs: Date.now() - startedMs,
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

async function readPlan(vaultRoot: string, project: string, plan: string): Promise<MutationReadinessPlan> {
  const planPath = plan.endsWith(".json")
    ? path.resolve(plan)
    : path.join(projectDir(vaultRoot, project), "control", "mutation-readiness", `${plan}.json`);
  const record = JSON.parse(await fs.readFile(planPath, "utf8")) as MutationReadinessPlan;
  if (record.project !== project) {
    throw new Error(`Readiness plan ${record.id} belongs to ${record.project}, not ${project}.`);
  }
  return record;
}

function clampTimeout(timeoutMs?: number): number {
  if (timeoutMs === undefined) return 60_000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("--timeout-ms must be a positive number.");
  return Math.min(Math.max(Math.trunc(timeoutMs), 1_000), 600_000);
}

async function execCommand(command: string, timeoutMs: number): Promise<{
  stdout: string;
  stderr: string;
  exitCode?: number;
  signal?: string;
  timedOut: boolean;
}> {
  return new Promise((resolve) => {
    exec(command, { timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      const err = error as NodeJS.ErrnoException & { code?: number; signal?: string; killed?: boolean };
      resolve({
        stdout,
        stderr,
        exitCode: typeof err?.code === "number" ? err.code : error ? undefined : 0,
        signal: err?.signal,
        timedOut: Boolean(err?.killed)
      });
    });
  });
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
