import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { generateConsoleHtml } from "./consoleHtml.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { ConsoleData, ConsoleVisualCheckReport } from "./types.js";

export async function generateConsoleVisualCheckReport(input: {
  project: string;
  vaultRoot: string;
  htmlPath?: string;
}): Promise<{ jsonPath: string; markdownPath: string; report: ConsoleVisualCheckReport }> {
  const project = slugifyProject(input.project);
  if (!input.htmlPath) {
    await generateConsoleHtml({ project, vaultRoot: input.vaultRoot, refreshData: true });
  }
  const htmlPath = path.resolve(input.htmlPath ?? path.join(projectDir(input.vaultRoot, project), "console", "index.html"));
  const html = await fs.readFile(htmlPath, "utf8");
  const embeddedData = parseEmbeddedConsoleData(html);
  const checks: ConsoleVisualCheckReport["checks"] = [
    checkContains(html, "doctype", "HTML document shell", "<!doctype html>"),
    checkContains(html, "brand", "Ariadne brand lockup", "Ariadne Console"),
    checkContains(html, "gate-matrix", "Gate matrix section", "Gate Matrix"),
    checkContains(html, "timeline", "Timeline section", "Timeline"),
    checkContains(html, "approval-queue", "Approval queue section", "Approval Queue"),
    approvalPackMetricCheck(html, embeddedData),
    approvalPackDataCheck(html, embeddedData),
    checkContains(html, "approval-review-metric", "Approval review metric", "Packet Reviews"),
    checkContains(html, "approval-review-audit-metric", "Approval review audit metric", "Review Audit"),
    trendChartCheck(html, embeddedData),
    checkContains(html, "visual-check-panel", "Visual check panel", "Visual Checks"),
    checkContains(html, "embedded-data", "Embedded console data", 'id="console-data"'),
    embeddedDataCheck(embeddedData),
    absolutePathCheck(html)
  ];
  const summary = {
    passed: checks.filter((check) => check.status === "passed").length,
    failed: checks.filter((check) => check.status === "failed").length
  };
  const report: ConsoleVisualCheckReport = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    htmlPath: path.relative(input.vaultRoot, htmlPath),
    status: summary.failed === 0 ? "passed" : "failed",
    summary,
    checks
  };

  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "console", "visual-checks.json", report);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "console",
    "visual-checks.md",
    renderReport(report)
  );
  if (!input.htmlPath) {
    await generateConsoleHtml({ project, vaultRoot: input.vaultRoot, refreshData: true });
  }
  return { jsonPath, markdownPath, report };
}

function checkContains(
  html: string,
  id: string,
  label: string,
  needle: string
): ConsoleVisualCheckReport["checks"][number] {
  const present = html.includes(needle);
  return {
    id,
    label,
    status: present ? "passed" : "failed",
    detail: detailSentence(present ? "Found" : "Missing", needle)
  };
}

function detailSentence(action: "Found" | "Missing", value: string): string {
  return `${action} ${value.replace(/[.?!]+$/, "")}.`;
}

function parseEmbeddedConsoleData(html: string): ConsoleData | undefined {
  const match = html.match(/<script type="application\/json" id="console-data">\n([\s\S]*?)\n<\/script>/);
  if (!match?.[1]) return undefined;
  try {
    return JSON.parse(match[1].replace(/\\u003c/g, "<")) as ConsoleData;
  } catch {
    return undefined;
  }
}

function embeddedDataCheck(data: ConsoleData | undefined): ConsoleVisualCheckReport["checks"][number] {
  const valid = Boolean(data?.schemaVersion === 1 && data.project && data.summary && data.artifacts);
  return {
    id: "embedded-data-parse",
    label: "Embedded console data parses",
    status: valid ? "passed" : "failed",
    detail: valid ? `Project ${data?.project} summary is present.` : "Embedded console data is missing or malformed."
  };
}

function trendChartCheck(html: string, data: ConsoleData | undefined): ConsoleVisualCheckReport["checks"][number] {
  const hasTrendRuns = (data?.evaluationTrends?.runs.length ?? 0) > 0;
  const expected = hasTrendRuns ? 'data-visual-role="evaluation-trend-chart"' : "No evaluation trend data is available.";
  const present = html.includes(expected);
  return {
    id: "trend-chart",
    label: hasTrendRuns ? "Evaluation trend chart hook" : "Evaluation trend empty state",
    status: present ? "passed" : "failed",
    detail: detailSentence(present ? "Found" : "Missing", expected)
  };
}

function approvalPackMetricCheck(html: string, data: ConsoleData | undefined): ConsoleVisualCheckReport["checks"][number] {
  const expected = (data?.summary.liveAdapterApprovalPackets ?? 0) > 0 ? "Approval Packs" : "No approval-pack data required.";
  const present = expected === "No approval-pack data required." || html.includes(expected);
  return {
    id: "approval-pack-metric",
    label: "Approval pack metric",
    status: present ? "passed" : "failed",
    detail: detailSentence(present ? "Found" : "Missing", expected)
  };
}

function approvalPackDataCheck(html: string, data: ConsoleData | undefined): ConsoleVisualCheckReport["checks"][number] {
  const expected = data?.liveAdapterApprovalPack ? "approval packets" : "No live adapter approval pack required.";
  const present = expected === "No live adapter approval pack required." || html.includes(expected);
  return {
    id: "live-adapter-approval-pack",
    label: "Live adapter approval pack data",
    status: present ? "passed" : "failed",
    detail: detailSentence(present ? "Found" : "Missing", expected)
  };
}

function absolutePathCheck(html: string): ConsoleVisualCheckReport["checks"][number] {
  const unixAbsolutePaths = html.match(/\/(?:Users|home|tmp|var|opt|usr|etc)\/[^\s"<]+/g) ?? [];
  const windowsAbsolutePaths =
    html.match(/[A-Za-z]:\\(?:Users|Windows|Program Files|ProgramData|tmp|temp|home|var|opt|usr|etc)\\[^\s"<]+/gi) ??
    [];
  const leaks = [...unixAbsolutePaths, ...windowsAbsolutePaths];
  return {
    id: "absolute-path-leaks",
    label: "No local absolute path leaks",
    status: leaks.length === 0 ? "passed" : "failed",
    detail: leaks.length === 0 ? "No local absolute paths found." : `Found ${leaks.length} local absolute path(s).`
  };
}

function renderReport(report: ConsoleVisualCheckReport): string {
  return [
    "# Console Visual Checks",
    "",
    `Project: ${report.project}`,
    `Status: ${report.status}`,
    `Generated: ${report.generatedAt}`,
    `HTML: ${report.htmlPath}`,
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
