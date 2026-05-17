import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { writeJsonArtifact, writeTextArtifact } from "../src/artifacts.js";
import { importExtractionResult } from "../src/extractionResults.js";
import { planExtractionRunner } from "../src/extractionRunnerPlan.js";
import { assembleDossier, ingestFiles, loadRecords, projectStatus } from "../src/vault.js";

describe("source intake", () => {
  it("replaces generated artifacts atomically without temp-file leftovers", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-artifacts-"));
    const vaultRoot = path.join(temp, "vault");

    const writes = Array.from({ length: 20 }, (_item, index) =>
      writeJsonArtifact(vaultRoot, "ariadne", "control", "atomic.json", { schemaVersion: 1, index })
    );
    const paths = await Promise.all(writes);
    expect(new Set(paths).size).toBe(1);

    const finalText = await fs.readFile(paths[0]!, "utf8");
    const parsed = JSON.parse(finalText) as { schemaVersion: number; index: number };
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.index).toBeGreaterThanOrEqual(0);
    expect(parsed.index).toBeLessThan(20);

    const controlDir = path.dirname(paths[0]!);
    const leftovers = (await fs.readdir(controlDir)).filter((name) => name.endsWith(".tmp"));
    expect(leftovers).toEqual([]);

    const markdownPath = await writeTextArtifact(vaultRoot, "ariadne", "control", "atomic.md", "done");
    await expect(fs.readFile(markdownPath, "utf8")).resolves.toBe("done\n");
  });

  it("preserves a raw source, extracts text, and assembles a dossier", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-"));
    const source = path.join(temp, "note.md");
    const vaultRoot = path.join(temp, "vault");

    await fs.writeFile(source, "# Note\n\nRun unit tests and Playwright UI tests before completion.\n");

    const records = await ingestFiles([source], {
      project: "Ariadne",
      vaultRoot,
      notes: "test fixture"
    });

    expect(records).toHaveLength(1);
    expect(records[0]?.kind).toBe("markdown");
    expect(records[0]?.storedPath).toBeTruthy();
    expect(records[0]?.extractedTextPath).toBeTruthy();

    const stored = await fs.readFile(records[0]!.storedPath, "utf8");
    expect(stored).toContain("Playwright UI tests");

    const dossier = await assembleDossier({
      project: "ariadne",
      vaultRoot,
      maxCharsPerSource: 2000
    });
    const dossierText = await fs.readFile(dossier, "utf8");
    expect(dossierText).toContain("Context Dossier: ariadne");
    expect(dossierText).toContain("Playwright UI tests");

    const status = await projectStatus(vaultRoot, "ariadne");
    expect(status.records).toBe(1);
    expect(status.extracted).toBe(1);
  });

  it("creates handoff instructions for image sources", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-"));
    const source = path.join(temp, "sketch.png");
    const vaultRoot = path.join(temp, "vault");

    await fs.writeFile(source, "not a real png, but enough for source-kind routing");

    const records = await ingestFiles([source], {
      project: "Ariadne",
      vaultRoot,
      sensitivity: "confidential"
    });

    expect(records[0]?.kind).toBe("image");
    expect(records[0]?.handoffPath).toBeTruthy();
    expect(records[0]?.sensitivity).toBe("confidential");

    const handoff = await fs.readFile(records[0]!.handoffPath!, "utf8");
    expect(handoff).toContain("Run OCR or visual description");
    expect(handoff).toContain("Do not replace the raw evidence");
  });

  it("plans an explicit extraction runner for source handoffs", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-"));
    const source = path.join(temp, "meeting-audio.wav");
    const vaultRoot = path.join(temp, "vault");

    await fs.writeFile(source, "not a real wav, but enough for source-kind routing");
    const records = await ingestFiles([source], {
      project: "Ariadne",
      vaultRoot
    });

    const planned = await planExtractionRunner({
      project: "ariadne",
      vaultRoot,
      recordId: records[0]!.id,
      tool: "whisper.cpp",
      host: "M5 Max",
      runner: "mac",
      notes: "Operator selected local Mac transcription."
    });

    expect(planned.plan.extractionKind).toBe("transcription");
    expect(planned.plan.host).toBe("M5 Max");
    expect(planned.plan.runner).toBe("mac");
    expect(planned.plan.inputPath).toBe(records[0]?.storedPath);
    expect(planned.plan.handoffPath).toBe(records[0]?.handoffPath);
    expect(planned.plan.importCommand).toContain("extraction-import");
    expect(planned.plan.importCommand).toContain("--vault");
    expect(planned.plan.importCommand).toContain("--kind transcription");
    await expect(fs.readFile(planned.markdownPath, "utf8")).resolves.toContain("Extraction Runner Plan");
  });

  it("imports OCR or transcription output back onto the source record", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-"));
    const source = path.join(temp, "whiteboard.png");
    const extracted = path.join(temp, "whiteboard-extraction.md");
    const vaultRoot = path.join(temp, "vault");

    await fs.writeFile(source, "not a real png, but enough for source-kind routing");
    await fs.writeFile(extracted, "Thread diagram: intake, memory, execution, Playwright evidence.");

    const records = await ingestFiles([source], {
      project: "Ariadne",
      vaultRoot
    });
    expect(records[0]?.extractedTextPath).toBeUndefined();

    const result = await importExtractionResult({
      project: "ariadne",
      vaultRoot,
      recordId: records[0]!.id,
      sourcePath: extracted,
      extractionKind: "visual-description",
      tool: "manual-review",
      confidence: 0.92,
      notes: "Operator-checked drawing description."
    });

    expect(result.result.extractionKind).toBe("visual-description");
    expect(result.result.sourceRecordId).toBe(records[0]!.id);
    expect(result.result.extractedTextPath).toContain("raw/");

    const updatedRecords = await loadRecords(vaultRoot, "ariadne");
    expect(updatedRecords[0]?.extractedTextPath).toBeTruthy();
    expect(updatedRecords[0]?.extractionResultPaths).toHaveLength(1);
    expect(updatedRecords[0]?.notes).toContain("manual-review");

    const storedExtraction = await fs.readFile(updatedRecords[0]!.extractedTextPath!, "utf8");
    expect(storedExtraction).toContain("Thread diagram");
    expect(storedExtraction).toContain("Tool: manual-review");
    expect(storedExtraction).toContain(`Extraction id: ${result.result.id}`);

    const dossier = await assembleDossier({
      project: "ariadne",
      vaultRoot,
      maxCharsPerSource: 2000
    });
    const dossierText = await fs.readFile(dossier, "utf8");
    expect(dossierText).toContain("Thread diagram");

    const status = await projectStatus(vaultRoot, "ariadne");
    expect(status.extracted).toBe(1);
  });

  it("keeps multiple imported extraction outputs for the same source record", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-"));
    const source = path.join(temp, "meeting-audio.wav");
    const first = path.join(temp, "first-transcript.md");
    const second = path.join(temp, "second-transcript.md");
    const vaultRoot = path.join(temp, "vault");

    await fs.writeFile(source, "not a real wav, but enough for source-kind routing");
    await fs.writeFile(first, "First transcript pass.");
    await fs.writeFile(second, "Corrected transcript pass.");

    const records = await ingestFiles([source], {
      project: "Ariadne",
      vaultRoot
    });

    const firstImport = await importExtractionResult({
      project: "ariadne",
      vaultRoot,
      recordId: records[0]!.id,
      sourcePath: first,
      extractionKind: "transcription",
      tool: "whisper"
    });
    await new Promise((resolve) => setTimeout(resolve, 2));
    const secondImport = await importExtractionResult({
      project: "ariadne",
      vaultRoot,
      recordId: records[0]!.id,
      sourcePath: second,
      extractionKind: "transcription",
      tool: "whisper-review"
    });

    expect(firstImport.result.extractedTextPath).not.toBe(secondImport.result.extractedTextPath);

    const updatedRecords = await loadRecords(vaultRoot, "ariadne");
    expect(updatedRecords[0]?.extractionResultPaths).toHaveLength(2);
    expect(updatedRecords[0]?.extractedTextPath).toBe(updatedRecords[0]?.extractionResultPaths?.[1]);

    await expect(fs.readFile(updatedRecords[0]!.extractionResultPaths![0]!, "utf8")).resolves.toContain(
      "First transcript pass."
    );
    await expect(fs.readFile(updatedRecords[0]!.extractionResultPaths![1]!, "utf8")).resolves.toContain(
      "Corrected transcript pass."
    );
  });
});
