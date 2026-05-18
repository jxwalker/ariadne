import fs from "node:fs/promises";
import path from "node:path";
import { ensureArtifactDir, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateLiveAdapterOperatorEvidenceNextPacket } from "./liveAdapterOperatorEvidenceNextPacket.js";
import type { LiveAdapterTarget } from "./liveAdapterTargets.js";
import { slugifyProject } from "./paths.js";
import type { HumanVerificationWorksheetRow, LiveAdapterOperatorEvidenceDraft } from "./types.js";

type DraftRow = LiveAdapterOperatorEvidenceDraft["rows"][number];
type NextPacketLike = {
  jsonPath: string;
  packet: {
    target: LiveAdapterTarget;
    summary: { missingSections: number };
    commands: { check: string };
    afterHumanVerificationCommands: { import: string };
    verificationWorksheet: HumanVerificationWorksheetRow[];
  };
};

export async function generateLiveAdapterOperatorEvidenceDraft(input: {
  project: string;
  vaultRoot: string;
  target?: LiveAdapterTarget;
  nextPacket?: NextPacketLike;
}): Promise<{ jsonPath: string; markdownPath: string; draftFilePath: string; draft: LiveAdapterOperatorEvidenceDraft }> {
  const project = slugifyProject(input.project);
  const packetResult =
    input.nextPacket ??
    (await generateLiveAdapterOperatorEvidenceNextPacket({
      project,
      vaultRoot: input.vaultRoot,
      target: input.target
    }));
  validatePacketResult(packetResult, input.target);
  const generatedAt = new Date().toISOString();
  const target = packetResult.packet.target;
  const draftFileRef = `projects/${project}/control/operator-evidence/${target}/operator-evidence-draft.md`;
  const rows = packetResult.packet.verificationWorksheet.map((row) => draftRow(target, row));
  const draft: LiveAdapterOperatorEvidenceDraft = {
    schemaVersion: 1,
    project,
    generatedAt,
    target,
    status: "drafted_for_human_verification",
    mutationApproved: false,
    approvalGranted: false,
    operatorEvidenceRecordCreated: false,
    sourcePacketRef: path.relative(input.vaultRoot, packetResult.jsonPath).split(path.sep).join("/"),
    draftFileRef,
    summary: {
      missingSections: packetResult.packet.summary.missingSections,
      candidateRows: rows.length,
      existingEvidenceRefs: countUnique(rows.flatMap((row) => row.existingEvidenceRefs)),
      promotedLiveEvidenceRefs: countUnique(rows.flatMap((row) => row.promotedLiveEvidenceRefs)),
      gbrainQueries: countUnique(rows.flatMap((row) => row.gbrainQueries))
    },
    commands: {
      check: packetResult.packet.commands.check,
      importAfterHumanVerification: packetResult.packet.afterHumanVerificationCommands.import
    },
    rows,
    notes: [
      "This draft is non-authoritative and must not be imported directly.",
      "A human operator must verify every row against source systems or cited Ariadne refs before copying facts into operator-evidence.md.",
      "The draft does not approve mutation, grant live-adapter authority, or create an operator evidence record.",
      "GBrain context remains advisory; Ariadne evidence refs and source-system observations carry the gates."
    ]
  };

  const draftFilePath = await writeDraftFile(input.vaultRoot, project, target, renderOperatorDraft(draft));
  const fileStem = `live-adapter-operator-evidence-draft-${target}`;
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", `${fileStem}.json`, draft);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "control", `${fileStem}.md`, renderDraftReport(draft));
  return { jsonPath, markdownPath, draftFilePath, draft };
}

function validatePacketResult(packetResult: NextPacketLike, requestedTarget: LiveAdapterTarget | undefined): void {
  if (!packetResult.packet) {
    throw new Error("Operator evidence draft requires a generated next packet.");
  }
  if (requestedTarget && packetResult.packet.target !== requestedTarget) {
    throw new Error(`Next packet target ${packetResult.packet.target} does not match requested draft target ${requestedTarget}.`);
  }
  if (!Array.isArray(packetResult.packet.verificationWorksheet)) {
    throw new Error("Operator evidence draft requires a next packet verification worksheet.");
  }
  if (!packetResult.packet.commands?.check) {
    throw new Error("Operator evidence draft requires a next packet check command.");
  }
  if (!packetResult.packet.afterHumanVerificationCommands?.import) {
    throw new Error("Operator evidence draft requires a post-verification import command.");
  }
}

