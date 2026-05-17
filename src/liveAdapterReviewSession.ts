import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateLiveAdapterApprovalPack } from "./liveAdapterApprovalPack.js";
import { generateLiveAdapterApprovalReviewAudit } from "./liveAdapterApprovalReviewAudit.js";
import { generateLiveAdapterCutoverAudit } from "./liveAdapterCutoverAudit.js";
import { generateLiveAdapterNextActions } from "./liveAdapterNextActions.js";
import { generateLiveAdapterOperatorEvidenceAudit } from "./liveAdapterOperatorEvidence.js";
import { isLiveAdapterTarget, LIVE_ADAPTER_TARGETS } from "./liveAdapterTargets.js";
import { generateLiveAdapterTargetDossier } from "./liveAdapterTargetDossier.js";
import { projectDir, slugifyProject } from "./paths.js";
import type {
  LiveAdapterOperatorEvidenceAssist,
  LiveAdapterOperatorEvidenceQueue,
  LiveAdapterReviewSession,
  LiveAdapterTargetDossier
} from "./types.js";

export async function generateLiveAdapterReviewSession(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; session: LiveAdapterReviewSession }> {
  const project = slugifyProject(input.project);
  const nextActions = await generateLiveAdapterNextActions({ project, vaultRoot: input.vaultRoot });
  const approvalPack = await generateLiveAdapterApprovalPack({ project, vaultRoot: input.vaultRoot });
  const approvalReviewAudit = await generateLiveAdapterApprovalReviewAudit({ project, vaultRoot: input.vaultRoot });
  const operatorEvidenceAudit = await generateLiveAdapterOperatorEvidenceAudit({ project, vaultRoot: input.vaultRoot });
  const [operatorEvidenceQueue, operatorEvidenceAssist, dossiers] = await Promise.all([
    readExistingOperatorEvidenceQueue(input.vaultRoot, project),
    readExistingOperatorEvidenceAssist(input.vaultRoot, project),
    Promise.all(
      LIVE_ADAPTER_TARGETS.map((target) => generateLiveAdapterTargetDossier({ project, vaultRoot: input.vaultRoot, target }))
    )
  ]);
  const cutoverAudit = await generateLiveAdapterCutoverAudit({ project, vaultRoot: input.vaultRoot });
  const dossierByTarget = new Map(dossiers.map((dossier) => [dossier.dossier.target, dossier]));
  const approvalPacketByTarget = new Map(approvalPack.report.packets.map((packet) => [packet.target, packet]));
  const reviewAuditByTarget = new Map(approvalReviewAudit.audit.targets.map((target) => [target.target, target]));
  const cutoverByTarget = new Map(cutoverAudit.audit.targets.map((target) => [target.target, target]));
  const operatorEvidenceByTarget = new Map(operatorEvidenceAudit.audit.targets.map((target) => [target.target, target]));
  const queueByTarget = new Map(operatorEvidenceQueue?.targets.map((target) => [target.target, target]) ?? []);
  const assistByTarget = new Map(operatorEvidenceAssist?.targets.map((target) => [target.target, target]) ?? []);

  const targets = nextActions.report.targets.map((target) => {
    const dossierResult = dossierByTarget.get(target.target);
    if (!dossierResult) throw new Error(`Missing live-adapter dossier for ${target.target}.`);
    const dossier = dossierResult.dossier;
    const packet = approvalPacketByTarget.get(target.target);
    const reviewAuditTarget = reviewAuditByTarget.get(target.target);
    const cutoverTarget = cutoverByTarget.get(target.target);
    const operatorEvidenceTarget = operatorEvidenceByTarget.get(target.target);
    const queueTarget = queueByTarget.get(target.target);
    const assistTarget = assistByTarget.get(target.target);
    if (!reviewAuditTarget) throw new Error(`Missing live-adapter approval-review audit target for ${target.target}.`);
    if (!cutoverTarget) throw new Error(`Missing live-adapter cutover target for ${target.target}.`);
    if (!operatorEvidenceTarget) throw new Error(`Missing live-adapter operator evidence audit target for ${target.target}.`);
    const operatorEvidenceFile = `vault/projects/${project}/control/operator-evidence/${operatorEvidenceTarget.target}/operator-evidence.md`;
    const operatorEvidenceFileRef = operatorEvidenceFile.replace(/^vault\//, "");
    const reviewCommand =
      target.actions.find((action) => action.id.endsWith("-approval-pack-review"))?.command ??
      `npm run ariadne -- live-adapter-approval-review --project ${project} --target ${target.target} --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>`;
    const status = reviewSessionTargetStatus(cutoverTarget.status, packet !== undefined, reviewAuditTarget.status, target.actions.length);
    return {
      target: target.target,
      status,
      readinessStatus: target.readinessStatus,
      cutoverStatus: cutoverTarget.status,
      reviewAuditStatus: reviewAuditTarget.status,
      firstAction: target.actions[0]?.title,
      reviewCommand,
      approvalRequestCommand: packet?.approvalRequestCommand,
      mutationPlanCommand: packet?.mutationPlanCommand,
      operatorEvidenceStatus: operatorEvidenceStatus(operatorEvidenceTarget.status),
      operatorEvidenceQueueStatus: queueTarget?.status,
      operatorEvidenceFileRef,
      operatorEvidenceCheckCommand: `npm run ariadne -- live-adapter-operator-evidence-check --project ${project} --target ${operatorEvidenceTarget.target} --from ${operatorEvidenceFile}`,
      operatorEvidenceImportCommand: `npm run ariadne -- live-adapter-operator-evidence --project ${project} --target ${operatorEvidenceTarget.target} --from ${operatorEvidenceFile} --by <operator>`,
      latestOperatorEvidenceCheckRef: queueTarget?.latestCheckRef,
      operatorEvidenceAssistFileRef: assistTarget?.assistFileRef,
      operatorEvidenceAssistNextSteps: assistTarget?.nextSteps ?? [],
      missingOperatorEvidenceSections: operatorEvidenceTarget.missingSections,
      requiredEvidence: packet?.requiredEvidence ?? [],
      blockers: target.blockers,
      cutoverBlockers: cutoverTarget.blockers,
      dossierRef: path.relative(input.vaultRoot, dossierResult.jsonPath),
      gbrainContext: dossier.gbrainContext,
      evidenceRefs: reviewSessionEvidenceRefs(input.vaultRoot, project, dossier, dossierResult.jsonPath, target.actions.flatMap((action) => action.evidenceRefs))
    };
  });

  const summary = {
    targets: targets.length,
    operatorReviewRequired: targets.filter((target) => target.status === "operator_review_required").length,
    readyForAdapterWork: targets.filter((target) => target.status === "ready_for_adapter_work").length,
    blocked: targets.filter((target) => target.status === "blocked").length,
    actionItems: nextActions.report.summary.actionItems,
    currentAcceptedReviews: approvalReviewAudit.audit.summary.currentAcceptedReviews,
    cutoverReady: cutoverAudit.audit.summary.ready,
    gbrainReports: Array.from(new Set(targets.flatMap((target) => target.gbrainContext.reportRefs))).length
  };
  const session: LiveAdapterReviewSession = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status: summary.operatorReviewRequired > 0 || summary.blocked > 0 ? "operator_review_required" : "ready_for_adapter_work",
    mutationApproved: false,
    operatorDecisionRequired: true,
    nextActionsRef: path.relative(input.vaultRoot, nextActions.jsonPath),
    approvalPackRef: path.relative(input.vaultRoot, approvalPack.jsonPath),
    approvalReviewAuditRef: path.relative(input.vaultRoot, approvalReviewAudit.jsonPath),
    cutoverAuditRef: path.relative(input.vaultRoot, cutoverAudit.jsonPath),
    operatorEvidenceAuditRef: path.relative(input.vaultRoot, operatorEvidenceAudit.jsonPath),
    operatorEvidenceQueueRef: operatorEvidenceQueue ? `projects/${project}/control/live-adapter-operator-evidence-queue.json` : undefined,
    operatorEvidenceAssistRef: operatorEvidenceAssist ? `projects/${project}/control/live-adapter-operator-evidence-assist.json` : undefined,
    dossierDirRef: vaultRelative(input.vaultRoot, path.join(projectDir(input.vaultRoot, project), "control", "live-adapter-dossiers")),
    summary,
    targets
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "live-adapter-review-session.json", session);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control",
    "live-adapter-review-session.md",
    renderSession(session)
  );
  return { jsonPath, markdownPath, session };
}

