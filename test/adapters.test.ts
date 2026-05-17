import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { decideApproval, requestApproval } from "../src/approvals.js";
import { generateArtifactCheckReport } from "../src/artifactChecks.js";
import { runBenchmarkPack } from "../src/benchmarkRun.js";
import { generateBehaviorCheckReport } from "../src/behaviorChecks.js";
import { materializeBenchmarkPack } from "../src/benchmarkPacks.js";
import { importCiStatus, importCodeRabbitReview } from "../src/ciImport.js";
import { generateControlReport } from "../src/controlPlane.js";
import { generateConsoleData } from "../src/consoleData.js";
import { generateConsoleBrowserCheckReport } from "../src/consoleBrowserChecks.js";
import { generateConsoleHtml } from "../src/consoleHtml.js";
import { generateConsoleVisualCheckReport } from "../src/consoleVisualChecks.js";
import { recordAgentLease, recordAgentMail, recordMemoryProposal, recordSleepRoutine } from "../src/coordination.js";
import { collectSshDeploymentSnapshot, importDeploymentSnapshot } from "../src/deploymentAdapters.js";
import { planDeploymentMutation } from "../src/deploymentMutation.js";
import { runE2eSmoke } from "../src/e2eSmoke.js";
import { planExecution } from "../src/execution.js";
import { exportGbrainBundle, importGbrainReport } from "../src/gbrainAdapter.js";
import { importGithubSnapshot } from "../src/githubAdapter.js";
import { planGithubMutation } from "../src/githubMutation.js";
import { generateGsd } from "../src/gsd.js";
import { exportGsd2Bundle, importGsd2Bundle } from "../src/gsdAdapter.js";
import { planGsd2Mutation } from "../src/gsdMutation.js";
import { collectGsd2ProcessSnapshot } from "../src/gsdProcess.js";
import { generateHealerProposal } from "../src/healerProposals.js";
import { generateHermesCronProposal, importHermesCronSnapshot } from "../src/hermesCron.js";
import { planHermesCronMutation } from "../src/hermesMutation.js";
import { generateInfrastructureRegistry } from "../src/infrastructure.js";
import { draftOpenScorpionActivity, importInfraSnapshot } from "../src/infraSnapshot.js";
import { collectLocalInfraSnapshot, collectSshInfraSnapshot, parseSshInventory } from "../src/liveInventory.js";
import { generateLiveAdapterApprovalPack } from "../src/liveAdapterApprovalPack.js";
import { recordLiveAdapterApprovalReview } from "../src/liveAdapterApprovalReview.js";
import { generateLiveAdapterApprovalReviewAudit } from "../src/liveAdapterApprovalReviewAudit.js";
import { generateLiveAdapterCutoverAudit } from "../src/liveAdapterCutoverAudit.js";
import { generateLiveAdapterEvidenceTemplates } from "../src/liveAdapterEvidenceTemplates.js";
import {
  checkLiveAdapterOperatorEvidence,
  generateLiveAdapterOperatorEvidenceAudit,
  recordLiveAdapterOperatorEvidence
} from "../src/liveAdapterOperatorEvidence.js";
import { checkAllLiveAdapterOperatorEvidence } from "../src/liveAdapterOperatorEvidenceCheckAll.js";
import { generateLiveAdapterOperatorEvidenceAssist } from "../src/liveAdapterOperatorEvidenceAssist.js";
import { importReadyLiveAdapterOperatorEvidence } from "../src/liveAdapterOperatorEvidenceImportReady.js";
import { generateLiveAdapterOperatorEvidenceWorkplan } from "../src/liveAdapterOperatorEvidenceWorkplan.js";
import { generateLiveAdapterOperatorEvidenceQueue } from "../src/liveAdapterOperatorEvidenceQueue.js";
import { generateLiveAdapterOperatorEvidenceWorkspace } from "../src/liveAdapterOperatorEvidenceWorkspace.js";
import { generateLiveAdapterNextActions } from "../src/liveAdapterNextActions.js";
import { generateLiveAdapterReadiness } from "../src/liveAdapterReadiness.js";
import { generateLiveAdapterReviewSession } from "../src/liveAdapterReviewSession.js";
import { generateLiveAdapterTargetDossier } from "../src/liveAdapterTargetDossier.js";
import { collectLocalRuntimeProbe } from "../src/localRuntimeProbe.js";
import { planMutationReadiness } from "../src/mutationReadiness.js";
import { generateMutationReadinessAudit } from "../src/mutationReadinessAudit.js";
import { generateMutationReadinessRepairPlan } from "../src/mutationReadinessRepairPlan.js";
import { runMutationDryRun } from "../src/mutationDryRun.js";
import { runMutationExecution } from "../src/mutationExecute.js";
import { planOpenScorpionMutation } from "../src/openScorpionMutation.js";
import { generatePlaywrightPlan } from "../src/playwrightPlan.js";
import { generateEvaluationPlan, recordEvaluationRun } from "../src/evaluation.js";
import { generateEvaluationTrendReport } from "../src/evaluationTrends.js";
import { importNotebookLmExport } from "../src/notebooklm.js";
import { planNotebookLmMutation } from "../src/notebookLmMutation.js";
import { recordPlaywrightEvidence } from "../src/playwrightEvidence.js";
import { generatePrd } from "../src/prd.js";
import { generateRecoveryReport } from "../src/recovery.js";
import { generateRoadmapCompletionAudit } from "../src/roadmapCompletionAudit.js";
import { captureTargetAppEvidence } from "../src/targetAppCapture.js";
import { runTargetMutationExecution, targetForMutationExecutionCommand } from "../src/targetMutationExecute.js";
import { generateUsageMetricsReport, importUsageMetrics } from "../src/usageMetrics.js";
import { guardWorktrees } from "../src/worktreeGuard.js";
import { assembleDossier, ingestFiles, projectStatus } from "../src/vault.js";

async function preparedProject(): Promise<{ temp: string; vaultRoot: string }> {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-adapters-"));
  const vaultRoot = path.join(temp, "vault");
  const source = path.join(temp, "source.md");
  await fs.writeFile(source, "# Source\n\nNotebookLM GSD2 Playwright CodeRabbit OpenScorpion Proxmox.\n");
  await ingestFiles([source], { project: "ariadne", vaultRoot });
  await assembleDossier({ project: "ariadne", vaultRoot, maxCharsPerSource: 4000 });
  await generatePrd({ project: "ariadne", vaultRoot });
  await generateGsd({ project: "ariadne", vaultRoot });
  return { temp, vaultRoot };
}

