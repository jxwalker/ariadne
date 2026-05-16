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
    const status = git(run.repoPath, ["status", "--porcelain"]);
    checks.push({
      name: "working-tree-clean",
      status: status.trim() === "" ? "passed" : "failed",
      detail: status.trim() === "" ? "clean" : status.trim()
    });

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

      const branchExists = git(run.repoPath, ["branch", "--list", worktree.branch]).trim().length > 0;
      checks.push({
        name: `branch-${worktree.taskId}`,
        status: branchExists ? "failed" : "passed",
        detail: branchExists ? `${worktree.branch} already exists` : `${worktree.branch} is available`
      });
    }
  }

  const blocked = checks.some((check) => check.status === "failed");
  if (input.apply && !blocked && run.repoPath) {
    const baseRef = resolveBaseRef(run.repoPath);
    for (const worktree of run.worktrees) {
      git(run.repoPath, ["worktree", "add", "-b", worktree.branch, worktree.worktreePath, baseRef]);
    }
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
