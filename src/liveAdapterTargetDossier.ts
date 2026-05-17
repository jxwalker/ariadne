import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateLiveAdapterApprovalPack } from "./liveAdapterApprovalPack.js";
import { generateLiveAdapterApprovalReviewAudit } from "./liveAdapterApprovalReviewAudit.js";
import { generateLiveAdapterNextActions } from "./liveAdapterNextActions.js";
import { generateLiveAdapterReadiness } from "./liveAdapterReadiness.js";
import { isLiveAdapterTarget, LIVE_ADAPTER_TARGETS, type LiveAdapterTarget } from "./liveAdapterTargets.js";
import { generateMutationReadinessAudit } from "./mutationReadinessAudit.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { GbrainReportImport, LiveAdapterTargetDossier } from "./types.js";

export async function generateLiveAdapterTargetDossier(input: {
  project: string;
  vaultRoot: string;
  target: LiveAdapterTarget;
}): Promise<{ jsonPath: string; markdownPath: string; dossier: LiveAdapterTargetDossier }> {
  const project = slugifyProject(input.project);
  const readiness = await generateLiveAdapterReadiness({ project, vaultRoot: input.vaultRoot });
  const nextActions = await generateLiveAdapterNextActions({ project, vaultRoot: input.vaultRoot });
  const approvalPack = await generateLiveAdapterApprovalPack({ project, vaultRoot: input.vaultRoot });
  const approvalReviewAudit = await generateLiveAdapterApprovalReviewAudit({ project, vaultRoot: input.vaultRoot });
  const mutationReadinessAudit = await generateMutationReadinessAudit({ project, vaultRoot: input.vaultRoot });
  const readinessTarget = mustFind(readiness.report.targets, input.target, "readiness target");
  const nextActionTarget = mustFind(nextActions.report.targets, input.target, "next-action target");
  const approvalPacket = approvalPack.report.packets.find((packet) => packet.target === input.target);
  const approvalReviewAuditTarget = mustFind(approvalReviewAudit.audit.targets, input.target, "approval-review audit target");
  const mutationReadinessChecks = mutationReadinessAudit.audit.checks.filter((check) => check.target === input.target);
  const gbrainContext = await readGbrainContext(input.vaultRoot, project, input.target);
  const evidenceRefs = Array.from(
    new Set([
      path.relative(input.vaultRoot, readiness.jsonPath),
      path.relative(input.vaultRoot, nextActions.jsonPath),
      path.relative(input.vaultRoot, approvalPack.jsonPath),
      path.relative(input.vaultRoot, approvalReviewAudit.jsonPath),
      path.relative(input.vaultRoot, mutationReadinessAudit.jsonPath),
      ...readinessTarget.evidenceRefs,
      ...nextActionTarget.actions.flatMap((action) => action.evidenceRefs),
      ...(approvalPacket?.evidenceRefs ?? []),
      ...(approvalReviewAuditTarget?.evidenceRefs ?? []),
      ...gbrainContext.reportRefs
    ])
  );
  const dossier: LiveAdapterTargetDossier = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    target: input.target,
    status:
      approvalPacket && nextActionTarget.actions.length > 0 && approvalReviewAuditTarget.status !== "current_accepted"
        ? "ready_for_operator_review"
        : "blocked",
    readinessRef: path.relative(input.vaultRoot, readiness.jsonPath),
    nextActionsRef: path.relative(input.vaultRoot, nextActions.jsonPath),
    approvalPackRef: path.relative(input.vaultRoot, approvalPack.jsonPath),
    approvalReviewAuditRef: path.relative(input.vaultRoot, approvalReviewAudit.jsonPath),
    mutationReadinessAuditRef: path.relative(input.vaultRoot, mutationReadinessAudit.jsonPath),
    summary: {
      blockers: readinessTarget.blockers.length + approvalReviewAuditTarget.blockers.length,
      actions: nextActionTarget.actions.length,
      packetPresent: Boolean(approvalPacket),
      reviewAuditStatus: approvalReviewAuditTarget.status,
      mutationPlans: mutationReadinessChecks.length,
      readyMutationPlans: mutationReadinessChecks.filter((check) => check.status === "passed").length,
      gbrainReports: gbrainContext.reportRefs.length
    },
    readiness: readinessTarget,
    nextActions: nextActionTarget.actions,
    approvalPacket,
    approvalReviewAudit: approvalReviewAuditTarget,
    mutationReadinessChecks,
    operatorChecklist: operatorChecklist(input.target, approvalPacket !== undefined, approvalReviewAuditTarget.status),
    gbrainContext,
    evidenceRefs
  };
  const jsonPath = await writeJsonArtifact(
    input.vaultRoot,
    project,
    "control/live-adapter-dossiers",
    `live-adapter-dossier-${input.target}.json`,
    dossier
  );
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control/live-adapter-dossiers",
    `live-adapter-dossier-${input.target}.md`,
    renderDossier(dossier)
  );
  return { jsonPath, markdownPath, dossier };
}

