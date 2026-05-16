import { exec } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { projectDir } from "./paths.js";
import type { MutationReadinessPlan } from "./types.js";

export interface MutationCommandResult {
  stdout: string;
  stderr: string;
  exitCode?: number;
  signal?: string;
  timedOut: boolean;
  bufferExceeded: boolean;
  durationMs: number;
}

export async function readMutationPlan(vaultRoot: string, project: string, plan: string): Promise<MutationReadinessPlan> {
  const planPath = plan.endsWith(".json")
    ? path.resolve(plan)
    : path.join(projectDir(vaultRoot, project), "control", "mutation-readiness", `${plan}.json`);
  const record = JSON.parse(await fs.readFile(planPath, "utf8")) as MutationReadinessPlan;
  if (record.project !== project) {
    throw new Error(`Readiness plan ${record.id} belongs to ${record.project}, not ${project}.`);
  }
  return record;
}

export function clampCommandTimeout(timeoutMs?: number): number {
  if (timeoutMs === undefined) return 60_000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("--timeout-ms must be a positive number.");
  return Math.min(Math.max(Math.trunc(timeoutMs), 1_000), 600_000);
}

export async function execMutationCommand(command: string, timeoutMs: number): Promise<MutationCommandResult> {
  const startedMs = Date.now();
  return new Promise((resolve) => {
    // Intentional shell execution: readiness plans are user-authored, project-scoped,
    // audit-gated, and timeout-bounded so operators can dry-run shell syntax such as pipes.
    exec(command, { timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      const err = error as NodeJS.ErrnoException & { code?: number | string; signal?: string; killed?: boolean };
      const bufferExceeded = err?.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" || /maxBuffer/i.test(error?.message ?? "");
      const timedOut = Boolean(err?.killed) && !bufferExceeded;
      resolve({
        stdout,
        stderr,
        exitCode: typeof err?.code === "number" ? err.code : error ? undefined : 0,
        signal: err?.signal,
        timedOut,
        bufferExceeded,
        durationMs: Date.now() - startedMs
      });
    });
  });
}
