import fs from "node:fs/promises";
import path from "node:path";
import { generateArtifactCheckReport } from "./artifactChecks.js";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { importCiStatus, importCodeRabbitReview } from "./ciImport.js";
import { generateControlReport } from "./controlPlane.js";
import { generateEvaluationPlan } from "./evaluation.js";
import { exportGbrainBundle } from "./gbrainAdapter.js";
import { generateGsd } from "./gsd.js";
import { exportGsd2Bundle } from "./gsdAdapter.js";
import { generateInfrastructureRegistry } from "./infrastructure.js";
import { importInfraSnapshot } from "./infraSnapshot.js";
import { importNotebookLmExport } from "./notebooklm.js";
import { slugifyProject } from "./paths.js";
import { generatePlaywrightPlan } from "./playwrightPlan.js";
import { generatePrd } from "./prd.js";
import { generateUsageMetricsReport, importUsageMetrics } from "./usageMetrics.js";
import { assembleDossier, ingestFiles } from "./vault.js";
import { generateBehaviorCheckReport } from "./behaviorChecks.js";
import { planExecution } from "./execution.js";
import type { ArtifactCheckReport, BenchmarkAcceptanceType, BenchmarkPack, BenchmarkRun, BenchmarkSet } from "./types.js";

type BenchmarkStep = BenchmarkRun["steps"][number];

export async function runBenchmarkPack(input: {
  project: string;
  vaultRoot: string;
  set: BenchmarkSet;
  packRoot?: string;
  targetUrl?: string;
}): Promise<{ jsonPath: string; markdownPath: string; run: BenchmarkRun }> {
  const project = slugifyProject(input.project || `bench-${input.set}`);
  const packInfo = await loadBenchmarkPack(input.set, input.packRoot);
  const targetProjects = targetProjectsFor(project, packInfo.pack);
  const steps: BenchmarkStep[] = [];
  const artifactChecks: BenchmarkRun["artifactChecks"] = [];

  for (const targetProject of targetProjects) {
    const files = filesForProject(packInfo.pack, packInfo.root, targetProject, project);
    await runProjectPipeline({
      project: targetProject,
      vaultRoot: input.vaultRoot,
      targetUrl: input.targetUrl ?? "http://localhost:3000",
      files,
      steps,
      artifactChecks
    });
  }

  const failed = steps.filter((step) => step.status === "failed").length;
  const missingRequiredArtifacts = artifactChecks.reduce((sum, report) => sum + report.missingRequired, 0);
  const acceptance = acceptanceResults(packInfo.pack, artifactChecks, failed);
  const rawRun: BenchmarkRun = {
    schemaVersion: 1,
    id: `benchmark-run-${input.set}-${timestampFile()}`,
    project,
    set: input.set,
    generatedAt: new Date().toISOString(),
    mode: "local_deterministic",
    status: failed === 0 && missingRequiredArtifacts === 0 && acceptance.every((item) => item.status === "passed") ? "passed" : "failed",
    packPath: portable(packInfo.manifestPath, packInfo.root),
    packRoot: portable(packInfo.root, packInfo.root),
    targetProjects,
    summary: {
      steps: steps.length,
      passed: steps.length - failed,
      failed,
      targetProjects: targetProjects.length,
      missingRequiredArtifacts
    },
    steps,
    acceptance,
    artifactChecks
  };
  const run = makePortable(rawRun, [
    [input.vaultRoot, "<VAULT_ROOT>"],
    [packInfo.root, "<PACK_ROOT>"],
    [process.cwd(), "<WORKSPACE_ROOT>"]
  ]);

  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "evaluation", `${run.id}.json`, run);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "evaluation", `${run.id}.md`, renderRun(run));
  return { jsonPath, markdownPath, run };
}

async function loadBenchmarkPack(set: BenchmarkSet, packRoot?: string): Promise<{ root: string; manifestPath: string; pack: BenchmarkPack }> {
  const candidateRoot = path.resolve(packRoot ?? path.join("benchmarks", "source-packs", set));
  const candidateManifest = path.join(candidateRoot, "benchmark-pack.json");
  const root = (await pathExists(candidateManifest)) ? candidateRoot : path.join(candidateRoot, set);
  const manifestPath = path.join(root, "benchmark-pack.json");
  const pack = JSON.parse(await fs.readFile(manifestPath, "utf8")) as BenchmarkPack;
  if (pack.schemaVersion !== 1 || pack.set !== set) {
    throw new Error(`Benchmark manifest ${manifestPath} is not a ${set} pack.`);
  }
  if (!Array.isArray(pack.acceptance) || !pack.acceptance.every(isAcceptanceCriterion)) {
    throw new Error(`Benchmark manifest ${manifestPath} has invalid acceptance criteria.`);
  }
  return { root, manifestPath, pack };
}

function isAcceptanceCriterion(value: unknown): value is BenchmarkPack["acceptance"][number] {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as { id?: unknown }).id === "string" &&
    isAcceptanceType((value as { type?: unknown }).type) &&
    typeof (value as { criterion?: unknown }).criterion === "string"
  );
}

