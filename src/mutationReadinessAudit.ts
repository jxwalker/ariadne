import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { MutationReadinessAudit, MutationReadinessPlan } from "./types.js";

export async function generateMutationReadinessAudit(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; audit: MutationReadinessAudit }> {
  const project = slugifyProject(input.project);
  const plans = await readPlans(input.vaultRoot, project);
  const checks = await Promise.all(plans.map((plan) => auditPlan(input.vaultRoot, project, plan)));
  const summary = {
    plans: plans.length,
    ready: checks.filter((check) => check.status === "passed").length,
    blocked: checks.filter((check) => check.status === "blocked").length,
    retired: checks.filter((check) => check.status === "retired").length,
    approvalRequired: plans.filter((plan) => plan.status === "approval_required").length,
    approvalRejected: plans.filter((plan) => plan.status === "approval_rejected").length,
    missingEvidence: checks.reduce((count, check) => count + check.blockers.filter((item) => item.startsWith("missing evidence")).length, 0),
    unsafeDryRuns: checks.reduce((count, check) => count + check.blockers.filter((item) => item.startsWith("unsafe dry-run")).length, 0),
    executablePlans: plans.filter((plan) => plan.execute !== false).length
  };
  const audit: MutationReadinessAudit = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status: plans.length === 0 ? "empty" : summary.blocked === 0 ? "ready_for_bounded_review" : "blocked",
    mutationAllowed: false,
    summary,
    checks
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "mutation-readiness-audit.json", audit);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control",
    "mutation-readiness-audit.md",
    renderAudit(audit)
  );
  return { jsonPath, markdownPath, audit };
}

async function readPlans(vaultRoot: string, project: string): Promise<MutationReadinessPlan[]> {
  const dir = path.join(projectDir(vaultRoot, project), "control", "mutation-readiness");
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const plans: MutationReadinessPlan[] = [];
  for (const name of names.filter((item) => item.endsWith(".json")).sort()) {
    const value = JSON.parse(await fs.readFile(path.join(dir, name), "utf8")) as MutationReadinessPlan;
    if (value.schemaVersion === 1 && value.project === project && value.id?.startsWith("mutation-readiness-")) {
      plans.push(value);
    }
  }
  return plans;
}

async function auditPlan(
  vaultRoot: string,
  project: string,
  plan: MutationReadinessPlan
): Promise<MutationReadinessAudit["checks"][number]> {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const evidenceRefs = Array.from(new Set([...plan.authEvidenceRefs, ...plan.evidenceRefs]));

  // A plan whose approval was later rejected or expired is closed: retired, not a pending blocker.
  const currentApproval = await currentApprovalRecord(vaultRoot, project, plan.approvalRef);
  const decided = currentApproval?.status;
  if (decided === "rejected" || decided === "expired") {
    return {
      planId: plan.id,
      target: plan.target,
      status: "retired",
      blockers: [],
      warnings: [`approval ${plan.approvalRef} is ${decided}; plan retired and excluded from readiness`],
      evidenceRefs,
      requiredGates: plan.requiredGates
    };
  }

  if (!plan.approvalSha256 || currentApproval?.sha256 !== plan.approvalSha256) {
    blockers.push("current approval record digest is missing or changed");
  }
  if (decided !== "approved") {
    blockers.push(`current approval record is ${decided ?? "missing"}`);
  }

  if (plan.execute !== false) {
    blockers.push("plan is executable; readiness plans must keep execute=false");
  }
  if (plan.status !== "ready_for_bounded_review") {
    blockers.push(`approval state is ${plan.status}`);
  }
  if (plan.approvalStatus !== "approved") {
    blockers.push(`approval record is ${plan.approvalStatus ?? "missing"}`);
  }
  if (plan.authEvidenceRefs.length === 0) {
    blockers.push("auth evidence is missing");
  }
  if (!plan.dryRunCommand.trim()) {
    blockers.push("dry-run command is missing");
  }
  if (unsafeDryRun(plan.dryRunCommand)) {
    blockers.push(`unsafe dry-run command: ${plan.dryRunCommand}`);
  }
  if (!plan.proposedLiveCommand.trim()) {
    blockers.push("proposed live command is missing");
  }
  if (!plan.postVerificationCommand?.trim()) {
    blockers.push("post-action verification command is missing");
  }
  if (!plan.rollback.trim()) {
    blockers.push("rollback is missing");
  }

  const missingEvidence = await missingEvidenceRefs(vaultRoot, project, evidenceRefs);
  blockers.push(...missingEvidence.map((ref) => `missing evidence: ${ref}`));

  if (plan.risk === "high") {
    warnings.push("high-risk plan requires explicit operator review even after this audit passes");
  }
  if (plan.proposedLiveCommand === plan.dryRunCommand) {
    warnings.push("dry-run and live command are identical; confirm the dry-run is non-mutating");
  }

  return {
    planId: plan.id,
    target: plan.target,
    status: blockers.length === 0 ? "passed" : "blocked",
    blockers,
    warnings,
    evidenceRefs,
    requiredGates: plan.requiredGates
  };
}

