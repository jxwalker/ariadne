import { readMutationPlan } from "./mutationCommand.js";
import { runMutationExecution } from "./mutationExecute.js";
import { slugifyProject } from "./paths.js";
import type { MutationExecutionRecord, MutationReadinessPlan } from "./types.js";

const targetExecutionCommands = {
  "github-mutation-execute": "github",
  "deployment-mutation-execute": "deployment",
  "hermes-cron-mutation-execute": "hermes-cron",
  "openscorpion-mutation-execute": "openscorpion",
  "gsd2-mutation-execute": "gsd2",
  "notebooklm-mutation-execute": "notebooklm"
} as const satisfies Record<string, MutationReadinessPlan["target"]>;

export function targetForMutationExecutionCommand(command: string): MutationReadinessPlan["target"] | undefined {
  return targetExecutionCommands[command as keyof typeof targetExecutionCommands];
}

export async function runTargetMutationExecution(input: {
  project: string;
  vaultRoot: string;
  target: MutationReadinessPlan["target"];
  plan: string;
  confirmPlan: string;
  timeoutMs?: number;
}): Promise<{ jsonPath: string; markdownPath: string; record: MutationExecutionRecord }> {
  const project = slugifyProject(input.project);
  const plan = await readMutationPlan(input.vaultRoot, project, input.plan);
  if (plan.target !== input.target) {
    throw new Error(`Readiness plan ${plan.id} targets ${plan.target}, not ${input.target}.`);
  }
  return runMutationExecution({
    project,
    vaultRoot: input.vaultRoot,
    plan: input.plan,
    confirmPlan: input.confirmPlan,
    timeoutMs: input.timeoutMs
  });
}
