import path from "node:path";
import { generateArtifactCheckReport } from "./artifactChecks.js";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateConsoleHtml } from "./consoleHtml.js";
import { exportGbrainBundle } from "./gbrainAdapter.js";
import { generateLiveAdapterApprovalPack } from "./liveAdapterApprovalPack.js";
import { generateLiveAdapterApprovalReviewAudit } from "./liveAdapterApprovalReviewAudit.js";
import { generateLiveAdapterCutoverAudit } from "./liveAdapterCutoverAudit.js";
import { generateLiveAdapterEvidenceTemplates } from "./liveAdapterEvidenceTemplates.js";
import { generateLiveAdapterNextActions } from "./liveAdapterNextActions.js";
import { generateLiveAdapterOperatorEvidenceAudit } from "./liveAdapterOperatorEvidence.js";
import { checkAllLiveAdapterOperatorEvidence } from "./liveAdapterOperatorEvidenceCheckAll.js";
import { generateLiveAdapterOperatorEvidenceAssist } from "./liveAdapterOperatorEvidenceAssist.js";
import {
  generateLiveAdapterOperatorEvidenceDraft,
  generateLiveAdapterOperatorEvidenceDraftPack
} from "./liveAdapterOperatorEvidenceDraft.js";
import { selectNextOperatorEvidenceTarget } from "./liveAdapterOperatorEvidenceNextTarget.js";
import { generateLiveAdapterOperatorEvidenceNextPacket } from "./liveAdapterOperatorEvidenceNextPacket.js";
import { generateLiveAdapterOperatorEvidenceQueue } from "./liveAdapterOperatorEvidenceQueue.js";
import { generateLiveAdapterOperatorEvidenceWorkplan } from "./liveAdapterOperatorEvidenceWorkplan.js";
import { generateLiveAdapterOperatorEvidenceWorkspace } from "./liveAdapterOperatorEvidenceWorkspace.js";
import { generateLiveAdapterReadiness } from "./liveAdapterReadiness.js";
import { generateLiveAdapterReviewSession } from "./liveAdapterReviewSession.js";
import { generateLiveAdapterTargetDossier } from "./liveAdapterTargetDossier.js";
import { LIVE_ADAPTER_TARGETS, type LiveAdapterTarget } from "./liveAdapterTargets.js";
import { generateMutationReadinessAudit } from "./mutationReadinessAudit.js";
import { generateMutationReadinessRepairPlan } from "./mutationReadinessRepairPlan.js";
import { generateOperatorSectionHandoff } from "./operatorSectionHandoff.js";
import { slugifyProject } from "./paths.js";
import { generateRoadmapCompletionAudit } from "./roadmapCompletionAudit.js";

type RefreshStatus = "complete" | "blocked";

export interface RoadmapControlRefreshReport {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: RefreshStatus;
  mutationApproved: false;
  approvalGranted: false;
  operatorEvidenceRecordCreated: false;
  summary: {
    roadmapStatus: RefreshStatus;
    roadmapBlocked: number;
    artifactStatus: "passed" | "missing";
    artifactMissingRequired: number;
    gbrainDocuments: number;
    liveAdapterStatus: "complete" | "actions_required";
    operatorEvidenceStatus: "complete" | "blocked";
    operatorQueueStatus: "evidence_required" | "ready_for_import" | "complete";
    operatorNextTarget?: LiveAdapterTarget;
    operatorNextTargetStatus?: string;
    operatorNextTargetMissingSections?: number;
    dossiers: number;
    consoleRefreshed?: boolean;
  };
  artifacts: {
    mutationReadinessAudit: string;
    mutationReadinessRepairPlan: string;
    liveAdapterReadiness: string;
    liveAdapterNextActions: string;
    liveAdapterApprovalPack: string;
    liveAdapterApprovalReviewAudit: string;
    liveAdapterEvidenceTemplates: string;
    liveAdapterOperatorEvidenceAudit: string;
    liveAdapterOperatorEvidenceWorkplan: string;
    liveAdapterOperatorEvidenceWorkspace: string;
    liveAdapterOperatorEvidenceAssist: string;
    liveAdapterOperatorEvidenceBatchCheck: string;
    liveAdapterOperatorEvidenceQueue: string;
    liveAdapterOperatorEvidenceNext?: string;
    liveAdapterOperatorEvidenceSection?: string;
    liveAdapterOperatorEvidenceDraft?: string;
    liveAdapterOperatorEvidenceDraftPack?: string;
    liveAdapterReviewSession: string;
    liveAdapterCutoverAudit: string;
    liveAdapterDossiers: string[];
    gbrainExport: string;
    artifactChecks: string;
    roadmapCompletionAudit: string;
    consoleData?: string;
    consoleHtml?: string;
  };
  commands: {
    status: string;
    e2eSmoke: string;
    roadmapControlRefresh: string;
    nextOperatorPacket?: string;
    nextOperatorSection?: string;
    nextOperatorDraft?: string;
    operatorDraftPack: string;
  };
  notes: string[];
}

