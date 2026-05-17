import path from "node:path";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateArtifactCheckReport } from "./artifactChecks.js";
import { generateBehaviorCheckReport } from "./behaviorChecks.js";
import { generateConsoleBrowserCheckReport } from "./consoleBrowserChecks.js";
import { generateConsoleHtml } from "./consoleHtml.js";
import { generateConsoleVisualCheckReport } from "./consoleVisualChecks.js";
import { generateControlReport } from "./controlPlane.js";
import { exportGsd2Bundle } from "./gsdAdapter.js";
import { generateInfrastructureRegistry } from "./infrastructure.js";
import { collectLocalRuntimeProbe, type RuntimeModelEndpointId } from "./localRuntimeProbe.js";
import { generateMutationReadinessRepairPlan } from "./mutationReadinessRepairPlan.js";
import { slugifyProject } from "./paths.js";
import { generatePlaywrightPlan } from "./playwrightPlan.js";
import { generateRoadmapCompletionAudit } from "./roadmapCompletionAudit.js";
import type {
  ArtifactCheckReport,
  BehaviorCheckReport,
  ConsoleBrowserCheckReport,
  ConsoleVisualCheckReport,
  LocalRuntimeProbe,
  MutationReadinessRepairPlan,
  RoadmapCompletionAudit
} from "./types.js";

export interface E2eSmokeReport {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  mode: "local_smoke";
  status: "passed" | "blocked" | "degraded" | "failed";
  summary: {
    steps: number;
    passed: number;
    blocked: number;
    degraded: number;
    failed: number;
  };
  steps: E2eSmokeStep[];
  artifacts: {
    reportJson?: string;
    behaviorChecks?: string;
    localRuntimeProbe?: string;
    consoleHtml?: string;
    consoleData?: string;
    consoleVisualChecks?: string;
    consoleBrowserChecks?: string;
    consoleScreenshot?: string;
    control?: string;
    gsd2Bundle?: string;
    infrastructureRegistry?: string;
    playwrightPlan?: string;
    mutationReadinessRepairPlan?: string;
    artifactChecks?: string;
    roadmapCompletionAudit?: string;
  };
}

export interface E2eSmokeStep {
  id: string;
  label: string;
  status: "passed" | "blocked" | "degraded" | "failed";
  detail: string;
  artifactRefs: string[];
}