export function liveAdapterDossierTargetOption(value: string): LiveAdapterTarget {
  if (isLiveAdapterTarget(value)) return value;
  throw new Error(`--target must be ${LIVE_ADAPTER_TARGETS.join(", ")}.`);
}

function mustFind<T extends { target: LiveAdapterTarget }>(items: T[], target: LiveAdapterTarget, label: string): T {
  const item = items.find((candidate) => candidate.target === target);
  if (!item) throw new Error(`Missing ${label} for ${target}.`);
  return item;
}

async function readGbrainContext(
  vaultRoot: string,
  project: string,
  target: LiveAdapterTarget
): Promise<LiveAdapterTargetDossier["gbrainContext"]> {
  const dir = path.join(projectDir(vaultRoot, project), "integrations", "gbrain");
  const exportRef = (await pathExists(path.join(dir, "gbrain-export.json")))
    ? vaultRelative(vaultRoot, path.join(dir, "gbrain-export.json"))
    : undefined;
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch {
    names = [];
  }
  const reportRefs: string[] = [];
  for (const name of names.filter((item) => item.startsWith("gbrain-report-") && item.endsWith(".json")).sort()) {
    const absolutePath = path.join(dir, name);
    try {
      const report = JSON.parse(await fs.readFile(absolutePath, "utf8")) as GbrainReportImport;
      const searchable = JSON.stringify([report.query, report.results, report.notes]).toLowerCase();
      if (searchable.includes(target.toLowerCase()) || searchable.includes("live adapter") || searchable.includes("approval")) {
        reportRefs.push(vaultRelative(vaultRoot, absolutePath));
      }
    } catch {
      // Ignore malformed GBrain imports here; gbrain-report-import owns normalization.
    }
  }
  return {
    exportRef,
    reportRefs,
    suggestedQueries: [
      `Find prior Ariadne decisions and evidence for the ${target} live adapter.`,
      `List risks, rollback requirements, and stale assumptions for ${target} approval.`,
      `Summarize operator-review evidence still missing before ${target} mutation readiness.`
    ]
  };
}

async function pathExists(absolutePath: string): Promise<boolean> {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

function operatorChecklist(
  target: LiveAdapterTarget,
  packetPresent: boolean,
  reviewAuditStatus: LiveAdapterTargetDossier["summary"]["reviewAuditStatus"]
): string[] {
  return [
    packetPresent ? "Read the target approval packet." : "Generate a target approval packet before review.",
    "Check authentication or authorization evidence for the exact target account, host, or service.",
    "Check rollback and post-verification commands are concrete enough to execute later.",
    "Check dry-run and target-guarded execution steps remain non-placeholder and bounded.",
    "Query GBrain for prior decisions, stale assumptions, and related evidence before accepting the packet.",
    reviewAuditStatus === "current_accepted"
      ? "Do not record another packet review unless the packet or evidence changes."
      : "Record an approval-packet review only after the packet and evidence are complete."
  ];
}

function renderDossier(dossier: LiveAdapterTargetDossier): string {
  return [
    `# Live Adapter Target Dossier: ${dossier.target}`,
    "",
    `Project: ${dossier.project}`,
    `Status: ${dossier.status}`,
    `Generated: ${dossier.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Blockers: ${dossier.summary.blockers}`,
    `- Actions: ${dossier.summary.actions}`,
    `- Approval packet present: ${dossier.summary.packetPresent}`,
    `- Review audit status: ${dossier.summary.reviewAuditStatus}`,
    `- Mutation plans: ${dossier.summary.readyMutationPlans}/${dossier.summary.mutationPlans} ready`,
    `- GBrain reports: ${dossier.summary.gbrainReports}`,
    "",
    "## Operator Checklist",
    "",
    ...list(dossier.operatorChecklist),
    "",
    "## Next Actions",
    "",
    ...list(dossier.nextActions.map((action) => `${action.status}: ${action.title} - ${action.command ?? "no command"}`)),
    "",
    "## Readiness Blockers",
    "",
    ...list(dossier.readiness.blockers),
    "",
    "## Approval Review Audit",
    "",
    `Status: ${dossier.approvalReviewAudit?.status ?? "missing"}`,
    ...list(dossier.approvalReviewAudit?.blockers ?? ["approval-review audit target missing"]),
    "",
    "## GBrain Context",
    "",
    `Export: ${dossier.gbrainContext.exportRef ?? "missing"}`,
    "Reports:",
    ...list(dossier.gbrainContext.reportRefs),
    "Suggested queries:",
    ...list(dossier.gbrainContext.suggestedQueries),
    "",
    "## Evidence",
    "",
    ...list(dossier.evidenceRefs),
    ""
  ].join("\n");
}

function vaultRelative(vaultRoot: string, absolutePath: string): string {
  return path.relative(vaultRoot, absolutePath).split(path.sep).join("/");
}

function list(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}

