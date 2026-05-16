import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { slugifyProject } from "./paths.js";
import type { ExecutionRun, WorktreeGuardReport } from "./types.js";

export async function guardWorktrees(input: {
  project: string;
  vaultRoot: string;
  runFile: string;
  apply: boolean;
}): Promise<{ jsonPath: string; markdownPath: string; report: WorktreeGuardReport }> {
  const project = slugifyProject(input.project);
  const run = JSON.parse(await fs.readFile(path.resolve(input.runFile), "utf8")) as ExecutionRun;
  const checks: WorktreeGuardReport["checks"] = [];

  if (!run.repoPath) {
    checks.push({ name: "repoPath", status: "failed", detail: "Execution run has no repository path." });
  } else {
    checks.push({ name: "repoPath", status: "passed", detail: run.repoPath });
    const statusResult = tryGit(run.repoPath, ["status", "--porcelain"]);
    if (statusResult.ok) {
      const status = statusResult.output;
      checks.push({
        name: "working-tree-clean",
        status: status.trim() === "" ? "passed" : "failed",
        detail: status.trim() === "" ? "clean" : status.trim()
      });
    } else {
      checks.push({
        name: "working-tree-clean",
        status: "failed",
        detail: statusResult.error
      });
    }

    for (const worktree of run.worktrees) {
      try {
        await fs.access(worktree.worktreePath);
        checks.push({
          name: `worktree-path-${worktree.taskId}`,
          status: "failed",
          detail: `${worktree.worktreePath} already exists`
        });
      } catch {
        checks.push({
          name: `worktree-path-${worktree.taskId}`,
          status: "passed",
          detail: `${worktree.worktreePath} is available`
        });
      }

      const branchResult = tryGit(run.repoPath, ["branch", "--list", worktree.branch]);
      const branchExists = branchResult.ok && branchResult.output.trim().length > 0;
      checks.push({
        name: `branch-${worktree.taskId}`,
        status: !branchResult.ok || branchExists ? "failed" : "passed",
        detail: !branchResult.ok
          ? branchResult.error
          : branchExists
            ? `${worktree.branch} already exists`
            : `${worktree.branch} is available`
      });
    }
  }

  let blocked = checks.some((check) => check.status === "failed");
  if (input.apply && !blocked && run.repoPath) {
    const baseRef = resolveBaseRef(run.repoPath);
    for (const worktree of run.worktrees) {
      const createResult = tryGit(run.repoPath, ["worktree", "add", "-b", worktree.branch, worktree.worktreePath, baseRef]);
      checks.push({
        name: `create-worktree-${worktree.taskId}`,
        status: createResult.ok ? "passed" : "failed",
        detail: createResult.ok ? `${worktree.worktreePath} created from ${baseRef}` : createResult.error
      });
    }
    blocked = checks.some((check) => check.status === "failed");
  }

  const report: WorktreeGuardReport = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    runId: run.id,
    apply: input.apply,
    status: blocked ? "blocked" : input.apply ? "created" : "ready",
    checks
  };

  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "execution", `${run.id}-worktree-guard.json`, report);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "execution",
    `${run.id}-worktree-guard.md`,
    renderGuard(report)
  );
  return { jsonPath, markdownPath, report };
}

function git(repoPath: string, args: string[]): string {
  return execFileSync("git", args, { cwd: repoPath, encoding: "utf8" });
}

function tryGit(repoPath: string, args: string[]): { ok: true; output: string } | { ok: false; error: string } {
  try {
    return { ok: true, output: git(repoPath, args) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `git ${args.join(" ")} failed in ${repoPath}: ${message}` };
  }
}

function resolveBaseRef(repoPath: string): string {
  try {
    const originHead = git(repoPath, ["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"]).trim();
    if (originHead.startsWith("origin/")) {
      return originHead.slice("origin/".length);
    }
  } catch {
    // Fall through to local default branch names.
  }

  for (const candidate of ["main", "master"]) {
    try {
      git(repoPath, ["rev-parse", "--verify", candidate]);
      return candidate;
    } catch {
      // Try the next conventional base branch.
    }
  }

  return "main";
}

function renderGuard(report: WorktreeGuardReport): string {
  return [
    `# Worktree Guard: ${report.runId}`,
    "",
    `Status: ${report.status}`,
    `Apply: ${report.apply ? "yes" : "no"}`,
    "",
    "## Checks",
    "",
    ...report.checks.map((check) => `- ${check.name}: ${check.status} - ${check.detail}`),
    ""
  ].join("\n");
}
