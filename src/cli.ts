#!/usr/bin/env node
import path from "node:path";
import { generateArtifactCheckReport } from "./artifactChecks.js";
import { benchmarkSets, materializeBenchmarkPack, parseBenchmarkSet } from "./benchmarkPacks.js";
import { importCiStatus, importCodeRabbitReview } from "./ciImport.js";
import { generateControlReport, recordCheck, recordReview } from "./controlPlane.js";
import { generateConsoleData } from "./consoleData.js";
import { generateConsoleHtml } from "./consoleHtml.js";
import { recordDecision } from "./decisions.js";
import { generateEvaluationPlan, recordEvaluationRun } from "./evaluation.js";
import { markRunStatus, planExecution } from "./execution.js";
import { generateGsd } from "./gsd.js";
import { exportGsd2Bundle, importGsd2Bundle } from "./gsdAdapter.js";
import { generateInfrastructureRegistry } from "./infrastructure.js";
import { draftOpenScorpionActivity, importInfraSnapshot } from "./infraSnapshot.js";
import { importNotebookLmExport } from "./notebooklm.js";
import { defaultVaultRoot } from "./paths.js";
import { recordPlaywrightEvidence } from "./playwrightEvidence.js";
import { generatePlaywrightPlan } from "./playwrightPlan.js";
import { generatePrd } from "./prd.js";
import { assembleDossier, ingestFiles, projectStatus } from "./vault.js";
import { guardWorktrees } from "./worktreeGuard.js";

interface ParsedArgs {
  command?: string;
  positionals: string[];
  options: Map<string, string | true>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command, ...rest] = argv;
  const positionals: string[] = [];
  const options = new Map<string, string | true>();

  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (value?.startsWith("--")) {
      const key = value.slice(2);
      const next = rest[index + 1];
      if (next && !next.startsWith("--")) {
        options.set(key, next);
        index += 1;
      } else {
        options.set(key, true);
      }
    } else if (value) {
      positionals.push(value);
    }
  }

  return { command, positionals, options };
}

function optionString(options: Map<string, string | true>, key: string, fallback: string): string {
  const value = options.get(key);
  return typeof value === "string" ? value : fallback;
}

