import fs from "node:fs/promises";
import path from "node:path";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { slugifyProject } from "./paths.js";
import type { InfraSnapshot, OpenScorpionActivityDraft } from "./types.js";

export async function importInfraSnapshot(input: {
  project: string;
  vaultRoot: string;
  sourcePath: string;
  snapshotKind?: InfraSnapshot["snapshotKind"];
}): Promise<{ jsonPath: string; markdownPath: string; snapshot: InfraSnapshot }> {
  const project = slugifyProject(input.project);
  const sourcePath = path.resolve(input.sourcePath);
  const raw = JSON.parse(await fs.readFile(sourcePath, "utf8")) as unknown;
  const snapshot: InfraSnapshot = {
    schemaVersion: 1,
    project,
    importedAt: new Date().toISOString(),
    sourcePath,
    snapshotKind: input.snapshotKind ?? "manifest",
    summary: summariseRaw(raw),
    raw
  };
  const name = `infra-snapshot-${timestampFile()}`;
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "infrastructure", `${name}.json`, snapshot);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "infrastructure", `${name}.md`, renderSnapshot(snapshot));
  return { jsonPath, markdownPath, snapshot };
}

export async function draftOpenScorpionActivity(input: {
  project: string;
  vaultRoot: string;
  title: string;
  activityType: string;
  evidenceRefs: string[];
}): Promise<{ jsonPath: string; markdownPath: string; draft: OpenScorpionActivityDraft }> {
  const project = slugifyProject(input.project);
  const draft: OpenScorpionActivityDraft = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    title: input.title,
    activityType: input.activityType,
    evidenceRefs: input.evidenceRefs,
    payload: {
      project,
      title: input.title,
      activity_type: input.activityType,
      evidence_refs: input.evidenceRefs
    },
    submit: false
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "infrastructure", "openscorpion-activity-draft.json", draft);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "infrastructure",
    "openscorpion-activity-draft.md",
    renderActivity(draft)
  );
  return { jsonPath, markdownPath, draft };
}

function summariseRaw(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") {
    return { kind: typeof raw };
  }
  const obj = raw as Record<string, unknown>;
  return {
    keys: Object.keys(obj).sort(),
    host: nested(obj, ["host", "short_name"]) ?? obj.host ?? obj.node ?? "unknown",
    vmCount: Array.isArray(nested(obj, ["guests", "vms"])) ? (nested(obj, ["guests", "vms"]) as unknown[]).length : undefined,
    lxcCount: Array.isArray(nested(obj, ["guests", "lxc"])) ? (nested(obj, ["guests", "lxc"]) as unknown[]).length : undefined
  };
}

function nested(obj: Record<string, unknown>, pathParts: string[]): unknown {
  let current: unknown = obj;
  for (const part of pathParts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function renderSnapshot(snapshot: InfraSnapshot): string {
  return [
    `# Infrastructure Snapshot: ${snapshot.project}`,
    "",
    `Kind: ${snapshot.snapshotKind}`,
    `Imported: ${snapshot.importedAt}`,
    `Source: ${snapshot.sourcePath}`,
    "",
    "## Summary",
    "",
    "```json",
    JSON.stringify(snapshot.summary, null, 2),
    "```",
    ""
  ].join("\n");
}

function renderActivity(draft: OpenScorpionActivityDraft): string {
  return [
    `# OpenScorpion Activity Draft: ${draft.title}`,
    "",
    `Type: ${draft.activityType}`,
    "Submit: false",
    "",
    "## Evidence",
    "",
    ...draft.evidenceRefs.map((ref) => `- ${ref}`),
    ""
  ].join("\n");
}
