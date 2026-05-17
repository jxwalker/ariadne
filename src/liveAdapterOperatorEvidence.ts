import fs from "node:fs/promises";
import path from "node:path";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { sha256File } from "./hash.js";
import { isLiveAdapterTarget, LIVE_ADAPTER_TARGETS, type LiveAdapterTarget } from "./liveAdapterTargets.js";
import { projectDir, slugifyProject } from "./paths.js";
import type {
  LiveAdapterOperatorEvidenceAudit,
  LiveAdapterOperatorEvidenceCheck,
  LiveAdapterOperatorEvidenceRecord
} from "./types.js";

type EvidenceSection = LiveAdapterOperatorEvidenceRecord["sections"][number];
type EvidenceSummary = LiveAdapterOperatorEvidenceRecord["summary"];
type GbrainEvaluation = LiveAdapterOperatorEvidenceRecord["gbrain"];

const REQUIRED_SECTIONS: Array<{
  id: string;
  label: string;
  detector: (text: string, checkboxes: Checkbox[]) => boolean;
  missingDetail: string;
}> = [
  {
    id: "operator-identity",
    label: "Operator identity and timestamp",
    detector: (text) => hasNonEmptyField(text, "Operator") && hasNonEmptyField(text, "Review timestamp"),
    missingDetail: "Fill the Operator and Review timestamp fields with real values."
  },
  {
    id: "packet-review",
    label: "Approval packet review",
    detector: (text) => hasNonEmptyField(text, "Packet reviewed") && hasNonEmptyField(text, "Decision for packet completeness"),
    missingDetail: "Record the reviewed approval packet and the operator decision for packet completeness."
  },
  {
    id: "auth-boundary",
    label: "Authentication or authorization boundary",
    detector: (_text, checkboxes) => hasCheckedItem(checkboxes, ["authentication", "authorization", "boundary"]),
    missingDetail: "Check the authentication or authorization boundary evidence item after observing it."
  },
  {
    id: "bounded-action",
    label: "Bounded action statement",
    detector: (_text, checkboxes) => hasCheckedItem(checkboxes, ["bounded action", "non-goals"]),
    missingDetail: "Check the bounded action and explicit non-goals evidence item."
  },
  {
    id: "rollback",
    label: "Rollback or disable path",
    detector: (_text, checkboxes) => hasCheckedItem(checkboxes, ["rollback", "disable path"]),
    missingDetail: "Check the rollback or disable path evidence item."
  },
  {
    id: "post-verification",
    label: "Post-action verification command",
    detector: (_text, checkboxes) => hasCheckedItem(checkboxes, ["post-action verification", "post-verification"]),
    missingDetail: "Check the post-action verification command evidence item."
  },
  {
    id: "dry-run",
    label: "Dry-run command and safe output",
    detector: (_text, checkboxes) => hasCheckedItem(checkboxes, ["dry-run", "safe output"]),
    missingDetail: "Check the dry-run command and expected safe output evidence item."
  },
  {
    id: "target-wrapper",
    label: "Target-guarded execution wrapper",
    detector: (_text, checkboxes) => hasCheckedItem(checkboxes, ["target-guarded", "execution command"]),
    missingDetail: "Check the target-guarded execution command evidence item."
  },
  {
    id: "confirm-plan",
    label: "Exact confirm-plan proof",
    detector: (_text, checkboxes) => hasCheckedItem(checkboxes, ["--confirm-plan", "exact"]),
    missingDetail: "Check the proof that execution uses mutation-execute or a target wrapper with an exact --confirm-plan match."
  }
];

export const REQUIRED_OPERATOR_EVIDENCE_SECTION_LABELS = REQUIRED_SECTIONS.map((section) => section.label);

export function operatorEvidenceTargetMissingSections(target: LiveAdapterOperatorEvidenceAudit["targets"][number]): string[] {
  const missingSections = target.missingSections ?? [];
  if (missingSections.length > 0) return missingSections;
  return target.status === "missing_evidence" ? [...REQUIRED_OPERATOR_EVIDENCE_SECTION_LABELS] : missingSections;
}

export function operatorEvidenceCheckMissingSections(check: LiveAdapterOperatorEvidenceCheck): string[] {
  return check.sections.filter((section) => section.status === "missing").map((section) => section.label);
}

