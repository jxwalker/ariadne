import fs from "node:fs/promises";
import path from "node:path";
import type { BenchmarkPack, BenchmarkSet } from "./types.js";

interface BenchmarkFileTemplate {
  path: string;
  role: BenchmarkPack["files"][number]["role"];
  description: string;
  targetProject?: string;
  content: string;
}

interface BenchmarkPackTemplate {
  set: BenchmarkSet;
  title: string;
  purpose: string;
  files: BenchmarkFileTemplate[];
  recommendedCommands: string[];
  acceptance: BenchmarkPack["acceptance"];
}

const SMOKE: BenchmarkPackTemplate = {
  set: "smoke",
  title: "Smoke Benchmark Pack",
  purpose: "Prove the minimum evidence-to-control pipeline on one compact Markdown source.",
  files: [
    {
      path: "sources/source.md",
      role: "source",
      description: "Single compact source covering intake, planning, execution, verification, and control.",
      content: [
        "# Ariadne Smoke Source",
        "",
        "Build a source-grounded coding harness that ingests notes, produces a PRD, generates GSD tasks, plans Playwright checks, records CI and review evidence, and emits a control report.",
        "",
        "The first run should be local, deterministic, and safe to repeat. It should not mutate Proxmox, GitHub, NotebookLM, or external runners.",
        ""
      ].join("\n")
    },
    {
      path: "expected/required-artifacts.json",
      role: "expected",
      description: "Required artifact ids expected from the standard roadmap plus artifact-checks flow.",
      content: json({
        requiredArtifactIds: [
          "manifest",
          "hot-index",
          "dossier",
          "prd-json",
          "gsd-roadmap",
          "gsd2-bundle",
          "execution-runs",
          "playwright-plan",
          "evaluation-plan",
          "infra-registry",
          "control-report"
        ]
      })
    }
  ],
  recommendedCommands: [
    "npm run ariadne -- ingest --project bench-smoke <PACK_ROOT>/sources/source.md",
    "npm run ariadne -- assemble --project bench-smoke",
    "npm run ariadne -- roadmap --project bench-smoke --target-url http://localhost:3000",
    "npm run ariadne -- artifact-checks --project bench-smoke"
  ],
  acceptance: [
    {
      id: "smoke-artifact-contract",
      type: "artifact_contract",
      criterion: "Artifact checks pass with no missing required artifacts."
    },
    {
      id: "smoke-pipeline-output",
      type: "pipeline_output",
      criterion: "The generated PRD contains the core evidence, planning, verification, and control requirements."
    },
    {
      id: "smoke-fixture-safety",
      type: "fixture_safety",
      criterion: "No command requires a live external service."
    }
  ]
};

