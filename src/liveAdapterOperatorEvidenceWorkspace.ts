import fs from "node:fs/promises";
import path from "node:path";
import { ensureArtifactDir, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { guidanceForHumanVerificationSection, markdownCell } from "./humanVerificationWorksheetMarkdown.js";
import { generateLiveAdapterOperatorEvidenceQueue } from "./liveAdapterOperatorEvidenceQueue.js";
import { isLiveAdapterTarget, type LiveAdapterTarget } from "./liveAdapterTargets.js";
import { projectDir, slugifyProject } from "./paths.js";
import type {
  LiveAdapterOperatorEvidenceQueue,
  LiveAdapterOperatorEvidenceWorkspace,
  LiveAdapterOperatorEvidenceWorkplan
} from "./types.js";

type WorkspaceTarget = LiveAdapterOperatorEvidenceWorkspace["targets"][number];
type QueueTarget = LiveAdapterOperatorEvidenceQueue["targets"][number];
type WorkplanTarget = LiveAdapterOperatorEvidenceWorkplan["targets"][number];
type QueueResult = { jsonPath: string; queue: LiveAdapterOperatorEvidenceQueue };

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
  target?: LiveAdapterTarget;
}): Promise<{ jsonPath: string; markdownPath: string; workspace: LiveAdapterOperatorEvidenceWorkspace }> {
  const project = slugifyProject(input.project);
  const queueResult =
    (input.target ? await readExistingQueue(input.vaultRoot, project) : undefined) ??
    (await generateLiveAdapterOperatorEvidenceQueue({ project, vaultRoot: input.vaultRoot }));
  const workplan = await readWorkplan(input.vaultRoot, queueResult.queue.workplanRef);
  const workplanByTarget = new Map(workplan.targets.map((target) => [target.target, target]));
  const generatedAt = new Date().toISOString();
  const targets: WorkspaceTarget[] = [];

  const queueTargets = input.target
    ? queueResult.queue.targets.filter((target) => target.target === input.target)
    : queueResult.queue.targets;
  if (input.target && queueTargets.length === 0) {
    throw new Error(`Missing operator evidence queue target for ${input.target}.`);
  }

  for (const queueTarget of queueTargets) {
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
    target: input.target,
    status: summary.targetsReadyForImport === summary.targets ? "ready_for_import" : "awaiting_operator_input",
    mutationApproved: false,
    approvalGranted: false,
    queueRef: path.relative(input.vaultRoot, queueResult.jsonPath),
    workplanRef: queueResult.queue.workplanRef,
    summary,
    targets
  };
  const fileStem = input.target
    ? `live-adapter-operator-evidence-workspace-${input.target}`
    : "live-adapter-operator-evidence-workspace";
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", `${fileStem}.json`, workspace);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control",
    `${fileStem}.md`,
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

  await writeTextArtifactIfMissing(
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
    }),
    { updateIfGenerated: true }
  );
  for (const fileName of SUPPORT_FILES) {
    await writeTextArtifactIfMissing(
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

async function writeTextArtifactIfMissing(
  vaultRoot: string,
  project: string,
  subdir: string,
  fileName: string,
  content: string,
  options?: { updateIfGenerated?: boolean }
): Promise<string> {
  const dir = await ensureArtifactDir(vaultRoot, project, subdir);
  const filePath = path.join(dir, fileName);
  const normalizedContent = content.endsWith("\n") ? content : `${content}\n`;
  try {
    await fs.writeFile(filePath, normalizedContent, { flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    if (!options?.updateIfGenerated) return filePath;
    const existing = await fs.readFile(filePath, "utf8");
    if (canRefreshGeneratedOperatorEvidenceTemplate(existing)) {
      // This only refreshes blank generated paperwork. If an operator edits the file
      // between the read and write, the normal preflight still treats the final file
      // as the source of truth and no evidence is imported automatically.
      await fs.writeFile(filePath, normalizedContent);
    }
  }
  return filePath;
}

async function readWorkplan(vaultRoot: string, relativeRef: string): Promise<LiveAdapterOperatorEvidenceWorkplan> {
  return JSON.parse(await fs.readFile(path.join(vaultRoot, relativeRef), "utf8")) as LiveAdapterOperatorEvidenceWorkplan;
}

async function readExistingQueue(vaultRoot: string, project: string): Promise<QueueResult | undefined> {
  const jsonPath = path.join(projectDir(vaultRoot, project), "control", "live-adapter-operator-evidence-queue.json");
  try {
    const parsed = JSON.parse(await fs.readFile(jsonPath, "utf8")) as unknown;
    if (isQueue(parsed, { vaultRoot, project })) return { jsonPath, queue: parsed };
    throw new Error(`Malformed operator evidence queue JSON or schema mismatch at ${jsonPath}. Refusing to regenerate over an existing queue.`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

function isQueue(value: unknown, input: { vaultRoot: string; project: string }): value is LiveAdapterOperatorEvidenceQueue {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const queue = value as LiveAdapterOperatorEvidenceQueue;
  if (queue.schemaVersion !== 1) return false;
  if (queue.project !== input.project) return false;
  if (typeof queue.workplanRef !== "string") return false;
  if (!queue.workplanRef.startsWith(`projects/${input.project}/control/`)) return false;
  const resolvedWorkplan = path.resolve(input.vaultRoot, queue.workplanRef);
  const projectRoot = path.resolve(projectDir(input.vaultRoot, input.project));
  const relativeToProject = path.relative(projectRoot, resolvedWorkplan);
  if (relativeToProject === "" || relativeToProject.startsWith("..") || path.isAbsolute(relativeToProject)) return false;
  if (!Array.isArray(queue.targets)) return false;
  return queue.targets.every(isQueueTarget);
}

function isQueueTarget(value: unknown): value is QueueTarget {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const target = value as QueueTarget;
  return (
    isLiveAdapterTarget(target.target) &&
    isQueueTargetStatus(target.status) &&
    Array.isArray(target.missingSections) &&
    target.missingSections.every((section) => typeof section === "string")
  );
}

function isQueueTargetStatus(value: unknown): value is QueueTarget["status"] {
  return (
    value === "complete" ||
    value === "ready_for_import" ||
    value === "needs_evidence" ||
    value === "needs_rework" ||
    value === "unchecked"
  );
}

function renderWorkspace(workspace: LiveAdapterOperatorEvidenceWorkspace): string {
  return [
    "# Live Adapter Operator Evidence Workspace",
    "",
    `Project: ${workspace.project}`,
    `Target: ${workspace.target ?? "all"}`,
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
  const missingSections = input.queueTarget.missingSections ?? [];
  const currentSection = missingSections[0];
  const currentGuidance = currentSection ? guidanceForHumanVerificationSection(currentSection) : undefined;
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
    "- Start with the Current Section Handoff and fill one section at a time.",
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
    "## Current Section Handoff",
    "",
    currentSection ? `- Current section: ${currentSection}` : "- Current section: none",
    currentGuidance ? `- Start with: ${currentGuidance.startWith}` : "- Start with: keep the current imported evidence under review",
    currentGuidance ? `- Record verified observation in: ${currentGuidance.recordIn}` : "- Record verified observation in: operator-evidence.md",
    currentGuidance ? `- Preflight expectation: ${currentGuidance.preflight}` : "- Preflight expectation: rerun the target check before cutover",
    "",
    "## Section Fill Order",
    "",
    ...renderSectionFillOrder(missingSections),
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
    ...list(missingSections),
    "",
    "## Section Observation Notes",
    "",
    ...renderSectionObservationNotes(missingSections),
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

function renderSectionFillOrder(missingSections: string[]): string[] {
  if (missingSections.length === 0) {
    return [
      "| Step | Missing section | Start with | Record verified observation in | Preflight expectation |",
      "| ---: | --- | --- | --- | --- |",
      "| 1 | none | No missing sections. | Keep the current imported evidence record under review. | Rerun the target check before cutover. |"
    ];
  }
  return [
    "| Step | Missing section | Start with | Record verified observation in | Preflight expectation |",
    "| ---: | --- | --- | --- | --- |",
    ...missingSections.map((section, index) => {
      const guidance = guidanceForHumanVerificationSection(section);
      return `| ${index + 1} | ${markdownCell(section)} | ${markdownCell(guidance.startWith)} | ${markdownCell(guidance.recordIn)} | ${markdownCell(guidance.preflight)} |`;
    })
  ];
}

function renderSectionObservationNotes(missingSections: string[]): string[] {
  if (missingSections.length === 0) {
    return ["- none"];
  }
  return missingSections.flatMap((section) => [
    `### ${section}`,
    "",
    "- Verified observation:",
    "- Source/system checked:",
    "- Evidence refs:",
    "- Decision:",
    ""
  ]);
}

function canRefreshGeneratedOperatorEvidenceTemplate(content: string): boolean {
  if (!content.startsWith("# Operator Evidence:")) return false;
  if (!content.includes("Mutation approved: false")) return false;
  if (content.includes("Operator draft marker")) return false;
  if (/^- \[[xX]\]/m.test(content)) return false;
  if (
    /^- (Operator|Review timestamp|Packet reviewed|Decision for packet completeness|Missing evidence|Notes|Query result refs|Stale assumptions found|Related Ariadne evidence refs):[^\S\r\n]+\S/m.test(
      content
    )
  ) {
    return false;
  }
  if (/^- (Verified observation|Source\/system checked|Evidence refs|Decision):[^\S\r\n]+\S/m.test(content)) return false;
  return true;
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