export function operatorEvidenceAuditMissingSections(audit: LiveAdapterOperatorEvidenceAudit | undefined): number | undefined {
  if (!audit) return undefined;
  const summaryMissingSections = audit.summary?.missingSections ?? 0;
  if (summaryMissingSections > 0) return summaryMissingSections;

  const targetSections = (audit.targets ?? []).reduce(
    (count, target) => count + operatorEvidenceTargetMissingSections(target).length,
    0
  );
  if (targetSections > 0) return targetSections;

  const missingTargets = audit.summary?.missingTargets ?? 0;
  if (missingTargets > 0) return missingTargets * REQUIRED_OPERATOR_EVIDENCE_SECTION_LABELS.length;

  return summaryMissingSections;
}

export async function recordLiveAdapterOperatorEvidence(input: {
  project: string;
  vaultRoot: string;
  target: LiveAdapterTarget;
  sourcePath: string;
  reviewedBy: string;
  notes?: string;
}): Promise<{ jsonPath: string; markdownPath: string; record: LiveAdapterOperatorEvidenceRecord }> {
  const project = slugifyProject(input.project);
  const evaluation = await evaluateOperatorEvidenceSource({
    vaultRoot: input.vaultRoot,
    sourcePath: input.sourcePath
  });
  const recordedAt = new Date();
  const record: LiveAdapterOperatorEvidenceRecord = {
    schemaVersion: 1,
    id: `operator-evidence-${input.target}-${timestampFile(recordedAt)}`,
    project,
    recordedAt: recordedAt.toISOString(),
    target: input.target,
    reviewedBy: input.reviewedBy,
    sourceRef: evaluation.sourceRef,
    sourceSha256: evaluation.sourceSha256,
    sourceBytes: evaluation.sourceBytes,
    status: evaluation.status,
    mutationApproved: false,
    approvalGranted: false,
    summary: evaluation.summary,
    sections: evaluation.sections,
    gbrain: evaluation.gbrain,
    notes: input.notes
  };

  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control/live-adapter-operator-evidence", `${record.id}.json`, record);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control/live-adapter-operator-evidence",
    `${record.id}.md`,
    renderRecord(record)
  );
  return { jsonPath, markdownPath, record };
}

export async function checkLiveAdapterOperatorEvidence(input: {
  project: string;
  vaultRoot: string;
  target: LiveAdapterTarget;
  sourcePath: string;
  notes?: string;
}): Promise<{ jsonPath: string; markdownPath: string; check: LiveAdapterOperatorEvidenceCheck }> {
  const project = slugifyProject(input.project);
  const evaluation = await evaluateOperatorEvidenceSource({
    vaultRoot: input.vaultRoot,
    sourcePath: input.sourcePath
  });
  const checkedAt = new Date();
  const check: LiveAdapterOperatorEvidenceCheck = {
    schemaVersion: 1,
    id: `operator-evidence-check-${input.target}-${timestampFile(checkedAt)}`,
    project,
    checkedAt: checkedAt.toISOString(),
    target: input.target,
    sourceRef: evaluation.sourceRef,
    sourceSha256: evaluation.sourceSha256,
    sourceBytes: evaluation.sourceBytes,
    status: evaluation.status,
    recorded: false,
    operatorEvidenceRecordCreated: false,
    mutationApproved: false,
    approvalGranted: false,
    summary: evaluation.summary,
    sections: evaluation.sections,
    gbrain: evaluation.gbrain,
    notes: input.notes
  };

  const jsonPath = await writeJsonArtifact(
    input.vaultRoot,
    project,
    "control/live-adapter-operator-evidence-checks",
    `${check.id}.json`,
    check
  );
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control/live-adapter-operator-evidence-checks",
    `${check.id}.md`,
    renderCheck(check)
  );
  return { jsonPath, markdownPath, check };
}

