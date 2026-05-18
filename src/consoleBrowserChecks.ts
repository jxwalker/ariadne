import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type Page } from "playwright";
import { ensureArtifactDir, timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateConsoleHtml } from "./consoleHtml.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { ConsoleBrowserCheckReport } from "./types.js";

export async function generateConsoleBrowserCheckReport(input: {
  project: string;
  vaultRoot: string;
  htmlPath?: string;
  width?: number;
  height?: number;
}): Promise<{ jsonPath: string; markdownPath: string; report: ConsoleBrowserCheckReport }> {
  const project = slugifyProject(input.project);
  if (!input.htmlPath) {
    await generateConsoleHtml({ project, vaultRoot: input.vaultRoot, refreshData: true });
  }
  const htmlPath = path.resolve(input.htmlPath ?? path.join(projectDir(input.vaultRoot, project), "console", "index.html"));
  await fs.access(htmlPath);
  const width = input.width ?? 1440;
  const height = input.height ?? 1100;
  const generatedAt = new Date();
  const screenshotDir = await ensureArtifactDir(input.vaultRoot, project, "console/screenshots");
  const screenshotPath = path.join(screenshotDir, `console-${timestampFile(generatedAt)}.png`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height } });
  const checks: ConsoleBrowserCheckReport["checks"] = [];

  try {
    await page.goto(pathToFileURL(htmlPath).toString(), { waitUntil: "networkidle" });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    checks.push(await visibleCheck(page, "brand", "Ariadne brand", "text=Ariadne Console"));
    checks.push(await visibleCheck(page, "workflow", "Workflow overview", "text=Capture"));
    checks.push(await visibleCheck(page, "next-best-action", "Next best action", "text=Next best action"));
    checks.push(await visibleCheck(page, "next-action-steps", "Next action steps", '[data-visual-role="next-action-steps"]'));
    checks.push(await operatorChecklistVisibleCheck(page));
    checks.push(await operatorChecklistProgressVisibleCheck(page));
    checks.push(await visibleCheck(page, "workflow-routes", "Workflow interaction routes", '[data-visual-role="workflow-routes"]'));
    checks.push(await visibleCheck(page, "operator-modes", "Operator modes", "text=Operator modes"));
    checks.push(await visibleCheck(page, "workflow-surfaces", "Workflow surfaces", "text=Surface split"));
    checks.push(await visibleCheck(page, "gate-matrix", "Gate matrix section", "text=Gate Matrix"));
    checks.push(await visibleCheck(page, "evaluation-trends", "Evaluation trends section", "text=Evaluation Trends"));
    checks.push(await visibleCheck(page, "recovery", "Recovery section", "text=Recovery"));
    checks.push(await visibleCheck(page, "github", "GitHub section", "text=GitHub"));
    checks.push(await visibleCheck(page, "evidence-queue", "Evidence Queue metric", "text=Evidence Queue"));
    checks.push(await visibleCheck(page, "evidence-checks", "Evidence Checks metric", "text=Evidence Checks"));
    checks.push(await operatorEvidenceCheckCommandCheck(page));
    checks.push(await embeddedDataCheck(page));
    checks.push(await embeddedWorkflowDataCheck(page));
    checks.push(await screenshotSizeCheck(screenshotPath));
  } finally {
    await browser.close();
  }

  const summary = {
    passed: checks.filter((check) => check.status === "passed").length,
    failed: checks.filter((check) => check.status === "failed").length
  };
  const report: ConsoleBrowserCheckReport = {
    schemaVersion: 1,
    project,
    generatedAt: generatedAt.toISOString(),
    htmlPath: path.relative(input.vaultRoot, htmlPath),
    screenshotPath: path.relative(input.vaultRoot, screenshotPath),
    status: summary.failed === 0 ? "passed" : "failed",
    viewport: { width, height },
    summary,
    checks
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "console", "browser-checks.json", report);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "console",
    "browser-checks.md",
    renderReport(report)
  );
  if (!input.htmlPath) {
    await generateConsoleHtml({ project, vaultRoot: input.vaultRoot, refreshData: true });
  }
  return { jsonPath, markdownPath, report };
}

async function visibleCheck(
  page: Page,
  id: string,
  label: string,
  selector: string
): Promise<ConsoleBrowserCheckReport["checks"][number]> {
  const locator = page.locator(selector).first();
  const visible = await locator.isVisible().catch(() => false);
  return {
    id,
    label,
    status: visible ? "passed" : "failed",
    detail: visible ? `${label} is visible.` : `${label} is not visible.`
  };
}

