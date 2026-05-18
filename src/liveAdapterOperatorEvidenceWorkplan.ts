import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateLiveAdapterCutoverAudit } from "./liveAdapterCutoverAudit.js";
import { generateLiveAdapterEvidenceTemplates } from "./liveAdapterEvidenceTemplates.js";
import { generateLiveAdapterOperatorEvidenceAudit, operatorEvidenceTargetMissingSections } from "./liveAdapterOperatorEvidence.js";
import { generateLiveAdapterReviewSession } from "./liveAdapterReviewSession.js";
import { isLiveAdapterTarget } from "./liveAdapterTargets.js";
import { projectDir, slugifyProject } from "./paths.js";
import type {
  LiveAdapterCutoverAudit,
  LiveAdapterEvidenceTarget,
  LiveAdapterEvidenceTemplatePack,
  LiveAdapterOperatorEvidenceAudit,
  LiveAdapterOperatorEvidenceWorkplan,
  LiveAdapterReviewSession,
  LiveEvidencePromotion
} from "./types.js";

type WorkplanTarget = LiveAdapterOperatorEvidenceWorkplan["targets"][number];
type EvidenceAuditTarget = LiveAdapterOperatorEvidenceAudit["targets"][number];
type TemplateTarget = LiveAdapterEvidenceTemplatePack["templates"][number];
type ReviewTarget = LiveAdapterReviewSession["targets"][number];
type CutoverTarget = LiveAdapterCutoverAudit["targets"][number];

export async function generateLiveAdapterOperatorEvidenceWorkplan(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; workplan: LiveAdapterOperatorEvidenceWorkplan }> {
  const project = slugifyProject(input.project);
  const operatorEvidenceAudit = await generateLiveAdapterOperatorEvidenceAudit({ project, vaultRoot: input.vaultRoot });
  const reviewSession = await generateLiveAdapterReviewSession({ project, vaultRoot: input.vaultRoot });
  const evidenceTemplates = await generateLiveAdapterEvidenceTemplates({ project, vaultRoot: input.vaultRoot });
  const cutoverAudit = await generateLiveAdapterCutoverAudit({ project, vaultRoot: input.vaultRoot });
  const promotionRefsByTarget = await readLiveEvidencePromotionRefs(input.vaultRoot, project);

  const templatesByTarget = new Map(evidenceTemplates.pack.templates.map((template) => [template.target, template]));
  const reviewByTarget = new Map(reviewSession.session.targets.map((target) => [target.target, target]));
  const cutoverByTarget = new Map(cutoverAudit.audit.targets.map((target) => [target.target, target]));

  const targets = operatorEvidenceAudit.audit.targets.map((target) =>
    workplanTarget(
      project,
      target,
      mustGet(templatesByTarget, target.target, "evidence template"),
      mustGet(reviewByTarget, target.target, "review-session target"),
      mustGet(cutoverByTarget, target.target, "cutover target"),
      promotionRefsByTarget.get(target.target) ?? []
    )
  );
  const summary = {
    targets: targets.length,
    completeTargets: targets.filter((target) => target.status === "complete").length,
    missingTargets: operatorEvidenceAudit.audit.summary.missingTargets,
    incompleteTargets: operatorEvidenceAudit.audit.summary.incompleteTargets,
    checkCommands: targets.length,
    importCommands: targets.filter((target) => target.status !== "complete").length,
    gbrainQueries: targets.reduce((count, target) => count + target.gbrainQueries.length, 0)
  };
  const workplan: LiveAdapterOperatorEvidenceWorkplan = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status: summary.completeTargets === summary.targets ? "ready_for_review" : "evidence_required",
    mutationApproved: false,
    operatorEvidenceAuditRef: path.relative(input.vaultRoot, operatorEvidenceAudit.jsonPath),
    reviewSessionRef: path.relative(input.vaultRoot, reviewSession.jsonPath),
    evidenceTemplatesRef: path.relative(input.vaultRoot, evidenceTemplates.jsonPath),
    cutoverAuditRef: path.relative(input.vaultRoot, cutoverAudit.jsonPath),
    summary,
    targets
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "live-adapter-operator-evidence-workplan.json", workplan);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control",
    "live-adapter-operator-evidence-workplan.md",
    renderWorkplan(workplan)
  );
  return { jsonPath, markdownPath, workplan };
}

function workplanTarget(
  project: string,
  auditTarget: EvidenceAuditTarget,
  template: TemplateTarget,
  review: ReviewTarget,
  cutover: CutoverTarget,
  liveEvidencePromotionRefs: string[]
): WorkplanTarget {
  const status: WorkplanTarget["status"] =
    auditTarget.status === "complete" ? "complete" : auditTarget.status === "incomplete" ? "needs_rework" : "needs_evidence";
  const missingSections = operatorEvidenceTargetMissingSections(auditTarget);
  return {
    target: auditTarget.target,
    status,
    templateRef: template.templateRef,
    firstAction: review.firstAction,
    checkCommand: `npm run ariadne -- live-adapter-operator-evidence-check --project ${project} --target ${auditTarget.target} --from vault/projects/${project}/control/operator-evidence/${auditTarget.target}/operator-evidence.md`,
    importCommand: `npm run ariadne -- live-adapter-operator-evidence --project ${project} --target ${auditTarget.target} --from vault/projects/${project}/control/operator-evidence/${auditTarget.target}/operator-evidence.md --by <operator>`,
    reviewCommand: review.reviewCommand.replace("--project <project>", `--project ${project}`),
    missingSections,
    requiredEvidence: template.requiredEvidence,
    cutoverBlockers: cutover.blockers,
    gbrainQueries: template.gbrainQueries,
    evidenceRefs: Array.from(
      new Set(
        [template.templateRef, ...auditTarget.evidenceRefs, ...review.evidenceRefs, ...cutover.evidenceRefs, ...liveEvidencePromotionRefs].map(
          (ref) => canonicalRef(project, ref)
        )
      )
    )
  };
}

