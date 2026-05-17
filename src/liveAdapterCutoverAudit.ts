import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateLiveAdapterApprovalReviewAudit } from "./liveAdapterApprovalReviewAudit.js";
import { generateLiveAdapterOperatorEvidenceAudit } from "./liveAdapterOperatorEvidence.js";
import { generateLiveAdapterReadiness } from "./liveAdapterReadiness.js";
import { LIVE_ADAPTER_TARGETS, type LiveAdapterTarget } from "./liveAdapterTargets.js";
import { generateMutationReadinessAudit } from "./mutationReadinessAudit.js";
import { projectDir, slugifyProject } from "./paths.js";
import type {
  LiveAdapterApprovalReviewAudit,
  LiveAdapterCutoverAudit,
  LiveAdapterOperatorEvidenceAudit,
  LiveAdapterReadinessReport,
  LiveAdapterTargetDossier,
  MutationReadinessAudit
} from "./types.js";

export async function generateLiveAdapterCutoverAudit(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; audit: LiveAdapterCutoverAudit }> {
  const project = slugifyProject(input.project);
  const readiness = await generateLiveAdapterReadiness({ project, vaultRoot: input.vaultRoot });
  const approvalReviewAudit = await generateLiveAdapterApprovalReviewAudit({ project, vaultRoot: input.vaultRoot });
  const mutationReadinessAudit = await generateMutationReadinessAudit({ project, vaultRoot: input.vaultRoot });
  const operatorEvidenceAudit = await generateLiveAdapterOperatorEvidenceAudit({ project, vaultRoot: input.vaultRoot });
  const dossiers = await readDossiers(input.vaultRoot, project);
  const targets = LIVE_ADAPTER_TARGETS.map((target) =>
    targetCutover(
      target,
      readiness.report,
      approvalReviewAudit.audit,
      mutationReadinessAudit.audit,
      operatorEvidenceAudit.audit,
      dossiers.get(target)
    )
  );
  const summary = {
    targets: targets.length,
    ready: targets.filter((target) => target.status === "ready_for_cutover").length,
    blocked: targets.filter((target) => target.status === "blocked").length,
    passedGates: targets.reduce((sum, target) => sum + target.gates.filter((gate) => gate.status === "passed").length, 0),
    blockedGates: targets.reduce((sum, target) => sum + target.gates.filter((gate) => gate.status === "blocked").length, 0),
    advisoryGates: targets.reduce((sum, target) => sum + target.gates.filter((gate) => gate.status === "advisory").length, 0)
  };
  const audit: LiveAdapterCutoverAudit = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status: summary.blocked === 0 ? "ready_for_cutover" : "blocked",
    mutationAllowed: false,
    readinessRef: "control/live-adapter-readiness.json",
    approvalReviewAuditRef: "control/live-adapter-approval-review-audit.json",
    mutationReadinessAuditRef: "control/mutation-readiness-audit.json",
    operatorEvidenceAuditRef: "control/live-adapter-operator-evidence-audit.json",
    dossierDirRef: "control/live-adapter-dossiers",
    summary,
    targets
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "live-adapter-cutover-audit.json", audit);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control",
    "live-adapter-cutover-audit.md",
    renderAudit(audit)
  );
  return { jsonPath, markdownPath, audit };
}