const REALISTIC: BenchmarkPackTemplate = {
  set: "realistic",
  title: "Realistic Benchmark Pack",
  purpose: "Exercise mixed source intake and manual adapter imports that resemble a real Ariadne project handoff.",
  files: [
    {
      path: "sources/whitepaper.md",
      role: "source",
      description: "Whitepaper-style source with architecture and governance requirements.",
      content: [
        "# Memory-Grounded Agentic Engineering",
        "",
        "The system should preserve raw evidence, assemble bounded dossiers, and record every decision that changes scope.",
        "",
        "Agents may sleep and resume, but the durable state is the artifact record. Memory proposals must cite evidence paths before they become project truth.",
        "",
        "The estate includes Mac workstations, DGX Spark, a Proxmox Linux server, TrueNAS storage, local model endpoints, GitHub, NotebookLM, Playwright, CodeRabbit, and CI.",
        ""
      ].join("\n")
    },
    {
      path: "sources/dictated-notes.txt",
      role: "source",
      description: "Dictated-note style source with rough operator instructions.",
      content: [
        "Need an end to end coding harness.",
        "Inputs can be drawings, white papers, dictated notes, screenshots, and research exports.",
        "Run until completion only after the plan, tests, UI evidence, review, and state records are clear.",
        "Show me what happened in a console and keep the machine topology visible.",
        ""
      ].join("\n")
    },
    {
      path: "sources/sketch-handoff.md",
      role: "source",
      description: "Textual handoff for a design sketch or whiteboard image.",
      content: [
        "# Sketch Handoff",
        "",
        "The sketch shows an intake funnel feeding a vault, then PRD, GSD, execution, verification, review, and control gates.",
        "",
        "A side loop sends sleep notes, memory consolidation proposals, and agent mail back into the project state store.",
        ""
      ].join("\n")
    },
    {
      path: "imports/notebooklm-export.md",
      role: "notebooklm_export",
      description: "Manual NotebookLM-style export for adapter import tests.",
      content: [
        "# Briefing Doc",
        "",
        "## Requirements",
        "",
        "Ariadne should keep source citations visible through planning and execution. [1]",
        "",
        "## Risks",
        "",
        "Live automation must remain read-only until evidence paths are proven. [2]",
        "",
        "Source: NotebookLM benchmark fixture",
        ""
      ].join("\n")
    },
    {
      path: "imports/ci-checks.json",
      role: "ci_status",
      description: "Passing CI fixture for import-ci.",
      content: json([
        { name: "typecheck", conclusion: "success", command: "npm run check" },
        { name: "unit-tests", conclusion: "success", command: "npm test" },
        { name: "build", conclusion: "success", command: "npm run build" }
      ])
    },
    {
      path: "imports/coderabbit-review.md",
      role: "coderabbit_review",
      description: "Approved CodeRabbit-style review fixture for import-coderabbit.",
      content: ["Approved", "", "No issues found in the realistic benchmark fixture.", ""].join("\n")
    },
    {
      path: "imports/usage-metrics.json",
      role: "usage_metrics",
      description: "Token and cost usage fixture for usage-import.",
      content: json([
        {
          source: "hermes",
          model: "gpt-5.5",
          operation: "planning",
          input_tokens: 1800,
          output_tokens: 900,
          cost_usd: 0.81
        },
        {
          source: "coderabbit",
          model: "coderabbit-review",
          operation: "review",
          total_tokens: 1200,
          cost_usd: 0.18
        }
      ])
    },
    {
      path: "imports/infra-snapshot.json",
      role: "infra_snapshot",
      description: "Read-only infrastructure snapshot fixture.",
      content: json({
        host: { short_name: "beast", role: "proxmox-dev" },
        guests: {
          vms: [{ id: 109, name: "runner", status: "observed" }],
          lxc: [{ id: 201, name: "paperless", status: "observed" }]
        }
      })
    }
  ],
  recommendedCommands: [
    "npm run ariadne -- ingest --project bench-realistic <PACK_ROOT>/sources/whitepaper.md <PACK_ROOT>/sources/dictated-notes.txt <PACK_ROOT>/sources/sketch-handoff.md",
    "npm run ariadne -- assemble --project bench-realistic",
    "npm run ariadne -- roadmap --project bench-realistic --target-url http://localhost:3000",
    "npm run ariadne -- notebooklm-import --project bench-realistic --from <PACK_ROOT>/imports/notebooklm-export.md",
    "npm run ariadne -- import-ci --project bench-realistic --from <PACK_ROOT>/imports/ci-checks.json",
    "npm run ariadne -- import-coderabbit --project bench-realistic --from <PACK_ROOT>/imports/coderabbit-review.md",
    "npm run ariadne -- usage-import --project bench-realistic --from <PACK_ROOT>/imports/usage-metrics.json",
    "npm run ariadne -- usage-report --project bench-realistic",
    "npm run ariadne -- infra-snapshot --project bench-realistic --from <PACK_ROOT>/imports/infra-snapshot.json",
    "npm run ariadne -- artifact-checks --project bench-realistic"
  ],
  acceptance: [
    {
      id: "realistic-pipeline-output",
      type: "pipeline_output",
      criterion: "Mixed source intake produces three source records."
    },
    {
      id: "realistic-adapter-evidence",
      type: "pipeline_output",
      criterion: "Manual NotebookLM, CI, CodeRabbit, usage, and infrastructure imports create evidence records."
    },
    {
      id: "realistic-fixture-safety",
      type: "fixture_safety",
      criterion: "Control and artifact-check reports are generated without live mutations."
    }
  ]
};

