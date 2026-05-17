#!/usr/bin/env node
import path from "node:path";
import { decideApproval, requestApproval } from "./approvals.js";
import { generateArtifactCheckReport } from "./artifactChecks.js";
import { runBenchmarkPack } from "./benchmarkRun.js";
import { generateBehaviorCheckReport } from "./behaviorChecks.js";
import { benchmarkSets, materializeBenchmarkPack, parseBenchmarkSet } from "./benchmarkPacks.js";
import { importCiStatus, importCodeRabbitReview } from "./ciImport.js";
import { generateControlReport, recordCheck, recordReview } from "./controlPlane.js";
import { generateConsoleData } from "./consoleData.js";
import { generateConsoleBrowserCheckReport } from "./consoleBrowserChecks.js";
import { generateConsoleHtml } from "./consoleHtml.js";
import { generateConsoleVisualCheckReport } from "./consoleVisualChecks.js";
import { recordAgentLease, recordAgentMail, recordMemoryProposal, recordSleepRoutine } from "./coordination.js";
import { recordDecision } from "./decisions.js";
import {
  collectSshDeploymentSnapshot,
  deploymentSystemOption,
  importDeploymentSnapshot,
  liveDeploymentSystemOption
} from "./deploymentAdapters.js";
import { planDeploymentMutation } from "./deploymentMutation.js";
import { generateEvaluationPlan, recordEvaluationRun } from "./evaluation.js";
import { generateEvaluationTrendReport } from "./evaluationTrends.js";
import { markRunStatus, planExecution } from "./execution.js";
import { importExtractionResult } from "./extractionResults.js";
import { extractionRunnerOption, planExtractionRunner } from "./extractionRunnerPlan.js";
import { exportGbrainBundle, importGbrainReport } from "./gbrainAdapter.js";
import { collectGithubSnapshot, importGithubSnapshot } from "./githubAdapter.js";
import { githubMutationActionOption, planGithubMutation } from "./githubMutation.js";
import { generateGsd } from "./gsd.js";
import { exportGsd2Bundle, importGsd2Bundle } from "./gsdAdapter.js";
import { gsd2MutationModeOption, planGsd2Mutation } from "./gsdMutation.js";
import { collectGsd2ProcessSnapshot } from "./gsdProcess.js";
import { generateHealerProposal } from "./healerProposals.js";
import { generateHermesCronProposal, importHermesCronSnapshot } from "./hermesCron.js";
import { hermesCronMutationActionOption, planHermesCronMutation } from "./hermesMutation.js";
import { generateInfrastructureRegistry } from "./infrastructure.js";
import { draftOpenScorpionActivity, importInfraSnapshot } from "./infraSnapshot.js";
import { collectLocalInfraSnapshot, collectSshInfraSnapshot } from "./liveInventory.js";
import { generateLiveAdapterApprovalPack, liveAdapterApprovalTargetOption } from "./liveAdapterApprovalPack.js";
import {
  liveAdapterApprovalReviewStatusOption,
  liveAdapterApprovalReviewTargetOption,
  recordLiveAdapterApprovalReview
} from "./liveAdapterApprovalReview.js";
import { generateLiveAdapterApprovalReviewAudit } from "./liveAdapterApprovalReviewAudit.js";
import { generateLiveAdapterCutoverAudit } from "./liveAdapterCutoverAudit.js";
import { generateLiveAdapterNextActions } from "./liveAdapterNextActions.js";
import { generateLiveAdapterReadiness } from "./liveAdapterReadiness.js";
import { generateLiveAdapterReviewSession } from "./liveAdapterReviewSession.js";
import { generateLiveAdapterTargetDossier, liveAdapterDossierTargetOption } from "./liveAdapterTargetDossier.js";
import { importNotebookLmExport } from "./notebooklm.js";
import { notebookLmMutationActionOption, planNotebookLmMutation } from "./notebookLmMutation.js";
import { mutationTargetOption, planMutationReadiness } from "./mutationReadiness.js";
import { generateMutationReadinessAudit } from "./mutationReadinessAudit.js";
import { runMutationDryRun } from "./mutationDryRun.js";
import { runMutationExecution } from "./mutationExecute.js";
import {
  openScorpionMutationActionOption,
  openScorpionMutationRouteOption,
  planOpenScorpionMutation
} from "./openScorpionMutation.js";
import { defaultVaultRoot } from "./paths.js";
import { recordPlaywrightEvidence } from "./playwrightEvidence.js";
import { generatePlaywrightPlan } from "./playwrightPlan.js";
import { generatePrd } from "./prd.js";
import { generateRecoveryReport } from "./recovery.js";
import { captureTargetAppEvidence, waitUntilOption } from "./targetAppCapture.js";
import { runTargetMutationExecution, targetForMutationExecutionCommand } from "./targetMutationExecute.js";
import { generateUsageMetricsReport, importUsageMetrics } from "./usageMetrics.js";
import { assembleDossier, ingestFiles, projectStatus } from "./vault.js";
import { guardWorktrees } from "./worktreeGuard.js";

interface ParsedArgs {
  command?: string;
  positionals: string[];
  options: Map<string, string | true>;
}

