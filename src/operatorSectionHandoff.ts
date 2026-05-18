import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { guidanceForHumanVerificationSection } from "./humanVerificationWorksheetMarkdown.js";
import { type LiveAdapterTarget } from "./liveAdapterTargets.js";
import { generateLiveAdapterOperatorEvidenceNextPacket } from "./liveAdapterOperatorEvidenceNextPacket.js";
import { slugifyProject } from "./paths.js";
import type { HumanVerificationWorksheetRow, LiveAdapterOperatorEvidenceNextPacket } from "./types.js";

type NextPacketResult = Awaited<ReturnType<typeof generateLiveAdapterOperatorEvidenceNextPacket>>;

export interface OperatorSectionHandoff {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  target: LiveAdapterTarget;
  selectedBy: LiveAdapterOperatorEvidenceNextPacket["selectedBy"];
  status: "operator_action_required";
  mutationApproved: false;
  approvalGranted: false;
  operatorEvidenceRecordCreated: false;
  sourcePacketRef: string;
  summary: {
    step: number;
    totalMissingSections: number;
    existingEvidenceRefs: number;
    promotedLiveEvidenceRefs: number;
    gbrainQueries: number;
  };
  section: {
    missingSection: string;
    humanVerificationPrompt: string;
    startWith: string;
    recordIn: string;
    preflightExpectation: string;
    existingEvidenceRefs: string[];
    promotedLiveEvidenceRefs: string[];
    gbrainQueries: string[];
  };
  refs: {
    evidenceFile: string;
    packet: string;
    workspace: string;
    assist: string;
    checkBatch: string;
    reviewSession: string;
    cutoverAudit: string;
  };
  commands: {
    check: string;
    reviewSession: string;
    cutoverAudit: string;
  };
  afterHumanVerificationCommands: {
    import: string;
  };
  rule: string;
}

export async function generateOperatorSectionHandoff(input: {
  project: string;
  vaultRoot: string;
  target?: LiveAdapterTarget;
  section?: string;
  nextPacket?: NextPacketResult;
}): Promise<{ jsonPath: string; markdownPath: string; handoff: OperatorSectionHandoff }> {
  const project = slugifyProject(input.project);
  const packetResult =
    input.nextPacket ??
    (await generateLiveAdapterOperatorEvidenceNextPacket({
      project,
      vaultRoot: input.vaultRoot,
      target: input.target
    }));
  const rows = packetResult.packet.verificationWorksheet;
  if (rows.length === 0) {
    throw new Error(`No missing operator evidence sections for ${packetResult.packet.target}; run the import-ready flow instead.`);
  }
  const selected = selectSection(rows, input.section);
  const guidance = guidanceForHumanVerificationSection(selected.row.missingSection);
  const evidenceFile = operatorEvidenceFileRef(project, packetResult.packet.target, packetResult.packet.evidenceRefs);
  const handoff: OperatorSectionHandoff = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    target: packetResult.packet.target,
    selectedBy: packetResult.packet.selectedBy,
    status: "operator_action_required",
    mutationApproved: false,
    approvalGranted: false,
    operatorEvidenceRecordCreated: false,
    sourcePacketRef: relativeRef(input.vaultRoot, packetResult.jsonPath),
    summary: {
      step: selected.index + 1,
      totalMissingSections: rows.length,
      existingEvidenceRefs: selected.row.existingEvidenceRefs.length,
      promotedLiveEvidenceRefs: selected.row.promotedLiveEvidenceRefs.length,
      gbrainQueries: selected.row.gbrainQueries.length
    },
    section: {
      missingSection: selected.row.missingSection,
      humanVerificationPrompt: selected.row.humanVerificationPrompt,
      startWith: guidance.startWith,
      recordIn: guidance.recordIn,
      preflightExpectation: guidance.preflight,
      existingEvidenceRefs: selected.row.existingEvidenceRefs,
      promotedLiveEvidenceRefs: selected.row.promotedLiveEvidenceRefs,
      gbrainQueries: selected.row.gbrainQueries
    },
    refs: {
      evidenceFile,
      packet: relativeRef(input.vaultRoot, packetResult.markdownPath),
      workspace: packetResult.packet.refs.workspace,
      assist: packetResult.packet.refs.assist,
      checkBatch: packetResult.packet.refs.checkBatch,
      reviewSession: packetResult.packet.refs.reviewSession,
      cutoverAudit: packetResult.packet.refs.cutoverAudit
    },
    commands: packetResult.packet.commands,
    afterHumanVerificationCommands: packetResult.packet.afterHumanVerificationCommands,
    rule: "This handoff is preparation only. It does not import operator evidence, approve mutation, or grant live-adapter authority."
  };

  const fileStem = `live-adapter-operator-evidence-section-${packetResult.packet.target}`;
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", `${fileStem}.json`, handoff);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "control", `${fileStem}.md`, renderOperatorSectionHandoff(handoff));
  return { jsonPath, markdownPath, handoff };
}

