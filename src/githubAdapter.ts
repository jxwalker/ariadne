import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { slugifyProject } from "./paths.js";
import type { GithubSnapshot } from "./types.js";

const execFileAsync = promisify(execFile);

const PR_FIELDS = [
  "number",
  "title",
  "state",
  "url",
  "baseRefName",
  "headRefName",
  "isDraft",
  "mergeStateStatus",
  "reviewDecision",
  "createdAt",
  "updatedAt",
  "mergedAt",
  "statusCheckRollup"
].join(",");

export async function importGithubSnapshot(input: {
  project: string;
  vaultRoot: string;
  sourcePath: string;
  repository?: string;
}): Promise<{ jsonPath: string; markdownPath: string; snapshot: GithubSnapshot }> {
  const sourcePath = path.resolve(input.sourcePath);
  const raw = JSON.parse(await fs.readFile(sourcePath, "utf8")) as unknown;
  return writeSnapshot({
    project: input.project,
    vaultRoot: input.vaultRoot,
    source: "manual_import",
    sourcePath,
    repository: input.repository,
    raw
  });
}

export async function collectGithubSnapshot(input: {
  project: string;
  vaultRoot: string;
  repository: string;
  pullRequest?: number;
  limit?: number;
}): Promise<{ jsonPath: string; markdownPath: string; snapshot: GithubSnapshot }> {
  const args = input.pullRequest
    ? ["pr", "view", String(input.pullRequest), "--repo", input.repository, "--json", PR_FIELDS]
    : [
        "pr",
        "list",
        "--repo",
        input.repository,
        "--state",
        "all",
        "--limit",
        String(input.limit ?? 20),
        "--json",
        PR_FIELDS
      ];
  const { stdout } = await execFileAsync("gh", args, { maxBuffer: 10 * 1024 * 1024 });
  const raw = JSON.parse(stdout) as unknown;
  return writeSnapshot({
    project: input.project,
    vaultRoot: input.vaultRoot,
    source: "gh_cli",
    repository: input.repository,
    raw
  });
}

async function writeSnapshot(input: {
  project: string;
  vaultRoot: string;
  source: GithubSnapshot["source"];
  sourcePath?: string;
  repository?: string;
  raw: unknown;
}): Promise<{ jsonPath: string; markdownPath: string; snapshot: GithubSnapshot }> {
  const project = slugifyProject(input.project);
  const importedAt = new Date();
  const pullRequests = normalisePullRequests(input.raw);
  const snapshot: GithubSnapshot = {
    schemaVersion: 1,
    project,
    importedAt: importedAt.toISOString(),
    mode: "read_only",
    source: input.source,
    sourcePath: input.sourcePath ? `<EXTERNAL_SOURCE>/${path.basename(input.sourcePath)}` : undefined,
    repository: input.repository ?? repositoryFromRaw(input.raw),
    summary: summarisePullRequests(pullRequests),
    pullRequests,
    raw: input.raw
  };
  const name = `github-snapshot-${timestampFile(importedAt)}`;
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "integrations/github", `${name}.json`, snapshot);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "integrations/github",
    `${name}.md`,
    renderSnapshot(snapshot)
  );
  return { jsonPath, markdownPath, snapshot };
}

function normalisePullRequests(raw: unknown): GithubSnapshot["pullRequests"] {
  const values = Array.isArray(raw) ? raw : [raw];
  return values.filter(isObject).map((entry, index) => {
    const checks = normaliseChecks(entry.statusCheckRollup);
    return {
      number: numberValue(entry.number) ?? index + 1,
      title: stringValue(entry.title) ?? `Pull request ${index + 1}`,
      state: stringValue(entry.state) ?? "UNKNOWN",
      url: stringValue(entry.url),
      baseRefName: stringValue(entry.baseRefName),
      headRefName: stringValue(entry.headRefName),
      isDraft: booleanValue(entry.isDraft),
      mergeStateStatus: stringValue(entry.mergeStateStatus),
      reviewDecision: stringValue(entry.reviewDecision),
      createdAt: stringValue(entry.createdAt),
      updatedAt: stringValue(entry.updatedAt),
      mergedAt: stringValue(entry.mergedAt),
      checks
    };
  });
}