async function currentApprovalRecord(
  vaultRoot: string,
  project: string,
  approvalRef: string | undefined
): Promise<{ status?: string; sha256: string } | undefined> {
  if (!approvalRef || !/^approval-[A-Za-z0-9T:.-]+$/.test(approvalRef)) return undefined;
  try {
    const raw = await fs.readFile(path.join(projectDir(vaultRoot, project), "control", "approvals", `${approvalRef}.json`));
    const record = JSON.parse(raw.toString("utf8")) as { status?: unknown };
    return { status: typeof record.status === "string" ? record.status : undefined, sha256: createHash("sha256").update(raw).digest("hex") };
  } catch {
    return undefined;
  }
}

async function missingEvidenceRefs(vaultRoot: string, project: string, refs: string[]): Promise<string[]> {
  const missing: string[] = [];
  for (const ref of refs) {
    const candidates = [
      path.isAbsolute(ref) ? ref : path.resolve(ref),
      path.join(vaultRoot, ref),
      path.join(projectDir(vaultRoot, project), ref)
    ];
    const exists = await firstExistingPath(candidates);
    if (!exists) missing.push(ref);
  }
  return missing;
}

async function firstExistingPath(candidates: string[]): Promise<string | undefined> {
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try the next candidate
    }
  }
  return undefined;
}

function unsafeDryRun(command: string): boolean {
  return /(^|[\s;&|])(merge|push|delete|remove|rm|create|apply|deploy|enable|disable|install|update|start|stop|restart|submit|headless|auto)(\s|$)/i.test(
    command
  );
}

function renderAudit(audit: MutationReadinessAudit): string {
  return [
    "# Mutation Readiness Audit",
    "",
    `Project: ${audit.project}`,
    `Status: ${audit.status}`,
    `Generated: ${audit.generatedAt}`,
    `Mutation allowed: ${audit.mutationAllowed}`,
    "",
    "## Summary",
    "",
    `- Plans: ${audit.summary.plans}`,
    `- Ready: ${audit.summary.ready}`,
    `- Blocked: ${audit.summary.blocked}`,
    `- Approval required: ${audit.summary.approvalRequired}`,
    `- Approval rejected: ${audit.summary.approvalRejected}`,
    `- Retired: ${audit.summary.retired ?? 0}`,
    `- Missing evidence: ${audit.summary.missingEvidence}`,
    `- Unsafe dry-runs: ${audit.summary.unsafeDryRuns}`,
    `- Executable plans: ${audit.summary.executablePlans}`,
    "",
    "## Checks",
    "",
    "| Plan | Target | Status | Blockers | Warnings |",
    "| --- | --- | --- | --- | --- |",
    ...audit.checks.map(
      (check) =>
        `| ${check.planId} | ${check.target} | ${check.status} | ${inlineList(check.blockers)} | ${inlineList(check.warnings)} |`
    ),
    ""
  ].join("\n");
}

function inlineList(items: string[]): string {
  return items.length === 0 ? "none" : items.join("; ");
}
