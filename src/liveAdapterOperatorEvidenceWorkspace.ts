import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateLiveAdapterOperatorEvidenceQueue } from "./liveAdapterOperatorEvidenceQueue.js";
import { slugifyProject } from "./paths.js";
import type {
  LiveAdapterOperatorEvidenceQueue,
  LiveAdapterOperatorEvidenceWorkspace,
  LiveAdapterOperatorEvidenceWorkplan
} from "./types.js";

type WorkspaceTarget = LiveAdapterOperatorEvidenceWorkspace["targets"][number];
type QueueTarget = LiveAdapterOperatorEvidenceQueue["targets"][number];
type WorkplanTarget = LiveAdapterOperatorEvidenceWorkplan["targets"][number];

const SUPPORT_FILES = [
  "packet-review.md",
  "auth-boundary.md",
  "rollback-post-verify.md",
  "dry-run-review.md",
  "gbrain-notes.md",
  "read-only-assist.md"
] as const;

const USER_FACING_TARGET_LABELS = new Map<string, string>([
  ["github", "GitHub"],
  ["deployment", "deployment"],
  ["gsd2", "gsd2"],
  ["hermes-cron", "hermes-cron"],
  ["notebooklm", "notebooklm"],
  ["openscorpion", "openscorpion"]
]);

export async function generateLiveAdapterOperatorEvidenceWorkspace(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; workspace: LiveAdapterOperatorEvidenceWorkspace }> {
  const project = slugifyProject(input.project);
  const queueResult = await generateLiveAdapterOperatorEvidenceQueue({ project, vaultRoot: input.vaultRoot });
  const workplan = await readWorkplan(input.vaultRoot, queueResult.queue.workplanRef);
  const workplanByTarget = new Map(workplan.targets.map((target) => [target.target, target]));
  const generatedAt = new Date().toISOString();
  const targets: WorkspaceTarget[] = [];

  for (const queueTarget of queueResult.queue.targets) {
    const workplanTarget = workplanByTarget.get(queueTarget.target);
    if (!workplanTarget) throw new Error(`Missing operator evidence workplan target for ${queueTarget.target}.`);
    const target = await writeTargetWorkspace(input.vaultRoot, project, generatedAt, queueTarget, workplanTarget);
    targets.push(target);
  }

  const summary = {
    targets: targets.length,
    workspaceFiles: targets.length,
    supportFiles: targets.reduce((count, target) => count + target.supportFileRefs.length, 0),
    targetsNeedingEvidence: targets.filter(
      (target) =>
        target.status === "needs_evidence" || target.status === "needs_rework" || target.status === "unchecked"
    ).length,
    targetsReadyForImport: targets.filter((target) => target.status === "ready_for_import").length,
    gbrainQueryItems: targets.reduce((count, target) => count + target.gbrainQueries.length, 0)
  };
  const workspace: LiveAdapterOperatorEvidenceWorkspace = {
    schemaVersion: 1,
    project,
    generatedAt,
    status: summary.targetsReadyForImport === summary.targets ? "ready_for_import" : "awaiting_operator_input",
    mutationApproved: false,
    approvalGranted: false,
    queueRef: path.relative(input.vaultRoot, queueResult.jsonPath),
    workplanRef: queueResult.queue.workplanRef,
    summary,
    targets
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "live-adapter-operator-evidence-workspace.json", workspace);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control",
    "live-adapter-operator-evidence-workspace.md",
    renderWorkspace(workspace)
  );
  return { jsonPath, markdownPath, workspace };
}