function targetCutover(
  target: LiveAdapterTarget,
  readiness: LiveAdapterReadinessReport,
  approvalReviewAudit: LiveAdapterApprovalReviewAudit,
  mutationReadinessAudit: MutationReadinessAudit,
  operatorEvidenceAudit: LiveAdapterOperatorEvidenceAudit,
  dossier: LiveAdapterTargetDossier | undefined
): LiveAdapterCutoverAudit["targets"][number] {
  const readinessTarget = readiness.targets.find((item) => item.target === target);
  const approvalTarget = approvalReviewAudit.targets.find((item) => item.target === target);
  const operatorEvidenceTarget = operatorEvidenceAudit.targets.find((item) => item.target === target);
  const passedChecks = mutationReadinessAudit.checks.filter((check) => check.target === target && check.status === "passed");
  const latestPassedCheck = passedChecks.at(-1);
  const gates: LiveAdapterCutoverAudit["targets"][number]["gates"] = [
    gate(
      "operator-evidence-complete",
      "Operator evidence complete",
      operatorEvidenceTarget?.status === "complete",
      operatorEvidenceTarget?.status === "complete"
        ? `Operator evidence ${operatorEvidenceTarget.latestRecordId ?? "unknown"} is complete.`
        : operatorEvidenceTarget?.blockers.join("; ") || "No complete operator evidence record exists.",
      operatorEvidenceTarget?.evidenceRefs ?? []
    ),
    gate(
      "operator-review-current",
      "Current accepted operator packet review",
      approvalTarget?.status === "current_accepted",
      approvalTarget?.status === "current_accepted"
        ? `Accepted packet review ${approvalTarget.latestAcceptedReviewId ?? "unknown"} is current.`
        : approvalTarget?.blockers.join("; ") || "No current accepted packet review exists.",
      approvalTarget?.evidenceRefs ?? []
    ),
    gate(
      "mutation-readiness-passed",
      "Mutation-readiness audit passed",
      Boolean(latestPassedCheck),
      latestPassedCheck
        ? `Readiness plan ${latestPassedCheck.planId} passes the non-mutating audit.`
        : "No target-specific mutation-readiness plan passes audit.",
      latestPassedCheck?.evidenceRefs ?? []
    ),
    gate(
      "auth-evidence-present",
      "Credential and auth-boundary evidence accepted",
      Boolean(latestPassedCheck && latestPassedCheck.evidenceRefs.length > 0),
      latestPassedCheck
        ? "The passing readiness audit has evidence refs for auth and supporting evidence."
        : "No passing readiness audit is available to prove auth evidence.",
      latestPassedCheck?.evidenceRefs ?? []
    ),
    gate(
      "rollback-post-verify",
      "Rollback and post-verification contract accepted",
      Boolean(latestPassedCheck),
      latestPassedCheck
        ? "The passing readiness audit accepted rollback and post-action verification fields."
        : "A passing readiness audit is required to prove rollback and post-verification.",
      latestPassedCheck?.evidenceRefs ?? []
    ),
    gate(
      "dry-run-passed",
      "Dry-run evidence passed",
      Boolean(readinessTarget && readinessTarget.passedDryRunCount > 0),
      readinessTarget && readinessTarget.passedDryRunCount > 0
        ? `${readinessTarget.passedDryRunCount} passed dry-run record(s) exist for audit-passed plans.`
        : "No passed dry-run evidence exists for an audit-passed plan.",
      readinessTarget?.evidenceRefs.filter((ref) => ref.includes("mutation-dry-runs")) ?? []
    ),
    gate(
      "target-guarded-execution-passed",
      "Target-guarded execution evidence passed",
      Boolean(readinessTarget && readinessTarget.passedExecutionCount > 0),
      readinessTarget && readinessTarget.passedExecutionCount > 0
        ? `${readinessTarget.passedExecutionCount} passed target-guarded execution record(s) exist.`
        : "No passed target-guarded execution evidence exists.",
      readinessTarget?.evidenceRefs.filter((ref) => ref.includes("mutation-executions")) ?? []
    ),
    gate(
      "target-wrapper-known",
      "Target execute wrapper is known",
      Boolean(readinessTarget?.executeCommand),
      readinessTarget?.executeCommand
        ? `Use ${readinessTarget.executeCommand} for target-guarded execution.`
        : "No target-specific execute wrapper is recorded.",
      []
    ),
    gate(
      "operator-dossier-present",
      "Operator dossier present",
      Boolean(dossier),
      dossier ? `Dossier status is ${dossier.status}.` : "No target dossier has been generated.",
      dossier ? [`control/live-adapter-dossiers/live-adapter-dossier-${target}.json`] : []
    ),
    {
      id: "gbrain-context-advisory",
      label: "GBrain memory context available",
      status: "advisory",
      detail:
        dossier?.gbrainContext.exportRef || dossier?.gbrainContext.reportRefs.length
          ? "GBrain context is available as advisory memory, not source-of-truth approval evidence."
          : "No GBrain export or report context is linked for this target.",
      evidenceRefs: [dossier?.gbrainContext.exportRef, ...(dossier?.gbrainContext.reportRefs ?? [])].filter(isString)
    }
  ];
  const blockers = gates.filter((item) => item.status === "blocked").map((item) => `${item.label}: ${item.detail}`);
  return {
    target,
    status: blockers.length === 0 ? "ready_for_cutover" : "blocked",
    executeCommand: readinessTarget?.executeCommand ?? "unknown",
    latestReadyPlanId: readinessTarget?.latestReadyPlanId,
    latestAcceptedApprovalReviewId: readinessTarget?.latestAcceptedApprovalReviewId,
    gates,
    blockers,
    gbrainQueries: dossier?.gbrainContext.suggestedQueries ?? [],
    evidenceRefs: Array.from(
      new Set([
        "control/live-adapter-readiness.json",
        "control/live-adapter-approval-review-audit.json",
        "control/mutation-readiness-audit.json",
        "control/live-adapter-operator-evidence-audit.json",
        ...(operatorEvidenceTarget?.evidenceRefs ?? []),
        ...(readinessTarget?.evidenceRefs ?? []),
        ...(approvalTarget?.evidenceRefs ?? []),
        ...(latestPassedCheck?.evidenceRefs ?? []),
        ...(dossier ? [`control/live-adapter-dossiers/live-adapter-dossier-${target}.json`] : [])
      ])
    )
  };
}