function parseArgs(argv: string[]): ParsedArgs {
  let command: string | undefined;
  const positionals: string[] = [];
  const options = new Map<string, string | true>();

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value?.startsWith("--")) {
      const key = value.slice(2);
      const next = argv[index + 1];
      if (next && !next.startsWith("--")) {
        options.set(key, next);
        index += 1;
      } else {
        options.set(key, true);
      }
    } else if (value && !command) {
      command = value;
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
    "  ariadne extraction-import --project <project> --record <id> --from <text.md> --kind <ocr|transcription|pdf-text|visual-description> --tool <name> [--confidence <0-1>] [--notes <text>]",
    "  ariadne extraction-plan --project <project> --record <id> --tool <name> --host <name> [--runner <local|ssh|manual|mac|dgx-spark|proxmox|generic>] [--kind <ocr|transcription|pdf-text|visual-description>] [--notes <text>]",
    "  ariadne assemble --project <project> [--max-chars <number>]",
    "  ariadne prd --project <project> [--from <dossier.md>]",
    "  ariadne notebooklm-import --project <project> --from <export.md>",
    "  ariadne notebooklm-mutation-plan --project <project> --notebook <id> --action <create-source|refresh-source|generate-summary|export-notes> --scope <text> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> [--approval <id|json>] [--risk <low|medium|high>] [--evidence <paths>] [--notes <text>]",
    "  ariadne gsd --project <project>",
    "  ariadne gsd2-export --project <project>",
    "  ariadne gsd2-import --project <project> --from <bundle.json>",
    "  ariadne gsd2-process --project <project> [--binary <path-or-name>]",
    "  ariadne gsd2-mutation-plan --project <project> --task <id> --mode <headless|auto|worktree> --scope <text> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> [--package <name>] [--approval <id|json>] [--risk <low|medium|high>] [--evidence <paths>] [--notes <text>]",
    "  ariadne decision --project <project> --title <title> --context <text> --decision <text>",
    "  ariadne execution --project <project> [--task <id>] [--repo <path>]",
    "  ariadne execution-status --project <project> --run <run.json> --status <status>",
    "  ariadne worktree-guard --project <project> --run <run.json> [--apply]",
    "  ariadne playwright --project <project> [--target-url <url>]",
    "  ariadne playwright-capture --project <project> --target-url <url> [--selector <css-or-text>] [--width <number>] [--height <number>] [--wait-until <load|domcontentloaded|networkidle>] [--wait-ms <number>]",
    "  ariadne playwright-evidence --project <project> --target-url <url> --status <status>",
    "  ariadne healer-proposal --project <project> [--evidence <playwright.json>] [--notes <text>]",
    "  ariadne evaluation --project <project> [--target <name>]",
    "  ariadne evaluation-record --project <project> --plan <plan.json> --scores <D1=80,D2=75> [--evidence <paths>]",
    "  ariadne evaluation-trends --project <project>",
    "  ariadne usage-import --project <project> --from <usage.json> [--source <source>]",
    "  ariadne usage-report --project <project>",
    "  ariadne behavior-checks --project <project> [--approved-fixture <review.json|review.md>]",
    "  ariadne gbrain-export --project <project>",
    "  ariadne gbrain-report-import --project <project> --from <report.json>",
    "  ariadne github-snapshot --project <project> (--from <snapshot.json> | --repo <owner/name> [--pr <number>] [--limit <number>])",
    "  ariadne github-mutation-plan --project <project> --repo <owner/name> --action <merge-pr|rerun-failed-run> [--pr <number>] [--run-id <id>] --auth-evidence <paths> [--approval <id|json>] [--risk <low|medium|high>] [--evidence <paths>] [--notes <text>]",
    "  ariadne sleep-record --project <project> --scope <scope> --summary <text> [--evidence <paths>] [--next <items>]",
    "  ariadne memory-proposal --project <project> --title <title> --proposal <text> [--evidence <paths>]",
    "  ariadne agent-mail --project <project> --from <agent> --to <agent> --subject <text> --body <text> [--task <id>] [--run <id>]",
    "  ariadne agent-lease --project <project> --agent <agent> --resource <name> --status <status> [--task <id>] [--run <id>] [--notes <text>]",
    "  ariadne hermes-cron-import --project <project> --from <snapshot.json> [--host <id>]",
    "  ariadne hermes-cron-proposal --project <project> [--scope <name>]",
    "  ariadne hermes-cron-mutation-plan --project <project> --action <create|update|enable|disable|delete> --job <id> --scope <text> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> [--host <id>] [--approval <id|json>] [--risk <low|medium|high>] [--evidence <paths>] [--notes <text>]",
    "  ariadne deployment-snapshot --project <project> --from <snapshot.json> [--system <system>]",
    "  ariadne deployment-live-ssh --project <project> --system <proxmox|truenas|dgx-spark|mac> --host <id> --target <ssh-target> [--ssh-binary <path>] [--notes <text>]",
    "  ariadne deployment-mutation-plan --project <project> --system <proxmox|truenas|dgx-spark|mac> --host <id> --scope <text> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> [--approval <id|json>] [--risk <low|medium|high>] [--evidence <paths>] [--notes <text>]",
    "  ariadne artifact-checks --project <project>",
    "  ariadne benchmark-pack --set <smoke|realistic|stress|all> [--output <dir>]",
    "  ariadne benchmark-run --project <project> --set <smoke|realistic|stress|all> [--pack-root <dir>] [--target-url <url>]",
    "  ariadne infra --project <project>",
    "  ariadne infra-snapshot --project <project> --from <manifest.json>",
    "  ariadne infra-live-local --project <project> [--notes <text>]",
    "  ariadne infra-live-ssh --project <project> --host <id> --target <ssh-target> [--ssh-binary <path>] [--notes <text>]",
    "  ariadne openscorpion-draft --project <project> --title <title> --type <type> --evidence <paths>",
    "  ariadne openscorpion-mutation-plan --project <project> --activity <id> --type <type> --action <submit-activity|update-activity|withdraw-activity> --route <governed|staging> --scope <text> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> [--approval <id|json>] [--risk <low|medium|high>] [--evidence <paths>] [--notes <text>]",
    "  ariadne import-ci --project <project> --from <checks.json>",
    "  ariadne import-coderabbit --project <project> --from <review.md>",
    "  ariadne record-check --project <project> --name <name> --status <status> --command <cmd>",
    "  ariadne record-review --project <project> --source <source> --status <status> --summary <text>",
    "  ariadne approval-request --project <project> --by <name> --target <system> --action <text> --risk <low|medium|high> --reason <text> --rollback <text> [--evidence <paths>]",
    "  ariadne approval-decision --project <project> --approval <id|json> --status <approved|rejected|expired> --by <name> [--notes <text>]",
    "  ariadne mutation-readiness --project <project> --target <target> --scope <text> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> [--approval <id|json>] [--risk <low|medium|high>] [--evidence <paths>] [--notes <text>]",
    "  ariadne mutation-readiness-audit --project <project>",
    "  ariadne live-adapter-readiness --project <project>",
    "  ariadne live-adapter-next-actions --project <project>",
    "  ariadne live-adapter-approval-pack --project <project> [--target <all|github|deployment|hermes-cron|openscorpion|gsd2|notebooklm>]",
    "  ariadne live-adapter-approval-review --project <project> --target <target> --by <operator> --status <accepted|needs_changes|rejected> --evidence <paths> [--packet <path>] [--notes <text>]",
    "  ariadne live-adapter-approval-review-audit --project <project> [--packet <path>]",
    "  ariadne live-adapter-dossier --project <project> --target <github|deployment|hermes-cron|openscorpion|gsd2|notebooklm>",
    "  ariadne live-adapter-cutover-audit --project <project>",
    "  ariadne live-adapter-review-session --project <project>",
    "  ariadne mutation-dry-run --project <project> --plan <id|json> [--timeout-ms <ms>]",
    "  ariadne mutation-execute --project <project> --plan <id|json> --confirm-plan <id> [--timeout-ms <ms>]",
    "  ariadne target-mutation-execute --project <project> --target <target> --plan <id|json> --confirm-plan <id> [--timeout-ms <ms>]",
    "  ariadne github-mutation-execute --project <project> --plan <id|json> --confirm-plan <id> [--timeout-ms <ms>]",
    "  ariadne deployment-mutation-execute --project <project> --plan <id|json> --confirm-plan <id> [--timeout-ms <ms>]",
    "  ariadne hermes-cron-mutation-execute --project <project> --plan <id|json> --confirm-plan <id> [--timeout-ms <ms>]",
    "  ariadne openscorpion-mutation-execute --project <project> --plan <id|json> --confirm-plan <id> [--timeout-ms <ms>]",
    "  ariadne gsd2-mutation-execute --project <project> --plan <id|json> --confirm-plan <id> [--timeout-ms <ms>]",
    "  ariadne notebooklm-mutation-execute --project <project> --plan <id|json> --confirm-plan <id> [--timeout-ms <ms>]",
    "  ariadne control --project <project>",
    "  ariadne recovery-report --project <project>",
    "  ariadne console-data --project <project>",
    "  ariadne console-html --project <project> [--refresh-data]",
    "  ariadne console-visual-checks --project <project> [--html <index.html>]",
    "  ariadne console-browser-checks --project <project> [--html <index.html>] [--width <px>] [--height <px>]",
    "  ariadne roadmap --project <project> [--target-url <url>] [--repo <path>]",
    "  ariadne status --project <project>",
    "",
    "Options:",
    "  --vault <path>       Override the vault root. Defaults to ./vault.",
    "  --project <name>     Project slug or name. Defaults to default.",
    "  --sensitivity <val>  public, internal, confidential, or secret for ingested sources.",
    "  --allow-secret-findings  Allow ingest to continue when high-severity hygiene findings are detected.",
    "  --system <system>   Deployment snapshot system. Defaults to generic.",
    "  --notes <text>      Optional lease notes for agent-lease.",
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

  if (parsed.command === "extraction-import") {
    const result = await importExtractionResult({
      project,
      vaultRoot,
      recordId: requiredOption(parsed.options, "record"),
      sourcePath: requiredOption(parsed.options, "from"),
      extractionKind: extractionKindOption(parsed.options),
      tool: requiredOption(parsed.options, "tool"),
      confidence: optionalDecimal(parsed.options, "confidence"),
      notes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`Extraction result: ${result.markdownPath}`);
    console.log(`Source record: ${result.result.sourceRecordId}`);
    console.log(`Extracted text: ${result.result.extractedTextPath}`);
    return;
  }

  if (parsed.command === "extraction-plan") {
    const runnerValue = parsed.options.get("runner");
    if (runnerValue === true) {
      throw new Error("--runner requires a value.");
    }
    const result = await planExtractionRunner({
      project,
      vaultRoot,
      recordId: requiredOption(parsed.options, "record"),
      tool: requiredOption(parsed.options, "tool"),
      host: requiredOption(parsed.options, "host"),
      runner: runnerValue ? extractionRunnerOption(runnerValue) : "manual",
      extractionKind: optionalExtractionKindOption(parsed.options),
      notes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`Extraction runner plan: ${result.markdownPath}`);
    console.log(`Record: ${result.plan.sourceRecordId}`);
    console.log(`Extraction kind: ${result.plan.extractionKind}`);
    console.log(`Runner: ${result.plan.runner}`);
    console.log(`Host: ${result.plan.host}`);
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

  if (parsed.command === "notebooklm-mutation-plan") {
    const result = await planNotebookLmMutation({
      project,
      vaultRoot,
      notebook: requiredOption(parsed.options, "notebook"),
      action: notebookLmMutationActionOption(requiredOption(parsed.options, "action")),
      scope: requiredOption(parsed.options, "scope"),
      authEvidenceRefs: splitList(requiredOption(parsed.options, "auth-evidence")),
      evidenceRefs: splitList(optionString(parsed.options, "evidence", "")),
      dryRunCommand: requiredOption(parsed.options, "dry-run"),
      liveCommand: requiredOption(parsed.options, "live-command"),
      postVerificationCommand: requiredOption(parsed.options, "post-verify"),
      rollback: requiredOption(parsed.options, "rollback"),
      approvalRef: optionString(parsed.options, "approval", "") || undefined,
      risk: approvalRiskOption(parsed.options, "medium"),
      notes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`NotebookLM mutation plan: ${result.markdownPath}`);
    console.log(`Status: ${result.plan.status}`);
    console.log(`Execute: ${result.plan.execute}`);
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

  if (parsed.command === "gsd2-process") {
    const binaryOption = parsed.options.get("binary");
    if (binaryOption === true) {
      throw new Error("--binary requires a value.");
    }
    const result = await collectGsd2ProcessSnapshot({
      project,
      vaultRoot,
      binary: typeof binaryOption === "string" && binaryOption.trim() ? binaryOption : undefined
    });
    console.log(`GSD2 process snapshot: ${result.markdownPath}`);
    console.log(`Version: ${result.snapshot.version}`);
    console.log(`Mode: ${result.snapshot.mode}`);
    return;
  }

  if (parsed.command === "gsd2-mutation-plan") {
    const result = await planGsd2Mutation({
      project,
      vaultRoot,
      task: requiredOption(parsed.options, "task"),
      mode: gsd2MutationModeOption(requiredOption(parsed.options, "mode")),
      packageName: optionString(parsed.options, "package", "") || undefined,
      scope: requiredOption(parsed.options, "scope"),
      authEvidenceRefs: splitList(requiredOption(parsed.options, "auth-evidence")),
      evidenceRefs: splitList(optionString(parsed.options, "evidence", "")),
      dryRunCommand: requiredOption(parsed.options, "dry-run"),
      liveCommand: requiredOption(parsed.options, "live-command"),
      postVerificationCommand: requiredOption(parsed.options, "post-verify"),
      rollback: requiredOption(parsed.options, "rollback"),
      approvalRef: optionString(parsed.options, "approval", "") || undefined,
      risk: approvalRiskOption(parsed.options, "medium"),
      notes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`GSD2 mutation plan: ${result.markdownPath}`);
    console.log(`Status: ${result.plan.status}`);
    console.log(`Execute: ${result.plan.execute}`);
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

  if (parsed.command === "playwright-capture") {
    const result = await captureTargetAppEvidence({
      project,
      vaultRoot,
      targetUrl: requiredOption(parsed.options, "target-url"),
      selector: optionString(parsed.options, "selector", "") || undefined,
      width: optionalNumber(parsed.options, "width"),
      height: optionalNumber(parsed.options, "height"),
      waitUntil: waitUntilOption(optionString(parsed.options, "wait-until", "")),
      waitMs: optionalNumber(parsed.options, "wait-ms"),
      notes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`Playwright capture evidence: ${result.markdownPath}`);
    console.log(`Status: ${result.evidence.status}`);
    if (result.evidence.screenshotPath) {
      console.log(`Screenshot: ${result.evidence.screenshotPath}`);
    }
    if (result.evidence.tracePath) {
      console.log(`Trace: ${result.evidence.tracePath}`);
    }
    return;
  }

  if (parsed.command === "healer-proposal") {
    const result = await generateHealerProposal({
      project,
      vaultRoot,
      evidencePath: optionString(parsed.options, "evidence", "") || undefined,
      notes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`Healer proposal: ${result.markdownPath}`);
    console.log(`Evidence: ${result.proposal.evidenceRecordId}`);
    console.log(`Actions: ${result.proposal.proposedActions.length}`);
    console.log(`Status: ${result.proposal.status}`);
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

  if (parsed.command === "evaluation-trends") {
    const result = await generateEvaluationTrendReport({ project, vaultRoot });
    console.log(`Evaluation trends: ${result.markdownPath}`);
    console.log(`Status: ${result.report.status}`);
    console.log(`Runs: ${result.report.runCount}`);
    if (result.report.delta !== undefined) {
      console.log(`Delta: ${result.report.delta}`);
    }
    return;
  }

  if (parsed.command === "usage-import") {
    const source = usageSourceOption(parsed.options);
    const records = await importUsageMetrics({
      project,
      vaultRoot,
      sourcePath: requiredOption(parsed.options, "from"),
      source
    });
    console.log(`Imported usage metrics: ${records.length}`);
    return;
  }

  if (parsed.command === "usage-report") {
    const result = await generateUsageMetricsReport({ project, vaultRoot });
    console.log(`Usage report: ${result.markdownPath}`);
    console.log(`Records: ${result.report.recordCount}`);
    console.log(`Total tokens: ${result.report.totalTokens}`);
    console.log(`Cost USD: ${result.report.totalCostUsd.toFixed(4)}`);
    return;
  }

  if (parsed.command === "behavior-checks") {
    const result = await generateBehaviorCheckReport({
      project,
      vaultRoot,
      approvedFixturePath: optionString(parsed.options, "approved-fixture", "") || undefined
    });
    console.log(`Behavior checks: ${result.markdownPath}`);
    console.log(`Status: ${result.report.status}`);
    return;
  }

  if (parsed.command === "gbrain-export") {
    const result = await exportGbrainBundle({ project, vaultRoot });
    console.log(`GBrain export: ${result.markdownPath}`);
    console.log(`Documents: ${result.bundle.documents.length}`);
    return;
  }

  if (parsed.command === "gbrain-report-import") {
    const result = await importGbrainReport({
      project,
      vaultRoot,
      sourcePath: requiredOption(parsed.options, "from")
    });
    console.log(`GBrain report: ${result.markdownPath}`);
    console.log(`Results: ${result.report.resultCount}`);
    return;
  }

  if (parsed.command === "github-snapshot") {
    const sourcePath = optionString(parsed.options, "from", "");
    const repository = optionString(parsed.options, "repo", "");
    const pullRequest = optionalNumber(parsed.options, "pr");
    const limit = optionalNumber(parsed.options, "limit");
    const result = sourcePath
      ? await importGithubSnapshot({ project, vaultRoot, sourcePath, repository: repository || undefined })
      : await collectGithubSnapshot({
          project,
          vaultRoot,
          repository: requiredOption(parsed.options, "repo"),
          pullRequest,
          limit
        });
    console.log(`GitHub snapshot: ${result.markdownPath}`);
    console.log(`Pull requests: ${result.snapshot.summary.pullRequests}`);
    console.log(`Checks: ${result.snapshot.summary.checks}`);
    return;
  }

  if (parsed.command === "github-mutation-plan") {
    const result = await planGithubMutation({
      project,
      vaultRoot,
      repository: requiredOption(parsed.options, "repo"),
      action: githubMutationActionOption(requiredOption(parsed.options, "action")),
      pullRequest: optionalNumber(parsed.options, "pr"),
      runId: optionString(parsed.options, "run-id", "") || undefined,
      authEvidenceRefs: splitList(requiredOption(parsed.options, "auth-evidence")),
      evidenceRefs: splitList(optionString(parsed.options, "evidence", "")),
      approvalRef: optionString(parsed.options, "approval", "") || undefined,
      risk: approvalRiskOption(parsed.options, "medium"),
      notes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`GitHub mutation plan: ${result.markdownPath}`);
    console.log(`Status: ${result.plan.status}`);
    console.log(`Execute: ${result.plan.execute}`);
    return;
  }

  if (parsed.command === "sleep-record") {
    const result = await recordSleepRoutine({
      project,
      vaultRoot,
      scope: requiredOption(parsed.options, "scope"),
      summary: requiredOption(parsed.options, "summary"),
      evidenceRefs: splitList(optionString(parsed.options, "evidence", "")),
      nextActions: splitList(optionString(parsed.options, "next", ""))
    });
    console.log(`Sleep routine: ${result.markdownPath}`);
    return;
  }

  if (parsed.command === "memory-proposal") {
    const result = await recordMemoryProposal({
      project,
      vaultRoot,
      title: requiredOption(parsed.options, "title"),
      proposal: requiredOption(parsed.options, "proposal"),
      evidenceRefs: splitList(optionString(parsed.options, "evidence", ""))
    });
    console.log(`Memory proposal: ${result.markdownPath}`);
    return;
  }

  if (parsed.command === "agent-mail") {
    const result = await recordAgentMail({
      project,
      vaultRoot,
      from: requiredOption(parsed.options, "from"),
      to: requiredOption(parsed.options, "to"),
      subject: requiredOption(parsed.options, "subject"),
      body: requiredOption(parsed.options, "body"),
      taskId: optionString(parsed.options, "task", "") || undefined,
      runId: optionString(parsed.options, "run", "") || undefined
    });
    console.log(`Agent mail: ${result.markdownPath}`);
    return;
  }

  if (parsed.command === "agent-lease") {
    const status = agentLeaseStatusOption(parsed.options);
    const result = await recordAgentLease({
      project,
      vaultRoot,
      agent: requiredOption(parsed.options, "agent"),
      resource: requiredOption(parsed.options, "resource"),
      status,
      taskId: optionString(parsed.options, "task", "") || undefined,
      runId: optionString(parsed.options, "run", "") || undefined,
      notes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`Agent lease: ${result.markdownPath}`);
    return;
  }

  if (parsed.command === "hermes-cron-import") {
    const result = await importHermesCronSnapshot({
      project,
      vaultRoot,
      sourcePath: requiredOption(parsed.options, "from"),
      host: optionString(parsed.options, "host", "") || undefined
    });
    console.log(`Hermes cron snapshot: ${result.markdownPath}`);
    console.log(`Jobs: ${result.snapshot.summary.jobs}`);
    console.log(`Mode: ${result.snapshot.mode}`);
    return;
  }

  if (parsed.command === "hermes-cron-proposal") {
    const result = await generateHermesCronProposal({
      project,
      vaultRoot,
      scope: optionString(parsed.options, "scope", "") || undefined
    });
    console.log(`Hermes cron proposal: ${result.markdownPath}`);
    console.log(`Snapshots: ${result.proposal.summary.snapshots}`);
    console.log(`Proposed actions: ${result.proposal.summary.proposedActions}`);
    console.log(`Mode: ${result.proposal.mode}`);
    return;
  }

  if (parsed.command === "hermes-cron-mutation-plan") {
    const result = await planHermesCronMutation({
      project,
      vaultRoot,
      action: hermesCronMutationActionOption(requiredOption(parsed.options, "action")),
      job: requiredOption(parsed.options, "job"),
      host: optionString(parsed.options, "host", "") || undefined,
      scope: requiredOption(parsed.options, "scope"),
      authEvidenceRefs: splitList(requiredOption(parsed.options, "auth-evidence")),
      evidenceRefs: splitList(optionString(parsed.options, "evidence", "")),
      dryRunCommand: requiredOption(parsed.options, "dry-run"),
      liveCommand: requiredOption(parsed.options, "live-command"),
      postVerificationCommand: requiredOption(parsed.options, "post-verify"),
      rollback: requiredOption(parsed.options, "rollback"),
      approvalRef: optionString(parsed.options, "approval", "") || undefined,
      risk: approvalRiskOption(parsed.options, "medium"),
      notes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`Hermes cron mutation plan: ${result.markdownPath}`);
    console.log(`Status: ${result.plan.status}`);
    console.log(`Execute: ${result.plan.execute}`);
    return;
  }

  if (parsed.command === "deployment-snapshot") {
    const result = await importDeploymentSnapshot({
      project,
      vaultRoot,
      sourcePath: requiredOption(parsed.options, "from"),
      system: deploymentSystemOption(optionString(parsed.options, "system", "generic"))
    });
    console.log(`Deployment snapshot: ${result.markdownPath}`);
    console.log(`System: ${result.snapshot.system}`);
    return;
  }

  if (parsed.command === "deployment-live-ssh") {
    const result = await collectSshDeploymentSnapshot({
      project,
      vaultRoot,
      system: liveDeploymentSystemOption(requiredOption(parsed.options, "system")),
      hostId: requiredOption(parsed.options, "host"),
      target: requiredOption(parsed.options, "target"),
      sshBinary: optionString(parsed.options, "ssh-binary", "") || undefined,
      notes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`Live SSH deployment snapshot: ${result.markdownPath}`);
    console.log(`Source infrastructure snapshot: ${result.infraSnapshotPath}`);
    console.log(`System: ${result.snapshot.system}`);
    console.log(`Host: ${String(result.snapshot.summary.host ?? "unknown")}`);
    console.log(`Mode: ${result.snapshot.mode}`);
    return;
  }

  if (parsed.command === "deployment-mutation-plan") {
    const result = await planDeploymentMutation({
      project,
      vaultRoot,
      system: liveDeploymentSystemOption(requiredOption(parsed.options, "system")),
      host: requiredOption(parsed.options, "host"),
      scope: requiredOption(parsed.options, "scope"),
      authEvidenceRefs: splitList(requiredOption(parsed.options, "auth-evidence")),
      evidenceRefs: splitList(optionString(parsed.options, "evidence", "")),
      dryRunCommand: requiredOption(parsed.options, "dry-run"),
      liveCommand: requiredOption(parsed.options, "live-command"),
      postVerificationCommand: requiredOption(parsed.options, "post-verify"),
      rollback: requiredOption(parsed.options, "rollback"),
      approvalRef: optionString(parsed.options, "approval", "") || undefined,
      risk: approvalRiskOption(parsed.options, "medium"),
      notes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`Deployment mutation plan: ${result.markdownPath}`);
    console.log(`Status: ${result.plan.status}`);
    console.log(`Execute: ${result.plan.execute}`);
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

  if (parsed.command === "benchmark-run") {
    const set = parseBenchmarkSet(optionString(parsed.options, "set", ""));
    const sets = set === "all" ? benchmarkSets() : [set];
    for (const benchmarkSet of sets) {
      const result = await runBenchmarkPack({
        project: sets.length === 1 ? project : `${project}-${benchmarkSet}`,
        vaultRoot,
        set: benchmarkSet,
        packRoot: optionString(parsed.options, "pack-root", "") || undefined,
        targetUrl: optionString(parsed.options, "target-url", "") || undefined
      });
      console.log(`Benchmark run: ${benchmarkSet}`);
      console.log(`  Report: ${result.markdownPath}`);
      console.log(`  Status: ${result.run.status}`);
      console.log(`  Failed steps: ${result.run.summary.failed}`);
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

  if (parsed.command === "infra-live-local") {
    const result = await collectLocalInfraSnapshot({
      project,
      vaultRoot,
      notes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`Live read-only infrastructure snapshot: ${result.markdownPath}`);
    console.log(`Collector: ${String(result.snapshot.summary.collector ?? "unknown")}`);
    console.log(`Mode: ${result.snapshot.snapshotKind}`);
    return;
  }

  if (parsed.command === "infra-live-ssh") {
    const result = await collectSshInfraSnapshot({
      project,
      vaultRoot,
      hostId: requiredOption(parsed.options, "host"),
      target: requiredOption(parsed.options, "target"),
      sshBinary: optionString(parsed.options, "ssh-binary", "") || undefined,
      notes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`Live SSH read-only infrastructure snapshot: ${result.markdownPath}`);
    console.log(`Host: ${String(result.snapshot.summary.host ?? "unknown")}`);
    console.log(`Collector: ${String(result.snapshot.summary.collector ?? "unknown")}`);
    console.log(`Mode: ${result.snapshot.snapshotKind}`);
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

  if (parsed.command === "openscorpion-mutation-plan") {
    const result = await planOpenScorpionMutation({
      project,
      vaultRoot,
      activity: requiredOption(parsed.options, "activity"),
      activityType: requiredOption(parsed.options, "type"),
      action: openScorpionMutationActionOption(requiredOption(parsed.options, "action")),
      route: openScorpionMutationRouteOption(requiredOption(parsed.options, "route")),
      scope: requiredOption(parsed.options, "scope"),
      authEvidenceRefs: splitList(requiredOption(parsed.options, "auth-evidence")),
      evidenceRefs: splitList(optionString(parsed.options, "evidence", "")),
      dryRunCommand: requiredOption(parsed.options, "dry-run"),
      liveCommand: requiredOption(parsed.options, "live-command"),
      postVerificationCommand: requiredOption(parsed.options, "post-verify"),
      rollback: requiredOption(parsed.options, "rollback"),
      approvalRef: optionString(parsed.options, "approval", "") || undefined,
      risk: approvalRiskOption(parsed.options, "medium"),
      notes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`OpenScorpion mutation plan: ${result.markdownPath}`);
    console.log(`Status: ${result.plan.status}`);
    console.log(`Execute: ${result.plan.execute}`);
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

  if (parsed.command === "approval-request") {
    const result = await requestApproval({
      project,
      vaultRoot,
      requestedBy: requiredOption(parsed.options, "by"),
      target: requiredOption(parsed.options, "target"),
      action: requiredOption(parsed.options, "action"),
      risk: approvalRiskOption(parsed.options),
      reason: requiredOption(parsed.options, "reason"),
      rollback: requiredOption(parsed.options, "rollback"),
      evidenceRefs: splitList(optionString(parsed.options, "evidence", ""))
    });
    console.log(`Approval request: ${result.markdownPath}`);
    console.log(`Status: ${result.record.status}`);
    console.log(`Risk: ${result.record.risk}`);
    return;
  }

  if (parsed.command === "approval-decision") {
    const result = await decideApproval({
      project,
      vaultRoot,
      approval: requiredOption(parsed.options, "approval"),
      status: approvalDecisionStatusOption(parsed.options),
      decisionBy: requiredOption(parsed.options, "by"),
      decisionNotes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`Approval decision: ${result.markdownPath}`);
    console.log(`Status: ${result.record.status}`);
    return;
  }

  if (parsed.command === "mutation-readiness") {
    const result = await planMutationReadiness({
      project,
      vaultRoot,
      target: mutationTargetOption(requiredOption(parsed.options, "target")),
      risk: approvalRiskOption(parsed.options, "medium"),
      scope: requiredOption(parsed.options, "scope"),
      authEvidenceRefs: splitList(requiredOption(parsed.options, "auth-evidence")),
      evidenceRefs: splitList(optionString(parsed.options, "evidence", "")),
      dryRunCommand: requiredOption(parsed.options, "dry-run"),
      proposedLiveCommand: requiredOption(parsed.options, "live-command"),
      postVerificationCommand: requiredOption(parsed.options, "post-verify"),
      rollback: requiredOption(parsed.options, "rollback"),
      approvalRef: optionString(parsed.options, "approval", "") || undefined,
      notes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`Mutation readiness: ${result.markdownPath}`);
    console.log(`Status: ${result.plan.status}`);
    console.log(`Execute: ${result.plan.execute}`);
    return;
  }

  if (parsed.command === "mutation-readiness-audit") {
    const result = await generateMutationReadinessAudit({ project, vaultRoot });
    console.log(`Mutation readiness audit: ${result.markdownPath}`);
    console.log(`Status: ${result.audit.status}`);
    console.log(`Blocked: ${result.audit.summary.blocked}`);
    return;
  }

  if (parsed.command === "live-adapter-readiness") {
    const result = await generateLiveAdapterReadiness({ project, vaultRoot });
    console.log(`Live adapter readiness: ${result.markdownPath}`);
    console.log(`Status: ${result.report.status}`);
    console.log(`Ready: ${result.report.summary.ready}`);
    console.log(`Blocked: ${result.report.summary.blocked}`);
    return;
  }

  if (parsed.command === "live-adapter-next-actions") {
    const result = await generateLiveAdapterNextActions({ project, vaultRoot });
    console.log(`Live adapter next actions: ${result.markdownPath}`);
    console.log(`Status: ${result.report.status}`);
    console.log(`Action items: ${result.report.summary.actionItems}`);
    return;
  }

  if (parsed.command === "live-adapter-approval-pack") {
    const target = liveAdapterApprovalTargetOption(optionString(parsed.options, "target", "all"));
    const result = await generateLiveAdapterApprovalPack({ project, vaultRoot, target });
    console.log(`Live adapter approval pack: ${result.markdownPath}`);
    console.log(`Status: ${result.report.status}`);
    console.log(`Packets: ${result.report.summary.packets}`);
    return;
  }

  if (parsed.command === "live-adapter-approval-review") {
    const result = await recordLiveAdapterApprovalReview({
      project,
      vaultRoot,
      target: liveAdapterApprovalReviewTargetOption(requiredOption(parsed.options, "target")),
      reviewedBy: requiredOption(parsed.options, "by"),
      status: liveAdapterApprovalReviewStatusOption(requiredOption(parsed.options, "status")),
      packetRef: optionString(parsed.options, "packet", "") || undefined,
      evidenceRefs: splitList(optionString(parsed.options, "evidence", "")),
      notes: optionString(parsed.options, "notes", "") || undefined
    });
    console.log(`Live adapter approval review: ${result.markdownPath}`);
    console.log(`Target: ${result.record.target}`);
    console.log(`Status: ${result.record.status}`);
    console.log(`Mutation approved: ${result.record.mutationApproved}`);
    return;
  }

  if (parsed.command === "live-adapter-approval-review-audit") {
    const result = await generateLiveAdapterApprovalReviewAudit({
      project,
      vaultRoot,
      approvalPackRef: optionString(parsed.options, "packet", "") || undefined
    });
    console.log(`Live adapter approval review audit: ${result.markdownPath}`);
    console.log(`Status: ${result.audit.status}`);
    console.log(`Current accepted reviews: ${result.audit.summary.currentAcceptedReviews}`);
    console.log(`Invalid records: ${result.audit.summary.invalidRecords}`);
    return;
  }

  if (parsed.command === "live-adapter-dossier") {
    const result = await generateLiveAdapterTargetDossier({
      project,
      vaultRoot,
      target: liveAdapterDossierTargetOption(requiredOption(parsed.options, "target"))
    });
    console.log(`Live adapter dossier: ${result.markdownPath}`);
    console.log(`Target: ${result.dossier.target}`);
    console.log(`Status: ${result.dossier.status}`);
    console.log(`Actions: ${result.dossier.summary.actions}`);
    return;
  }

  if (parsed.command === "live-adapter-cutover-audit") {
    const result = await generateLiveAdapterCutoverAudit({ project, vaultRoot });
    console.log(`Live adapter cutover audit: ${result.markdownPath}`);
    console.log(`Status: ${result.audit.status}`);
    console.log(`Ready: ${result.audit.summary.ready}`);
    console.log(`Blocked: ${result.audit.summary.blocked}`);
    return;
  }

  if (parsed.command === "live-adapter-review-session") {
    const result = await generateLiveAdapterReviewSession({ project, vaultRoot });
    console.log(`Live adapter review session: ${result.markdownPath}`);
    console.log(`Status: ${result.session.status}`);
    console.log(`Operator review required: ${result.session.summary.operatorReviewRequired}`);
    console.log(`Mutation approved: ${result.session.mutationApproved}`);
    return;
  }

  if (parsed.command === "mutation-dry-run") {
    const result = await runMutationDryRun({
      project,
      vaultRoot,
      plan: requiredOption(parsed.options, "plan"),
      timeoutMs: optionalNumber(parsed.options, "timeout-ms")
    });
    console.log(`Mutation dry run: ${result.markdownPath}`);
    console.log(`Status: ${result.record.status}`);
    console.log(`Exit code: ${result.record.exitCode ?? "none"}`);
    return;
  }

  if (parsed.command === "mutation-execute") {
    const result = await runMutationExecution({
      project,
      vaultRoot,
      plan: requiredOption(parsed.options, "plan"),
      confirmPlan: requiredOption(parsed.options, "confirm-plan"),
      timeoutMs: optionalNumber(parsed.options, "timeout-ms")
    });
    console.log(`Mutation execution: ${result.markdownPath}`);
    console.log(`Status: ${result.record.status}`);
    console.log(`Live exit code: ${result.record.liveExitCode ?? "none"}`);
    console.log(`Post-verify exit code: ${result.record.postVerificationExitCode ?? "none"}`);
    return;
  }

  if (parsed.command === "target-mutation-execute") {
    const result = await runTargetMutationExecution({
      project,
      vaultRoot,
      target: mutationTargetOption(requiredOption(parsed.options, "target")),
      plan: requiredOption(parsed.options, "plan"),
      confirmPlan: requiredOption(parsed.options, "confirm-plan"),
      timeoutMs: optionalNumber(parsed.options, "timeout-ms")
    });
    console.log(`Target mutation execution: ${result.markdownPath}`);
    console.log(`Target: ${result.record.target}`);
    console.log(`Status: ${result.record.status}`);
    console.log(`Execute: ${result.record.execute}`);
    return;
  }

  const commandTarget = targetForMutationExecutionCommand(parsed.command);
  if (commandTarget) {
    const result = await runTargetMutationExecution({
      project,
      vaultRoot,
      target: commandTarget,
      plan: requiredOption(parsed.options, "plan"),
      confirmPlan: requiredOption(parsed.options, "confirm-plan"),
      timeoutMs: optionalNumber(parsed.options, "timeout-ms")
    });
    console.log(`${commandTarget} mutation execution: ${result.markdownPath}`);
    console.log(`Target: ${result.record.target}`);
    console.log(`Status: ${result.record.status}`);
    console.log(`Execute: ${result.record.execute}`);
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

  if (parsed.command === "recovery-report") {
    const result = await generateRecoveryReport({ project, vaultRoot });
    console.log(`Recovery report: ${result.markdownPath}`);
    console.log(`Status: ${result.report.status}`);
    console.log(`Issues: ${result.report.issues.length}`);
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

  if (parsed.command === "console-visual-checks") {
    const result = await generateConsoleVisualCheckReport({
      project,
      vaultRoot,
      htmlPath: optionString(parsed.options, "html", "") || undefined
    });
    console.log(`Console visual checks: ${result.markdownPath}`);
    console.log(`Status: ${result.report.status}`);
    return;
  }

  if (parsed.command === "console-browser-checks") {
    const result = await generateConsoleBrowserCheckReport({
      project,
      vaultRoot,
      htmlPath: optionString(parsed.options, "html", "") || undefined,
      width: optionalNumber(parsed.options, "width"),
      height: optionalNumber(parsed.options, "height")
    });
    console.log(`Console browser checks: ${result.markdownPath}`);
    console.log(`Screenshot: ${result.report.screenshotPath}`);
    console.log(`Status: ${result.report.status}`);
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
    const behaviorChecks = await generateBehaviorCheckReport({ project, vaultRoot });
    const gbrain = await exportGbrainBundle({ project, vaultRoot });
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
    console.log(`  Behavior checks: ${behaviorChecks.markdownPath}`);
    console.log(`  GBrain export: ${gbrain.markdownPath}`);
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

function optionalNumber(options: Map<string, string | true>, key: string): number | undefined {
  const value = options.get(key);
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error(`--${key} requires a number.`);
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`--${key} must be a positive integer.`);
  }
  return parsed;
}

function optionalDecimal(options: Map<string, string | true>, key: string): number | undefined {
  const value = options.get(key);
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error(`--${key} requires a number.`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`--${key} must be a number between 0 and 1.`);
  }
  return parsed;
}

function extractionKindOption(
  options: Map<string, string | true>
): "ocr" | "transcription" | "pdf-text" | "visual-description" {
  const value = options.get("kind");
  if (value === "ocr" || value === "transcription" || value === "pdf-text" || value === "visual-description") {
    return value;
  }
  throw new Error("--kind must be ocr, transcription, pdf-text, or visual-description.");
}

function optionalExtractionKindOption(
  options: Map<string, string | true>
): "ocr" | "transcription" | "pdf-text" | "visual-description" | undefined {
  if (!options.has("kind")) return undefined;
  return extractionKindOption(options);
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

function usageSourceOption(
  options: Map<string, string | true>
): "hermes" | "coderabbit" | "openai" | "ci" | "manual" | undefined {
  const value = options.get("source");
  if (value === undefined) return undefined;
  if (value === "hermes" || value === "coderabbit" || value === "openai" || value === "ci" || value === "manual") {
    return value;
  }
  throw new Error("--source must be hermes, coderabbit, openai, ci, or manual.");
}

function agentLeaseStatusOption(options: Map<string, string | true>): "acquired" | "released" | "expired" {
  const value = options.get("status");
  if (value === "acquired" || value === "released" || value === "expired") {
    return value;
  }
  throw new Error("--status must be acquired, released, or expired.");
}

function approvalRiskOption(options: Map<string, string | true>, fallback?: "low" | "medium" | "high"): "low" | "medium" | "high" {
  const value = options.get("risk") ?? fallback;
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  throw new Error("--risk must be low, medium, or high.");
}

function approvalDecisionStatusOption(options: Map<string, string | true>): "approved" | "rejected" | "expired" {
  const value = options.get("status");
  if (value === "approved" || value === "rejected" || value === "expired") {
    return value;
  }
  throw new Error("--status must be approved, rejected, or expired.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