async function writeTargetWorkspace(
  vaultRoot: string,
  project: string,
  generatedAt: string,
  queueTarget: QueueTarget,
  workplanTarget: WorkplanTarget
): Promise<WorkspaceTarget> {
  const workspaceDir = `control/operator-evidence/${queueTarget.target}`;
  const evidenceFileName = "operator-evidence.md";
  const evidenceFileRef = `projects/${project}/${workspaceDir}/${evidenceFileName}`;
  const checkCommand = `npm run ariadne -- live-adapter-operator-evidence-check --project ${project} --target ${queueTarget.target} --from vault/${evidenceFileRef}`;
  const importCommand = `npm run ariadne -- live-adapter-operator-evidence --project ${project} --target ${queueTarget.target} --from vault/${evidenceFileRef} --by <operator>`;
  const supportFileRefs = SUPPORT_FILES.map((fileName) => `projects/${project}/${workspaceDir}/${fileName}`);

  await writeTextArtifact(
    vaultRoot,
    project,
    workspaceDir,
    evidenceFileName,
    renderTargetEvidenceFile({
      project,
      generatedAt,
      queueTarget,
      workplanTarget,
      checkCommand,
      importCommand,
      supportFileRefs
    })
  );
  for (const fileName of SUPPORT_FILES) {
    await writeTextArtifact(
      vaultRoot,
      project,
      workspaceDir,
      fileName,
      renderSupportFile(fileName, project, generatedAt, queueTarget, workplanTarget, checkCommand, importCommand)
    );
  }

  return {
    target: queueTarget.target,
    status: queueTarget.status,
    workspaceDirRef: `projects/${project}/${workspaceDir}`,
    evidenceFileRef,
    supportFileRefs,
    checkCommand,
    importCommand,
    missingSections: queueTarget.missingSections,
    requiredEvidence: workplanTarget.requiredEvidence,
    cutoverBlockers: workplanTarget.cutoverBlockers,
    gbrainQueries: workplanTarget.gbrainQueries
  };
}

async function readWorkplan(vaultRoot: string, relativeRef: string): Promise<LiveAdapterOperatorEvidenceWorkplan> {
  return JSON.parse(await fs.readFile(path.join(vaultRoot, relativeRef), "utf8")) as LiveAdapterOperatorEvidenceWorkplan;
}

function renderWorkspace(workspace: LiveAdapterOperatorEvidenceWorkspace): string {
  return [
    "# Live Adapter Operator Evidence Workspace",
    "",
    `Project: ${workspace.project}`,
    `Status: ${workspace.status}`,
    `Generated: ${workspace.generatedAt}`,
    `Mutation approved: ${workspace.mutationApproved}`,
    `Approval granted: ${workspace.approvalGranted}`,
    "",
    "## Rule",
    "",
    "This workspace is fillable operator paperwork. It does not create evidence records, approve mutation, or grant live-adapter authority.",
    "",
    "## References",
    "",
    `- Queue: ${workspace.queueRef}`,
    `- Workplan: ${workspace.workplanRef}`,
    "",
    "## Summary",
    "",
    `- Targets: ${workspace.summary.targets}`,
    `- Workspace files: ${workspace.summary.workspaceFiles}`,
    `- Support files: ${workspace.summary.supportFiles}`,
    `- Targets needing evidence: ${workspace.summary.targetsNeedingEvidence}`,
    `- Targets ready for import: ${workspace.summary.targetsReadyForImport}`,
    `- GBrain query items: ${workspace.summary.gbrainQueryItems}`,
    "",
    "## Targets",
    "",
    ...workspace.targets.flatMap((target) => [
      `### ${target.target}`,
      "",
      `Status: ${target.status}`,
      `Workspace: ${target.workspaceDirRef}`,
      `Evidence file: ${target.evidenceFileRef}`,
      "",
      "#### Check Command",
      "",
      "```bash",
      target.checkCommand,
      "```",
      "",
      "#### Import Command",
      "",
      "```bash",
      target.importCommand,
      "```",
      "",
      "#### Missing Sections",
      "",
      ...list(target.missingSections),
      "",
      "#### Support Files",
      "",
      ...list(target.supportFileRefs),
      ""
    ])
  ].join("\n");
}

