import fs from "node:fs/promises";
import path from "node:path";
import { extractText, normaliseExtractedText, sourceKind } from "./extract.js";
import { sha256File } from "./hash.js";
import { projectDir, safeFileName, slugifyProject } from "./paths.js";
import { scanTextForSecrets, shouldBlockHygiene } from "./sourceHygiene.js";
import type { DossierOptions, IngestOptions, IngestRecord, ProjectStatus, SourceKind } from "./types.js";

function timestampId(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

async function ensureProjectDirs(root: string, project: string): Promise<string> {
  const dir = projectDir(root, project);
  await fs.mkdir(path.join(dir, "raw"), { recursive: true });
  await fs.mkdir(path.join(dir, "context"), { recursive: true });
  return dir;
}

async function appendManifest(projectDirectory: string, record: IngestRecord): Promise<void> {
  await fs.appendFile(path.join(projectDirectory, "manifest.jsonl"), `${JSON.stringify(record)}\n`);
}

export async function updateIngestRecord(vaultRoot: string, projectInput: string, record: IngestRecord): Promise<void> {
  const project = slugifyProject(projectInput);
  const dir = projectDir(vaultRoot, project);
  const records = await loadRecords(vaultRoot, project);
  const index = records.findIndex((item) => item.id === record.id);
  if (index === -1) {
    throw new Error(`Cannot update missing ingest record ${record.id}.`);
  }
  records[index] = record;
  await fs.writeFile(path.join(dir, "manifest.jsonl"), records.map((item) => JSON.stringify(item)).join("\n") + "\n");
  await fs.writeFile(path.join(path.dirname(record.storedPath), "metadata.json"), `${JSON.stringify(record, null, 2)}\n`);
  await writeHotIndex(vaultRoot, project);
}

export async function loadRecords(vaultRoot: string, project: string): Promise<IngestRecord[]> {
  const dir = projectDir(vaultRoot, project);
  const manifestPath = path.join(dir, "manifest.jsonl");

  try {
    const content = await fs.readFile(manifestPath, "utf8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parsed = JSON.parse(line) as Partial<IngestRecord>;
        return {
          ...parsed,
          sensitivity: parsed.sensitivity ?? "internal"
        } as IngestRecord;
      });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function writeHotIndex(vaultRoot: string, project: string): Promise<string> {
  const records = await loadRecords(vaultRoot, project);
  const dir = projectDir(vaultRoot, project);
  const latest = records.slice(-10).reverse();
  const evidenceLines =
    latest.length === 0
      ? ["- No source artifacts ingested yet."]
      : latest.map(
          (record) =>
            `- ${record.fileName} (${record.kind}, ${record.sha256.slice(0, 12)}, ${record.ingestedAt})`
        );

  const lines = [
    `# Hot Index: ${slugifyProject(project)}`,
    "",
    "## Current Evidence",
    "",
    ...evidenceLines,
    "",
    "## Commands",
    "",
    "```bash",
    `npm run ariadne -- status --project ${slugifyProject(project)}`,
    `npm run ariadne -- assemble --project ${slugifyProject(project)}`,
    "```",
    ""
  ];

  const hotIndexPath = path.join(dir, "HOT_INDEX.md");
  await fs.writeFile(hotIndexPath, lines.join("\n"));
  return hotIndexPath;
}

export async function ingestFiles(files: string[], options: IngestOptions): Promise<IngestRecord[]> {
  if (files.length === 0) {
    throw new Error("At least one source file is required.");
  }

  const project = slugifyProject(options.project);
  const dir = await ensureProjectDirs(options.vaultRoot, project);
  const records: IngestRecord[] = [];

  for (const file of files) {
    const sourcePath = path.resolve(file);
    const stat = await fs.stat(sourcePath);

    if (!stat.isFile()) {
      throw new Error(`Source is not a file: ${sourcePath}`);
    }

    const sha256 = await sha256File(sourcePath);
    const ingestedAt = new Date().toISOString();
    const id = `${timestampId(new Date(ingestedAt))}-${sha256.slice(0, 12)}`;
    const recordDir = path.join(dir, "raw", id);
    const fileName = safeFileName(path.basename(sourcePath));
    const storedPath = path.join(recordDir, fileName);
    const kind = sourceKind(sourcePath);
    const extracted = await extractText(sourcePath);
    const scanText = extracted ?? (kind === "unknown" ? await tryReadUtf8(sourcePath) : undefined);
    const hygieneReport = scanText !== undefined ? scanTextForSecrets(sourcePath, scanText) : undefined;

    if (hygieneReport !== undefined && shouldBlockHygiene(hygieneReport) && !options.allowSecretFindings) {
      const details = hygieneReport.findings
        .filter((finding) => finding.severity === "high")
        .map((finding) => `${finding.kind} at line ${finding.line}`)
        .join(", ");
      throw new Error(
        `Source hygiene blocked ${sourcePath}: ${details}. Re-run with --allow-secret-findings only if this is intentional.`
      );
    }

    await fs.mkdir(recordDir, { recursive: true });
    await fs.copyFile(sourcePath, storedPath);

    let extractedTextPath: string | undefined;
    let handoffPath: string | undefined;
    let hygieneReportPath: string | undefined;

    if (extracted !== undefined) {
      const text = normaliseExtractedText(extracted);
      if (text.length > 0) {
        extractedTextPath = path.join(recordDir, "extracted.md");
        await fs.writeFile(
          extractedTextPath,
          [`# Extracted Text`, "", `Source: ${sourcePath}`, `SHA-256: ${sha256}`, "", text, ""].join(
            "\n"
          )
        );
      }
    }

    if (!extractedTextPath && (kind === "image" || kind === "audio" || kind === "pdf")) {
      handoffPath = path.join(recordDir, "handoff.md");
      await fs.writeFile(handoffPath, renderHandoff({ sourcePath, storedPath, kind, sha256 }));
    }

    if (hygieneReport !== undefined) {
      hygieneReportPath = path.join(recordDir, "hygiene.json");
      await fs.writeFile(hygieneReportPath, `${JSON.stringify(hygieneReport, null, 2)}\n`);
    }

    const record: IngestRecord = {
      schemaVersion: 1,
      id,
      project,
      sourcePath,
      storedPath,
      extractedTextPath,
      handoffPath,
      hygieneReportPath,
      fileName,
      kind,
      sensitivity: options.sensitivity ?? "internal",
      sha256,
      bytes: stat.size,
      ingestedAt,
      notes: options.notes
    };

    await fs.writeFile(path.join(recordDir, "metadata.json"), `${JSON.stringify(record, null, 2)}\n`);
    await appendManifest(dir, record);
    records.push(record);
  }

  await writeHotIndex(options.vaultRoot, project);
  return records;
}

function fenceText(text: string): string {
  return ["```text", text.replace(/```/g, "` ` `"), "```"].join("\n");
}

export async function assembleDossier(options: DossierOptions): Promise<string> {
  const project = slugifyProject(options.project);
  const dir = await ensureProjectDirs(options.vaultRoot, project);
  const records = await loadRecords(options.vaultRoot, project);
  const generatedAt = new Date().toISOString();
  const dossierPath = path.join(dir, "context", `dossier-${timestampId(new Date(generatedAt))}.md`);
  const sections: string[] = [];

  for (const record of records) {
    let excerpt = "No extracted text is available. Use the raw artifact as primary evidence.";

    if (record.extractedTextPath) {
      const text = await fs.readFile(record.extractedTextPath, "utf8");
      excerpt =
        text.length > options.maxCharsPerSource
          ? `${text.slice(0, options.maxCharsPerSource)}\n\n[truncated]`
          : text;
    }

    sections.push(
      [
        `## ${record.fileName}`,
        "",
        `- Record: ${record.id}`,
        `- Kind: ${record.kind}`,
        `- Raw evidence: ${record.storedPath}`,
        `- SHA-256: ${record.sha256}`,
    record.extractedTextPath ? `- Extracted text: ${record.extractedTextPath}` : "- Extracted text: none",
        record.handoffPath ? `- Handoff: ${record.handoffPath}` : "- Handoff: none",
        record.hygieneReportPath ? `- Hygiene: ${record.hygieneReportPath}` : "- Hygiene: not scanned",
        `- Sensitivity: ${record.sensitivity}`,
        "",
        fenceText(excerpt),
        ""
      ].join("\n")
    );
  }

  const body = [
    `# Context Dossier: ${project}`,
    "",
    `Generated: ${generatedAt}`,
    "",
    "## Operating Doctrine",
    "",
    "- Preserve raw evidence before summarising.",
    "- Assemble task-specific context instead of dumping the vault.",
    "- Treat NotebookLM, GSD2, Codex, Playwright, CodeRabbit, CI, Hermes, and OpenScorpion as adapters with explicit contracts.",
    "- Do not execute infrastructure or repository mutations from this dossier alone.",
    "",
    "## Source Inventory",
    "",
    records.length === 0
      ? "- No source artifacts ingested yet."
      : records
          .map(
            (record) =>
              `- ${record.fileName}: ${record.kind}, ${record.bytes} bytes, ${record.sha256.slice(0, 12)}`
          )
          .join("\n"),
    "",
    ...sections
  ].join("\n");

  await fs.writeFile(dossierPath, body);
  await writeHotIndex(options.vaultRoot, project);
  return dossierPath;
}

async function tryReadUtf8(filePath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}

function renderHandoff(input: {
  sourcePath: string;
  storedPath: string;
  kind: SourceKind;
  sha256: string;
}): string {
  const action =
    input.kind === "audio"
      ? "Transcribe this audio and preserve timestamps where possible."
      : input.kind === "image"
        ? "Run OCR or visual description, preserving layout notes and uncertain readings."
        : "Extract text from this PDF with page references and preserve the original file as primary evidence.";

  return [
    "# Extraction Handoff",
    "",
    `Kind: ${input.kind}`,
    `Source: ${input.sourcePath}`,
    `Vault evidence: ${input.storedPath}`,
    `SHA-256: ${input.sha256}`,
    "",
    "## Required Action",
    "",
    action,
    "",
    "## Rules",
    "",
    "- Do not replace the raw evidence.",
    "- Record tool, version, timestamp, and confidence.",
    "- Keep uncertain readings marked as uncertain.",
    "- Write extracted text beside this handoff as `extracted.md`.",
    ""
  ].join("\n");
}

export async function projectStatus(vaultRoot: string, project: string): Promise<ProjectStatus> {
  const records = await loadRecords(vaultRoot, project);
  const dir = projectDir(vaultRoot, project);
  const latest = records.at(-1);

  return {
    project: slugifyProject(project),
    projectDir: dir,
    records: records.length,
    extracted: records.filter((record) => record.extractedTextPath).length,
    latestIngestedAt: latest?.ingestedAt
  };
}
