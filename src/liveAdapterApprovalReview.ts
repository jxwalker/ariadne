import fs from "node:fs/promises";
import path from "node:path";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { LiveAdapterApprovalPack, LiveAdapterApprovalReview, MutationReadinessPlan } from "./types.js";

export type LiveAdapterApprovalReviewTarget = Exclude<MutationReadinessPlan["target"], "generic">;

export async function recordLiveAdapterApprovalReview(input: {
  project: string;
  vaultRoot: string;
  target: LiveAdapterApprovalReviewTarget;
  status: LiveAdapterApprovalReview["status"];
  reviewedBy: string;
  packetRef?: string;
  evidenceRefs: string[];
  notes?: string;
}): Promise<{ jsonPath: string; markdownPath: string; record: LiveAdapterApprovalReview }> {
  const project = slugifyProject(input.project);
  const packetRef = input.packetRef ?? "control/live-adapter-approval-pack.json";
  const packetPath = resolveProjectPath(input.vaultRoot, project, packetRef);
  const packet = JSON.parse(await fs.readFile(packetPath, "utf8")) as LiveAdapterApprovalPack;
  if (packet.project !== project) {
    throw new Error(`Approval pack ${packetRef} belongs to ${packet.project}, not ${project}.`);
  }
  if (!packet.packets.some((item) => item.target === input.target)) {
    throw new Error(`Approval pack ${packetRef} does not contain target ${input.target}.`);
  }
  if (input.evidenceRefs.length === 0) {
    throw new Error("At least one review evidence ref is required.");
  }
  await assertEvidenceRefsExist(input.vaultRoot, project, input.evidenceRefs);

  const recordedAt = new Date();
  const record: LiveAdapterApprovalReview = {
    schemaVersion: 1,
    id: `approval-review-${input.target}-${timestampFile(recordedAt)}`,
    project,
    recordedAt: recordedAt.toISOString(),
    target: input.target,
    status: input.status,
    reviewedBy: input.reviewedBy,
    packetRef,
    evidenceRefs: input.evidenceRefs,
    notes: input.notes,
    mutationApproved: false
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control/live-adapter-approval-reviews", `${record.id}.json`, record);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control/live-adapter-approval-reviews",
    `${record.id}.md`,
    renderReview(record)
  );
  return { jsonPath, markdownPath, record };
}

export function liveAdapterApprovalReviewTargetOption(value: string): LiveAdapterApprovalReviewTarget {
  if (
    value === "github" ||
    value === "deployment" ||
    value === "hermes-cron" ||
    value === "openscorpion" ||
    value === "gsd2" ||
    value === "notebooklm"
  ) {
    return value;
  }
  throw new Error("--target must be github, deployment, hermes-cron, openscorpion, gsd2, or notebooklm.");
}

export function liveAdapterApprovalReviewStatusOption(value: string): LiveAdapterApprovalReview["status"] {
  if (value === "accepted" || value === "needs_changes" || value === "rejected") {
    return value;
  }
  throw new Error("--status must be accepted, needs_changes, or rejected.");
}

async function assertEvidenceRefsExist(vaultRoot: string, project: string, refs: string[]): Promise<void> {
  for (const ref of refs) {
    const candidates = [resolveProjectPath(vaultRoot, project, ref), path.resolve(ref), path.join(vaultRoot, ref)];
    let found = false;
    for (const candidate of candidates) {
      try {
        await fs.access(candidate);
        found = true;
        break;
      } catch {
        // try next candidate
      }
    }
    if (!found) throw new Error(`Missing review evidence: ${ref}`);
  }
}

function resolveProjectPath(vaultRoot: string, project: string, ref: string): string {
  return path.isAbsolute(ref) ? ref : path.join(projectDir(vaultRoot, project), ref);
}

function renderReview(record: LiveAdapterApprovalReview): string {
  return [
    `# Live Adapter Approval Review: ${record.target}`,
    "",
    `Id: ${record.id}`,
    `Status: ${record.status}`,
    `Recorded: ${record.recordedAt}`,
    `Reviewed by: ${record.reviewedBy}`,
    `Packet: ${record.packetRef}`,
    `Mutation approved: ${record.mutationApproved}`,
    "",
    "## Evidence",
    "",
    ...list(record.evidenceRefs),
    ...(record.notes ? ["", "## Notes", "", record.notes] : []),
    "",
    "This record only confirms operator review of the approval packet. It does not approve live mutation.",
    ""
  ].join("\n");
}

function list(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}
