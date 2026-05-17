import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { checkLiveAdapterOperatorEvidence } from "./liveAdapterOperatorEvidence.js";
import { generateLiveAdapterOperatorEvidenceQueue } from "./liveAdapterOperatorEvidenceQueue.js";
import { LIVE_ADAPTER_TARGETS, type LiveAdapterTarget } from "./liveAdapterTargets.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { LiveAdapterEvidenceTemplatePack, LiveAdapterOperatorEvidenceCheckBatch } from "./types.js";

type BatchTarget = LiveAdapterOperatorEvidenceCheckBatch["targets"][number];

export async function checkAllLiveAdapterOperatorEvidence(input: {
  project: string;
  vaultRoot: string;
  notes?: string;
}): Promise<{ jsonPath: string; markdownPath: string; batch: LiveAdapterOperatorEvidenceCheckBatch }> {
  const project = slugifyProject(input.project);
  const templatePackRef = `projects/${project}/control/live-adapter-evidence-templates.json`;
  const templatePack = await readTemplatePack(input.vaultRoot, templatePackRef);
  const templatesByTarget = new Map(templatePack.templates.map((template) => [template.target, template]));
  const targets: BatchTarget[] = [];

  for (const target of LIVE_ADAPTER_TARGETS) {
    const template = templatesByTarget.get(target);
    if (!template) {
      targets.push({
        target,
        status: "missing_template",
        missingSections: 0
      });
      continue;
    }
    try {
      const result = await checkLiveAdapterOperatorEvidence({
        project,
        vaultRoot: input.vaultRoot,
        target,
        sourcePath: resolveVaultRef(input.vaultRoot, project, template.templateRef),
        notes: input.notes
      });
      targets.push({
        target,
        status: result.check.status,
        templateRef: template.templateRef,
        checkRef: path.relative(input.vaultRoot, result.jsonPath),
        checkMarkdownRef: path.relative(input.vaultRoot, result.markdownPath),
        missingSections: result.check.summary.missingSections,
        sourceRef: result.check.sourceRef
      });
    } catch (error) {
      targets.push({
        target,
        status: "error",
        templateRef: template.templateRef,
        missingSections: 0,
        errorDetail: (error as Error).message
      });
    }
  }

  const queueResult = await generateLiveAdapterOperatorEvidenceQueue({ project, vaultRoot: input.vaultRoot });
  const summary = {
    targets: targets.length,
    checks: targets.filter((target) => target.status !== "missing_template").length,
    completeChecks: targets.filter((target) => target.status === "complete").length,
    incompleteChecks: targets.filter((target) => target.status === "incomplete").length,
    failedChecks: targets.filter((target) => target.status === "error").length,
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
    templatePackRef,
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

async function readTemplatePack(vaultRoot: string, relativeRef: string): Promise<LiveAdapterEvidenceTemplatePack> {
  const parsed = JSON.parse(await fs.readFile(path.join(vaultRoot, relativeRef), "utf8")) as unknown;
  if (isTemplatePack(parsed)) return parsed;
  throw new Error(`Invalid live adapter evidence template pack: ${relativeRef}`);
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
    throw new Error(`Template ref must resolve inside the vault root: ${ref}`);
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
    `Template pack: ${batch.templatePackRef}`,
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
    `- Missing templates: ${batch.summary.missingTemplates}`,
    `- Missing sections: ${batch.summary.missingSections}`,
    "",
    "## Targets",
    "",
    "| Target | Status | Missing sections | Template | Check | Detail |",
    "| --- | --- | ---: | --- | --- | --- |",
    ...batch.targets.map(
      (target) =>
        `| ${target.target} | ${target.status} | ${target.missingSections} | ${target.templateRef ?? "missing"} | ${target.checkRef ?? "not run"} | ${target.errorDetail ?? ""} |`
    ),
    ""
  ].join("\n");
}
