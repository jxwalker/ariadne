import fs from "node:fs/promises";
import path from "node:path";
import { latestFile, projectTitle, readJsonArtifact, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { slugifyProject } from "./paths.js";
import type { PrdDocument, Requirement } from "./types.js";

interface GeneratePrdOptions {
  project: string;
  vaultRoot: string;
  sourcePath?: string;
}

const CORE_REQUIREMENTS: Array<Omit<Requirement, "sourceRefs">> = [
  {
    id: "REQ-001",
    title: "Source evidence intake",
    description:
      "Preserve drawings, whitepapers, dictated notes, documents, and related artifacts before any summarisation or automation.",
    acceptance: [
      "Raw artifacts are copied into the durable vault.",
      "Each artifact has a digest, source path, kind, and timestamp.",
      "Extracted text remains linked to the raw evidence."
    ],
    priority: "must",
    status: "draft"
  },
  {
    id: "REQ-002",
    title: "Source-grounded PRD synthesis",
    description:
      "Convert evidence dossiers and NotebookLM-style grounded exports into requirements, ambiguities, acceptance criteria, and source references.",
    acceptance: [
      "PRD records source references for every major claim.",
      "Ambiguities are separated from accepted requirements.",
      "Manual exports work before automation is attempted."
    ],
    priority: "must",
    status: "draft"
  },
  {
    id: "REQ-003",
    title: "GSD2 task bridge",
    description:
      "Transform accepted requirements into milestones, vertical slices, tasks, success criteria, and verification commands.",
    acceptance: [
      "Tasks are independently inspectable as JSON and Markdown.",
      "Each task names expected write areas and verification commands.",
      "Tasks preserve requirement traceability."
    ],
    priority: "must",
    status: "draft"
  },
  {
    id: "REQ-004",
    title: "Bounded execution loop",
    description:
      "Plan isolated worktree execution with explicit branch names, gates, stop conditions, and review points.",
    acceptance: [
      "Execution runs are recorded before work begins.",
      "The system can identify planned worktrees and gates.",
      "External mutations remain blocked unless a later approved adapter is enabled."
    ],
    priority: "must",
    status: "draft"
  },
  {
    id: "REQ-005",
    title: "Playwright UI verification evidence",
    description:
      "Generate UI test plans and Playwright skeletons from requirements, with room for screenshots, traces, and healer proposals.",
    acceptance: [
      "Generated tests use role-oriented locators where possible.",
      "Scenario records link back to requirement ids.",
      "Evidence paths are recorded separately from claims."
    ],
    priority: "should",
    status: "draft"
  },
  {
    id: "REQ-006",
    title: "Review and CI control plane",
    description:
      "Collect deterministic checks, CodeRabbit feedback, human review, and merge-readiness state into one evidence surface.",
    acceptance: [
      "Merge readiness lists satisfied and missing gates.",
      "CI and review records are imported without being treated as hidden authority.",
      "Blocked states are explicit."
    ],
    priority: "must",
    status: "draft"
  },
  {
    id: "REQ-007",
    title: "Infrastructure substrate registry",
    description:
      "Represent Proxmox, DGX Spark, M-series Macs, Hermes, OpenScorpion, local model endpoints, and runner pools as read-only registry records first.",
    acceptance: [
      "Infrastructure records are readable without model calls.",
      "Runner trust boundaries are explicit.",
      "Mutation plans require approval and remain non-executing in this slice."
    ],
    priority: "must",
    status: "draft"
  }
];

function sourceRefsFromText(sourcePath: string, text: string): string[] {
  const refs = new Set<string>([sourcePath]);
  const lines = text.split("\n");
  for (const [index, line] of lines.entries()) {
    if (/NotebookLM|GSD|Playwright|CodeRabbit|Proxmox|OpenScorpion|Hermes|DGX|memory|evidence/i.test(line)) {
      refs.add(`${sourcePath}:${index + 1}`);
    }
    if (refs.size >= 12) break;
  }
  return [...refs];
}

function ambiguitiesFromText(text: string): string[] {
  const ambiguities = [
    "NotebookLM automation must remain manual/import-first until authentication, terms, and export stability are explicit.",
    "GSD2 integration should be file-contract based before depending on a specific local installation.",
    "Execution adapters need an approved mutation model before they can push branches or alter infrastructure.",
    "Playwright can generate plans now, but browser execution requires a concrete target app URL.",
    "Infrastructure planning should begin read-only because Proxmox and runner changes have high blast radius."
  ];

  if (/unofficial/i.test(text)) {
    ambiguities.push("The source bundle references unofficial APIs; adapter design must tolerate breakage and provide a manual fallback.");
  }

  return ambiguities;
}

export async function generatePrd(options: GeneratePrdOptions): Promise<{ jsonPath: string; markdownPath: string; prd: PrdDocument }> {
  const project = slugifyProject(options.project);
  const sourcePath =
    options.sourcePath ?? (await latestFile(options.vaultRoot, project, "context", "dossier-", ".md"));

  if (!sourcePath) {
    throw new Error("No context dossier found. Run assemble first or pass --from <file>.");
  }

  const resolvedSource = path.resolve(sourcePath);
  const text = await fs.readFile(resolvedSource, "utf8");
  const relativeSource = path.relative(options.vaultRoot, resolvedSource);
  const sourceRef = relativeSource.startsWith("..")
    ? resolvedSource
    : `<VAULT_ROOT>/${relativeSource.split(path.sep).join("/")}`;
  const sourceRefs = sourceRefsFromText(sourceRef, text);
  const requirements = CORE_REQUIREMENTS.map((requirement) => ({
    ...requirement,
    sourceRefs
  }));

  const prd: PrdDocument = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    title: `${projectTitle(project)} PRD`,
    goals: [
      "Turn unstructured source material into a source-grounded, test-driven coding workflow.",
      "Run bounded agentic implementation loops with strong evidence and review gates.",
      "Keep memory, rules, morals, and evidence visible to humans throughout."
    ],
    nonGoals: [
      "Do not replace Codex, GSD2, NotebookLM, GitHub, CodeRabbit, or Playwright.",
      "Do not mutate infrastructure or external repositories from PRD generation.",
      "Do not treat model output as execution approval."
    ],
    requirements,
    ambiguities: ambiguitiesFromText(text),
    sourceDossier: sourceRef
  };

  const markdown = renderPrdMarkdown(prd);
  const jsonPath = await writeJsonArtifact(options.vaultRoot, project, "requirements", "prd.json", prd);
  const markdownPath = await writeTextArtifact(options.vaultRoot, project, "requirements", "PRD.md", markdown);
  await writeTextArtifact(options.vaultRoot, project, "requirements", "ambiguities.md", renderAmbiguities(prd));

  return { jsonPath, markdownPath, prd };
}

