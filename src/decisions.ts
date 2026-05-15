import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { slugifyProject } from "./paths.js";
import type { DecisionRecord } from "./types.js";

export async function recordDecision(input: {
  project: string;
  vaultRoot: string;
  title: string;
  status?: DecisionRecord["status"];
  context: string;
  decision: string;
  consequences: string[];
  sourceRefs: string[];
}): Promise<{ jsonPath: string; markdownPath: string; decision: DecisionRecord }> {
  const project = slugifyProject(input.project);
  const decision: DecisionRecord = {
    schemaVersion: 1,
    id: `decision-${timestampFile()}`,
    project,
    recordedAt: new Date().toISOString(),
    title: input.title,
    status: input.status ?? "accepted",
    context: input.context,
    decision: input.decision,
    consequences: input.consequences,
    sourceRefs: input.sourceRefs
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "decisions", `${decision.id}.json`, decision);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "decisions", `${decision.id}.md`, renderDecision(decision));
  return { jsonPath, markdownPath, decision };
}

function renderDecision(decision: DecisionRecord): string {
  return [
    `# ${decision.id}: ${decision.title}`,
    "",
    `Status: ${decision.status}`,
    `Recorded: ${decision.recordedAt}`,
    "",
    "## Context",
    "",
    decision.context,
    "",
    "## Decision",
    "",
    decision.decision,
    "",
    "## Consequences",
    "",
    ...decision.consequences.map((item) => `- ${item}`),
    "",
    "## Sources",
    "",
    ...decision.sourceRefs.map((item) => `- ${item}`),
    ""
  ].join("\n");
}
