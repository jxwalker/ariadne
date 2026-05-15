import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assembleDossier, ingestFiles, projectStatus } from "../src/vault.js";

describe("source intake", () => {
  it("preserves a raw source, extracts text, and assembles a dossier", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "dev-pipeline-"));
    const source = path.join(temp, "note.md");
    const vaultRoot = path.join(temp, "vault");

    await fs.writeFile(source, "# Note\n\nRun unit tests and Playwright UI tests before completion.\n");

    const records = await ingestFiles([source], {
      project: "Agentic Coding",
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
      project: "agentic-coding",
      vaultRoot,
      maxCharsPerSource: 2000
    });
    const dossierText = await fs.readFile(dossier, "utf8");
    expect(dossierText).toContain("Context Dossier: agentic-coding");
    expect(dossierText).toContain("Playwright UI tests");

    const status = await projectStatus(vaultRoot, "agentic-coding");
    expect(status.records).toBe(1);
    expect(status.extracted).toBe(1);
  });

  it("creates handoff instructions for image sources", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "dev-pipeline-"));
    const source = path.join(temp, "sketch.png");
    const vaultRoot = path.join(temp, "vault");

    await fs.writeFile(source, "not a real png, but enough for source-kind routing");

    const records = await ingestFiles([source], {
      project: "Agentic Coding",
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
});