function draftRow(target: LiveAdapterTarget, row: HumanVerificationWorksheetRow): DraftRow {
  return {
    missingSection: row.missingSection,
    humanVerificationPrompt: row.humanVerificationPrompt,
    candidateAction: candidateAction(target, row.missingSection),
    existingEvidenceRefs: row.existingEvidenceRefs,
    promotedLiveEvidenceRefs: row.promotedLiveEvidenceRefs,
    gbrainQueries: row.gbrainQueries,
    humanVerificationRequired: true
  };
}

function candidateAction(target: LiveAdapterTarget, missingSection: string): string {
  switch (missingSection) {
    case "Operator identity and timestamp":
      return "Record the human operator name and current review timestamp only after the operator has personally completed this review.";
    case "Approval packet review":
      return `Review the ${target} approval packet, next packet, review session, and cutover audit refs; record whether the packet is complete or what remains missing.`;
    case "Authentication or authorization boundary":
      return `Verify the ${target} account, token, SSH, browser, or scheduler boundary from source systems and cite the relevant Ariadne refs.`;
    case "Bounded action statement":
      return `State the exact ${target} action that would be allowed after approval and explicitly list non-goals that remain out of scope.`;
    case "Rollback or disable path":
      return `Verify the ${target} rollback or disable path from source systems and record the exact command, UI path, or operational procedure.`;
    case "Post-action verification command":
      return `Record the exact ${target} post-action verification command or check that proves the live action behaved as intended.`;
    case "Dry-run command and safe output":
      return `Run or inspect the ${target} dry-run command only where safe; record the expected non-mutating output shape and evidence ref.`;
    case "Target-guarded execution wrapper":
      return `Verify that ${target} execution would use the target-specific wrapper or guarded mutation executor rather than an ad hoc command.`;
    case "Exact confirm-plan proof":
      return "Verify that live execution requires an exact --confirm-plan value matching the reviewed mutation-readiness plan.";
    default:
      return `Verify ${missingSection} for ${target} against cited Ariadne refs and source systems before importing evidence.`;
  }
}

async function writeDraftFile(vaultRoot: string, project: string, target: LiveAdapterTarget, content: string): Promise<string> {
  const dir = await ensureArtifactDir(vaultRoot, project, `control/operator-evidence/${target}`);
  const filePath = path.join(dir, "operator-evidence-draft.md");
  await fs.writeFile(filePath, content.endsWith("\n") ? content : `${content}\n`);
  return filePath;
}

function renderDraftReport(draft: LiveAdapterOperatorEvidenceDraft): string {
  return [
    `# Live Adapter Operator Evidence Draft Report: ${draft.target}`,
    "",
    `Project: ${draft.project}`,
    `Generated: ${draft.generatedAt}`,
    `Status: ${draft.status}`,
    `Mutation approved: ${draft.mutationApproved}`,
    `Approval granted: ${draft.approvalGranted}`,
    `Operator evidence record created: ${draft.operatorEvidenceRecordCreated}`,
    "",
    "## Rule",
    "",
    "This report creates a non-authoritative draft only. It does not import operator evidence, approve mutation, or grant live-adapter authority.",
    "",
    "## Summary",
    "",
    `- Target: ${draft.target}`,
    `- Missing sections: ${draft.summary.missingSections}`,
    `- Candidate rows: ${draft.summary.candidateRows}`,
    `- Existing evidence refs: ${draft.summary.existingEvidenceRefs}`,
    `- Promoted live evidence refs: ${draft.summary.promotedLiveEvidenceRefs}`,
    `- GBrain queries: ${draft.summary.gbrainQueries}`,
    "",
    "## Refs",
    "",
    `- Source packet: ${draft.sourcePacketRef}`,
    `- Draft file: ${draft.draftFileRef}`,
    "",
    "## Commands",
    "",
    "### Check After Human Edits",
    "",
    "```bash",
    draft.commands.check,
    "```",
    "",
    "### Import After Human Verification",
    "",
    "```bash",
    draft.commands.importAfterHumanVerification,
    "```",
    "",
    "## Human Verification Rows",
    "",
    verificationTable(draft.rows),
    "",
    "## Notes",
    "",
    ...draft.notes.map((note) => `- ${note}`),
    ""
  ].join("\n");
}

