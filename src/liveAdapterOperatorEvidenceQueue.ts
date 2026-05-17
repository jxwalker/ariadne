import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateLiveAdapterOperatorEvidenceWorkplan } from "./liveAdapterOperatorEvidenceWorkplan.js";
import { isLiveAdapterTarget, LIVE_ADAPTER_TARGETS, type LiveAdapterTarget } from "./liveAdapterTargets.js";
import { projectDir, slugifyProject } from "./paths.js";
import type {
  LiveAdapterOperatorEvidenceAudit,
  LiveAdapterOperatorEvidenceCheck,
  LiveAdapterOperatorEvidenceQueue,
  LiveAdapterOperatorEvidenceWorkplan
} from "./types.js";

type QueueTarget = LiveAdapterOperatorEvidenceQueue["targets"][number];
type AuditTarget = LiveAdapterOperatorEvidenceAudit["targets"][number];
type WorkplanTarget = LiveAdapterOperatorEvidenceWorkplan["targets"][number];

export async function generateLiveAdapterOperatorEvidenceQueue(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; queue: LiveAdapterOperatorEvidenceQueue }> {
  const project = slugifyProject(input.project);
  const workplanResult = await generateLiveAdapterOperatorEvidenceWorkplan({ project, vaultRoot: input.vaultRoot });
  const workplan = workplanResult.workplan;
  const operatorEvidenceAudit = await readOperatorEvidenceAudit(input.vaultRoot, workplan.operatorEvidenceAuditRef);
  const checks = await readOperatorEvidenceChecks(input.vaultRoot, project);
  const latestChecks = latestChecksByTarget(checks);
  const auditByTarget = new Map(operatorEvidenceAudit.targets.map((target) => [target.target, target]));
  const targets = workplan.targets.map((target) =>
    queueTarget(
      project,
      target,
      mustGet(auditByTarget, target.target, "operator evidence audit target"),
      latestChecks.get(target.target)
    )
  );
  const summary = {
    targets: targets.length,
    completeTargets: targets.filter((target) => target.status === "complete").length,
    readyForImport: targets.filter((target) => target.status === "ready_for_import").length,
    needsEvidence: targets.filter((target) => target.status === "needs_evidence").length,
    needsRework: targets.filter((target) => target.status === "needs_rework").length,
    uncheckedTargets: targets.filter((target) => target.status === "unchecked").length,
    latestChecks: latestChecks.size
  };
  const queue: LiveAdapterOperatorEvidenceQueue = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status:
      summary.completeTargets === summary.targets
        ? "complete"
        : summary.readyForImport > 0
          ? "ready_for_import"
          : "evidence_required",
    mutationApproved: false,
    operatorEvidenceAuditRef: workplan.operatorEvidenceAuditRef,
    workplanRef: path.relative(input.vaultRoot, workplanResult.jsonPath),
    summary,
    targets
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "live-adapter-operator-evidence-queue.json", queue);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control",
    "live-adapter-operator-evidence-queue.md",
    renderQueue(queue)
  );
  return { jsonPath, markdownPath, queue };
}

async function readOperatorEvidenceAudit(vaultRoot: string, relativeRef: string): Promise<LiveAdapterOperatorEvidenceAudit> {
  return JSON.parse(await fs.readFile(path.join(vaultRoot, relativeRef), "utf8")) as LiveAdapterOperatorEvidenceAudit;
}

async function readOperatorEvidenceChecks(vaultRoot: string, project: string): Promise<LiveAdapterOperatorEvidenceCheck[]> {
  const dir = path.join(projectDir(vaultRoot, project), "control", "live-adapter-operator-evidence-checks");
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const checks: LiveAdapterOperatorEvidenceCheck[] = [];
  for (const name of names.filter((item) => item.endsWith(".json")).sort()) {
    try {
      const parsed = JSON.parse(await fs.readFile(path.join(dir, name), "utf8")) as unknown;
      if (isOperatorEvidenceCheck(parsed)) checks.push(parsed);
    } catch (error) {
      console.warn(`Skipping unreadable operator evidence check ${name}: ${(error as Error).message}`);
    }
  }
  return checks;
}