function renderOperatorSectionHandoff(handoff: OperatorSectionHandoff): string {
  return [
    `# Operator Section Handoff: ${handoff.target}`,
    "",
    `Project: ${handoff.project}`,
    `Generated: ${handoff.generatedAt}`,
    `Target: ${handoff.target}`,
    `Status: ${handoff.status}`,
    `Step: ${handoff.summary.step} of ${handoff.summary.totalMissingSections}`,
    `Mutation approved: ${handoff.mutationApproved}`,
    `Approval granted: ${handoff.approvalGranted}`,
    `Operator evidence record created: ${handoff.operatorEvidenceRecordCreated}`,
    "",
    "## Rule",
    "",
    handoff.rule,
    "",
    "## Current Section",
    "",
    `- Missing section: ${handoff.section.missingSection}`,
    `- Prompt: ${handoff.section.humanVerificationPrompt}`,
    `- Start with: ${handoff.section.startWith}`,
    `- Record in: ${handoff.section.recordIn}`,
    `- Preflight expectation: ${handoff.section.preflightExpectation}`,
    "",
    "## Commands",
    "",
    "```bash",
    handoff.commands.check,
    handoff.commands.reviewSession,
    handoff.commands.cutoverAudit,
    "```",
    "",
    "## Import Command After Human Verification",
    "",
    "Run this only after a human operator has filled operator-evidence.md with verified observations and the check command reports complete evidence.",
    "",
    "```bash",
    handoff.afterHumanVerificationCommands.import,
    "```",
    "",
    "## Evidence File",
    "",
    `- ${handoff.refs.evidenceFile}`,
    "",
    "## Existing Evidence Refs",
    "",
    ...list(handoff.section.existingEvidenceRefs),
    "",
    "## Promoted Live Evidence Refs",
    "",
    ...list(handoff.section.promotedLiveEvidenceRefs),
    "",
    "## GBrain Advisory Queries",
    "",
    ...list(handoff.section.gbrainQueries),
    "",
    "## Supporting Refs",
    "",
    `- sourcePacket: ${handoff.sourcePacketRef}`,
    `- packet: ${handoff.refs.packet}`,
    `- workspace: ${handoff.refs.workspace}`,
    `- assist: ${handoff.refs.assist}`,
    `- checkBatch: ${handoff.refs.checkBatch}`,
    `- reviewSession: ${handoff.refs.reviewSession}`,
    `- cutoverAudit: ${handoff.refs.cutoverAudit}`,
    ""
  ].join("\n");
}

function selectSection(rows: HumanVerificationWorksheetRow[], requested: string | undefined): { row: HumanVerificationWorksheetRow; index: number } {
  if (!requested) return { row: rows[0] as HumanVerificationWorksheetRow, index: 0 };
  const normalizedRequested = normalizeSection(requested);
  const index = rows.findIndex((row) => normalizeSection(row.missingSection) === normalizedRequested);
  if (index >= 0) return { row: rows[index] as HumanVerificationWorksheetRow, index };
  throw new Error(`Unknown operator evidence section "${requested}". Available sections: ${rows.map((row) => row.missingSection).join(", ")}`);
}

function operatorEvidenceFileRef(project: string, target: string, evidenceRefs: string[]): string {
  return (
    evidenceRefs.find((ref) => ref.endsWith(`/control/operator-evidence/${target}/operator-evidence.md`)) ??
    `projects/${project}/control/operator-evidence/${target}/operator-evidence.md`
  );
}

function relativeRef(vaultRoot: string, absolutePath: string): string {
  return path.relative(vaultRoot, absolutePath).split(path.sep).join("/");
}

function normalizeSection(value: string): string {
  return value.trim().toLowerCase();
}

function list(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}
