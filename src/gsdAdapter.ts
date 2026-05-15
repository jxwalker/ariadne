import fs from "node:fs/promises";
import path from "node:path";
import { readJsonArtifact, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { renderTasks } from "./gsd.js";
import { slugifyProject } from "./paths.js";
import type { GsdRoadmap, GsdTask } from "./types.js";

interface Gsd2Bundle {
  schemaVersion: 1;
  format: "dev-pipeline-gsd2-bundle";
  exportedAt: string;
  project: string;
  tasks: Array<GsdTask & { milestoneId: string; milestoneTitle: string }>;
}

export async function exportGsd2Bundle(options: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; bundle: Gsd2Bundle }> {
  const project = slugifyProject(options.project);
  const roadmap = await readJsonArtifact<GsdRoadmap>(options.vaultRoot, project, "gsd", "roadmap.json");
  const bundle: Gsd2Bundle = {
    schemaVersion: 1,
    format: "dev-pipeline-gsd2-bundle",
    exportedAt: new Date().toISOString(),
    project,
    tasks: roadmap.milestones.flatMap((milestone) =>
      milestone.tasks.map((task) => ({
        ...task,
        milestoneId: milestone.id,
        milestoneTitle: milestone.title
      }))
    )
  };

  const jsonPath = await writeJsonArtifact(options.vaultRoot, project, "gsd", "gsd2-bundle.json", bundle);
  const markdownPath = await writeTextArtifact(
    options.vaultRoot,
    project,
    "gsd",
    "gsd2-bundle.md",
    renderTasks({
      schemaVersion: 1,
      project,
      generatedAt: bundle.exportedAt,
      milestones: roadmap.milestones
    })
  );
  return { jsonPath, markdownPath, bundle };
}

export async function importGsd2Bundle(options: {
  project: string;
  vaultRoot: string;
  sourcePath: string;
}): Promise<{ jsonPath: string; markdownPath: string; roadmap: GsdRoadmap }> {
  const project = slugifyProject(options.project);
  const raw = JSON.parse(await fs.readFile(path.resolve(options.sourcePath), "utf8")) as Gsd2Bundle;
  const milestones = new Map<string, { id: string; title: string; tasks: GsdTask[] }>();

  for (const task of raw.tasks) {
    const milestone = milestones.get(task.milestoneId) ?? {
      id: task.milestoneId,
      title: task.milestoneTitle,
      tasks: []
    };
    const { milestoneId: _milestoneId, milestoneTitle: _milestoneTitle, ...gsdTask } = task;
    milestone.tasks.push(gsdTask);
    milestones.set(milestone.id, milestone);
  }

  const roadmap: GsdRoadmap = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    milestones: [...milestones.values()]
  };

  const jsonPath = await writeJsonArtifact(options.vaultRoot, project, "gsd", "roadmap.imported.json", roadmap);
  const markdownPath = await writeTextArtifact(options.vaultRoot, project, "gsd", "TASKS.imported.md", renderTasks(roadmap));
  return { jsonPath, markdownPath, roadmap };
}
