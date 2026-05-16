import { readJsonArtifact, timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { slugifyProject } from "./paths.js";
import type { EvaluationPlan, EvaluationRun, GsdRoadmap } from "./types.js";

export async function generateEvaluationPlan(input: {
  project: string;
  vaultRoot: string;
  target?: string;
}): Promise<{ jsonPath: string; markdownPath: string; plan: EvaluationPlan }> {
  const project = slugifyProject(input.project);
  const roadmap = await readJsonArtifact<GsdRoadmap>(input.vaultRoot, project, "gsd", "roadmap.json");
  const plan: EvaluationPlan = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    target: input.target ?? "local-dev-pipeline",
    dimensions: [
      {
        id: "D1",
        title: "Evidence fidelity",
        weight: 25,
        sensors: ["manifest.jsonl", "hygiene.json", "context dossier"],
        successSignals: ["raw sources preserved", "hashes stable", "source references survive into PRD and GSD"]
      },
      {
        id: "D2",
        title: "Planning quality",
        weight: 20,
        sensors: ["prd.json", "roadmap.json", "gsd2-bundle.json"],
        successSignals: ["requirements are bounded", "tasks have success criteria", "write scopes are explicit"]
      },
      {
        id: "D3",
        title: "Execution safety",
        weight: 20,
        sensors: ["execution run", "worktree guard", "decision records"],
        successSignals: ["external mutation remains gated", "worktrees are isolated", "human approvals are explicit"]
      },
      {
        id: "D4",
        title: "Verification strength",
        weight: 25,
        sensors: ["typecheck", "unit tests", "build", "Playwright evidence", "CodeRabbit review"],
        successSignals: ["fast checks run left", "UI evidence is captured", "review feedback is recorded"]
      },
      {
        id: "D5",
        title: "Operational fit",
        weight: 10,
        sensors: ["infrastructure registry", "infra snapshots", "control report"],
        successSignals: ["placement is explicit", "runner trust boundary is visible", "readiness report is current"]
      }
    ],
    scenarios: roadmap.milestones.flatMap((milestone) =>
      milestone.tasks.map((task) => ({
        id: `EVAL-${task.id.replace(/^TASK-/, "")}`,
        title: task.title,
        description: `Evaluate whether ${task.id} can move from source evidence to verified control-plane evidence.`,
        taskIds: [task.id],
        expectedEvidence: [...task.verificationCommands, ...task.writes]
      }))
    )
  };

  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "evaluation", "evaluation-plan.json", plan);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "evaluation", "evaluation-plan.md", renderPlan(plan));
  return { jsonPath, markdownPath, plan };
}

export async function recordEvaluationRun(input: {
  project: string;
  vaultRoot: string;
  planPath: string;
  target?: string;
  operator?: string;
  dimensionScores: EvaluationRun["dimensionScores"];
  evidenceRefs: string[];
  regressions: string[];
  recommendations: string[];
}): Promise<{ jsonPath: string; markdownPath: string; run: EvaluationRun }> {
  const project = slugifyProject(input.project);
  const run: EvaluationRun = {
    schemaVersion: 1,
    id: `evaluation-${timestampFile()}`,
    project,
    recordedAt: new Date().toISOString(),
    planPath: input.planPath,
    target: input.target ?? "local-dev-pipeline",
    operator: input.operator ?? "manual",
    overallScore: weightedAverage(input.dimensionScores),
    dimensionScores: input.dimensionScores,
    evidenceRefs: input.evidenceRefs,
    regressions: input.regressions,
    recommendations: input.recommendations
  };

  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "evaluation", `${run.id}.json`, run);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "evaluation", `${run.id}.md`, renderRun(run));
  return { jsonPath, markdownPath, run };
}

function weightedAverage(scores: EvaluationRun["dimensionScores"]): number {
  if (scores.length === 0) return 0;
  const weighted = scores.reduce(
    (state, score) => {
      const weight = DIMENSION_WEIGHTS[score.id] ?? 1;
      return {
        total: state.total + clampScore(score.score) * weight,
        weight: state.weight + weight
      };
    },
    { total: 0, weight: 0 }
  );
  const average = weighted.weight === 0 ? 0 : weighted.total / weighted.weight;
  return Math.round(average);
}

const DIMENSION_WEIGHTS: Record<string, number> = {
  D1: 25,
  D2: 20,
  D3: 20,
  D4: 25,
  D5: 10
};

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, score));
}

function renderPlan(plan: EvaluationPlan): string {
  return [
    `# Evaluation Plan: ${plan.project}`,
    "",
    `Target: ${plan.target}`,
    `Generated: ${plan.generatedAt}`,
    "",
    "## Dimensions",
    "",
    ...plan.dimensions.flatMap((dimension) => [
      `### ${dimension.id}: ${dimension.title}`,
      "",
      `Weight: ${dimension.weight}`,
      "",
      "Sensors:",
      ...dimension.sensors.map((sensor) => `- ${sensor}`),
      "",
      "Success signals:",
      ...dimension.successSignals.map((signal) => `- ${signal}`),
      ""
    ]),
    "## Scenarios",
    "",
    ...plan.scenarios.flatMap((scenario) => [
      `### ${scenario.id}: ${scenario.title}`,
      "",
      scenario.description,
      "",
      `Tasks: ${scenario.taskIds.join(", ")}`,
      "",
      "Expected evidence:",
      ...scenario.expectedEvidence.map((item) => `- ${item}`),
      ""
    ])
  ].join("\n");
}

function renderRun(run: EvaluationRun): string {
  return [
    `# Evaluation Run: ${run.id}`,
    "",
    `Target: ${run.target}`,
    `Recorded: ${run.recordedAt}`,
    `Operator: ${run.operator}`,
    `Overall score: ${run.overallScore}`,
    `Plan: ${run.planPath}`,
    "",
    "## Dimension Scores",
    "",
    ...run.dimensionScores.map((score) => `- ${score.id}: ${clampScore(score.score)} - ${score.notes}`),
    "",
    "## Evidence",
    "",
    ...listOrNone(run.evidenceRefs),
    "",
    "## Regressions",
    "",
    ...listOrNone(run.regressions),
    "",
    "## Recommendations",
    "",
    ...listOrNone(run.recommendations),
    ""
  ].join("\n");
}

function listOrNone(items: string[]): string[] {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ["- none"];
}