export async function runE2eSmoke(input: {
  project: string;
  vaultRoot: string;
  withRuntimeProbe?: boolean;
  runtimeCanary?: boolean;
  hermesDashboardUrl?: string;
  ollamaUrl?: string;
  ds4Url?: string;
  lmStudioUrl?: string;
  canaryEndpointIds?: RuntimeModelEndpointId[];
  canaryModels?: Partial<Record<RuntimeModelEndpointId, string>>;
  runtimeTimeoutMs?: number;
  targetUrl?: string;
  width?: number;
  height?: number;
}): Promise<{ jsonPath: string; markdownPath: string; report: E2eSmokeReport }> {
  const project = slugifyProject(input.project);
  const generatedAt = new Date();
  const artifacts: E2eSmokeReport["artifacts"] = {};
  const steps: E2eSmokeStep[] = [];

  const gsd2 = await exportGsd2Bundle({ project, vaultRoot: input.vaultRoot });
  artifacts.gsd2Bundle = relative(input.vaultRoot, gsd2.jsonPath);
  steps.push({
    id: "gsd2-bundle",
    label: "GSD2 bundle",
    status: "passed",
    detail: `${gsd2.bundle.tasks.length} task(s) exported for downstream runners.`,
    artifactRefs: [artifacts.gsd2Bundle]
  });

  const playwright = await generatePlaywrightPlan({
    project,
    vaultRoot: input.vaultRoot,
    targetUrl: input.targetUrl ?? "http://localhost:3000"
  });
  artifacts.playwrightPlan = relative(input.vaultRoot, playwright.jsonPath);
  steps.push({
    id: "playwright-plan",
    label: "Playwright plan",
    status: "passed",
    detail: `${playwright.plan.scenarios.length} scenario(s) planned for ${playwright.plan.targetUrl}.`,
    artifactRefs: [artifacts.playwrightPlan]
  });

  const infra = await generateInfrastructureRegistry({ project, vaultRoot: input.vaultRoot });
  artifacts.infrastructureRegistry = relative(input.vaultRoot, infra.jsonPath);
  steps.push({
    id: "infrastructure-registry",
    label: "Infrastructure registry",
    status: "passed",
    detail: `${infra.registry.hosts.length} host(s), ${infra.registry.runnerPools.length} runner pool(s), ${infra.registry.modelEndpoints.length} model endpoint(s).`,
    artifactRefs: [artifacts.infrastructureRegistry]
  });

  const control = await generateControlReport({ project, vaultRoot: input.vaultRoot });
  artifacts.control = relative(input.vaultRoot, control.jsonPath);
  steps.push({
    id: "control-report",
    label: "Control report",
    status: control.report.status === "ready" ? "passed" : "blocked",
    detail: `Merge-readiness status ${control.report.status}; ${control.report.missing.length} missing item(s).`,
    artifactRefs: [artifacts.control]
  });

  const behavior = await generateBehaviorCheckReport({ project, vaultRoot: input.vaultRoot });
  artifacts.behaviorChecks = relative(input.vaultRoot, behavior.jsonPath);
  steps.push(behaviorStep(behavior.report, artifacts.behaviorChecks));

  if (input.withRuntimeProbe) {
    const runtime = await collectLocalRuntimeProbe({
      project,
      vaultRoot: input.vaultRoot,
      canary: input.runtimeCanary,
      hermesDashboardUrl: input.hermesDashboardUrl,
      ollamaUrl: input.ollamaUrl,
      ds4Url: input.ds4Url,
      lmStudioUrl: input.lmStudioUrl,
      canaryEndpointIds: input.canaryEndpointIds,
      canaryModels: input.canaryModels,
      timeoutMs: input.runtimeTimeoutMs
    });
    artifacts.localRuntimeProbe = relative(input.vaultRoot, runtime.jsonPath);
    steps.push(runtimeStep(runtime.probe, artifacts.localRuntimeProbe));
  }

  const repairPlan = await generateMutationReadinessRepairPlan({ project, vaultRoot: input.vaultRoot });
  artifacts.mutationReadinessRepairPlan = relative(input.vaultRoot, repairPlan.jsonPath);
  steps.push(repairPlanStep(repairPlan.report, artifacts.mutationReadinessRepairPlan));

  const consoleHtml = await generateConsoleHtml({ project, vaultRoot: input.vaultRoot, refreshData: true });
  artifacts.consoleHtml = relative(input.vaultRoot, consoleHtml.htmlPath);
  artifacts.consoleData = consoleHtml.dataPath ? relative(input.vaultRoot, consoleHtml.dataPath) : undefined;
  steps.push({
    id: "console-html",
    label: "Console HTML",
    status: "passed",
    detail: `Rendered console with readiness ${consoleHtml.data.summary.readinessStatus ?? "unknown"}.`,
    artifactRefs: [artifacts.consoleHtml, artifacts.consoleData].filter(Boolean) as string[]
  });

  const visual = await generateConsoleVisualCheckReport({
    project,
    vaultRoot: input.vaultRoot,
    htmlPath: consoleHtml.htmlPath
  });
  artifacts.consoleVisualChecks = relative(input.vaultRoot, visual.jsonPath);
  steps.push(visualStep(visual.report, artifacts.consoleVisualChecks));

  const browser = await generateConsoleBrowserCheckReport({
    project,
    vaultRoot: input.vaultRoot,
    htmlPath: consoleHtml.htmlPath,
    width: input.width,
    height: input.height
  });
  artifacts.consoleBrowserChecks = relative(input.vaultRoot, browser.jsonPath);
  artifacts.consoleScreenshot = browser.report.screenshotPath;
  steps.push(browserStep(browser.report, artifacts.consoleBrowserChecks, artifacts.consoleScreenshot));

  const artifactsResult = await generateArtifactCheckReport({ project, vaultRoot: input.vaultRoot });
  artifacts.artifactChecks = relative(input.vaultRoot, artifactsResult.jsonPath);
  steps.push(artifactStep(artifactsResult.report, artifacts.artifactChecks));

  const roadmap = await generateRoadmapCompletionAudit({ project, vaultRoot: input.vaultRoot });
  artifacts.roadmapCompletionAudit = relative(input.vaultRoot, roadmap.jsonPath);
  steps.push(roadmapStep(roadmap.audit, artifacts.roadmapCompletionAudit));

  const summary = {
    steps: steps.length,
    passed: steps.filter((step) => step.status === "passed").length,
    blocked: steps.filter((step) => step.status === "blocked").length,
    degraded: steps.filter((step) => step.status === "degraded").length,
    failed: steps.filter((step) => step.status === "failed").length
  };
  const status: E2eSmokeReport["status"] =
    summary.failed > 0 ? "failed" : summary.blocked > 0 ? "blocked" : summary.degraded > 0 ? "degraded" : "passed";
  const name = `e2e-smoke-${timestampFile(generatedAt)}`;
  artifacts.reportJson = `projects/${project}/evaluation/${name}.json`;
  const report: E2eSmokeReport = {
    schemaVersion: 1,
    project,
    generatedAt: generatedAt.toISOString(),
    mode: "local_smoke",
    status,
    summary,
    steps,
    artifacts
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "evaluation", `${name}.json`, report);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "evaluation", `${name}.md`, renderReport(report));
  return { jsonPath, markdownPath, report };
}

