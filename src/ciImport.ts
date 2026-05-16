import fs from "node:fs/promises";
import path from "node:path";
import { recordCheck, recordReview } from "./controlPlane.js";
import type { CheckRecord, ReviewRecord } from "./types.js";

export async function importCiStatus(input: {
  project: string;
  vaultRoot: string;
  sourcePath: string;
}): Promise<number> {
  const raw = JSON.parse(await fs.readFile(path.resolve(input.sourcePath), "utf8")) as unknown;
  const entries = Array.isArray(raw) ? raw : [raw];
  let count = 0;

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const obj = entry as Record<string, unknown>;
    const name = String(obj.name ?? obj.context ?? obj.workflowName ?? `ci-${count + 1}`);
    const conclusion = String(obj.conclusion ?? obj.status ?? "skipped").toLowerCase();
    await recordCheck({
      project: input.project,
      vaultRoot: input.vaultRoot,
      name,
      command: String(obj.command ?? "imported-ci-status"),
      status: ciStatus(conclusion),
      evidence: input.sourcePath
    });
    count += 1;
  }

  return count;
}

export async function importCodeRabbitReview(input: {
  project: string;
  vaultRoot: string;
  sourcePath: string;
}): Promise<void> {
  const text = await fs.readFile(path.resolve(input.sourcePath), "utf8");
  const status = reviewStatus(text);

  await recordReview({
    project: input.project,
    vaultRoot: input.vaultRoot,
    source: "coderabbit",
    status,
    summary: firstLine(text) ?? "Imported CodeRabbit review",
    evidence: input.sourcePath
  });
}

function firstLine(text: string): string | undefined {
  return text
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
}

function ciStatus(conclusion: string): CheckRecord["status"] {
  const passingTokens = new Set(["success", "passed"]);
  const failingTokens = new Set(["failure", "failed", "error", "timed_out"]);

  if (passingTokens.has(conclusion)) return "passed";
  if (failingTokens.has(conclusion)) return "failed";
  return "skipped";
}

function reviewStatus(text: string): ReviewRecord["status"] {
  const lower = text.toLowerCase();

  if (/\bchanges?\s+requested\b/.test(lower)) return "changes_requested";
  if (/\bno\s+issues?\b/.test(lower)) return "approved";

  const approvalPattern = /\b(?:review\s+)?approved\b|\blooks\s+good\s+to\s+me\b|\blgtm\b/;
  const negatedApprovalPattern =
    /\b(?:not|never)\s+approved\b|\bnot\s+approve(?:d)?\b|\bdo\s+not\s+approve\b|\bcannot\s+approve\b|\bcan'?t\s+approve\b|\bhave\s+not\s+approved\b/;

  return approvalPattern.test(lower) && !negatedApprovalPattern.test(lower) ? "approved" : "pending";
}
