import fs from "node:fs/promises";
import path from "node:path";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { ApprovalRecord, MutationReadinessPlan } from "./types.js";

export async function planMutationReadiness(input: {
  project: string;
  vaultRoot: string;
  target: MutationReadinessPlan["target"];
  risk: MutationReadinessPlan["risk"];
  scope: string;
  authEvidenceRefs: string[];
  evidenceRefs: string[];
  dryRunCommand: string;
  proposedLiveCommand: string;
  postVerificationCommand: string;
  rollback: string;
  approvalRef?: string;
  notes?: string;
}): Promise<{ jsonPath: string; markdownPath: string; plan: MutationReadinessPlan }> {
  const project = slugifyProject(input.project);
  const generatedAt = new Date();
  const approval = input.approvalRef ? await readApproval(input.vaultRoot, project, input.approvalRef) : undefined;
  const matchingApproval = approval?.target === input.target ? approval : undefined;
  await assertEvidenceFilesExist(input.vaultRoot, project, input.authEvidenceRefs, "auth evidence");
  const plan: MutationReadinessPlan = {
    schemaVersion: 1,
    id: `mutation-readiness-${input.target}-${timestampFile(generatedAt)}`,
    project,
    generatedAt: generatedAt.toISOString(),
    target: input.target,
    status: readinessStatus(matchingApproval),
    risk: input.risk,
    scope: input.scope,
    approvalRef: matchingApproval?.id,
    approvalStatus: matchingApproval?.status,
    authEvidenceRefs: input.authEvidenceRefs,
    evidenceRefs: input.evidenceRefs,
    dryRunCommand: input.dryRunCommand,
    proposedLiveCommand: input.proposedLiveCommand,
    postVerificationCommand: input.postVerificationCommand,
    rollback: input.rollback,
    requiredGates: requiredGates(input.target),
    notes: input.notes,
    execute: false
  };
  validatePlan(plan);
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control/mutation-readiness", `${plan.id}.json`, plan);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control/mutation-readiness",
    `${plan.id}.md`,
    renderPlan(plan)
  );
  return { jsonPath, markdownPath, plan };
}

export function mutationTargetOption(value: string): MutationReadinessPlan["target"] {
  if (
    value === "github" ||
    value === "deployment" ||
    value === "hermes-cron" ||
    value === "openscorpion" ||
    value === "gsd2" ||
    value === "notebooklm" ||
    value === "generic"
  ) {
    return value;
  }
  throw new Error("--target must be github, deployment, hermes-cron, openscorpion, gsd2, notebooklm, or generic.");
}

async function readApproval(vaultRoot: string, project: string, approval: string): Promise<ApprovalRecord> {
  const approvalPath = approval.endsWith(".json")
    ? path.resolve(approval)
    : path.join(projectDir(vaultRoot, project), "control", "approvals", `${approval}.json`);
  const record = JSON.parse(await fs.readFile(approvalPath, "utf8")) as ApprovalRecord;
  if (record.project !== project) {
    throw new Error(`Approval ${record.id} belongs to ${record.project}, not ${project}.`);
  }
  return record;
}

function readinessStatus(approval: ApprovalRecord | undefined): MutationReadinessPlan["status"] {
  if (!approval) return "approval_required";
  if (approval.status === "approved") return "ready_for_bounded_review";
  if (approval.status === "rejected" || approval.status === "expired") return "approval_rejected";
  return "approval_required";
}

function requiredGates(target: MutationReadinessPlan["target"]): string[] {
  const base = [
    "bounded scope recorded",
    "auth evidence reviewed",
    "dry-run command reviewed",
    "rollback command reviewed",
    "human approval record approved",
    "CodeRabbit or human review approval",
    "post-action verification command defined"
  ];
  const targetGate =
    target === "deployment"
      ? "deployment target and rollback host verified"
      : target === "github"
        ? "branch, PR, and merge policy verified"
        : target === "hermes-cron"
          ? "scheduler auth, disable path, and next-run behavior verified"
          : target === "openscorpion"
            ? "governed submission route and non-public payload policy verified"
            : target === "notebooklm"
              ? "NotebookLM auth, terms, and export stability verified"
              : target === "gsd2"
                ? "local GSD2 process path and file contract verified"
                : "target-specific rollback verified";
  return [...base, targetGate];
}

function validatePlan(plan: MutationReadinessPlan): void {
  if (plan.authEvidenceRefs.length === 0) {
    throw new Error("--auth-evidence is required for mutation readiness.");
  }
  if (!plan.dryRunCommand.trim()) {
    throw new Error("--dry-run is required for mutation readiness.");
  }
  if (!plan.proposedLiveCommand.trim()) {
    throw new Error("--live-command is required for mutation readiness.");
  }
  if (!plan.postVerificationCommand?.trim()) {
    throw new Error("--post-verify is required for mutation readiness.");
  }
  if (!plan.rollback.trim()) {
    throw new Error("--rollback is required for mutation readiness.");
  }
  if (plan.execute !== false) {
    throw new Error("Mutation readiness plans must not execute live commands.");
  }
}

async function assertEvidenceFilesExist(vaultRoot: string, project: string, refs: string[], label: string): Promise<void> {
  for (const ref of refs) {
    const candidates = path.isAbsolute(ref)
      ? [ref]
      : [path.resolve(ref), path.join(vaultRoot, ref), path.join(projectDir(vaultRoot, project), ref)];
    let found = false;
    for (const candidate of candidates) {
      try {
        await fs.access(candidate);
        found = true;
        break;
      } catch {
        // try next candidate
      }
    }
    if (!found) throw new Error(`Missing ${label}: ${ref}`);
  }
}

function renderPlan(plan: MutationReadinessPlan): string {
  return [
    `# Mutation Readiness: ${plan.target}`,
    "",
    `Id: ${plan.id}`,
    `Status: ${plan.status}`,
    `Risk: ${plan.risk}`,
    `Generated: ${plan.generatedAt}`,
    `Execute: ${plan.execute}`,
    plan.approvalRef ? `Approval: ${plan.approvalRef} (${plan.approvalStatus ?? "unknown"})` : "Approval: missing",
    "",
    "## Scope",
    "",
    plan.scope,
    "",
    "## Auth Evidence",
    "",
    ...list(plan.authEvidenceRefs),
    "",
    "## Supporting Evidence",
    "",
    ...list(plan.evidenceRefs),
    "",
    "## Dry Run",
    "",
    "```bash",
    plan.dryRunCommand,
    "```",
    "",
    "## Proposed Live Command",
    "",
    "```bash",
    plan.proposedLiveCommand,
    "```",
    "",
    "## Post-Action Verification",
    "",
    "```bash",
    plan.postVerificationCommand ?? "",
    "```",
    "",
    "## Rollback",
    "",
    plan.rollback,
    "",
    "## Required Gates",
    "",
    ...list(plan.requiredGates),
    ...(plan.notes ? ["", "## Notes", "", plan.notes] : []),
    ""
  ].join("\n");
}

function list(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}
