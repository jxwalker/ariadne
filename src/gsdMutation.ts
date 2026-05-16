import { planMutationReadiness } from "./mutationReadiness.js";
import { slugifyProject } from "./paths.js";
import type { MutationReadinessPlan } from "./types.js";

export type Gsd2MutationMode = "headless" | "auto" | "worktree";

export async function planGsd2Mutation(input: {
  project: string;
  vaultRoot: string;
  task: string;
  mode: Gsd2MutationMode;
  packageName?: string;
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
  const mode = gsd2MutationModeOption(input.mode);
  const task = validateIdentifier(input.task, "--task");
  const packageName = input.packageName ? validateIdentifier(input.packageName, "--package") : "default";
  const scope = validateText(input.scope, "--scope");
  const rollback = validateText(input.rollback, "--rollback");
  return planMutationReadiness({
    project,
    vaultRoot: input.vaultRoot,
    target: "gsd2",
    risk: input.risk,
    scope: `gsd2/${packageName}/${mode}/${task}: ${scope}`,
    authEvidenceRefs: input.authEvidenceRefs,
    evidenceRefs: input.evidenceRefs,
    dryRunCommand: input.dryRunCommand,
    proposedLiveCommand: input.liveCommand,
    postVerificationCommand: input.postVerificationCommand,
    rollback: `gsd2/${packageName}/${mode}/${task}: ${rollback}`,
    approvalRef: input.approvalRef,
    notes: input.notes
  });
}

export function gsd2MutationModeOption(value: string): Gsd2MutationMode {
  if (value === "headless" || value === "auto" || value === "worktree") return value;
  throw new Error("--mode must be headless, auto, or worktree.");
}

function validateIdentifier(value: string, option: string): string {
  const normalized = value.trim();
  if (!normalized || !/^[A-Za-z0-9_.:-]+$/.test(normalized)) {
    throw new Error(`${option} may only contain letters, numbers, dots, underscores, colons, and hyphens.`);
  }
  return normalized;
}

function validateText(value: string, option: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${option} is required for GSD2 mutation planning.`);
  }
  return normalized;
}
