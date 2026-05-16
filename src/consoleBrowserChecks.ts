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
    checks.push(await visibleCheck(page, "gate-matrix", "Gate matrix section", "text=Gate Matrix"));
    checks.push(await visibleCheck(page, "evaluation-trends", "Evaluation trends section", "text=Evaluation Trends"));
    checks.push(await visibleCheck(page, "recovery", "Recovery section", "text=Recovery"));
    checks.push(await visibleCheck(page, "github", "GitHub section", "text=GitHub"));
    checks.push(await embeddedDataCheck(page));
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
