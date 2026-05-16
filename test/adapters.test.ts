import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateArtifactCheckReport } from "../src/artifactChecks.js";
import { generateBehaviorCheckReport } from "../src/behaviorChecks.js";
import { materializeBenchmarkPack } from "../src/benchmarkPacks.js";
import { importCiStatus, importCodeRabbitReview } from "../src/ciImport.js";
import { generateControlReport } from "../src/controlPlane.js";
import { generateConsoleData } from "../src/consoleData.js";
import { generateConsoleHtml } from "../src/consoleHtml.js";
import { generateConsoleVisualCheckReport } from "../src/consoleVisualChecks.js";
import { recordAgentLease, recordAgentMail, recordMemoryProposal, recordSleepRoutine } from "../src/coordination.js";
import { importDeploymentSnapshot } from "../src/deploymentAdapters.js";
import { planExecution } from "../src/execution.js";
import { exportGbrainBundle, importGbrainReport } from "../src/gbrainAdapter.js";
import { importGithubSnapshot } from "../src/githubAdapter.js";
import { generateGsd } from "../src/gsd.js";
import { exportGsd2Bundle, importGsd2Bundle } from "../src/gsdAdapter.js";
import { generateInfrastructureRegistry } from "../src/infrastructure.js";
import { draftOpenScorpionActivity, importInfraSnapshot } from "../src/infraSnapshot.js";
import { generatePlaywrightPlan } from "../src/playwrightPlan.js";
import { generateEvaluationPlan, recordEvaluationRun } from "../src/evaluation.js";
import { generateEvaluationTrendReport } from "../src/evaluationTrends.js";
import { importNotebookLmExport } from "../src/notebooklm.js";
import { recordPlaywrightEvidence } from "../src/playwrightEvidence.js";
import { generatePrd } from "../src/prd.js";
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
  });

  it("records behavior checks, sleep routines, memory proposals, agent mail, leases, and deployment snapshots", async () => {
    const { temp, vaultRoot } = await preparedProject();
    const repo = path.join(temp, "repo");
    await fs.mkdir(repo);
    execFileSync("git", ["init", "-b", "main"], { cwd: repo });
    const execution = await planExecution({ project: "ariadne", vaultRoot, repoPath: repo, taskId: "TASK-001" });
    await guardWorktrees({ project: "ariadne", vaultRoot, runFile: execution.jsonPath, apply: false });

    const coderabbit = path.join(temp, "coderabbit-approved.md");
    await fs.writeFile(coderabbit, "Approved\n\nNo issues found.\n");
    await importCodeRabbitReview({ project: "ariadne", vaultRoot, sourcePath: coderabbit });
    const behavior = await generateBehaviorCheckReport({
      project: "ariadne",
      vaultRoot,
      approvedFixturePath: coderabbit
    });
    expect(behavior.report.status).toBe("passed");

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

    const console = await generateConsoleData({ project: "ariadne", vaultRoot });
    expect(console.data.summary.sleepRoutines).toBe(1);
    expect(console.data.summary.memoryProposals).toBe(1);
    expect(console.data.summary.agentMail).toBe(1);
    expect(console.data.summary.agentLeases).toBe(1);
    expect(console.data.summary.deploymentSnapshots).toBe(1);
    expect(console.data.behaviorChecks?.status).toBe("passed");
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

    const console = await generateConsoleData({ project: "ariadne", vaultRoot });
    expect(console.data.summary.sources).toBe(1);
    expect(console.data.summary.tasks).toBeGreaterThan(0);
    expect(console.data.summary.executionRuns).toBeGreaterThan(0);
    expect(console.data.summary.readinessStatus).toBe(control.report.status);
    expect(console.data.sources[0]?.hygieneStatus).toBe("clean");
    expect(console.data.infrastructure.registry?.hosts.length).toBeGreaterThan(0);
    expect(console.data.summary.githubSnapshots).toBe(1);
    expect(console.data.github.snapshots[0]?.summary.pendingChecks).toBe(1);
    expect(console.data.artifacts.control).toBeTruthy();

    const consoleHtml = await generateConsoleHtml({
      project: "ariadne",
      vaultRoot,
      refreshData: true
    });
    const visual = await generateConsoleVisualCheckReport({ project: "ariadne", vaultRoot });
    const html = await fs.readFile(consoleHtml.htmlPath, "utf8");
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Gate Matrix");
    expect(html).toContain("Visual Checks");
    expect(html).toContain("GitHub");
    expect(html).toContain("console-data");
    expect(html).not.toContain(temp);
    expect(visual.report.status).toBe("passed");
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
