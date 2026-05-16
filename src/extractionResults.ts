import fs from "node:fs/promises";
import path from "node:path";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { slugifyProject } from "./paths.js";
import type { ExtractionResultRecord, IngestRecord } from "./types.js";
import { loadRecords, updateIngestRecord } from "./vault.js";

export async function importExtractionResult(input: {
  project: string;
  vaultRoot: string;
  recordId: string;
  sourcePath: string;
  extractionKind: ExtractionResultRecord["extractionKind"];
  tool: string;
  confidence?: number;
  notes?: string;
}): Promise<{ jsonPath: string; markdownPath: string; result: ExtractionResultRecord; updatedRecord: IngestRecord }> {
  const project = slugifyProject(input.project);
  const sourcePath = path.resolve(input.sourcePath);
  const text = await fs.readFile(sourcePath, "utf8");
  const record = findRecord(await loadRecords(input.vaultRoot, project), input.recordId);
  const recordDir = path.dirname(record.storedPath);
  const importedAt = new Date();
  const id = `extraction-${timestampFile(importedAt)}`;
  const extractedTextPath = path.join(recordDir, `extracted-${id}.md`);
  await fs.writeFile(extractedTextPath, renderExtractedText({ record, sourcePath, text, id, input }));
  const result: ExtractionResultRecord = {
    schemaVersion: 1,
    id,
    project,
    sourceRecordId: record.id,
    importedAt: importedAt.toISOString(),
    extractionKind: input.extractionKind,
    tool: input.tool,
    confidence: input.confidence,
    sourcePath: `<EXTERNAL_SOURCE>/${path.basename(sourcePath)}`,
    extractedTextPath: path.relative(input.vaultRoot, extractedTextPath),
    notes: input.notes
  };
  const updatedRecord: IngestRecord = {
    ...record,
    extractedTextPath,
    extractionResultPaths: [...(record.extractionResultPaths ?? []), extractedTextPath],
    notes: mergeNotes(record.notes, `Extraction ${result.id} imported via ${input.tool}.`)
  };
  await updateIngestRecord(input.vaultRoot, project, updatedRecord);
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "extractions", `${result.id}.json`, result);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "extractions", `${result.id}.md`, renderResult(result));
  return { jsonPath, markdownPath, result, updatedRecord };
}

function findRecord(records: IngestRecord[], id: string): IngestRecord {
  const record = records.find((item) => item.id === id);
  if (!record) throw new Error(`No ingest record found for ${id}.`);
  return record;
}

function renderExtractedText(input: {
  record: IngestRecord;
  sourcePath: string;
  text: string;
  id: string;
  input: {
    extractionKind: ExtractionResultRecord["extractionKind"];
    tool: string;
    confidence?: number;
    notes?: string;
  };
}): string {
  return [
    "# Extracted Text",
    "",
    `Extraction id: ${input.id}`,
    `Source record: ${input.record.id}`,
    `Raw evidence: ${input.record.storedPath}`,
    `Extraction source: ${input.sourcePath}`,
    `Extraction kind: ${input.input.extractionKind}`,
    `Tool: ${input.input.tool}`,
    input.input.confidence === undefined ? undefined : `Confidence: ${input.input.confidence}`,
    input.input.notes ? `Notes: ${input.input.notes}` : undefined,
    "",
    input.text.trim(),
    ""
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
}

function renderResult(result: ExtractionResultRecord): string {
  return [
    "# Extraction Result",
    "",
    `Id: ${result.id}`,
    `Source record: ${result.sourceRecordId}`,
    `Kind: ${result.extractionKind}`,
    `Tool: ${result.tool}`,
    `Imported: ${result.importedAt}`,
    result.confidence === undefined ? undefined : `Confidence: ${result.confidence}`,
    `External source: ${result.sourcePath}`,
    `Extracted text: ${result.extractedTextPath}`,
    result.notes ? `Notes: ${result.notes}` : undefined,
    ""
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
}

function mergeNotes(existing: string | undefined, next: string): string {
  return existing ? `${existing} ${next}` : next;
}