async function readLiveEvidencePromotionRefs(
  vaultRoot: string,
  project: string
): Promise<Map<LiveAdapterEvidenceTarget, string[]>> {
  const promotionsDir = path.join(projectDir(vaultRoot, project), "control", "live-evidence-promotions");
  let entries: string[];
  try {
    entries = (await fs.readdir(promotionsDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn(`Skipping live evidence promotions in ${path.relative(vaultRoot, promotionsDir)}: ${(error as Error).message}`);
    }
    return new Map();
  }

  const refsByTarget = new Map<LiveAdapterEvidenceTarget, string[]>();
  const promotions = await Promise.all(
    entries.map(async (entry) => {
      const promotionPath = path.join(promotionsDir, entry);
      return { promotionPath, promotion: await readPromotion(vaultRoot, promotionPath) };
    })
  );
  for (const { promotionPath, promotion } of promotions) {
    if (!promotion || !isReviewablePromotion(project, promotion)) continue;
    const refs = refsByTarget.get(promotion.target) ?? [];
    refs.push(path.relative(vaultRoot, promotionPath).split(path.sep).join("/"));
    refsByTarget.set(promotion.target, refs);
  }
  return refsByTarget;
}

async function readPromotion(vaultRoot: string, promotionPath: string): Promise<unknown> {
  try {
    return JSON.parse(await fs.readFile(promotionPath, "utf8"));
  } catch (error) {
    console.warn(`Skipping unreadable live evidence promotion ${path.relative(vaultRoot, promotionPath)}: ${(error as Error).message}`);
    return undefined;
  }
}

function isReviewablePromotion(project: string, promotion: unknown): promotion is LiveEvidencePromotion {
  if (!promotion || typeof promotion !== "object") return false;
  const candidate = promotion as Record<string, unknown>;
  return (
    candidate.schemaVersion === 1 &&
    candidate.project === project &&
    typeof candidate.target === "string" &&
    isLiveAdapterTarget(candidate.target) &&
    candidate.status === "promoted_for_operator_review" &&
    candidate.mutationApproved === false &&
    candidate.approvalGranted === false &&
    candidate.operatorEvidenceRecordCreated === false &&
    typeof candidate.id === "string" &&
    candidate.id.startsWith(`live-evidence-promotion-${candidate.target}-`)
  );
}

function canonicalRef(project: string, ref: string): string {
  const normalized = ref.split(path.sep).join("/");
  return normalized.startsWith(`projects/${project}/`) ? normalized : `projects/${project}/${normalized.replace(/^projects\/[^/]+\//, "")}`;
}

function mustGet<K, V>(items: Map<K, V>, key: K, label: string): V {
  const item = items.get(key);
  if (!item) throw new Error(`Missing ${label} for ${String(key)}.`);
  return item;
}

function renderWorkplan(workplan: LiveAdapterOperatorEvidenceWorkplan): string {
  return [
    "# Live Adapter Operator Evidence Workplan",
    "",
    `Project: ${workplan.project}`,
    `Status: ${workplan.status}`,
    `Generated: ${workplan.generatedAt}`,
    `Mutation approved: ${workplan.mutationApproved}`,
    "",
    "## Rule",
    "",
    "This workplan collects the evidence still needed from an operator. It does not approve mutation, does not grant live-adapter authority, and does not replace the filled evidence files.",
    "",
    "## References",
    "",
    `- Operator evidence audit: ${workplan.operatorEvidenceAuditRef}`,
    `- Review session: ${workplan.reviewSessionRef}`,
    `- Evidence templates: ${workplan.evidenceTemplatesRef}`,
    `- Cutover audit: ${workplan.cutoverAuditRef}`,
    "",
    "## Summary",
    "",
    `- Targets: ${workplan.summary.targets}`,
    `- Complete targets: ${workplan.summary.completeTargets}`,
    `- Missing targets: ${workplan.summary.missingTargets}`,
    `- Incomplete targets: ${workplan.summary.incompleteTargets}`,
    `- Check commands: ${workplan.summary.checkCommands}`,
    `- Import commands: ${workplan.summary.importCommands}`,
    `- GBrain queries: ${workplan.summary.gbrainQueries}`,
    "",
    "## Targets",
    "",
    ...workplan.targets.flatMap((target) => [
      `### ${target.target}`,
      "",
      `Status: ${target.status}`,
      `Template: ${target.templateRef}`,
      `First action: ${target.firstAction ?? "none"}`,
      "",
      "#### Check Command",
      "",
      "```bash",
      target.checkCommand,
      "```",
      "",
      "#### Import Command",
      "",
      "```bash",
      target.importCommand,
      "```",
      "",
      "#### Packet Review Command",
      "",
      "```bash",
      target.reviewCommand,
      "```",
      "",
      "#### Missing Sections",
      "",
      ...list(target.missingSections),
      "",
      "#### Required Evidence",
      "",
      ...list(target.requiredEvidence),
      "",
      "#### Cutover Blockers",
      "",
      ...list(target.cutoverBlockers),
      "",
      "#### GBrain Advisory Queries",
      "",
      ...list(target.gbrainQueries),
      "",
      "#### Evidence",
      "",
      ...list(target.evidenceRefs),
      ""
    ])
  ].join("\n");
}

function list(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}