function isAcceptanceType(value: unknown): value is BenchmarkAcceptanceType {
  return value === "artifact_contract" || value === "pipeline_output" || value === "fixture_safety";
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function targetProjectsFor(project: string, pack: BenchmarkPack): string[] {
  if (pack.set !== "stress") return [project];
  const suffixes = new Set<string>();
  for (const file of pack.files.filter((item) => item.role === "source")) {
    const [first] = file.path.split("/");
    if (first?.startsWith("project-")) suffixes.add(first.replace(/^project-/, ""));
  }
  return suffixes.size === 0 ? [project] : [...suffixes].sort().map((suffix) => `${project}-${suffix}`);
}

function filesForProject(
  pack: BenchmarkPack,
  root: string,
  targetProject: string,
  baseProject: string
): Array<BenchmarkPack["files"][number] & { absolutePath: string }> {
  const packRoot = path.resolve(root);
  return pack.files
    .filter((file) => {
      if (pack.set !== "stress") return true;
      return fileAppliesToStressProject(file, targetProject, baseProject);
    })
    .map((file) => {
      const absolutePath = path.resolve(packRoot, file.path);
      const relativeFromRoot = path.relative(packRoot, absolutePath);
      if (relativeFromRoot.startsWith("..") || path.isAbsolute(relativeFromRoot)) {
        throw new Error(`Benchmark file escapes pack root: ${file.path}`);
      }
      return {
        ...file,
        absolutePath
      };
    });
}

function fileAppliesToStressProject(file: BenchmarkPack["files"][number], targetProject: string, baseProject: string): boolean {
  if (file.targetProject) return targetProject === `${baseProject}-${file.targetProject}`;
  const match = /^project-([^/]+)\//.exec(file.path);
  if (!match) return false;
  return targetProject === `${baseProject}-${match[1]}`;
}

async function runProjectPipeline(input: {
  project: string;
  vaultRoot: string;
  targetUrl: string;
  files: Array<BenchmarkPack["files"][number] & { absolutePath: string }>;
  steps: BenchmarkStep[];
  artifactChecks: BenchmarkRun["artifactChecks"];
}): Promise<void> {
  const sourceFiles = input.files.filter((file) => file.role === "source").map((file) => file.absolutePath);
  await step(input.steps, input.project, "ingest", sourceFiles, async () => {
    if (sourceFiles.length === 0) throw new Error("benchmark project has no source files");
    await ingestFiles(sourceFiles, { project: input.project, vaultRoot: input.vaultRoot });
  });
  await step(input.steps, input.project, "assemble", [], async () => assembleDossier({ project: input.project, vaultRoot: input.vaultRoot, maxCharsPerSource: 4000 }));
  await step(input.steps, input.project, "prd", [], async () => generatePrd({ project: input.project, vaultRoot: input.vaultRoot }));
  await step(input.steps, input.project, "gsd", [], async () => generateGsd({ project: input.project, vaultRoot: input.vaultRoot }));
  await step(input.steps, input.project, "gsd2-export", [], async () => exportGsd2Bundle({ project: input.project, vaultRoot: input.vaultRoot }));
  await step(input.steps, input.project, "execution", [], async () => planExecution({ project: input.project, vaultRoot: input.vaultRoot }));
  await step(input.steps, input.project, "playwright", [], async () =>
    generatePlaywrightPlan({ project: input.project, vaultRoot: input.vaultRoot, targetUrl: input.targetUrl })
  );
  await step(input.steps, input.project, "evaluation", [], async () =>
    generateEvaluationPlan({ project: input.project, vaultRoot: input.vaultRoot, target: "benchmark-local" })
  );
  await step(input.steps, input.project, "infra", [], async () => generateInfrastructureRegistry({ project: input.project, vaultRoot: input.vaultRoot }));

  for (const file of input.files) {
    if (file.role === "notebooklm_export") {
      await step(input.steps, input.project, "notebooklm-import", [file.absolutePath], async () =>
        importNotebookLmExport({ project: input.project, vaultRoot: input.vaultRoot, sourcePath: file.absolutePath })
      );
    } else if (file.role === "ci_status") {
      await step(input.steps, input.project, "import-ci", [file.absolutePath], async () =>
        importCiStatus({ project: input.project, vaultRoot: input.vaultRoot, sourcePath: file.absolutePath })
      );
    } else if (file.role === "coderabbit_review") {
      await step(input.steps, input.project, "import-coderabbit", [file.absolutePath], async () =>
        importCodeRabbitReview({ project: input.project, vaultRoot: input.vaultRoot, sourcePath: file.absolutePath })
      );
    } else if (file.role === "usage_metrics") {
      await step(input.steps, input.project, "usage-import", [file.absolutePath], async () =>
        importUsageMetrics({ project: input.project, vaultRoot: input.vaultRoot, sourcePath: file.absolutePath })
      );
      await step(input.steps, input.project, "usage-report", [], async () =>
        generateUsageMetricsReport({ project: input.project, vaultRoot: input.vaultRoot })
      );
    } else if (file.role === "infra_snapshot") {
      await step(input.steps, input.project, "infra-snapshot", [file.absolutePath], async () =>
        importInfraSnapshot({ project: input.project, vaultRoot: input.vaultRoot, sourcePath: file.absolutePath })
      );
    }
  }

  await step(input.steps, input.project, "control", [], async () => generateControlReport({ project: input.project, vaultRoot: input.vaultRoot }));
  await step(input.steps, input.project, "behavior-checks", [], async () =>
    generateBehaviorCheckReport({ project: input.project, vaultRoot: input.vaultRoot })
  );
  await step(input.steps, input.project, "gbrain-export", [], async () => exportGbrainBundle({ project: input.project, vaultRoot: input.vaultRoot }));
  await step(input.steps, input.project, "artifact-checks", [], async () => {
    const result = await generateArtifactCheckReport({ project: input.project, vaultRoot: input.vaultRoot });
    input.artifactChecks.push({
      project: input.project,
      status: result.report.status,
      missingRequired: result.report.summary.missingRequired,
      reportPath: result.markdownPath
    });
    return result;
  });
}

async function step(
  steps: BenchmarkStep[],
  project: string,
  id: string,
  evidenceRefs: string[],
  run: () => Promise<unknown>
): Promise<void> {
  try {
    const result = await run();
    steps.push({
      id,
      project,
      status: "passed",
      detail: "completed",
      evidenceRefs: [...evidenceRefs, ...resultPaths(result)]
    });
  } catch (error) {
    steps.push({
      id,
      project,
      status: "failed",
      detail: error instanceof Error ? error.message : String(error),
      evidenceRefs
    });
  }
}

function resultPaths(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const paths: string[] = [];
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if ((key.endsWith("Path") || key.endsWith("Paths")) && typeof item === "string") {
      paths.push(item);
    } else if (Array.isArray(item)) {
      paths.push(...item.filter((entry): entry is string => typeof entry === "string" && (entry.includes("/") || entry.includes("\\"))));
    }
  }
  return paths;
}

