import fs from "node:fs/promises";
import path from "node:path";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { HealerProposalRecord, PlaywrightEvidenceRecord } from "./types.js";

export async function generateHealerProposal(input: {
  project: string;
  vaultRoot: string;
  evidencePath?: string;
  notes?: string;
}): Promise<{ jsonPath: string; markdownPath: string; proposal: HealerProposalRecord }> {
  const project = slugifyProject(input.project);
  const evidence = input.evidencePath
    ? await readEvidence(resolveEvidencePath(input.evidencePath))
    : await latestFailedEvidence(input.vaultRoot, project);
  if (evidence.status !== "failed") {
    throw new Error(`Healer proposals require failed Playwright evidence. ${evidence.id} is ${evidence.status}.`);
  }

  const generatedAt = new Date();
  const evidenceRefs = [evidenceRef(evidence)];
  if (evidence.screenshotPath) evidenceRefs.push(evidence.screenshotPath);
  if (evidence.tracePath) evidenceRefs.push(evidence.tracePath);

  const observations = inferObservations(evidence);
  const proposal: HealerProposalRecord = {
    schemaVersion: 1,
    id: `healer-${timestampFile(generatedAt)}`,
    project,
    generatedAt: generatedAt.toISOString(),
    status: "review_required",
    evidenceRecordId: evidence.id,
    targetUrl: evidence.targetUrl,
    evidenceRefs,
    observations,
    proposedActions: inferActions(evidence, observations),
    reviewGates: [
      "Inspect the screenshot and trace before editing application code.",
      "Keep generated repairs in a bounded branch and review the diff.",
      "Rerun the failing Playwright capture or test before accepting the repair.",
      "Record new Playwright evidence and CodeRabbit or human review before merge."
    ],
    apply: false,
    notes: input.notes
  };

  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "verification/healer-proposals", `${proposal.id}.json`, proposal);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "verification/healer-proposals",
    `${proposal.id}.md`,
    renderProposal(proposal)
  );
  return { jsonPath, markdownPath, proposal };
}

async function latestFailedEvidence(vaultRoot: string, project: string): Promise<PlaywrightEvidenceRecord> {
  const verificationDir = path.join(projectDir(vaultRoot, project), "verification");
  const entries = await fs.readdir(verificationDir).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  });
  const records = (
    await Promise.all(
      entries
        .filter((entry) => entry.startsWith("playwright-") && entry.endsWith(".json"))
        .map((entry) =>
          readEvidence(path.join(verificationDir, entry)).catch((error) => {
            console.warn(`Skipping malformed Playwright evidence file ${path.join(verificationDir, entry)}: ${(error as Error).message}`);
            return undefined;
          })
        )
    )
  )
    .filter((record): record is PlaywrightEvidenceRecord => Boolean(record))
    .filter((record) => record.status === "failed")
    .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt));
  const latest = records.at(-1);
  if (!latest) {
    throw new Error(`No failed Playwright evidence found for project ${project}.`);
  }
  return latest;
}

async function readEvidence(filePath: string): Promise<PlaywrightEvidenceRecord> {
  const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as Partial<PlaywrightEvidenceRecord>;
  if (parsed.schemaVersion !== 1 || typeof parsed.id !== "string" || !parsed.id.startsWith("playwright-")) {
    throw new Error(`Not a Playwright evidence record: ${filePath}`);
  }
  if (parsed.status !== "passed" && parsed.status !== "failed" && parsed.status !== "skipped") {
    throw new Error(`Playwright evidence has invalid status in ${filePath}.`);
  }
  if (typeof parsed.targetUrl !== "string" || parsed.targetUrl.trim().length === 0) {
    throw new Error(`Playwright evidence has invalid targetUrl in ${filePath}.`);
  }
  if (typeof parsed.recordedAt !== "string" || Number.isNaN(Date.parse(parsed.recordedAt))) {
    throw new Error(`Playwright evidence has invalid recordedAt in ${filePath}.`);
  }
  return parsed as PlaywrightEvidenceRecord;
}

function resolveEvidencePath(filePath: string): string {
  return path.resolve(filePath);
}

function evidenceRef(evidence: PlaywrightEvidenceRecord): string {
  return path.join("projects", evidence.project, "verification", `${evidence.id}.json`).split(path.sep).join("/");
}