function latestChecksByTarget(checks: LiveAdapterOperatorEvidenceCheck[]): Map<LiveAdapterTarget, LiveAdapterOperatorEvidenceCheck> {
  const latest = new Map<LiveAdapterTarget, LiveAdapterOperatorEvidenceCheck>();
  for (const target of LIVE_ADAPTER_TARGETS) {
    const targetChecks = checks.filter((check) => check.target === target).sort((left, right) => left.checkedAt.localeCompare(right.checkedAt));
    const check = targetChecks.at(-1);
    if (check) latest.set(target, check);
  }
  return latest;
}

function queueTarget(
  project: string,
  workplanTarget: WorkplanTarget,
  auditTarget: AuditTarget,
  latestCheck: LiveAdapterOperatorEvidenceCheck | undefined
): QueueTarget {
  const status = queueStatus(auditTarget, latestCheck);
  return {
    target: workplanTarget.target,
    status,
    operatorEvidenceStatus: auditTarget.status,
    latestCheckId: latestCheck?.id,
    latestCheckRef: latestCheck
      ? `projects/${project}/control/live-adapter-operator-evidence-checks/${latestCheck.id}.json`
      : undefined,
    latestCheckStatus: latestCheck?.status,
    latestCheckMissingSections: latestCheck?.summary.missingSections,
    missingSections: latestCheck
      ? latestCheck.sections.filter((section) => section.status === "missing").map((section) => section.label)
      : auditTarget.missingSections,
    nextAction: nextAction(status),
    checkCommand: workplanTarget.checkCommand,
    importCommand: workplanTarget.importCommand,
    templateRef: workplanTarget.templateRef,
    evidenceRefs: Array.from(
      new Set([
        workplanTarget.templateRef,
        ...workplanTarget.evidenceRefs,
        ...(latestCheck ? [`projects/${project}/control/live-adapter-operator-evidence-checks/${latestCheck.id}.json`] : [])
      ])
    )
  };
}

function queueStatus(
  auditTarget: AuditTarget,
  latestCheck: LiveAdapterOperatorEvidenceCheck | undefined
): QueueTarget["status"] {
  if (auditTarget.status === "complete") return "complete";
  if (auditTarget.status === "incomplete") return "needs_rework";
  if (!latestCheck) return "unchecked";
  return latestCheck.status === "complete" ? "ready_for_import" : "needs_evidence";
}

function nextAction(status: QueueTarget["status"]): string {
  switch (status) {
    case "complete":
      return "No operator evidence action is needed for this target.";
    case "ready_for_import":
      return "Import the checked evidence file with the target import command, then rerun the operator-evidence audit.";
    case "needs_rework":
      return "Update the latest imported operator evidence record and rerun the check/import flow.";
    case "needs_evidence":
      return "Fill the missing sections in the operator evidence workspace file and rerun the preflight check.";
    case "unchecked":
      return "Run the preflight check command against the target workspace file before importing evidence.";
  }
}

function mustGet<K, V>(items: Map<K, V>, key: K, label: string): V {
  const item = items.get(key);
  if (!item) throw new Error(`Missing ${label} for ${String(key)}.`);
  return item;
}

function isOperatorEvidenceCheck(value: unknown): value is LiveAdapterOperatorEvidenceCheck {
  return (
    Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    (value as LiveAdapterOperatorEvidenceCheck).schemaVersion === 1 &&
    typeof (value as LiveAdapterOperatorEvidenceCheck).id === "string" &&
    (value as LiveAdapterOperatorEvidenceCheck).id.startsWith("operator-evidence-check-") &&
    typeof (value as LiveAdapterOperatorEvidenceCheck).checkedAt === "string" &&
    !Number.isNaN(Date.parse((value as LiveAdapterOperatorEvidenceCheck).checkedAt)) &&
    isLiveAdapterTarget((value as LiveAdapterOperatorEvidenceCheck).target) &&
    ((value as LiveAdapterOperatorEvidenceCheck).status === "complete" ||
      (value as LiveAdapterOperatorEvidenceCheck).status === "incomplete") &&
    isEvidenceCheckSummary((value as LiveAdapterOperatorEvidenceCheck).summary) &&
    Array.isArray((value as LiveAdapterOperatorEvidenceCheck).sections) &&
    (value as LiveAdapterOperatorEvidenceCheck).sections.every(isEvidenceCheckSection) &&
    (value as LiveAdapterOperatorEvidenceCheck).recorded === false &&
    (value as LiveAdapterOperatorEvidenceCheck).operatorEvidenceRecordCreated === false &&
    (value as LiveAdapterOperatorEvidenceCheck).mutationApproved === false &&
    (value as LiveAdapterOperatorEvidenceCheck).approvalGranted === false
  );
}