export async function generateLiveAdapterOperatorEvidenceAudit(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; audit: LiveAdapterOperatorEvidenceAudit }> {
  const project = slugifyProject(input.project);
  const records = await readEvidenceRecords(input.vaultRoot, project);
  const recordsByTarget = new Map<LiveAdapterTarget, LiveAdapterOperatorEvidenceRecord[]>();
  for (const target of LIVE_ADAPTER_TARGETS) {
    recordsByTarget.set(target, records.filter((record) => record.target === target).sort((left, right) => left.recordedAt.localeCompare(right.recordedAt)));
  }

  const targets = LIVE_ADAPTER_TARGETS.map((target) => {
    const targetRecords = recordsByTarget.get(target) ?? [];
    const latest = targetRecords.at(-1);
    const missingSections = latest
      ? latest.sections.filter((section) => section.status === "missing").map((section) => section.label)
      : [...REQUIRED_OPERATOR_EVIDENCE_SECTION_LABELS];
    const advisoryWarnings = latest?.gbrain.status === "missing" ? [latest.gbrain.detail] : [];
    const status: LiveAdapterOperatorEvidenceAudit["targets"][number]["status"] = latest
      ? latest.status === "complete"
        ? "complete"
        : "incomplete"
      : "missing_evidence";
    const blockers =
      status === "missing_evidence"
        ? [
            `No operator evidence record exists for ${target}.`,
            ...missingSections.map((section) => `Missing operator evidence section: ${section}`)
          ]
        : missingSections.map((section) => `Missing operator evidence section: ${section}`);
    return {
      target,
      status,
      recordCount: targetRecords.length,
      latestRecordId: latest?.id,
      latestRecordRef: latest ? `projects/${project}/control/live-adapter-operator-evidence/${latest.id}.json` : undefined,
      missingSections,
      advisoryWarnings,
      blockers,
      evidenceRefs: latest ? [`projects/${project}/control/live-adapter-operator-evidence/${latest.id}.json`] : []
    };
  });

  const summary = {
    targets: targets.length,
    records: records.length,
    completeTargets: targets.filter((target) => target.status === "complete").length,
    incompleteTargets: targets.filter((target) => target.status === "incomplete").length,
    missingTargets: targets.filter((target) => target.status === "missing_evidence").length,
    missingSections: targets.reduce((count, target) => count + target.missingSections.length, 0),
    advisoryWarnings: targets.reduce((count, target) => count + target.advisoryWarnings.length, 0)
  };
  const audit: LiveAdapterOperatorEvidenceAudit = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status: summary.completeTargets === summary.targets ? "complete" : "blocked",
    mutationApproved: false,
    summary,
    targets
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "live-adapter-operator-evidence-audit.json", audit);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control",
    "live-adapter-operator-evidence-audit.md",
    renderAudit(audit)
  );
  return { jsonPath, markdownPath, audit };
}

export function liveAdapterOperatorEvidenceTargetOption(value: string): LiveAdapterTarget {
  if (isLiveAdapterTarget(value)) return value;
  throw new Error(`--target must be ${LIVE_ADAPTER_TARGETS.join(", ")}.`);
}

async function evaluateOperatorEvidenceSource(input: {
  vaultRoot: string;
  sourcePath: string;
}): Promise<{
  sourceRef: string;
  sourceSha256: string;
  sourceBytes: number;
  status: LiveAdapterOperatorEvidenceRecord["status"];
  summary: EvidenceSummary;
  sections: EvidenceSection[];
  gbrain: GbrainEvaluation;
}> {
  const sourcePath = path.resolve(input.sourcePath);
  const text = await fs.readFile(sourcePath, "utf8");
  const sourceStats = await fs.stat(sourcePath);
  const checkboxes = parseCheckboxes(text);
  const sections = evaluateSections(text, checkboxes);
  const missingSections = sections.filter((section) => section.status === "missing");
  const gbrain = evaluateGbrain(text, checkboxes);
  return {
    sourceRef: portableSourceRef(input.vaultRoot, sourcePath),
    sourceSha256: await sha256File(sourcePath),
    sourceBytes: sourceStats.size,
    status: missingSections.length === 0 ? "complete" : "incomplete",
    summary: {
      requiredSections: sections.length,
      completeSections: sections.length - missingSections.length,
      missingSections: missingSections.length,
      advisoryWarnings: gbrain.status === "missing" ? 1 : 0
    },
    sections,
    gbrain
  };
}

function evaluateSections(text: string, checkboxes: Checkbox[]): EvidenceSection[] {
  return REQUIRED_SECTIONS.map((section) => {
    const complete = section.detector(text, checkboxes);
    return {
      id: section.id,
      label: section.label,
      status: complete ? "complete" : "missing",
      detail: complete ? "Evidence field or checked checklist item is present." : section.missingDetail
    };
  });
}