const STRESS: BenchmarkPackTemplate = {
  set: "stress",
  title: "Stress Benchmark Pack",
  purpose: "Exercise stale, failed, noisy, and multi-project conditions without including real secrets or live system mutations.",
  files: [
    {
      path: "project-alpha/source.md",
      role: "source",
      description: "First project source for multi-project vault tests.",
      content: [
        "# Alpha Project",
        "",
        "Alpha needs a complete evidence spine, but its execution run will be interrupted for benchmark purposes.",
        "",
        noisyNotes("alpha")
      ].join("\n")
    },
    {
      path: "project-beta/source.md",
      role: "source",
      description: "Second project source for multi-project vault tests.",
      content: [
        "# Beta Project",
        "",
        "Beta intentionally carries stale control evidence and failed checks so trend reports can distinguish regressions from fresh work.",
        "",
        noisyNotes("beta")
      ].join("\n")
    },
    {
      path: "imports/failed-ci.json",
      role: "ci_status",
      description: "Failing CI fixture for control-plane regression tests.",
      targetProject: "beta",
      content: json([
        { name: "typecheck", conclusion: "success", command: "npm run check" },
        { name: "unit-tests", conclusion: "failure", command: "npm test" },
        { name: "ui-smoke", conclusion: "timed_out", command: "npx playwright test" }
      ])
    },
    {
      path: "imports/pending-coderabbit-review.md",
      role: "coderabbit_review",
      description: "Pending review fixture with no approval signal.",
      targetProject: "beta",
      content: [
        "Review pending",
        "",
        "The benchmark includes unresolved comments and cannot be treated as approved.",
        ""
      ].join("\n")
    },
    {
      path: "imports/odd-infra-snapshot.json",
      role: "infra_snapshot",
      description: "Valid JSON with unusual shape for snapshot summarisation tests.",
      targetProject: "beta",
      content: json({
        node: "unknown-lab-host",
        services: [{ name: "runner", status: "degraded" }],
        warnings: ["missing guest inventory", "stale timestamp"]
      })
    },
    {
      path: "stale/interrupted-run.json",
      role: "execution_seed",
      description: "Interrupted execution fixture for future benchmark-run ingestion.",
      targetProject: "alpha",
      content: json({
        schemaVersion: 1,
        id: "run-stress-interrupted",
        project: "bench-stress-alpha",
        createdAt: "2026-01-01T00:00:00.000Z",
        taskIds: ["TASK-001"],
        repoPath: "<REPO_ROOT>",
        branchPrefix: "jxw/ariadne",
        status: "blocked",
        gates: ["npm run check", "npm test", "review evidence"],
        worktrees: [
          {
            taskId: "TASK-001",
            branch: "jxw/ariadne-task-001",
            worktreePath: "<REPO_ROOT>-task-001"
          }
        ],
        stopConditions: ["Benchmark fixture: interrupted execution run."]
      })
    }
  ],
  recommendedCommands: [
    "npm run ariadne -- ingest --project bench-stress-alpha <PACK_ROOT>/project-alpha/source.md",
    "npm run ariadne -- ingest --project bench-stress-beta <PACK_ROOT>/project-beta/source.md",
    "npm run ariadne -- import-ci --project bench-stress-beta --from <PACK_ROOT>/imports/failed-ci.json",
    "npm run ariadne -- import-coderabbit --project bench-stress-beta --from <PACK_ROOT>/imports/pending-coderabbit-review.md",
    "npm run ariadne -- infra-snapshot --project bench-stress-beta --from <PACK_ROOT>/imports/odd-infra-snapshot.json"
  ],
  acceptance: [
    {
      id: "stress-multi-project",
      type: "pipeline_output",
      criterion: "The benchmark can create more than one project in a vault."
    },
    {
      id: "stress-regression-signal",
      type: "pipeline_output",
      criterion: "Failed checks and pending review evidence remain explicit."
    },
    {
      id: "stress-fixture-safety",
      type: "fixture_safety",
      criterion: "No fixture contains a real credential or requires a live host."
    }
  ]
};