function behaviorStep(report: BehaviorCheckReport, artifactRef: string): E2eSmokeStep {
  return {
    id: "behavior-checks",
    label: "Behavior checks",
    status: report.status === "failed" ? "failed" : report.status === "warning" ? "degraded" : "passed",
    detail: `${report.summary.passed} passed, ${report.summary.warnings} warnings, ${report.summary.failed} failed.`,
    artifactRefs: [artifactRef]
  };
}

function runtimeStep(probe: LocalRuntimeProbe, artifactRef: string): E2eSmokeStep {
  return {
    id: "local-runtime-probe",
    label: "Local runtime probe",
    status: probe.summary.unreachable > 0 ? "failed" : probe.summary.degraded > 0 ? "degraded" : "passed",
    detail: `${probe.summary.reachable} reachable, ${probe.summary.degraded} degraded, ${probe.summary.unreachable} unreachable, ${probe.summary.models} models.`,
    artifactRefs: [artifactRef]
  };
}

function repairPlanStep(report: MutationReadinessRepairPlan, artifactRef: string): E2eSmokeStep {
  return {
    id: "mutation-readiness-repair-plan",
    label: "Mutation repair plan",
    status: "passed",
    detail: `${report.status}; ${report.summary.auditPassed} audit-passed, ${report.summary.missingPlans} missing, ${report.summary.repairablePlans} repairable, ${report.summary.operatorActionRequired} operator-action-required, ${report.summary.blocked} blocked.`,
    artifactRefs: [artifactRef]
  };
}

function visualStep(report: ConsoleVisualCheckReport, artifactRef: string): E2eSmokeStep {
  return {
    id: "console-visual-checks",
    label: "Console visual checks",
    status: report.status === "passed" ? "passed" : "failed",
    detail: `${report.summary.passed} passed, ${report.summary.failed} failed.`,
    artifactRefs: [artifactRef]
  };
}

function browserStep(report: ConsoleBrowserCheckReport, artifactRef: string, screenshotRef?: string): E2eSmokeStep {
  return {
    id: "console-browser-checks",
    label: "Console browser checks",
    status: report.status === "passed" ? "passed" : "failed",
    detail: `${report.summary.passed} passed, ${report.summary.failed} failed at ${report.viewport.width}x${report.viewport.height}.`,
    artifactRefs: [artifactRef, screenshotRef].filter(Boolean) as string[]
  };
}

function artifactStep(report: ArtifactCheckReport, artifactRef: string): E2eSmokeStep {
  return {
    id: "artifact-checks",
    label: "Artifact checks",
    status: report.status === "passed" ? "passed" : "failed",
    detail: `${report.summary.present} present, ${report.summary.missingRequired} required missing.`,
    artifactRefs: [artifactRef]
  };
}

function roadmapStep(audit: RoadmapCompletionAudit, artifactRef: string): E2eSmokeStep {
  return {
    id: "roadmap-completion-audit",
    label: "Roadmap completion audit",
    status: audit.status === "complete" ? "passed" : "blocked",
    detail: `${audit.summary.passed} passed, ${audit.summary.blocked} blocked.`,
    artifactRefs: [artifactRef]
  };
}

function renderReport(report: E2eSmokeReport): string {
  const lines = [
    "# End-to-End Smoke Report",
    "",
    `Project: ${report.project}`,
    `Status: ${report.status}`,
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Steps: ${report.summary.steps}`,
    `- Passed: ${report.summary.passed}`,
    `- Blocked: ${report.summary.blocked}`,
    `- Degraded: ${report.summary.degraded}`,
    `- Failed: ${report.summary.failed}`,
    "",
    "## Steps",
    "",
    "| Step | Status | Detail | Artifacts |",
    "| --- | --- | --- | --- |",
    ...report.steps.map(
      (step) =>
        `| ${step.label} | ${step.status} | ${escapeTable(step.detail)} | ${step.artifactRefs.map(escapeTable).join("<br>")} |`
    ),
    "",
    "## Notes",
    "",
    "- This command does not create approvals, import operator evidence, start services, or mutate external systems.",
    "- The mutation repair step is read-only guidance and records mutationAllowed=false.",
    "- A blocked roadmap audit means Ariadne is waiting for explicit operator evidence or cutover gates, not that the smoke command failed."
  ];
  return `${lines.join("\n")}\n`;
}

function relative(root: string, filePath: string): string {
  const rel = path.relative(root, filePath);
  return rel.startsWith("..") ? filePath : rel.replace(/\\/g, "/");
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
