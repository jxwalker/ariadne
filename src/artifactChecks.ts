import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { ArtifactCheckReport } from "./types.js";

type ArtifactSpec =
  | {
      id: string;
      label: string;
      required: boolean;
      kind: "file";
      relativePath: string;
    }
  | {
      id: string;
      label: string;
      required: boolean;
      kind: "matching-files";
      relativePath: string;
      prefix: string;
      suffix: string;
      excludePrefixes?: string[];
      excludeSuffixes?: string[];
      minimumCount: number;
      recursive?: boolean;
      excludeDirs?: string[];
    };

const ARTIFACT_SPECS: ArtifactSpec[] = [
  { id: "manifest", label: "Source manifest", required: true, kind: "file", relativePath: "manifest.jsonl" },
  { id: "hot-index", label: "Hot index", required: true, kind: "file", relativePath: "HOT_INDEX.md" },
  {
    id: "dossier",
    label: "Context dossier",
    required: true,
    kind: "matching-files",
    relativePath: "context",
    prefix: "dossier-",
    suffix: ".md",
    minimumCount: 1
  },
  { id: "prd-json", label: "PRD JSON", required: true, kind: "file", relativePath: "requirements/prd.json" },
  { id: "prd-markdown", label: "PRD Markdown", required: true, kind: "file", relativePath: "requirements/PRD.md" },
  { id: "gsd-roadmap", label: "GSD roadmap", required: true, kind: "file", relativePath: "gsd/roadmap.json" },
  { id: "gsd-tasks", label: "GSD task list", required: true, kind: "file", relativePath: "gsd/TASKS.md" },
  { id: "gsd2-bundle", label: "GSD2 bundle", required: true, kind: "file", relativePath: "gsd/gsd2-bundle.json" },
  {
    id: "gsd2-process-snapshots",
    label: "GSD2 process snapshots",
    required: false,
    kind: "matching-files",
    relativePath: "gsd/process",
    prefix: "gsd2-process-",
    suffix: ".json",
    minimumCount: 1
  },
  {
    id: "execution-runs",
    label: "Execution run JSON",
    required: true,
    kind: "matching-files",
    relativePath: "execution",
    prefix: "run-",
    suffix: ".json",
    excludeSuffixes: ["-worktree-guard.json"],
    minimumCount: 1
  },
  {
    id: "playwright-plan",
    label: "Playwright plan",
    required: true,
    kind: "file",
    relativePath: "verification/playwright-plan.json"
  },
  {
    id: "playwright-captures",
    label: "Target app Playwright screenshots",
    required: false,
    kind: "matching-files",
    relativePath: "verification/playwright-captures",
    prefix: "target-",
    suffix: ".png",
    minimumCount: 1
  },
  {
    id: "playwright-traces",
    label: "Target app Playwright traces",
    required: false,
    kind: "matching-files",
    relativePath: "verification/playwright-captures",
    prefix: "target-",
    suffix: ".zip",
    minimumCount: 1
  },
  {
    id: "healer-proposals",
    label: "Review-gated healer proposals",
    required: false,
    kind: "matching-files",
    relativePath: "verification/healer-proposals",
    prefix: "healer-",
    suffix: ".json",
    minimumCount: 1
  },
  {
    id: "evaluation-plan",
    label: "Evaluation plan",
    required: true,
    kind: "file",
    relativePath: "evaluation/evaluation-plan.json"
  },
  {
    id: "benchmark-runs",
    label: "Benchmark run reports",
    required: false,
    kind: "matching-files",
    relativePath: "evaluation",
    prefix: "benchmark-run-",
    suffix: ".json",
    minimumCount: 1
  },
  {
    id: "infra-registry",
    label: "Infrastructure registry",
    required: true,
    kind: "file",
    relativePath: "infrastructure/registry.json"
  },
  {
    id: "infra-snapshots",
    label: "Infrastructure snapshots",
    required: false,
    kind: "matching-files",
    relativePath: "infrastructure",
    prefix: "infra-snapshot-",
    suffix: ".json",
    minimumCount: 1
  },
  {
    id: "control-report",
    label: "Merge-readiness report",
    required: true,
    kind: "file",
    relativePath: "control/merge-readiness.json"
  },
  {
    id: "console-data",
    label: "Console data projection",
    required: false,
    kind: "file",
    relativePath: "console/console-data.json"
  },
  {
    id: "console-html",
    label: "Static console",
    required: false,
    kind: "file",
    relativePath: "console/index.html"
  },
  {
    id: "console-visual-checks",
    label: "Console visual checks",
    required: false,
    kind: "file",
    relativePath: "console/visual-checks.json"
  },
  {
    id: "console-browser-checks",
    label: "Console browser checks",
    required: false,
    kind: "file",
    relativePath: "console/browser-checks.json"
  },
  {
    id: "recovery-report",
    label: "Crash recovery report",
    required: false,
    kind: "file",
    relativePath: "control/recovery-report.json"
  },
  {
    id: "usage-report",
    label: "Usage metrics report",
    required: false,
    kind: "file",
    relativePath: "evaluation/usage-report.json"
  },
  {
    id: "behavior-checks",
    label: "Behavior checks",
    required: false,
    kind: "file",
    relativePath: "evaluation/behavior-checks.json"
  },
  {
    id: "gbrain-export",
    label: "GBrain export bundle",
    required: false,
    kind: "file",
    relativePath: "integrations/gbrain/gbrain-export.json"
  },
  {
    id: "github-snapshots",
    label: "GitHub PR and check snapshots",
    required: false,
    kind: "matching-files",
    relativePath: "integrations/github",
    prefix: "github-snapshot-",
    suffix: ".json",
    minimumCount: 1
  },
  {
    id: "approval-records",
    label: "Mutation approval records",
    required: false,
    kind: "matching-files",
    relativePath: "control/approvals",
    prefix: "approval-",
    suffix: ".json",
    minimumCount: 1
  },
  {
    id: "mutation-readiness-plans",
    label: "Mutation readiness plans",
    required: false,
    kind: "matching-files",
    relativePath: "control/mutation-readiness",
    prefix: "mutation-readiness-",
    suffix: ".json",
    minimumCount: 1
  },
  {
    id: "mutation-readiness-audit",
    label: "Mutation readiness audit",
    required: false,
    kind: "file",
    relativePath: "control/mutation-readiness-audit.json"
  },
  {
    id: "live-adapter-readiness",
    label: "Live adapter readiness report",
    required: false,
    kind: "file",
    relativePath: "control/live-adapter-readiness.json"
  },
  {
    id: "live-adapter-next-actions",
    label: "Live adapter next-action report",
    required: false,
    kind: "file",
    relativePath: "control/live-adapter-next-actions.json"
  },
  {
    id: "live-adapter-approval-pack",
    label: "Live adapter approval pack",
    required: false,
    kind: "file",
    relativePath: "control/live-adapter-approval-pack.json"
  },
  {
    id: "live-adapter-approval-reviews",
    label: "Live adapter approval reviews",
    required: false,
    kind: "matching-files",
    relativePath: "control/live-adapter-approval-reviews",
    prefix: "approval-review-",
    suffix: ".json",
    minimumCount: 1
  },
  {
    id: "live-adapter-approval-review-audit",
    label: "Live adapter approval review audit",
    required: false,
    kind: "file",
    relativePath: "control/live-adapter-approval-review-audit.json"
  },
  {
    id: "live-adapter-dossiers",
    label: "Live adapter target dossiers",
    required: false,
    kind: "matching-files",
    relativePath: "control/live-adapter-dossiers",
    prefix: "live-adapter-dossier-",
    suffix: ".json",
    minimumCount: 1
  },
  {
    id: "live-adapter-cutover-audit",
    label: "Live adapter cutover audit",
    required: false,
    kind: "file",
    relativePath: "control/live-adapter-cutover-audit.json"
  },
  {
    id: "live-adapter-review-session",
    label: "Live adapter review session",
    required: false,
    kind: "file",
    relativePath: "control/live-adapter-review-session.json"
  },
  {
    id: "mutation-dry-runs",
    label: "Mutation dry-run records",
    required: false,
    kind: "matching-files",
    relativePath: "control/mutation-dry-runs",
    prefix: "mutation-dry-run-",
    suffix: ".json",
    minimumCount: 1
  },
  {
    id: "mutation-executions",
    label: "Mutation execution records",
    required: false,
    kind: "matching-files",
    relativePath: "control/mutation-executions",
    prefix: "mutation-execution-",
    suffix: ".json",
    minimumCount: 1
  },
  {
    id: "extraction-results",
    label: "OCR/transcription extraction results",
    required: false,
    kind: "matching-files",
    relativePath: "extractions",
    prefix: "extraction-",
    suffix: ".json",
    minimumCount: 1
  },
  {
    id: "extraction-runner-plans",
    label: "OCR/transcription runner plans",
    required: false,
    kind: "matching-files",
    relativePath: "extractions/plans",
    prefix: "extraction-plan-",
    suffix: ".json",
    minimumCount: 1
  },
  {
    id: "coordination-records",
    label: "Sleep, memory, or mail records",
    required: false,
    kind: "matching-files",
    relativePath: "coordination",
    prefix: "",
    suffix: ".json",
    minimumCount: 1,
    recursive: true,
    excludeDirs: ["hermes"]
  },
  {
    id: "hermes-cron-snapshots",
    label: "Hermes cron snapshots",
    required: false,
    kind: "matching-files",
    relativePath: "coordination/hermes",
    prefix: "hermes-cron-",
    suffix: ".json",
    excludePrefixes: ["hermes-cron-proposal-"],
    minimumCount: 1
  },
  {
    id: "hermes-cron-proposals",
    label: "Hermes cron proposals",
    required: false,
    kind: "matching-files",
    relativePath: "coordination/hermes",
    prefix: "hermes-cron-proposal-",
    suffix: ".json",
    minimumCount: 1
  },
  {
    id: "deployment-snapshots",
    label: "Deployment snapshots",
    required: false,
    kind: "matching-files",
    relativePath: "deployment",
    prefix: "deployment-",
    suffix: ".json",
    minimumCount: 1
  }
];