function gate(
  id: string,
  label: string,
  passed: boolean,
  detail: string,
  evidenceRefs: string[]
): LiveAdapterCutoverAudit["targets"][number]["gates"][number] {
  return { id, label, status: passed ? "passed" : "blocked", detail, evidenceRefs };
}

async function readDossiers(vaultRoot: string, project: string): Promise<Map<LiveAdapterTarget, LiveAdapterTargetDossier>> {
  const dir = path.join(projectDir(vaultRoot, project), "control", "live-adapter-dossiers");
  const dossiers = new Map<LiveAdapterTarget, LiveAdapterTargetDossier>();
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return dossiers;
    throw error;
  }
  for (const entry of entries.filter((item) => item.startsWith("live-adapter-dossier-") && item.endsWith(".json")).sort()) {
    const filePath = path.join(dir, entry);
    try {
      const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as unknown;
      if (isLiveAdapterTargetDossier(parsed)) dossiers.set(parsed.target, parsed);
    } catch (error) {
      console.warn(`Skipping unreadable live adapter dossier ${filePath}: ${(error as Error).message}`);
    }
  }
  return dossiers;
}

function isLiveAdapterTargetDossier(value: unknown): value is LiveAdapterTargetDossier {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    typeof value.target === "string" &&
    (LIVE_ADAPTER_TARGETS as readonly string[]).includes(value.target) &&
    Array.isArray(value.operatorChecklist) &&
    isRecord(value.gbrainContext)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function renderAudit(audit: LiveAdapterCutoverAudit): string {
  return [
    "# Live Adapter Cutover Audit",
    "",
    `Project: ${audit.project}`,
    `Status: ${audit.status}`,
    `Generated: ${audit.generatedAt}`,
    `Mutation allowed: ${audit.mutationAllowed}`,
    "",
    "This audit does not enable or execute live adapters. It verifies whether a target has enough current evidence to replace placeholder commands with a target-specific live adapter implementation.",
    "",
    "## Summary",
    "",
    `- Targets: ${audit.summary.targets}`,
    `- Ready: ${audit.summary.ready}`,
    `- Blocked: ${audit.summary.blocked}`,
    `- Passed gates: ${audit.summary.passedGates}`,
    `- Blocked gates: ${audit.summary.blockedGates}`,
    `- Advisory gates: ${audit.summary.advisoryGates}`,
    "",
    "## Targets",
    "",
    "| Target | Status | Execute command | Ready plan | Accepted review | Blockers |",
    "| --- | --- | --- | --- | --- | --- |",
    ...audit.targets.map(
      (target) =>
        `| ${target.target} | ${target.status} | ${target.executeCommand} | ${target.latestReadyPlanId ?? "-"} | ${target.latestAcceptedApprovalReviewId ?? "-"} | ${inlineList(target.blockers)} |`
    ),
    "",
    "## Gate Detail",
    "",
    ...audit.targets.flatMap((target) => [
      `### ${target.target}`,
      "",
      "| Gate | Status | Detail |",
      "| --- | --- | --- |",
      ...target.gates.map((gate) => `| ${gate.label} | ${gate.status} | ${gate.detail} |`),
      "",
      "GBrain queries:",
      "",
      ...list(target.gbrainQueries),
      ""
    ])
  ].join("\n");
}

function inlineList(items: string[]): string {
  return items.length === 0 ? "none" : items.join("<br>");
}

function list(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}
