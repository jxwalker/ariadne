import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { checkLiveAdapterOperatorEvidence } from "./liveAdapterOperatorEvidence.js";
import { generateLiveAdapterOperatorEvidenceQueue } from "./liveAdapterOperatorEvidenceQueue.js";
import { LIVE_ADAPTER_TARGETS, type LiveAdapterTarget } from "./liveAdapterTargets.js";
import { projectDir, slugifyProject } from "./paths.js";
import type {
  LiveAdapterEvidenceTemplatePack,
  LiveAdapterOperatorEvidenceCheckBatch,
  LiveAdapterOperatorEvidenceWorkspace
} from "./types.js";

type BatchTarget = LiveAdapterOperatorEvidenceCheckBatch["targets"][number];
export type LiveAdapterOperatorEvidenceCheckAllSource = "auto" | "templates" | "workspace";
type EvidenceSourceSet = {
  source: "templates" | "workspace";
  sourcePackRef: string;
  templatePackRef?: string;
  workspaceRef?: string;
  refsByTarget: Map<LiveAdapterTarget, string>;
};

export async function checkAllLiveAdapterOperatorEvidence(input: {
  project: string;
  vaultRoot: string;
  notes?: string;
  source?: LiveAdapterOperatorEvidenceCheckAllSource;
}): Promise<{ jsonPath: string; markdownPath: string; batch: LiveAdapterOperatorEvidenceCheckBatch }> {
  const project = slugifyProject(input.project);
  const sourceSet = await resolveEvidenceSourceSet(input.vaultRoot, project, input.source ?? "auto");
  const targets: BatchTarget[] = [];

  for (const target of LIVE_ADAPTER_TARGETS) {
    const sourceFileRef = sourceSet.refsByTarget.get(target);
    if (!sourceFileRef) {
      targets.push({
        target,
        status: sourceSet.source === "templates" ? "missing_template" : "missing_source",
        missingSections: 0,
        missingSectionLabels: []
      });
      continue;
    }
    try {
      const result = await checkLiveAdapterOperatorEvidence({
        project,
        vaultRoot: input.vaultRoot,
        target,
        sourcePath: resolveVaultRef(input.vaultRoot, project, sourceFileRef),
        notes: input.notes
      });
      targets.push({
        target,
        status: result.check.status,
        sourceFileRef,
        templateRef: sourceSet.source === "templates" ? sourceFileRef : undefined,
        evidenceFileRef: sourceSet.source === "workspace" ? sourceFileRef : undefined,
        checkRef: path.relative(input.vaultRoot, result.jsonPath),
        checkMarkdownRef: path.relative(input.vaultRoot, result.markdownPath),
        missingSections: result.check.summary.missingSections,
        missingSectionLabels: result.check.sections.filter((section) => section.status === "missing").map((section) => section.label),
        sourceRef: result.check.sourceRef
      });
    } catch (error) {
      targets.push({
        target,
        status: "error",
        sourceFileRef,
        templateRef: sourceSet.source === "templates" ? sourceFileRef : undefined,
        evidenceFileRef: sourceSet.source === "workspace" ? sourceFileRef : undefined,
        missingSections: 0,
        missingSectionLabels: [],
        errorDetail: (error as Error).message
      });
    }
  }

  const queueResult = await generateLiveAdapterOperatorEvidenceQueue({ project, vaultRoot: input.vaultRoot });
  const summary = {
    targets: targets.length,
    checks: targets.filter((target) => target.status !== "missing_template" && target.status !== "missing_source").length,
    completeChecks: targets.filter((target) => target.status === "complete").length,
    incompleteChecks: targets.filter((target) => target.status === "incomplete").length,
    failedChecks: targets.filter((target) => target.status === "error").length,
    missingSources: targets.filter((target) => target.status === "missing_template" || target.status === "missing_source").length,
    missingTemplates: targets.filter((target) => target.status === "missing_template").length,
    missingSections: targets.reduce((count, target) => count + target.missingSections, 0)
  };
  const batch: LiveAdapterOperatorEvidenceCheckBatch = {
    schemaVersion: 1,
    project,
    checkedAt: new Date().toISOString(),
    status: summary.completeChecks === summary.targets ? "complete" : "incomplete",
    mutationApproved: false,
    approvalGranted: false,
    source: sourceSet.source,
    sourcePackRef: sourceSet.sourcePackRef,
    templatePackRef: sourceSet.templatePackRef,
    workspaceRef: sourceSet.workspaceRef,
    queueRef: path.relative(input.vaultRoot, queueResult.jsonPath),
    summary,
    targets
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "live-adapter-operator-evidence-check-all.json", batch);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control",
    "live-adapter-operator-evidence-check-all.md",
    renderBatch(batch)
  );
  return { jsonPath, markdownPath, batch };
}

export function liveAdapterOperatorEvidenceCheckAllSourceOption(value: string): LiveAdapterOperatorEvidenceCheckAllSource {
  if (value === "auto" || value === "templates" || value === "workspace") return value;
  throw new Error("--source must be auto, workspace, or templates.");
}