export async function generateArtifactCheckReport(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; report: ArtifactCheckReport }> {
  const project = slugifyProject(input.project);
  const root = projectDir(input.vaultRoot, project);
  const checks = await Promise.all(ARTIFACT_SPECS.map((spec) => evaluateSpec(input.vaultRoot, root, spec)));
  const missingRequired = checks.filter((check) => check.required && check.status === "missing").length;
  const report: ArtifactCheckReport = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status: missingRequired === 0 ? "passed" : "missing",
    summary: {
      required: checks.filter((check) => check.required).length,
      optional: checks.filter((check) => !check.required).length,
      present: checks.filter((check) => check.status === "present").length,
      missingRequired
    },
    checks
  };

  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "evaluation", "artifact-checks.json", report);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "evaluation",
    "artifact-checks.md",
    renderReport(report)
  );
  return { jsonPath, markdownPath, report };
}

async function evaluateSpec(
  vaultRoot: string,
  root: string,
  spec: ArtifactSpec
): Promise<ArtifactCheckReport["checks"][number]> {
  if (spec.kind === "file") {
    const absolutePath = path.join(root, spec.relativePath);
    const present = await pathExists(absolutePath);
    return {
      id: spec.id,
      label: spec.label,
      required: spec.required,
      path: vaultRelative(vaultRoot, absolutePath),
      status: present ? "present" : "missing"
    };
  }

  const absoluteDir = path.join(root, spec.relativePath);
  const matches = await matchingFiles(absoluteDir, spec);
  return {
    id: spec.id,
    label: spec.label,
    required: spec.required,
    path: vaultRelative(vaultRoot, path.join(absoluteDir, spec.recursive ? `**/${spec.prefix}*${spec.suffix}` : `${spec.prefix}*${spec.suffix}`)),
    status: matches.length >= spec.minimumCount ? "present" : "missing",
    count: matches.length,
    matches: matches.map((filePath) => vaultRelative(vaultRoot, filePath))
  };
}