export async function refreshRoadmapControlArtifacts(input: {
  project: string;
  vaultRoot: string;
  refreshConsole?: boolean;
}): Promise<{ jsonPath: string; markdownPath: string; report: RoadmapControlRefreshReport }> {
  const project = slugifyProject(input.project);
  // Keep this ordered: later reports intentionally read stable artifacts written by earlier generators.
  const mutationAudit = await generateMutationReadinessAudit({ project, vaultRoot: input.vaultRoot });
  const repairPlan = await generateMutationReadinessRepairPlan({ project, vaultRoot: input.vaultRoot });
  const readiness = await generateLiveAdapterReadiness({ project, vaultRoot: input.vaultRoot });
  const nextActions = await generateLiveAdapterNextActions({ project, vaultRoot: input.vaultRoot });
  const approvalPack = await generateLiveAdapterApprovalPack({ project, vaultRoot: input.vaultRoot });
  const approvalReviewAudit = await generateLiveAdapterApprovalReviewAudit({ project, vaultRoot: input.vaultRoot });
  const dossiers = [];
  for (const target of LIVE_ADAPTER_TARGETS) {
    dossiers.push(await generateLiveAdapterTargetDossier({ project, vaultRoot: input.vaultRoot, target }));
  }
  const evidenceTemplates = await generateLiveAdapterEvidenceTemplates({ project, vaultRoot: input.vaultRoot });
  const operatorAudit = await generateLiveAdapterOperatorEvidenceAudit({ project, vaultRoot: input.vaultRoot });
  const workplan = await generateLiveAdapterOperatorEvidenceWorkplan({ project, vaultRoot: input.vaultRoot });
  const workspace = await generateLiveAdapterOperatorEvidenceWorkspace({ project, vaultRoot: input.vaultRoot });
  const assist = await generateLiveAdapterOperatorEvidenceAssist({ project, vaultRoot: input.vaultRoot });
  const batchCheck = await checkAllLiveAdapterOperatorEvidence({
    project,
    vaultRoot: input.vaultRoot,
    source: "workspace",
    notes: "Generated by roadmap-control-refresh."
  });
  const queue = await generateLiveAdapterOperatorEvidenceQueue({ project, vaultRoot: input.vaultRoot });
  const selected = selectNextOperatorEvidenceTarget(queue.queue, workplan.workplan, operatorAudit.audit);
  const nextPacket = selected
    ? await generateLiveAdapterOperatorEvidenceNextPacket({
        project,
        vaultRoot: input.vaultRoot,
        target: selected.target,
        preflightBatch: batchCheck
      })
    : undefined;
  const nextSection = nextPacket
    ? await generateOperatorSectionHandoff({
        project,
        vaultRoot: input.vaultRoot,
        target: nextPacket.packet.target,
        nextPacket
      })
    : undefined;
  const nextDraft = nextPacket
    ? await generateLiveAdapterOperatorEvidenceDraft({
        project,
        vaultRoot: input.vaultRoot,
        target: nextPacket.packet.target,
        nextPacket
      })
    : undefined;
  const draftPack = await generateLiveAdapterOperatorEvidenceDraftPack({
    project,
    vaultRoot: input.vaultRoot,
    nextPackets: nextPacket ? { [nextPacket.packet.target]: nextPacket } : undefined
  });
  const reviewSession = await generateLiveAdapterReviewSession({ project, vaultRoot: input.vaultRoot });
  const cutoverAudit = await generateLiveAdapterCutoverAudit({ project, vaultRoot: input.vaultRoot });
  const preRoadmapArtifactChecks = await generateArtifactCheckReport({ project, vaultRoot: input.vaultRoot });
  const roadmapCompletion = await generateRoadmapCompletionAudit({ project, vaultRoot: input.vaultRoot });
  const gbrain = await exportGbrainBundle({ project, vaultRoot: input.vaultRoot });
  const report: RoadmapControlRefreshReport = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status: roadmapCompletion.audit.status,
    mutationApproved: false,
    approvalGranted: false,
    operatorEvidenceRecordCreated: false,
    summary: {
      roadmapStatus: roadmapCompletion.audit.status,
      roadmapBlocked: roadmapCompletion.audit.summary.blocked,
      artifactStatus: preRoadmapArtifactChecks.report.status,
      artifactMissingRequired: preRoadmapArtifactChecks.report.summary.missingRequired,
      gbrainDocuments: gbrain.bundle.documents.length,
      liveAdapterStatus: nextActions.report.status,
      operatorEvidenceStatus: operatorAudit.audit.status,
      operatorQueueStatus: queue.queue.status,
      operatorNextTarget: selected?.target,
      operatorNextTargetStatus: selected?.status,
      operatorNextTargetMissingSections: selected?.missingSections,
      dossiers: dossiers.length,
      consoleRefreshed: false
    },
    artifacts: {
      mutationReadinessAudit: ref(input.vaultRoot, mutationAudit.jsonPath),
      mutationReadinessRepairPlan: ref(input.vaultRoot, repairPlan.jsonPath),
      liveAdapterReadiness: ref(input.vaultRoot, readiness.jsonPath),
      liveAdapterNextActions: ref(input.vaultRoot, nextActions.jsonPath),
      liveAdapterApprovalPack: ref(input.vaultRoot, approvalPack.jsonPath),
      liveAdapterApprovalReviewAudit: ref(input.vaultRoot, approvalReviewAudit.jsonPath),
      liveAdapterEvidenceTemplates: ref(input.vaultRoot, evidenceTemplates.jsonPath),
      liveAdapterOperatorEvidenceAudit: ref(input.vaultRoot, operatorAudit.jsonPath),
      liveAdapterOperatorEvidenceWorkplan: ref(input.vaultRoot, workplan.jsonPath),
      liveAdapterOperatorEvidenceWorkspace: ref(input.vaultRoot, workspace.jsonPath),
      liveAdapterOperatorEvidenceAssist: ref(input.vaultRoot, assist.jsonPath),
      liveAdapterOperatorEvidenceBatchCheck: ref(input.vaultRoot, batchCheck.jsonPath),
      liveAdapterOperatorEvidenceQueue: ref(input.vaultRoot, queue.jsonPath),
      liveAdapterOperatorEvidenceNext: nextPacket ? ref(input.vaultRoot, nextPacket.jsonPath) : undefined,
      liveAdapterOperatorEvidenceSection: nextSection ? ref(input.vaultRoot, nextSection.jsonPath) : undefined,
      liveAdapterOperatorEvidenceDraft: nextDraft ? ref(input.vaultRoot, nextDraft.jsonPath) : undefined,
      liveAdapterOperatorEvidenceDraftPack: ref(input.vaultRoot, draftPack.jsonPath),
      liveAdapterReviewSession: ref(input.vaultRoot, reviewSession.jsonPath),
      liveAdapterCutoverAudit: ref(input.vaultRoot, cutoverAudit.jsonPath),
      liveAdapterDossiers: dossiers.map((dossier) => ref(input.vaultRoot, dossier.jsonPath)),
      gbrainExport: ref(input.vaultRoot, gbrain.jsonPath),
      artifactChecks: ref(input.vaultRoot, preRoadmapArtifactChecks.jsonPath),
      roadmapCompletionAudit: ref(input.vaultRoot, roadmapCompletion.jsonPath)
    },
    commands: {
      status: `npm run ariadne -- status --project ${project}`,
      e2eSmoke: `npm run ariadne -- e2e-smoke --project ${project}`,
      roadmapControlRefresh: `npm run ariadne -- roadmap-control-refresh --project ${project}`,
      nextOperatorPacket: selected
        ? `npm run ariadne -- live-adapter-operator-evidence-next --project ${project} --target ${selected.target}`
        : undefined,
      nextOperatorSection: selected
        ? `npm run ariadne -- operator-section --project ${project} --target ${selected.target}`
        : undefined,
      nextOperatorDraft: selected
        ? `npm run ariadne -- live-adapter-operator-evidence-draft --project ${project} --target ${selected.target}`
        : undefined,
      operatorDraftPack: `npm run ariadne -- live-adapter-operator-evidence-drafts --project ${project}`
    },
    notes: [
      "This refresh is non-mutating: it does not approve mutations, grant live-adapter authority, or import operator evidence.",
      "The GBrain export is refreshed after the roadmap completion audit so advisory memory sees the latest control state.",
      "A blocked status is expected while operator evidence or cutover gates still require human proof."
    ]
  };
  let jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "roadmap-control-refresh.json", report);
  let markdownPath = await writeTextArtifact(input.vaultRoot, project, "control", "roadmap-control-refresh.md", renderReport(report));
  const finalArtifactChecks = await generateArtifactCheckReport({ project, vaultRoot: input.vaultRoot });
  report.summary.artifactStatus = finalArtifactChecks.report.status;
  report.summary.artifactMissingRequired = finalArtifactChecks.report.summary.missingRequired;
  report.artifacts.artifactChecks = ref(input.vaultRoot, finalArtifactChecks.jsonPath);
  if (input.refreshConsole) {
    const console = await generateConsoleHtml({ project, vaultRoot: input.vaultRoot, refreshData: true });
    report.summary.consoleRefreshed = true;
    report.artifacts.consoleHtml = ref(input.vaultRoot, console.htmlPath);
    if (console.dataPath) {
      report.artifacts.consoleData = ref(input.vaultRoot, console.dataPath);
    }
  }
  jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "roadmap-control-refresh.json", report);
  markdownPath = await writeTextArtifact(input.vaultRoot, project, "control", "roadmap-control-refresh.md", renderReport(report));
  return { jsonPath, markdownPath, report };
}