async function resolveEvidenceSourceSet(
  vaultRoot: string,
  project: string,
  source: LiveAdapterOperatorEvidenceCheckAllSource
): Promise<EvidenceSourceSet> {
  const templatePackRef = `projects/${project}/control/live-adapter-evidence-templates.json`;
  const workspaceRef = `projects/${project}/control/live-adapter-operator-evidence-workspace.json`;

  if (source !== "templates") {
    const workspace = await readOptionalWorkspace(vaultRoot, workspaceRef);
    if (workspace) {
      return {
        source: "workspace",
        sourcePackRef: workspaceRef,
        workspaceRef,
        refsByTarget: new Map(workspace.targets.map((target) => [target.target, target.evidenceFileRef]))
      };
    }
    if (source === "workspace") throw new Error(`Missing live adapter operator evidence workspace: ${workspaceRef}`);
  }

  const templatePack = await readTemplatePack(vaultRoot, templatePackRef);
  return {
    source: "templates",
    sourcePackRef: templatePackRef,
    templatePackRef,
    refsByTarget: new Map(templatePack.templates.map((template) => [template.target, template.templateRef]))
  };
}

async function readTemplatePack(vaultRoot: string, relativeRef: string): Promise<LiveAdapterEvidenceTemplatePack> {
  const parsed = JSON.parse(await fs.readFile(path.join(vaultRoot, relativeRef), "utf8")) as unknown;
  if (isTemplatePack(parsed)) return parsed;
  throw new Error(`Invalid live adapter evidence template pack: ${relativeRef}`);
}

async function readOptionalWorkspace(
  vaultRoot: string,
  relativeRef: string
): Promise<LiveAdapterOperatorEvidenceWorkspace | undefined> {
  try {
    const parsed = JSON.parse(await fs.readFile(path.join(vaultRoot, relativeRef), "utf8")) as unknown;
    if (isWorkspace(parsed)) return parsed;
    throw new Error(`Invalid live adapter operator evidence workspace: ${relativeRef}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

function isTemplatePack(value: unknown): value is LiveAdapterEvidenceTemplatePack {
  return (
    Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    (value as LiveAdapterEvidenceTemplatePack).schemaVersion === 1 &&
    Array.isArray((value as LiveAdapterEvidenceTemplatePack).templates) &&
    (value as LiveAdapterEvidenceTemplatePack).templates.every(
      (template) =>
        Boolean(template && typeof template === "object" && !Array.isArray(template)) &&
        isLiveAdapterTargetValue((template as LiveAdapterEvidenceTemplatePack["templates"][number]).target) &&
        typeof (template as LiveAdapterEvidenceTemplatePack["templates"][number]).templateRef === "string"
    )
  );
}

function isWorkspace(value: unknown): value is LiveAdapterOperatorEvidenceWorkspace {
  return (
    Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    (value as LiveAdapterOperatorEvidenceWorkspace).schemaVersion === 1 &&
    Array.isArray((value as LiveAdapterOperatorEvidenceWorkspace).targets) &&
    (value as LiveAdapterOperatorEvidenceWorkspace).targets.every(
      (target) =>
        Boolean(target && typeof target === "object" && !Array.isArray(target)) &&
        isLiveAdapterTargetValue((target as LiveAdapterOperatorEvidenceWorkspace["targets"][number]).target) &&
        typeof (target as LiveAdapterOperatorEvidenceWorkspace["targets"][number]).evidenceFileRef === "string"
    )
  );
}

function isLiveAdapterTargetValue(value: unknown): value is LiveAdapterTarget {
  return typeof value === "string" && (LIVE_ADAPTER_TARGETS as readonly string[]).includes(value);
}

function resolveVaultRef(vaultRoot: string, project: string, ref: string): string {
  const resolved = path.isAbsolute(ref)
    ? path.resolve(ref)
    : ref.startsWith("projects/")
      ? path.resolve(vaultRoot, ref)
      : path.resolve(projectDir(vaultRoot, project), ref);
  const relativeToVault = path.relative(path.resolve(vaultRoot), resolved);
  if (relativeToVault === "" || relativeToVault.startsWith("..") || path.isAbsolute(relativeToVault)) {
    throw new Error(`Source ref must resolve inside the vault root: ${ref}`);
  }
  return resolved;
}

function renderBatch(batch: LiveAdapterOperatorEvidenceCheckBatch): string {
  return [
    "# Live Adapter Operator Evidence Check All",
    "",
    `Project: ${batch.project}`,
    `Status: ${batch.status}`,
    `Checked: ${batch.checkedAt}`,
    `Mutation approved: ${batch.mutationApproved}`,
    `Approval granted: ${batch.approvalGranted}`,
    `Source: ${batch.source}`,
    `Source pack: ${batch.sourcePackRef}`,
    `Queue: ${batch.queueRef}`,
    "",
    "## Rule",
    "",
    "This batch is a preflight aid only. It does not create operator evidence records, approve mutation, or grant live-adapter authority.",
    "",
    "## Summary",
    "",
    `- Targets: ${batch.summary.targets}`,
    `- Checks: ${batch.summary.checks}`,
    `- Complete checks: ${batch.summary.completeChecks}`,
    `- Incomplete checks: ${batch.summary.incompleteChecks}`,
    `- Failed checks: ${batch.summary.failedChecks}`,
    `- Missing sources: ${batch.summary.missingSources}`,
    `- Missing templates: ${batch.summary.missingTemplates}`,
    `- Missing sections: ${batch.summary.missingSections}`,
    "",
    "## Targets",
    "",
    "| Target | Status | Missing sections | Missing section labels | Source file | Check | Detail |",
    "| --- | --- | ---: | --- | --- | --- | --- |",
    ...batch.targets.map(
      (target) =>
        `| ${tableCell(target.target)} | ${tableCell(target.status)} | ${tableCell(String(target.missingSections))} | ${tableCell(target.missingSectionLabels.join(", ") || "none")} | ${tableCell(target.sourceFileRef ?? "missing")} | ${tableCell(target.checkRef ?? "not run")} | ${tableCell(target.errorDetail ?? "")} |`
    ),
    ""
  ].join("\n");
}

function tableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
