import { liveDeploymentSystemOption } from "./deploymentAdapters.js";
import { planMutationReadiness } from "./mutationReadiness.js";
import { slugifyProject } from "./paths.js";
import type { DeploymentSnapshot, MutationReadinessPlan } from "./types.js";

export type DeploymentMutationSystem = Exclude<DeploymentSnapshot["system"], "github" | "generic">;

export async function planDeploymentMutation(input: {
  project: string;
  vaultRoot: string;
  system: DeploymentMutationSystem;
  host: string;
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
  const system = liveDeploymentSystemOption(input.system);
  const host = validateHost(input.host);
  const scope = validateText(input.scope, "--scope");
  const rollback = validateText(input.rollback, "--rollback");
  return planMutationReadiness({
    project,
    vaultRoot: input.vaultRoot,
    target: "deployment",
    risk: input.risk,
    scope: `${system}/${host}: ${scope}`,
    authEvidenceRefs: input.authEvidenceRefs,
    evidenceRefs: input.evidenceRefs,
    dryRunCommand: input.dryRunCommand,
    proposedLiveCommand: input.liveCommand,
    postVerificationCommand: input.postVerificationCommand,
    rollback: `${system}/${host}: ${rollback}`,
    approvalRef: input.approvalRef,
    notes: input.notes
  });
}

function validateHost(host: string): string {
  const normalized = host.trim();
  if (!normalized || !/^[A-Za-z0-9_.: -]+$/.test(normalized)) {
    throw new Error("--host may only contain letters, numbers, spaces, dots, underscores, colons, and hyphens.");
  }
  return normalized;
}

function validateText(value: string, option: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${option} is required for deployment mutation planning.`);
  }
  return normalized;
}