function normaliseChecks(raw: unknown): GithubSnapshot["pullRequests"][number]["checks"] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isObject).map((check, index) => {
    const rawStatus = stringValue(check.state) ?? stringValue(check.status) ?? stringValue(check.conclusion);
    const conclusion = stringValue(check.conclusion);
    return {
      name: stringValue(check.context) ?? stringValue(check.name) ?? stringValue(check.workflowName) ?? `check-${index + 1}`,
      status: checkStatus(rawStatus, conclusion),
      conclusion,
      detailsUrl: stringValue(check.targetUrl) ?? stringValue(check.detailsUrl) ?? stringValue(check.url),
      rawStatus
    };
  });
}

function checkStatus(
  rawStatus: string | undefined,
  conclusion: string | undefined
): GithubSnapshot["pullRequests"][number]["checks"][number]["status"] {
  const status = rawStatus?.toLowerCase();
  if (status === "success" || status === "passed") return "passed";
  if (status === "failure" || status === "failed" || status === "error" || status === "action_required") return "failed";
  if (status === "pending" || status === "queued" || status === "in_progress" || status === "waiting" || status === "requested") {
    return "pending";
  }
  if (status === "skipped" || status === "neutral") return "skipped";
  if (status === "completed") return completedConclusionStatus(conclusion);
  return "unknown";
}

function completedConclusionStatus(conclusion: string | undefined): GithubSnapshot["pullRequests"][number]["checks"][number]["status"] {
  const value = conclusion?.toLowerCase();
  if (value === "success" || value === "passed") return "passed";
  if (value === "failure" || value === "failed" || value === "error" || value === "timed_out" || value === "cancelled") {
    return "failed";
  }
  if (value === "skipped" || value === "neutral" || value === "stale") return "skipped";
  if (value === "pending" || value === "queued" || value === "in_progress" || value === "waiting") return "pending";
  return "unknown";
}

function summarisePullRequests(pullRequests: GithubSnapshot["pullRequests"]): GithubSnapshot["summary"] {
  const checks = pullRequests.flatMap((pullRequest) => pullRequest.checks);
  return {
    repositories: 1,
    pullRequests: pullRequests.length,
    open: pullRequests.filter((pullRequest) => pullRequest.state.toUpperCase() === "OPEN").length,
    merged: pullRequests.filter((pullRequest) => pullRequest.state.toUpperCase() === "MERGED" || pullRequest.mergedAt).length,
    closed: pullRequests.filter((pullRequest) => pullRequest.state.toUpperCase() === "CLOSED").length,
    drafts: pullRequests.filter((pullRequest) => pullRequest.isDraft).length,
    checks: checks.length,
    passingChecks: checks.filter((check) => check.status === "passed").length,
    failingChecks: checks.filter((check) => check.status === "failed").length,
    pendingChecks: checks.filter((check) => check.status === "pending").length
  };
}

function renderSnapshot(snapshot: GithubSnapshot): string {
  return [
    "# GitHub Snapshot",
    "",
    `Mode: ${snapshot.mode}`,
    `Source: ${snapshot.source}`,
    `Imported: ${snapshot.importedAt}`,
    `Repository: ${snapshot.repository ?? "unknown"}`,
    "",
    "## Summary",
    "",
    `- Pull requests: ${snapshot.summary.pullRequests}`,
    `- Open: ${snapshot.summary.open}`,
    `- Merged: ${snapshot.summary.merged}`,
    `- Drafts: ${snapshot.summary.drafts}`,
    `- Checks: ${snapshot.summary.checks}`,
    `- Passing checks: ${snapshot.summary.passingChecks}`,
    `- Failing checks: ${snapshot.summary.failingChecks}`,
    `- Pending checks: ${snapshot.summary.pendingChecks}`,
    "",
    "## Pull Requests",
    "",
    "| PR | State | Checks | Title |",
    "| --- | --- | --- | --- |",
    ...snapshot.pullRequests.map(
      (pullRequest) =>
        `| #${pullRequest.number} | ${pullRequest.state} | ${pullRequest.checks.length} | ${escapeTable(pullRequest.title)} |`
    ),
    ""
  ].join("\n");
}

function repositoryFromRaw(raw: unknown): string | undefined {
  if (isObject(raw)) return stringValue(raw.repository) ?? stringValue(raw.repo);
  return undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|");
}
