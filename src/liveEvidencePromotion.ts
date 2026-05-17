import fs from "node:fs/promises";
import path from "node:path";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { sha256File } from "./hash.js";
import type { LiveAdapterTarget } from "./liveAdapterTargets.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { LiveEvidencePromotion } from "./types.js";

type PromotionSource = LiveEvidencePromotion["sources"][number];

export async function promoteLiveEvidence(input: {
  project: string;
  vaultRoot: string;
  target: LiveAdapterTarget;
  sourcePaths: string[];
  title: string;
  notes?: string;
}): Promise<{ jsonPath: string; markdownPath: string; promotion: LiveEvidencePromotion }> {
  const project = slugifyProject(input.project);
  if (input.sourcePaths.length === 0) throw new Error("--from requires at least one source path.");

  const generatedAt = new Date();
  const sources: PromotionSource[] = [];
  for (const sourcePath of input.sourcePaths) {
    sources.push(await promoteSource(input.vaultRoot, project, sourcePath));
  }

  const promotion: LiveEvidencePromotion = {
    schemaVersion: 1,
    id: `live-evidence-promotion-${input.target}-${timestampFile(generatedAt)}`,
    project,
    generatedAt: generatedAt.toISOString(),
    target: input.target,
    title: input.title,
    status: "promoted_for_operator_review",
    mutationApproved: false,
    approvalGranted: false,
    operatorEvidenceRecordCreated: false,
    summary: {
      sources: sources.length,
      parsedSources: sources.filter((source) => source.parsed).length,
      redactedValues: sources.reduce((count, source) => count + source.redactedValues, 0)
    },
    sources,
    notes: input.notes
  };

  const jsonPath = await writeJsonArtifact(
    input.vaultRoot,
    project,
    "control/live-evidence-promotions",
    `${promotion.id}.json`,
    promotion
  );
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control/live-evidence-promotions",
    `${promotion.id}.md`,
    renderPromotion(promotion)
  );
  return { jsonPath, markdownPath, promotion };
}

async function promoteSource(vaultRoot: string, project: string, sourcePath: string): Promise<PromotionSource> {
  const resolved = resolveSourcePath(vaultRoot, project, sourcePath);
  const [content, stat, sourceSha256] = await Promise.all([
    fs.readFile(resolved, "utf8"),
    fs.stat(resolved),
    sha256File(resolved)
  ]);
  const parsed = parseJson(content);
  const summary = parsed ? summarizeKnownArtifact(parsed) : undefined;
  const sanitized = summary ? sanitizeValue(summary) : undefined;
  return {
    sourceRef: sourceRef(vaultRoot, resolved),
    sourceSha256,
    sourceBytes: stat.size,
    kind: parsed ? artifactKind(parsed) : "file-hash",
    parsed: Boolean(parsed),
    redactedValues: sanitized?.redactions ?? 0,
    summary: sanitized?.value
  };
}

function summarizeKnownArtifact(value: unknown): unknown {
  const object = objectValue(value);
  if (!object) return undefined;

  if (object.schemaVersion === 1 && object.mode && object.hermes && Array.isArray(object.modelEndpoints)) {
    return {
      generatedAt: object.generatedAt,
      mode: object.mode,
      summary: object.summary,
      hermes: object.hermes,
      modelEndpoints: object.modelEndpoints.map((endpoint) => {
        const endpointObject = objectValue(endpoint) ?? {};
        const models = Array.isArray(endpointObject.models) ? endpointObject.models : [];
        const canary = objectValue(endpointObject.canary);
        return {
          id: endpointObject.id,
          kind: endpointObject.kind,
          status: endpointObject.status,
          models: models.length,
          canaryStatus: canary?.status,
          canaryModel: canary?.model
        };
      })
    };
  }

  if (object.schemaVersion === 1 && object.mode === "read_only" && object.system && object.summary) {
    return {
      importedAt: object.importedAt,
      system: object.system,
      mode: object.mode,
      summary: object.summary
    };
  }

  if (object.schemaVersion === 1 && object.snapshotKind === "live_read_only" && object.summary) {
    return {
      importedAt: object.importedAt,
      snapshotKind: object.snapshotKind,
      summary: object.summary
    };
  }

  if (object.schemaVersion === 1 && object.status && object.steps && object.summary) {
    return {
      generatedAt: object.generatedAt,
      status: object.status,
      summary: object.summary,
      steps: Array.isArray(object.steps)
        ? object.steps.map((step) => {
            const stepObject = objectValue(step) ?? {};
            return { step: stepObject.step, status: stepObject.status, detail: stepObject.detail };
          })
        : undefined
    };
  }

  if (object.summary) return { summary: object.summary };
  return undefined;
}

