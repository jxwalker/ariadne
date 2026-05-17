import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateLiveAdapterNextActions } from "./liveAdapterNextActions.js";
import { generateMutationReadinessAudit } from "./mutationReadinessAudit.js";
import { slugifyProject } from "./paths.js";
import type { LiveAdapterNextActionsReport, MutationReadinessAudit, MutationReadinessPlan, MutationReadinessRepairPlan } from "./types.js";

type LiveTarget = Exclude<MutationReadinessPlan["target"], "generic">;
type AuditCheck = MutationReadinessAudit["checks"][number];

export async function generateMutationReadinessRepairPlan(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; report: MutationReadinessRepairPlan }> {
  const project = slugifyProject(input.project);
  const auditResult = await generateMutationReadinessAudit({ project, vaultRoot: input.vaultRoot });
  const nextActionsResult = await generateLiveAdapterNextActions({ project, vaultRoot: input.vaultRoot });
  const targets = buildTargets(auditResult.audit, nextActionsResult.report);
  const summary = {
    targets: targets.length,
    auditPassed: targets.filter((target) => target.status === "audit_passed").length,
    missingPlans: targets.filter((target) => target.status === "missing_plan").length,
    repairablePlans: targets.filter((target) => target.status === "repairable_plan").length,
    operatorActionRequired: targets.filter((target) => target.status === "operator_action_required").length,
    blocked: targets.filter((target) => target.status === "blocked").length
  };
  const report: MutationReadinessRepairPlan = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status: targets.every((target) => target.status === "audit_passed") ? "complete" : "actions_required",
    mutationAllowed: false,
    mutationReadinessAuditRef: path.relative(input.vaultRoot, auditResult.jsonPath),
    liveAdapterNextActionsRef: path.relative(input.vaultRoot, nextActionsResult.jsonPath),
    summary,
    targets
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "mutation-readiness-repair-plan.json", report);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control",
    "mutation-readiness-repair-plan.md",
    renderReport(report)
  );
  return { jsonPath, markdownPath, report };
}

function buildTargets(
  audit: MutationReadinessAudit,
  nextActions: LiveAdapterNextActionsReport
): MutationReadinessRepairPlan["targets"] {
  return nextActions.targets.map((target) => {
    const checks = audit.checks.filter((check) => check.target === target.target);
    const latestCheck = latestCheckForTarget(checks);
    const blockers = unique(latestCheck?.blockers ?? []);
    const repairableBlockers = blockers.filter(isRepairableBlocker);
    const operatorBlockers = blockers.filter(isOperatorBlocker);
    const remainingBlockers = blockers.filter((blocker) => !repairableBlockers.includes(blocker) && !operatorBlockers.includes(blocker));
    const status = targetStatus(latestCheck, repairableBlockers, operatorBlockers, remainingBlockers);
    return {
      target: target.target,
      status,
      latestPlanId: latestCheck?.planId,
      blockers,
      repairableBlockers,
      operatorBlockers,
      remainingBlockers,
      approvalCommand: approvalCommand(target.target),
      regenerationCommand: regenerationCommand(target.target),
      nextActionCommands: target.actions.map((action) => action.command).filter(isString),
      evidenceRefs: unique(target.actions.flatMap((action) => action.evidenceRefs))
    };
  });
}

function latestCheckForTarget(checks: AuditCheck[]): AuditCheck | undefined {
  return [...checks].sort((left, right) => left.planId.localeCompare(right.planId)).at(-1);
}

function targetStatus(
  latestCheck: AuditCheck | undefined,
  repairableBlockers: string[],
  operatorBlockers: string[],
  remainingBlockers: string[]
): MutationReadinessRepairPlan["targets"][number]["status"] {
  if (!latestCheck) return "missing_plan";
  if (latestCheck.status === "passed") return "audit_passed";
  if (operatorBlockers.length > 0) return "operator_action_required";
  if (repairableBlockers.length > 0) return "repairable_plan";
  return "blocked";
}

function isRepairableBlocker(blocker: string): boolean {
  return (
    blocker === "plan is executable; readiness plans must keep execute=false" ||
    blocker === "dry-run command is missing" ||
    blocker.startsWith("unsafe dry-run command:") ||
    blocker === "proposed live command is missing" ||
    blocker === "post-action verification command is missing" ||
    blocker === "rollback is missing"
  );
}

