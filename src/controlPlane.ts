import { latestFile, readJsonArtifact, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { loadPlaywrightPlan } from "./playwrightPlan.js";
import { slugifyProject } from "./paths.js";
import type { ControlReport, ExecutionRun, GsdRoadmap } from "./types.js";

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
  const fs = await import("node:fs/promises");
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
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