function artifactKind(value: unknown): PromotionSource["kind"] {
  const object = objectValue(value);
  if (!object) return "file-hash";
  if (object.schemaVersion === 1 && object.mode && object.hermes && Array.isArray(object.modelEndpoints)) return "local-runtime-probe";
  if (object.schemaVersion === 1 && object.mode === "read_only" && object.system && object.summary) return "deployment-snapshot";
  if (object.schemaVersion === 1 && object.snapshotKind === "live_read_only" && object.summary) return "infra-snapshot";
  if (object.schemaVersion === 1 && object.status && object.steps && object.summary) return "e2e-smoke";
  if (object.summary) return "json-summary";
  return "file-hash";
}

function sanitizeValue(value: unknown): { value: unknown; redactions: number } {
  if (Array.isArray(value)) {
    const items = value.map(sanitizeValue);
    return {
      value: items.map((item) => item.value),
      redactions: items.reduce((count, item) => count + item.redactions, 0)
    };
  }
  if (value && typeof value === "object") {
    let redactions = 0;
    const output: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value)) {
      if (shouldRedactKey(key)) {
        output[key] = "<redacted>";
        redactions += 1;
        continue;
      }
      const sanitized = sanitizeValue(raw);
      output[key] = sanitized.value;
      redactions += sanitized.redactions;
    }
    return { value: output, redactions };
  }
  if (typeof value === "string") {
    const sanitized = sanitizeString(value);
    return { value: sanitized.value, redactions: sanitized.redactions };
  }
  return { value, redactions: 0 };
}

function sanitizeString(value: string): { value: string; redactions: number } {
  let redactions = 0;
  const sanitized = value
    .replace(/https?:\/\/[^\s"')]+/g, () => {
      redactions += 1;
      return "<redacted-url>";
    })
    .replace(/\b(?:10|100|172|192)\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, () => {
      redactions += 1;
      return "<redacted-ip>";
    })
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, () => {
      redactions += 1;
      return "<redacted-email>";
    });
  return { value: sanitized, redactions };
}

function shouldRedactKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return normalized === "url" || normalized.endsWith("url") || normalized === "target" || normalized === "sourcepath";
}

function renderPromotion(promotion: LiveEvidencePromotion): string {
  return [
    "# Live Evidence Promotion",
    "",
    `Project: ${promotion.project}`,
    `Target: ${promotion.target}`,
    `Title: ${promotion.title}`,
    `Status: ${promotion.status}`,
    `Generated: ${promotion.generatedAt}`,
    `Mutation approved: ${promotion.mutationApproved}`,
    `Approval granted: ${promotion.approvalGranted}`,
    `Operator evidence record created: ${promotion.operatorEvidenceRecordCreated}`,
    "",
    "## Rule",
    "",
    "This record promotes sanitized summaries from local live artifacts for operator review. It does not import operator evidence, approve mutation, grant live-adapter authority, or include private endpoint URLs.",
    "",
    "## Summary",
    "",
    `- Sources: ${promotion.summary.sources}`,
    `- Parsed sources: ${promotion.summary.parsedSources}`,
    `- Redacted values: ${promotion.summary.redactedValues}`,
    ...(promotion.notes ? [`- Notes: ${promotion.notes}`] : []),
    "",
    "## Sources",
    "",
    "| Source | Kind | Parsed | Bytes | SHA-256 | Redactions |",
    "| --- | --- | --- | ---: | --- | ---: |",
    ...promotion.sources.map(
      (source) =>
        `| ${cell(source.sourceRef)} | ${source.kind} | ${source.parsed} | ${source.sourceBytes} | ${source.sourceSha256} | ${source.redactedValues} |`
    ),
    "",
    "## Sanitized Summaries",
    "",
    ...promotion.sources.flatMap((source, index) => [
      `### Source ${index + 1}: ${source.kind}`,
      "",
      "```json",
      JSON.stringify(source.summary ?? { sourceRef: source.sourceRef, parsed: source.parsed }, null, 2),
      "```",
      ""
    ])
  ].join("\n");
}

function resolveSourcePath(vaultRoot: string, project: string, sourcePath: string): string {
  const resolved = path.isAbsolute(sourcePath)
    ? path.resolve(sourcePath)
    : sourcePath.startsWith("projects/")
      ? path.resolve(vaultRoot, sourcePath)
      : path.resolve(projectDir(vaultRoot, project), sourcePath);
  return resolved;
}

function sourceRef(vaultRoot: string, resolved: string): string {
  const relativeToVault = path.relative(path.resolve(vaultRoot), resolved);
  if (relativeToVault && !relativeToVault.startsWith("..") && !path.isAbsolute(relativeToVault)) {
    return relativeToVault.split(path.sep).join("/");
  }
  return `<external>/${path.basename(resolved)}`;
}

function parseJson(value: string): unknown | undefined {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function cell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
