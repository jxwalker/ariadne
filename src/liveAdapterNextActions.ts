import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateLiveAdapterOperatorEvidenceAudit } from "./liveAdapterOperatorEvidence.js";
import { generateLiveAdapterReadiness } from "./liveAdapterReadiness.js";
import { isLiveAdapterTarget } from "./liveAdapterTargets.js";
import { projectDir, slugifyProject } from "./paths.js";
import type {
  LiveAdapterNextActionsReport,
  LiveAdapterOperatorEvidenceAudit,
  LiveAdapterReadinessReport,
  MutationReadinessAudit
} from "./types.js";

type ReadinessTarget = LiveAdapterReadinessReport["targets"][number];
type NextAction = LiveAdapterNextActionsReport["targets"][number]["actions"][number];
type AuditCheck = MutationReadinessAudit["checks"][number];
type OperatorEvidenceTarget = LiveAdapterOperatorEvidenceAudit["targets"][number];

export async function generateLiveAdapterNextActions(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; report: LiveAdapterNextActionsReport }> {
  const project = slugifyProject(input.project);
  const readiness = await generateLiveAdapterReadiness({ project, vaultRoot: input.vaultRoot });
  const operatorEvidenceAuditResult = await generateLiveAdapterOperatorEvidenceAudit({ project, vaultRoot: input.vaultRoot });
  const operatorEvidenceAudit = operatorEvidenceAuditResult.audit;
  const audit = await readMutationReadinessAudit(input.vaultRoot, project);
  const operatorEvidenceByTarget = new Map(operatorEvidenceAudit.targets.map((target) => [target.target, target]));
  const targets = readiness.report.targets.map((target) =>
    targetNextActions(
      target,
      audit.checks.filter((check) => check.target === target.target),
      operatorEvidenceByTarget.get(target.target)
    )
  );
  const actionItems = targets.reduce((count, target) => count + target.actions.length, 0);
  const report: LiveAdapterNextActionsReport = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status: actionItems === 0 ? "complete" : "actions_required",
    summary: {
      targets: targets.length,
      ready: readiness.report.summary.ready,
      blocked: readiness.report.summary.blocked,
      actionItems
    },
    readinessRef: path.relative(input.vaultRoot, readiness.jsonPath),
    operatorEvidenceAuditRef: path.relative(input.vaultRoot, operatorEvidenceAuditResult.jsonPath),
    targets
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "live-adapter-next-actions.json", report);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control",
    "live-adapter-next-actions.md",
    renderReport(report)
  );
  return { jsonPath, markdownPath, report };
}

async function readMutationReadinessAudit(vaultRoot: string, project: string): Promise<MutationReadinessAudit> {
  const auditPath = path.join(projectDir(vaultRoot, project), "control", "mutation-readiness-audit.json");
  return JSON.parse(await fs.readFile(auditPath, "utf8")) as MutationReadinessAudit;
}

