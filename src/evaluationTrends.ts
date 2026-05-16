import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { EvaluationRun, EvaluationTrendReport } from "./types.js";

export async function generateEvaluationTrendReport(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; report: EvaluationTrendReport }> {
  const project = slugifyProject(input.project);
  const runs = await readEvaluationRuns(input.vaultRoot, project);
  const latest = runs.at(-1);
  const previous = runs.at(-2);
  const delta = latest && previous ? latest.overallScore - previous.overallScore : undefined;
  const report: EvaluationTrendReport = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status: trendStatus(delta, runs.length),
    runCount: runs.length,
    latestScore: latest?.overallScore,
    previousScore: previous?.overallScore,
    delta,
    runs: runs.map((run) => ({
      id: run.id,
      recordedAt: run.recordedAt,
      target: run.target,
      operator: run.operator,
      overallScore: run.overallScore,
      evidenceCount: run.evidenceRefs.length,
      regressionCount: run.regressions.length,
      recommendationCount: run.recommendations.length
    })),
    dimensions: dimensionTrends(runs),
    openRegressions: latest?.regressions ?? [],
    latestRecommendations: latest?.recommendations ?? []
  };

  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "evaluation", "evaluation-trends.json", report);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "evaluation",
    "evaluation-trends.md",
    renderReport(report)
  );
  return { jsonPath, markdownPath, report };
}

async function readEvaluationRuns(vaultRoot: string, project: string): Promise<EvaluationRun[]> {
  const dir = path.join(projectDir(vaultRoot, project), "evaluation");
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const runs: EvaluationRun[] = [];
  for (const name of names.filter((item) => item.startsWith("evaluation-") && item.endsWith(".json")).sort()) {
    const raw = JSON.parse(await fs.readFile(path.join(dir, name), "utf8")) as unknown;
    if (isEvaluationRun(raw)) {
      runs.push(raw);
    }
  }
  return runs.sort((left, right) => left.recordedAt.localeCompare(right.recordedAt));
}

function isEvaluationRun(value: unknown): value is EvaluationRun {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).schemaVersion === 1 &&
    typeof (value as Record<string, unknown>).id === "string" &&
    typeof (value as Record<string, unknown>).overallScore === "number" &&
    Array.isArray((value as Record<string, unknown>).dimensionScores)
  );
}

function trendStatus(delta: number | undefined, count: number): EvaluationTrendReport["status"] {
  if (count === 0) return "empty";
  if (delta === undefined || delta === 0) return "stable";
  return delta > 0 ? "improving" : "declining";
}

function dimensionTrends(runs: EvaluationRun[]): EvaluationTrendReport["dimensions"] {
  const ids = new Set<string>();
  for (const run of runs) {
    for (const score of run.dimensionScores) {
      ids.add(score.id);
    }
  }

  return [...ids].sort().map((id) => {
    const samples = runs
      .map((run) => run.dimensionScores.find((score) => score.id === id)?.score)
      .filter((score): score is number => typeof score === "number");
    const latest = samples.at(-1);
    const previous = samples.at(-2);
    return {
      id,
      samples: samples.length,
      latestScore: latest,
      previousScore: previous,
      delta: latest !== undefined && previous !== undefined ? latest - previous : undefined
    };
  });
}

function renderReport(report: EvaluationTrendReport): string {
  return [
    "# Evaluation Trends",
    "",
    `Project: ${report.project}`,
    `Status: ${report.status}`,
    `Generated: ${report.generatedAt}`,
    `Runs: ${report.runCount}`,
    `Latest score: ${report.latestScore ?? "none"}`,
    `Previous score: ${report.previousScore ?? "none"}`,
    `Delta: ${report.delta ?? "none"}`,
    "",
    "## Runs",
    "",
    report.runs.length === 0
      ? "- none"
      : [
          "| Recorded | Target | Operator | Score | Evidence | Regressions | Recommendations |",
          "| --- | --- | --- | --- | --- | --- | --- |",
          ...report.runs.map(
            (run) =>
              `| ${run.recordedAt} | ${run.target} | ${run.operator} | ${run.overallScore} | ${run.evidenceCount} | ${run.regressionCount} | ${run.recommendationCount} |`
          )
        ].join("\n"),
    "",
    "## Dimensions",
    "",
    report.dimensions.length === 0
      ? "- none"
      : [
          "| Dimension | Samples | Latest | Previous | Delta |",
          "| --- | --- | --- | --- | --- |",
          ...report.dimensions.map(
            (dimension) =>
              `| ${dimension.id} | ${dimension.samples} | ${dimension.latestScore ?? "-"} | ${dimension.previousScore ?? "-"} | ${dimension.delta ?? "-"} |`
          )
        ].join("\n"),
    "",
    "## Latest Regressions",
    "",
    ...listOrNone(report.openRegressions),
    "",
    "## Latest Recommendations",
    "",
    ...listOrNone(report.latestRecommendations),
    ""
  ].join("\n");
}

function listOrNone(items: string[]): string[] {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ["- none"];
}
