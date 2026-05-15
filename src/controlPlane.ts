import fs from "node:fs/promises";
import path from "node:path";
import { ensureArtifactDir, latestFile, readJsonArtifact, timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { loadPlaywrightPlan } from "./playwrightPlan.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { CheckRecord, ControlReport, ExecutionRun, GsdRoadmap, ReviewRecord } from "./types.js";

interface GenerateControlOptions {
  project: string;
  vaultRoot: string;
}

export async function generateControlReport(options: GenerateControlOptions): Promise<{
  jsonPath: string;
  markdownPath: string;
  report: ControlReport;
}> {
  const project = slugifyProject(options.project);
  const evidence: string[] = [];
  const missing: string[] = [];

  await collectRequired(options.vaultRoot, project, "requirements/prd.json", evidence, missing);
  await collectRequired(options.vaultRoot, project, "gsd/roadmap.json", evidence, missing);
  await collectRequired(options.vaultRoot, project, "verification/commands.json", evidence, missing);

  try {
    const plan = await loadPlaywrightPlan(options.vaultRoot, project);
    evidence.push(`Playwright plan: ${plan.scenarios.length} scenarios for ${plan.targetUrl}`);
  } catch {
    missing.push("Playwright evidence plan");
  }

  const executionRun = await latestFile(options.vaultRoot, project, "execution", "run-", ".json");
  if (executionRun) {
    const run = await readJsonArtifactFromPath<ExecutionRun>(executionRun);
    evidence.push(`Execution run ${run.id}: ${run.status}`);
    if (run.status !== "complete") {
      missing.push(`Execution run ${run.id} is not complete`);
    }
  } else {
    missing.push("Execution run record");
  }

  const roadmap = await maybeReadRoadmap(options.vaultRoot, project);
  if (roadmap) {
    const taskCount = roadmap.milestones.reduce((count, milestone) => count + milestone.tasks.length, 0);
    evidence.push(`GSD tasks: ${taskCount}`);
  }

  const checks = await readJsonl<CheckRecord>(options.vaultRoot, project, "control", "check-history.jsonl");
  const requiredChecks = ["typecheck", "unit-tests", "build"];
  for (const checkName of requiredChecks) {
    const latest = checks.filter((check) => check.name === checkName).at(-1);
    if (latest?.status === "passed") {
      evidence.push(`Check ${checkName}: passed (${latest.command})`);
    } else {
      missing.push(`Check ${checkName} has not passed`);
    }
  }

  const reviews = await readJsonl<ReviewRecord>(options.vaultRoot, project, "control", "reviews.jsonl");
  const approvedReview = reviews.find(
    (review) => (review.source === "human" || review.source === "coderabbit") && review.status === "approved"
  );
  if (approvedReview) {
    evidence.push(`Review approved by ${approvedReview.source}: ${approvedReview.summary}`);
  } else {
    missing.push("CodeRabbit or human review approval");
  }

  const report: ControlReport = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status: missing.length === 0 ? "ready" : evidence.length > 0 ? "review_required" : "blocked",
    evidence,
    missing,
    mergeGates: [
      "typecheck passed",
      "unit tests passed",
      "build passed",
      "Playwright evidence captured for UI work",
      "CodeRabbit or human review completed",
      "human approval present for infrastructure or external repo mutation"
    ]
  };

  const jsonPath = await writeJsonArtifact(options.vaultRoot, project, "control", "merge-readiness.json", report);
  const markdownPath = await writeTextArtifact(
    options.vaultRoot,
    project,
    "control",
    "merge-readiness.md",
    renderControlReport(report)
  );

  return { jsonPath, markdownPath, report };
}

export async function recordCheck(input: {
  vaultRoot: string;
  project: string;
  name: string;
  command: string;
  status: CheckRecord["status"];
  evidence?: string;
}): Promise<CheckRecord> {
  const project = slugifyProject(input.project);
  const record: CheckRecord = {
    schemaVersion: 1,
    id: `check-${input.name}-${timestampFile()}`,
    project,
    recordedAt: new Date().toISOString(),
    name: input.name,
    command: input.command,
    status: input.status,
    evidence: input.evidence
  };
  await appendJsonl(input.vaultRoot, project, "control", "check-history.jsonl", record);
  return record;
}

export async function recordReview(input: {
  vaultRoot: string;
  project: string;
  source: ReviewRecord["source"];
  status: ReviewRecord["status"];
  summary: string;
  evidence?: string;
}): Promise<ReviewRecord> {
  const project = slugifyProject(input.project);
  const record: ReviewRecord = {
    schemaVersion: 1,
    id: `review-${input.source}-${timestampFile()}`,
    project,
    recordedAt: new Date().toISOString(),
    source: input.source,
    status: input.status,
    summary: input.summary,
    evidence: input.evidence
  };
  await appendJsonl(input.vaultRoot, project, "control", "reviews.jsonl", record);
  return record;
}

async function collectRequired(
  vaultRoot: string,
  project: string,
  relativePath: string,
  evidence: string[],
  missing: string[]
): Promise<void> {
  try {
    await readJsonArtifactFromProject(vaultRoot, project, relativePath);
    evidence.push(relativePath);
  } catch {
    missing.push(relativePath);
  }
}

async function readJsonArtifactFromProject(
  vaultRoot: string,
  project: string,
  relativePath: string
): Promise<unknown> {
  const [dirName, fileName] = relativePath.split("/");
  if (!dirName || !fileName) throw new Error(`Unsupported control path: ${relativePath}`);
  return readJsonArtifact<unknown>(vaultRoot, project, dirName, fileName);
}

async function readJsonArtifactFromPath<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function appendJsonl(
  vaultRoot: string,
  project: string,
  dirName: string,
  fileName: string,
  value: unknown
): Promise<void> {
  const dir = await ensureArtifactDir(vaultRoot, project, dirName);
  await fs.appendFile(path.join(dir, fileName), `${JSON.stringify(value)}\n`);
}

async function readJsonl<T>(
  vaultRoot: string,
  project: string,
  dirName: string,
  fileName: string
): Promise<T[]> {
  const filePath = path.join(projectDir(vaultRoot, project), dirName, fileName);
  try {
    const text = await fs.readFile(filePath, "utf8");
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as T);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function maybeReadRoadmap(vaultRoot: string, project: string): Promise<GsdRoadmap | undefined> {
  try {
    return await readJsonArtifact<GsdRoadmap>(vaultRoot, project, "gsd", "roadmap.json");
  } catch {
    return undefined;
  }
}

function renderControlReport(report: ControlReport): string {
  return [
    `# Merge Readiness: ${report.project}`,
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    "## Evidence",
    "",
    ...(report.evidence.length ? report.evidence.map((item) => `- ${item}`) : ["- None"]),
    "",
    "## Missing",
    "",
    ...(report.missing.length ? report.missing.map((item) => `- ${item}`) : ["- None"]),
    "",
    "## Merge Gates",
    "",
    ...report.mergeGates.map((gate) => `- ${gate}`),
    ""
  ].join("\n");
}
