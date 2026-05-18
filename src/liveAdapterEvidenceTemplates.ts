import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateLiveAdapterReviewSession } from "./liveAdapterReviewSession.js";
import { slugifyProject } from "./paths.js";
import type { LiveAdapterEvidenceTemplatePack } from "./types.js";

export async function generateLiveAdapterEvidenceTemplates(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; pack: LiveAdapterEvidenceTemplatePack }> {
  const project = slugifyProject(input.project);
  const reviewSession = await generateLiveAdapterReviewSession({ project, vaultRoot: input.vaultRoot });
  const generatedAt = new Date().toISOString();

  const templates = await Promise.all(
    reviewSession.session.targets.map(async (target) => {
      const suggestedEvidenceRefs = suggestedRefs(target.target);
      const template: LiveAdapterEvidenceTemplatePack["templates"][number] = {
        target: target.target,
        status: "awaiting_operator_evidence",
        templateRef: `projects/${project}/control/live-adapter-evidence-templates/live-adapter-evidence-template-${target.target}.md`,
        reviewSessionStatus: target.status,
        firstAction: target.firstAction,
        suggestedEvidenceRefs,
        requiredEvidence: evidenceChecklist(target.requiredEvidence),
        gbrainQueries: target.gbrainContext.suggestedQueries,
        reviewCommand: target.reviewCommand,
        approvalRequestCommand: target.approvalRequestCommand,
        mutationPlanCommand: target.mutationPlanCommand,
        notes: [
          "This template is not approval evidence until an operator fills it with real observations.",
          "Do not pass this blank template as --evidence for live-adapter-approval-review.",
          "GBrain answers are advisory context only; cite Ariadne artifacts for gates and approvals."
        ]
      };
      await writeTextArtifact(
        input.vaultRoot,
        project,
        "control/live-adapter-evidence-templates",
        `live-adapter-evidence-template-${target.target}.md`,
        renderTargetTemplate(project, generatedAt, template, target.cutoverBlockers)
      );
      return template;
    })
  );

  const pack: LiveAdapterEvidenceTemplatePack = {
    schemaVersion: 1,
    project,
    generatedAt,
    status: templates.length > 0 ? "awaiting_operator_evidence" : "ready_for_operator_review",
    mutationApproved: false,
    reviewSessionRef: path.relative(input.vaultRoot, reviewSession.jsonPath),
    summary: {
      targets: reviewSession.session.summary.targets,
      templates: templates.length,
      evidenceItems: templates.reduce((count, template) => count + template.requiredEvidence.length, 0),
      gbrainQueryItems: templates.reduce((count, template) => count + template.gbrainQueries.length, 0)
    },
    templates
  };

  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "live-adapter-evidence-templates.json", pack);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "control",
    "live-adapter-evidence-templates.md",
    renderPack(pack)
  );
  return { jsonPath, markdownPath, pack };
}

function evidenceChecklist(requiredEvidence: string[]): string[] {
  return Array.from(
    new Set([
      "operator identity and review timestamp",
      "reviewed approval packet path and generation timestamp",
      "authentication or authorization boundary observed for this target",
      "bounded action statement and explicit non-goals",
      "rollback or disable path checked by the operator",
      "post-action verification command checked by the operator",
      "dry-run command and expected safe output shape",
      "target-guarded execution command and expected post-verification output shape",
      "proof that execution used mutation-execute or a target-specific wrapper with an exact --confirm-plan match",
      ...requiredEvidence
    ])
  );
}

function suggestedRefs(target: LiveAdapterEvidenceTemplatePack["templates"][number]["target"]): string[] {
  return [
    `control/operator-evidence/${target}-packet-review.md`,
    `control/operator-evidence/${target}-auth-boundary.md`,
    `control/operator-evidence/${target}-rollback-post-verify.md`,
    `control/operator-evidence/${target}-dry-run-review.md`
  ];
}

function renderPack(pack: LiveAdapterEvidenceTemplatePack): string {
  return [
    "# Live Adapter Evidence Templates",
    "",
    `Project: ${pack.project}`,
    `Status: ${pack.status}`,
    `Generated: ${pack.generatedAt}`,
    `Mutation approved: ${pack.mutationApproved}`,
    `Review session: ${pack.reviewSessionRef}`,
    "",
    "## Rule",
    "",
    "These files are blank operator templates. They are not approval records, not packet-review records, and not proof that evidence exists.",
    "",
    "## Summary",
    "",
    `- Targets: ${pack.summary.targets}`,
    `- Templates: ${pack.summary.templates}`,
    `- Evidence items: ${pack.summary.evidenceItems}`,
    `- GBrain query items: ${pack.summary.gbrainQueryItems}`,
    "",
    "## Templates",
    "",
    "| Target | Status | Template | First action | Evidence items | GBrain queries |",
    "| --- | --- | --- | --- | --- | --- |",
    ...pack.templates.map(
      (template) =>
        `| ${template.target} | ${template.status} | ${template.templateRef} | ${tableCell(template.firstAction ?? "none")} | ${template.requiredEvidence.length} | ${template.gbrainQueries.length} |`
    ),
    ""
  ].join("\n");
}

function renderTargetTemplate(
  project: string,
  generatedAt: string,
  template: LiveAdapterEvidenceTemplatePack["templates"][number],
  cutoverBlockers: string[]
): string {
  return [
    `# Live Adapter Operator Evidence Template: ${template.target}`,
    "",
    `Project: ${project}`,
    `Generated: ${generatedAt}`,
    `Status: ${template.status}`,
    `Mutation approved: false`,
    "",
    "## Instructions",
    "",
    "- Fill this file with real operator observations before using it as review evidence.",
    "- Leave unknown or unverified items marked as missing.",
    "- Do not treat GBrain responses as approval evidence; cite Ariadne artifacts for gate proof.",
    "",
    "## Review Commands",
    "",
    "### Packet Review",
    "",
    "```bash",
    template.reviewCommand,
    "```",
    "",
    ...(template.approvalRequestCommand
      ? ["### Approval Request Draft", "", "```bash", template.approvalRequestCommand, "```", ""]
      : []),
    ...(template.mutationPlanCommand ? ["### Mutation Plan Draft", "", "```bash", template.mutationPlanCommand, "```", ""] : []),
    "## Operator Observations",
    "",
    "- Operator:",
    "- Review timestamp:",
    "- Packet reviewed:",
    "- Decision for packet completeness:",
    "- Missing evidence:",
    "- Notes:",
    "",
    "## Required Evidence To Attach",
    "",
    ...template.requiredEvidence.map((item) => `- [ ] ${item}`),
    "",
    "## Suggested Evidence File Refs",
    "",
    ...template.suggestedEvidenceRefs.map((ref) => `- ${ref}`),
    "",
    "## Current Cutover Blockers",
    "",
    ...blockerList(cutoverBlockers),
    "",
    "## GBrain Advisory Queries",
    "",
    ...template.gbrainQueries.map((query) => `- [ ] ${query}`),
    "",
    "## GBrain Notes",
    "",
    "- Query result refs:",
    "- Stale assumptions found:",
    "- Related Ariadne evidence refs:",
    ""
  ].join("\n");
}

function list(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}

function blockerList(items: string[]): string[] {
  if (items.length === 0) return ["- none"];
  return items.flatMap((item) => {
    const marker = "; Missing operator evidence section: ";
    if (!item.includes(marker)) return [`- ${item}`];
    const [summary, ...missingSections] = item.split(marker);
    return [`- ${summary}`, ...missingSections.map((section) => `  - Missing: ${section}`)];
  });
}

function tableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}
