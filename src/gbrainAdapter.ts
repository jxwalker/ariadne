import fs from "node:fs/promises";
import path from "node:path";
import { readJsonArtifact, timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { projectDir, slugifyProject } from "./paths.js";
import { loadRecords } from "./vault.js";
import type {
  DecisionRecord,
  EvaluationRun,
  GbrainExportBundle,
  GbrainReportImport,
  GsdRoadmap,
  InfraRegistry,
  PrdDocument
} from "./types.js";

export async function exportGbrainBundle(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; bundle: GbrainExportBundle }> {
  const project = slugifyProject(input.project);
  const dir = projectDir(input.vaultRoot, project);
  const records = await loadRecords(input.vaultRoot, project);
  const prd = await optionalJson<PrdDocument>(() => readJsonArtifact(input.vaultRoot, project, "requirements", "prd.json"));
  const roadmap = await optionalJson<GsdRoadmap>(() => readJsonArtifact(input.vaultRoot, project, "gsd", "roadmap.json"));
  const registry = await optionalJson<InfraRegistry>(() => readJsonArtifact(input.vaultRoot, project, "infrastructure", "registry.json"));
  const decisions = await readJsonFiles<DecisionRecord>(path.join(dir, "decisions"), isDecisionRecord);
  const evaluations = await readJsonFiles<EvaluationRun>(path.join(dir, "evaluation"), isEvaluationRun);

  const documents: GbrainExportBundle["documents"] = [
    ...records.map((record) => ({
      slug: `source/${record.id}`,
      title: record.fileName,
      kind: "source" as const,
      content: [
        `Source kind: ${record.kind}`,
        `Sensitivity: ${record.sensitivity}`,
        `SHA-256: ${record.sha256}`,
        `Notes: ${record.notes ?? "none"}`
      ].join("\n"),
      evidenceRefs: [record.storedPath, record.extractedTextPath, record.handoffPath]
        .filter((item): item is string => Boolean(item))
        .map((item) => portablePath(input.vaultRoot, item)),
      tags: ["ariadne", "source", record.kind]
    })),
    ...(prd?.requirements.map((requirement) => ({
      slug: `requirement/${requirement.id.toLowerCase()}`,
      title: requirement.title,
      kind: "requirement" as const,
      content: [requirement.description, "", ...requirement.acceptance.map((item) => `- ${item}`)].join("\n"),
      evidenceRefs: requirement.sourceRefs,
      tags: ["ariadne", "requirement", requirement.priority, requirement.status]
    })) ?? []),
    ...(roadmap?.milestones.flatMap((milestone) =>
      milestone.tasks.map((task) => ({
        slug: `task/${task.id.toLowerCase()}`,
        title: task.title,
        kind: "task" as const,
        content: [
          `Milestone: ${milestone.title}`,
          `Slice: ${task.slice}`,
          "",
          "Success criteria:",
          ...task.successCriteria.map((item) => `- ${item}`),
          "",
          "Verification:",
          ...task.verificationCommands.map((item) => `- ${item}`)
        ].join("\n"),
        evidenceRefs: task.requirementIds,
        tags: ["ariadne", "task", milestone.id]
      }))
    ) ?? []),
    ...decisions.map((decision) => ({
      slug: `decision/${decision.id}`,
      title: decision.title,
      kind: "decision" as const,
      content: [decision.context, "", decision.decision, "", ...decision.consequences.map((item) => `- ${item}`)].join("\n"),
      evidenceRefs: decision.sourceRefs,
      tags: ["ariadne", "decision", decision.status]
    })),
    ...evaluations.map((run) => ({
      slug: `evaluation/${run.id}`,
      title: `Evaluation ${run.overallScore}`,
      kind: "evaluation" as const,
      content: [
        `Target: ${run.target}`,
        `Operator: ${run.operator}`,
        `Overall score: ${run.overallScore}`,
        "",
        ...run.dimensionScores.map((score) => `- ${score.id}: ${score.score} (${score.notes})`)
      ].join("\n"),
      evidenceRefs: run.evidenceRefs,
      tags: ["ariadne", "evaluation", run.target]
    })),
    ...(registry
      ? [
          {
            slug: "infrastructure/registry",
            title: "Infrastructure Registry",
            kind: "infrastructure" as const,
            content: [
              ...registry.hosts.map((host) => `${host.id}: ${host.label} / ${host.role} / ${host.notes}`),
              ...registry.modelEndpoints.map((endpoint) => `${endpoint.id}: ${endpoint.kind} / ${endpoint.status}`),
              ...registry.runnerPools.map((runner) => `${runner.id}: ${runner.scope} / ${runner.trustBoundary}`)
            ].join("\n"),
            evidenceRefs: ["infrastructure/registry.json"],
            tags: ["ariadne", "infrastructure"]
          }
        ]
      : [])
  ];

  const bundle: GbrainExportBundle = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    source: "ariadne",
    mode: "read_only_export",
    instructions: [
      "Import this bundle into GBrain as derived memory, not as Ariadne's source of truth.",
      "Preserve evidenceRefs when returning search or query results.",
      "Do not write back to Ariadne without an explicit Ariadne import command."
    ],
    documents
  };

  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "integrations/gbrain", "gbrain-export.json", bundle);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "integrations/gbrain",
    "gbrain-export.md",
    renderBundle(bundle)
  );
  return { jsonPath, markdownPath, bundle };
}