function inferObservations(evidence: PlaywrightEvidenceRecord): string[] {
  const notes = evidence.notes ?? "";
  const observations = [
    `Playwright evidence ${evidence.id} failed for ${evidence.targetUrl}.`,
    evidence.screenshotPath ? `Screenshot evidence is available at ${evidence.screenshotPath}.` : "No screenshot path was recorded.",
    evidence.tracePath ? `Trace evidence is available at ${evidence.tracePath}.` : "No trace path was recorded."
  ];
  if (/Selector was not visible/i.test(notes)) {
    observations.push("The failure indicates a visibility or locator mismatch.");
  }
  if (/Timeout|timed out/i.test(notes)) {
    observations.push("The failure includes timeout language; readiness or async loading may be involved.");
  }
  if (/ERR_|net::|ECONNREFUSED|Cannot navigate/i.test(notes)) {
    observations.push("The failure appears to involve target reachability or navigation.");
  }
  if (notes.trim().length > 0) {
    observations.push(`Captured notes: ${notes.trim()}`);
  }
  return observations;
}

function inferActions(
  evidence: PlaywrightEvidenceRecord,
  observations: string[]
): HealerProposalRecord["proposedActions"] {
  const actions: HealerProposalRecord["proposedActions"] = [];
  const notes = evidence.notes ?? "";
  if (/Selector was not visible/i.test(notes)) {
    actions.push({
      id: "HP-A1",
      title: "Repair locator or accessibility contract",
      rationale: "The captured evidence reports that the expected selector was not visible.",
      suggestedFiles: ["playwright spec or UI component owning the missing text/role"],
      verificationCommands: ["npm run ariadne -- playwright-capture --project <project> --target-url <url> --selector <selector>"],
      reviewGate: "A reviewer must confirm the selector matches user-visible behavior rather than hiding the failure."
    });
  }
  if (/Timeout|timed out/i.test(notes)) {
    actions.push({
      id: "HP-A2",
      title: "Add an explicit readiness signal",
      rationale: "Timeout language suggests the app may need a clearer loaded state or the test may need a better wait condition.",
      suggestedFiles: ["UI route/component loading state", "Playwright test setup"],
      verificationCommands: ["npm run ariadne -- playwright-capture --project <project> --target-url <url> --wait-until networkidle"],
      reviewGate: "A reviewer must confirm the wait condition reflects real readiness, not arbitrary delay."
    });
  }
  if (actions.length === 0) {
    actions.push({
      id: "HP-A3",
      title: "Triage captured screenshot and trace",
      rationale: observations[0] ?? "The Playwright evidence failed and needs human review before repair.",
      suggestedFiles: ["application route under test", "Playwright scenario or generated spec"],
      verificationCommands: ["npm run check", "npm test", "npm run ariadne -- playwright-capture --project <project> --target-url <url>"],
      reviewGate: "A reviewer must inspect the screenshot and trace before approving any generated repair."
    });
  }
  return actions;
}

function renderProposal(proposal: HealerProposalRecord): string {
  return [
    `# Healer Proposal: ${proposal.id}`,
    "",
    `Status: ${proposal.status}`,
    `Generated: ${proposal.generatedAt}`,
    `Evidence: ${proposal.evidenceRecordId}`,
    `Target URL: ${proposal.targetUrl}`,
    `Apply automatically: ${proposal.apply}`,
    "",
    "## Evidence",
    "",
    ...proposal.evidenceRefs.map((ref) => `- ${ref}`),
    "",
    "## Observations",
    "",
    ...proposal.observations.map((observation) => `- ${observation}`),
    "",
    "## Proposed Actions",
    "",
    ...proposal.proposedActions.flatMap((action) => [
      `### ${action.id}: ${action.title}`,
      "",
      action.rationale,
      "",
      "Suggested files:",
      ...action.suggestedFiles.map((file) => `- ${file}`),
      "",
      "Verification:",
      ...action.verificationCommands.map((command) => `- \`${command}\``),
      "",
      `Review gate: ${action.reviewGate}`,
      ""
    ]),
    "## Review Gates",
    "",
    ...proposal.reviewGates.map((gate) => `- ${gate}`),
    "",
    proposal.notes ? `Notes: ${proposal.notes}` : "Notes: none",
    ""
  ].join("\n");
}