function ref(vaultRoot: string, filePath: string): string {
  if (!path.isAbsolute(filePath)) {
    throw new Error(`Expected an absolute artifact path, got ${filePath}.`);
  }
  const relativePath = path.relative(vaultRoot, filePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Artifact path is outside the vault root: ${filePath}.`);
  }
  return relativePath;
}

function renderReport(report: RoadmapControlRefreshReport): string {
  return [
    "# Roadmap Control Refresh",
    "",
    `Project: ${report.project}`,
    `Status: ${report.status}`,
    `Generated: ${report.generatedAt}`,
    `Mutation approved: ${report.mutationApproved}`,
    `Approval granted: ${report.approvalGranted}`,
    `Operator evidence record created: ${report.operatorEvidenceRecordCreated}`,
    "",
    "## Summary",
    "",
    `- Roadmap: ${report.summary.roadmapStatus} (${report.summary.roadmapBlocked} blocked)`,
    `- Artifact checks: ${report.summary.artifactStatus} (${report.summary.artifactMissingRequired} required missing)`,
    `- Live adapter next actions: ${report.summary.liveAdapterStatus}`,
    `- Operator evidence: ${report.summary.operatorEvidenceStatus}`,
    `- Operator queue: ${report.summary.operatorQueueStatus}`,
    `- Operator next target: ${report.summary.operatorNextTarget ?? "none"}`,
    `- GBrain documents: ${report.summary.gbrainDocuments}`,
    `- Dossiers: ${report.summary.dossiers}`,
    `- Console refreshed: ${report.summary.consoleRefreshed ? "yes" : "no"}`,
    "",
    "## Commands",
    "",
    `- Status: \`${report.commands.status}\``,
    `- E2E smoke: \`${report.commands.e2eSmoke}\``,
    `- Refresh: \`${report.commands.roadmapControlRefresh}\``,
    ...(report.commands.nextOperatorPacket ? [`- Next operator packet: \`${report.commands.nextOperatorPacket}\``] : []),
    ...(report.commands.nextOperatorSection ? [`- Next operator section: \`${report.commands.nextOperatorSection}\``] : []),
    ...(report.commands.nextOperatorDraft ? [`- Next operator draft: \`${report.commands.nextOperatorDraft}\``] : []),
    `- Operator draft pack: \`${report.commands.operatorDraftPack}\``,
    "",
    "## Artifacts",
    "",
    "| Artifact | Ref |",
    "| --- | --- |",
    ...Object.entries(report.artifacts).flatMap(([key, value]) =>
      Array.isArray(value)
        ? value.map((item) => `| ${key} | ${item} |`)
        : value
          ? [`| ${key} | ${value} |`]
          : []
    ),
    "",
    "## Notes",
    "",
    ...report.notes.map((note) => `- ${note}`),
    ""
  ].join("\n");
}
