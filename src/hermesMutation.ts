import { planMutationReadiness } from "./mutationReadiness.js";
import { slugifyProject } from "./paths.js";
import type { MutationReadinessPlan } from "./types.js";

export type HermesCronMutationAction = "create" | "update" | "enable" | "disable" | "delete";

export async function planHermesCronMutation(input: {
  project: string;
  vaultRoot: string;
  action: HermesCronMutationAction;
  job: string;
  host?: string;
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
  const action = hermesCronMutationActionOption(input.action);
  const job = validateLabel(input.job, "--job");
  const host = input.host ? validateLabel(input.host, "--host") : "default";
  const scope = validateText(input.scope, "--scope");
  const rollback = validateText(input.rollback, "--rollback");
  return planMutationReadiness({
    project,
    vaultRoot: input.vaultRoot,
    target: "hermes-cron",
    risk: input.risk,
    scope: `hermes-cron/${host}/${action}/${job}: ${scope}`,
    authEvidenceRefs: input.authEvidenceRefs,
    evidenceRefs: input.evidenceRefs,
    dryRunCommand: input.dryRunCommand,
    proposedLiveCommand: input.liveCommand,
    postVerificationCommand: input.postVerificationCommand,
    rollback: `hermes-cron/${host}/${action}/${job}: ${rollback}`,
    approvalRef: input.approvalRef,
    notes: input.notes
  });
}

export function hermesCronMutationActionOption(value: string): HermesCronMutationAction {
  if (value === "create" || value === "update" || value === "enable" || value === "disable" || value === "delete") {
    return value;
  }
  throw new Error("--action must be create, update, enable, disable, or delete.");
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
    throw new Error(`${option} is required for Hermes cron mutation planning.`);
  }
  return normalized;
}
