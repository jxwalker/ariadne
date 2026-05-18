import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import type { LiveAdapterTarget } from "./liveAdapterTargets.js";
import { generateLiveAdapterOperatorEvidenceWorkspace } from "./liveAdapterOperatorEvidenceWorkspace.js";
import { generateLiveAdapterOperatorEvidenceWorkplan } from "./liveAdapterOperatorEvidenceWorkplan.js";
import { projectDir, slugifyProject } from "./paths.js";
import type {
  LiveAdapterOperatorEvidenceAssist,
  LiveAdapterOperatorEvidenceWorkspace
} from "./types.js";

type AssistTarget = LiveAdapterOperatorEvidenceAssist["targets"][number];
type WorkspaceResult = { jsonPath: string; workspace: LiveAdapterOperatorEvidenceWorkspace };
type WorkspaceTarget = LiveAdapterOperatorEvidenceWorkspace["targets"][number];

export async function generateLiveAdapterOperatorEvidenceAssist(input: {
  project: string;
  vaultRoot: string;
  target?: LiveAdapterTarget;
}): Promise<{ jsonPath: string; markdownPath: string; assist: LiveAdapterOperatorEvidenceAssist }> {
  const project = slugifyProject(input.project);
  const generatedAt = new Date().toISOString();
  const workspaceResult =
    (await readExistingWorkspace(input.vaultRoot, project, input.target)) ??
    (await generateLiveAdapterOperatorEvidenceWorkspace({ project, vaultRoot: input.vaultRoot, target: input.target }));
  const workspace = workspaceResult.workspace;
  // Preserve existing workspace files, but refresh the stable workplan artifact so assist packets see newly promoted read-only evidence.
  const workplanResult = await generateLiveAdapterOperatorEvidenceWorkplan({ project, vaultRoot: input.vaultRoot });
  const workplan = workplanResult.workplan;
  const workplanByTarget = new Map(workplan.targets.map((target) => [target.target, target]));
  const targets: AssistTarget[] = [];

  for (const workspaceTarget of workspace.targets) {
    const workplanTarget = workplanByTarget.get(workspaceTarget.target);
    if (!workplanTarget) throw new Error(`Missing workplan target for ${workspaceTarget.target}.`);
    const existingEvidenceRefs = await existingRefs(input.vaultRoot, project, workplanTarget.evidenceRefs);
    const assistFileRef = `projects/${project}/control/operator-evidence/${workspaceTarget.target}/read-only-assist.md`;
    const supportFileRefs = Array.from(new Set([...workspaceTarget.supportFileRefs, assistFileRef]));
    const target: AssistTarget = {
      target: workspaceTarget.target,
      status: workspaceTarget.status,
      assistFileRef,
      workspaceDirRef: workspaceTarget.workspaceDirRef,
      evidenceFileRef: workspaceTarget.evidenceFileRef,
      checkCommand: workspaceTarget.checkCommand,
      importCommand: workspaceTarget.importCommand,
      existingEvidenceRefs,
      supportFileRefs,
      missingSections: workspaceTarget.missingSections,
      requiredEvidence: workspaceTarget.requiredEvidence,
      cutoverBlockers: workspaceTarget.cutoverBlockers,
      gbrainQueries: workspaceTarget.gbrainQueries,
      nextSteps: nextSteps(workspaceTarget)
    };
    await writeTextArtifact(
      input.vaultRoot,
      project,
      `control/operator-evidence/${workspaceTarget.target}`,
      "read-only-assist.md",
      renderTargetAssist(project, generatedAt, target)
    );
    targets.push(target);
  }

  const summary = {
    targets: targets.length,
    assistFiles: targets.length,
    existingEvidenceRefs: targets.reduce((count, target) => count + target.existingEvidenceRefs.length, 0),
    supportFileRefs: targets.reduce((count, target) => count + target.supportFileRefs.length, 0),
    missingSections: targets.reduce((count, target) => count + target.missingSections.length, 0),
    cutoverBlockers: targets.reduce((count, target) => count + target.cutoverBlockers.length, 0),
    gbrainQueries: targets.reduce((count, target) => count + target.gbrainQueries.length, 0)
  };
  const assist: LiveAdapterOperatorEvidenceAssist = {
    schemaVersion: 1,
    project,
    generatedAt,
    target: input.target,
    status: targets.length > 0 ? "awaiting_operator_review" : "no_targets",
    mutationApproved: false,
    approvalGranted: false,
    operatorEvidenceRecordCreated: false,
    workspaceRef: path.relative(input.vaultRoot, workspaceResult.jsonPath),
    queueRef: workspace.queueRef,
    workplanRef: path.relative(input.vaultRoot, workplanResult.jsonPath),
    summary,
    targets
  };
  const fileStem = input.target
    ? `live-adapter-operator-evidence-assist-${input.target}`
    : "live-adapter-operator-evidence-assist";
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", `${fileStem}.json`, assist);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control",
    `${fileStem}.md`,
    renderAssist(assist)
  );
  return { jsonPath, markdownPath, assist };
}

