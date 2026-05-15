import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { loadPrd } from "./prd.js";
import { slugifyProject } from "./paths.js";
import type { GsdRoadmap, GsdTask, PrdDocument, Requirement } from "./types.js";

interface GenerateGsdOptions {
  project: string;
  vaultRoot: string;
}

function taskForRequirement(requirement: Requirement): GsdTask {
  const suffix = requirement.id.replace("REQ-", "");
  const baseCommands = ["npm run check", "npm test"];
  const playwrightCommands =
    requirement.id === "REQ-005" ? ["npx playwright test --reporter=list"] : [];

  return {
    id: `TASK-${suffix}`,
    title: requirement.title,
    requirementIds: [requirement.id],
    slice: requirement.priority === "must" ? "core" : "verification",
    successCriteria: requirement.acceptance,
    verificationCommands: [...baseCommands, ...playwrightCommands],
    canRunInParallel: !["REQ-003", "REQ-004"].includes(requirement.id),
    writes: writesForRequirement(requirement.id)
  };
}

function writesForRequirement(id: string): string[] {
  switch (id) {
    case "REQ-001":
      return ["src/vault.ts", "src/extract.ts", "docs/source-contract.md"];
    case "REQ-002":
      return ["src/prd.ts", "vault/projects/<project>/requirements/"];
    case "REQ-003":
      return ["src/gsd.ts", "vault/projects/<project>/gsd/"];
    case "REQ-004":
      return ["src/execution.ts", "vault/projects/<project>/execution/"];
    case "REQ-005":
      return ["src/playwrightPlan.ts", "vault/projects/<project>/verification/"];
    case "REQ-006":
      return ["src/controlPlane.ts", "vault/projects/<project>/control/"];
    case "REQ-007":
      return ["src/infrastructure.ts", "vault/projects/<project>/infrastructure/"];
    default:
      return ["src/"];
  }
}

function roadmapFromPrd(prd: PrdDocument): GsdRoadmap {
  const coreTasks = prd.requirements
    .filter((requirement) => requirement.priority === "must")
    .map(taskForRequirement);
  const verificationTasks = prd.requirements
    .filter((requirement) => requirement.priority !== "must")
    .map(taskForRequirement);

  return {
    schemaVersion: 1,
    project: prd.project,
    generatedAt: new Date().toISOString(),
    milestones: [
      {
        id: "M1",
        title: "Control Spine",
        tasks: coreTasks
      },
      {
        id: "M2",
        title: "Verification Surface",
        tasks: verificationTasks
      }
    ]
  };
}

export async function generateGsd(options: GenerateGsdOptions): Promise<{
  jsonPath: string;
  markdownPath: string;
  commandsPath: string;
  roadmap: GsdRoadmap;
}> {
  const project = slugifyProject(options.project);
  const prd = await loadPrd(options.vaultRoot, project);
  const roadmap = roadmapFromPrd(prd);

  const jsonPath = await writeJsonArtifact(options.vaultRoot, project, "gsd", "roadmap.json", roadmap);
  const markdownPath = await writeTextArtifact(options.vaultRoot, project, "gsd", "TASKS.md", renderTasks(roadmap));
  const commandsPath = await writeJsonArtifact(
    options.vaultRoot,
    project,
    "verification",
    "commands.json",
    verificationRegistry(roadmap)
  );

  return { jsonPath, markdownPath, commandsPath, roadmap };
}

function verificationRegistry(roadmap: GsdRoadmap): Record<string, string[]> {
  const registry: Record<string, string[]> = {};
  for (const milestone of roadmap.milestones) {
    for (const task of milestone.tasks) {
      registry[task.id] = task.verificationCommands;
    }
  }
  return registry;
}

export function flattenTasks(roadmap: GsdRoadmap): GsdTask[] {
  return roadmap.milestones.flatMap((milestone) => milestone.tasks);
}

export function renderTasks(roadmap: GsdRoadmap): string {
  const sections = roadmap.milestones.map((milestone) => {
    const tasks = milestone.tasks.map((task) =>
      [
        `### ${task.id}: ${task.title}`,
        "",
        `Slice: ${task.slice}`,
        `Requirements: ${task.requirementIds.join(", ")}`,
        `Parallel: ${task.canRunInParallel ? "yes" : "no"}`,
        "",
        "Success criteria:",
        ...task.successCriteria.map((item) => `- ${item}`),
        "",
        "Verification:",
        ...task.verificationCommands.map((item) => `- \`${item}\``),
        "",
        "Write scope:",
        ...task.writes.map((item) => `- \`${item}\``),
        ""
      ].join("\n")
    );

    return [`## ${milestone.id}: ${milestone.title}`, "", ...tasks].join("\n");
  });

  return [`# GSD Task Export: ${roadmap.project}`, "", `Generated: ${roadmap.generatedAt}`, "", ...sections, ""].join(
    "\n"
  );
}
