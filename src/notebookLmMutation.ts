import { planMutationReadiness } from "./mutationReadiness.js";
import { slugifyProject } from "./paths.js";
import type { MutationReadinessPlan } from "./types.js";

export type NotebookLmMutationAction = "create-source" | "refresh-source" | "generate-summary" | "export-notes";

export async function planNotebookLmMutation(input: {
  project: string;
  vaultRoot: string;
  notebook: string;
  action: NotebookLmMutationAction;
  scope: string;
  authEvidenceRefs: string[];
  evidenceRefs: string[];
  dryRunCommand: string;
  liveCommand: string;
  postVerificationCommand: string;
  rollback: string;
  approvalRef?: string;
  risk: MutationReadinessPlan["risk"];
  notes?: string;
}): Promise<Awaited<ReturnType<typeof planMutationReadiness>>> {
  const project = slugifyProject(input.project);
  const notebook = validateLabel(input.notebook, "--notebook");
  const action = notebookLmMutationActionOption(input.action);
  const scope = validateText(input.scope, "--scope");
  const rollback = validateText(input.rollback, "--rollback");
  return planMutationReadiness({
    project,
    vaultRoot: input.vaultRoot,
    target: "notebooklm",
    risk: input.risk,
    scope: `notebooklm/${action}/${notebook}: ${scope}`,
    authEvidenceRefs: input.authEvidenceRefs,
    evidenceRefs: input.evidenceRefs,
    dryRunCommand: input.dryRunCommand,
    proposedLiveCommand: input.liveCommand,
    postVerificationCommand: input.postVerificationCommand,
    rollback: `notebooklm/${action}/${notebook}: ${rollback}`,
    approvalRef: input.approvalRef,
    notes: input.notes
  });
}

export function notebookLmMutationActionOption(value: string): NotebookLmMutationAction {
  if (
    value === "create-source" ||
    value === "refresh-source" ||
    value === "generate-summary" ||
    value === "export-notes"
  ) {
    return value;
  }
  throw new Error("--action must be create-source, refresh-source, generate-summary, or export-notes.");
}

function validateLabel(value: string, option: string): string {
  const normalized = value.trim();
  if (!normalized || !/^[A-Za-z0-9_.: -]+$/.test(normalized)) {
    throw new Error(`${option} may only contain letters, numbers, spaces, dots, underscores, colons, and hyphens.`);
  }
  return normalized;
}

function validateText(value: string, option: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${option} is required for NotebookLM mutation planning.`);
  }
  return normalized;
}