function renderOperatorDraft(draft: LiveAdapterOperatorEvidenceDraft): string {
  return [
    `# Operator Evidence Draft: ${draft.target}`,
    "",
    `Project: ${draft.project}`,
    `Generated: ${draft.generatedAt}`,
    "Status: non-authoritative draft",
    "Mutation approved: false",
    "Approval granted: false",
    "Operator evidence record created: false",
    "",
    "## Instructions",
    "",
    "- Do not import this file directly.",
    "- Use this draft to review candidate refs, then copy verified facts into operator-evidence.md.",
    "- Keep unknown or unverified checklist items unchecked in operator-evidence.md.",
    "- Run the check command against operator-evidence.md after human edits.",
    "",
    "## Commands",
    "",
    "### Check Human-Filled Evidence",
    "",
    "```bash",
    draft.commands.check,
    "```",
    "",
    "### Import After Human Verification",
    "",
    "```bash",
    draft.commands.importAfterHumanVerification,
    "```",
    "",
    "## Candidate Review Rows",
    "",
    ...draft.rows.flatMap((row) => renderRow(row)),
    "",
    "## Copy Checklist Into operator-evidence.md After Verification",
    "",
    "These placeholders are intentionally not evidence. Replace them only after a human operator verifies the facts.",
    "",
    "```markdown",
    "- Operator: <human operator>",
    "- Review timestamp: <verified timestamp>",
    "- Packet reviewed: <reviewed packet ref>",
    "- Decision for packet completeness: <complete|needs_changes plus reason>",
    "- Missing evidence: <none or explicit missing items>",
    "",
    "## Required Evidence To Attach",
    "",
    "- [ ] operator identity and review timestamp",
    "- [ ] reviewed approval packet path and generation timestamp",
    "- [ ] authentication or authorization boundary observed for this target",
    "- [ ] bounded action statement and explicit non-goals",
    "- [ ] rollback or disable path checked by the operator",
    "- [ ] post-action verification command checked by the operator",
    "- [ ] dry-run command and expected safe output shape",
    "- [ ] target-guarded execution command and expected post-verification output shape",
    "- [ ] proof that execution used mutation-execute or a target-specific wrapper with an exact --confirm-plan match",
    "```",
    "",
    "## Notes",
    "",
    ...draft.notes.map((note) => `- ${note}`),
    ""
  ].join("\n");
}

function renderRow(row: DraftRow): string[] {
  return [
    `### ${row.missingSection}`,
    "",
    `Human verification required: ${row.humanVerificationRequired}`,
    "",
    `Prompt: ${row.humanVerificationPrompt}`,
    "",
    `Candidate action: ${row.candidateAction}`,
    "",
    "#### Existing Evidence Refs",
    "",
    ...list(row.existingEvidenceRefs),
    "",
    "#### Promoted Live Evidence Refs",
    "",
    ...list(row.promotedLiveEvidenceRefs),
    "",
    "#### GBrain Advisory Queries",
    "",
    ...list(row.gbrainQueries),
    ""
  ];
}

function verificationTable(rows: DraftRow[]): string {
  return [
    "| Missing section | Human verification required | Existing refs | Promoted refs | GBrain queries |",
    "| --- | --- | ---: | ---: | ---: |",
    ...rows.map(
      (row) =>
        `| ${tableCell(row.missingSection)} | ${row.humanVerificationRequired} | ${row.existingEvidenceRefs.length} | ${row.promotedLiveEvidenceRefs.length} | ${row.gbrainQueries.length} |`
    )
  ].join("\n");
}

function list(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}

function tableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function countUnique(items: string[]): number {
  return new Set(items).size;
}
