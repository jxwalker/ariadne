import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateLiveAdapterReadiness } from "./liveAdapterReadiness.js";
import { slugifyProject } from "./paths.js";
import type { LiveAdapterNextActionsReport, LiveAdapterReadinessReport } from "./types.js";

type ReadinessTarget = LiveAdapterReadinessReport["targets"][number];
type NextAction = LiveAdapterNextActionsReport["targets"][number]["actions"][number];

export async function generateLiveAdapterNextActions(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; report: LiveAdapterNextActionsReport }> {
  const project = slugifyProject(input.project);
  const readiness = await generateLiveAdapterReadiness({ project, vaultRoot: input.vaultRoot });
  const targets = readiness.report.targets.map((target) => targetNextActions(target));
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

function targetNextActions(target: ReadinessTarget): LiveAdapterNextActionsReport["targets"][number] {
  const actions: NextAction[] = [];
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
      title: "Fix readiness audit blockers",
      rationale: "The readiness audit must pass before dry-run or execution evidence can count for a live adapter.",
      command: "npm run ariadne -- mutation-readiness-audit --project <project>",
      evidenceRefs: target.evidenceRefs
    });
  }
  if (target.blockers.includes("no passed dry-run evidence exists for an audit-passed plan")) {
    actions.push({
      id: `${target.target}-dry-run`,
      status: target.latestReadyPlanId ? "ready" : "blocked",
      title: "Run the reviewed dry-run command",
      rationale: "Dry-run evidence proves the reviewed command path before the live command is eligible for target-guarded execution.",
      command: target.latestReadyPlanId
        ? `npm run ariadne -- mutation-dry-run --project <project> --plan ${target.latestReadyPlanId}`
        : "Create and audit-pass a target-specific readiness plan first.",
      evidenceRefs: target.evidenceRefs
    });
  }
  if (target.blockers.includes("no passed target-guarded execution evidence exists")) {
    actions.push({
      id: `${target.target}-target-execution`,
      status: target.latestReadyPlanId && target.passedDryRunCount > 0 ? "ready" : "blocked",
      title: "Capture target-guarded execution evidence",
      rationale: "The live adapter should only replace placeholder shell commands after the audited target wrapper has successfully verified the same target.",
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

function tableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}
