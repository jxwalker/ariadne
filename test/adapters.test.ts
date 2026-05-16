import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { importCiStatus, importCodeRabbitReview } from "../src/ciImport.js";
import { generateControlReport } from "../src/controlPlane.js";
import { planExecution } from "../src/execution.js";
import { generateGsd } from "../src/gsd.js";
import { exportGsd2Bundle, importGsd2Bundle } from "../src/gsdAdapter.js";
import { draftOpenScorpionActivity, importInfraSnapshot } from "../src/infraSnapshot.js";
import { importNotebookLmExport } from "../src/notebooklm.js";
import { recordPlaywrightEvidence } from "../src/playwrightEvidence.js";
import { generatePrd } from "../src/prd.js";
import { guardWorktrees } from "../src/worktreeGuard.js";
import { assembleDossier, ingestFiles } from "../src/vault.js";

async function preparedProject(): Promise<{ temp: string; vaultRoot: string }> {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "dev-pipeline-adapters-"));
  const vaultRoot = path.join(temp, "vault");
  const source = path.join(temp, "source.md");
  await fs.writeFile(source, "# Source\n\nNotebookLM GSD2 Playwright CodeRabbit OpenScorpion Proxmox.\n");
  await ingestFiles([source], { project: "agentic-coding", vaultRoot });
  await assembleDossier({ project: "agentic-coding", vaultRoot, maxCharsPerSource: 4000 });
  await generatePrd({ project: "agentic-coding", vaultRoot });
  await generateGsd({ project: "agentic-coding", vaultRoot });
  return { temp, vaultRoot };
}

describe("roadmap adapters", () => {
  it("blocks likely secrets before vault promotion unless explicitly allowed", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "dev-pipeline-secret-"));
    const source = path.join(temp, "secret.md");
    await fs.writeFile(source, "OPENAI_API_KEY=sk-1234567890abcdefghijklmnopqrstuvwxyz\n");

    await expect(
      ingestFiles([source], { project: "agentic-coding", vaultRoot: path.join(temp, "vault") })
    ).rejects.toThrow(/Source hygiene blocked/);

    const records = await ingestFiles([source], {
      project: "agentic-coding",
      vaultRoot: path.join(temp, "vault-allowed"),
      allowSecretFindings: true
    });
    expect(records[0]?.hygieneReportPath).toBeTruthy();

    const emptySource = path.join(temp, "empty.md");
    await fs.writeFile(emptySource, "");
    const emptyRecords = await ingestFiles([emptySource], {
      project: "agentic-coding",
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

    const imported = await importNotebookLmExport({ project: "agentic-coding", vaultRoot, sourcePath: notebook });
    expect(imported.imported.sections.some((section) => section.heading === "Requirement")).toBe(true);
    expect(imported.imported.citations.length).toBeGreaterThan(0);

    const exported = await exportGsd2Bundle({ project: "agentic-coding", vaultRoot });
    expect(exported.bundle.tasks.length).toBeGreaterThan(0);

    const roundTrip = await importGsd2Bundle({
      project: "agentic-coding",
      vaultRoot,
      sourcePath: exported.jsonPath
    });
    expect(roundTrip.roadmap.milestones.length).toBeGreaterThan(0);

    const invalidBundle = path.join(temp, "invalid-bundle.json");
    await fs.writeFile(
      invalidBundle,
      JSON.stringify({ schemaVersion: 1, format: "dev-pipeline-gsd2-bundle", tasks: [{ id: "TASK-BAD" }] })
    );
    await expect(
      importGsd2Bundle({
        project: "agentic-coding",
        vaultRoot,
        sourcePath: invalidBundle
      })
    ).rejects.toThrow(/task 0 is missing required fields/);
  });

  it("records CI, CodeRabbit, Playwright, infra, OpenScorpion, and guarded worktree evidence", async () => {
    const { temp, vaultRoot } = await preparedProject();
    const repo = path.join(temp, "repo");
    await fs.mkdir(repo);
    execFileSync("git", ["init", "-b", "main"], { cwd: repo });

    const execution = await planExecution({ project: "agentic-coding", vaultRoot, repoPath: repo, taskId: "TASK-001" });
    const guard = await guardWorktrees({
      project: "agentic-coding",
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
        project: "agentic-coding",
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
      project: "agentic-coding",
      vaultRoot,
      runFile: invalidRun,
      apply: false
    });
    expect(invalidGuard.report.status).toBe("blocked");
    expect(invalidGuard.report.checks.some((check) => check.name === "working-tree-clean")).toBe(true);

    await recordPlaywrightEvidence({
      project: "agentic-coding",
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
    expect(await importCiStatus({ project: "agentic-coding", vaultRoot, sourcePath: ci })).toBe(2);
    const checks = await readJsonl(path.join(vaultRoot, "projects", "agentic-coding", "control", "check-history.jsonl"));
    expect(checks.find((check) => check.name === "deploy")?.status).toBe("failed");

    const coderabbit = path.join(temp, "coderabbit.md");
    await fs.writeFile(coderabbit, "Approved\n\nNo issues found.\n");
    await importCodeRabbitReview({ project: "agentic-coding", vaultRoot, sourcePath: coderabbit });
    const negatedCoderabbit = path.join(temp, "coderabbit-negated.md");
    await fs.writeFile(negatedCoderabbit, "I have not approved these changes.\n");
    await importCodeRabbitReview({ project: "agentic-coding", vaultRoot, sourcePath: negatedCoderabbit });
    const reviews = await readJsonl(path.join(vaultRoot, "projects", "agentic-coding", "control", "reviews.jsonl"));
    expect(reviews.at(-1)?.status).toBe("pending");

    const infra = path.join(temp, "manifest.json");
    await fs.writeFile(infra, JSON.stringify({ host: { short_name: "beast" }, guests: { vms: [], lxc: [] } }));
    const snapshot = await importInfraSnapshot({ project: "agentic-coding", vaultRoot, sourcePath: infra });
    expect(snapshot.snapshot.summary.host).toBe("beast");

    const activity = await draftOpenScorpionActivity({
      project: "agentic-coding",
      vaultRoot,
      title: "Adapter evidence",
      activityType: "dev-pipeline.adapter",
      evidenceRefs: [snapshot.jsonPath]
    });
    expect(activity.draft.submit).toBe(false);
    const secondActivity = await draftOpenScorpionActivity({
      project: "agentic-coding",
      vaultRoot,
      title: "Adapter evidence",
      activityType: "dev-pipeline.adapter",
      evidenceRefs: [snapshot.jsonPath]
    });
    expect(secondActivity.jsonPath).not.toBe(activity.jsonPath);

    const control = await generateControlReport({ project: "agentic-coding", vaultRoot });
    expect(control.report.evidence.some((item) => item.includes("Review approved by coderabbit"))).toBe(true);
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
