import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateLiveAdapterNextActions } from "./liveAdapterNextActions.js";
import { isLiveAdapterTarget, LIVE_ADAPTER_TARGETS } from "./liveAdapterTargets.js";
import { slugifyProject } from "./paths.js";
import type { LiveAdapterApprovalPack, LiveAdapterNextActionsReport } from "./types.js";

type ApprovalTarget = LiveAdapterApprovalPack["packets"][number]["target"];
type NextActionTarget = LiveAdapterNextActionsReport["targets"][number];

export async function generateLiveAdapterApprovalPack(input: {
  project: string;
  vaultRoot: string;
  target?: ApprovalTarget | "all";
}): Promise<{ jsonPath: string; markdownPath: string; report: LiveAdapterApprovalPack }> {
  const project = slugifyProject(input.project);
  const nextActions = await generateLiveAdapterNextActions({ project, vaultRoot: input.vaultRoot });
  const requestedTarget = input.target && input.target !== "all" ? input.target : undefined;
  const selectedTargets = requestedTarget
    ? nextActions.report.targets.filter((target) => target.target === requestedTarget)
    : nextActions.report.targets;
  if (requestedTarget && selectedTargets.length === 0) {
    throw new Error(`No live-adapter target named ${requestedTarget}.`);
  }

  const packets = selectedTargets
    .filter((target) => target.readinessStatus === "blocked")
    .map((target) => targetApprovalPacket(project, target));
  const report: LiveAdapterApprovalPack = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status: packets.length === 0 ? "complete" : "ready_for_operator_review",
    summary: {
      targets: selectedTargets.length,
      packets: packets.length,
      blockedTargets: selectedTargets.filter((target) => target.readinessStatus === "blocked").length,
      readyTargets: selectedTargets.filter((target) => target.readinessStatus === "ready_for_adapter").length
    },
    nextActionsRef: path.relative(input.vaultRoot, nextActions.jsonPath),
    packets
  };
  const fileStem = requestedTarget ? `live-adapter-approval-pack-${requestedTarget}` : "live-adapter-approval-pack";
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", `${fileStem}.json`, report);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control",
    `${fileStem}.md`,
    renderReport(report)
  );
  return { jsonPath, markdownPath, report };
}

export function liveAdapterApprovalTargetOption(value: string): ApprovalTarget | "all" {
  if (value === "all" || isLiveAdapterTarget(value)) {
    return value;
  }
  throw new Error(`--target must be all, ${LIVE_ADAPTER_TARGETS.join(", ")}.`);
}

function targetApprovalPacket(project: string, target: NextActionTarget): LiveAdapterApprovalPack["packets"][number] {
  return {
    target: target.target,
    readinessStatus: target.readinessStatus,
    recommendedRisk: recommendedRisk(target.target),
    operatorDecisionRequired: true,
    approvalRequestCommand: approvalRequestCommand(project, target.target),
    requiredEvidence: requiredEvidence(target.target),
    mutationPlanCommand: target.actions.find((action) => action.id.endsWith("-mutation-plan"))?.command ?? planFallback(target.target),
    dryRunCommand: target.actions.find((action) => action.id.endsWith("-dry-run"))?.command ?? "Run only after the readiness plan passes audit.",
    executionCommand:
      target.actions.find((action) => action.id.endsWith("-target-execution"))?.command ??
      "Run only after an audit-passed plan has passed dry-run evidence.",
    rollbackRequirement: rollbackRequirement(target.target),
    postVerificationRequirement: postVerificationRequirement(target.target),
    blockers: target.blockers,
    nextActions: target.actions.map((action) => `${action.status}: ${action.title}`),
    evidenceRefs: Array.from(new Set(target.actions.flatMap((action) => action.evidenceRefs)))
  };
}

function recommendedRisk(target: ApprovalTarget): LiveAdapterApprovalPack["packets"][number]["recommendedRisk"] {
  return target === "deployment" ? "high" : "medium";
}

function approvalRequestCommand(project: string, target: ApprovalTarget): string {
  return [
    "npm run ariadne -- approval-request",
    `--project ${project}`,
    "--by <operator>",
    `--target ${target}`,
    `--action "${boundedAction(target)}"`,
    `--risk ${recommendedRisk(target)}`,
    `--reason "${approvalReason(target)}"`,
    `--rollback "${rollbackRequirement(target)}"`,
    "--evidence <auth-or-policy-evidence>"
  ].join(" ");
}

function boundedAction(target: ApprovalTarget): string {
  switch (target) {
    case "github":
      return "Enable one reviewed GitHub mutation adapter action";
    case "deployment":
      return "Enable one reviewed deployment mutation adapter action";
    case "hermes-cron":
      return "Enable one reviewed Hermes cron mutation adapter action";
    case "openscorpion":
      return "Enable one reviewed OpenScorpion governed activity action";
    case "gsd2":
      return "Enable one reviewed GSD2 task submission action";
    case "notebooklm":
      return "Enable one reviewed NotebookLM notebook action";
  }
}

function approvalReason(target: ApprovalTarget): string {
  switch (target) {
    case "github":
      return "Permit a bounded PR or workflow operation after checks, review, and branch policy are verified";
    case "deployment":
      return "Permit a bounded estate operation after host auth, rollback, and service verification are proven";
    case "hermes-cron":
      return "Permit a bounded scheduler change after auth, next-run behavior, and disable path are proven";
    case "openscorpion":
      return "Permit a bounded governed activity submission after route and non-public payload policy are proven";
    case "gsd2":
      return "Permit a bounded GSD2 task operation after process contract and workspace effects are proven";
    case "notebooklm":
      return "Permit a bounded NotebookLM operation after account terms, auth, and export stability are proven";
  }
}