function reviewSessionTargetStatus(
  cutoverStatus: LiveAdapterReviewSession["targets"][number]["cutoverStatus"],
  packetPresent: boolean,
  reviewAuditStatus: LiveAdapterReviewSession["targets"][number]["reviewAuditStatus"],
  actionCount: number
): LiveAdapterReviewSession["targets"][number]["status"] {
  if (cutoverStatus === "ready_for_cutover") return "ready_for_adapter_work";
  if (packetPresent && actionCount > 0 && reviewAuditStatus !== "current_accepted") return "operator_review_required";
  return "blocked";
}

function operatorEvidenceStatus(status: "complete" | "incomplete" | "missing_evidence"): LiveAdapterReviewSession["targets"][number]["operatorEvidenceStatus"] {
  if (status === "complete") return "complete";
  return status === "incomplete" ? "needs_rework" : "needs_evidence";
}

function reviewSessionEvidenceRefs(
  vaultRoot: string,
  project: string,
  dossier: LiveAdapterTargetDossier,
  dossierPath: string,
  actionEvidenceRefs: string[]
): string[] {
  return Array.from(
    new Set(
      [
        path.relative(vaultRoot, dossierPath),
        ...dossier.evidenceRefs,
        ...actionEvidenceRefs,
        ...dossier.gbrainContext.reportRefs
      ].map((ref) => canonicalEvidenceRef(project, ref))
    )
  );
}