function isOperatorBlocker(blocker: string): boolean {
  return (
    blocker.startsWith("approval state is ") ||
    blocker.startsWith("approval record is ") ||
    blocker === "auth evidence is missing" ||
    blocker.startsWith("missing evidence:")
  );
}

function approvalCommand(target: LiveTarget): string {
  return `npm run ariadne -- approval-request --project <project> --by <operator> --target ${target} --action "<bounded action>" --risk <low|medium|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence>`;
}

function regenerationCommand(target: LiveTarget): string {
  switch (target) {
    case "github":
      return "npm run ariadne -- github-mutation-plan --project <project> --repo <owner/name> --action <merge-pr|rerun-failed-run> --auth-evidence <paths> --approval <approval-id>";
    case "deployment":
      return "npm run ariadne -- deployment-mutation-plan --project <project> --system <proxmox|truenas|dgx-spark|mac> --host <host> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>";
    case "hermes-cron":
      return "npm run ariadne -- hermes-cron-mutation-plan --project <project> --action <create|update|enable|disable|delete> --job <id> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>";
    case "openscorpion":
      return "npm run ariadne -- openscorpion-mutation-plan --project <project> --activity <id> --type <type> --action <submit-activity|update-activity|withdraw-activity> --route <governed|staging> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>";
    case "gsd2":
      return "npm run ariadne -- gsd2-mutation-plan --project <project> --task <id> --mode <headless|auto|worktree> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>";
    case "notebooklm":
      return "npm run ariadne -- notebooklm-mutation-plan --project <project> --notebook <id> --action <create-source|refresh-source|generate-summary|export-notes> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>";
  }
}

function renderReport(report: MutationReadinessRepairPlan): string {
  return [
    "# Mutation Readiness Repair Plan",
    "",
    `Project: ${report.project}`,
    `Status: ${report.status}`,
    `Generated: ${report.generatedAt}`,
    `Mutation allowed: ${report.mutationAllowed}`,
    `Mutation readiness audit: ${report.mutationReadinessAuditRef}`,
    `Live adapter next actions: ${report.liveAdapterNextActionsRef}`,
    "",
    "## Summary",
    "",
    `- Targets: ${report.summary.targets}`,
    `- Audit passed: ${report.summary.auditPassed}`,
    `- Missing plans: ${report.summary.missingPlans}`,
    `- Repairable plans: ${report.summary.repairablePlans}`,
    `- Operator action required: ${report.summary.operatorActionRequired}`,
    `- Blocked: ${report.summary.blocked}`,
    "",
    "## Targets",
    "",
    "| Target | Status | Latest plan | Repairable blockers | Operator blockers | Regeneration command |",
    "| --- | --- | --- | --- | --- | --- |",
    ...report.targets.map(
      (target) =>
        `| ${target.target} | ${target.status} | ${target.latestPlanId ?? "none"} | ${tableCell(inlineList(target.repairableBlockers))} | ${tableCell(inlineList(target.operatorBlockers))} | ${tableCell(target.regenerationCommand)} |`
    ),
    "",
    "## Target Commands",
    "",
    ...report.targets.flatMap((target) => [
      `### ${target.target}`,
      "",
      `Status: ${target.status}`,
      `Latest plan: ${target.latestPlanId ?? "none"}`,
      "",
      ...approvalRequestSection(target.approvalCommand),
      "",
      "#### Regeneration",
      "",
      "```bash",
      target.regenerationCommand,
      "```",
      "",
      "#### Next Action Commands",
      "",
      ...list(target.nextActionCommands),
      "",
      "#### Evidence Refs",
      "",
      ...list(target.evidenceRefs),
      ""
    ]),
    "",
    "## Notes",
    "",
    "- This report never imports evidence, grants approval, runs dry-runs, or executes live commands.",
    "- Regeneration commands are scaffolds for operator-reviewed target-specific plans; fill every placeholder from verified evidence before running them.",
    ""
  ].join("\n");
}

function inlineList(items: string[]): string {
  return items.length > 0 ? items.join("; ") : "none";
}

function approvalRequestSection(command: string | undefined): string[] {
  if (!command) return ["#### Approval Request", "", "No approval request command is available for this target."];
  return ["#### Approval Request", "", "```bash", command, "```"];
}

function list(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}

function tableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}

function isString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}
