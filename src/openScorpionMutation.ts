import { planMutationReadiness } from "./mutationReadiness.js";
import { slugifyProject } from "./paths.js";
import type { MutationReadinessPlan } from "./types.js";

export type OpenScorpionMutationAction = "submit-activity" | "update-activity" | "withdraw-activity";
export type OpenScorpionMutationRoute = "governed" | "staging";

export async function planOpenScorpionMutation(input: {
  project: string;
  vaultRoot: string;
  activity: string;
  activityType: string;
  action: OpenScorpionMutationAction;
  route: OpenScorpionMutationRoute;
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
  const activity = validateIdentifier(input.activity, "--activity");
  const activityType = validateIdentifier(input.activityType, "--type");
  const action = openScorpionMutationActionOption(input.action);
  const route = openScorpionMutationRouteOption(input.route);
  const scope = validateText(input.scope, "--scope");
  const rollback = validateText(input.rollback, "--rollback");
  return planMutationReadiness({
    project,
    vaultRoot: input.vaultRoot,
    target: "openscorpion",
    risk: input.risk,
    scope: `openscorpion/${route}/${action}/${activityType}/${activity}: ${scope}`,
    authEvidenceRefs: input.authEvidenceRefs,
    evidenceRefs: input.evidenceRefs,
    dryRunCommand: input.dryRunCommand,
    proposedLiveCommand: input.liveCommand,
    postVerificationCommand: input.postVerificationCommand,
    rollback: `openscorpion/${route}/${action}/${activityType}/${activity}: ${rollback}`,
    approvalRef: input.approvalRef,
    notes: input.notes
  });
}

export function openScorpionMutationActionOption(value: string): OpenScorpionMutationAction {
  if (value === "submit-activity" || value === "update-activity" || value === "withdraw-activity") return value;
  throw new Error("--action must be submit-activity, update-activity, or withdraw-activity.");
}

export function openScorpionMutationRouteOption(value: string): OpenScorpionMutationRoute {
  if (value === "governed" || value === "staging") return value;
  throw new Error("--route must be governed or staging.");
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
    throw new Error(`${option} is required for OpenScorpion mutation planning.`);
  }
  return normalized;
}
