import path from "node:path";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { slugifyProject } from "./paths.js";
import { loadRecords } from "./vault.js";
import type { ExtractionResultRecord, ExtractionRunnerPlan, SourceKind } from "./types.js";

export async function planExtractionRunner(input: {
  project: string;
  vaultRoot: string;
  recordId: string;
  tool: string;
  host: string;
  runner: ExtractionRunnerPlan["runner"];
  extractionKind?: ExtractionResultRecord["extractionKind"];
  notes?: string;
}): Promise<{ jsonPath: string; markdownPath: string; plan: ExtractionRunnerPlan }> {
  const project = slugifyProject(input.project);
  const records = await loadRecords(input.vaultRoot, project);
  const record = records.find((item) => item.id === input.recordId);
  if (!record) {
    throw new Error(`No source record found for ${input.recordId}.`);
  }
  if (!record.handoffPath) {
    throw new Error(`Source record ${record.id} has no extraction handoff.`);
  }

  const extractionKind = input.extractionKind ?? defaultExtractionKind(record.kind);
  validateExtractionKind(record.kind, extractionKind);
  const generatedAt = new Date();
  const id = `extraction-plan-${timestampFile(generatedAt)}`;
  const outputPath = path.join(path.dirname(record.handoffPath), `planned-${id}.md`);
  const plan: ExtractionRunnerPlan = {
    schemaVersion: 1,
    id,
    project,
    generatedAt: generatedAt.toISOString(),
    sourceRecordId: record.id,
    sourceKind: record.kind,
    extractionKind,
    tool: input.tool,
    host: input.host,
    runner: input.runner,
    status: "planned",
    inputPath: record.storedPath,
    handoffPath: record.handoffPath,
    outputPath,
    importCommand: [
      "npm run ariadne -- extraction-import",
      `--vault ${shellArg(input.vaultRoot)}`,
      `--project ${shellArg(project)}`,
      `--record ${shellArg(record.id)}`,
      `--from ${shellArg(outputPath)}`,
      `--kind ${shellArg(extractionKind)}`,
      `--tool ${shellArg(input.tool)}`
    ].join(" "),
    constraints: constraintsFor(record.kind, input.runner),
    notes: input.notes
  };

  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "extractions/plans", `${id}.json`, plan);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "extractions/plans", `${id}.md`, renderPlan(plan));
  return { jsonPath, markdownPath, plan };
}

export function extractionRunnerOption(value: string): ExtractionRunnerPlan["runner"] {
  if (
    value === "local" ||
    value === "ssh" ||
    value === "manual" ||
    value === "mac" ||
    value === "dgx-spark" ||
    value === "proxmox" ||
    value === "generic"
  ) {
    return value;
  }
  throw new Error("--runner must be local, ssh, manual, mac, dgx-spark, proxmox, or generic.");
}

function defaultExtractionKind(kind: SourceKind): ExtractionResultRecord["extractionKind"] {
  if (kind === "audio") return "transcription";
  if (kind === "pdf") return "pdf-text";
  if (kind === "image") return "visual-description";
  throw new Error(`Source kind ${kind} does not need an extraction runner plan.`);
}

function validateExtractionKind(sourceKind: SourceKind, extractionKind: ExtractionResultRecord["extractionKind"]): void {
  const allowed: Record<SourceKind, Array<ExtractionResultRecord["extractionKind"]>> = {
    markdown: [],
    text: [],
    docx: [],
    unknown: [],
    image: ["ocr", "visual-description"],
    audio: ["transcription"],
    pdf: ["pdf-text", "ocr"]
  };
  if (!allowed[sourceKind].includes(extractionKind)) {
    throw new Error(`Extraction kind ${extractionKind} is not valid for source kind ${sourceKind}.`);
  }
}

function constraintsFor(kind: SourceKind, runner: ExtractionRunnerPlan["runner"]): string[] {
  return [
    "Preserve the raw evidence file unchanged.",
    "Review the extracted output before importing it.",
    "Mark uncertain readings explicitly.",
    kind === "audio" ? "Preserve timestamps where possible." : undefined,
    kind === "pdf" ? "Preserve page references where possible." : undefined,
    runner === "ssh" || runner === "proxmox" || runner === "dgx-spark"
      ? "Remote runner must only read the copied evidence path and write the planned output path."
      : undefined
  ].filter((value): value is string => Boolean(value));
}

function renderPlan(plan: ExtractionRunnerPlan): string {
  return [
    `# Extraction Runner Plan: ${plan.id}`,
    "",
    `Record: ${plan.sourceRecordId}`,
    `Source kind: ${plan.sourceKind}`,
    `Extraction kind: ${plan.extractionKind}`,
    `Tool: ${plan.tool}`,
    `Host: ${plan.host}`,
    `Runner: ${plan.runner}`,
    `Status: ${plan.status}`,
    "",
    "## Paths",
    "",
    `- Input: ${plan.inputPath}`,
    plan.handoffPath ? `- Handoff: ${plan.handoffPath}` : "- Handoff: none",
    `- Planned output: ${plan.outputPath}`,
    "",
    "## Import Command",
    "",
    "```bash",
    plan.importCommand,
    "```",
    "",
    "## Constraints",
    "",
    ...plan.constraints.map((constraint) => `- ${constraint}`),
    "",
    plan.notes ?? "No notes.",
    ""
  ].join("\n");
}

function shellArg(value: string): string {
  if (/^[A-Za-z0-9_./:@=-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, "'\\''")}'`;
}