async function embeddedDataCheck(page: Page): Promise<ConsoleBrowserCheckReport["checks"][number]> {
  const valid = await page
    .locator("#console-data")
    .evaluate((node) => {
      try {
        const data = JSON.parse(node.textContent ?? "{}") as { schemaVersion?: number; project?: string };
        return data.schemaVersion === 1 && Boolean(data.project);
      } catch {
        return false;
      }
    })
    .catch(() => false);
  return {
    id: "embedded-data",
    label: "Embedded console data parses",
    status: valid ? "passed" : "failed",
    detail: valid ? "Embedded console data is parseable." : "Embedded console data is missing or malformed."
  };
}

async function embeddedWorkflowDataCheck(page: Page): Promise<ConsoleBrowserCheckReport["checks"][number]> {
  const valid = await page
    .locator("#console-data")
    .evaluate((node) => {
      try {
        const data = JSON.parse(node.textContent ?? "{}") as {
          workflow?: {
            schemaVersion?: number;
            stages?: Array<{ id?: string }>;
            nextAction?: {
              artifactRef?: string;
              steps?: Array<{ id?: string; title?: string; detail?: string; surface?: string; kind?: string }>;
            };
            operatorChecklist?: {
              target?: string;
              status?: string;
              evidenceFileRef?: string;
              assistFileRef?: string;
              checkCommand?: string;
              importCommand?: string;
              missingSections?: number;
              fillProgress?: {
                currentSection?: string;
                readyForHumanFill?: number;
                contextBacked?: number;
                promotedLiveEvidenceBacked?: number;
                gbrainBacked?: number;
              };
              sections?: Array<{
                missingSection?: string;
                status?: string;
                current?: boolean;
                prompt?: string;
                startWith?: string;
                recordIn?: string;
                preflight?: string;
                existingEvidenceRefs?: unknown[];
                promotedLiveEvidenceRefs?: unknown[];
                gbrainQueries?: unknown[];
              }>;
            };
            routes?: Array<{
              id?: string;
              label?: string;
              audience?: string;
              current?: boolean;
              primarySurface?: string;
              supportSurfaces?: string[];
              summary?: string;
              steps?: Array<{ id?: string; title?: string; detail?: string; stage?: string; surface?: string }>;
            }>;
            modes?: Array<{ id?: string; primarySurface?: string }>;
            surfaces?: Array<{ id?: string }>;
          };
        };
        const stageIds = data.workflow?.stages?.map((stage) => stage.id).join(",");
        const steps = data.workflow?.nextAction?.steps;
        const checklist = data.workflow?.operatorChecklist;
        const routes = data.workflow?.routes;
        const modes = data.workflow?.modes ?? [];
        const surfaceIds = new Set(data.workflow?.surfaces?.map((surface) => surface.id));
        return (
          data.workflow?.schemaVersion === 1 &&
          stageIds === "capture,shape,build,verify,review,operate" &&
          Boolean(data.workflow?.nextAction?.artifactRef) &&
          Array.isArray(steps) &&
          steps.length > 0 &&
          steps.every((step) => step.id && step.title && step.detail && step.surface && step.kind) &&
          (!checklist ||
            (Boolean(
              checklist.target &&
                checklist.status &&
                checklist.evidenceFileRef &&
                checklist.assistFileRef &&
                checklist.checkCommand &&
                checklist.importCommand
            ) &&
              Number.isInteger(checklist.missingSections) &&
              Boolean(
                checklist.fillProgress &&
                  checklist.fillProgress.currentSection &&
                  Number.isInteger(checklist.fillProgress.readyForHumanFill) &&
                  Number.isInteger(checklist.fillProgress.contextBacked) &&
                  Number.isInteger(checklist.fillProgress.promotedLiveEvidenceBacked) &&
                  Number.isInteger(checklist.fillProgress.gbrainBacked)
              ) &&
              Array.isArray(checklist.sections) &&
              checklist.sections.length > 0 &&
              checklist.sections.every(
                (section) =>
                  section.missingSection &&
                  section.status &&
                  typeof section.current === "boolean" &&
                  section.prompt &&
                  section.startWith &&
                  section.recordIn &&
                  section.preflight &&
                  Array.isArray(section.existingEvidenceRefs) &&
                  Array.isArray(section.promotedLiveEvidenceRefs) &&
                  Array.isArray(section.gbrainQueries)
              ))) &&
          Array.isArray(routes) &&
          routes.length === 4 &&
          routes.some((route) => route.id === "operator-evidence" && route.primarySurface === "ariadne-console") &&
          routes.some((route) => route.id === "automation-loop" && route.primarySurface === "hermes") &&
          routes.every(
            (route) =>
              route.id &&
              route.label &&
              route.audience &&
              typeof route.current === "boolean" &&
              route.primarySurface &&
              Array.isArray(route.supportSurfaces) &&
              route.summary &&
              Array.isArray(route.steps) &&
              route.steps.length > 0 &&
              route.steps.every((step) => step.id && step.title && step.detail && step.stage && step.surface)
          ) &&
          modes.some((mode) => mode.id === "guided" && mode.primarySurface === "ariadne-console") &&
          modes.some((mode) => mode.id === "automation" && mode.primarySurface === "hermes") &&
          surfaceIds.has("hermes") &&
          surfaceIds.has("gbrain")
        );
      } catch {
        return false;
      }
    })
    .catch(() => false);
  return {
    id: "workflow-data",
    label: "Embedded workflow data parses",
    status: valid ? "passed" : "failed",
    detail: valid ? "Embedded workflow data is parseable." : "Embedded workflow data is missing or malformed."
  };
}