const PACKS: Record<BenchmarkSet, BenchmarkPackTemplate> = {
  smoke: SMOKE,
  realistic: REALISTIC,
  stress: STRESS
};

export function benchmarkSets(): BenchmarkSet[] {
  return ["smoke", "realistic", "stress"];
}

export function parseBenchmarkSet(value: string): BenchmarkSet | "all" {
  if (value === "all" || value === "smoke" || value === "realistic" || value === "stress") {
    return value;
  }
  throw new Error("--set must be smoke, realistic, stress, or all.");
}

export async function materializeBenchmarkPack(input: {
  set: BenchmarkSet;
  outputRoot: string;
}): Promise<{ manifestPath: string; markdownPath: string; pack: BenchmarkPack }> {
  const template = PACKS[input.set];
  const root = path.resolve(input.outputRoot);
  const packDir = path.join(root, template.set);
  await fs.mkdir(packDir, { recursive: true });

  const files: BenchmarkPack["files"] = [];
  for (const file of template.files) {
    const filePath = path.join(packDir, file.path);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file.content.endsWith("\n") ? file.content : `${file.content}\n`);
    files.push({
      path: path.relative(packDir, filePath),
      role: file.role,
      description: file.description,
      targetProject: file.targetProject
    });
  }

  const pack: BenchmarkPack = {
    schemaVersion: 1,
    set: template.set,
    title: template.title,
    purpose: template.purpose,
    generatedAt: new Date().toISOString(),
    root: packDir,
    files,
    recommendedCommands: template.recommendedCommands,
    acceptance: template.acceptance
  };

  const manifestPath = path.join(packDir, "benchmark-pack.json");
  const markdownPath = path.join(packDir, "README.md");
  await fs.writeFile(manifestPath, json(makePortable(pack, packDir)));
  await fs.writeFile(markdownPath, renderPack(makePortable(pack, packDir)));
  return { manifestPath, markdownPath, pack: makePortable(pack, packDir) };
}

function renderPack(pack: BenchmarkPack): string {
  return [
    `# ${pack.title}`,
    "",
    `Set: ${pack.set}`,
    `Generated: ${pack.generatedAt}`,
    "",
    pack.purpose,
    "",
    "## Files",
    "",
    "| Path | Role | Description |",
    "| --- | --- | --- |",
    ...pack.files.map((file) => `| ${file.path} | ${file.role} | ${file.description} |`),
    "",
    "## Recommended Commands",
    "",
    "```bash",
    ...pack.recommendedCommands,
    "```",
    "",
    "## Acceptance",
    "",
    ...pack.acceptance.map((item) => `- ${item.id} (${item.type}): ${item.criterion}`),
    ""
  ].join("\n");
}

function makePortable<T>(value: T, packDir: string): T {
  return replaceStrings(value, [[packDir, "<PACK_ROOT>"]]) as T;
}

function replaceStrings(value: unknown, replacements: Array<[string, string]>): unknown {
  if (typeof value === "string") {
    return replacements.reduce((current, [needle, replacement]) => current.split(needle).join(replacement), value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceStrings(item, replacements));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, replaceStrings(item, replacements)])
    );
  }
  return value;
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function noisyNotes(label: string): string {
  return Array.from(
    { length: 12 },
    (_, index) =>
      `Note ${index + 1}: ${label} repeats source, planning, execution, verification, review, and control context to exercise dossier truncation.`
  ).join("\n");
}
