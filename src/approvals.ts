import fs from "node:fs/promises";
import path from "node:path";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { ApprovalRecord } from "./types.js";

export async function requestApproval(input: {
  project: string;
  vaultRoot: string;
  requestedBy: string;
  target: string;
  action: string;
  risk: ApprovalRecord["risk"];
  reason: string;
  rollback: string;
  evidenceRefs: string[];
}): Promise<{ jsonPath: string; markdownPath: string; record: ApprovalRecord }> {
  const project = slugifyProject(input.project);
  const requestedAt = new Date();
  const record: ApprovalRecord = {
    schemaVersion: 1,
    id: `approval-${timestampFile(requestedAt)}`,
    project,
    requestedAt: requestedAt.toISOString(),
    requestedBy: input.requestedBy,
    target: input.target,
    action: input.action,
    risk: input.risk,
    status: "requested",
    reason: input.reason,
    rollback: input.rollback,
    evidenceRefs: input.evidenceRefs
  };
  return writeApproval(input.vaultRoot, project, record);
}

export async function decideApproval(input: {
  project: string;
  vaultRoot: string;
  approval: string;
  status: "approved" | "rejected" | "expired";
  decisionBy: string;
  decisionNotes?: string;
}): Promise<{ jsonPath: string; markdownPath: string; record: ApprovalRecord }> {
  const project = slugifyProject(input.project);
  const existingPath = resolveApprovalPath(input.vaultRoot, project, input.approval);
  const existing = JSON.parse(await fs.readFile(existingPath, "utf8")) as ApprovalRecord;
  if (existing.project !== project) {
    throw new Error(`Approval ${input.approval} belongs to ${existing.project}, not ${project}.`);
  }
  if (existing.status !== "requested") {
    throw new Error(
      `Approval ${existing.id} is ${existing.status}; cannot transition to ${input.status}. Only requested approvals can be decided.`
    );
  }
  const record: ApprovalRecord = {
    ...existing,
    status: input.status,
    decidedAt: new Date().toISOString(),
    decisionBy: input.decisionBy,
    decisionNotes: input.decisionNotes
  };
  return writeApproval(input.vaultRoot, project, record);
}

function resolveApprovalPath(vaultRoot: string, project: string, approval: string): string {
  if (approval.endsWith(".json")) return path.resolve(approval);
  return path.join(projectDir(vaultRoot, project), "control", "approvals", `${approval}.json`);
}

async function writeApproval(
  vaultRoot: string,
  project: string,
  record: ApprovalRecord
): Promise<{ jsonPath: string; markdownPath: string; record: ApprovalRecord }> {
  const jsonPath = await writeJsonArtifact(vaultRoot, project, "control/approvals", `${record.id}.json`, record);
  const markdownPath = await writeTextArtifact(vaultRoot, project, "control/approvals", `${record.id}.md`, renderApproval(record));
  return { jsonPath, markdownPath, record };
}

function renderApproval(record: ApprovalRecord): string {
  return [
    `# Approval: ${record.target}`,
    "",
    `Id: ${record.id}`,
    `Status: ${record.status}`,
    `Risk: ${record.risk}`,
    `Requested: ${record.requestedAt}`,
    `Requested by: ${record.requestedBy}`,
    record.decidedAt ? `Decided: ${record.decidedAt}` : undefined,
    record.decisionBy ? `Decision by: ${record.decisionBy}` : undefined,
    "",
    "## Action",
    "",
    record.action,
    "",
    "## Reason",
    "",
    record.reason,
    "",
    "## Rollback",
    "",
    record.rollback,
    "",
    "## Evidence",
    "",
    ...record.evidenceRefs.map((ref) => `- ${ref}`),
    ...(record.decisionNotes ? ["", "## Decision Notes", "", record.decisionNotes] : []),
    ""
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
}
