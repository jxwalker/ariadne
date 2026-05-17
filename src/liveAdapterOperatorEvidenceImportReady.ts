import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateLiveAdapterOperatorEvidenceAudit, recordLiveAdapterOperatorEvidence } from "./liveAdapterOperatorEvidence.js";
import { generateLiveAdapterOperatorEvidenceQueue } from "./liveAdapterOperatorEvidenceQueue.js";
import { projectDir, slugifyProject } from "./paths.js";
import type {
  LiveAdapterOperatorEvidenceCheck,
  LiveAdapterOperatorEvidenceImportReadyBatch,
  LiveAdapterOperatorEvidenceQueue
} from "./types.js";

type ImportTarget = LiveAdapterOperatorEvidenceImportReadyBatch["targets"][number];

export async function importReadyLiveAdapterOperatorEvidence(input: {
  project: string;
  vaultRoot: string;
  reviewedBy: string;
  notes?: string;
}): Promise<{ jsonPath: string; markdownPath: string; batch: LiveAdapterOperatorEvidenceImportReadyBatch }> {
  const project = slugifyProject(input.project);
  const queueResult = await generateLiveAdapterOperatorEvidenceQueue({ project, vaultRoot: input.vaultRoot });
  const queue = queueResult.queue;
  const targets: ImportTarget[] = [];

  for (const target of queue.targets) {
    if (target.status !== "ready_for_import") {
      targets.push({
        target: target.target,
        status: "skipped",
        reason: `Queue status is ${target.status}; only ready_for_import targets can be batch imported.`,
        latestCheckRef: target.latestCheckRef
      });
      continue;
    }
    if (!target.latestCheckRef) {
      targets.push({
        target: target.target,
        status: "failed",
        reason: "Queue target was ready_for_import but has no latest check ref."
      });
      continue;
    }

    try {
      const check = await readCheck(input.vaultRoot, project, target.latestCheckRef);
      if (check.status !== "complete") {
        targets.push({
          target: target.target,
          status: "skipped",
          reason: `Latest check status is ${check.status}; expected complete.`,
          latestCheckRef: target.latestCheckRef,
          sourceRef: check.sourceRef
        });
        continue;
      }
      const sourcePath = resolveVaultRef(input.vaultRoot, project, check.sourceRef);
      const record = await recordLiveAdapterOperatorEvidence({
        project,
        vaultRoot: input.vaultRoot,
        target: target.target,
        sourcePath,
        reviewedBy: input.reviewedBy,
        notes: input.notes
      });
      targets.push({
        target: target.target,
        status: "imported",
        reason: "Latest complete preflight check was imported as operator evidence.",
        latestCheckRef: target.latestCheckRef,
        sourceRef: check.sourceRef,
        recordRef: path.relative(input.vaultRoot, record.jsonPath),
        recordMarkdownRef: path.relative(input.vaultRoot, record.markdownPath)
      });
    } catch (error) {
      targets.push({
        target: target.target,
        status: "failed",
        reason: "Import failed.",
        latestCheckRef: target.latestCheckRef,
        errorDetail: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const audit = await generateLiveAdapterOperatorEvidenceAudit({ project, vaultRoot: input.vaultRoot });
  const refreshedQueue = await generateLiveAdapterOperatorEvidenceQueue({ project, vaultRoot: input.vaultRoot });
  const summary = {
    targets: queue.targets.length,
    readyForImport: queue.summary.readyForImport,
    imported: targets.filter((target) => target.status === "imported").length,
    skipped: targets.filter((target) => target.status === "skipped").length,
    failed: targets.filter((target) => target.status === "failed").length
  };
  const batch: LiveAdapterOperatorEvidenceImportReadyBatch = {
    schemaVersion: 1,
    project,
    importedAt: new Date().toISOString(),
    status: summary.failed > 0 ? "partial" : summary.imported > 0 ? "imported" : "nothing_ready",
    mutationApproved: false,
    approvalGranted: false,
    reviewedBy: input.reviewedBy,
    notes: input.notes,
    queueRef: path.relative(input.vaultRoot, queueResult.jsonPath),
    operatorEvidenceAuditRef: path.relative(input.vaultRoot, audit.jsonPath),
    refreshedQueueRef: path.relative(input.vaultRoot, refreshedQueue.jsonPath),
    summary,
    targets
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "live-adapter-operator-evidence-import-ready.json", batch);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control",
    "live-adapter-operator-evidence-import-ready.md",
    renderBatch(batch)
  );
  return { jsonPath, markdownPath, batch };
}

async function readCheck(vaultRoot: string, project: string, ref: string): Promise<LiveAdapterOperatorEvidenceCheck> {
  const parsed = JSON.parse(await fs.readFile(resolveVaultRef(vaultRoot, project, ref), "utf8")) as LiveAdapterOperatorEvidenceCheck;
  if (
    parsed.schemaVersion !== 1 ||
    parsed.status !== "complete" ||
    parsed.recorded !== false ||
    parsed.operatorEvidenceRecordCreated !== false ||
    parsed.mutationApproved !== false ||
    parsed.approvalGranted !== false
  ) {
    throw new Error(`Latest check is not a complete non-recorded preflight: ${ref}`);
  }
  return parsed;
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

function renderBatch(batch: LiveAdapterOperatorEvidenceImportReadyBatch): string {
  return [
    "# Live Adapter Operator Evidence Import Ready",
    "",
    `Project: ${batch.project}`,
    `Status: ${batch.status}`,
    `Imported: ${batch.importedAt}`,
    `Reviewed by: ${batch.reviewedBy}`,
    `Mutation approved: ${batch.mutationApproved}`,
    `Approval granted: ${batch.approvalGranted}`,
    `Notes: ${batch.notes ?? "none"}`,
    `Queue: ${batch.queueRef}`,
    `Operator evidence audit: ${batch.operatorEvidenceAuditRef}`,
    `Refreshed queue: ${batch.refreshedQueueRef}`,
    "",
    "## Rule",
    "",
    "This command imports only targets whose latest preflight check is complete. It does not approve mutation, grant live-adapter authority, or bypass cutover gates.",
    "",
    "## Summary",
    "",
    `- Targets: ${batch.summary.targets}`,
    `- Ready for import: ${batch.summary.readyForImport}`,
    `- Imported: ${batch.summary.imported}`,
    `- Skipped: ${batch.summary.skipped}`,
    `- Failed: ${batch.summary.failed}`,
    "",
    "## Targets",
    "",
    "| Target | Status | Reason | Latest check | Source | Record | Error |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...batch.targets.map(
      (target) =>
        `| ${cell(target.target)} | ${cell(target.status)} | ${cell(target.reason)} | ${cell(target.latestCheckRef ?? "none")} | ${cell(target.sourceRef ?? "none")} | ${cell(target.recordRef ?? "none")} | ${cell(target.errorDetail ?? "")} |`
    ),
    ""
  ].join("\n");
}

function cell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