async function readExistingOperatorEvidenceQueue(
  vaultRoot: string,
  project: string
): Promise<LiveAdapterOperatorEvidenceQueue | undefined> {
  return readExistingJson<LiveAdapterOperatorEvidenceQueue>(
    path.join(projectDir(vaultRoot, project), "control", "live-adapter-operator-evidence-queue.json"),
    isOperatorEvidenceQueue
  );
}

async function readExistingOperatorEvidenceAssist(
  vaultRoot: string,
  project: string
): Promise<LiveAdapterOperatorEvidenceAssist | undefined> {
  return readExistingJson<LiveAdapterOperatorEvidenceAssist>(
    path.join(projectDir(vaultRoot, project), "control", "live-adapter-operator-evidence-assist.json"),
    isOperatorEvidenceAssist
  );
}

async function readExistingJson<T>(filePath: string, guard: (value: unknown) => value is T): Promise<T | undefined> {
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as unknown;
    return guard(parsed) ? parsed : undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

function isOperatorEvidenceQueue(value: unknown): value is LiveAdapterOperatorEvidenceQueue {
  return (
    Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    (value as LiveAdapterOperatorEvidenceQueue).schemaVersion === 1 &&
    Array.isArray((value as LiveAdapterOperatorEvidenceQueue).targets) &&
    (value as LiveAdapterOperatorEvidenceQueue).targets.every(isOperatorEvidenceQueueTarget)
  );
}

function isOperatorEvidenceAssist(value: unknown): value is LiveAdapterOperatorEvidenceAssist {
  return (
    Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    (value as LiveAdapterOperatorEvidenceAssist).schemaVersion === 1 &&
    Array.isArray((value as LiveAdapterOperatorEvidenceAssist).targets) &&
    (value as LiveAdapterOperatorEvidenceAssist).targets.every(isOperatorEvidenceAssistTarget) &&
    (value as LiveAdapterOperatorEvidenceAssist).operatorEvidenceRecordCreated === false &&
    (value as LiveAdapterOperatorEvidenceAssist).mutationApproved === false &&
    (value as LiveAdapterOperatorEvidenceAssist).approvalGranted === false
  );
}

function isOperatorEvidenceQueueTarget(value: unknown): value is LiveAdapterOperatorEvidenceQueue["targets"][number] {
  return (
    Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    isLiveAdapterTarget((value as LiveAdapterOperatorEvidenceQueue["targets"][number]).target) &&
    typeof (value as LiveAdapterOperatorEvidenceQueue["targets"][number]).status === "string"
  );
}

function isOperatorEvidenceAssistTarget(value: unknown): value is LiveAdapterOperatorEvidenceAssist["targets"][number] {
  return (
    Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    isLiveAdapterTarget((value as LiveAdapterOperatorEvidenceAssist["targets"][number]).target) &&
    typeof (value as LiveAdapterOperatorEvidenceAssist["targets"][number]).assistFileRef === "string" &&
    Array.isArray((value as LiveAdapterOperatorEvidenceAssist["targets"][number]).nextSteps) &&
    (value as LiveAdapterOperatorEvidenceAssist["targets"][number]).nextSteps.every((step) => typeof step === "string")
  );
}

function canonicalEvidenceRef(project: string, ref: string): string {
  const normalized = ref.split(path.sep).join("/");
  return normalized.startsWith(`projects/${project}/`) ? normalized : `projects/${project}/${normalized}`;
}

function vaultRelative(vaultRoot: string, absolutePath: string): string {
  return path.relative(vaultRoot, absolutePath).split(path.sep).join("/");
}

function renderSession(session: LiveAdapterReviewSession): string {
  return [
    "# Live Adapter Review Session",
    "",
    `Project: ${session.project}`,
    `Status: ${session.status}`,
    `Generated: ${session.generatedAt}`,
    `Mutation approved: ${session.mutationApproved}`,
    `Operator decision required: ${session.operatorDecisionRequired}`,
    "",
    "## Summary",
    "",
    `- Targets: ${session.summary.targets}`,
    `- Operator review required: ${session.summary.operatorReviewRequired}`,
    `- Ready for adapter work: ${session.summary.readyForAdapterWork}`,
    `- Blocked: ${session.summary.blocked}`,
    `- Action items: ${session.summary.actionItems}`,
    `- Current accepted reviews: ${session.summary.currentAcceptedReviews}`,
    `- Cutover-ready targets: ${session.summary.cutoverReady}`,
    `- GBrain reports: ${session.summary.gbrainReports}`,
    "",
    "## Rule",
    "",
    "This session is a review packet. It does not approve mutation and does not authorize external-system changes. GBrain context is advisory memory only; Ariadne artifacts remain the source of truth.",
    "",
    "## References",
    "",
    `- Next actions: ${session.nextActionsRef}`,
    `- Approval pack: ${session.approvalPackRef}`,
    `- Approval-review audit: ${session.approvalReviewAuditRef}`,
    `- Cutover audit: ${session.cutoverAuditRef}`,
    `- Operator evidence audit: ${session.operatorEvidenceAuditRef}`,
    ...(session.operatorEvidenceQueueRef ? [`- Operator evidence queue: ${session.operatorEvidenceQueueRef}`] : []),
    ...(session.operatorEvidenceAssistRef ? [`- Operator evidence assist: ${session.operatorEvidenceAssistRef}`] : []),
    `- Dossiers: ${session.dossierDirRef}`,
    "",
    "## Targets",
    "",
    ...session.targets.flatMap((target) => [
      `### ${target.target}`,
      "",
      `Status: ${target.status}`,
      `Readiness: ${target.readinessStatus}`,
      `Cutover: ${target.cutoverStatus}`,
      `Review audit: ${target.reviewAuditStatus}`,
      `Operator evidence: ${target.operatorEvidenceStatus}`,
      ...(target.operatorEvidenceQueueStatus ? [`Operator evidence queue: ${target.operatorEvidenceQueueStatus}`] : []),
      `First action: ${target.firstAction ?? "none"}`,
      `Dossier: ${target.dossierRef}`,
      "",
      "#### Operator Evidence Action",
      "",
      `Evidence file: ${target.operatorEvidenceFileRef}`,
      "",
      "```bash",
      target.operatorEvidenceCheckCommand,
      target.operatorEvidenceImportCommand,
      "```",
      "",
      "Missing operator evidence sections:",
      ...list(target.missingOperatorEvidenceSections),
      ...(target.latestOperatorEvidenceCheckRef
        ? ["", `Latest preflight: ${target.latestOperatorEvidenceCheckRef}`]
        : []),
      ...(target.operatorEvidenceAssistFileRef
        ? [
            "",
            `Read-only assist: ${target.operatorEvidenceAssistFileRef}`,
            "",
            "Assist next steps:",
            ...list(target.operatorEvidenceAssistNextSteps)
          ]
        : []),
      "",
      "#### Review Command",
      "",
      "```bash",
      target.reviewCommand,
      "```",
      "",
      ...(target.approvalRequestCommand
        ? ["#### Approval Request Draft", "", "```bash", target.approvalRequestCommand, "```", ""]
        : []),
      ...(target.mutationPlanCommand ? ["#### Mutation Plan Draft", "", "```bash", target.mutationPlanCommand, "```", ""] : []),
      "#### Required Evidence",
      "",
      ...list(target.requiredEvidence),
      "",
      "#### Blockers",
      "",
      ...list(target.blockers),
      "",
      "#### Cutover Blockers",
      "",
      ...list(target.cutoverBlockers),
      "",
      "#### GBrain Advisory Queries",
      "",
      `Export: ${target.gbrainContext.exportRef ?? "missing"}`,
      "Reports:",
      ...list(target.gbrainContext.reportRefs),
      "Queries:",
      ...list(target.gbrainContext.suggestedQueries),
      "",
      "#### Evidence",
      "",
      ...list(target.evidenceRefs),
      ""
    ])
  ].join("\n");
}

function list(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}