describe("roadmap adapters", () => {
  it("blocks likely secrets before vault promotion unless explicitly allowed", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-secret-"));
    const source = path.join(temp, "secret.md");
    await fs.writeFile(source, "OPENAI_API_KEY=sk-1234567890abcdefghijklmnopqrstuvwxyz\n");

    await expect(
      ingestFiles([source], { project: "ariadne", vaultRoot: path.join(temp, "vault") })
    ).rejects.toThrow(/Source hygiene blocked/);

    const records = await ingestFiles([source], {
      project: "ariadne",
      vaultRoot: path.join(temp, "vault-allowed"),
      allowSecretFindings: true
    });
    expect(records[0]?.hygieneReportPath).toBeTruthy();

    const emptySource = path.join(temp, "empty.md");
    await fs.writeFile(emptySource, "");
    const emptyRecords = await ingestFiles([emptySource], {
      project: "ariadne",
      vaultRoot: path.join(temp, "vault-empty")
    });
    expect(emptyRecords[0]?.hygieneReportPath).toBeTruthy();
    const emptyHygiene = JSON.parse(await fs.readFile(emptyRecords[0]?.hygieneReportPath ?? "", "utf8")) as {
      status: string;
    };
    expect(emptyHygiene.status).toBe("clean");
  });

  it("normalises NotebookLM exports and round-trips a GSD2 bundle", async () => {
    const { temp, vaultRoot } = await preparedProject();
    const notebook = path.join(temp, "notebook.md");
    await fs.writeFile(notebook, "# Briefing Doc\n\n## Requirement\n\nBuild it. [1]\n\nSource: manifesto\n");

    const imported = await importNotebookLmExport({ project: "ariadne", vaultRoot, sourcePath: notebook });
    expect(imported.imported.sections.some((section) => section.heading === "Requirement")).toBe(true);
    expect(imported.imported.citations.length).toBeGreaterThan(0);

    const exported = await exportGsd2Bundle({ project: "ariadne", vaultRoot });
    expect(exported.bundle.tasks.length).toBeGreaterThan(0);

    const roundTrip = await importGsd2Bundle({
      project: "ariadne",
      vaultRoot,
      sourcePath: exported.jsonPath
    });
    expect(roundTrip.roadmap.milestones.length).toBeGreaterThan(0);

    const fakeGsd = path.join(temp, "gsd");
    await fs.writeFile(
      fakeGsd,
      [
        "#!/bin/sh",
        "if [ \"$1\" = \"--version\" ]; then echo '2.59.0'; exit 0; fi",
        "if [ \"$1\" = \"list\" ]; then echo 'No packages installed.'; exit 0; fi",
        "cat <<'EOF'",
        "GSD v2.59.0",
        "Options:",
        "  --mode <text|json|rpc|mcp> Output mode",
        "Subcommands:",
        "  headless [cmd]",
        "  auto [args]",
        "EOF"
      ].join("\n")
    );
    await fs.chmod(fakeGsd, 0o755);
    const processSnapshot = await collectGsd2ProcessSnapshot({ project: "ariadne", vaultRoot, binary: fakeGsd });
    expect(processSnapshot.snapshot.mode).toBe("read_only");
    expect(processSnapshot.snapshot.version).toBe("2.59.0");
    expect(processSnapshot.snapshot.supportedModes).toContain("json");
    expect(processSnapshot.snapshot.subcommands).toContain("headless");
    const consoleData = await generateConsoleData({ project: "ariadne", vaultRoot });
    expect(consoleData.data.summary.gsd2ProcessSnapshots).toBe(1);

    const evaluation = await generateEvaluationPlan({
      project: "ariadne",
      vaultRoot,
      target: "mac-local"
    });
    expect(evaluation.plan.scenarios.length).toBeGreaterThan(0);

    const evaluationRun = await recordEvaluationRun({
      project: "ariadne",
      vaultRoot,
      planPath: evaluation.jsonPath,
      target: "mac-local",
      operator: "vitest",
      dimensionScores: [
        { id: "D1", score: 80, notes: "evidence chain present" },
        { id: "D2", score: 70, notes: "roadmap generated" }
      ],
      evidenceRefs: [exported.jsonPath],
      regressions: [],
      recommendations: ["Add live console adapter."]
    });
    expect(evaluationRun.run.overallScore).toBe(76);

    const invalidBundle = path.join(temp, "invalid-bundle.json");
    await fs.writeFile(
      invalidBundle,
      JSON.stringify({ schemaVersion: 1, format: "ariadne-gsd2-bundle", tasks: [{ id: "TASK-BAD" }] })
    );
    await expect(
      importGsd2Bundle({
        project: "ariadne",
        vaultRoot,
        sourcePath: invalidBundle
      })
    ).rejects.toThrow(/task 0 is missing required fields/);
  });

  it("rejects valueless GSD2 process binary flags", async () => {
    const { temp } = await preparedProject();
    const tsx = path.join(process.cwd(), "node_modules", ".bin", "tsx");

    expect(() =>
      execFileSync(tsx, ["src/ariadne.ts", "gsd2-process", "--project", "ariadne", "--vault", temp, "--binary"], {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
      })
    ).toThrow(/--binary requires a value/);
  });

  it("reports missing and complete pipeline artifact contracts", async () => {
    const { vaultRoot } = await preparedProject();

    const incomplete = await generateArtifactCheckReport({ project: "ariadne", vaultRoot });
    expect(incomplete.report.status).toBe("missing");
    expect(incomplete.report.checks.find((check) => check.id === "evaluation-plan")?.status).toBe("missing");

    await exportGsd2Bundle({ project: "ariadne", vaultRoot });
    await planExecution({ project: "ariadne", vaultRoot });
    await generatePlaywrightPlan({ project: "ariadne", vaultRoot, targetUrl: "http://localhost:3000" });
    await generateEvaluationPlan({ project: "ariadne", vaultRoot, target: "mac-local" });
    await generateInfrastructureRegistry({ project: "ariadne", vaultRoot });
    await generateControlReport({ project: "ariadne", vaultRoot });

    const complete = await generateArtifactCheckReport({ project: "ariadne", vaultRoot });
    expect(complete.report.status).toBe("passed");
    expect(complete.report.summary.missingRequired).toBe(0);
    expect(complete.report.checks.find((check) => check.id === "execution-runs")?.count).toBe(1);

    const markdown = await fs.readFile(complete.markdownPath, "utf8");
    expect(markdown).toContain("| execution-runs | yes | present | 1 |");
  });

  it("materialises smoke, realistic, and stress benchmark source packs", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-benchmarks-"));
    const smoke = await materializeBenchmarkPack({ set: "smoke", outputRoot: temp });
    const realistic = await materializeBenchmarkPack({ set: "realistic", outputRoot: temp });
    const stress = await materializeBenchmarkPack({ set: "stress", outputRoot: temp });

    expect(smoke.pack.files.some((file) => file.path === "sources/source.md")).toBe(true);
    expect(realistic.pack.files.some((file) => file.role === "notebooklm_export")).toBe(true);
    expect(realistic.pack.files.some((file) => file.role === "ci_status")).toBe(true);
    expect(realistic.pack.files.some((file) => file.role === "usage_metrics")).toBe(true);
    expect(stress.pack.files.some((file) => file.role === "execution_seed")).toBe(true);

    const smokeManifest = JSON.parse(await fs.readFile(smoke.manifestPath, "utf8")) as { root: string };
    expect(smokeManifest.root).toBe("<PACK_ROOT>");

    const realisticSource = path.join(temp, "realistic", "sources", "whitepaper.md");
    const vaultRoot = path.join(temp, "vault");
    await ingestFiles([realisticSource], { project: "bench-realistic", vaultRoot });
    await assembleDossier({ project: "bench-realistic", vaultRoot, maxCharsPerSource: 4000 });
    const prd = await generatePrd({ project: "bench-realistic", vaultRoot });
    expect(prd.prd.requirements.length).toBeGreaterThan(0);
  });

  it("runs a deterministic smoke benchmark through the local pipeline", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-benchmark-run-"));
    const packRoot = path.join(temp, "packs");
    const vaultRoot = path.join(temp, "vault");
    await materializeBenchmarkPack({ set: "smoke", outputRoot: packRoot });

    const run = await runBenchmarkPack({
      project: "bench-smoke",
      vaultRoot,
      set: "smoke",
      packRoot: path.join(packRoot, "smoke")
    });

    expect(run.run.status).toBe("passed");
    expect(run.run.summary.failed).toBe(0);
    expect(run.run.summary.missingRequiredArtifacts).toBe(0);
    expect(run.run.steps.some((step) => step.id === "gbrain-export" && step.status === "passed")).toBe(true);

    const console = await generateConsoleData({ project: "bench-smoke", vaultRoot });
    expect(console.data.summary.benchmarkRuns).toBe(1);
    expect(console.data.benchmarkRuns[0]?.set).toBe("smoke");

    const artifactChecks = await generateArtifactCheckReport({ project: "bench-smoke", vaultRoot });
    expect(artifactChecks.report.checks.find((check) => check.id === "benchmark-runs")?.status).toBe("present");
  });

  it("rejects benchmark files that escape the pack root", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-benchmark-escape-"));
    const packRoot = path.join(temp, "pack");
    await fs.mkdir(packRoot, { recursive: true });
    await fs.writeFile(
      path.join(packRoot, "benchmark-pack.json"),
      JSON.stringify(
        {
          schemaVersion: 1,
          set: "smoke",
          title: "Escaping Pack",
          purpose: "Fixture",
          generatedAt: new Date().toISOString(),
          root: "<PACK_ROOT>",
          files: [{ path: "../escape.md", role: "source", description: "Escapes the pack root." }],
          recommendedCommands: [],
          acceptance: [{ id: "escape-path", type: "artifact_contract", criterion: "The runner rejects escaped paths." }]
        },
        null,
        2
      )
    );

    await expect(runBenchmarkPack({ project: "bench-escape", vaultRoot: path.join(temp, "vault"), set: "smoke", packRoot })).rejects.toThrow(
      "Benchmark file escapes pack root"
    );
  });

  it("generates evaluation trend reports across scored runs", async () => {
    const { vaultRoot } = await preparedProject();
    const evaluation = await generateEvaluationPlan({ project: "ariadne", vaultRoot, target: "mac-local" });
    await recordEvaluationRun({
      project: "ariadne",
      vaultRoot,
      planPath: evaluation.jsonPath,
      target: "mac-local",
      operator: "vitest",
      dimensionScores: [
        { id: "D1", score: 60, notes: "baseline evidence" },
        { id: "D4", score: 50, notes: "weak verification" }
      ],
      evidenceRefs: ["baseline.md"],
      regressions: ["No Playwright trace."],
      recommendations: ["Add UI evidence."]
    });
    await new Promise((resolve) => setTimeout(resolve, 2));
    await recordEvaluationRun({
      project: "ariadne",
      vaultRoot,
      planPath: evaluation.jsonPath,
      target: "mac-local",
      operator: "vitest",
      dimensionScores: [
        { id: "D1", score: 70, notes: "better source refs" },
        { id: "D4", score: 80, notes: "verification improved" }
      ],
      evidenceRefs: ["latest.md", "artifact-checks.md"],
      regressions: [],
      recommendations: ["Start trend charts."]
    });

    const trends = await generateEvaluationTrendReport({ project: "ariadne", vaultRoot });
    expect(trends.report.status).toBe("improving");
    expect(trends.report.runCount).toBe(2);
    expect(trends.report.delta).toBeGreaterThan(0);
    expect(trends.report.dimensions.find((dimension) => dimension.id === "D4")?.delta).toBe(30);

    const markdown = await fs.readFile(trends.markdownPath, "utf8");
    expect(markdown).toContain("# Evaluation Trends");
    expect(markdown).toContain("Start trend charts.");

    const consoleHtml = await generateConsoleHtml({ project: "ariadne", vaultRoot, refreshData: true });
    const html = await fs.readFile(consoleHtml.htmlPath, "utf8");
    expect(html).toContain('data-visual-role="evaluation-trend-chart"');
    expect(html).toContain("Evaluation Trends");

    const visual = await generateConsoleVisualCheckReport({ project: "ariadne", vaultRoot });
    expect(visual.report.status).toBe("passed");
    expect(visual.report.checks.find((check) => check.id === "trend-chart")?.status).toBe("passed");
  });

  it("captures target app screenshots and traces as Playwright evidence", async () => {
    const { vaultRoot } = await preparedProject();
    const html = encodeURIComponent("<!doctype html><main><h1>Ariadne target app</h1></main>");
    const capture = await captureTargetAppEvidence({
      project: "ariadne",
      vaultRoot,
      targetUrl: `data:text/html,${html}`,
      selector: "text=Ariadne target app",
      width: 640,
      height: 480
    });

    expect(capture.evidence.status).toBe("passed");
    expect(capture.evidence.screenshotPath).toMatch(/verification\/playwright-captures\/target-.*\.png/);
    expect(capture.evidence.tracePath).toMatch(/verification\/playwright-captures\/target-.*\.zip/);
    await expect(fs.stat(path.join(vaultRoot, capture.evidence.screenshotPath!))).resolves.toBeTruthy();
    await expect(fs.stat(path.join(vaultRoot, capture.evidence.tracePath!))).resolves.toBeTruthy();

    const evidenceMarkdown = await fs.readFile(capture.markdownPath, "utf8");
    expect(evidenceMarkdown).toContain("Status: passed");
    expect(evidenceMarkdown).toContain("Selector visible: text=Ariadne target app");

    const artifactChecks = await generateArtifactCheckReport({ project: "ariadne", vaultRoot });
    expect(artifactChecks.report.checks.find((check) => check.id === "playwright-captures")?.status).toBe("present");
    expect(artifactChecks.report.checks.find((check) => check.id === "playwright-traces")?.status).toBe("present");
  });

  it("generates the default console before visual and browser checks when missing", async () => {
    const { vaultRoot } = await preparedProject();
    const htmlPath = path.join(vaultRoot, "projects", "ariadne", "console", "index.html");

    const visual = await generateConsoleVisualCheckReport({ project: "ariadne", vaultRoot });
    expect(visual.report.status).toBe("passed");
    await expect(fs.stat(htmlPath)).resolves.toBeTruthy();

    await fs.rm(htmlPath);
    const browser = await generateConsoleBrowserCheckReport({ project: "ariadne", vaultRoot, width: 640, height: 480 });
    expect(browser.report.status).toBe("passed");
    await expect(fs.stat(htmlPath)).resolves.toBeTruthy();
  });

  it("creates review-gated healer proposals from failed Playwright evidence", async () => {
    const { vaultRoot } = await preparedProject();
    const evidence = await recordPlaywrightEvidence({
      project: "ariadne",
      vaultRoot,
      targetUrl: "http://localhost:3000",
      status: "failed",
      screenshotPath: "projects/ariadne/verification/playwright-captures/target-failed.png",
      tracePath: "projects/ariadne/verification/playwright-captures/target-failed.zip",
      notes: "Capture error: Selector was not visible: text=Dashboard"
    });

    const proposal = await generateHealerProposal({
      project: "ariadne",
      vaultRoot,
      evidencePath: evidence.jsonPath,
      notes: "Fixture healer proposal."
    });

    expect(proposal.proposal.status).toBe("review_required");
    expect(proposal.proposal.apply).toBe(false);
    expect(proposal.proposal.evidenceRecordId).toBe(evidence.record.id);
    expect(proposal.proposal.proposedActions[0]?.title).toContain("Repair locator");
    expect(proposal.proposal.reviewGates.some((gate) => gate.includes("review"))).toBe(true);

    const markdown = await fs.readFile(proposal.markdownPath, "utf8");
    expect(markdown).toContain("Apply automatically: false");
    expect(markdown).toContain("Review gate:");

    const artifactChecks = await generateArtifactCheckReport({ project: "ariadne", vaultRoot });
    expect(artifactChecks.report.checks.find((check) => check.id === "healer-proposals")?.status).toBe("present");

    const console = await generateConsoleData({ project: "ariadne", vaultRoot });
    expect(console.data.summary.healerProposals).toBe(1);
    expect(console.data.healerProposals[0]?.evidenceRecordId).toBe(evidence.record.id);

    const invalidEvidence = path.join(path.dirname(evidence.jsonPath), "playwright-invalid.json");
    await fs.writeFile(
      invalidEvidence,
      JSON.stringify({ schemaVersion: 1, id: "playwright-invalid", status: "failed", recordedAt: "not-a-date" })
    );
    await expect(
      generateHealerProposal({ project: "ariadne", vaultRoot, evidencePath: invalidEvidence })
    ).rejects.toThrow(/invalid targetUrl|invalid recordedAt/);
  });

  it("imports and reports token and cost metrics", async () => {
    const { temp, vaultRoot } = await preparedProject();
    const usage = path.join(temp, "usage.json");
    await fs.writeFile(
      usage,
      JSON.stringify([
        {
          source: "hermes",
          model: "gpt-5.5",
          operation: "plan",
          input_tokens: 1000,
          output_tokens: 500,
          cost_usd: 0.45
        },
        {
          source: "coderabbit",
          model: "coderabbit-review",
          operation: "review",
          total_tokens: 750,
          cost_usd: "0.12"
        }
      ])
    );

    const records = await importUsageMetrics({ project: "ariadne", vaultRoot, sourcePath: usage });
    expect(records).toHaveLength(2);
    expect(records[0]?.totalTokens).toBe(1500);

    const report = await generateUsageMetricsReport({ project: "ariadne", vaultRoot });
    expect(report.report.recordCount).toBe(2);
    expect(report.report.totalTokens).toBe(2250);
    expect(report.report.totalCostUsd).toBe(0.57);
    expect(report.report.bySource.find((row) => row.name === "hermes")?.inputTokens).toBe(1000);

    await fs.appendFile(path.join(vaultRoot, "projects", "ariadne", "evaluation", "usage-metrics.jsonl"), "{bad json\n");
    const resilientReport = await generateUsageMetricsReport({ project: "ariadne", vaultRoot });
    expect(resilientReport.report.recordCount).toBe(2);

    const invalidUsage = path.join(temp, "invalid-usage.json");
    await fs.writeFile(invalidUsage, "{bad json\n");
    await expect(importUsageMetrics({ project: "ariadne", vaultRoot, sourcePath: invalidUsage })).rejects.toThrow(
      /Failed to parse JSON/
    );

    const markdown = await fs.readFile(report.markdownPath, "utf8");
    expect(markdown).toContain("# Usage Metrics Report");
    expect(markdown).toContain("| coderabbit | 1 | 0 | 0 | 750 | 0.1200 |");
  });

  it("exports Ariadne evidence to GBrain and imports GBrain reports", async () => {
    const { temp, vaultRoot } = await preparedProject();
    await exportGsd2Bundle({ project: "ariadne", vaultRoot });
    await generateInfrastructureRegistry({ project: "ariadne", vaultRoot });

    const exported = await exportGbrainBundle({ project: "ariadne", vaultRoot });
    expect(exported.bundle.mode).toBe("read_only_export");
    expect(exported.bundle.documents.some((document) => document.kind === "source")).toBe(true);
    expect(exported.bundle.documents.some((document) => document.kind === "task")).toBe(true);

    const reportPath = path.join(temp, "gbrain-report.json");
    await fs.writeFile(
      reportPath,
      JSON.stringify({
        query: "where is the Playwright evidence?",
        mode: "balanced",
        metrics: { latencyMs: 42, jaccardAt5: 0.8 },
        results: [{ title: "Playwright plan", slug: "task/task-004", score: 0.91, source: "ariadne" }],
        notes: ["Fixture report only."]
      })
    );
    const imported = await importGbrainReport({ project: "ariadne", vaultRoot, sourcePath: reportPath });
    expect(imported.report.resultCount).toBe(1);
    expect(imported.report.metrics.latencyMs).toBe(42);

    await generateLiveAdapterApprovalPack({ project: "ariadne", vaultRoot });
    const dossier = await generateLiveAdapterTargetDossier({ project: "ariadne", vaultRoot, target: "github" });
    expect(dossier.dossier.target).toBe("github");
    expect(dossier.dossier.gbrainContext.exportRef).toContain("integrations/gbrain/gbrain-export.json");
    expect(dossier.dossier.gbrainContext.suggestedQueries.some((query) => query.includes("github"))).toBe(true);
    expect(dossier.dossier.operatorChecklist.some((item) => item.includes("Query GBrain"))).toBe(true);
  });

  it("records behavior checks, sleep routines, memory proposals, agent mail, leases, Hermes cron, and deployment snapshots", async () => {
    const { temp, vaultRoot } = await preparedProject();
    const repo = path.join(temp, "repo");
    await fs.mkdir(repo);
    execFileSync("git", ["init", "-b", "main"], { cwd: repo });
    const execution = await planExecution({ project: "ariadne", vaultRoot, repoPath: repo, taskId: "TASK-001" });
    await guardWorktrees({ project: "ariadne", vaultRoot, runFile: execution.jsonPath, apply: false });

    const coderabbit = path.join(temp, "coderabbit-approved.md");
    await fs.writeFile(coderabbit, "Approved\n\nNo issues found.\n");
    await importCodeRabbitReview({ project: "ariadne", vaultRoot, sourcePath: coderabbit });
    const approval = await requestApproval({
      project: "ariadne",
      vaultRoot,
      requestedBy: "planner",
      target: "github",
      action: "Enable mutation-capable PR adapter after review gates pass.",
      risk: "medium",
      reason: "Exercise the approval workflow without mutating GitHub.",
      rollback: "Keep the adapter disabled and use manual PR commands.",
      evidenceRefs: [coderabbit]
    });
    const decidedApproval = await decideApproval({
      project: "ariadne",
      vaultRoot,
      approval: approval.record.id,
      status: "approved",
      decisionBy: "human",
      decisionNotes: "Approved only as a recorded fixture; no live mutation is executed."
    });
    expect(decidedApproval.record.status).toBe("approved");
    await expect(
      decideApproval({
        project: "ariadne",
        vaultRoot,
        approval: approval.record.id,
        status: "rejected",
        decisionBy: "human"
      })
    ).rejects.toThrow(/Only requested approvals can be decided/);
    const behavior = await generateBehaviorCheckReport({
      project: "ariadne",
      vaultRoot,
      approvedFixturePath: coderabbit
    });
    expect(behavior.report.status).toBe("passed");
    const evaluationPlan = await generateEvaluationPlan({ project: "ariadne", vaultRoot, target: "mac-local" });
    await recordEvaluationRun({
      project: "ariadne",
      vaultRoot,
      planPath: evaluationPlan.jsonPath,
      target: "mac-local",
      operator: "vitest",
      dimensionScores: [
        { id: "D1", score: 90, notes: "artifact chain present" },
        { id: "D2", score: 85, notes: "roadmap gates visible" }
      ],
      evidenceRefs: [behavior.jsonPath],
      regressions: [],
      recommendations: []
    });
    await generateEvaluationTrendReport({ project: "ariadne", vaultRoot });
    const mutationReadiness = await planMutationReadiness({
      project: "ariadne",
      vaultRoot,
      target: "github",
      risk: "medium",
      scope: "Enable mutation-capable PR adapter for a single Ariadne branch.",
      authEvidenceRefs: [approval.jsonPath],
      evidenceRefs: [behavior.jsonPath],
      dryRunCommand: "node -e \"console.log('mutation dry run ok')\"",
      proposedLiveCommand: "node -e \"console.log('live command ok')\"",
      postVerificationCommand: "node -e \"console.log('post verify ok')\"",
      rollback: "Revert the merge commit and disable the mutation adapter.",
      approvalRef: approval.record.id
    });
    expect(mutationReadiness.plan.status).toBe("ready_for_bounded_review");
    expect(mutationReadiness.plan.execute).toBe(false);
    const mismatchedMutationReadiness = await planMutationReadiness({
      project: "ariadne",
      vaultRoot,
      target: "deployment",
      risk: "medium",
      scope: "Do not let a GitHub approval unlock deployment mutation.",
      authEvidenceRefs: [approval.jsonPath],
      evidenceRefs: [behavior.jsonPath],
      dryRunCommand: "ssh host deploy",
      proposedLiveCommand: "ssh host deploy",
      postVerificationCommand: "ssh host systemctl status ariadne",
      rollback: "Disable deployment adapter.",
      approvalRef: approval.record.id
    });
    expect(mismatchedMutationReadiness.plan.status).toBe("approval_required");
    expect(mismatchedMutationReadiness.plan.approvalRef).toBeUndefined();
    await expect(
      planMutationReadiness({
        project: "ariadne",
        vaultRoot,
        target: "github",
        risk: "medium",
        scope: "Missing auth evidence fixture.",
        authEvidenceRefs: [],
        evidenceRefs: [],
        dryRunCommand: "gh pr view 1",
        proposedLiveCommand: "gh pr merge 1",
        postVerificationCommand: "gh pr view 1 --json mergedAt",
        rollback: "Disable adapter."
      })
    ).rejects.toThrow(/--auth-evidence is required/);
    await expect(
      planMutationReadiness({
        project: "ariadne",
        vaultRoot,
        target: "github",
        risk: "medium",
        scope: "Missing auth evidence file fixture.",
        authEvidenceRefs: [path.join(temp, "missing-auth.json")],
        evidenceRefs: [],
        dryRunCommand: "gh pr view 1",
        proposedLiveCommand: "gh pr merge 1",
        postVerificationCommand: "gh pr view 1 --json mergedAt",
        rollback: "Disable adapter."
      })
    ).rejects.toThrow(/Missing auth evidence/);

    const audit = await generateMutationReadinessAudit({ project: "ariadne", vaultRoot });
    expect(audit.audit.status).toBe("blocked");
    expect(audit.audit.summary.plans).toBe(2);
    expect(audit.audit.summary.ready).toBe(1);
    expect(audit.audit.summary.blocked).toBe(1);
    expect(audit.audit.summary.unsafeDryRuns).toBe(1);
    expect(audit.audit.checks.find((check) => check.planId === mutationReadiness.plan.id)?.status).toBe("passed");
    expect(audit.audit.checks.find((check) => check.planId === mismatchedMutationReadiness.plan.id)?.blockers).toContain(
      "approval state is approval_required"
    );
    const dryRun = await runMutationDryRun({
      project: "ariadne",
      vaultRoot,
      plan: mutationReadiness.plan.id,
      timeoutMs: 10_000
    });
    expect(dryRun.record.status).toBe("passed");
    expect(dryRun.record.command).toBe(mutationReadiness.plan.dryRunCommand);
    expect(dryRun.record.execute).toBe(false);
    await expect(
      runMutationExecution({
        project: "ariadne",
        vaultRoot,
        plan: mutationReadiness.plan.id,
        confirmPlan: "wrong-plan-id",
        timeoutMs: 10_000
      })
    ).rejects.toThrow(/--confirm-plan/);
    const mutationExecution = await runMutationExecution({
      project: "ariadne",
      vaultRoot,
      plan: mutationReadiness.plan.id,
      confirmPlan: mutationReadiness.plan.id,
      timeoutMs: 10_000
    });
    expect(mutationExecution.record.status).toBe("passed");
    expect(mutationExecution.record.execute).toBe(true);
    expect(mutationExecution.record.liveStdout).toContain("live command ok");
    expect(mutationExecution.record.postVerificationStdout).toContain("post verify ok");
    await expect(
      runTargetMutationExecution({
        project: "ariadne",
        vaultRoot,
        target: "github",
        plan: mismatchedMutationReadiness.plan.id,
        confirmPlan: mismatchedMutationReadiness.plan.id,
        timeoutMs: 10_000
      })
    ).rejects.toThrow(/targets deployment, not github/);
    const targetMutationExecution = await runTargetMutationExecution({
      project: "ariadne",
      vaultRoot,
      target: "github",
      plan: mutationReadiness.plan.id,
      confirmPlan: mutationReadiness.plan.id,
      timeoutMs: 10_000
    });
    expect(targetMutationExecution.record.status).toBe("passed");
    expect(targetMutationExecution.record.target).toBe("github");
    expect(targetMutationExecution.record.execute).toBe(true);
    expect(targetForMutationExecutionCommand("github-mutation-execute")).toBe("github");
    expect(targetForMutationExecutionCommand("deployment-mutation-execute")).toBe("deployment");
    expect(targetForMutationExecutionCommand("hermes-cron-mutation-execute")).toBe("hermes-cron");
    expect(targetForMutationExecutionCommand("openscorpion-mutation-execute")).toBe("openscorpion");
    expect(targetForMutationExecutionCommand("gsd2-mutation-execute")).toBe("gsd2");
    expect(targetForMutationExecutionCommand("notebooklm-mutation-execute")).toBe("notebooklm");
    expect(targetForMutationExecutionCommand("mutation-execute")).toBeUndefined();
    expect(targetForMutationExecutionCommand("toString")).toBeUndefined();
    const tsx = path.join(process.cwd(), "node_modules", ".bin", "tsx");
    const githubWrapperOutput = execFileSync(
      tsx,
      [
        "src/ariadne.ts",
        "github-mutation-execute",
        "--project",
        "ariadne",
        "--vault",
        vaultRoot,
        "--plan",
        mutationReadiness.plan.id,
        "--confirm-plan",
        mutationReadiness.plan.id,
        "--timeout-ms",
        "10000"
      ],
      { cwd: process.cwd(), encoding: "utf8" }
    );
    expect(githubWrapperOutput).toContain("github mutation execution:");
    expect(githubWrapperOutput).toContain("Target: github");
    expect(() =>
      execFileSync(
        tsx,
        [
          "src/ariadne.ts",
          "deployment-mutation-execute",
          "--project",
          "ariadne",
          "--vault",
          vaultRoot,
          "--plan",
          mutationReadiness.plan.id,
          "--confirm-plan",
          mutationReadiness.plan.id,
          "--timeout-ms",
          "10000"
        ],
        { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
      )
    ).toThrow(/targets github, not deployment/);
    await generateLiveAdapterApprovalPack({ project: "ariadne", vaultRoot });
    await expect(
      recordLiveAdapterApprovalReview({
        project: "ariadne",
        vaultRoot,
        target: "github",
        status: "accepted",
        reviewedBy: "operator",
        evidenceRefs: []
      })
    ).rejects.toThrow(/At least one review evidence ref is required/);
    const githubApprovalReview = await recordLiveAdapterApprovalReview({
      project: "ariadne",
      vaultRoot,
      target: "github",
      status: "accepted",
      reviewedBy: "operator",
      evidenceRefs: [behavior.jsonPath],
      notes: "Accepted the GitHub packet as complete for the fixture; this is not mutation approval."
    });
    expect(githubApprovalReview.record.mutationApproved).toBe(false);
    const approvalReviewAudit = await generateLiveAdapterApprovalReviewAudit({ project: "ariadne", vaultRoot });
    expect(approvalReviewAudit.audit.status).toBe("blocked");
    expect(approvalReviewAudit.audit.summary.currentAcceptedReviews).toBe(1);
    expect(approvalReviewAudit.audit.summary.invalidRecords).toBe(0);
    const githubReviewAudit = approvalReviewAudit.audit.targets.find((target) => target.target === "github");
    const deploymentReviewAudit = approvalReviewAudit.audit.targets.find((target) => target.target === "deployment");
    expect(githubReviewAudit?.status).toBe("current_accepted");
    expect(githubReviewAudit?.currentAcceptedReviewCount).toBe(1);
    expect(deploymentReviewAudit?.status).toBe("missing_review");
    expect(deploymentReviewAudit?.blockers).toContain("no accepted operator review exists");
    const liveAdapterReadiness = await generateLiveAdapterReadiness({ project: "ariadne", vaultRoot });
    expect(liveAdapterReadiness.report.status).toBe("blocked");
    const githubReadiness = liveAdapterReadiness.report.targets.find((target) => target.target === "github");
    const deploymentReadiness = liveAdapterReadiness.report.targets.find((target) => target.target === "deployment");
    expect(githubReadiness?.status).toBe("ready_for_adapter");
    expect(githubReadiness?.executeCommand).toBe("github-mutation-execute");
    expect(githubReadiness?.acceptedApprovalReviewCount).toBe(1);
    expect(githubReadiness?.passedDryRunCount).toBeGreaterThan(0);
    expect(githubReadiness?.passedExecutionCount).toBeGreaterThan(0);
    expect(deploymentReadiness?.status).toBe("blocked");
    expect(deploymentReadiness?.blockers).toContain("no readiness plan passes audit");
    const nextActions = await generateLiveAdapterNextActions({ project: "ariadne", vaultRoot });
    const githubActions = nextActions.report.targets.find((target) => target.target === "github");
    const deploymentActions = nextActions.report.targets.find((target) => target.target === "deployment");
    expect(nextActions.report.status).toBe("actions_required");
    expect(nextActions.report.operatorEvidenceAuditRef).toContain("live-adapter-operator-evidence-audit.json");
    expect(githubActions?.actions[0]?.id).toBe("github-operator-evidence");
    expect(githubActions?.actions[0]?.command).toContain("live-adapter-operator-evidence");
    expect(githubActions?.actions.some((action) => action.id === "github-replace-placeholder" && action.status === "ready")).toBe(true);
    expect(deploymentActions?.actions[0]?.id).toBe("deployment-operator-evidence");
    expect(deploymentActions?.actions.some((action) => action.id === "deployment-approval-pack-review")).toBe(true);
    expect(deploymentActions?.actions.some((action) => action.id === "deployment-audit-fix")).toBe(true);
    expect(deploymentActions?.actions.some((action) => action.id === "deployment-dry-run" && action.status === "pending")).toBe(true);
    const repairPlan = await generateMutationReadinessRepairPlan({ project: "ariadne", vaultRoot });
    const githubRepair = repairPlan.report.targets.find((target) => target.target === "github");
    const deploymentRepair = repairPlan.report.targets.find((target) => target.target === "deployment");
    const hermesRepair = repairPlan.report.targets.find((target) => target.target === "hermes-cron");
    expect(repairPlan.report.status).toBe("actions_required");
    expect(repairPlan.report.mutationAllowed).toBe(false);
    expect(repairPlan.report.mutationReadinessAuditRef).toContain("mutation-readiness-audit.json");
    expect(repairPlan.report.liveAdapterNextActionsRef).toContain("live-adapter-next-actions.json");
    expect(repairPlan.report.summary.auditPassed).toBe(1);
    expect(repairPlan.report.summary.missingPlans).toBeGreaterThan(0);
    expect(repairPlan.report.summary.repairablePlans).toBe(0);
    expect(repairPlan.report.summary.operatorActionRequired).toBe(1);
    expect(githubRepair?.status).toBe("audit_passed");
    expect(deploymentRepair?.status).toBe("operator_action_required");
    expect(deploymentRepair?.repairableBlockers.some((blocker) => blocker.startsWith("unsafe dry-run command"))).toBe(
      true
    );
    expect(deploymentRepair?.operatorBlockers).toContain("approval state is approval_required");
    expect(deploymentRepair?.regenerationCommand).toContain("deployment-mutation-plan");
    expect(deploymentRepair?.approvalCommand).toContain("--target deployment");
    expect(hermesRepair?.status).toBe("missing_plan");
    expect(hermesRepair?.regenerationCommand).toContain("hermes-cron-mutation-plan");
    const repairPlanMarkdown = await fs.readFile(repairPlan.markdownPath, "utf8");
    expect(repairPlanMarkdown).toContain("## Target Commands");
    expect(repairPlanMarkdown).toContain("#### Approval Request");
    expect(repairPlanMarkdown).toContain("npm run ariadne -- approval-request --project <project> --by <operator> --target deployment");
    expect(repairPlanMarkdown).toContain("#### Next Action Commands");
    expect(repairPlanMarkdown).toContain("live-adapter-operator-evidence --project <project> --target deployment");
    const approvalPack = await generateLiveAdapterApprovalPack({ project: "ariadne", vaultRoot });
    expect(approvalPack.report.status).toBe("ready_for_operator_review");
    expect(approvalPack.report.summary.packets).toBe(5);
    expect(approvalPack.report.packets.some((packet) => packet.target === "github")).toBe(false);
    const deploymentPacket = approvalPack.report.packets.find((packet) => packet.target === "deployment");
    expect(deploymentPacket?.recommendedRisk).toBe("high");
    expect(deploymentPacket?.operatorDecisionRequired).toBe(true);
    expect(deploymentPacket?.approvalRequestCommand).toContain("approval-request");
    expect(deploymentPacket?.approvalRequestCommand).toContain("--target deployment");
    expect(deploymentPacket?.requiredEvidence).toContain("host identity, service state, sudo boundary, and rollback host evidence");
    expect(deploymentPacket?.executionCommand).toBe("Run a passed dry-run for an audit-passed plan first.");
    const githubOnlyPack = await generateLiveAdapterApprovalPack({ project: "ariadne", vaultRoot, target: "github" });
    expect(githubOnlyPack.report.status).toBe("complete");
    expect(githubOnlyPack.report.summary.packets).toBe(0);
    await expect(
      runMutationDryRun({
        project: "ariadne",
        vaultRoot,
        plan: mismatchedMutationReadiness.plan.id,
        timeoutMs: 10_000
      })
    ).rejects.toThrow(/is blocked/);

    await recordSleepRoutine({
      project: "ariadne",
      vaultRoot,
      scope: "nightly",
      summary: "Review new evidence and propose the next run.",
      evidenceRefs: [behavior.jsonPath],
      nextActions: ["Refresh console data."]
    });
    await recordMemoryProposal({
      project: "ariadne",
      vaultRoot,
      title: "Preserve adapter stance",
      proposal: "Treat GBrain as a memory substrate, not as source of truth.",
      evidenceRefs: [behavior.jsonPath]
    });
    await recordAgentMail({
      project: "ariadne",
      vaultRoot,
      from: "planner",
      to: "executor",
      subject: "Next bounded slice",
      body: "Run artifact checks before implementation.",
      taskId: "TASK-001",
      runId: execution.run.id
    });
    await recordAgentLease({
      project: "ariadne",
      vaultRoot,
      agent: "executor",
      resource: "repo:/ariadne",
      status: "acquired",
      taskId: "TASK-001",
      runId: execution.run.id
    });

    const hermesCronPath = path.join(temp, "hermes-cron.json");
    await fs.writeFile(
      hermesCronPath,
      JSON.stringify({
        jobs: [
          {
            id: "nightly-memory",
            name: "Nightly memory consolidation",
            schedule: "0 2 * * *",
            enabled: true,
            prompt: "Summarise evidence and write a memory proposal.",
            apiKey: "fixture-token-should-be-redacted"
          },
          {
            id: "stale-gates",
            name: "Stale gate report",
            cron: "30 8 * * 1-5",
            disabled: true,
            command: "npm run ariadne -- control --project ariadne"
          }
        ]
      })
    );
    const hermesCron = await importHermesCronSnapshot({
      project: "ariadne",
      vaultRoot,
      sourcePath: hermesCronPath,
      host: "beast"
    });
    expect(hermesCron.snapshot.mode).toBe("read_only");
    expect(hermesCron.snapshot.summary.jobs).toBe(2);
    expect(hermesCron.snapshot.summary.enabled).toBe(1);
    expect(hermesCron.snapshot.summary.disabled).toBe(1);
    expect(hermesCron.snapshot.sourcePath).toBe("<WORKSPACE_ROOT>/hermes-cron.json");
    expect(JSON.stringify(hermesCron.snapshot.raw)).not.toContain("fixture-token-should-be-redacted");

    const hermesProposal = await generateHermesCronProposal({ project: "ariadne", vaultRoot, scope: "nightly" });
    expect(hermesProposal.proposal.mode).toBe("proposal_only");
    expect(hermesProposal.proposal.summary.snapshots).toBe(1);
    expect(hermesProposal.proposal.summary.proposedActions).toBe(2);
    expect(hermesProposal.proposal.proposedActions.some((action) => action.kind === "review")).toBe(true);
    await fs.writeFile(
      path.join(vaultRoot, "projects", "ariadne", "coordination", "hermes", "hermes-cron-proposal-bad.json"),
      JSON.stringify({ schemaVersion: 1, mode: "proposal_only", generatedAt: new Date().toISOString(), proposedActions: [] })
    );

    const deploymentPath = path.join(temp, "deployment.json");
    await fs.writeFile(
      deploymentPath,
      JSON.stringify({
        host: { short_name: "beast" },
        services: [{ name: "hermes" }],
        modelEndpoints: [{ name: "dgx-spark" }],
        runnerPools: [{ name: "local" }],
        storagePools: [{ name: "vault-backup" }]
      })
    );
    const deployment = await importDeploymentSnapshot({
      project: "ariadne",
      vaultRoot,
      sourcePath: deploymentPath,
      system: "proxmox"
    });
    expect(deployment.snapshot.mode).toBe("read_only");
    expect(deployment.snapshot.summary.host).toBe("beast");

    await generateLiveAdapterApprovalPack({ project: "ariadne", vaultRoot });
    const githubDossier = await generateLiveAdapterTargetDossier({ project: "ariadne", vaultRoot, target: "github" });
    expect(githubDossier.dossier.status).toBe("ready_for_adapter_work");
    const deploymentDossier = await generateLiveAdapterTargetDossier({ project: "ariadne", vaultRoot, target: "deployment" });
    expect(deploymentDossier.dossier.status).toBe("ready_for_operator_review");
    expect(deploymentDossier.dossier.summary.packetPresent).toBe(true);
    expect(deploymentDossier.dossier.summary.reviewAuditStatus).toBe("missing_review");
    expect(deploymentDossier.dossier.gbrainContext.suggestedQueries.some((query) => query.includes("deployment"))).toBe(true);
    const githubOperatorEvidencePath = path.join(temp, "github-complete-operator-evidence.md");
    await fs.writeFile(
      githubOperatorEvidencePath,
      [
        "# Filled GitHub Operator Evidence",
        "",
        "- Operator: James",
        "- Review timestamp: 2026-05-17T04:00:00Z",
        "- Packet reviewed: control/live-adapter-approval-pack.json",
        "- Decision for packet completeness: complete",
        "",
        "## Required Evidence To Attach",
        "",
        "- [x] operator identity and review timestamp",
        "- [x] reviewed approval packet path and generation timestamp",
        "- [x] authentication or authorization boundary observed for this target",
        "- [x] bounded action statement and explicit non-goals",
        "- [x] rollback or disable path checked by the operator",
        "- [x] post-action verification command checked by the operator",
        "- [x] dry-run command and expected safe output shape",
        "- [x] target-guarded execution command and expected post-verification output shape",
        "- [x] proof that execution used mutation-execute or a target-specific wrapper with an exact --confirm-plan match",
        "",
        "## GBrain Notes",
        "",
        "- Query result refs: integrations/gbrain/gbrain-report-1.json",
        ""
      ].join("\n")
    );
    const githubOperatorEvidence = await recordLiveAdapterOperatorEvidence({
      project: "ariadne",
      vaultRoot,
      target: "github",
      sourcePath: githubOperatorEvidencePath,
      reviewedBy: "James"
    });
    expect(githubOperatorEvidence.record.status).toBe("complete");
    const malformedDossier = path.join(
      vaultRoot,
      "projects",
      "ariadne",
      "control",
      "live-adapter-dossiers",
      "live-adapter-dossier-bad.json"
    );
    await fs.writeFile(malformedDossier, "{bad json\n");
    const cutoverAudit = await generateLiveAdapterCutoverAudit({ project: "ariadne", vaultRoot });
    await fs.rm(malformedDossier);
    const githubCutover = cutoverAudit.audit.targets.find((target) => target.target === "github");
    const deploymentCutover = cutoverAudit.audit.targets.find((target) => target.target === "deployment");
    expect(cutoverAudit.audit.status).toBe("blocked");
    expect(cutoverAudit.audit.summary.ready).toBe(1);
    expect(githubCutover?.status).toBe("ready_for_cutover");
    expect(githubCutover?.gates.some((gate) => gate.id === "operator-evidence-complete" && gate.status === "passed")).toBe(true);
    expect(githubCutover?.gates.some((gate) => gate.id === "gbrain-context-advisory" && gate.status === "advisory")).toBe(true);
    expect(deploymentCutover?.status).toBe("blocked");
    expect(deploymentCutover?.blockers.some((blocker) => blocker.includes("Operator evidence complete"))).toBe(true);
    expect(deploymentCutover?.blockers.some((blocker) => blocker.includes("Current accepted operator packet review"))).toBe(true);
    const scopedGithubCutover = await generateLiveAdapterCutoverAudit({ project: "ariadne", vaultRoot, target: "github" });
    expect(scopedGithubCutover.jsonPath).toContain("live-adapter-cutover-audit-github.json");
    expect(scopedGithubCutover.audit.target).toBe("github");
    expect(scopedGithubCutover.audit.summary.targets).toBe(1);
    expect(scopedGithubCutover.audit.summary.ready).toBe(1);
    expect(scopedGithubCutover.audit.targets.map((target) => target.target)).toEqual(["github"]);
    const allTargetCutoverJson = JSON.parse(await fs.readFile(cutoverAudit.jsonPath, "utf8"));
    expect(allTargetCutoverJson.target).toBeUndefined();
    expect(allTargetCutoverJson.summary.targets).toBe(6);
    const reviewSession = await generateLiveAdapterReviewSession({ project: "ariadne", vaultRoot });
    expect(reviewSession.session.status).toBe("operator_review_required");
    expect(reviewSession.session.mutationApproved).toBe(false);
    expect(reviewSession.session.operatorDecisionRequired).toBe(true);
    expect(reviewSession.session.mutationRepairPlanRef).toContain("mutation-readiness-repair-plan.json");
    expect(reviewSession.session.summary.targets).toBe(6);
    expect(reviewSession.session.summary.readyForAdapterWork).toBe(1);
    expect(reviewSession.session.summary.operatorReviewRequired).toBe(5);
    const deploymentSession = reviewSession.session.targets.find((target) => target.target === "deployment");
    const githubSession = reviewSession.session.targets.find((target) => target.target === "github");
    expect(deploymentSession?.reviewCommand).toContain("live-adapter-approval-review");
    expect(deploymentSession?.operatorEvidenceStatus).toBe("needs_evidence");
    expect(deploymentSession?.operatorEvidenceCheckCommand).toContain("live-adapter-operator-evidence-check");
    expect(deploymentSession?.operatorEvidenceImportCommand).toContain("live-adapter-operator-evidence");
    expect(deploymentSession?.operatorEvidenceFileRef).toContain("control/operator-evidence/deployment/operator-evidence.md");
    expect(deploymentSession?.missingOperatorEvidenceSections).toContain("Post-action verification command");
    expect(deploymentSession?.approvalRequestCommand).toContain("--target deployment");
    expect(deploymentSession?.mutationRepairStatus).toBe("operator_action_required");
    expect(deploymentSession?.mutationRepairApprovalCommand).toContain("--target deployment");
    expect(deploymentSession?.mutationRepairRegenerationCommand).toContain("deployment-mutation-plan");
    expect(deploymentSession?.mutationRepairNextActionCommands.some((command) => command.includes("live-adapter-approval-review"))).toBe(true);
    expect(deploymentSession?.gbrainContext.suggestedQueries.some((query) => query.includes("deployment"))).toBe(true);
    expect(githubSession?.status).toBe("ready_for_adapter_work");
    expect(githubSession?.cutoverStatus).toBe("ready_for_cutover");
    const scopedDeploymentReviewSession = await generateLiveAdapterReviewSession({
      project: "ariadne",
      vaultRoot,
      target: "deployment"
    });
    expect(scopedDeploymentReviewSession.jsonPath).toContain("live-adapter-review-session-deployment.json");
    expect(scopedDeploymentReviewSession.session.target).toBe("deployment");
    expect(scopedDeploymentReviewSession.session.summary.targets).toBe(1);
    expect(scopedDeploymentReviewSession.session.summary.operatorReviewRequired).toBe(1);
    expect(scopedDeploymentReviewSession.session.targets.map((target) => target.target)).toEqual(["deployment"]);
    expect(scopedDeploymentReviewSession.session.cutoverAuditRef).toContain("live-adapter-cutover-audit-deployment.json");
    const allTargetReviewSessionJson = JSON.parse(await fs.readFile(reviewSession.jsonPath, "utf8"));
    expect(allTargetReviewSessionJson.target).toBeUndefined();
    expect(allTargetReviewSessionJson.summary.targets).toBe(6);
    const reviewSessionMarkdown = await fs.readFile(reviewSession.markdownPath, "utf8");
    expect(reviewSessionMarkdown).toContain("Operator Evidence Action");
    expect(reviewSessionMarkdown).toContain("Missing operator evidence sections");
    expect(reviewSessionMarkdown).toContain("Mutation repair plan");
    expect(reviewSessionMarkdown).toContain("#### Mutation Repair");
    expect(reviewSessionMarkdown).toContain("deployment-mutation-plan");
    const staleReviewSessionJson = JSON.parse(await fs.readFile(reviewSession.jsonPath, "utf8"));
    // Simulate a stale deployment review-session target that predates mutation repair fields.
    staleReviewSessionJson.targets = staleReviewSessionJson.targets.map((target: Record<string, unknown>) => {
      if (target.target !== "deployment") return target;
      delete target.mutationRepairStatus;
      delete target.mutationRepairNextActionCommands;
      return target;
    });
    await fs.writeFile(reviewSession.jsonPath, `${JSON.stringify(staleReviewSessionJson, null, 2)}\n`);
    const staleReviewConsole = await generateConsoleHtml({ project: "ariadne", vaultRoot, refreshData: true });
    const staleReviewHtml = await fs.readFile(staleReviewConsole.htmlPath, "utf8");
    expect(staleReviewHtml).toContain("unknown");
    expect(staleReviewHtml).toContain("Mutation repair commands remain scaffolds");
    const malformedQueue = path.join(vaultRoot, "projects", "ariadne", "control", "live-adapter-operator-evidence-queue.json");
    const malformedAssist = path.join(vaultRoot, "projects", "ariadne", "control", "live-adapter-operator-evidence-assist.json");
    await fs.writeFile(malformedQueue, JSON.stringify({ schemaVersion: 1, targets: [{ target: 123 }] }));
    await fs.writeFile(
      malformedAssist,
      JSON.stringify({
        schemaVersion: 1,
        operatorEvidenceRecordCreated: false,
        mutationApproved: false,
        approvalGranted: false,
        targets: [{ target: "github", assistFileRef: 123, nextSteps: [false] }]
      })
    );
    const malformedOptionalReviewSession = await generateLiveAdapterReviewSession({ project: "ariadne", vaultRoot });
    expect(malformedOptionalReviewSession.session.operatorEvidenceQueueRef).toBeUndefined();
    expect(malformedOptionalReviewSession.session.operatorEvidenceAssistRef).toBeUndefined();
    await fs.rm(malformedQueue, { force: true });
    await fs.rm(malformedAssist, { force: true });
    const evidenceTemplates = await generateLiveAdapterEvidenceTemplates({ project: "ariadne", vaultRoot });
    expect(evidenceTemplates.pack.status).toBe("awaiting_operator_evidence");
    expect(evidenceTemplates.pack.mutationApproved).toBe(false);
    expect(evidenceTemplates.pack.summary.templates).toBe(6);
    expect(evidenceTemplates.pack.summary.gbrainQueryItems).toBe(18);
    const deploymentTemplate = evidenceTemplates.pack.templates.find((template) => template.target === "deployment");
    expect(deploymentTemplate?.templateRef).toContain("live-adapter-evidence-template-deployment.md");
    expect(deploymentTemplate?.requiredEvidence).toContain("rollback or disable path checked by the operator");
    expect(deploymentTemplate?.notes.some((note) => note.includes("not approval evidence"))).toBe(true);
    const uncheckedQueue = await generateLiveAdapterOperatorEvidenceQueue({ project: "ariadne", vaultRoot });
    const uncheckedDeploymentQueue = uncheckedQueue.queue.targets.find((target) => target.target === "deployment");
    expect(uncheckedDeploymentQueue?.status).toBe("unchecked");
    expect(uncheckedDeploymentQueue?.missingSections).toContain("Operator identity and timestamp");
    const batchPreflight = await checkAllLiveAdapterOperatorEvidence({
      project: "ariadne",
      vaultRoot,
      notes: "Batch preflight only"
    });
    expect(batchPreflight.batch.status).toBe("incomplete");
    expect(batchPreflight.batch.mutationApproved).toBe(false);
    expect(batchPreflight.batch.approvalGranted).toBe(false);
    expect(batchPreflight.batch.source).toBe("templates");
    expect(batchPreflight.batch.summary.targets).toBe(6);
    expect(batchPreflight.batch.summary.checks).toBe(6);
    expect(batchPreflight.batch.summary.incompleteChecks).toBe(6);
    expect(batchPreflight.batch.summary.failedChecks).toBe(0);
    expect(batchPreflight.batch.summary.missingSources).toBe(0);
    expect(batchPreflight.batch.summary.missingTemplates).toBe(0);
    expect(batchPreflight.batch.queueRef).toBe("projects/ariadne/control/live-adapter-operator-evidence-queue.json");
    const completeEvidencePath = path.join(temp, "complete-operator-evidence.md");
    await fs.writeFile(
      completeEvidencePath,
      [
        "# Filled Operator Evidence",
        "",
        "- Operator: James",
        "- Review timestamp: 2026-05-17T04:00:00Z",
        "- Packet reviewed: control/live-adapter-approval-pack.json",
        "- Decision for packet completeness: complete",
        "- Missing evidence: none",
        "",
        "## Required Evidence To Attach",
        "",
        "- [x] operator identity and review timestamp",
        "- [x] reviewed approval packet path and generation timestamp",
        "- [x] authentication or authorization boundary observed for this target",
        "- [x] bounded action statement and explicit non-goals",
        "- [x] rollback or disable path checked by the operator",
        "- [x] post-action verification command checked by the operator",
        "- [x] dry-run command and expected safe output shape",
        "- [x] target-guarded execution command and expected post-verification output shape",
        "- [x] proof that execution used mutation-execute or a target-specific wrapper with an exact --confirm-plan match",
        "",
        "## GBrain Advisory Queries",
        "",
        "- [x] GBrain query: deployment assumptions",
        "",
        "## GBrain Notes",
        "",
        "- Query result refs: integrations/gbrain/gbrain-report-1.json",
        "- Stale assumptions found: none",
        "- Related Ariadne evidence refs: control/live-adapter-dossiers/live-adapter-dossier-deployment.json",
        ""
      ].join("\n")
    );
    const incompleteEvidencePath = path.join(temp, "incomplete-operator-evidence.md");
    await fs.writeFile(
      incompleteEvidencePath,
      [
        "# Partial Operator Evidence",
        "",
        "- Operator:",
        "- Review timestamp:",
        "- Packet reviewed: control/live-adapter-approval-pack.json",
        "- Decision for packet completeness:",
        "",
        "## Required Evidence To Attach",
        "",
        "- [x] reviewed approval packet path and generation timestamp",
        "- [ ] authentication or authorization boundary observed for this target",
        "- [ ] rollback or disable path checked by the operator",
        ""
      ].join("\n")
    );
    const preflight = await checkLiveAdapterOperatorEvidence({
      project: "ariadne",
      vaultRoot,
      target: "notebooklm",
      sourcePath: completeEvidencePath,
      notes: "Preflight only"
    });
    expect(preflight.check.status).toBe("complete");
    expect(preflight.check.recorded).toBe(false);
    expect(preflight.check.operatorEvidenceRecordCreated).toBe(false);
    expect(preflight.check.mutationApproved).toBe(false);
    expect(preflight.check.approvalGranted).toBe(false);
    const completeOperatorEvidence = await recordLiveAdapterOperatorEvidence({
      project: "ariadne",
      vaultRoot,
      target: "deployment",
      sourcePath: completeEvidencePath,
      reviewedBy: "James"
    });
    expect(completeOperatorEvidence.record.status).toBe("complete");
    expect(completeOperatorEvidence.record.mutationApproved).toBe(false);
    expect(completeOperatorEvidence.record.approvalGranted).toBe(false);
    const incompleteOperatorEvidence = await recordLiveAdapterOperatorEvidence({
      project: "ariadne",
      vaultRoot,
      target: "hermes-cron",
      sourcePath: incompleteEvidencePath,
      reviewedBy: "James"
    });
    expect(incompleteOperatorEvidence.record.status).toBe("incomplete");
    expect(incompleteOperatorEvidence.record.summary.missingSections).toBeGreaterThan(0);
    const operatorEvidenceAudit = await generateLiveAdapterOperatorEvidenceAudit({ project: "ariadne", vaultRoot });
    expect(operatorEvidenceAudit.audit.status).toBe("blocked");
    expect(operatorEvidenceAudit.audit.summary.records).toBe(3);
    expect(operatorEvidenceAudit.audit.summary.completeTargets).toBe(2);
    expect(operatorEvidenceAudit.audit.summary.incompleteTargets).toBe(1);
    expect(operatorEvidenceAudit.audit.summary.missingTargets).toBe(3);
    expect(operatorEvidenceAudit.audit.summary.missingSections).toBeGreaterThan(
      incompleteOperatorEvidence.record.summary.missingSections
    );
    const missingTargetEvidence = operatorEvidenceAudit.audit.targets.find((target) => target.status === "missing_evidence");
    expect(missingTargetEvidence?.missingSections).toContain("Operator identity and timestamp");
    const operatorEvidenceWorkplan = await generateLiveAdapterOperatorEvidenceWorkplan({ project: "ariadne", vaultRoot });
    expect(operatorEvidenceWorkplan.workplan.status).toBe("evidence_required");
    expect(operatorEvidenceWorkplan.workplan.mutationApproved).toBe(false);
    expect(operatorEvidenceWorkplan.workplan.summary.checkCommands).toBe(6);
    expect(operatorEvidenceWorkplan.workplan.summary.importCommands).toBe(4);
    const hermesWorkplan = operatorEvidenceWorkplan.workplan.targets.find((target) => target.target === "hermes-cron");
    expect(hermesWorkplan?.status).toBe("needs_rework");
    expect(hermesWorkplan?.checkCommand).toContain("live-adapter-operator-evidence-check");
    expect(hermesWorkplan?.importCommand).toContain("live-adapter-operator-evidence");
    expect(hermesWorkplan?.gbrainQueries.length).toBeGreaterThan(0);
    const operatorEvidenceQueue = await generateLiveAdapterOperatorEvidenceQueue({ project: "ariadne", vaultRoot });
    expect(operatorEvidenceQueue.queue.status).toBe("ready_for_import");
    expect(operatorEvidenceQueue.queue.mutationApproved).toBe(false);
    expect(operatorEvidenceQueue.queue.summary.readyForImport).toBe(1);
    expect(operatorEvidenceQueue.queue.summary.needsRework).toBe(1);
    expect(operatorEvidenceQueue.queue.summary.needsEvidence).toBe(2);
    expect(operatorEvidenceQueue.queue.summary.uncheckedTargets).toBe(0);
    expect(operatorEvidenceQueue.queue.summary.latestChecks).toBe(6);
    const notebookQueue = operatorEvidenceQueue.queue.targets.find((target) => target.target === "notebooklm");
    expect(notebookQueue?.status).toBe("ready_for_import");
    expect(notebookQueue?.latestCheckMissingSections).toBe(0);
    expect(notebookQueue?.nextAction).toContain("Import the checked evidence file");
    const hermesQueue = operatorEvidenceQueue.queue.targets.find((target) => target.target === "hermes-cron");
    expect(hermesQueue?.missingSections).toContain("Post-action verification command");
    const queueMarkdown = await fs.readFile(operatorEvidenceQueue.markdownPath, "utf8");
    expect(queueMarkdown).toContain("Missing section labels");
    expect(queueMarkdown).toContain("Post-action verification command");
    const operatorEvidenceWorkspace = await generateLiveAdapterOperatorEvidenceWorkspace({ project: "ariadne", vaultRoot });
    expect(operatorEvidenceWorkspace.workspace.status).toBe("awaiting_operator_input");
    expect(operatorEvidenceWorkspace.workspace.mutationApproved).toBe(false);
    expect(operatorEvidenceWorkspace.workspace.approvalGranted).toBe(false);
    expect(operatorEvidenceWorkspace.workspace.summary.targets).toBe(6);
    expect(operatorEvidenceWorkspace.workspace.summary.workspaceFiles).toBe(6);
    expect(operatorEvidenceWorkspace.workspace.summary.supportFiles).toBe(36);
    const githubWorkspace = operatorEvidenceWorkspace.workspace.targets.find((target) => target.target === "github");
    expect(githubWorkspace?.evidenceFileRef).toContain("control/operator-evidence/github/operator-evidence.md");
    expect(githubWorkspace?.checkCommand).toContain("control/operator-evidence/github/operator-evidence.md");
    expect(githubWorkspace?.supportFileRefs).toContain("projects/ariadne/control/operator-evidence/github/gbrain-notes.md");
    expect(githubWorkspace?.supportFileRefs).toContain("projects/ariadne/control/operator-evidence/github/read-only-assist.md");
    const githubWorkspaceFile = path.join(vaultRoot, githubWorkspace?.evidenceFileRef ?? "");
    await fs.appendFile(githubWorkspaceFile, "\nOperator draft marker: keep me\n");
    const queueJsonBeforeScopedWorkspace = await fs.readFile(operatorEvidenceQueue.jsonPath, "utf8");
    const workplanJsonBeforeScopedWorkspace = await fs.readFile(operatorEvidenceWorkplan.jsonPath, "utf8");
    const scopedHermesWorkspace = await generateLiveAdapterOperatorEvidenceWorkspace({
      project: "ariadne",
      vaultRoot,
      target: "hermes-cron"
    });
    expect(scopedHermesWorkspace.jsonPath).toContain("live-adapter-operator-evidence-workspace-hermes-cron.json");
    expect(scopedHermesWorkspace.workspace.target).toBe("hermes-cron");
    expect(scopedHermesWorkspace.workspace.summary.targets).toBe(1);
    expect(scopedHermesWorkspace.workspace.summary.workspaceFiles).toBe(1);
    expect(scopedHermesWorkspace.workspace.summary.supportFiles).toBe(6);
    expect(scopedHermesWorkspace.workspace.targets.map((target) => target.target)).toEqual(["hermes-cron"]);
    expect(scopedHermesWorkspace.workspace.workplanRef).toBe(operatorEvidenceQueue.queue.workplanRef);
    expect(scopedHermesWorkspace.workspace.targets[0]?.missingSections).toEqual(hermesQueue?.missingSections);
    await expect(fs.readFile(operatorEvidenceQueue.jsonPath, "utf8")).resolves.toBe(queueJsonBeforeScopedWorkspace);
    await expect(fs.readFile(operatorEvidenceWorkplan.jsonPath, "utf8")).resolves.toBe(workplanJsonBeforeScopedWorkspace);
    const operatorEvidenceAssist = await generateLiveAdapterOperatorEvidenceAssist({ project: "ariadne", vaultRoot });
    expect(operatorEvidenceAssist.assist.status).toBe("awaiting_operator_review");
    expect(operatorEvidenceAssist.assist.mutationApproved).toBe(false);
    expect(operatorEvidenceAssist.assist.approvalGranted).toBe(false);
    expect(operatorEvidenceAssist.assist.operatorEvidenceRecordCreated).toBe(false);
    expect(operatorEvidenceAssist.assist.summary.targets).toBe(6);
    expect(operatorEvidenceAssist.assist.summary.assistFiles).toBe(6);
    expect(operatorEvidenceAssist.assist.summary.supportFileRefs).toBe(36);
    const githubAssist = operatorEvidenceAssist.assist.targets.find((target) => target.target === "github");
    expect(githubAssist?.assistFileRef).toBe("projects/ariadne/control/operator-evidence/github/read-only-assist.md");
    const hermesAssist = operatorEvidenceAssist.assist.targets.find((target) => target.target === "hermes-cron");
    expect(hermesAssist?.nextSteps).toContain("Verify each relevant fact manually before copying it into operator-evidence.md.");
    const assistMarkdown = await fs.readFile(operatorEvidenceAssist.markdownPath, "utf8");
    expect(assistMarkdown).toContain("does not create operator evidence records");
    const githubAssistMarkdown = await fs.readFile(path.join(vaultRoot, githubAssist?.assistFileRef ?? ""), "utf8");
    expect(githubAssistMarkdown).toContain("This file is generated from existing Ariadne artifacts.");
    expect(githubAssistMarkdown).toContain("GBrain Advisory Queries");
    expect(await fs.readFile(githubWorkspaceFile, "utf8")).toContain("Operator draft marker: keep me");
    const scopedHermesAssist = await generateLiveAdapterOperatorEvidenceAssist({
      project: "ariadne",
      vaultRoot,
      target: "hermes-cron"
    });
    expect(scopedHermesAssist.jsonPath).toContain("live-adapter-operator-evidence-assist-hermes-cron.json");
    expect(scopedHermesAssist.assist.target).toBe("hermes-cron");
    expect(scopedHermesAssist.assist.summary.targets).toBe(1);
    expect(scopedHermesAssist.assist.targets.map((target) => target.target)).toEqual(["hermes-cron"]);
    const scopedHermesReviewSession = await generateLiveAdapterReviewSession({
      project: "ariadne",
      vaultRoot,
      target: "hermes-cron"
    });
    expect(scopedHermesReviewSession.session.operatorEvidenceAssistRef).toBe(
      "projects/ariadne/control/live-adapter-operator-evidence-assist-hermes-cron.json"
    );
    expect(scopedHermesReviewSession.session.targets.map((target) => target.target)).toEqual(["hermes-cron"]);
    expect(scopedHermesReviewSession.session.summary.targets).toBe(1);
    const assistedReviewSession = await generateLiveAdapterReviewSession({ project: "ariadne", vaultRoot });
    const assistedGithubSession = assistedReviewSession.session.targets.find((target) => target.target === "github");
    expect(assistedReviewSession.session.operatorEvidenceQueueRef).toBe(
      "projects/ariadne/control/live-adapter-operator-evidence-queue.json"
    );
    expect(assistedReviewSession.session.operatorEvidenceAssistRef).toBe(
      "projects/ariadne/control/live-adapter-operator-evidence-assist.json"
    );
    expect(assistedGithubSession?.operatorEvidenceQueueStatus).toBe("complete");
    expect(assistedGithubSession?.operatorEvidenceAssistFileRef).toBe(
      "projects/ariadne/control/operator-evidence/github/read-only-assist.md"
    );
    expect(assistedGithubSession?.latestOperatorEvidenceCheckRef).toContain("operator-evidence-check-github-");
    expect(assistedGithubSession?.operatorEvidenceAssistNextSteps.length).toBeGreaterThan(0);
    const assistedReviewMarkdown = await fs.readFile(assistedReviewSession.markdownPath, "utf8");
    expect(assistedReviewMarkdown).toContain("Operator evidence queue");
    expect(assistedReviewMarkdown).toContain("Read-only assist");
    const workspaceBatchPreflight = await checkAllLiveAdapterOperatorEvidence({
      project: "ariadne",
      vaultRoot,
      source: "workspace",
      notes: "Workspace preflight only"
    });
    expect(workspaceBatchPreflight.batch.source).toBe("workspace");
    expect(workspaceBatchPreflight.batch.workspaceRef).toBe("projects/ariadne/control/live-adapter-operator-evidence-workspace.json");
    const githubBatchPreflight = workspaceBatchPreflight.batch.targets.find((target) => target.target === "github");
    expect(githubBatchPreflight?.evidenceFileRef).toContain("control/operator-evidence/github/operator-evidence.md");
    expect(githubBatchPreflight?.missingSectionLabels).toContain("Operator identity and timestamp");
    expect(githubBatchPreflight?.missingSectionLabels).toContain("Exact confirm-plan proof");
    const batchMarkdown = await fs.readFile(workspaceBatchPreflight.markdownPath, "utf8");
    expect(batchMarkdown).toContain("Missing section labels");
    expect(batchMarkdown).toContain("Operator identity and timestamp");
    const queueJsonBeforeScopedPreflight = await fs.readFile(operatorEvidenceQueue.jsonPath, "utf8");
    const workplanJsonBeforeScopedPreflight = await fs.readFile(operatorEvidenceWorkplan.jsonPath, "utf8");
    const scopedHermesPreflight = await checkAllLiveAdapterOperatorEvidence({
      project: "ariadne",
      vaultRoot,
      source: "workspace",
      target: "hermes-cron",
      notes: "Hermes workspace preflight only"
    });
    expect(scopedHermesPreflight.jsonPath).toContain("live-adapter-operator-evidence-check-all-hermes-cron.json");
    expect(scopedHermesPreflight.batch.target).toBe("hermes-cron");
    expect(scopedHermesPreflight.batch.workspaceRef).toBe(
      "projects/ariadne/control/live-adapter-operator-evidence-workspace-hermes-cron.json"
    );
    expect(scopedHermesPreflight.batch.summary.targets).toBe(1);
    expect(scopedHermesPreflight.batch.targets.map((target) => target.target)).toEqual(["hermes-cron"]);
    await expect(fs.readFile(operatorEvidenceQueue.jsonPath, "utf8")).resolves.toBe(queueJsonBeforeScopedPreflight);
    await expect(fs.readFile(operatorEvidenceWorkplan.jsonPath, "utf8")).resolves.toBe(workplanJsonBeforeScopedPreflight);
    const gsd2Workspace = operatorEvidenceWorkspace.workspace.targets.find((target) => target.target === "gsd2");
    expect(gsd2Workspace?.evidenceFileRef).toContain("control/operator-evidence/gsd2/operator-evidence.md");
    const gsd2WorkspaceFile = path.join(vaultRoot, gsd2Workspace?.evidenceFileRef ?? "");
    await fs.writeFile(gsd2WorkspaceFile, await fs.readFile(completeEvidencePath, "utf8"));
    await checkLiveAdapterOperatorEvidence({
      project: "ariadne",
      vaultRoot,
      target: "gsd2",
      sourcePath: gsd2WorkspaceFile,
      notes: "Ready for batch import"
    });
    const importReady = await importReadyLiveAdapterOperatorEvidence({
      project: "ariadne",
      vaultRoot,
      reviewedBy: "James",
      target: "gsd2",
      notes: "Batch import complete preflight checks only"
    });
    expect(importReady.jsonPath).toContain("live-adapter-operator-evidence-import-ready-gsd2.json");
    expect(importReady.batch.target).toBe("gsd2");
    expect(importReady.batch.status).toBe("imported");
    expect(importReady.batch.summary.targets).toBe(1);
    expect(importReady.batch.summary.imported).toBe(1);
    expect(importReady.batch.targets.map((target) => target.target)).toEqual(["gsd2"]);
    expect(importReady.batch.mutationApproved).toBe(false);
    expect(importReady.batch.approvalGranted).toBe(false);
    expect(importReady.batch.notes).toBe("Batch import complete preflight checks only");
    expect(importReady.batch.summary.imported).toBe(1);
    expect(importReady.batch.summary.failed).toBe(0);
    const postScopedImportQueue = await generateLiveAdapterOperatorEvidenceQueue({ project: "ariadne", vaultRoot });
    expect(postScopedImportQueue.queue.targets.find((target) => target.target === "gsd2")?.status).toBe("complete");
    expect(postScopedImportQueue.queue.targets.find((target) => target.target === "notebooklm")?.operatorEvidenceStatus).toBe(
      "missing_evidence"
    );
    const gsd2Import = importReady.batch.targets.find((target) => target.target === "gsd2");
    expect(gsd2Import?.status).toBe("imported");
    expect(gsd2Import?.recordRef).toContain("control/live-adapter-operator-evidence/operator-evidence-gsd2-");
    const importReadyMarkdown = await fs.readFile(importReady.markdownPath, "utf8");
    expect(importReadyMarkdown).toContain("does not approve mutation");
    expect(importReadyMarkdown).toContain("Notes: Batch import complete preflight checks only");
    await generateArtifactCheckReport({ project: "ariadne", vaultRoot });
    const roadmapCompletion = await generateRoadmapCompletionAudit({ project: "ariadne", vaultRoot });
    expect(roadmapCompletion.audit.status).toBe("blocked");
    expect(roadmapCompletion.audit.summary.passed).toBeGreaterThan(0);
    expect(roadmapCompletion.audit.requirements.find((item) => item.id === "gbrain-advisory-context")?.status).toBe("passed");
    const operatorEvidenceRequirement = roadmapCompletion.audit.requirements.find((item) => item.id === "operator-evidence");
    expect(operatorEvidenceRequirement?.status).toBe("blocked");
    expect(operatorEvidenceRequirement?.detail).toContain("missing section");
    expect(operatorEvidenceRequirement?.detail).toContain("Next target is");
    const nextTarget = operatorEvidenceRequirement?.detail.match(/Next target is ([a-z0-9-]+)/)?.[1];
    expect(nextTarget).toBeTruthy();
    expect(operatorEvidenceRequirement?.nextCommands.length).toBeGreaterThan(0);
    expect(operatorEvidenceRequirement?.nextCommands).toContain("npm run ariadne -- live-adapter-operator-evidence-workplan --project ariadne");
    expect(operatorEvidenceRequirement?.nextCommands).toContain("npm run ariadne -- live-adapter-operator-evidence-queue --project ariadne");
    expect(
      operatorEvidenceRequirement?.nextCommands.some((command) =>
        command.includes(`live-adapter-operator-evidence-workspace --project ariadne --target ${nextTarget}`)
      )
    ).toBe(true);
    expect(
      operatorEvidenceRequirement?.nextCommands.some((command) =>
        command.includes(`live-adapter-operator-evidence-assist --project ariadne --target ${nextTarget}`)
      )
    ).toBe(true);
    expect(
      operatorEvidenceRequirement?.nextCommands.some((command) =>
        command.includes(`live-adapter-operator-evidence-check-all --project ariadne --source workspace --target ${nextTarget}`)
      )
    ).toBe(true);
    expect(
      operatorEvidenceRequirement?.nextCommands.some((command) =>
        command.includes(`live-adapter-operator-evidence-import-ready --project ariadne --by <operator> --target ${nextTarget}`)
      )
    ).toBe(true);
    expect(
      operatorEvidenceRequirement?.nextCommands.some((command) =>
        command.includes("control/operator-evidence/<target>/operator-evidence.md")
      )
    ).toBe(true);
    expect(operatorEvidenceRequirement?.nextCommands).toContain(
      "npm run ariadne -- live-adapter-operator-evidence-check-all --project ariadne --source workspace"
    );
    const cutoverRequirement = roadmapCompletion.audit.requirements.find((item) => item.id === "live-adapter-cutover");
    const reviewRequirement = roadmapCompletion.audit.requirements.find((item) => item.id === "operator-review-session");
    expect(cutoverRequirement?.nextCommands).toContain(
      `npm run ariadne -- live-adapter-cutover-audit --project ariadne --target ${nextTarget}`
    );
    expect(cutoverRequirement?.nextCommands).toContain("npm run ariadne -- live-adapter-cutover-audit --project ariadne");
    expect(reviewRequirement?.nextCommands).toContain(
      `npm run ariadne -- live-adapter-review-session --project ariadne --target ${nextTarget}`
    );
    expect(reviewRequirement?.nextCommands).toContain("npm run ariadne -- live-adapter-review-session --project ariadne");
    const console = await generateConsoleData({ project: "ariadne", vaultRoot });
    expect(console.data.summary.sleepRoutines).toBe(1);
    expect(console.data.summary.memoryProposals).toBe(1);
    expect(console.data.summary.agentMail).toBe(1);
    expect(console.data.summary.agentLeases).toBe(1);
    expect(console.data.summary.hermesCronSnapshots).toBe(1);
    expect(console.data.summary.hermesCronProposals).toBe(1);
    expect(console.data.coordination.hermesCronSnapshots[0]?.summary.jobs).toBe(2);
    expect(console.data.coordination.hermesCronProposals[0]?.summary.proposedActions).toBe(2);
    expect(console.data.summary.deploymentSnapshots).toBe(1);
    expect(console.data.summary.approvals).toBe(1);
    expect(console.data.summary.mutationReadinessPlans).toBe(2);
    expect(console.data.summary.mutationReadinessAuditStatus).toBe("blocked");
    expect(console.data.mutationReadinessAudit?.summary.ready).toBe(1);
    expect(console.data.summary.mutationReadinessRepairStatus).toBe("actions_required");
    expect(console.data.summary.mutationReadinessRepairMissingPlans).toBeGreaterThan(0);
    expect(console.data.summary.mutationReadinessRepairRepairablePlans).toBe(0);
    expect(console.data.summary.mutationReadinessRepairOperatorActionRequired).toBe(1);
    expect(console.data.mutationReadinessRepairPlan?.mutationAllowed).toBe(false);
    expect(console.data.mutationReadinessRepairPlan?.targets.some((target) => target.target === "deployment")).toBe(true);
    expect(console.data.artifacts.mutationReadinessRepairPlan).toContain("control/mutation-readiness-repair-plan.json");
    expect(console.data.summary.liveAdapterReadinessStatus).toBe("blocked");
    expect(console.data.summary.liveAdapterReady).toBe(1);
    expect(console.data.summary.liveAdapterBlocked).toBe(5);
    expect(console.data.summary.liveAdapterActionItems).toBeGreaterThan(0);
    expect(console.data.summary.liveAdapterApprovalPackets).toBe(5);
    expect(console.data.summary.acceptedLiveAdapterApprovalReviews).toBe(1);
    expect(console.data.summary.liveAdapterApprovalReviewAuditStatus).toBe("blocked");
    expect(console.data.summary.currentLiveAdapterApprovalReviews).toBe(1);
    expect(console.data.summary.liveAdapterTargetDossiers).toBe(6);
    expect(console.data.summary.liveAdapterCutoverAuditStatus).toBe("blocked");
    expect(console.data.summary.liveAdapterCutoverReady).toBe(1);
    expect(console.data.summary.liveAdapterReviewSessionStatus).toBe("operator_review_required");
    expect(console.data.summary.liveAdapterReviewSessionRequired).toBe(5);
    expect(console.data.liveAdapterReviewSession?.mutationApproved).toBe(false);
    expect(console.data.summary.liveAdapterEvidenceTemplateStatus).toBe("awaiting_operator_evidence");
    expect(console.data.summary.liveAdapterEvidenceTemplates).toBe(6);
    expect(console.data.liveAdapterEvidenceTemplatePack?.mutationApproved).toBe(false);
    expect(console.data.summary.liveAdapterOperatorEvidenceWorkplanStatus).toBe("evidence_required");
    expect(console.data.summary.liveAdapterOperatorEvidenceWorkplanTargets).toBe(6);
    expect(console.data.liveAdapterOperatorEvidenceWorkplan?.targets.some((target) => target.target === "hermes-cron")).toBe(true);
    expect(console.data.summary.liveAdapterOperatorEvidenceRecords).toBe(4);
    expect(console.data.summary.liveAdapterOperatorEvidenceStatus).toBe("blocked");
    expect(console.data.summary.liveAdapterOperatorEvidenceComplete).toBe(3);
    expect(console.data.summary.liveAdapterOperatorEvidenceMissing).toBe(2);
    expect(console.data.summary.liveAdapterOperatorEvidenceQueueStatus).toBe("evidence_required");
    expect(console.data.summary.liveAdapterOperatorEvidenceQueueReady).toBe(0);
    expect(console.data.liveAdapterOperatorEvidenceQueue?.summary.uncheckedTargets).toBe(0);
    expect(console.data.summary.liveAdapterOperatorEvidenceAssistStatus).toBe("awaiting_operator_review");
    expect(console.data.summary.liveAdapterOperatorEvidenceAssistTargets).toBe(6);
    expect(console.data.summary.liveAdapterOperatorEvidenceAssistRefs).toBeGreaterThan(0);
    expect(console.data.liveAdapterOperatorEvidenceAssist?.operatorEvidenceRecordCreated).toBe(false);
    expect(console.data.liveAdapterOperatorEvidenceAssist?.targets.some((target) => target.target === "hermes-cron")).toBe(true);
    expect(console.data.summary.liveAdapterOperatorEvidenceChecks).toBe(15);
    expect(console.data.liveAdapterOperatorEvidenceAudit?.mutationApproved).toBe(false);
    expect(console.data.liveAdapterOperatorEvidenceChecks[0]?.recorded).toBe(false);
    expect(console.data.liveAdapterOperatorEvidence.some((record) => record.target === "deployment")).toBe(true);
    expect(console.data.liveAdapterCutoverAudit?.targets.some((target) => target.target === "github")).toBe(true);
    expect(console.data.summary.roadmapCompletionStatus).toBe("blocked");
    expect(console.data.summary.roadmapCompletionBlocked).toBe(roadmapCompletion.audit.summary.blocked);
    expect(console.data.roadmapCompletionAudit?.requirements.some((requirement) => requirement.id === "operator-evidence")).toBe(true);
    const liveAdapterConsoleHtml = await generateConsoleHtml({ project: "ariadne", vaultRoot, refreshData: true });
    const liveAdapterHtml = await fs.readFile(liveAdapterConsoleHtml.htmlPath, "utf8");
    expect(liveAdapterHtml).toContain("cutover deployment");
    expect(liveAdapterHtml).toContain("Current accepted operator packet review");
    expect(liveAdapterHtml).toContain("mutationApproved=false");
    expect(liveAdapterHtml).toContain("Mutation repair commands remain scaffolds");
    expect(liveAdapterHtml).toContain("operator_action_required");
    expect(liveAdapterHtml).toContain("Templates are blank collection aids");
    expect(liveAdapterHtml).toContain("The workplan is an evidence collection queue");
    expect(liveAdapterHtml).toContain("The queue orders operator work from preflight checks");
    expect(liveAdapterHtml).toContain("Assist packets are read-only collection aids");
    expect(liveAdapterHtml).toContain("Operator evidence records do not approve mutation");
    expect(liveAdapterHtml).toContain("Mutation readiness repair is read-only guidance");
    expect(liveAdapterHtml).toContain("Approval Command");
    expect(liveAdapterHtml).toContain("approval-request --project");
    expect(liveAdapterHtml).toContain("operator_action_required");
    expect(liveAdapterHtml).toContain("deployment-mutation-plan");
    expect(liveAdapterHtml).toContain("operator evidence hermes-cron");
    expect(liveAdapterHtml).toContain("Completion is only true");
    expect(console.data.liveAdapterApprovalReviewAudit?.summary.currentAcceptedReviews).toBe(1);
    expect(console.data.liveAdapterTargetDossiers.some((dossier) => dossier.target === "deployment")).toBe(true);
    expect(
      console.data.liveAdapterTargetDossiers.some(
        (dossier) => dossier.target === "github" && dossier.status === "ready_for_adapter_work"
      )
    ).toBe(true);
    expect(console.data.liveAdapterNextActions?.targets.some((target) => target.target === "github")).toBe(true);
    expect(console.data.liveAdapterApprovalPack?.packets.some((packet) => packet.target === "deployment")).toBe(true);
    expect(
      (console.data.liveAdapterApprovalReviews ?? []).some(
        (review) => review.target === "github" && review.status === "accepted"
      )
    ).toBe(true);
    expect(console.data.behaviorChecks?.status).toBe("passed");

    const e2eSmoke = await runE2eSmoke({ project: "ariadne", vaultRoot, width: 900, height: 900 });
    expect(e2eSmoke.report.status).toBe("blocked");
    expect(e2eSmoke.report.summary.failed).toBe(0);
    expect(e2eSmoke.report.steps.some((step) => step.id === "mutation-readiness-repair-plan" && step.status === "passed")).toBe(
      true
    );
    expect(e2eSmoke.report.artifacts.mutationReadinessRepairPlan).toContain(
      "control/mutation-readiness-repair-plan.json"
    );
    expect(e2eSmoke.report.steps.some((step) => step.id === "console-browser-checks" && step.status === "passed")).toBe(true);
    expect(e2eSmoke.report.steps.some((step) => step.id === "roadmap-completion-audit" && step.status === "blocked")).toBe(true);
    const e2eSmokeMarkdown = await fs.readFile(e2eSmoke.markdownPath, "utf8");
    expect(e2eSmokeMarkdown).toContain("End-to-End Smoke Report");
    expect(e2eSmokeMarkdown).toContain("Mutation repair plan");
    expect(e2eSmokeMarkdown).toContain("mutationAllowed=false");
    expect(e2eSmokeMarkdown).toContain("This command does not create approvals");
    const status = await projectStatus(vaultRoot, "ariadne");
    expect(status.readinessStatus).toBe("review_required");
    expect(status.roadmapCompletionStatus).toBe("blocked");
    expect(status.roadmapCompletionBlocked).toBe(3);
    expect(status.mutationReadinessRepairStatus).toBe("actions_required");
    expect(status.mutationReadinessRepairMissingPlans).toBeGreaterThan(0);
    expect(status.liveAdapterOperatorEvidenceStatus).toBe("blocked");
    expect(status.liveAdapterOperatorEvidenceCompleteTargets).toBeGreaterThan(0);
    expect(status.liveAdapterOperatorEvidenceMissingTargets).toBeGreaterThan(0);
    expect(status.liveAdapterOperatorEvidenceMissingSections).toBeGreaterThan(0);
    expect(status.liveAdapterOperatorEvidenceQueueStatus).toBe("evidence_required");
    expect(status.liveAdapterOperatorEvidenceQueueNeedsEvidence).toBeGreaterThan(0);
    expect(status.liveAdapterOperatorEvidenceNextTarget).toBe(nextTarget);
    expect(status.liveAdapterOperatorEvidenceNextTargetStatus).toBeTruthy();
    expect(status.liveAdapterOperatorEvidenceNextTargetMissingSections).toBeGreaterThan(0);
    expect(status.liveAdapterOperatorEvidenceNextAction).toBeTruthy();
    expect(status.liveAdapterOperatorEvidenceNextCommands).toContain(
      `npm run ariadne -- live-adapter-operator-evidence-workspace --project ariadne --target ${nextTarget}`
    );
    expect(status.liveAdapterOperatorEvidenceNextCommands).toContain(
      `npm run ariadne -- live-adapter-cutover-audit --project ariadne --target ${nextTarget}`
    );
    expect(status.liveAdapterCutoverStatus).toBe("blocked");
    expect(status.liveAdapterCutoverReady).toBe(1);
    expect(status.liveAdapterCutoverBlockedGates).toBeGreaterThan(0);
    expect(status.liveAdapterReviewSessionStatus).toBe("operator_review_required");
    expect(status.liveAdapterReviewSessionReadyForAdapterWork).toBe(1);
    expect(status.liveAdapterReviewSessionOperatorReviewRequired).toBeGreaterThan(0);
    expect(status.latestE2eSmoke?.status).toBe("blocked");
    expect(status.latestE2eSmoke?.passed).toBeGreaterThan(0);
    expect(status.latestE2eSmoke?.reportRef).toContain("evaluation/e2e-smoke-");

    // Simulate a stale audit by zeroing operatorEvidenceAuditJson summary.missingSections
    // and clearing each missing target's missingSections array at operatorEvidenceAuditPath.
    // projectStatus should still derive liveAdapterOperatorEvidenceMissingSections from
    // summary.missingTargets * REQUIRED_OPERATOR_EVIDENCE_SECTION_LABELS.length.
    const operatorEvidenceAuditPath = path.join(
      vaultRoot,
      "projects",
      "ariadne",
      "control",
      "live-adapter-operator-evidence-audit.json"
    );
    const operatorEvidenceAuditJson = JSON.parse(await fs.readFile(operatorEvidenceAuditPath, "utf8"));
    operatorEvidenceAuditJson.summary.missingSections = 0;
    operatorEvidenceAuditJson.targets = operatorEvidenceAuditJson.targets.map((target: { status: string; missingSections: string[] }) =>
      target.status === "missing_evidence" ? { ...target, missingSections: [] } : target
    );
    await fs.writeFile(operatorEvidenceAuditPath, `${JSON.stringify(operatorEvidenceAuditJson, null, 2)}\n`);
    const staleStatus = await projectStatus(vaultRoot, "ariadne");
    expect(staleStatus.liveAdapterOperatorEvidenceMissingSections).toBeGreaterThan(0);
    const staleRoadmapCompletion = await generateRoadmapCompletionAudit({ project: "ariadne", vaultRoot });
    const staleOperatorEvidenceRequirement = staleRoadmapCompletion.audit.requirements.find(
      (requirement) => requirement.id === "operator-evidence"
    );
    expect(staleOperatorEvidenceRequirement?.detail).toContain("27 missing section(s)");
    const staleConsoleHtml = await generateConsoleHtml({ project: "ariadne", vaultRoot, refreshData: true });
    const staleConsoleText = await fs.readFile(staleConsoleHtml.htmlPath, "utf8");
    expect(staleConsoleText).toContain("Operator identity and timestamp");

    const artifactChecks = await generateArtifactCheckReport({ project: "ariadne", vaultRoot });
    const coordinationCheck = artifactChecks.report.checks.find((check) => check.id === "coordination-records");
    const hermesCheck = artifactChecks.report.checks.find((check) => check.id === "hermes-cron-snapshots");
    const hermesProposalCheck = artifactChecks.report.checks.find((check) => check.id === "hermes-cron-proposals");
    const readinessCheck = artifactChecks.report.checks.find((check) => check.id === "mutation-readiness-plans");
    const readinessAuditCheck = artifactChecks.report.checks.find((check) => check.id === "mutation-readiness-audit");
    const repairPlanCheck = artifactChecks.report.checks.find((check) => check.id === "mutation-readiness-repair-plan");
    const nextActionsCheck = artifactChecks.report.checks.find((check) => check.id === "live-adapter-next-actions");
    const approvalPackCheck = artifactChecks.report.checks.find((check) => check.id === "live-adapter-approval-pack");
    const approvalReviewCheck = artifactChecks.report.checks.find((check) => check.id === "live-adapter-approval-reviews");
    const approvalReviewAuditCheck = artifactChecks.report.checks.find((check) => check.id === "live-adapter-approval-review-audit");
    const targetDossierCheck = artifactChecks.report.checks.find((check) => check.id === "live-adapter-dossiers");
    const cutoverAuditCheck = artifactChecks.report.checks.find((check) => check.id === "live-adapter-cutover-audit");
    const reviewSessionCheck = artifactChecks.report.checks.find((check) => check.id === "live-adapter-review-session");
    const evidenceTemplatesCheck = artifactChecks.report.checks.find((check) => check.id === "live-adapter-evidence-templates");
    const operatorEvidencePreflightCheck = artifactChecks.report.checks.find(
      (check) => check.id === "live-adapter-operator-evidence-checks"
    );
    const operatorEvidenceBatchCheck = artifactChecks.report.checks.find(
      (check) => check.id === "live-adapter-operator-evidence-check-all"
    );
    const operatorEvidenceImportReadyCheck = artifactChecks.report.checks.find(
      (check) => check.id === "live-adapter-operator-evidence-import-ready"
    );
    const operatorEvidenceQueueCheck = artifactChecks.report.checks.find(
      (check) => check.id === "live-adapter-operator-evidence-queue"
    );
    const operatorEvidenceWorkspaceCheck = artifactChecks.report.checks.find(
      (check) => check.id === "live-adapter-operator-evidence-workspace"
    );
    const operatorEvidenceAssistCheck = artifactChecks.report.checks.find(
      (check) => check.id === "live-adapter-operator-evidence-assist"
    );
    const operatorEvidenceWorkspaceFilesCheck = artifactChecks.report.checks.find(
      (check) => check.id === "live-adapter-operator-evidence-workspace-files"
    );
    const operatorEvidenceCheck = artifactChecks.report.checks.find((check) => check.id === "live-adapter-operator-evidence");
    const operatorEvidenceAuditCheck = artifactChecks.report.checks.find(
      (check) => check.id === "live-adapter-operator-evidence-audit"
    );
    const operatorEvidenceWorkplanCheck = artifactChecks.report.checks.find(
      (check) => check.id === "live-adapter-operator-evidence-workplan"
    );
    const roadmapCompletionAuditCheck = artifactChecks.report.checks.find((check) => check.id === "roadmap-completion-audit");
    const e2eSmokeCheck = artifactChecks.report.checks.find((check) => check.id === "e2e-smoke-reports");
    const mutationDryRunCheck = artifactChecks.report.checks.find((check) => check.id === "mutation-dry-runs");
    const mutationExecutionCheck = artifactChecks.report.checks.find((check) => check.id === "mutation-executions");
    expect(coordinationCheck?.matches?.some((match) => match.includes("coordination/hermes"))).toBe(true);
    expect(hermesCheck?.count).toBe(1);
    expect(hermesProposalCheck?.count).toBe(2);
    expect(readinessCheck?.count).toBe(2);
    expect(readinessAuditCheck?.status).toBe("present");
    expect(repairPlanCheck?.status).toBe("present");
    expect(nextActionsCheck?.status).toBe("present");
    expect(approvalPackCheck?.status).toBe("present");
    expect(approvalReviewCheck?.status).toBe("present");
    expect(approvalReviewAuditCheck?.status).toBe("present");
    expect(targetDossierCheck?.status).toBe("present");
    expect(cutoverAuditCheck?.status).toBe("present");
    expect(reviewSessionCheck?.status).toBe("present");
    expect(evidenceTemplatesCheck?.status).toBe("present");
    expect(operatorEvidencePreflightCheck?.count).toBe(15);
    expect(operatorEvidenceBatchCheck?.status).toBe("present");
    expect(operatorEvidenceImportReadyCheck?.status).toBe("present");
    expect(operatorEvidenceQueueCheck?.status).toBe("present");
    expect(operatorEvidenceWorkspaceCheck?.status).toBe("present");
    expect(operatorEvidenceAssistCheck?.status).toBe("present");
    expect(operatorEvidenceWorkspaceFilesCheck?.count).toBe(42);
    expect(operatorEvidenceCheck?.count).toBe(4);
    expect(operatorEvidenceAuditCheck?.status).toBe("present");
    expect(operatorEvidenceWorkplanCheck?.status).toBe("present");
    expect(roadmapCompletionAuditCheck?.status).toBe("present");
    expect(e2eSmokeCheck?.status).toBe("present");
    expect(mutationDryRunCheck?.status).toBe("present");
    expect(mutationExecutionCheck?.status).toBe("present");
  });

  it("uses environment defaults for local runtime endpoint URLs and canary models", async () => {
    const { vaultRoot } = await preparedProject();
    const previous = {
      hermes: process.env.ARIADNE_HERMES_DASHBOARD_URL,
      atlasUrl: process.env.ARIADNE_ATLAS_URL,
      atlasModel: process.env.ARIADNE_ATLAS_CANARY_MODEL
    };
    process.env.ARIADNE_HERMES_DASHBOARD_URL = "http://runtime.env/hermes";
    process.env.ARIADNE_ATLAS_URL = "http://runtime.env/atlas/v1";
    process.env.ARIADNE_ATLAS_CANARY_MODEL = "qwen3.6-35b-a3b-nvfp4-atlas";
    const canaryRequests: Array<{ url: string; model: string; systemPrompt: string; userPrompt: string }> = [];

    try {
      const runtimeProbe = await collectLocalRuntimeProbe(
        {
          project: "ariadne",
          vaultRoot,
          canary: true,
          canaryEndpointIds: ["atlas"],
          timeoutMs: 100
        },
        {
          runCommand: async () => ({ exitCode: 0, stdout: "ok", stderr: "" }),
          fetchJson: async (url, init) => {
            if (url === "http://runtime.env/hermes") return { ok: true, status: 200, text: "<html></html>" };
            if (url === "http://runtime.env/atlas/v1/models") {
              return {
                ok: true,
                status: 200,
                text: "{}",
                json: { data: [{ id: "qwen3.6-35b-a3b-nvfp4-atlas" }] }
              };
            }
            if (url === "http://runtime.env/atlas/v1/chat/completions" && init?.method === "POST") {
              const body = JSON.parse(String(init.body)) as { model: string; messages: Array<{ content: string }> };
              canaryRequests.push({
                url,
                model: body.model,
                systemPrompt: body.messages[0]?.content ?? "",
                userPrompt: body.messages[1]?.content ?? ""
              });
              return {
                ok: true,
                status: 200,
                text: "{}",
                json: {
                  choices: [{ message: { content: "READY" } }],
                  usage: { prompt_tokens: 4, completion_tokens: 1, total_tokens: 5 }
                }
              };
            }
            return { ok: false, status: 0, text: "", error: "connection refused" };
          }
        }
      );

      expect(runtimeProbe.probe.hermes.dashboard.url).toBe("http://runtime.env/hermes");
      expect(runtimeProbe.probe.modelEndpoints.find((endpoint) => endpoint.id === "atlas")?.url).toBe(
        "http://runtime.env/atlas/v1"
      );
      expect(runtimeProbe.probe.modelEndpoints.find((endpoint) => endpoint.id === "atlas")?.canary?.model).toBe(
        "qwen3.6-35b-a3b-nvfp4-atlas"
      );
      expect(canaryRequests).toEqual([
        {
          url: "http://runtime.env/atlas/v1/chat/completions",
          model: "qwen3.6-35b-a3b-nvfp4-atlas",
          systemPrompt: "You are a local runtime health check. Do not reason. Output exactly READY.",
          userPrompt: "/no_think\nReply with exactly READY and no other text."
        }
      ]);
    } finally {
      restoreEnv("ARIADNE_HERMES_DASHBOARD_URL", previous.hermes);
      restoreEnv("ARIADNE_ATLAS_URL", previous.atlasUrl);
      restoreEnv("ARIADNE_ATLAS_CANARY_MODEL", previous.atlasModel);
    }
  });

  it("records CI, CodeRabbit, Playwright, infra, OpenScorpion, and guarded worktree evidence", async () => {
    const { temp, vaultRoot } = await preparedProject();
    const repo = path.join(temp, "repo");
    await fs.mkdir(repo);
    execFileSync("git", ["init", "-b", "main"], { cwd: repo });

    const execution = await planExecution({ project: "ariadne", vaultRoot, repoPath: repo, taskId: "TASK-001" });
    const guard = await guardWorktrees({
      project: "ariadne",
      vaultRoot,
      runFile: execution.jsonPath,
      apply: false
    });
    expect(guard.report.status).toBe("ready");

    const invalidRun = path.join(temp, "invalid-run.json");
    await fs.writeFile(
      invalidRun,
      JSON.stringify({
        schemaVersion: 1,
        id: "run-invalid",
        project: "ariadne",
        createdAt: new Date().toISOString(),
        taskIds: ["TASK-001"],
        repoPath: path.join(temp, "not-a-repo"),
        branchPrefix: "codex",
        status: "planned",
        gates: [],
        worktrees: [{ taskId: "TASK-001", branch: "codex/task-001", worktreePath: path.join(temp, "wt") }],
        stopConditions: []
      })
    );
    const invalidGuard = await guardWorktrees({
      project: "ariadne",
      vaultRoot,
      runFile: invalidRun,
      apply: false
    });
    expect(invalidGuard.report.status).toBe("blocked");
    expect(invalidGuard.report.checks.some((check) => check.name === "working-tree-clean")).toBe(true);

    const placeholderRun = path.join(temp, "placeholder-run.json");
    await fs.writeFile(
      placeholderRun,
      JSON.stringify({
        schemaVersion: 1,
        id: "run-placeholder",
        project: "ariadne",
        createdAt: new Date().toISOString(),
        taskIds: ["TASK-001"],
        repoPath: "<REPO_ROOT>",
        branchPrefix: "codex",
        status: "planned",
        gates: [],
        worktrees: [{ taskId: "TASK-001", branch: "codex/task-001", worktreePath: "<REPO_ROOT>-task-001" }],
        stopConditions: []
      })
    );
    const placeholderGuard = await guardWorktrees({
      project: "ariadne",
      vaultRoot,
      runFile: placeholderRun,
      apply: true
    });
    expect(placeholderGuard.report.status).toBe("blocked");
    expect(placeholderGuard.report.checks.find((check) => check.name === "repoPath")?.detail).toContain("placeholder");

    await recordPlaywrightEvidence({
      project: "ariadne",
      vaultRoot,
      targetUrl: "http://localhost:3000",
      status: "skipped",
      notes: "No target app in adapter test."
    });

    const ci = path.join(temp, "ci.json");
    await fs.writeFile(
      ci,
      JSON.stringify([
        { name: "integration", conclusion: "success" },
        { name: "deploy", conclusion: "error" }
      ])
    );
    expect(await importCiStatus({ project: "ariadne", vaultRoot, sourcePath: ci })).toBe(2);
    const checks = await readJsonl(path.join(vaultRoot, "projects", "ariadne", "control", "check-history.jsonl"));
    expect(checks.find((check) => check.name === "deploy")?.status).toBe("failed");

    const coderabbit = path.join(temp, "coderabbit.md");
    await fs.writeFile(coderabbit, "Approved\n\nNo issues found.\n");
    await importCodeRabbitReview({ project: "ariadne", vaultRoot, sourcePath: coderabbit });
    const negatedCoderabbit = path.join(temp, "coderabbit-negated.md");
    await fs.writeFile(negatedCoderabbit, "I have not approved these changes.\n");
    await importCodeRabbitReview({ project: "ariadne", vaultRoot, sourcePath: negatedCoderabbit });
    const pendingCoderabbit = path.join(temp, "coderabbit-pending.md");
    await fs.writeFile(pendingCoderabbit, "Review pending\n\nThis cannot be treated as approved.\n");
    await importCodeRabbitReview({ project: "ariadne", vaultRoot, sourcePath: pendingCoderabbit });
    const reviews = await readJsonl(path.join(vaultRoot, "projects", "ariadne", "control", "reviews.jsonl"));
    expect(reviews.at(-1)?.status).toBe("pending");

    const github = path.join(temp, "github-pr.json");
    await fs.writeFile(
      github,
      JSON.stringify({
        number: 10,
        title: "Add console visual trend checks",
        state: "MERGED",
        url: "https://github.com/jxwalker/ariadne/pull/10",
        baseRefName: "main",
        headRefName: "codex/console-visual-trends",
        isDraft: false,
        mergedAt: "2026-05-16T12:16:55Z",
        statusCheckRollup: [
          { context: "CodeRabbit", state: "PENDING" },
          { name: "unit-tests", status: "COMPLETED", conclusion: "success" },
          { name: "stale-preview", status: "COMPLETED", conclusion: "stale" }
        ]
      })
    );
    const githubSnapshot = await importGithubSnapshot({
      project: "ariadne",
      vaultRoot,
      sourcePath: github,
      repository: "jxwalker/ariadne"
    });
    expect(githubSnapshot.snapshot.summary.pullRequests).toBe(1);
    expect(githubSnapshot.snapshot.summary.pendingChecks).toBe(1);
    expect(githubSnapshot.snapshot.summary.passingChecks).toBe(1);
    expect(githubSnapshot.snapshot.pullRequests[0]?.checks.find((check) => check.name === "stale-preview")?.status).toBe(
      "skipped"
    );

    const infra = path.join(temp, "manifest.json");
    await fs.writeFile(infra, JSON.stringify({ host: { short_name: "beast" }, guests: { vms: [], lxc: [] } }));
    await generateInfrastructureRegistry({ project: "ariadne", vaultRoot });
    const snapshot = await importInfraSnapshot({ project: "ariadne", vaultRoot, sourcePath: infra });
    expect(snapshot.snapshot.summary.host).toBe("beast");

    const liveSnapshot = await collectLocalInfraSnapshot({
      project: "ariadne",
      vaultRoot,
      notes: "vitest local collector"
    });
    expect(liveSnapshot.snapshot.snapshotKind).toBe("live_read_only");
    expect(liveSnapshot.snapshot.sourcePath).toBe("<LIVE_READ_ONLY>/local-host");
    expect(liveSnapshot.snapshot.summary.collector).toBe("local-node-os");
    expect(JSON.stringify(liveSnapshot.snapshot.raw)).not.toContain(os.hostname());
    expect(JSON.stringify(liveSnapshot.snapshot.raw)).toContain("networkAddresses");

    const canaryRequests: Array<{ url: string; model: string; tokenBudget: number }> = [];
    const runtimeProbe = await collectLocalRuntimeProbe(
      {
        project: "ariadne",
        vaultRoot,
        canary: true,
        canaryEndpointIds: ["ollama", "ds4-openai", "atlas"],
        canaryModels: { "ds4-openai": "deepseek-v4-flash", atlas: "qwen3.6-35b-a3b-nvfp4-atlas" },
        hermesDashboardUrl: "http://runtime.test/hermes",
        ollamaUrl: "http://runtime.test/ollama",
        ds4Url: "http://runtime.test/ds4/v1",
        lmStudioUrl: "http://runtime.test/lmstudio/v1",
        atlasUrl: "http://runtime.test/atlas/v1",
        timeoutMs: 100
      },
      {
        runCommand: async () => ({ exitCode: 0, stdout: "ok", stderr: "" }),
        fetchJson: async (url, init) => {
          if (url === "http://runtime.test/hermes") return { ok: true, status: 200, text: "<html></html>" };
          if (url.endsWith("/api/tags")) {
            return { ok: true, status: 200, text: "{}", json: { models: [{ name: "qwen-local" }] } };
          }
          if (url.endsWith("/api/generate") && init?.method === "POST") {
            const body = JSON.parse(String(init.body)) as { model: string; options: { num_predict: number } };
            canaryRequests.push({ url, model: body.model, tokenBudget: body.options.num_predict });
            return {
              ok: true,
              status: 200,
              text: "{}",
              json: { response: "READY", prompt_eval_count: 5, eval_count: 1, total_duration: 2_000_000 }
            };
          }
          if (url.endsWith("/ds4/v1/models")) {
            return { ok: true, status: 200, text: "{}", json: { data: [{ id: "deepseek-v4-flash" }] } };
          }
          if (url.endsWith("/ds4/v1/chat/completions") && init?.method === "POST") {
            const body = JSON.parse(String(init.body)) as { model: string; max_tokens: number };
            canaryRequests.push({ url, model: body.model, tokenBudget: body.max_tokens });
            return {
              ok: true,
              status: 200,
              text: "{}",
              json: {
                choices: [{ message: { content: "NOT READY" } }],
                usage: { prompt_tokens: 7, completion_tokens: 1, total_tokens: 8 }
              }
            };
          }
          if (url.endsWith("/atlas/v1/models")) {
            return { ok: true, status: 200, text: "{}", json: { data: [{ id: "qwen3.6-35b-a3b-nvfp4-atlas" }] } };
          }
          if (url.endsWith("/atlas/v1/chat/completions") && init?.method === "POST") {
            const body = JSON.parse(String(init.body)) as { model: string; max_tokens: number };
            canaryRequests.push({ url, model: body.model, tokenBudget: body.max_tokens });
            return {
              ok: true,
              status: 200,
              text: "{}",
              json: {
                choices: [{ message: { content: "READY" } }],
                usage: { prompt_tokens: 6, completion_tokens: 1, total_tokens: 7 }
              }
            };
          }
          return { ok: false, status: 0, text: "", error: "connection refused" };
        }
      }
    );
    expect(runtimeProbe.probe.summary.models).toBe(3);
    expect(runtimeProbe.probe.summary.usageRecords).toBe(3);
    expect(runtimeProbe.probe.modelEndpoints.find((endpoint) => endpoint.id === "ollama")?.canary?.status).toBe(
      "passed"
    );
    expect(runtimeProbe.probe.modelEndpoints.find((endpoint) => endpoint.id === "ds4-openai")?.canary?.status).toBe(
      "degraded"
    );
    expect(runtimeProbe.probe.modelEndpoints.find((endpoint) => endpoint.id === "ds4-openai")?.canary?.model).toBe(
      "deepseek-v4-flash"
    );
    expect(runtimeProbe.probe.modelEndpoints.find((endpoint) => endpoint.id === "atlas")?.canary?.status).toBe(
      "passed"
    );
    expect(runtimeProbe.probe.modelEndpoints.find((endpoint) => endpoint.id === "atlas")?.canary?.model).toBe(
      "qwen3.6-35b-a3b-nvfp4-atlas"
    );
    expect(canaryRequests).toEqual([
      { url: "http://runtime.test/ollama/api/generate", model: "qwen-local", tokenBudget: 128 },
      { url: "http://runtime.test/ds4/v1/chat/completions", model: "deepseek-v4-flash", tokenBudget: 128 },
      {
        url: "http://runtime.test/atlas/v1/chat/completions",
        model: "qwen3.6-35b-a3b-nvfp4-atlas",
        tokenBudget: 128
      }
    ]);
    expect(runtimeProbe.probe.modelEndpoints.find((endpoint) => endpoint.id === "lmstudio")?.status).toBe("unreachable");
    const runtimeArtifactChecks = await generateArtifactCheckReport({ project: "ariadne", vaultRoot });
    expect(runtimeArtifactChecks.report.checks.find((check) => check.id === "local-runtime-probes")?.status).toBe(
      "present"
    );
    await fs.writeFile(
      path.join(vaultRoot, "projects", "ariadne", "infrastructure", "runtime", "malformed-runtime-probe.json"),
      JSON.stringify({
        schemaVersion: 1,
        mode: "read_only",
        generatedAt: "2099-01-01T00:00:00.000Z",
        summary: { reachable: 1, degraded: 0, unreachable: 0, models: 1 },
        modelEndpoints: [{ id: "broken", status: "reachable" }]
      })
    );
    const usageReport = await generateUsageMetricsReport({ project: "ariadne", vaultRoot });
    expect(usageReport.report.bySource.find((source) => source.name === "local-llm")?.totalTokens).toBe(21);

    const parsedSsh = parseSshInventory(
      [
        "hostname=beast-secret.lan",
        "uname_s=Linux",
        "uname_m=x86_64",
        "uname_r=6.8.0",
        "cpu_count=24",
        "memory_total_kib=131072000",
        "filesystem_count=8",
        "has_docker=yes",
        "has_pve=yes",
        "has_zfs=yes",
        "has_nvidia_smi=no"
      ].join("\n"),
      "beast",
      "james@beast.lan"
    );
    expect(parsedSsh.target.hostId).toBe("beast");
    expect(parsedSsh.capabilities.proxmox).toBe(true);
    expect(JSON.stringify(parsedSsh)).not.toContain("beast-secret.lan");
    expect(JSON.stringify(parsedSsh)).not.toContain("james@beast.lan");

    const fakeSsh = path.join(temp, "fake-ssh.sh");
    await fs.writeFile(
      fakeSsh,
      [
        "#!/bin/sh",
        "cat <<'OUT'",
        "hostname=beast-secret.lan",
        "uname_s=Linux",
        "uname_m=x86_64",
        "uname_r=6.8.0",
        "cpu_count=24",
        "memory_total_kib=131072000",
        "filesystem_count=8",
        "has_docker=yes",
        "has_pve=yes",
        "has_zfs=yes",
        "has_nvidia_smi=yes",
        "OUT"
      ].join("\n")
    );
    await fs.chmod(fakeSsh, 0o755);
    const sshSnapshot = await collectSshInfraSnapshot({
      project: "ariadne",
      vaultRoot,
      hostId: "DGX Spark",
      target: "james@beast.lan",
      sshBinary: fakeSsh,
      notes: "vitest fake ssh collector"
    });
    expect(sshSnapshot.snapshot.snapshotKind).toBe("live_read_only");
    expect(sshSnapshot.snapshot.sourcePath).toBe("<LIVE_READ_ONLY>/ssh/dgx-spark");
    expect(sshSnapshot.snapshot.summary.collector).toBe("ssh-posix-read-only");
    expect(sshSnapshot.snapshot.summary.host).toBe("DGX Spark");
    expect(sshSnapshot.snapshot.summary.proxmox).toBe(true);
    expect(JSON.stringify(sshSnapshot.snapshot.raw)).not.toContain("beast-secret.lan");
    expect(JSON.stringify(sshSnapshot.snapshot.raw)).not.toContain("james@beast.lan");
    expect(JSON.stringify(sshSnapshot.snapshot.raw)).toContain("targetHash");
    await expect(
      collectSshInfraSnapshot({
        project: "ariadne",
        vaultRoot,
        hostId: "bad",
        target: "-oProxyCommand=touch /tmp/ariadne-bad",
        sshBinary: fakeSsh
      })
    ).rejects.toThrow(/Unsafe SSH target/);

    const deploymentSnapshot = await collectSshDeploymentSnapshot({
      project: "ariadne",
      vaultRoot,
      system: "dgx-spark",
      hostId: "DGX Spark",
      target: "james@beast.lan",
      sshBinary: fakeSsh,
      notes: "vitest fake deployment collector"
    });
    expect(deploymentSnapshot.snapshot.mode).toBe("read_only");
    expect(deploymentSnapshot.snapshot.system).toBe("dgx-spark");
    expect(deploymentSnapshot.snapshot.summary.host).toBe("DGX Spark");
    expect(deploymentSnapshot.snapshot.summary.modelEndpoints).toBe(1);
    expect(deploymentSnapshot.snapshot.summary.runnerPools).toBe(1);
    expect(deploymentSnapshot.snapshot.summary.confidence).toBe("high");
    expect(deploymentSnapshot.snapshot.summary.capabilities).toContain("nvidia-smi");
    expect(deploymentSnapshot.snapshot.raw).toMatchObject({ source: "infra-live-ssh" });
    expect(JSON.stringify(deploymentSnapshot.snapshot.raw)).not.toContain("beast-secret.lan");
    expect(JSON.stringify(deploymentSnapshot.snapshot.raw)).not.toContain("james@beast.lan");

    const activity = await draftOpenScorpionActivity({
      project: "ariadne",
      vaultRoot,
      title: "Adapter evidence",
      activityType: "ariadne.adapter",
      evidenceRefs: [snapshot.jsonPath]
    });
    expect(activity.draft.submit).toBe(false);
    const secondActivity = await draftOpenScorpionActivity({
      project: "ariadne",
      vaultRoot,
      title: "Adapter evidence",
      activityType: "ariadne.adapter",
      evidenceRefs: [snapshot.jsonPath]
    });
    expect(secondActivity.jsonPath).not.toBe(activity.jsonPath);

    const control = await generateControlReport({ project: "ariadne", vaultRoot });
    expect(control.report.evidence.some((item) => item.includes("Review approved by coderabbit"))).toBe(true);
    await planExecution({ project: "ariadne", vaultRoot, repoPath: repo, taskId: "TASK-002" });
    const recovery = await generateRecoveryReport({ project: "ariadne", vaultRoot });
    expect(recovery.report.summary.executionRuns).toBeGreaterThan(0);
    expect(recovery.report.summary.missingWorktreeGuards).toBeGreaterThan(0);
    expect(recovery.report.issues.some((issue) => issue.kind === "check" && issue.severity === "blocking")).toBe(true);

    const console = await generateConsoleData({ project: "ariadne", vaultRoot });
    expect(console.data.summary.sources).toBe(1);
    expect(console.data.summary.tasks).toBeGreaterThan(0);
    expect(console.data.summary.executionRuns).toBeGreaterThan(0);
    expect(console.data.summary.readinessStatus).toBe(control.report.status);
    expect(console.data.sources[0]?.hygieneStatus).toBe("clean");
    expect(console.data.infrastructure.registry?.hosts.length).toBeGreaterThan(0);
    expect(console.data.infrastructure.snapshots.some((item) => item.snapshotKind === "live_read_only")).toBe(true);
    expect(console.data.infrastructure.runtimeProbes).toHaveLength(1);
    expect(console.data.summary.localRuntimeProbes).toBe(1);
    expect(console.data.summary.localRuntimeModels).toBe(3);
    expect(console.data.summary.localRuntimeReachable).toBeGreaterThan(0);
    expect(console.data.summary.githubSnapshots).toBe(1);
    expect(console.data.github.snapshots[0]?.summary.pendingChecks).toBe(1);
    expect(console.data.summary.recoveryIssues).toBe(recovery.report.issues.length);
    expect(console.data.recovery?.status).toBe("attention_required");
    expect(console.data.artifacts.control).toBeTruthy();

    const consoleHtml = await generateConsoleHtml({
      project: "ariadne",
      vaultRoot,
      refreshData: true
    });
    const visual = await generateConsoleVisualCheckReport({ project: "ariadne", vaultRoot });
    const browser = await generateConsoleBrowserCheckReport({ project: "ariadne", vaultRoot, width: 900, height: 900 });
    const html = await fs.readFile(consoleHtml.htmlPath, "utf8");
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Gate Matrix");
    expect(html).toContain("Live Adapters");
    expect(html).toContain("Visual Checks");
    expect(html).toContain("Recovery");
    expect(html).toContain("GitHub");
    expect(html).toContain("Runtime");
    expect(html).toContain("ds4-openai");
    expect(html).toContain("console-data");
    expect(html).not.toContain(temp);
    expect(visual.report.status).toBe("passed");
    expect(browser.report.status).toBe("passed");
    await expect(fs.stat(path.join(vaultRoot, browser.report.screenshotPath))).resolves.toBeTruthy();
  });

  it("builds GitHub-specific mutation readiness plans", async () => {
    const { temp, vaultRoot } = await preparedProject();
    const authEvidence = path.join(temp, "github-auth.json");
    await fs.writeFile(authEvidence, JSON.stringify({ gh: "authenticated" }));
    const approval = await requestApproval({
      project: "ariadne",
      vaultRoot,
      requestedBy: "planner",
      target: "github",
      action: "Enable bounded GitHub PR mutation planning.",
      risk: "medium",
      reason: "Exercise target-specific GitHub mutation command generation.",
      rollback: "Use manual GitHub commands instead.",
      evidenceRefs: [authEvidence]
    });
    const approved = await decideApproval({
      project: "ariadne",
      vaultRoot,
      approval: approval.record.id,
      status: "approved",
      decisionBy: "james",
      decisionNotes: "Fixture approval."
    });
    const relativeAuthEvidence = path.join("control", "approvals", `${approval.record.id}.json`);

    const mergePlan = await planGithubMutation({
      project: "ariadne",
      vaultRoot,
      repository: "jxwalker/ariadne",
      action: "merge-pr",
      pullRequest: 29,
      authEvidenceRefs: [relativeAuthEvidence],
      evidenceRefs: [approved.jsonPath],
      approvalRef: approval.record.id,
      risk: "medium"
    });
    expect(mergePlan.plan.status).toBe("ready_for_bounded_review");
    expect(mergePlan.plan.dryRunCommand).toContain("gh pr view 29");
    expect(mergePlan.plan.proposedLiveCommand).toBe("gh pr merge 29 --repo 'jxwalker/ariadne' --squash --delete-branch");
    expect(mergePlan.plan.postVerificationCommand).toContain("mergedAt");
    expect(mergePlan.plan.execute).toBe(false);

    const rerunPlan = await planGithubMutation({
      project: "ariadne",
      vaultRoot,
      repository: "jxwalker/ariadne",
      action: "rerun-failed-run",
      runId: "123456789",
      authEvidenceRefs: [relativeAuthEvidence],
      evidenceRefs: [approved.jsonPath],
      approvalRef: approval.record.id,
      risk: "low"
    });
    expect(rerunPlan.plan.proposedLiveCommand).toBe("gh run rerun '123456789' --repo 'jxwalker/ariadne' --failed");

    await expect(
      planGithubMutation({
        project: "ariadne",
        vaultRoot,
        repository: "jxwalker/ariadne",
        action: "merge-pr",
        authEvidenceRefs: [authEvidence],
        evidenceRefs: [],
        risk: "medium"
      })
    ).rejects.toThrow(/--pr is required/);
    await expect(
      planGithubMutation({
        project: "ariadne",
        vaultRoot,
        repository: "https://github.com/jxwalker/ariadne",
        action: "rerun-failed-run",
        runId: "123",
        authEvidenceRefs: [authEvidence],
        evidenceRefs: [],
        risk: "medium"
      })
    ).rejects.toThrow(/--repo/);
  });

  it("builds Hermes cron-specific mutation readiness plans", async () => {
    const { temp, vaultRoot } = await preparedProject();
    const authEvidence = path.join(temp, "hermes-auth.json");
    await fs.writeFile(authEvidence, JSON.stringify({ hermes: "authenticated", scheduler: "reviewed" }));
    const approval = await requestApproval({
      project: "ariadne",
      vaultRoot,
      requestedBy: "planner",
      target: "hermes-cron",
      action: "Enable bounded Hermes cron mutation planning.",
      risk: "medium",
      reason: "Exercise target-specific Hermes cron mutation command capture.",
      rollback: "Restore the previous scheduler definition.",
      evidenceRefs: [authEvidence]
    });
    const approved = await decideApproval({
      project: "ariadne",
      vaultRoot,
      approval: approval.record.id,
      status: "approved",
      decisionBy: "james",
      decisionNotes: "Fixture Hermes approval."
    });
    const relativeAuthEvidence = path.join("control", "approvals", `${approval.record.id}.json`);

    const plan = await planHermesCronMutation({
      project: "ariadne",
      vaultRoot,
      action: "update",
      job: "nightly-memory-review",
      host: "beast",
      scope: "Update the nightly memory review schedule after a reviewed proposal.",
      authEvidenceRefs: [relativeAuthEvidence],
      evidenceRefs: [approved.jsonPath],
      dryRunCommand: "hermes cron get nightly-memory-review --host beast",
      liveCommand: "hermes cron update nightly-memory-review --host beast --from reviewed-job.json",
      postVerificationCommand: "hermes cron get nightly-memory-review --host beast",
      rollback: "hermes cron update nightly-memory-review --host beast --from previous-job.json",
      approvalRef: approval.record.id,
      risk: "medium",
      notes: "Fixture plan only; no scheduler command is executed."
    });
    expect(plan.plan.status).toBe("ready_for_bounded_review");
    expect(plan.plan.target).toBe("hermes-cron");
    expect(plan.plan.scope).toContain("hermes-cron/beast/update/nightly-memory-review");
    expect(plan.plan.proposedLiveCommand).toContain("hermes cron update nightly-memory-review");
    expect(plan.plan.requiredGates).toContain("scheduler auth, disable path, and next-run behavior verified");
    expect(plan.plan.execute).toBe(false);

    const defaultHostPlan = await planHermesCronMutation({
      project: "ariadne",
      vaultRoot,
      action: "disable",
      job: "stale sleep routine",
      scope: "Disable stale scheduler entry after review.",
      authEvidenceRefs: [relativeAuthEvidence],
      evidenceRefs: [],
      dryRunCommand: "hermes cron get 'stale sleep routine'",
      liveCommand: "hermes cron disable 'stale sleep routine'",
      postVerificationCommand: "hermes cron get 'stale sleep routine'",
      rollback: "hermes cron enable 'stale sleep routine'",
      approvalRef: approval.record.id,
      risk: "low"
    });
    expect(defaultHostPlan.plan.scope).toContain("hermes-cron/default/disable/stale sleep routine");

    await expect(
      planHermesCronMutation({
        project: "ariadne",
        vaultRoot,
        action: "run-now" as "create",
        job: "nightly-memory-review",
        scope: "Invalid scheduler action.",
        authEvidenceRefs: [authEvidence],
        evidenceRefs: [],
        dryRunCommand: "hermes cron get nightly-memory-review",
        liveCommand: "hermes cron run nightly-memory-review",
        postVerificationCommand: "hermes cron get nightly-memory-review",
        rollback: "hermes cron disable nightly-memory-review",
        risk: "medium"
      })
    ).rejects.toThrow(/--action/);
    await expect(
      planHermesCronMutation({
        project: "ariadne",
        vaultRoot,
        action: "enable",
        job: "../nightly-memory-review",
        scope: "Invalid scheduler job label.",
        authEvidenceRefs: [authEvidence],
        evidenceRefs: [],
        dryRunCommand: "hermes cron get nightly-memory-review",
        liveCommand: "hermes cron enable nightly-memory-review",
        postVerificationCommand: "hermes cron get nightly-memory-review",
        rollback: "hermes cron disable nightly-memory-review",
        risk: "medium"
      })
    ).rejects.toThrow(/--job/);
  });

  it("builds GSD2-specific mutation readiness plans", async () => {
    const { temp, vaultRoot } = await preparedProject();
    const authEvidence = path.join(temp, "gsd2-auth.json");
    await fs.writeFile(authEvidence, JSON.stringify({ gsd: "installed", taskSource: "reviewed" }));
    const approval = await requestApproval({
      project: "ariadne",
      vaultRoot,
      requestedBy: "planner",
      target: "gsd2",
      action: "Enable bounded GSD2 headless task planning.",
      risk: "medium",
      reason: "Exercise target-specific GSD2 mutation command capture.",
      rollback: "Close generated worktree and return task to planned state.",
      evidenceRefs: [authEvidence]
    });
    const approved = await decideApproval({
      project: "ariadne",
      vaultRoot,
      approval: approval.record.id,
      status: "approved",
      decisionBy: "james",
      decisionNotes: "Fixture GSD2 approval."
    });
    const relativeAuthEvidence = path.join("control", "approvals", `${approval.record.id}.json`);

    const plan = await planGsd2Mutation({
      project: "ariadne",
      vaultRoot,
      task: "TASK-001",
      mode: "headless",
      packageName: "ariadne-roadmap",
      scope: "Submit one reviewed Ariadne task to GSD2 headless mode.",
      authEvidenceRefs: [relativeAuthEvidence],
      evidenceRefs: [approved.jsonPath],
      dryRunCommand: "gsd task show TASK-001 --package ariadne-roadmap",
      liveCommand: "gsd headless TASK-001 --package ariadne-roadmap",
      postVerificationCommand: "gsd task show TASK-001 --package ariadne-roadmap",
      rollback: "Remove generated worktree and mark TASK-001 planned.",
      approvalRef: approval.record.id,
      risk: "medium",
      notes: "Fixture plan only; GSD2 is not invoked."
    });
    expect(plan.plan.status).toBe("ready_for_bounded_review");
    expect(plan.plan.target).toBe("gsd2");
    expect(plan.plan.scope).toContain("gsd2/ariadne-roadmap/headless/TASK-001");
    expect(plan.plan.proposedLiveCommand).toBe("gsd headless TASK-001 --package ariadne-roadmap");
    expect(plan.plan.requiredGates).toContain("local GSD2 process path and file contract verified");
    expect(plan.plan.execute).toBe(false);

    const defaultPackagePlan = await planGsd2Mutation({
      project: "ariadne",
      vaultRoot,
      task: "TASK-002",
      mode: "worktree",
      scope: "Create a reviewed GSD2 worktree task.",
      authEvidenceRefs: [relativeAuthEvidence],
      evidenceRefs: [],
      dryRunCommand: "gsd task show TASK-002",
      liveCommand: "gsd worktree TASK-002",
      postVerificationCommand: "gsd task show TASK-002",
      rollback: "Remove generated worktree.",
      approvalRef: approval.record.id,
      risk: "low"
    });
    expect(defaultPackagePlan.plan.scope).toContain("gsd2/default/worktree/TASK-002");

    await expect(
      planGsd2Mutation({
        project: "ariadne",
        vaultRoot,
        task: "TASK-001",
        mode: "daemon" as "headless",
        scope: "Invalid GSD2 mode.",
        authEvidenceRefs: [authEvidence],
        evidenceRefs: [],
        dryRunCommand: "gsd task show TASK-001",
        liveCommand: "gsd daemon TASK-001",
        postVerificationCommand: "gsd task show TASK-001",
        rollback: "Remove generated worktree.",
        risk: "medium"
      })
    ).rejects.toThrow(/--mode/);
    await expect(
      planGsd2Mutation({
        project: "ariadne",
        vaultRoot,
        task: "../TASK-001",
        mode: "headless",
        scope: "Invalid GSD2 task identifier.",
        authEvidenceRefs: [authEvidence],
        evidenceRefs: [],
        dryRunCommand: "gsd task show TASK-001",
        liveCommand: "gsd headless TASK-001",
        postVerificationCommand: "gsd task show TASK-001",
        rollback: "Remove generated worktree.",
        risk: "medium"
      })
    ).rejects.toThrow(/--task/);
  });

  it("builds NotebookLM-specific mutation readiness plans", async () => {
    const { temp, vaultRoot } = await preparedProject();
    const authEvidence = path.join(temp, "notebooklm-auth.json");
    await fs.writeFile(authEvidence, JSON.stringify({ notebooklm: "browser session reviewed", terms: "accepted" }));
    const approval = await requestApproval({
      project: "ariadne",
      vaultRoot,
      requestedBy: "planner",
      target: "notebooklm",
      action: "Enable bounded NotebookLM export planning.",
      risk: "medium",
      reason: "Exercise target-specific NotebookLM mutation command capture.",
      rollback: "Remove generated export and return to manual import.",
      evidenceRefs: [authEvidence]
    });
    const approved = await decideApproval({
      project: "ariadne",
      vaultRoot,
      approval: approval.record.id,
      status: "approved",
      decisionBy: "james",
      decisionNotes: "Fixture NotebookLM approval."
    });
    const relativeAuthEvidence = path.join("control", "approvals", `${approval.record.id}.json`);

    const plan = await planNotebookLmMutation({
      project: "ariadne",
      vaultRoot,
      notebook: "Ariadne Sources",
      action: "export-notes",
      scope: "Export reviewed NotebookLM notes for Ariadne source grounding.",
      authEvidenceRefs: [relativeAuthEvidence],
      evidenceRefs: [approved.jsonPath],
      dryRunCommand: "notebooklmctl notebook show 'Ariadne Sources'",
      liveCommand: "notebooklmctl notebook export-notes 'Ariadne Sources' --output notebooklm-export.md",
      postVerificationCommand: "test -s notebooklm-export.md",
      rollback: "rm -f notebooklm-export.md and keep manual export flow.",
      approvalRef: approval.record.id,
      risk: "medium",
      notes: "Fixture plan only; NotebookLM is not called."
    });
    expect(plan.plan.status).toBe("ready_for_bounded_review");
    expect(plan.plan.target).toBe("notebooklm");
    expect(plan.plan.scope).toContain("notebooklm/export-notes/Ariadne Sources");
    expect(plan.plan.proposedLiveCommand).toContain("notebooklmctl notebook export-notes");
    expect(plan.plan.requiredGates).toContain("NotebookLM auth, terms, and export stability verified");
    expect(plan.plan.execute).toBe(false);

    await expect(
      planNotebookLmMutation({
        project: "ariadne",
        vaultRoot,
        notebook: "Ariadne Sources",
        action: "share-public" as "export-notes",
        scope: "Invalid NotebookLM action.",
        authEvidenceRefs: [authEvidence],
        evidenceRefs: [],
        dryRunCommand: "notebooklmctl notebook show 'Ariadne Sources'",
        liveCommand: "notebooklmctl notebook share-public 'Ariadne Sources'",
        postVerificationCommand: "notebooklmctl notebook show 'Ariadne Sources'",
        rollback: "Disable public share.",
        risk: "medium"
      })
    ).rejects.toThrow(/--action/);
    await expect(
      planNotebookLmMutation({
        project: "ariadne",
        vaultRoot,
        notebook: "../Ariadne Sources",
        action: "refresh-source",
        scope: "Invalid NotebookLM notebook label.",
        authEvidenceRefs: [authEvidence],
        evidenceRefs: [],
        dryRunCommand: "notebooklmctl notebook show 'Ariadne Sources'",
        liveCommand: "notebooklmctl notebook refresh-source 'Ariadne Sources'",
        postVerificationCommand: "notebooklmctl notebook show 'Ariadne Sources'",
        rollback: "Restore previous source export.",
        risk: "medium"
      })
    ).rejects.toThrow(/--notebook/);
  });

  it("builds OpenScorpion-specific mutation readiness plans", async () => {
    const { temp, vaultRoot } = await preparedProject();
    const authEvidence = path.join(temp, "openscorpion-auth.json");
    await fs.writeFile(authEvidence, JSON.stringify({ route: "governed", payloadPolicy: "non-public" }));
    const approval = await requestApproval({
      project: "ariadne",
      vaultRoot,
      requestedBy: "planner",
      target: "openscorpion",
      action: "Enable bounded OpenScorpion governed activity submission planning.",
      risk: "medium",
      reason: "Exercise target-specific OpenScorpion mutation command capture.",
      rollback: "Withdraw submitted activity through the governed route.",
      evidenceRefs: [authEvidence]
    });
    const approved = await decideApproval({
      project: "ariadne",
      vaultRoot,
      approval: approval.record.id,
      status: "approved",
      decisionBy: "james",
      decisionNotes: "Fixture OpenScorpion approval."
    });
    const relativeAuthEvidence = path.join("control", "approvals", `${approval.record.id}.json`);

    const plan = await planOpenScorpionMutation({
      project: "ariadne",
      vaultRoot,
      activity: "activity-001",
      activityType: "ariadne.evidence",
      action: "submit-activity",
      route: "governed",
      scope: "Submit reviewed Ariadne evidence package through governed OpenScorpion route.",
      authEvidenceRefs: [relativeAuthEvidence],
      evidenceRefs: [approved.jsonPath],
      dryRunCommand: "openscorpion activity validate activity-001 --route governed",
      liveCommand: "openscorpion activity submit activity-001 --route governed",
      postVerificationCommand: "openscorpion activity status activity-001 --route governed",
      rollback: "openscorpion activity withdraw activity-001 --route governed",
      approvalRef: approval.record.id,
      risk: "medium",
      notes: "Fixture plan only; OpenScorpion is not called."
    });
    expect(plan.plan.status).toBe("ready_for_bounded_review");
    expect(plan.plan.target).toBe("openscorpion");
    expect(plan.plan.scope).toContain("openscorpion/governed/submit-activity/ariadne.evidence/activity-001");
    expect(plan.plan.proposedLiveCommand).toBe("openscorpion activity submit activity-001 --route governed");
    expect(plan.plan.requiredGates).toContain("governed submission route and non-public payload policy verified");
    expect(plan.plan.execute).toBe(false);

    await expect(
      planOpenScorpionMutation({
        project: "ariadne",
        vaultRoot,
        activity: "activity-001",
        activityType: "ariadne.evidence",
        action: "publish-public" as "submit-activity",
        route: "governed",
        scope: "Invalid OpenScorpion action.",
        authEvidenceRefs: [authEvidence],
        evidenceRefs: [],
        dryRunCommand: "openscorpion activity validate activity-001",
        liveCommand: "openscorpion activity publish-public activity-001",
        postVerificationCommand: "openscorpion activity status activity-001",
        rollback: "openscorpion activity withdraw activity-001",
        risk: "medium"
      })
    ).rejects.toThrow(/--action/);
    await expect(
      planOpenScorpionMutation({
        project: "ariadne",
        vaultRoot,
        activity: "activity-001",
        activityType: "ariadne.evidence",
        action: "submit-activity",
        route: "public" as "governed",
        scope: "Invalid OpenScorpion route.",
        authEvidenceRefs: [authEvidence],
        evidenceRefs: [],
        dryRunCommand: "openscorpion activity validate activity-001",
        liveCommand: "openscorpion activity submit activity-001",
        postVerificationCommand: "openscorpion activity status activity-001",
        rollback: "openscorpion activity withdraw activity-001",
        risk: "medium"
      })
    ).rejects.toThrow(/--route/);
    await expect(
      planOpenScorpionMutation({
        project: "ariadne",
        vaultRoot,
        activity: "../activity-001",
        activityType: "ariadne.evidence",
        action: "submit-activity",
        route: "governed",
        scope: "Invalid OpenScorpion activity identifier.",
        authEvidenceRefs: [authEvidence],
        evidenceRefs: [],
        dryRunCommand: "openscorpion activity validate activity-001",
        liveCommand: "openscorpion activity submit activity-001",
        postVerificationCommand: "openscorpion activity status activity-001",
        rollback: "openscorpion activity withdraw activity-001",
        risk: "medium"
      })
    ).rejects.toThrow(/--activity/);
  });

  it("builds deployment-specific mutation readiness plans", async () => {
    const { temp, vaultRoot } = await preparedProject();
    const authEvidence = path.join(temp, "deployment-auth.json");
    await fs.writeFile(authEvidence, JSON.stringify({ ssh: "approved", sudo: "recorded" }));
    const approval = await requestApproval({
      project: "ariadne",
      vaultRoot,
      requestedBy: "planner",
      target: "deployment",
      action: "Enable bounded deployment mutation planning for one Proxmox host.",
      risk: "high",
      reason: "Exercise target-specific deployment mutation command capture.",
      rollback: "Restart the previous Ariadne service unit on the same host.",
      evidenceRefs: [authEvidence]
    });
    const approved = await decideApproval({
      project: "ariadne",
      vaultRoot,
      approval: approval.record.id,
      status: "approved",
      decisionBy: "james",
      decisionNotes: "Fixture deployment approval."
    });
    const relativeAuthEvidence = path.join("control", "approvals", `${approval.record.id}.json`);

    const plan = await planDeploymentMutation({
      project: "ariadne",
      vaultRoot,
      system: "proxmox",
      host: "beast",
      scope: "Restart Ariadne worker service after reviewed config update.",
      authEvidenceRefs: [relativeAuthEvidence],
      evidenceRefs: [approved.jsonPath],
      dryRunCommand: "ssh beast systemctl status ariadne",
      liveCommand: "ssh beast sudo systemctl restart ariadne",
      postVerificationCommand: "ssh beast systemctl is-active ariadne",
      rollback: "ssh beast sudo systemctl restart ariadne-previous",
      approvalRef: approval.record.id,
      risk: "high",
      notes: "Fixture plan only; no command is executed."
    });
    expect(plan.plan.status).toBe("ready_for_bounded_review");
    expect(plan.plan.target).toBe("deployment");
    expect(plan.plan.scope).toContain("proxmox/beast");
    expect(plan.plan.proposedLiveCommand).toBe("ssh beast sudo systemctl restart ariadne");
    expect(plan.plan.rollback).toContain("proxmox/beast");
    expect(plan.plan.requiredGates).toContain("deployment target and rollback host verified");
    expect(plan.plan.execute).toBe(false);

    const spacedHostPlan = await planDeploymentMutation({
      project: "ariadne",
      vaultRoot,
      system: "dgx-spark",
      host: "DGX Spark",
      scope: "Restart model service after reviewed deployment.",
      authEvidenceRefs: [relativeAuthEvidence],
      evidenceRefs: [],
      dryRunCommand: "ssh dgx-spark systemctl status ariadne-models",
      liveCommand: "ssh dgx-spark sudo systemctl restart ariadne-models",
      postVerificationCommand: "ssh dgx-spark systemctl is-active ariadne-models",
      rollback: "ssh dgx-spark sudo systemctl restart ariadne-models-previous",
      approvalRef: approval.record.id,
      risk: "medium"
    });
    expect(spacedHostPlan.plan.scope).toContain("dgx-spark/DGX Spark");

    await expect(
      planDeploymentMutation({
        project: "ariadne",
        vaultRoot,
        system: "github" as "proxmox",
        host: "beast",
        scope: "Invalid deployment system.",
        authEvidenceRefs: [authEvidence],
        evidenceRefs: [],
        dryRunCommand: "ssh beast true",
        liveCommand: "ssh beast true",
        postVerificationCommand: "ssh beast true",
        rollback: "ssh beast false",
        risk: "medium"
      })
    ).rejects.toThrow(/--system/);
    await expect(
      planDeploymentMutation({
        project: "ariadne",
        vaultRoot,
        system: "proxmox",
        host: "../beast",
        scope: "Invalid deployment host.",
        authEvidenceRefs: [authEvidence],
        evidenceRefs: [],
        dryRunCommand: "ssh beast true",
        liveCommand: "ssh beast true",
        postVerificationCommand: "ssh beast true",
        rollback: "ssh beast false",
        risk: "medium"
      })
    ).rejects.toThrow(/--host/);
  });
});

async function readJsonl(filePath: string): Promise<Array<Record<string, string>>> {
  const content = await fs.readFile(filePath, "utf8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, string>);
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
