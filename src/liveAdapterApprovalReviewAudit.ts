import { accessSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { isLiveAdapterTarget, LIVE_ADAPTER_TARGETS, type LiveAdapterTarget } from "./liveAdapterTargets.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { LiveAdapterApprovalPack, LiveAdapterApprovalReview, LiveAdapterApprovalReviewAudit } from "./types.js";

const DEFAULT_APPROVAL_PACK_REF = "control/live-adapter-approval-pack.json";

export async function generateLiveAdapterApprovalReviewAudit(input: {
  project: string;
  vaultRoot: string;
  approvalPackRef?: string;
}): Promise<{ jsonPath: string; markdownPath: string; audit: LiveAdapterApprovalReviewAudit }> {
  const project = slugifyProject(input.project);
  const approvalPackRef = input.approvalPackRef ?? DEFAULT_APPROVAL_PACK_REF;
  const pack = await readApprovalPack(input.vaultRoot, project, approvalPackRef);
  const reviews = await readApprovalReviews(input.vaultRoot, project);
  const targets = LIVE_ADAPTER_TARGETS.map((target) =>
    targetAudit(input.vaultRoot, project, target, approvalPackRef, pack, reviews.records)
  );
  const summary = {
    targets: targets.length,
    packetTargets: pack?.packets.length ?? 0,
    reviewRecords: reviews.records.length,
    currentAcceptedReviews: targets.reduce((sum, target) => sum + target.currentAcceptedReviewCount, 0),
    staleAcceptedReviews: targets.reduce((sum, target) => sum + staleAcceptedCount(target.blockers), 0),
    invalidRecords: reviews.invalidRecords.length + (pack ? 0 : 1),
    missingEvidenceRefs: targets.reduce(
      (sum, target) => sum + target.blockers.filter((blocker) => blocker.startsWith("missing review evidence:")).length,
      0
    )
  };
  const audit: LiveAdapterApprovalReviewAudit = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status: summary.invalidRecords === 0 && targets.every((target) => target.status === "current_accepted") ? "passed" : "blocked",
    approvalPackRef,
    summary,
    targets,
    invalidRecords: [...reviews.invalidRecords, ...(pack ? [] : [{ path: approvalPackRef, reason: "approval pack missing or invalid" }])]
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "live-adapter-approval-review-audit.json", audit);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control",
    "live-adapter-approval-review-audit.md",
    renderAudit(audit)
  );
  return { jsonPath, markdownPath, audit };
}

