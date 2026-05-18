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
  LiveAdapterOperatorEvidenceAssist,
  LiveAdapterTargetDossier,
  LiveEvidencePromotion,
  RoadmapCompletionAudit,
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
  const liveAdapterDossiers = await readOptionalJsonFiles<LiveAdapterTargetDossier>(
    path.join(dir, "control", "live-adapter-dossiers"),
    isLiveAdapterTargetDossier,
    {
      fileName: (name) => /^live-adapter-dossier-[a-z0-9-]+\.json$/.test(name),
      label: "live-adapter dossier"
    }
  );
  const operatorAssists = await readOptionalJsonFiles<LiveAdapterOperatorEvidenceAssist>(
    path.join(dir, "control"),
    isLiveAdapterOperatorEvidenceAssist,
    {
      fileName: isOperatorAssistFileName,
      label: "operator evidence assist"
    }
  );
  const promotedLiveEvidence = await readOptionalJsonFiles<LiveEvidencePromotion>(
    path.join(dir, "control", "live-evidence-promotions"),
    isLiveEvidencePromotion,
    {
      fileName: (name) => /^live-evidence-promotion-.+\.json$/.test(name),
      label: "promoted live evidence"
    }
  );
  const roadmapCompletion = await optionalJsonFile<RoadmapCompletionAudit>(
    path.join(dir, "control", "roadmap-completion-audit.json"),
    "roadmap completion audit",
    isRoadmapCompletionAudit
  );

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
        evidenceRefs: task.requirementIds.map((id) => `requirement/${id.toLowerCase()}`),
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
      : []),
    ...liveAdapterDossiers.map((dossier) => ({
      slug: `live-adapter/dossier/${dossier.target}`,
      title: `Live Adapter Dossier: ${dossier.target}`,
      kind: "live-adapter" as const,
      content: [
        `Target: ${dossier.target}`,
        `Status: ${dossier.status}`,
        `Readiness: ${dossier.readiness.status}`,
        `Blockers: ${dossier.summary.blockers}`,
        `GBrain export: ${dossier.gbrainContext.exportRef ?? "missing"}`,
        "",
        "Next actions:",
        ...dossier.nextActions.map((action) => `- ${action.status}: ${action.title} - ${action.command ?? action.rationale}`),
        "",
        "GBrain advisory queries:",
        ...dossier.gbrainContext.suggestedQueries.map((query) => `- ${query}`)
      ].join("\n"),
      evidenceRefs: [
        `control/live-adapter-dossiers/live-adapter-dossier-${dossier.target}.json`,
        ...dossier.evidenceRefs,
        dossier.gbrainContext.exportRef,
        ...dossier.gbrainContext.reportRefs
      ].filter((item): item is string => Boolean(item))
        .filter(uniqueString),
      tags: ["ariadne", "live-adapter", "dossier", dossier.target, dossier.status]
    })),
    ...operatorAssists.flatMap((assist) =>
      assist.targets.map((target) => ({
        slug: operatorAssistSlug(assist, target),
        title: operatorAssistTitle(assist, target),
        kind: "live-adapter" as const,
        content: [
          `Target: ${target.target}`,
          `Status: ${target.status}`,
          `Existing refs: ${target.existingEvidenceRefs.length}`,
          `Support files: ${target.supportFileRefs.length}`,
          `Promoted live evidence: ${target.promotedLiveEvidence.length}`,
          "",
          "Missing sections:",
          ...target.missingSections.map((section) => `- ${section}`),
          "",
          "Promoted live evidence summaries:",
          ...target.promotedLiveEvidence.flatMap((item) => [
            `- ${item.title} (${item.ref})`,
            ...item.summaryBullets.map((bullet) => `  - ${bullet}`)
          ]),
          "",
          "GBrain advisory queries:",
          ...target.gbrainQueries.map((query) => `- ${query}`)
        ].join("\n"),
        evidenceRefs: [
          operatorAssistArtifactRef(assist),
          target.assistFileRef,
          ...target.existingEvidenceRefs,
          ...target.promotedLiveEvidence.map((item) => item.ref)
        ].filter(uniqueString),
        tags: ["ariadne", "live-adapter", "operator-assist", target.target, target.status]
      }))
    ),
    ...promotedLiveEvidence.map((promotion) => ({
      slug: `live-adapter/promoted-live-evidence/${promotion.id}`,
      title: promotion.title,
      kind: "live-adapter" as const,
      content: [
        `Target: ${promotion.target}`,
        `Status: ${promotion.status}`,
        `Generated: ${promotion.generatedAt}`,
        `Sources: ${promotion.summary.sources}`,
        `Parsed sources: ${promotion.summary.parsedSources}`,
        `Redacted values: ${promotion.summary.redactedValues}`,
        "",
        "Source refs:",
        ...promotion.sources.map((source) => `- ${source.kind}: ${source.sourceRef} (${source.sourceSha256})`)
      ].join("\n"),
      evidenceRefs: [
        `control/live-evidence-promotions/${promotion.id}.json`,
        ...promotion.sources.map((source) => source.sourceRef)
      ].filter(uniqueString),
      tags: ["ariadne", "live-adapter", "promoted-live-evidence", promotion.target]
    })),
    ...(roadmapCompletion
      ? [
          {
            slug: "live-adapter/roadmap-completion",
            title: "Roadmap Completion Audit",
            kind: "live-adapter" as const,
            content: [
              `Status: ${roadmapCompletion.status}`,
              `Passed: ${roadmapCompletion.summary.passed}`,
              `Blocked: ${roadmapCompletion.summary.blocked}`,
              "",
              "Requirements:",
              ...roadmapCompletion.requirements.map((requirement) => `- ${requirement.status}: ${requirement.title} - ${requirement.detail}`)
            ].join("\n"),
            evidenceRefs: [
              "control/roadmap-completion-audit.json",
              ...roadmapCompletion.requirements.flatMap((requirement) => requirement.evidenceRefs)
            ],
            tags: ["ariadne", "live-adapter", "roadmap-completion", roadmapCompletion.status]
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
    sourcePath: portablePath(input.vaultRoot, sourcePath),
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

async function readOptionalJsonFiles<T>(
  dir: string,
  predicate: (value: unknown) => value is T,
  options: { fileName: (name: string) => boolean; label: string }
): Promise<T[]> {
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const values: T[] = [];
  for (const name of names.filter((item) => item.endsWith(".json") && options.fileName(item)).sort()) {
    const filePath = path.join(dir, name);
    if (!(await fs.stat(filePath)).isFile()) {
      console.warn(`Skipping invalid ${options.label} artifact ${filePath}: not a file`);
      continue;
    }
    const raw = await fs.readFile(filePath, "utf8");
    let value: unknown;
    try {
      value = JSON.parse(raw) as unknown;
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      console.warn(`Skipping invalid ${options.label} JSON ${filePath}: ${(error as Error).message}`);
      continue;
    }

    if (predicate(value)) {
      values.push(value);
    } else {
      console.warn(`Skipping invalid ${options.label} artifact ${filePath}: schema mismatch`);
    }
  }
  return values;
}

async function optionalJsonFile<T>(
  filePath: string,
  label: string,
  predicate: (value: unknown) => value is T
): Promise<T | undefined> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }

  try {
    const value = JSON.parse(raw) as unknown;
    if (predicate(value)) return value;
    console.warn(`Skipping invalid ${label} artifact ${filePath}: schema mismatch`);
    return undefined;
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    console.warn(`Skipping invalid ${label} JSON ${filePath}: ${(error as Error).message}`);
    return undefined;
  }
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

function isLiveAdapterTargetDossier(value: unknown): value is LiveAdapterTargetDossier {
  const dossier = objectValue(value);
  const readiness = objectValue(dossier?.readiness);
  const summary = objectValue(dossier?.summary);
  const gbrainContext = objectValue(dossier?.gbrainContext);
  return (
    Boolean(dossier) &&
    dossier?.schemaVersion === 1 &&
    nonEmptyString(dossier.target) &&
    typeof dossier.status === "string" &&
    Boolean(readiness) &&
    typeof readiness?.status === "string" &&
    Boolean(summary) &&
    typeof summary?.blockers === "number" &&
    Boolean(gbrainContext) &&
    Array.isArray(dossier.nextActions) &&
    dossier.nextActions.every(isLiveAdapterDossierNextAction) &&
    stringArray(gbrainContext?.reportRefs) &&
    stringArray(gbrainContext?.suggestedQueries) &&
    stringArray(dossier.evidenceRefs)
  );
}

function isLiveAdapterOperatorEvidenceAssist(value: unknown): value is LiveAdapterOperatorEvidenceAssist {
  const assist = objectValue(value);
  return (
    Boolean(assist) &&
    assist?.schemaVersion === 1 &&
    (assist.target === undefined || typeof assist.target === "string") &&
    Boolean(objectValue(assist.summary)) &&
    Array.isArray(assist.targets) &&
    assist.targets.every(isLiveAdapterOperatorEvidenceAssistTarget) &&
    typeof assist.operatorEvidenceRecordCreated === "boolean"
  );
}

function isLiveEvidencePromotion(value: unknown): value is LiveEvidencePromotion {
  const promotion = objectValue(value);
  const summary = objectValue(promotion?.summary);
  return (
    Boolean(promotion) &&
    promotion?.schemaVersion === 1 &&
    nonEmptyString(promotion.id) &&
    nonEmptyString(promotion.target) &&
    typeof promotion.title === "string" &&
    typeof promotion.generatedAt === "string" &&
    promotion.status === "promoted_for_operator_review" &&
    Boolean(summary) &&
    typeof summary?.sources === "number" &&
    typeof summary.parsedSources === "number" &&
    typeof summary.redactedValues === "number" &&
    Array.isArray(promotion.sources) &&
    promotion.sources.every(isLiveEvidencePromotionSource)
  );
}

function isLiveAdapterOperatorEvidenceAssistTarget(value: unknown): boolean {
  const target = objectValue(value);
  return (
    Boolean(target) &&
    typeof target?.target === "string" &&
    typeof target.status === "string" &&
    typeof target.assistFileRef === "string" &&
    stringArray(target.existingEvidenceRefs) &&
    stringArray(target.supportFileRefs) &&
    stringArray(target.missingSections) &&
    stringArray(target.requiredEvidence) &&
    stringArray(target.cutoverBlockers) &&
    stringArray(target.gbrainQueries) &&
    stringArray(target.nextSteps) &&
    Array.isArray(target.promotedLiveEvidence) &&
    target.promotedLiveEvidence.every(isPromotedLiveEvidenceSummary)
  );
}

function isLiveAdapterDossierNextAction(value: unknown): boolean {
  const action = objectValue(value);
  return (
    Boolean(action) &&
    typeof action?.status === "string" &&
    typeof action.title === "string" &&
    (action.command === undefined || typeof action.command === "string") &&
    (action.rationale === undefined || typeof action.rationale === "string") &&
    (typeof action.command === "string" || typeof action.rationale === "string")
  );
}

function isOperatorAssistFileName(name: string): boolean {
  return name === "live-adapter-operator-evidence-assist.json" || /^live-adapter-operator-evidence-assist-[a-z0-9-]+\.json$/.test(name);
}

function operatorAssistArtifactRef(assist: LiveAdapterOperatorEvidenceAssist): string {
  return assist.target ? `control/live-adapter-operator-evidence-assist-${assist.target}.json` : "control/live-adapter-operator-evidence-assist.json";
}

function operatorAssistSlug(
  assist: LiveAdapterOperatorEvidenceAssist,
  target: LiveAdapterOperatorEvidenceAssist["targets"][number]
): string {
  return assist.target ? `live-adapter/operator-assist/${target.target}` : `live-adapter/operator-assist/all/${target.target}`;
}

function operatorAssistTitle(
  assist: LiveAdapterOperatorEvidenceAssist,
  target: LiveAdapterOperatorEvidenceAssist["targets"][number]
): string {
  return `Operator Evidence Assist: ${target.target}${assist.target ? "" : " (aggregate)"}`;
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return hasSchema(value) ? value : undefined;
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueString(value: string, index: number, values: string[]): boolean {
  return values.indexOf(value) === index;
}

function isLiveEvidencePromotionSource(value: unknown): boolean {
  const source = objectValue(value);
  return (
    Boolean(source) &&
    typeof source?.kind === "string" &&
    typeof source.sourceRef === "string" &&
    typeof source.sourceSha256 === "string"
  );
}

function isPromotedLiveEvidenceSummary(value: unknown): boolean {
  const summary = objectValue(value);
  return (
    Boolean(summary) &&
    typeof summary?.ref === "string" &&
    typeof summary.title === "string" &&
    stringArray(summary.summaryBullets)
  );
}

function isRoadmapCompletionAudit(value: unknown): value is RoadmapCompletionAudit {
  const audit = objectValue(value);
  const summary = objectValue(audit?.summary);
  return (
    Boolean(audit) &&
    audit?.schemaVersion === 1 &&
    typeof audit.status === "string" &&
    Boolean(summary) &&
    typeof summary?.passed === "number" &&
    typeof summary.blocked === "number" &&
    Array.isArray(audit.requirements) &&
    audit.requirements.every(isRoadmapCompletionRequirement)
  );
}

function isRoadmapCompletionRequirement(value: unknown): boolean {
  const requirement = objectValue(value);
  return (
    Boolean(requirement) &&
    typeof requirement?.status === "string" &&
    typeof requirement.title === "string" &&
    typeof requirement.detail === "string" &&
    stringArray(requirement.evidenceRefs)
  );
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
  if (filePath.startsWith(vaultRoot)) return filePath.split(vaultRoot).join("<VAULT_ROOT>");
  if (filePath.startsWith(workspaceRoot)) return filePath.split(workspaceRoot).join("<WORKSPACE_ROOT>");
  return `<EXTERNAL_SOURCE>/${path.basename(filePath)}`;
}