function isEvidenceCheckSummary(value: unknown): value is LiveAdapterOperatorEvidenceCheck["summary"] {
  return (
    Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    typeof (value as LiveAdapterOperatorEvidenceCheck["summary"]).requiredSections === "number" &&
    typeof (value as LiveAdapterOperatorEvidenceCheck["summary"]).completeSections === "number" &&
    typeof (value as LiveAdapterOperatorEvidenceCheck["summary"]).missingSections === "number" &&
    typeof (value as LiveAdapterOperatorEvidenceCheck["summary"]).advisoryWarnings === "number"
  );
}

function isEvidenceCheckSection(value: unknown): value is LiveAdapterOperatorEvidenceCheck["sections"][number] {
  return (
    Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    typeof (value as LiveAdapterOperatorEvidenceCheck["sections"][number]).id === "string" &&
    typeof (value as LiveAdapterOperatorEvidenceCheck["sections"][number]).label === "string" &&
    ((value as LiveAdapterOperatorEvidenceCheck["sections"][number]).status === "complete" ||
      (value as LiveAdapterOperatorEvidenceCheck["sections"][number]).status === "missing") &&
    typeof (value as LiveAdapterOperatorEvidenceCheck["sections"][number]).detail === "string"
  );
}

function renderQueue(queue: LiveAdapterOperatorEvidenceQueue): string {
  return [
    "# Live Adapter Operator Evidence Queue",
    "",
    `Project: ${queue.project}`,
    `Status: ${queue.status}`,
    `Generated: ${queue.generatedAt}`,
    `Mutation approved: ${queue.mutationApproved}`,
    `Operator evidence audit: ${queue.operatorEvidenceAuditRef}`,
    `Workplan: ${queue.workplanRef}`,
    "",
    "## Summary",
    "",
    `- Targets: ${queue.summary.targets}`,
    `- Complete targets: ${queue.summary.completeTargets}`,
    `- Ready for import: ${queue.summary.readyForImport}`,
    `- Needs evidence: ${queue.summary.needsEvidence}`,
    `- Needs rework: ${queue.summary.needsRework}`,
    `- Unchecked targets: ${queue.summary.uncheckedTargets}`,
    `- Latest checks: ${queue.summary.latestChecks}`,
    "",
    "## Rule",
    "",
    "This queue is an operator aid only. It does not record operator evidence, approve mutation, or grant live-adapter authority.",
    "",
    "## Targets",
    "",
    "| Target | Status | Latest check | Missing | Missing section labels | Next action |",
    "| --- | --- | --- | ---: | --- | --- |",
    ...queue.targets.map(renderQueueTargetRow),
    "",
    "## Commands",
    "",
    ...queue.targets.flatMap((target) => [
      `### ${target.target}`,
      "",
      `Status: ${target.status}`,
      `Template: ${target.templateRef}`,
      "",
      "#### Check",
      "",
      "```bash",
      target.checkCommand,
      "```",
      "",
      "#### Import",
      "",
      "```bash",
      target.importCommand,
      "```",
      ""
    ])
  ].join("\n");
}

function renderQueueTargetRow(target: QueueTarget): string {
  const cells = [
    tableCell(target.target),
    tableCell(target.status),
    tableCell(target.latestCheckId ?? "none"),
    tableCell(String(target.latestCheckMissingSections ?? target.missingSections.length)),
    tableCell(target.missingSections.join(", ") || "none"),
    tableCell(target.nextAction)
  ];
  return `| ${cells.join(" | ")} |`;
}

function tableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
