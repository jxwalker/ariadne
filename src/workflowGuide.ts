import path from "node:path";
import { collectConsoleData, generateConsoleData } from "./consoleData.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { ConsoleData, ConsoleWorkflowMode } from "./types.js";

export type WorkflowGuideMode = ConsoleWorkflowMode["id"];

export interface WorkflowGuideInput {
  project: string;
  vaultRoot: string;
  mode: WorkflowGuideMode;
  refreshData?: boolean;
  showCommands?: boolean;
}

export interface WorkflowGuideResult {
  text: string;
  data: ConsoleData;
  dataPath?: string;
}

export async function generateWorkflowGuide(input: WorkflowGuideInput): Promise<WorkflowGuideResult> {
  const project = slugifyProject(input.project);
  const generated = input.refreshData ? await generateConsoleData({ project, vaultRoot: input.vaultRoot }) : undefined;
  const data = generated?.data ?? (await collectConsoleData(input.vaultRoot, project));
  return {
    text: renderWorkflowGuide(data, {
      mode: input.mode,
      showCommands: input.showCommands,
      vaultRoot: input.vaultRoot
    }),
    data,
    dataPath: generated?.jsonPath
  };
}

export function renderWorkflowGuide(
  data: ConsoleData,
  options: { mode: WorkflowGuideMode; showCommands?: boolean; vaultRoot?: string }
): string {
  if (!data.workflow || !Array.isArray(data.workflow.stages) || !Array.isArray(data.workflow.nextAction?.steps)) {
    throw new Error("Console workflow data is malformed.");
  }
  const mode = data.workflow.modes.find((candidate) => candidate.id === options.mode);
  if (!mode) {
    throw new Error(`Workflow mode is not present in console data: ${options.mode}`);
  }
  const commandVisible = Boolean(options.showCommands || mode?.id === "developer" || mode?.id === "operator");
  const consolePath = path.join(projectDir(options.vaultRoot ?? "vault", data.project), "console", "index.html");
  const lines = [
    `Ariadne guide: ${data.project}`,
    `Console: ${consolePath}`,
    "",
    `Mode: ${mode?.label ?? options.mode}`,
    mode ? `For: ${mode.audience}` : undefined,
    mode ? `Use: ${surfaceLabel(data, mode.primarySurface)} primary; ${mode.supportSurfaces.map((id) => surfaceLabel(data, id)).join(", ")} support.` : undefined,
    mode ? `Command policy: ${mode.commandPolicy}` : undefined,
    mode ? `Next: ${mode.nextStep}` : undefined,
    "",
    "Workflow:",
    ...data.workflow.stages.map((stage) => `- ${stage.label}: ${stage.status} - ${stage.detail}`),
    "",
    `Next best action: ${data.workflow.nextAction.title}`,
    `Status: ${data.workflow.nextAction.status}`,
    `Why: ${data.workflow.nextAction.detail}`,
    `Artifact: ${data.workflow.nextAction.artifactRef}`,
    "",
    "Steps:",
    ...data.workflow.nextAction.steps.flatMap((step, index) => {
      const stepLines = [
        `${index + 1}. ${step.title} [${surfaceLabel(data, step.surface)} / ${step.kind}]`,
        `   ${step.detail}`
      ];
      if (step.artifactRef) stepLines.push(`   Artifact: ${step.artifactRef}`);
      if (commandVisible && step.command) stepLines.push(`   Command: ${step.command}`);
      return stepLines;
    }),
    ...operatorChecklistLines(data, commandVisible),
    "",
    "Interaction routes:",
    ...data.workflow.routes.flatMap((route) => {
      const lines = [
        `- ${route.label}${route.current ? " (current)" : ""}: ${route.summary}`,
        `  For: ${route.audience}`,
        `  Surface: ${surfaceLabel(data, route.primarySurface)} primary; ${route.supportSurfaces.map((id) => surfaceLabel(data, id)).join(", ")} support.`
      ];
      for (const step of route.steps) {
        lines.push(`  - ${step.title} [${stageLabel(data, step.stage)} / ${surfaceLabel(data, step.surface)}]: ${step.detail}`);
        if (step.artifactRef) lines.push(`    Artifact: ${step.artifactRef}`);
        if (commandVisible && step.command) lines.push(`    Command: ${step.command}`);
      }
      return lines;
    }),
    "",
    "Surface rule:",
    "Ariadne Console is the human cockpit. Hermes is the runtime backplane for scheduling, sleep, memory, mail, and coordination. NotebookLM and GBrain provide source and memory context. The ariadne runner is the expert automation surface behind the UI."
  ];
  if (!commandVisible) {
    lines.splice(
      lines.length - 2,
      0,
      "Commands are hidden in this mode. Add --show-commands or use --mode developer/operator when you need the runner details."
    );
  }

  return lines.join("\n");
}

function surfaceLabel(data: ConsoleData, id: string): string {
  return data.workflow.surfaces.find((surface) => surface.id === id)?.label ?? id;
}

function stageLabel(data: ConsoleData, id: string): string {
  return data.workflow.stages.find((stage) => stage.id === id)?.label ?? id;
}

function operatorChecklistLines(data: ConsoleData, commandVisible: boolean): string[] {
  const checklist = data.workflow.operatorChecklist;
  if (!checklist) return [];
  return [
    "",
    `Evidence checklist: ${checklist.target} (${checklist.missingSections} missing)`,
    `Evidence file: ${checklist.evidenceFileRef}`,
    `Assist file: ${checklist.assistFileRef}`,
    ...checklist.sections.flatMap((section, index) => {
      const lines = [
        `${index + 1}. ${section.missingSection}`,
        `   Prompt: ${section.prompt}`,
        `   Start with: ${section.startWith}`,
        `   Record in: ${section.recordIn}`,
        `   Preflight: ${section.preflight}`,
        `   Context: ${section.existingEvidenceRefs.length} existing ref(s), ${section.promotedLiveEvidenceRefs.length} promoted live ref(s), ${section.gbrainQueries.length} GBrain quer${section.gbrainQueries.length === 1 ? "y" : "ies"}`
      ];
      return lines;
    }),
    ...(commandVisible
      ? [`Preflight command: ${checklist.checkCommand}`, `Import command after human verification: ${checklist.importCommand}`]
      : [])
  ];
}