interface Checkbox {
  checked: boolean;
  text: string;
}

function parseCheckboxes(text: string): Checkbox[] {
  return text
    .split("\n")
    .map((line) => line.match(/^\s*-\s*\[([ xX])\]\s*(.+?)\s*$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({ checked: match[1]?.toLowerCase() === "x", text: match[2] ?? "" }));
}

function hasCheckedItem(checkboxes: Checkbox[], needles: string[]): boolean {
  return checkboxes.some((item) => item.checked && needles.some((needle) => item.text.toLowerCase().includes(needle)));
}

function hasNonEmptyField(text: string, label: string): boolean {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^[ \\t]*-?[ \\t]*${escaped}:[ \\t]*(.*?)[ \\t]*$`, "im");
  const match = text.match(pattern);
  if (!match?.[1]) return false;
  const value = match[1].trim();
  return Boolean(value && !/^<.*>$/.test(value) && !/^n\/a$/i.test(value) && !/^missing$/i.test(value));
}

function evaluateGbrain(text: string, checkboxes: Checkbox[]): LiveAdapterOperatorEvidenceRecord["gbrain"] {
  const hasCheckedQuery = checkboxes.some((item) => item.checked && item.text.toLowerCase().includes("gbrain"));
  const hasNotes =
    hasNonEmptyField(text, "Query result refs") ||
    hasNonEmptyField(text, "Stale assumptions found") ||
    hasNonEmptyField(text, "Related Ariadne evidence refs");
  if (hasCheckedQuery || hasNotes) {
    return {
      status: "present",
      detail: "GBrain advisory notes or checked queries are present. This remains advisory only."
    };
  }
  return {
    status: "missing",
    detail: "No GBrain advisory notes were recorded. This is advisory context only, not an approval gate."
  };
}

async function readEvidenceRecords(vaultRoot: string, project: string): Promise<LiveAdapterOperatorEvidenceRecord[]> {
  const dir = path.join(projectDir(vaultRoot, project), "control", "live-adapter-operator-evidence");
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const records: LiveAdapterOperatorEvidenceRecord[] = [];
  for (const name of names.filter((item) => item.endsWith(".json")).sort()) {
    try {
      const parsed = JSON.parse(await fs.readFile(path.join(dir, name), "utf8")) as unknown;
      if (isOperatorEvidenceRecord(parsed)) records.push(parsed);
    } catch (error) {
      console.warn(`Skipping unreadable operator evidence record ${name}: ${(error as Error).message}`);
    }
  }
  return records;
}

function isOperatorEvidenceRecord(value: unknown): value is LiveAdapterOperatorEvidenceRecord {
  return (
    Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    (value as LiveAdapterOperatorEvidenceRecord).schemaVersion === 1 &&
    typeof (value as LiveAdapterOperatorEvidenceRecord).id === "string" &&
    (value as LiveAdapterOperatorEvidenceRecord).id.startsWith("operator-evidence-") &&
    isLiveAdapterTarget((value as LiveAdapterOperatorEvidenceRecord).target) &&
    ((value as LiveAdapterOperatorEvidenceRecord).status === "complete" ||
      (value as LiveAdapterOperatorEvidenceRecord).status === "incomplete") &&
    (value as LiveAdapterOperatorEvidenceRecord).mutationApproved === false &&
    (value as LiveAdapterOperatorEvidenceRecord).approvalGranted === false
  );
}

function portableSourceRef(vaultRoot: string, absolutePath: string): string {
  const relativeToVault = path.relative(vaultRoot, absolutePath);
  if (!relativeToVault.startsWith("..") && !path.isAbsolute(relativeToVault)) {
    return relativeToVault.split(path.sep).join("/");
  }
  return `external/${path.basename(absolutePath)}`;
}

function renderRecord(record: LiveAdapterOperatorEvidenceRecord): string {
  return [
    `# Live Adapter Operator Evidence: ${targetLabel(record.target)}`,
    "",
    `Id: ${record.id}`,
    `Status: ${record.status}`,
    `Recorded: ${record.recordedAt}`,
    `Reviewed by: ${record.reviewedBy}`,
    `Source: ${record.sourceRef}`,
    `Mutation approved: ${record.mutationApproved}`,
    `Approval granted: ${record.approvalGranted}`,
    "",
    "## Summary",
    "",
    `- Required sections: ${record.summary.requiredSections}`,
    `- Complete sections: ${record.summary.completeSections}`,
    `- Missing sections: ${record.summary.missingSections}`,
    `- Advisory warnings: ${record.summary.advisoryWarnings}`,
    "",
    "## Sections",
    "",
    "| Section | Status | Detail |",
    "| --- | --- | --- |",
    ...record.sections.map((section) => `| ${section.label} | ${section.status} | ${section.detail} |`),
    "",
    "## GBrain",
    "",
    `${record.gbrain.status}: ${record.gbrain.detail}`,
    ...(record.notes ? ["", "## Notes", "", record.notes] : []),
    "",
    "This record captures operator evidence only. It does not approve mutation and does not grant live-adapter authority.",
    ""
  ].join("\n");
}