async function matchingFiles(dir: string, spec: Extract<ArtifactSpec, { kind: "matching-files" }>): Promise<string[]> {
  let entries: Array<string | import("node:fs").Dirent>;
  try {
    entries = spec.recursive ? await fs.readdir(dir, { withFileTypes: true }) : await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  if (spec.recursive) {
    const files: string[] = [];
    for (const entry of entries as import("node:fs").Dirent[]) {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if ((spec.excludeDirs ?? []).includes(entry.name)) {
          continue;
        }
        files.push(...(await matchingFiles(filePath, spec)));
      } else if (matchesSpec(entry.name, spec)) {
        files.push(filePath);
      }
    }
    return files.sort();
  }

  return (entries as string[])
    .filter((name) => matchesSpec(name, spec))
    .sort()
    .map((name) => path.join(dir, name));
}

function matchesSpec(name: string, spec: Extract<ArtifactSpec, { kind: "matching-files" }>): boolean {
  return (
    name.startsWith(spec.prefix) &&
    name.endsWith(spec.suffix) &&
    !(spec.excludePrefixes ?? []).some((prefix) => name.startsWith(prefix)) &&
    !(spec.excludeSuffixes ?? []).some((suffix) => name.endsWith(suffix))
  );
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

function renderReport(report: ArtifactCheckReport): string {
  return [
    "# Artifact Checks",
    "",
    `Project: ${report.project}`,
    `Status: ${report.status}`,
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Required checks: ${report.summary.required}`,
    `- Optional checks: ${report.summary.optional}`,
    `- Present artifacts: ${report.summary.present}`,
    `- Missing required artifacts: ${report.summary.missingRequired}`,
    "",
    "## Checks",
    "",
    "| Id | Required | Status | Count | Path |",
    "| --- | --- | --- | --- | --- |",
    ...report.checks.map(
      (check) =>
        `| ${check.id} | ${check.required ? "yes" : "no"} | ${check.status} | ${check.count ?? "-"} | ${check.path} |`
    ),
    ""
  ].join("\n");
}

function vaultRelative(vaultRoot: string, filePath: string): string {
  return path.relative(vaultRoot, filePath);
}