function acceptanceResults(
  pack: BenchmarkPack,
  artifactChecks: BenchmarkRun["artifactChecks"],
  failedSteps: number
): BenchmarkRun["acceptance"] {
  const evidenceRefs = artifactChecks.map((check) => check.reportPath);
  return pack.acceptance.map((criterion) => {
    const passed = acceptancePassed(criterion.type, pack, artifactChecks, failedSteps);
    return {
      id: criterion.id,
      type: criterion.type,
      criterion: criterion.criterion,
      status: passed ? "passed" : "failed",
      evidenceRefs
    };
  });
}

function acceptancePassed(
  type: BenchmarkAcceptanceType,
  pack: BenchmarkPack,
  artifactChecks: BenchmarkRun["artifactChecks"],
  failedSteps: number
): boolean {
  if (type === "artifact_contract") {
    return failedSteps === 0 && artifactChecks.every((check) => check.missingRequired === 0);
  }
  if (type === "pipeline_output") {
    return failedSteps === 0;
  }
  return fixtureSafetyPassed(pack);
}

function fixtureSafetyPassed(pack: BenchmarkPack): boolean {
  const forbiddenCommand = /\b(ssh|scp|rsync|kubectl|terraform\s+apply|git\s+push|gh\s+pr\s+merge)\b|curl\s+https?:\/\/(?!localhost|127\.0\.0\.1)/i;
  return pack.recommendedCommands.every((command) => !forbiddenCommand.test(command));
}

function renderRun(run: BenchmarkRun): string {
  return [
    `# Benchmark Run: ${run.set}`,
    "",
    `Id: ${run.id}`,
    `Status: ${run.status}`,
    `Generated: ${run.generatedAt}`,
    `Mode: ${run.mode}`,
    `Pack: ${run.packPath}`,
    `Target projects: ${run.targetProjects.join(", ")}`,
    "",
    "## Summary",
    "",
    `- Steps: ${run.summary.steps}`,
    `- Passed: ${run.summary.passed}`,
    `- Failed: ${run.summary.failed}`,
    `- Missing required artifacts: ${run.summary.missingRequiredArtifacts}`,
    "",
    "## Steps",
    "",
    "| Project | Step | Status | Detail |",
    "| --- | --- | --- | --- |",
    ...run.steps.map((step) => `| ${step.project} | ${step.id} | ${step.status} | ${step.detail} |`),
    "",
    "## Acceptance",
    "",
    "| Criterion | Status |",
    "| --- | --- |",
    ...run.acceptance.map((item) => `| ${item.criterion} | ${item.status} |`),
    ""
  ].join("\n");
}

function portable(value: string, root: string): string {
  return path.resolve(value).split(path.resolve(root)).join("<PACK_ROOT>");
}

function makePortable<T>(value: T, replacements: Array<[string, string]>): T {
  return replaceStrings(
    value,
    replacements.map(([root, placeholder]) => [path.resolve(root), placeholder])
  ) as T;
}

function replaceStrings(value: unknown, replacements: string[][]): unknown {
  if (typeof value === "string") {
    return replacements.reduce((current, [needle, replacement]) => current.split(needle).join(replacement), value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceStrings(item, replacements));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, replaceStrings(item, replacements)])
    );
  }
  return value;
}