function renderTargetEvidenceFile(input: {
  project: string;
  generatedAt: string;
  queueTarget: QueueTarget;
  workplanTarget: WorkplanTarget;
  checkCommand: string;
  importCommand: string;
  supportFileRefs: string[];
}): string {
  const targetLabel = displayTarget(input.queueTarget.target);
  return [
    `# Operator Evidence: ${targetLabel}`,
    "",
    `Project: ${input.project}`,
    `Generated: ${input.generatedAt}`,
    `Current queue status: ${input.queueTarget.status}`,
    "Mutation approved: false",
    "Approval granted: false",
    "",
    "## Instructions",
    "",
    "- Fill this file with real operator observations before importing it.",
    "- Leave unknown or unverified items unchecked.",
    "- Keep supporting notes in the sibling files listed below.",
    "- Run the check command before running the import command.",
    "",
    "## Commands",
    "",
    "### Check",
    "",
    "```bash",
    input.checkCommand,
    "```",
    "",
    "### Import",
    "",
    "```bash",
    input.importCommand,
    "```",
    "",
    "## Operator Observations",
    "",
    "- Operator:",
    "- Review timestamp:",
    "- Packet reviewed:",
    "- Decision for packet completeness:",
    "- Missing evidence:",
    "- Notes:",
    "",
    "## Required Evidence To Attach",
    "",
    ...evidenceChecklist(input.workplanTarget.requiredEvidence).map((item) => `- [ ] ${item}`),
    "",
    "## Support File Refs",
    "",
    ...list(input.supportFileRefs.map(toVaultRef)),
    "",
    "## Current Missing Sections",
    "",
    ...list(input.queueTarget.missingSections),
    "",
    "## Current Cutover Blockers",
    "",
    ...list(formatUserFacingItems(input.workplanTarget.cutoverBlockers, input.queueTarget.target)),
    "",
    "## GBrain Advisory Queries",
    "",
    ...formatUserFacingItems(input.workplanTarget.gbrainQueries, input.queueTarget.target).map((query) => `- [ ] ${query}`),
    "",
    "## GBrain Notes",
    "",
    "- Query result refs:",
    "- Stale assumptions found:",
    "- Related Ariadne evidence refs:",
    ""
  ].join("\n");
}

function renderSupportFile(
  fileName: (typeof SUPPORT_FILES)[number],
  project: string,
  generatedAt: string,
  queueTarget: QueueTarget,
  workplanTarget: WorkplanTarget,
  checkCommand: string,
  importCommand: string
): string {
  const title = fileName.replace(".md", "").replace(/-/g, " ");
  const targetLabel = displayTarget(queueTarget.target);
  return [
    `# ${title}: ${targetLabel}`,
    "",
    `Project: ${project}`,
    `Generated: ${generatedAt}`,
    "Mutation approved: false",
    "",
    "## Purpose",
    "",
    supportPurpose(fileName),
    "",
    "## Observations",
    "",
    "- Operator:",
    "- Timestamp:",
    "- Evidence refs:",
    "- Decision or finding:",
    "- Notes:",
    "",
    "## Related Commands",
    "",
    "```bash",
    checkCommand,
    importCommand,
    workplanTarget.reviewCommand,
    "```",
    "",
    "## Relevant Cutover Blockers",
    "",
    ...list(formatUserFacingItems(workplanTarget.cutoverBlockers, queueTarget.target)),
    ""
  ].join("\n");
}

function evidenceChecklist(requiredEvidence: string[]): string[] {
  return Array.from(
    new Set([
      "operator identity and review timestamp",
      "reviewed approval packet path and generation timestamp",
      "authentication or authorization boundary observed for this target",
      "bounded action statement and explicit non-goals",
      "rollback or disable path checked by the operator",
      "post-action verification command checked by the operator",
      "dry-run command and expected safe output shape",
      "target-guarded execution command and expected post-verification output shape",
      "proof that execution used mutation-execute or a target-specific wrapper with an exact --confirm-plan match",
      ...requiredEvidence
    ])
  );
}

function supportPurpose(fileName: (typeof SUPPORT_FILES)[number]): string {
  switch (fileName) {
    case "packet-review.md":
      return "Record the operator's review of the generated approval packet before any approval decision exists.";
    case "auth-boundary.md":
      return "Record observed authentication, authorization, and account-boundary facts for this target.";
    case "rollback-post-verify.md":
      return "Record rollback or disable steps and the exact post-action verification command shape.";
    case "dry-run-review.md":
      return "Record the dry-run command, expected safe output, and whether the output was reviewed.";
    case "gbrain-notes.md":
      return "Record advisory GBrain query outputs and link them back to Ariadne evidence refs.";
    case "read-only-assist.md":
      return "Review read-only Ariadne support refs gathered for this target. This file is not operator evidence until a human verifies the facts in operator-evidence.md.";
  }
}

function list(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}

function toVaultRef(ref: string): string {
  return ref.startsWith("vault/") ? ref : `vault/${ref}`;
}

function displayTarget(target: string): string {
  return USER_FACING_TARGET_LABELS.get(target) ?? target;
}

function formatUserFacingItems(items: string[], target: string): string[] {
  const label = USER_FACING_TARGET_LABELS.get(target);
  if (!label) return items;
  if (label === target) return items;
  return items.map((item) => item.replace(new RegExp(`\\b${escapeRegExp(target)}\\b`, "g"), label));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