export async function loadPrd(vaultRoot: string, project: string): Promise<PrdDocument> {
  return readJsonArtifact<PrdDocument>(vaultRoot, project, "requirements", "prd.json");
}

function renderAmbiguities(prd: PrdDocument): string {
  return [`# Ambiguities: ${prd.project}`, "", ...prd.ambiguities.map((item) => `- ${item}`), ""].join("\n");
}

export function renderPrdMarkdown(prd: PrdDocument): string {
  const requirementSections = prd.requirements.map((requirement) =>
    [
      `### ${requirement.id}: ${requirement.title}`,
      "",
      requirement.description,
      "",
      `Priority: ${requirement.priority}`,
      "",
      "Acceptance:",
      ...requirement.acceptance.map((item) => `- ${item}`),
      "",
      "Sources:",
      ...requirement.sourceRefs.slice(0, 8).map((ref) => `- ${ref}`),
      ""
    ].join("\n")
  );

  return [
    `# ${prd.title}`,
    "",
    `Generated: ${prd.generatedAt}`,
    prd.sourceDossier ? `Source dossier: ${prd.sourceDossier}` : "",
    "",
    "## Goals",
    "",
    ...prd.goals.map((goal) => `- ${goal}`),
    "",
    "## Non-Goals",
    "",
    ...prd.nonGoals.map((goal) => `- ${goal}`),
    "",
    "## Requirements",
    "",
    ...requirementSections,
    "## Ambiguities",
    "",
    ...prd.ambiguities.map((item) => `- ${item}`),
    ""
  ].join("\n");
}