export async function importGbrainReport(input: {
  project: string;
  vaultRoot: string;
  sourcePath: string;
}): Promise<{ jsonPath: string; markdownPath: string; report: GbrainReportImport }> {
  const project = slugifyProject(input.project);
  const sourcePath = path.resolve(input.sourcePath);
  const raw = JSON.parse(await fs.readFile(sourcePath, "utf8")) as Record<string, unknown>;
  const importedAt = new Date();
  const report: GbrainReportImport = {
    schemaVersion: 1,
    project,
    importedAt: importedAt.toISOString(),
    sourcePath,
    query: stringField(raw, ["query", "question", "prompt"], "unknown query"),
    mode: stringField(raw, ["mode", "searchMode", "search_mode"], "unknown"),
    resultCount: arrayField(raw, ["results", "matches", "documents"]).length,
    metrics: numericRecord(raw.metrics),
    results: arrayField(raw, ["results", "matches", "documents"]).map(normaliseResult),
    notes: stringList(raw.notes)
  };

  const name = `gbrain-report-${timestampFile(importedAt)}`;
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "integrations/gbrain", `${name}.json`, report);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "integrations/gbrain", `${name}.md`, renderReport(report));
  return { jsonPath, markdownPath, report };
}

async function optionalJson<T>(reader: () => Promise<T>): Promise<T | undefined> {
  try {
    return await reader();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function readJsonFiles<T>(dir: string, predicate: (value: unknown) => value is T): Promise<T[]> {
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const values: T[] = [];
  for (const name of names.filter((item) => item.endsWith(".json")).sort()) {
    const value = JSON.parse(await fs.readFile(path.join(dir, name), "utf8")) as unknown;
    if (predicate(value)) values.push(value);
  }
  return values;
}

function hasSchema(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDecisionRecord(value: unknown): value is DecisionRecord {
  return hasSchema(value) && value.schemaVersion === 1 && "decision" in value;
}

function isEvaluationRun(value: unknown): value is EvaluationRun {
  return hasSchema(value) && value.schemaVersion === 1 && typeof value.overallScore === "number";
}

function stringField(raw: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

function arrayField(raw: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = raw[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function numericRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => typeof item === "number" && Number.isFinite(item))
      .map(([key, item]) => [key, item as number])
  );
}

function normaliseResult(value: unknown): GbrainReportImport["results"][number] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { title: String(value) };
  }
  const raw = value as Record<string, unknown>;
  return {
    title: stringField(raw, ["title", "name", "slug"], "untitled"),
    slug: typeof raw.slug === "string" ? raw.slug : undefined,
    score: typeof raw.score === "number" ? raw.score : undefined,
    source: typeof raw.source === "string" ? raw.source : undefined,
    excerpt: stringField(raw, ["excerpt", "snippet", "content"], "")
  };
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function renderBundle(bundle: GbrainExportBundle): string {
  return [
    "# GBrain Export",
    "",
    `Project: ${bundle.project}`,
    `Mode: ${bundle.mode}`,
    `Generated: ${bundle.generatedAt}`,
    `Documents: ${bundle.documents.length}`,
    "",
    "## Instructions",
    "",
    ...bundle.instructions.map((item) => `- ${item}`),
    "",
    "## Documents",
    "",
    "| Slug | Kind | Evidence refs |",
    "| --- | --- | --- |",
    ...bundle.documents.map((doc) => `| ${doc.slug} | ${doc.kind} | ${doc.evidenceRefs.length} |`),
    ""
  ].join("\n");
}

function renderReport(report: GbrainReportImport): string {
  return [
    "# GBrain Report Import",
    "",
    `Project: ${report.project}`,
    `Imported: ${report.importedAt}`,
    `Query: ${report.query}`,
    `Mode: ${report.mode}`,
    `Results: ${report.resultCount}`,
    "",
    "## Results",
    "",
    report.results.length === 0
      ? "- No results recorded."
      : report.results.map((result) => `- ${result.title}${result.score !== undefined ? ` (${result.score})` : ""}`).join("\n"),
    ""
  ].join("\n");
}

function portablePath(vaultRoot: string, filePath: string): string {
  const workspaceRoot = path.dirname(vaultRoot);
  return filePath.split(vaultRoot).join("<VAULT_ROOT>").split(workspaceRoot).join("<WORKSPACE_ROOT>");
}
