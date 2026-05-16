import { randomUUID } from "node:crypto";
import path from "node:path";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { slugifyProject } from "./paths.js";
import type { AgentLeaseRecord, AgentMailRecord, MemoryProposalRecord, SleepRoutineRecord } from "./types.js";

export async function recordSleepRoutine(input: {
  project: string;
  vaultRoot: string;
  scope: string;
  summary: string;
  evidenceRefs: string[];
  nextActions: string[];
}): Promise<{ jsonPath: string; markdownPath: string; record: SleepRoutineRecord }> {
  const project = slugifyProject(input.project);
  const recordedAt = new Date();
  const record: SleepRoutineRecord = {
    schemaVersion: 1,
    id: `sleep-${timestampFile(recordedAt)}-${randomUUID().slice(0, 8)}`,
    project,
    recordedAt: recordedAt.toISOString(),
    scope: input.scope,
    summary: input.summary,
    evidenceRefs: input.evidenceRefs,
    nextActions: input.nextActions
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "coordination", `${record.id}.json`, record);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "coordination", `${record.id}.md`, renderSleep(record));
  return { jsonPath, markdownPath, record };
}

export async function recordMemoryProposal(input: {
  project: string;
  vaultRoot: string;
  title: string;
  proposal: string;
  evidenceRefs: string[];
}): Promise<{ jsonPath: string; markdownPath: string; record: MemoryProposalRecord }> {
  const project = slugifyProject(input.project);
  const recordedAt = new Date();
  const record: MemoryProposalRecord = {
    schemaVersion: 1,
    id: `memory-${timestampFile(recordedAt)}-${randomUUID().slice(0, 8)}`,
    project,
    recordedAt: recordedAt.toISOString(),
    title: input.title,
    proposal: input.proposal,
    evidenceRefs: input.evidenceRefs,
    status: "proposed"
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "coordination", `${record.id}.json`, record);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "coordination", `${record.id}.md`, renderMemory(record));
  return { jsonPath, markdownPath, record };
}

export async function recordAgentMail(input: {
  project: string;
  vaultRoot: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  taskId?: string;
  runId?: string;
}): Promise<{ jsonPath: string; markdownPath: string; record: AgentMailRecord }> {
  const project = slugifyProject(input.project);
  const recordedAt = new Date();
  const record: AgentMailRecord = {
    schemaVersion: 1,
    id: `mail-${timestampFile(recordedAt)}-${randomUUID().slice(0, 8)}`,
    project,
    recordedAt: recordedAt.toISOString(),
    from: input.from,
    to: input.to,
    subject: input.subject,
    body: input.body,
    taskId: input.taskId,
    runId: input.runId,
    status: "sent"
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "coordination/mail", `${record.id}.json`, record);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "coordination/mail", `${record.id}.md`, renderMail(record));
  return { jsonPath, markdownPath, record };
}

export async function recordAgentLease(input: {
  project: string;
  vaultRoot: string;
  agent: string;
  resource: string;
  status: AgentLeaseRecord["status"];
  taskId?: string;
  runId?: string;
  notes?: string;
}): Promise<{ jsonPath: string; markdownPath: string; record: AgentLeaseRecord }> {
  const project = slugifyProject(input.project);
  const recordedAt = new Date();
  const record: AgentLeaseRecord = {
    schemaVersion: 1,
    id: `lease-${timestampFile(recordedAt)}-${randomUUID().slice(0, 8)}`,
    project,
    recordedAt: recordedAt.toISOString(),
    agent: input.agent,
    resource: portableValue(input.vaultRoot, input.resource),
    status: input.status,
    taskId: input.taskId,
    runId: input.runId,
    notes: input.notes
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "coordination/leases", `${record.id}.json`, record);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "coordination/leases",
    `${record.id}.md`,
    renderLease(record)
  );
  return { jsonPath, markdownPath, record };
}

function portableValue(vaultRoot: string, value: string): string {
  const workspaceRoot = path.dirname(vaultRoot);
  return value.split(vaultRoot).join("<VAULT_ROOT>").split(workspaceRoot).join("<WORKSPACE_ROOT>");
}

function list(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}

function renderSleep(record: SleepRoutineRecord): string {
  return [
    `# Sleep Routine: ${record.scope}`,
    "",
    `Recorded: ${record.recordedAt}`,
    "",
    record.summary,
    "",
    "## Evidence",
    "",
    ...list(record.evidenceRefs),
    "",
    "## Next Actions",
    "",
    ...list(record.nextActions),
    ""
  ].join("\n");
}

function renderMemory(record: MemoryProposalRecord): string {
  return [
    `# Memory Proposal: ${record.title}`,
    "",
    `Recorded: ${record.recordedAt}`,
    `Status: ${record.status}`,
    "",
    record.proposal,
    "",
    "## Evidence",
    "",
    ...list(record.evidenceRefs),
    ""
  ].join("\n");
}

function renderMail(record: AgentMailRecord): string {
  return [
    `# Agent Mail: ${record.subject}`,
    "",
    `From: ${record.from}`,
    `To: ${record.to}`,
    `Recorded: ${record.recordedAt}`,
    record.taskId ? `Task: ${record.taskId}` : undefined,
    record.runId ? `Run: ${record.runId}` : undefined,
    "",
    record.body,
    ""
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
}

function renderLease(record: AgentLeaseRecord): string {
  return [
    `# Agent Lease: ${record.resource}`,
    "",
    `Agent: ${record.agent}`,
    `Status: ${record.status}`,
    `Recorded: ${record.recordedAt}`,
    record.taskId ? `Task: ${record.taskId}` : undefined,
    record.runId ? `Run: ${record.runId}` : undefined,
    "",
    record.notes ?? "No notes recorded.",
    ""
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
}
