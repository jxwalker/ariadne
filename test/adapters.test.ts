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
import { generateLiveAdapterNextActions } from "../src/liveAdapterNextActions.js";
import { generateLiveAdapterReadiness } from "../src/liveAdapterReadiness.js";
import { generateLiveAdapterTargetDossier } from "../src/liveAdapterTargetDossier.js";
import { planMutationReadiness } from "../src/mutationReadiness.js";
import { generateMutationReadinessAudit } from "../src/mutationReadinessAudit.js";
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
import { captureTargetAppEvidence } from "../src/targetAppCapture.js";
import { runTargetMutationExecution, targetForMutationExecutionCommand } from "../src/targetMutationExecute.js";
import { generateUsageMetricsReport, importUsageMetrics } from "../src/usageMetrics.js";
import { guardWorktrees } from "../src/worktreeGuard.js";
import { assembleDossier, ingestFiles } from "../src/vault.js";

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
    expect(githubActions?.actions.some((action) => action.id === "github-replace-placeholder" && action.status === "ready")).toBe(true);
    expect(deploymentActions?.actions.some((action) => action.id === "deployment-approval-pack-review")).toBe(true);
    expect(deploymentActions?.actions.some((action) => action.id === "deployment-audit-fix")).toBe(true);
    expect(deploymentActions?.actions.some((action) => action.id === "deployment-dry-run" && action.status === "pending")).toBe(true);
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
    expect(githubCutover?.gates.some((gate) => gate.id === "gbrain-context-advisory" && gate.status === "advisory")).toBe(true);
    expect(deploymentCutover?.status).toBe("blocked");
    expect(deploymentCutover?.blockers.some((blocker) => blocker.includes("Current accepted operator packet review"))).toBe(true);
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
    expect(console.data.summary.liveAdapterReadinessStatus).toBe("blocked");
    expect(console.data.summary.liveAdapterReady).toBe(1);
    expect(console.data.summary.liveAdapterBlocked).toBe(5);
    expect(console.data.summary.liveAdapterActionItems).toBeGreaterThan(0);
    expect(console.data.summary.liveAdapterApprovalPackets).toBe(5);
    expect(console.data.summary.acceptedLiveAdapterApprovalReviews).toBe(1);
    expect(console.data.summary.liveAdapterApprovalReviewAuditStatus).toBe("blocked");
    expect(console.data.summary.currentLiveAdapterApprovalReviews).toBe(1);
    expect(console.data.summary.liveAdapterTargetDossiers).toBe(2);
    expect(console.data.summary.liveAdapterCutoverAuditStatus).toBe("blocked");
    expect(console.data.summary.liveAdapterCutoverReady).toBe(1);
    expect(console.data.liveAdapterCutoverAudit?.targets.some((target) => target.target === "github")).toBe(true);
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

    const artifactChecks = await generateArtifactCheckReport({ project: "ariadne", vaultRoot });
    const coordinationCheck = artifactChecks.report.checks.find((check) => check.id === "coordination-records");
    const hermesCheck = artifactChecks.report.checks.find((check) => check.id === "hermes-cron-snapshots");
    const hermesProposalCheck = artifactChecks.report.checks.find((check) => check.id === "hermes-cron-proposals");
    const readinessCheck = artifactChecks.report.checks.find((check) => check.id === "mutation-readiness-plans");
    const readinessAuditCheck = artifactChecks.report.checks.find((check) => check.id === "mutation-readiness-audit");
    const nextActionsCheck = artifactChecks.report.checks.find((check) => check.id === "live-adapter-next-actions");
    const approvalPackCheck = artifactChecks.report.checks.find((check) => check.id === "live-adapter-approval-pack");
    const approvalReviewCheck = artifactChecks.report.checks.find((check) => check.id === "live-adapter-approval-reviews");
    const approvalReviewAuditCheck = artifactChecks.report.checks.find((check) => check.id === "live-adapter-approval-review-audit");
    const targetDossierCheck = artifactChecks.report.checks.find((check) => check.id === "live-adapter-dossiers");
    const cutoverAuditCheck = artifactChecks.report.checks.find((check) => check.id === "live-adapter-cutover-audit");
    const mutationDryRunCheck = artifactChecks.report.checks.find((check) => check.id === "mutation-dry-runs");
    const mutationExecutionCheck = artifactChecks.report.checks.find((check) => check.id === "mutation-executions");
    expect(coordinationCheck?.matches?.some((match) => match.includes("coordination/hermes"))).toBe(false);
    expect(hermesCheck?.count).toBe(1);
    expect(hermesProposalCheck?.count).toBe(2);
    expect(readinessCheck?.count).toBe(2);
    expect(readinessAuditCheck?.status).toBe("present");
    expect(nextActionsCheck?.status).toBe("present");
    expect(approvalPackCheck?.status).toBe("present");
    expect(approvalReviewCheck?.status).toBe("present");
    expect(approvalReviewAuditCheck?.status).toBe("present");
    expect(targetDossierCheck?.status).toBe("present");
    expect(cutoverAuditCheck?.status).toBe("present");
    expect(mutationDryRunCheck?.status).toBe("present");
    expect(mutationExecutionCheck?.status).toBe("present");
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