function targetNextActions(
  target: ReadinessTarget,
  auditChecks: AuditCheck[],
  operatorEvidence: OperatorEvidenceTarget | undefined
): LiveAdapterNextActionsReport["targets"][number] {
  const actions: NextAction[] = [];
  const latestExistingPlanId = auditChecks
    .map((check) => check.planId)
    .sort()
    .at(-1);
  if (operatorEvidence?.status !== "complete") {
    actions.push({
      id: `${target.target}-operator-evidence`,
      status: "pending",
      title: "Prepare, fill, and import operator evidence",
      rationale:
        operatorEvidence?.status === "incomplete"
          ? `The latest operator evidence record is incomplete: ${inlineList(operatorEvidence.missingSections)}. Refresh the target packet, complete the workspace file, and import it again before packet review or cutover.`
          : "The target has no imported operator evidence record. Refresh the target packet, fill the generated workspace file with real observations, and import it before packet review or cutover.",
      command: `npm run ariadne -- live-adapter-operator-evidence-next --project <project> --target ${target.target}`,
      evidenceRefs: [
        ...withoutLegacyOperatorWorkspaceRefs(operatorEvidence?.evidenceRefs),
        operatorWorkspaceEvidenceRef(target.target),
        `control/operator-evidence/${target.target}/operator-evidence.md`
      ]
    });
  }
  if (target.blockers.includes("no accepted operator review exists for live-adapter approval packet")) {
    actions.push({
      id: `${target.target}-approval-pack-review`,
      status: "pending",
      title: "Record operator review of the approval packet",
      rationale:
        "Before a live adapter can replace placeholder shell commands, an operator must review the target packet and record whether the packet is accepted, rejected, or needs changes. This does not approve live mutation.",
      command: `npm run ariadne -- live-adapter-approval-review --project <project> --target ${target.target} --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>`,
      evidenceRefs: target.evidenceRefs
    });
  }
  if (target.blockers.includes("no target-specific readiness plan exists")) {
    actions.push({
      id: `${target.target}-approval-request`,
      status: "pending",
      title: "Record an operator approval request",
      rationale: "Live adapters need explicit human authorization before any target-specific readiness plan can be treated as reviewable.",
      command: `npm run ariadne -- approval-request --project <project> --by <operator> --target ${target.target} --action "<bounded action>" --risk <low|medium|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence>`,
      evidenceRefs: target.evidenceRefs
    });
    actions.push({
      id: `${target.target}-mutation-plan`,
      status: "blocked",
      title: "Create a target-specific mutation-readiness plan",
      rationale: "Ariadne needs reviewed dry-run, live, post-verification, rollback, auth evidence, and approval refs before any live adapter can be wired.",
      command: planCommand(target),
      evidenceRefs: target.evidenceRefs
    });
  }
  if (target.blockers.includes("no readiness plan passes audit")) {
    actions.push({
      id: `${target.target}-audit-fix`,
      status: "pending",
      title: latestExistingPlanId ? "Resolve existing readiness plan blockers" : "Fix readiness audit blockers",
      rationale: latestExistingPlanId
        ? `Existing plan ${latestExistingPlanId} is blocked by: ${auditBlockers(auditChecks)}. Approve the existing plan only after operator review, and regenerate it with post-action verification if that gate is missing.`
        : "The readiness audit must pass before dry-run or execution evidence can count for a live adapter.",
      command: latestExistingPlanId
        ? `Review ${latestExistingPlanId}; after operator approval, record approval-decision, ensure --post-verify is present, then rerun npm run ariadne -- mutation-readiness-audit --project <project>`
        : "npm run ariadne -- mutation-readiness-audit --project <project>",
      evidenceRefs: target.evidenceRefs
    });
  }
  if (target.blockers.includes("no passed dry-run evidence exists for an audit-passed plan")) {
    actions.push({
      id: `${target.target}-dry-run`,
      status: target.latestReadyPlanId ? "ready" : latestExistingPlanId ? "pending" : "blocked",
      title: "Run the reviewed dry-run command",
      rationale: "Dry-run evidence proves the reviewed command path before the live command is eligible for target-guarded execution.",
      command: target.latestReadyPlanId
        ? `npm run ariadne -- mutation-dry-run --project <project> --plan ${target.latestReadyPlanId}`
        : latestExistingPlanId
          ? `After ${latestExistingPlanId} passes audit, run npm run ariadne -- mutation-dry-run --project <project> --plan ${latestExistingPlanId}`
        : "Create and audit-pass a target-specific readiness plan first.",
      evidenceRefs: target.evidenceRefs
    });
  }
  if (target.blockers.includes("no passed target-guarded execution evidence exists")) {
    actions.push({
      id: `${target.target}-target-execution`,
      status: target.latestReadyPlanId && target.passedDryRunCount > 0 ? "ready" : "blocked",
      title: "Capture target-guarded execution evidence",
      rationale:
        "The live adapter should only replace placeholder shell commands after the audited target wrapper has successfully verified the same target and recorded post-action verification evidence.",
      command:
        target.latestReadyPlanId && target.passedDryRunCount > 0
          ? `npm run ariadne -- ${target.executeCommand} --project <project> --plan ${target.latestReadyPlanId} --confirm-plan ${target.latestReadyPlanId}`
          : "Run a passed dry-run for an audit-passed plan first.",
      evidenceRefs: target.evidenceRefs
    });
  }
  if (target.status === "ready_for_adapter") {
    actions.push({
      id: `${target.target}-replace-placeholder`,
      status: "ready",
      title: "Replace placeholder shell command with the real adapter",
      rationale: "This target has plan, dry-run, and target-guarded execution evidence; the next code slice can narrow the external adapter implementation.",
      command: `Implement the ${target.target} live adapter behind ${target.executeCommand} semantics and keep the same audit/dry-run/confirm gates.`,
      evidenceRefs: target.evidenceRefs
    });
  }

  return {
    target: target.target,
    readinessStatus: target.status,
    latestReadyPlanId: target.latestReadyPlanId,
    executeCommand: target.executeCommand,
    blockers: target.blockers,
    actions
  };
}

function operatorWorkspaceEvidenceRef(target: ReadinessTarget["target"]): string {
  if (!isLiveAdapterTarget(target)) {
    throw new Error(`Unexpected live adapter target '${String(target)}'.`);
  }
  return `control/live-adapter-operator-evidence-workspace-${target}.json`;
}

function withoutLegacyOperatorWorkspaceRefs(refs: string[] | undefined): string[] {
  return (refs ?? []).filter((ref) => {
    const normalized = ref.split(path.sep).join("/");
    return (
      normalized !== "control/live-adapter-operator-evidence-workspace.json" &&
      !normalized.endsWith("/control/live-adapter-operator-evidence-workspace.json")
    );
  });
}

function planCommand(target: ReadinessTarget): string {
  switch (target.target) {
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

function renderReport(report: LiveAdapterNextActionsReport): string {
  return [
    "# Live Adapter Next Actions",
    "",
    `Project: ${report.project}`,
    `Status: ${report.status}`,
    `Generated: ${report.generatedAt}`,
    `Readiness: ${report.readinessRef}`,
    `Operator evidence audit: ${report.operatorEvidenceAuditRef ?? "missing"}`,
    "",
    "## Summary",
    "",
    `- Targets: ${report.summary.targets}`,
    `- Ready: ${report.summary.ready}`,
    `- Blocked: ${report.summary.blocked}`,
    `- Action items: ${report.summary.actionItems}`,
    "",
    "## Targets",
    "",
    ...report.targets.flatMap((target) => [
      `### ${target.target}`,
      "",
      `Readiness: ${target.readinessStatus}`,
      `Execute command: ${target.executeCommand}`,
      `Blockers: ${inlineList(target.blockers)}`,
      "",
      "| Action | Status | Rationale | Command |",
      "| --- | --- | --- | --- |",
      ...target.actions.map(
        (action) =>
          `| ${tableCell(action.title)} | ${action.status} | ${tableCell(action.rationale)} | ${tableCell(action.command ?? "none")} |`
      ),
      ""
    ])
  ].join("\n");
}

function inlineList(items: string[]): string {
  return items.length > 0 ? items.join("; ") : "none";
}

function auditBlockers(checks: AuditCheck[]): string {
  const blockers = Array.from(new Set(checks.flatMap((check) => check.blockers)));
  return inlineList(blockers);
}

function tableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}
