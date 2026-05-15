import fs from "node:fs/promises";
import path from "node:path";
import { recordCheck, recordReview } from "./controlPlane.js";

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
      status: conclusion === "success" || conclusion === "passed" ? "passed" : conclusion === "failure" ? "failed" : "skipped",
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
  const lower = text.toLowerCase();
  const status = lower.includes("changes requested")
    ? "changes_requested"
    : lower.includes("approved") || lower.includes("no issues")
      ? "approved"
      : "pending";

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