function requiredEvidence(target: ApprovalTarget): string[] {
  const base = [
    "operator approval request record",
    "authentication or authorization evidence",
    "bounded scope statement",
    "dry-run command output evidence",
    "post-action verification command",
    "rollback or disable path"
  ];
  const targetSpecific: Record<ApprovalTarget, string[]> = {
    github: ["repository, PR, branch policy, and check-rollup evidence"],
    deployment: ["host identity, service state, sudo boundary, and rollback host evidence"],
    "hermes-cron": ["scheduler auth, existing job snapshot, next-run, and disable-path evidence"],
    openscorpion: ["governed route, payload sensitivity, and activity status evidence"],
    gsd2: ["local GSD2 binary/process snapshot and package/task identity evidence"],
    notebooklm: ["NotebookLM auth, terms, source/export stability, and notebook identity evidence"]
  };
  return [...base, ...targetSpecific[target]];
}

function rollbackRequirement(target: ApprovalTarget): string {
  switch (target) {
    case "github":
      return "Document how to revert or undo the PR/workflow operation and restore manual review flow.";
    case "deployment":
      return "Document the exact host-level rollback command or service restore path before execution.";
    case "hermes-cron":
      return "Document the exact disable or restore command for the scheduler job.";
    case "openscorpion":
      return "Document the withdraw/update path and governed audit trail for the activity.";
    case "gsd2":
      return "Document generated worktree cleanup and task-state restoration.";
    case "notebooklm":
      return "Document how to remove generated exports or revert source changes and return to manual import.";
  }
}

function postVerificationRequirement(target: ApprovalTarget): string {
  switch (target) {
    case "github":
      return "Verify PR/workflow status, check rollup, and repository state after execution.";
    case "deployment":
      return "Verify service state, host health, and affected endpoint behavior after execution.";
    case "hermes-cron":
      return "Verify job state, schedule, next run, and expected enabled/disabled state after execution.";
    case "openscorpion":
      return "Verify governed activity status and audit record after execution.";
    case "gsd2":
      return "Verify task/package state and generated workspace effects after execution.";
    case "notebooklm":
      return "Verify notebook/source/export state and saved artifact digest after execution.";
  }
}

function planFallback(target: ApprovalTarget): string {
  const commands: Record<ApprovalTarget, string> = {
    github:
      "npm run ariadne -- github-mutation-plan --project <project> --repo <owner/name> --action <merge-pr|rerun-failed-run> --auth-evidence <paths> --approval <approval-id>",
    deployment:
      "npm run ariadne -- deployment-mutation-plan --project <project> --system <proxmox|truenas|dgx-spark|mac> --host <host> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>",
    "hermes-cron":
      "npm run ariadne -- hermes-cron-mutation-plan --project <project> --action <create|update|enable|disable|delete> --job <id> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>",
    openscorpion:
      "npm run ariadne -- openscorpion-mutation-plan --project <project> --activity <id> --type <type> --action <submit-activity|update-activity|withdraw-activity> --route <governed|staging> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>",
    gsd2:
      "npm run ariadne -- gsd2-mutation-plan --project <project> --task <id> --mode <headless|auto|worktree> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>",
    notebooklm:
      "npm run ariadne -- notebooklm-mutation-plan --project <project> --notebook <id> --action <create-source|refresh-source|generate-summary|export-notes> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>"
  };
  return commands[target];
}

function renderReport(report: LiveAdapterApprovalPack): string {
  return [
    "# Live Adapter Approval Pack",
    "",
    `Project: ${report.project}`,
    `Status: ${report.status}`,
    `Generated: ${report.generatedAt}`,
    `Next actions: ${report.nextActionsRef}`,
    "",
    "## Summary",
    "",
    `- Targets: ${report.summary.targets}`,
    `- Packets: ${report.summary.packets}`,
    `- Blocked targets: ${report.summary.blockedTargets}`,
    `- Ready targets: ${report.summary.readyTargets}`,
    "",
    "## Operator Rule",
    "",
    "Ariadne does not approve its own live adapters. These packets draft the evidence and command checklist an operator must review before creating or deciding approval records.",
    "",
    "## Packets",
    "",
    ...report.packets.flatMap((packet) => [
      `### ${packet.target}`,
      "",
      `Readiness: ${packet.readinessStatus}`,
      `Recommended risk: ${packet.recommendedRisk}`,
      `Operator decision required: ${packet.operatorDecisionRequired}`,
      "",
      "#### Approval Request",
      "",
      "```bash",
      packet.approvalRequestCommand,
      "```",
      "",
      "#### Required Evidence",
      "",
      ...list(packet.requiredEvidence),
      "",
      "#### Mutation Plan",
      "",
      "```bash",
      packet.mutationPlanCommand,
      "```",
      "",
      "#### Dry Run",
      "",
      "```bash",
      packet.dryRunCommand,
      "```",
      "",
      "#### Execution",
      "",
      "```bash",
      packet.executionCommand,
      "```",
      "",
      `Rollback: ${packet.rollbackRequirement}`,
      `Post-verification: ${packet.postVerificationRequirement}`,
      "",
      "#### Blockers",
      "",
      ...list(packet.blockers),
      "",
      "#### Next Actions",
      "",
      ...list(packet.nextActions),
      ""
    ])
  ].join("\n");
}

function list(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}