function renderCheck(check: LiveAdapterOperatorEvidenceCheck): string {
  return [
    `# Live Adapter Operator Evidence Check: ${targetLabel(check.target)}`,
    "",
    `Id: ${check.id}`,
    `Status: ${check.status}`,
    `Checked: ${check.checkedAt}`,
    `Source: ${check.sourceRef}`,
    `Recorded: ${check.recorded}`,
    `Operator evidence record created: ${check.operatorEvidenceRecordCreated}`,
    `Mutation approved: ${check.mutationApproved}`,
    `Approval granted: ${check.approvalGranted}`,
    "",
    "## Summary",
    "",
    `- Required sections: ${check.summary.requiredSections}`,
    `- Complete sections: ${check.summary.completeSections}`,
    `- Missing sections: ${check.summary.missingSections}`,
    `- Advisory warnings: ${check.summary.advisoryWarnings}`,
    "",
    "## Sections",
    "",
    "| Section | Status | Detail |",
    "| --- | --- | --- |",
    ...check.sections.map((section) => `| ${section.label} | ${section.status} | ${section.detail} |`),
    "",
    "## GBrain",
    "",
    `${check.gbrain.status}: ${check.gbrain.detail}`,
    ...(check.notes ? ["", "## Notes", "", check.notes] : []),
    "",
    "This is a preflight check only. It does not create an operator evidence record, approve mutation, or grant live-adapter authority.",
    ""
  ].join("\n");
}

function targetLabel(target: LiveAdapterTarget): string {
  const labels: Record<LiveAdapterTarget, string> = {
    github: "GitHub",
    deployment: "Deployment",
    "hermes-cron": "Hermes Cron",
    openscorpion: "OpenScorpion",
    gsd2: "GSD2",
    notebooklm: "NotebookLM"
  };
  return labels[target];
}

function renderAudit(audit: LiveAdapterOperatorEvidenceAudit): string {
  return [
    "# Live Adapter Operator Evidence Audit",
    "",
    `Project: ${audit.project}`,
    `Status: ${audit.status}`,
    `Generated: ${audit.generatedAt}`,
    `Mutation approved: ${audit.mutationApproved}`,
    "",
    "## Summary",
    "",
    `- Targets: ${audit.summary.targets}`,
    `- Records: ${audit.summary.records}`,
    `- Complete targets: ${audit.summary.completeTargets}`,
    `- Incomplete targets: ${audit.summary.incompleteTargets}`,
    `- Missing targets: ${audit.summary.missingTargets}`,
    `- Missing sections: ${audit.summary.missingSections}`,
    `- Advisory warnings: ${audit.summary.advisoryWarnings}`,
    "",
    "## Targets",
    "",
    "| Target | Status | Records | Latest | Missing sections | Advisory warnings |",
    "| --- | --- | --- | --- | --- | --- |",
    ...audit.targets.map(
      (target) =>
        `| ${target.target} | ${target.status} | ${target.recordCount} | ${target.latestRecordId ?? "none"} | ${target.missingSections.join("; ") || "none"} | ${target.advisoryWarnings.length} |`
    ),
    "",
    "GBrain warnings are advisory. Missing operator evidence still blocks live-adapter cutover.",
    ""
  ].join("\n");
}
