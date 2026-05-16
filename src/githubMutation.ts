import { planMutationReadiness } from "./mutationReadiness.js";
import { slugifyProject } from "./paths.js";
import type { MutationReadinessPlan } from "./types.js";

export type GithubMutationAction = "merge-pr" | "rerun-failed-run";

export async function planGithubMutation(input: {
  project: string;
  vaultRoot: string;
  repository: string;
  action: GithubMutationAction;
  pullRequest?: number;
  runId?: string;
  authEvidenceRefs: string[];
  evidenceRefs: string[];
  approvalRef?: string;
  risk: MutationReadinessPlan["risk"];
  notes?: string;
}): Promise<Awaited<ReturnType<typeof planMutationReadiness>>> {
  const project = slugifyProject(input.project);
  const repository = validateRepository(input.repository);
  const commands = githubMutationCommands({ ...input, repository });
  return planMutationReadiness({
    project,
    vaultRoot: input.vaultRoot,
    target: "github",
    risk: input.risk,
    scope: commands.scope,
    authEvidenceRefs: input.authEvidenceRefs,
    evidenceRefs: input.evidenceRefs,
    dryRunCommand: commands.dryRunCommand,
    proposedLiveCommand: commands.liveCommand,
    postVerificationCommand: commands.postVerificationCommand,
    rollback: commands.rollback,
    approvalRef: input.approvalRef,
    notes: input.notes
  });
}

export function githubMutationActionOption(value: string): GithubMutationAction {
  if (value === "merge-pr" || value === "rerun-failed-run") return value;
  throw new Error("--action must be merge-pr or rerun-failed-run.");
}

function githubMutationCommands(input: {
  repository: string;
  action: GithubMutationAction;
  pullRequest?: number;
  runId?: string;
}): {
  scope: string;
  dryRunCommand: string;
  liveCommand: string;
  postVerificationCommand: string;
  rollback: string;
} {
  if (input.action === "merge-pr") {
    const pullRequest = requirePullRequest(input.pullRequest);
    return {
      scope: `Merge PR #${pullRequest} in ${input.repository} with squash merge and branch deletion.`,
      dryRunCommand: `gh pr view ${pullRequest} --repo ${shellQuote(input.repository)} --json mergeStateStatus,reviewDecision,statusCheckRollup,isDraft`,
      liveCommand: `gh pr merge ${pullRequest} --repo ${shellQuote(input.repository)} --squash --delete-branch`,
      postVerificationCommand: `gh pr view ${pullRequest} --repo ${shellQuote(input.repository)} --json state,mergedAt,mergeCommit`,
      rollback: `Revert the squash merge commit for PR #${pullRequest} in ${input.repository}; recreate the branch if follow-up work is needed.`
    };
  }

  const runId = requireRunId(input.runId);
  return {
    scope: `Rerun failed jobs for GitHub Actions run ${runId} in ${input.repository}.`,
    dryRunCommand: `gh run view ${shellQuote(runId)} --repo ${shellQuote(input.repository)} --json status,conclusion,url,workflowName`,
    liveCommand: `gh run rerun ${shellQuote(runId)} --repo ${shellQuote(input.repository)} --failed`,
    postVerificationCommand: `gh run view ${shellQuote(runId)} --repo ${shellQuote(input.repository)} --json status,conclusion,url,workflowName`,
    rollback: `Cancel run ${runId} in ${input.repository} if the rerun creates an unsafe or unintended workflow execution.`
  };
}

function validateRepository(repository: string): string {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error("--repo must be an owner/name GitHub repository.");
  }
  return repository;
}

function requirePullRequest(value: number | undefined): number {
  if (!value || !Number.isInteger(value) || value <= 0) {
    throw new Error("--pr is required for merge-pr.");
  }
  return value;
}

function requireRunId(value: string | undefined): string {
  if (!value || !/^[0-9]+$/.test(value)) {
    throw new Error("--run-id is required for rerun-failed-run.");
  }
  return value;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}
