import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { slugifyProject } from "./paths.js";
import type { PlaywrightEvidenceRecord } from "./types.js";

export async function recordPlaywrightEvidence(input: {
  project: string;
  vaultRoot: string;
  targetUrl: string;
  status: PlaywrightEvidenceRecord["status"];
  tracePath?: string;
  screenshotPath?: string;
  notes?: string;
}): Promise<{ jsonPath: string; markdownPath: string; record: PlaywrightEvidenceRecord }> {
  const project = slugifyProject(input.project);
  const record: PlaywrightEvidenceRecord = {
    schemaVersion: 1,
    id: `playwright-${timestampFile()}`,
    project,
    recordedAt: new Date().toISOString(),
    targetUrl: input.targetUrl,
    status: input.status,
    tracePath: input.tracePath,
    screenshotPath: input.screenshotPath,
    notes: input.notes
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "verification", `${record.id}.json`, record);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "verification", `${record.id}.md`, renderEvidence(record));
  return { jsonPath, markdownPath, record };
}

function renderEvidence(record: PlaywrightEvidenceRecord): string {
  return [
    `# Playwright Evidence: ${record.id}`,
    "",
    `Status: ${record.status}`,
    `Target URL: ${record.targetUrl}`,
    record.tracePath ? `Trace: ${record.tracePath}` : "Trace: none",
    record.screenshotPath ? `Screenshot: ${record.screenshotPath}` : "Screenshot: none",
    "",
    record.notes ?? "No notes.",
    ""
  ].join("\n");
}