function usage(): string {
  return [
    "Usage:",
    "  ariadne ingest --project <project> [--notes <text>] [--allow-secret-findings] <files...>",
    "  ariadne assemble --project <project> [--max-chars <number>]",
    "  ariadne prd --project <project> [--from <dossier.md>]",
    "  ariadne notebooklm-import --project <project> --from <export.md>",
    "  ariadne gsd --project <project>",
    "  ariadne gsd2-export --project <project>",
    "  ariadne gsd2-import --project <project> --from <bundle.json>",
    "  ariadne decision --project <project> --title <title> --context <text> --decision <text>",
    "  ariadne execution --project <project> [--task <id>] [--repo <path>]",
    "  ariadne execution-status --project <project> --run <run.json> --status <status>",
    "  ariadne worktree-guard --project <project> --run <run.json> [--apply]",
    "  ariadne playwright --project <project> [--target-url <url>]",
    "  ariadne playwright-evidence --project <project> --target-url <url> --status <status>",
    "  ariadne evaluation --project <project> [--target <name>]",
    "  ariadne evaluation-record --project <project> --plan <plan.json> --scores <D1=80,D2=75> [--evidence <paths>]",
    "  ariadne artifact-checks --project <project>",
    "  ariadne benchmark-pack --set <smoke|realistic|stress|all> [--output <dir>]",
    "  ariadne infra --project <project>",
    "  ariadne infra-snapshot --project <project> --from <manifest.json>",
    "  ariadne openscorpion-draft --project <project> --title <title> --type <type> --evidence <paths>",
    "  ariadne import-ci --project <project> --from <checks.json>",
    "  ariadne import-coderabbit --project <project> --from <review.md>",
    "  ariadne record-check --project <project> --name <name> --status <status> --command <cmd>",
    "  ariadne record-review --project <project> --source <source> --status <status> --summary <text>",
    "  ariadne control --project <project>",
    "  ariadne console-data --project <project>",
    "  ariadne console-html --project <project> [--refresh-data]",
    "  ariadne roadmap --project <project> [--target-url <url>] [--repo <path>]",
    "  ariadne status --project <project>",
    "",
    "Options:",
    "  --vault <path>       Override the vault root. Defaults to ./vault.",
    "  --project <name>     Project slug or name. Defaults to default.",
    "  --sensitivity <val>  public, internal, confidential, or secret for ingested sources.",
    "  --allow-secret-findings  Allow ingest to continue when high-severity hygiene findings are detected.",
    ""
  ].join("\n");
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  const vaultRoot = path.resolve(optionString(parsed.options, "vault", defaultVaultRoot()));
  const project = optionString(parsed.options, "project", "default");

  if (!parsed.command || parsed.command === "help" || parsed.options.has("help")) {
    console.log(usage());
    return;
  }

  if (parsed.command === "ingest") {
    const notes = optionString(parsed.options, "notes", "");
    const records = await ingestFiles(parsed.positionals, {
      project,
      vaultRoot,
      notes: notes || undefined,
      sensitivity: sensitivityOption(parsed.options),
      allowSecretFindings: parsed.options.has("allow-secret-findings")
    });

    for (const record of records) {
      console.log(`Ingested ${record.fileName}`);
      console.log(`  Record: ${record.id}`);
      console.log(`  Evidence: ${record.storedPath}`);
      if (record.extractedTextPath) {
        console.log(`  Extracted: ${record.extractedTextPath}`);
      }
      if (record.handoffPath) {
        console.log(`  Handoff: ${record.handoffPath}`);
      }
    }
    return;
  }

  if (parsed.command === "assemble") {
    const maxChars = Number(optionString(parsed.options, "max-chars", "12000"));
    if (!Number.isFinite(maxChars) || maxChars <= 0) {
      throw new Error("--max-chars must be a positive number.");
    }

    const dossierPath = await assembleDossier({
      project,
      vaultRoot,
      maxCharsPerSource: maxChars
    });
    console.log(`Dossier: ${dossierPath}`);
    return;
  }

  if (parsed.command === "prd") {
    const sourcePath = optionString(parsed.options, "from", "");
    const result = await generatePrd({
      project,
      vaultRoot,
      sourcePath: sourcePath || undefined
    });
    console.log(`PRD JSON: ${result.jsonPath}`);
    console.log(`PRD Markdown: ${result.markdownPath}`);
    console.log(`Requirements: ${result.prd.requirements.length}`);
    console.log(`Ambiguities: ${result.prd.ambiguities.length}`);
    return;
  }

  if (parsed.command === "notebooklm-import") {
    const sourcePath = requiredOption(parsed.options, "from");
    const result = await importNotebookLmExport({ project, vaultRoot, sourcePath });
    console.log(`NotebookLM JSON: ${result.jsonPath}`);
    console.log(`NotebookLM Markdown: ${result.markdownPath}`);
    console.log(`Sections: ${result.imported.sections.length}`);
    console.log(`Citations: ${result.imported.citations.length}`);
    return;
  }

  if (parsed.command === "gsd") {
    const result = await generateGsd({ project, vaultRoot });
    console.log(`GSD JSON: ${result.jsonPath}`);
    console.log(`GSD Tasks: ${result.markdownPath}`);
    console.log(`Verification commands: ${result.commandsPath}`);
    return;
  }

  if (parsed.command === "gsd2-export") {
    const result = await exportGsd2Bundle({ project, vaultRoot });
    console.log(`GSD2 bundle: ${result.jsonPath}`);
    console.log(`GSD2 Markdown: ${result.markdownPath}`);
    console.log(`Tasks: ${result.bundle.tasks.length}`);
    return;
  }

  if (parsed.command === "gsd2-import") {
    const sourcePath = requiredOption(parsed.options, "from");
    const result = await importGsd2Bundle({ project, vaultRoot, sourcePath });
    console.log(`Imported GSD roadmap: ${result.jsonPath}`);
    console.log(`Imported GSD tasks: ${result.markdownPath}`);
    return;
  }

  if (parsed.command === "decision") {
    const result = await recordDecision({
      project,
      vaultRoot,
      title: requiredOption(parsed.options, "title"),
      context: requiredOption(parsed.options, "context"),
      decision: requiredOption(parsed.options, "decision"),
      consequences: splitList(optionString(parsed.options, "consequences", "Decision is now part of the durable project record.")),
      sourceRefs: splitList(optionString(parsed.options, "sources", "manual"))
    });
    console.log(`Decision: ${result.markdownPath}`);
    return;
  }

  if (parsed.command === "execution") {
    const result = await planExecution({
      project,
      vaultRoot,
      taskId: optionString(parsed.options, "task", "all"),
      repoPath: optionString(parsed.options, "repo", "") || undefined
    });
    console.log(`Execution run: ${result.run.id}`);
    console.log(`Execution JSON: ${result.jsonPath}`);
    console.log(`Execution Markdown: ${result.markdownPath}`);
    return;
  }

  if (parsed.command === "execution-status") {
    const runFile = optionString(parsed.options, "run", "");
    const status = optionString(parsed.options, "status", "");
    if (!runFile) {
      throw new Error("--run <run.json> is required.");
    }
    if (status !== "planned" && status !== "running" && status !== "blocked" && status !== "complete") {
      throw new Error("--status must be planned, running, blocked, or complete.");
    }
    const updated = await markRunStatus(vaultRoot, project, runFile, status);
    console.log(`Updated execution run: ${updated}`);
    console.log(`Status: ${status}`);
    return;
  }

  if (parsed.command === "worktree-guard") {
    const result = await guardWorktrees({
      project,
      vaultRoot,
      runFile: requiredOption(parsed.options, "run"),
      apply: parsed.options.has("apply")
    });
    console.log(`Worktree guard: ${result.markdownPath}`);
    console.log(`Status: ${result.report.status}`);
    return;
  }

  if (parsed.command === "playwright") {
    const result = await generatePlaywrightPlan({
      project,
      vaultRoot,
      targetUrl: optionString(parsed.options, "target-url", "http://localhost:3000")
    });
    console.log(`Playwright plan: ${result.markdownPath}`);
    console.log(`Playwright spec: ${result.specPath}`);
    console.log(`Scenarios: ${result.plan.scenarios.length}`);
    return;
  }

  if (parsed.command === "playwright-evidence") {
    const status = optionString(parsed.options, "status", "");
    if (status !== "passed" && status !== "failed" && status !== "skipped") {
      throw new Error("--status must be passed, failed, or skipped.");
    }
    const result = await recordPlaywrightEvidence({
      project,
      vaultRoot,
      targetUrl: requiredOption(parsed.options, "target-url"),
      status,
      tracePath: optionString(parsed.options, "trace", "") || undefined,
      screenshotPath: optionString(parsed.options, "screenshot", "") || undefined,
      notes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`Playwright evidence: ${result.markdownPath}`);
    return;
  }

  if (parsed.command === "evaluation") {
    const result = await generateEvaluationPlan({
      project,
      vaultRoot,
      target: optionString(parsed.options, "target", "") || undefined
    });
    console.log(`Evaluation plan: ${result.markdownPath}`);
    console.log(`Scenarios: ${result.plan.scenarios.length}`);
    return;
  }

  if (parsed.command === "evaluation-record") {
    const result = await recordEvaluationRun({
      project,
      vaultRoot,
      planPath: requiredOption(parsed.options, "plan"),
      target: optionString(parsed.options, "target", "") || undefined,
      operator: optionString(parsed.options, "operator", "") || undefined,
      dimensionScores: parseScores(requiredOption(parsed.options, "scores")),
      evidenceRefs: splitList(optionString(parsed.options, "evidence", "")),
      regressions: splitList(optionString(parsed.options, "regressions", "")),
      recommendations: splitList(optionString(parsed.options, "recommendations", ""))
    });
    console.log(`Evaluation run: ${result.markdownPath}`);
    console.log(`Overall score: ${result.run.overallScore}`);
    return;
  }

  if (parsed.command === "artifact-checks") {
    const result = await generateArtifactCheckReport({ project, vaultRoot });
    console.log(`Artifact checks: ${result.markdownPath}`);
    console.log(`Status: ${result.report.status}`);
    if (result.report.summary.missingRequired > 0) {
      console.log(`Missing required: ${result.report.summary.missingRequired}`);
    }
    return;
  }

  if (parsed.command === "benchmark-pack") {
    const set = parseBenchmarkSet(optionString(parsed.options, "set", ""));
    const outputRoot = path.resolve(optionString(parsed.options, "output", path.join("benchmarks", "source-packs")));
    const sets = set === "all" ? benchmarkSets() : [set];
    for (const benchmarkSet of sets) {
      const result = await materializeBenchmarkPack({ set: benchmarkSet, outputRoot });
      console.log(`Benchmark pack: ${benchmarkSet}`);
      console.log(`  Manifest: ${result.manifestPath}`);
      console.log(`  README: ${result.markdownPath}`);
      console.log(`  Files: ${result.pack.files.length}`);
    }
    return;
  }

  if (parsed.command === "infra") {
    const result = await generateInfrastructureRegistry({ project, vaultRoot });
    console.log(`Infrastructure registry: ${result.jsonPath}`);
    console.log(`Infrastructure plan: ${result.markdownPath}`);
    return;
  }

  if (parsed.command === "infra-snapshot") {
    const kind = optionString(parsed.options, "kind", "manifest");
    if (kind !== "manual" && kind !== "manifest" && kind !== "live_read_only") {
      throw new Error("--kind must be manual, manifest, or live_read_only.");
    }
    const result = await importInfraSnapshot({
      project,
      vaultRoot,
      sourcePath: requiredOption(parsed.options, "from"),
      snapshotKind: kind
    });
    console.log(`Infrastructure snapshot: ${result.markdownPath}`);
    return;
  }

  if (parsed.command === "openscorpion-draft") {
    const result = await draftOpenScorpionActivity({
      project,
      vaultRoot,
      title: requiredOption(parsed.options, "title"),
      activityType: requiredOption(parsed.options, "type"),
      evidenceRefs: splitList(requiredOption(parsed.options, "evidence"))
    });
    console.log(`OpenScorpion activity draft: ${result.markdownPath}`);
    return;
  }

  if (parsed.command === "import-ci") {
    const count = await importCiStatus({
      project,
      vaultRoot,
      sourcePath: requiredOption(parsed.options, "from")
    });
    console.log(`Imported CI checks: ${count}`);
    return;
  }

  if (parsed.command === "import-coderabbit") {
    await importCodeRabbitReview({
      project,
      vaultRoot,
      sourcePath: requiredOption(parsed.options, "from")
    });
    console.log("Imported CodeRabbit review.");
    return;
  }

  if (parsed.command === "record-check") {
    const name = optionString(parsed.options, "name", "");
    const command = optionString(parsed.options, "command", "");
    const status = optionString(parsed.options, "status", "");
    if (!name || !command) {
      throw new Error("--name and --command are required.");
    }
    if (status !== "passed" && status !== "failed" && status !== "skipped") {
      throw new Error("--status must be passed, failed, or skipped.");
    }
    const record = await recordCheck({
      project,
      vaultRoot,
      name,
      command,
      status,
      evidence: optionString(parsed.options, "evidence", "") || undefined
    });
    console.log(`Recorded check: ${record.id}`);
    return;
  }

  if (parsed.command === "record-review") {
    const source = optionString(parsed.options, "source", "");
    const status = optionString(parsed.options, "status", "");
    const summary = optionString(parsed.options, "summary", "");
    if (!summary) {
      throw new Error("--summary is required.");
    }
    if (source !== "human" && source !== "coderabbit" && source !== "ci" && source !== "local") {
      throw new Error("--source must be human, coderabbit, ci, or local.");
    }
    if (
      status !== "approved" &&
      status !== "changes_requested" &&
      status !== "pending" &&
      status !== "failed" &&
      status !== "passed"
    ) {
      throw new Error("--status must be approved, changes_requested, pending, failed, or passed.");
    }
    const record = await recordReview({
      project,
      vaultRoot,
      source,
      status,
      summary,
      evidence: optionString(parsed.options, "evidence", "") || undefined
    });
    console.log(`Recorded review: ${record.id}`);
    return;
  }


  if (parsed.command === "control") {
    const result = await generateControlReport({ project, vaultRoot });
    console.log(`Merge readiness: ${result.markdownPath}`);
    console.log(`Status: ${result.report.status}`);
    if (result.report.missing.length > 0) {
      console.log(`Missing: ${result.report.missing.length}`);
    }
    return;
  }

  if (parsed.command === "console-data") {
    const result = await generateConsoleData({ project, vaultRoot });
    console.log(`Console data: ${result.jsonPath}`);
    console.log(`Sources: ${result.data.summary.sources}`);
    console.log(`Tasks: ${result.data.summary.tasks}`);
    console.log(`Readiness: ${result.data.summary.readinessStatus ?? "unknown"}`);
    return;
  }

  if (parsed.command === "console-html") {
    const result = await generateConsoleHtml({
      project,
      vaultRoot,
      refreshData: parsed.options.has("refresh-data")
    });
    console.log(`Console HTML: ${result.htmlPath}`);
    if (result.dataPath) {
      console.log(`Console data: ${result.dataPath}`);
    }
    console.log(`Readiness: ${result.data.summary.readinessStatus ?? "unknown"}`);
    return;
  }

  if (parsed.command === "roadmap") {
    const prd = await generatePrd({ project, vaultRoot });
    const gsd = await generateGsd({ project, vaultRoot });
    const gsd2 = await exportGsd2Bundle({ project, vaultRoot });
    const execution = await planExecution({
      project,
      vaultRoot,
      repoPath: optionString(parsed.options, "repo", "") || undefined
    });
    const playwright = await generatePlaywrightPlan({
      project,
      vaultRoot,
      targetUrl: optionString(parsed.options, "target-url", "http://localhost:3000")
    });
    const evaluation = await generateEvaluationPlan({
      project,
      vaultRoot,
      target: optionString(parsed.options, "target", "") || undefined
    });
    const infra = await generateInfrastructureRegistry({ project, vaultRoot });
    const control = await generateControlReport({ project, vaultRoot });
    const artifactChecks = await generateArtifactCheckReport({ project, vaultRoot });

    console.log("Roadmap artifacts generated");
    console.log(`  PRD: ${prd.markdownPath}`);
    console.log(`  GSD: ${gsd.markdownPath}`);
    console.log(`  GSD2 bundle: ${gsd2.markdownPath}`);
    console.log(`  Execution: ${execution.markdownPath}`);
    console.log(`  Playwright: ${playwright.markdownPath}`);
    console.log(`  Evaluation: ${evaluation.markdownPath}`);
    console.log(`  Infrastructure: ${infra.markdownPath}`);
    console.log(`  Control: ${control.markdownPath}`);
    console.log(`  Artifact checks: ${artifactChecks.markdownPath}`);
    console.log(`  Readiness: ${control.report.status}`);
    console.log(`  Artifact status: ${artifactChecks.report.status}`);
    return;
  }

  if (parsed.command === "status") {
    const status = await projectStatus(vaultRoot, project);
    console.log(`Project: ${status.project}`);
    console.log(`Directory: ${status.projectDir}`);
    console.log(`Records: ${status.records}`);
    console.log(`Extracted: ${status.extracted}`);
    if (status.latestIngestedAt) {
      console.log(`Latest: ${status.latestIngestedAt}`);
    }
    return;
  }

  throw new Error(`Unknown command: ${parsed.command}\n\n${usage()}`);
}

function requiredOption(options: Map<string, string | true>, key: string): string {
  const value = optionString(options, key, "");
  if (!value) {
    throw new Error(`--${key} is required.`);
  }
  return value;
}

function splitList(value: string): string[] {
  return value
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseScores(value: string): Array<{ id: string; score: number; notes: string }> {
  return splitList(value).map((item) => {
    const [id, rawScore] = item.split("=");
    const score = Number(rawScore);
    if (!id || !Number.isFinite(score)) {
      throw new Error("--scores must look like D1=80,D2=75.");
    }
    return { id: id.trim(), score, notes: "manual evaluation score" };
  });
}

function sensitivityOption(
  options: Map<string, string | true>
): "public" | "internal" | "confidential" | "secret" | undefined {
  const value = options.get("sensitivity");
  if (value === undefined) return undefined;
  if (value === "public" || value === "internal" || value === "confidential" || value === "secret") {
    return value;
  }
  throw new Error("--sensitivity must be public, internal, confidential, or secret.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
