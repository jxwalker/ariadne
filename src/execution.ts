import fs from "node:fs/promises";
import path from "node:path";
import { readJsonArtifact, timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { flattenTasks, renderTasks } from "./gsd.js";
import { slugifyProject } from "./paths.js";
import type { ExecutionRun, GsdRoadmap, GsdTask } from "./types.js";

interface PlanExecutionOptions {
  project: string;
  vaultRoot: string;
  repoPath?: string;
  taskId?: string;
}

export async function planExecution(options: PlanExecutionOptions): Promise<{
  jsonPath: string;
  markdownPath: string;
  run: ExecutionRun;
}> {
  const project = slugifyProject(options.project);
  const roadmap = await readJsonArtifact<GsdRoadmap>(options.vaultRoot, project, "gsd", "roadmap.json");
  const tasks = selectTasks(flattenTasks(roadmap), options.taskId);
  const createdAt = new Date().toISOString();
  const runId = `run-${timestampFile(new Date(createdAt))}`;
  const repoPath = options.repoPath ? path.resolve(options.repoPath) : undefined;

  const run: ExecutionRun = {
    schemaVersion: 1,
    id: runId,
    project,
    createdAt,
    taskIds: tasks.map((task) => task.id),
    repoPath: repoPath ?? "<REPO_ROOT>",
    branchPrefix: "jxw/ariadne",
    status: "planned",
    gates: ["npm run check", "npm test", "npm run build", "review evidence", "human approval before external mutation"],
    worktrees: tasks.map((task) => ({
      taskId: task.id,
      branch: `jxw/ariadne-${task.id.toLowerCase()}`,
      worktreePath: repoPath
        ? path.join(path.dirname(repoPath), `${path.basename(repoPath)}-${task.id.toLowerCase()}`)
        : `<REPO_ROOT>-${task.id.toLowerCase()}`
    })),
    stopConditions: [
      "A verification command fails twice for the same reason.",
      "A task requires credentials or external mutation not represented by an approved plan.",
      "The working tree contains unrelated user changes in a write scope.",
      "Generated tests cannot identify a target URL or stable user workflow."
    ]
  };

  const jsonPath = await writeJsonArtifact(options.vaultRoot, project, "execution", `${runId}.json`, run);
  const markdownPath = await writeTextArtifact(options.vaultRoot, project, "execution", `${runId}.md`, renderRun(run, tasks));
  return { jsonPath, markdownPath, run };
}

function selectTasks(tasks: GsdTask[], taskId?: string): GsdTask[] {
  if (!taskId || taskId === "all") {
    return tasks;
  }

  const task = tasks.find((candidate) => candidate.id.toLowerCase() === taskId.toLowerCase());
  if (!task) {
    throw new Error(`Unknown task id: ${taskId}`);
  }
  return [task];
}

function renderRun(run: ExecutionRun, tasks: GsdTask[]): string {
  return [
    `# Execution Run: ${run.id}`,
    "",
    `Project: ${run.project}`,
    `Status: ${run.status}`,
    `Repository: ${run.repoPath ?? "<REPO_ROOT>"}`,
    "",
    "## Worktrees",
    "",
    ...run.worktrees.map((worktree) => `- ${worktree.taskId}: ${worktree.branch} -> ${worktree.worktreePath}`),
    "",
    "## Gates",
    "",
    ...run.gates.map((gate) => `- ${gate}`),
    "",
    "## Stop Conditions",
    "",
    ...run.stopConditions.map((condition) => `- ${condition}`),
    "",
    "## Task Detail",
    "",
    renderTasks({
      schemaVersion: 1,
      project: run.project,
      generatedAt: run.createdAt,
      milestones: [{ id: "RUN", title: run.id, tasks }]
    })
  ].join("\n");
}

export async function markRunStatus(
  vaultRoot: string,
  project: string,
  runFile: string,
  status: ExecutionRun["status"]
): Promise<string> {
  const resolved = path.resolve(runFile);
  const run = JSON.parse(await fs.readFile(resolved, "utf8")) as ExecutionRun;
  run.status = status;
  await fs.writeFile(resolved, `${JSON.stringify(run, null, 2)}\n`);
  const markdownPath = resolved.replace(/\.json$/, ".md");
  try {
    const markdown = await fs.readFile(markdownPath, "utf8");
    await fs.writeFile(markdownPath, markdown.replace(/^Status: .+$/m, `Status: ${status}`));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  await writeTextArtifact(vaultRoot, project, "execution", `${run.id}-status.md`, `# ${run.id}\n\nStatus: ${status}\n`);
  return resolved;
}