async function readApprovalPack(
  vaultRoot: string,
  project: string,
  approvalPackRef: string
): Promise<LiveAdapterApprovalPack | undefined> {
  try {
    const parsed = JSON.parse(await fs.readFile(resolveProjectPath(vaultRoot, project, approvalPackRef), "utf8"));
    return isLiveAdapterApprovalPack(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

async function readApprovalReviews(
  vaultRoot: string,
  project: string
): Promise<{ records: LiveAdapterApprovalReview[]; invalidRecords: LiveAdapterApprovalReviewAudit["invalidRecords"] }> {
  const dir = path.join(projectDir(vaultRoot, project), "control", "live-adapter-approval-reviews");
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return { records: [], invalidRecords: [] };
  }
  const records: LiveAdapterApprovalReview[] = [];
  const invalidRecords: LiveAdapterApprovalReviewAudit["invalidRecords"] = [];
  for (const entry of entries.filter((item) => item.startsWith("approval-review-") && item.endsWith(".json")).sort()) {
    const absolutePath = path.join(dir, entry);
    const relativePath = vaultRelative(vaultRoot, absolutePath);
    try {
      const parsed = JSON.parse(await fs.readFile(absolutePath, "utf8"));
      if (isLiveAdapterApprovalReview(parsed)) {
        records.push(parsed);
      } else {
        invalidRecords.push({ path: relativePath, reason: "record does not match live-adapter approval review schema" });
      }
    } catch (error) {
      invalidRecords.push({ path: relativePath, reason: (error as Error).message });
    }
  }
  return { records, invalidRecords };
}

function targetAudit(
  vaultRoot: string,
  project: string,
  target: LiveAdapterTarget,
  approvalPackRef: string,
  pack: LiveAdapterApprovalPack | undefined,
  records: LiveAdapterApprovalReview[]
): LiveAdapterApprovalReviewAudit["targets"][number] {
  const targetRecords = records.filter((record) => record.target === target).sort((left, right) => left.recordedAt.localeCompare(right.recordedAt));
  const accepted = targetRecords.filter((record) => record.status === "accepted");
  const blockers: string[] = [];
  const packetPresent = Boolean(pack?.packets.some((packet) => packet.target === target));
  if (accepted.length === 0) blockers.push("no accepted operator review exists");

  const currentAccepted = accepted.filter((record) => {
    const recordBlockers = reviewBlockers(vaultRoot, project, approvalPackRef, record);
    blockers.push(...recordBlockers);
    return recordBlockers.length === 0;
  });
  if (!packetPresent && currentAccepted.length === 0) blockers.push("approval packet missing for target");
  const latest = targetRecords.at(-1);
  const latestAccepted = accepted.at(-1);
  return {
    target,
    status: targetStatus(targetRecords, accepted, currentAccepted, blockers),
    packetPresent,
    reviewCount: targetRecords.length,
    acceptedReviewCount: accepted.length,
    currentAcceptedReviewCount: currentAccepted.length,
    latestReviewId: latest?.id,
    latestAcceptedReviewId: latestAccepted?.id,
    blockers: Array.from(new Set(blockers)),
    evidenceRefs: Array.from(new Set(currentAccepted.flatMap((record) => [`control/live-adapter-approval-reviews/${record.id}.json`, ...record.evidenceRefs])))
  };
}

function reviewBlockers(
  vaultRoot: string,
  project: string,
  approvalPackRef: string,
  record: LiveAdapterApprovalReview
): string[] {
  const blockers: string[] = [];
  if (record.packetRef !== approvalPackRef) {
    blockers.push(`accepted review ${record.id} references ${record.packetRef}, not ${approvalPackRef}`);
  }
  if (record.recordedAt < record.packetGeneratedAt) {
    blockers.push(`accepted review ${record.id} predates its approval pack`);
  }
  for (const ref of record.evidenceRefs) {
    if (!pathExistsSyncCandidate(vaultRoot, project, ref)) blockers.push(`missing review evidence: ${ref}`);
  }
  return blockers;
}

function targetStatus(
  records: LiveAdapterApprovalReview[],
  accepted: LiveAdapterApprovalReview[],
  currentAccepted: LiveAdapterApprovalReview[],
  blockers: string[]
): LiveAdapterApprovalReviewAudit["targets"][number]["status"] {
  if (currentAccepted.length > 0) return "current_accepted";
  if (accepted.length > 0 && blockers.some((blocker) => blocker.startsWith("accepted review ") || blocker.startsWith("missing review evidence:"))) return "stale";
  const latest = records.at(-1);
  if (latest?.status === "rejected") return "rejected";
  if (latest?.status === "needs_changes") return "needs_changes";
  return "missing_review";
}

function staleAcceptedCount(blockers: string[]): number {
  return blockers.filter((blocker) => blocker.includes("predates its approval pack")).length;
}

function pathExistsSyncCandidate(vaultRoot: string, project: string, ref: string): boolean {
  const candidates = [resolveProjectPath(vaultRoot, project, ref), path.resolve(ref), path.join(vaultRoot, ref)];
  return candidates.some((candidate) => {
    try {
      accessSync(candidate);
      return true;
    } catch {
      return false;
    }
  });
}

function resolveProjectPath(vaultRoot: string, project: string, ref: string): string {
  return path.isAbsolute(ref) ? ref : path.join(projectDir(vaultRoot, project), ref);
}

function vaultRelative(vaultRoot: string, absolutePath: string): string {
  return path.relative(vaultRoot, absolutePath).split(path.sep).join("/");
}

function isLiveAdapterApprovalPack(value: unknown): value is LiveAdapterApprovalPack {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    typeof value.project === "string" &&
    typeof value.generatedAt === "string" &&
    Array.isArray(value.packets) &&
    value.packets.every((packet) => isRecord(packet) && isLiveAdapterTarget(packet.target))
  );
}

function isLiveAdapterApprovalReview(value: unknown): value is LiveAdapterApprovalReview {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    typeof value.id === "string" &&
    value.id.startsWith("approval-review-") &&
    typeof value.project === "string" &&
    typeof value.recordedAt === "string" &&
    isLiveAdapterTarget(value.target) &&
    (value.status === "accepted" || value.status === "needs_changes" || value.status === "rejected") &&
    typeof value.reviewedBy === "string" &&
    typeof value.packetRef === "string" &&
    typeof value.packetGeneratedAt === "string" &&
    Array.isArray(value.evidenceRefs) &&
    value.evidenceRefs.every((item) => typeof item === "string") &&
    value.mutationApproved === false
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function renderAudit(audit: LiveAdapterApprovalReviewAudit): string {
  return [
    "# Live Adapter Approval Review Audit",
    "",
    `Project: ${audit.project}`,
    `Status: ${audit.status}`,
    `Generated: ${audit.generatedAt}`,
    `Approval pack: ${audit.approvalPackRef}`,
    "",
    "## Summary",
    "",
    `- Targets: ${audit.summary.targets}`,
    `- Packet targets: ${audit.summary.packetTargets}`,
    `- Review records: ${audit.summary.reviewRecords}`,
    `- Current accepted reviews: ${audit.summary.currentAcceptedReviews}`,
    `- Stale accepted reviews: ${audit.summary.staleAcceptedReviews}`,
    `- Invalid records: ${audit.summary.invalidRecords}`,
    `- Missing evidence refs: ${audit.summary.missingEvidenceRefs}`,
    "",
    "## Targets",
    "",
    "| Target | Status | Packet | Reviews | Accepted | Current | Blockers |",
    "| --- | --- | --- | ---: | ---: | ---: | --- |",
    ...audit.targets.map(
      (target) =>
        `| ${target.target} | ${target.status} | ${target.packetPresent ? "yes" : "no"} | ${target.reviewCount} | ${target.acceptedReviewCount} | ${target.currentAcceptedReviewCount} | ${inlineList(target.blockers)} |`
    ),
    "",
    "## Invalid Records",
    "",
    ...list(audit.invalidRecords.map((record) => `${record.path}: ${record.reason}`)),
    ""
  ].join("\n");
}

function inlineList(items: string[]): string {
  return items.length === 0 ? "none" : items.join("<br>");
}

function list(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}