async function readExistingWorkspace(
  vaultRoot: string,
  project: string,
  target?: LiveAdapterTarget
): Promise<WorkspaceResult | undefined> {
  const fileName = target
    ? `live-adapter-operator-evidence-workspace-${target}.json`
    : "live-adapter-operator-evidence-workspace.json";
  const jsonPath = path.join(projectDir(vaultRoot, project), "control", fileName);
  try {
    const parsed = JSON.parse(await fs.readFile(jsonPath, "utf8")) as unknown;
    if (isWorkspace(parsed)) return { jsonPath, workspace: parsed };
    throw new Error(`Malformed workspace JSON or schema mismatch at ${jsonPath}. Refusing to regenerate over an existing workspace.`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function existingRefs(vaultRoot: string, project: string, refs: string[]): Promise<string[]> {
  const existing: string[] = [];
  for (const ref of refs) {
    const normalized = ref.split(path.sep).join("/");
    try {
      await fs.access(resolveVaultRef(vaultRoot, project, normalized));
      existing.push(normalized);
    } catch {
      // Missing support refs stay out of the assist packet; the cutover audit still owns blockers.
    }
  }
  return Array.from(new Set(existing));
}

function resolveVaultRef(vaultRoot: string, project: string, ref: string): string {
  const resolved = path.isAbsolute(ref)
    ? path.resolve(ref)
    : ref.startsWith("projects/")
      ? path.resolve(vaultRoot, ref)
      : path.resolve(projectDir(vaultRoot, project), ref);
  const relativeToVault = path.relative(path.resolve(vaultRoot), resolved);
  if (relativeToVault === "" || relativeToVault.startsWith("..") || path.isAbsolute(relativeToVault)) {
    throw new Error(`Ref must resolve inside the vault root: ${ref}`);
  }
  return resolved;
}

function nextSteps(target: WorkspaceTarget): string[] {
  if (target.status === "complete") return ["No assist action is needed unless the operator wants to refresh the evidence packet."];
  return [
    "Open read-only-assist.md and the listed support refs.",
    "Verify each relevant fact manually before copying it into operator-evidence.md.",
    "Fill the Operator and Review timestamp fields with real operator values.",
    "Run the check command, then import only when the check is complete."
  ];
}

function isWorkspace(value: unknown): value is LiveAdapterOperatorEvidenceWorkspace {
  return (
    Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    (value as LiveAdapterOperatorEvidenceWorkspace).schemaVersion === 1 &&
    typeof (value as LiveAdapterOperatorEvidenceWorkspace).project === "string" &&
    typeof (value as LiveAdapterOperatorEvidenceWorkspace).workplanRef === "string" &&
    typeof (value as LiveAdapterOperatorEvidenceWorkspace).queueRef === "string" &&
    Array.isArray((value as LiveAdapterOperatorEvidenceWorkspace).targets)
  );
}

function renderAssist(assist: LiveAdapterOperatorEvidenceAssist): string {
  return [
    "# Live Adapter Operator Evidence Assist",
    "",
    `Project: ${assist.project}`,
    `Target: ${assist.target ?? "all"}`,
    `Status: ${assist.status}`,
    `Generated: ${assist.generatedAt}`,
    `Mutation approved: ${assist.mutationApproved}`,
    `Approval granted: ${assist.approvalGranted}`,
    `Operator evidence record created: ${assist.operatorEvidenceRecordCreated}`,
    "",
    "## Rule",
    "",
    "This assist packet gathers read-only Ariadne support refs for operator review. It does not create operator evidence records, approve mutation, grant live-adapter authority, or make generated observations count as human review.",
    "",
    "## References",
    "",
    `- Workspace: ${assist.workspaceRef}`,
    `- Queue: ${assist.queueRef}`,
    `- Workplan: ${assist.workplanRef}`,
    "",
    "## Summary",
    "",
    `- Targets: ${assist.summary.targets}`,
    `- Assist files: ${assist.summary.assistFiles}`,
    `- Existing evidence refs: ${assist.summary.existingEvidenceRefs}`,
    `- Support file refs: ${assist.summary.supportFileRefs}`,
    `- Missing sections: ${assist.summary.missingSections}`,
    `- Cutover blockers: ${assist.summary.cutoverBlockers}`,
    `- GBrain queries: ${assist.summary.gbrainQueries}`,
    "",
    "## Targets",
    "",
    "| Target | Status | Assist file | Existing refs | Missing sections | Cutover blockers |",
    "| --- | --- | --- | ---: | ---: | ---: |",
    ...assist.targets.map(
      (target) =>
        `| ${cell(target.target)} | ${cell(target.status)} | ${cell(target.assistFileRef)} | ${target.existingEvidenceRefs.length} | ${target.missingSections.length} | ${target.cutoverBlockers.length} |`
    ),
    ""
  ].join("\n");
}

function renderTargetAssist(project: string, generatedAt: string, target: AssistTarget): string {
  return [
    `# Read-Only Operator Evidence Assist: ${target.target}`,
    "",
    `Project: ${project}`,
    `Generated: ${generatedAt}`,
    `Target: ${target.target}`,
    `Status: ${target.status}`,
    "Mutation approved: false",
    "Approval granted: false",
    "Operator evidence record created: false",
    "",
    "## Rule",
    "",
    "This file is generated from existing Ariadne artifacts. It is not operator evidence. A human operator must verify any fact before recording it in operator-evidence.md.",
    "",
    "## Workspace",
    "",
    `- Workspace dir: ${target.workspaceDirRef}`,
    `- Evidence file: ${target.evidenceFileRef}`,
    "",
    "## Commands",
    "",
    "```bash",
    target.checkCommand,
    target.importCommand,
    "```",
    "",
    "## Existing Ariadne Evidence Refs",
    "",
    ...list(target.existingEvidenceRefs),
    "",
    "## Support File Refs",
    "",
    ...list(target.supportFileRefs),
    "",
    "## Missing Sections",
    "",
    ...list(target.missingSections),
    "",
    "## Required Evidence",
    "",
    ...list(target.requiredEvidence),
    "",
    "## Cutover Blockers",
    "",
    ...list(target.cutoverBlockers),
    "",
    "## GBrain Advisory Queries",
    "",
    ...list(target.gbrainQueries),
    "",
    "## Next Steps",
    "",
    ...list(target.nextSteps),
    ""
  ].join("\n");
}

function list(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}

function cell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