async function operatorChecklistVisibleCheck(page: Page): Promise<ConsoleBrowserCheckReport["checks"][number]> {
  const required = await page
    .locator("#console-data")
    .evaluate((node) => {
      try {
        const data = JSON.parse(node.textContent ?? "{}") as { workflow?: { operatorChecklist?: unknown } };
        return Boolean(data.workflow?.operatorChecklist);
      } catch {
        return false;
      }
    })
    .catch(() => false);
  if (!required) {
    return {
      id: "operator-evidence-checklist",
      label: "Operator evidence checklist",
      status: "passed",
      detail: "No operator checklist is required."
    };
  }
  return visibleCheck(
    page,
    "operator-evidence-checklist",
    "Operator evidence checklist",
    '[data-visual-role="operator-evidence-checklist"]'
  );
}

async function operatorChecklistProgressVisibleCheck(page: Page): Promise<ConsoleBrowserCheckReport["checks"][number]> {
  const required = await page
    .locator("#console-data")
    .evaluate((node) => {
      try {
        const data = JSON.parse(node.textContent ?? "{}") as { workflow?: { operatorChecklist?: unknown } };
        return Boolean(data.workflow?.operatorChecklist);
      } catch {
        return false;
      }
    })
    .catch(() => false);
  if (!required) {
    return {
      id: "operator-evidence-progress",
      label: "Operator evidence progress",
      status: "passed",
      detail: "No operator progress is required."
    };
  }
  return visibleCheck(
    page,
    "operator-evidence-progress",
    "Operator evidence progress",
    '[data-visual-role="operator-evidence-progress"]'
  );
}

async function operatorEvidenceCheckCommandCheck(page: Page): Promise<ConsoleBrowserCheckReport["checks"][number]> {
  const required = await page
    .locator("#console-data")
    .evaluate((node) => {
      try {
        const data = JSON.parse(node.textContent ?? "{}") as { liveAdapterOperatorEvidenceWorkplan?: unknown };
        return Boolean(data.liveAdapterOperatorEvidenceWorkplan);
      } catch {
        return false;
      }
    })
    .catch(() => false);
  if (!required) {
    return {
      id: "operator-evidence-check-command",
      label: "Operator evidence check command",
      status: "passed",
      detail: "No operator evidence workplan is present."
    };
  }
  return visibleCheck(page, "operator-evidence-check-command", "Operator evidence check command", "text=live-adapter-operator-evidence-check");
}

async function screenshotSizeCheck(filePath: string): Promise<ConsoleBrowserCheckReport["checks"][number]> {
  const stat = await fs.stat(filePath);
  const valid = stat.size > 10_000;
  return {
    id: "screenshot",
    label: "Screenshot captured",
    status: valid ? "passed" : "failed",
    detail: valid ? `${stat.size} bytes captured.` : `Screenshot is too small: ${stat.size} bytes.`
  };
}

function renderReport(report: ConsoleBrowserCheckReport): string {
  return [
    "# Console Browser Checks",
    "",
    `Project: ${report.project}`,
    `Status: ${report.status}`,
    `Generated: ${report.generatedAt}`,
    `HTML: ${report.htmlPath}`,
    `Screenshot: ${report.screenshotPath}`,
    `Viewport: ${report.viewport.width}x${report.viewport.height}`,
    "",
    "## Summary",
    "",
    `- Passed: ${report.summary.passed}`,
    `- Failed: ${report.summary.failed}`,
    "",
    "## Checks",
    "",
    "| Id | Status | Detail |",
    "| --- | --- | --- |",
    ...report.checks.map((check) => `| ${check.id} | ${check.status} | ${check.detail} |`),
    ""
  ].join("\n");
}
