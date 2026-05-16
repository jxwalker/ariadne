import { writeTextArtifact } from "./artifacts.js";
import { collectConsoleData, generateConsoleData } from "./consoleData.js";
import { slugifyProject } from "./paths.js";
import type { ConsoleData } from "./types.js";

export async function generateConsoleHtml(input: {
  project: string;
  vaultRoot: string;
  refreshData?: boolean;
}): Promise<{ htmlPath: string; dataPath?: string; data: ConsoleData }> {
  const project = slugifyProject(input.project);
  const dataResult = input.refreshData ? await generateConsoleData(input) : undefined;
  const data = dataResult?.data ?? (await collectConsoleData(input.vaultRoot, project));
  const htmlPath = await writeTextArtifact(input.vaultRoot, project, "console", "index.html", renderConsole(data));
  return { htmlPath, dataPath: dataResult?.jsonPath, data };
}

function renderConsole(data: ConsoleData): string {
  const latestRun = data.executionRuns.at(-1);
  const latestEvaluation = data.evaluations.at(-1);
  const failedChecks = data.checks.filter((check) => check.status === "failed").length;
  const missingGates = data.readiness?.missing.length ?? 0;
  const timeline = [
    ...data.sources.map((source) => ({
      time: source.ingestedAt,
      label: `Source ingested: ${source.fileName}`,
      detail: `${source.kind} / ${source.sha256.slice(0, 12)}`
    })),
    ...data.executionRuns.map((run) => ({
      time: run.createdAt,
      label: `Execution run: ${run.id}`,
      detail: `${run.status} / ${run.taskIds.length} tasks`
    })),
    ...data.checks.map((check) => ({
      time: check.recordedAt,
      label: `Check ${check.status}: ${check.name}`,
      detail: check.command
    })),
    ...data.reviews.map((review) => ({
      time: review.recordedAt,
      label: `Review ${review.status}: ${review.source}`,
      detail: review.summary
    })),
    ...data.evaluations.map((run) => ({
      time: run.recordedAt,
      label: `Evaluation score: ${run.overallScore}`,
      detail: `${run.target} / ${run.operator}`
    })),
    ...data.coordination.sleepRoutines.map((record) => ({
      time: record.recordedAt,
      label: `Sleep routine: ${record.scope}`,
      detail: record.summary
    })),
    ...data.coordination.agentMail.map((record) => ({
      time: record.recordedAt,
      label: `Agent mail: ${record.subject}`,
      detail: `${record.from} to ${record.to}`
    })),
    ...data.deployment.snapshots.map((snapshot) => ({
      time: snapshot.importedAt,
      label: `Deployment snapshot: ${snapshot.system}`,
      detail: `${snapshot.mode} / ${snapshot.summary.host ?? "unknown host"}`
    }))
  ].sort((left, right) => right.time.localeCompare(left.time));

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(data.project)} Console</title>`,
    "<style>",
    css(),
    "</style>",
    "</head>",
    "<body>",
    '<main class="shell">',
    '<section class="hero">',
    '<div class="hero-copy">',
    '<div class="brand-lockup">',
    logoMark(),
    '<p class="eyebrow">Ariadne Console</p>',
    "</div>",
    `<h1>${escapeHtml(data.project)}</h1>`,
    '<p class="lead">Vault-backed orchestration view.</p>',
    `<p class="stamp">Last refreshed ${escapeHtml(data.generatedAt)}.</p>`,
    "</div>",
    '<div class="status-panel">',
    '<span class="label">Merge readiness</span>',
    `<strong class="status ${statusClass(data.summary.readinessStatus)}">${escapeHtml(data.summary.readinessStatus ?? "unknown")}</strong>`,
    `<span>${missingGates} missing gates</span>`,
    "</div>",
    "</section>",
    '<section class="metrics" aria-label="Project metrics">',
    metric("Sources", data.summary.sources),
    metric("Requirements", data.summary.requirements),
    metric("Tasks", data.summary.tasks),
    metric("Runs", data.summary.executionRuns),
    metric("Checks", data.summary.checks, failedChecks > 0 ? `${failedChecks} failed` : "recorded"),
    metric(
      "Evaluation",
      data.summary.latestEvaluationScore ?? latestEvaluation?.overallScore ?? "none",
      data.summary.evaluationTrendStatus ?? "latest"
    ),
    "</section>",
    '<section class="layout">',
    '<div class="main-column">',
    section("Gate Matrix", gateMatrix(data)),
    section("Evaluation Trends", evaluationTrendChart(data)),
    section("Task Flow", taskTable(data)),
    section("Approval Queue", approvalQueue(data)),
    section("Timeline", timelineList(timeline.slice(0, 12))),
    "</div>",
    '<aside class="side-column">',
    section("Evidence Chain", evidenceChain(data)),
    section("Visual Checks", visualChecks(data)),
    section("Memory And Mail", memoryAndMail(data)),
    section("Infrastructure", infrastructure(data)),
    section("Deployment", deployment(data)),
    section("GBrain", gbrain(data)),
    section("Artifacts", artifactList(data)),
    "</aside>",
    "</section>",
    '<script type="application/json" id="console-data">',
    escapeScriptJson(JSON.stringify(data)),
    "</script>",
    "</main>",
    "</body>",
    "</html>"
  ].join("\n");
}

function metric(label: string, value: string | number, note = "total"): string {
  return [
    '<div class="metric">',
    `<span>${escapeHtml(label)}</span>`,
    `<strong>${escapeHtml(String(value))}</strong>`,
    `<small>${escapeHtml(note)}</small>`,
    "</div>"
  ].join("");
}

function section(title: string, body: string): string {
  return `<section class="block"><h2>${escapeHtml(title)}</h2>${body}</section>`;
}

function gateMatrix(data: ConsoleData): string {
  const checks = new Map(data.checks.map((check) => [check.name, check.status]));
  const gates = [
    ["Source", data.summary.sources > 0 ? "passed" : "missing"],
    ["PRD", data.summary.requirements > 0 ? "passed" : "missing"],
    ["GSD", data.summary.tasks > 0 ? "passed" : "missing"],
    ["Execution", data.summary.executionRuns > 0 ? "passed" : "missing"],
    ["Typecheck", checks.get("typecheck") ?? "missing"],
    ["Unit tests", checks.get("unit-tests") ?? "missing"],
    ["Build", checks.get("build") ?? "missing"],
    ["Review", data.reviews.some((review) => review.status === "approved") ? "passed" : "missing"],
    ["Behavior", data.behaviorChecks?.status ?? "missing"],
    ["Readiness", data.summary.readinessStatus ?? "unknown"]
  ];

  return [
    '<div class="gate-grid">',
    ...gates.map(
      ([name, state]) =>
        `<div class="gate"><span>${escapeHtml(name)}</span><strong class="${statusClass(state)}">${escapeHtml(state)}</strong></div>`
    ),
    "</div>"
  ].join("");
}

function taskTable(data: ConsoleData): string {
  if (data.tasks.length === 0) return empty("No GSD tasks are available.");
  return [
    '<div class="table-wrap"><table><thead><tr><th>Task</th><th>Milestone</th><th>Slice</th><th>Writes</th></tr></thead><tbody>',
    ...data.tasks.map((task) =>
      [
        "<tr>",
        `<td><strong>${escapeHtml(task.id)}</strong><span>${escapeHtml(task.title)}</span></td>`,
        `<td>${escapeHtml(task.milestoneTitle)}</td>`,
        `<td>${escapeHtml(task.slice)}</td>`,
        `<td>${escapeHtml(task.writes.slice(0, 2).join(", "))}</td>`,
        "</tr>"
      ].join("")
    ),
    "</tbody></table></div>"
  ].join("");
}

function evaluationTrendChart(data: ConsoleData): string {
  const trends = data.evaluationTrends;
  if (!trends || trends.runs.length === 0) return empty("No evaluation trend data is available.");

  const points = trends.runs.map((run, index) => ({
    label: run.recordedAt,
    score: run.overallScore,
    x: trends.runs.length === 1 ? 50 : 8 + (index * 84) / (trends.runs.length - 1),
    y: 92 - Math.max(0, Math.min(100, run.overallScore)) * 0.82
  }));
  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const dimensions = trends.dimensions.slice(0, 5).map((dimension) => {
    const value = dimension.latestScore ?? 0;
    return `<div class="trend-row"><span>${escapeHtml(dimension.id)}</span><meter min="0" max="100" value="${escapeHtml(String(value))}"></meter><strong>${escapeHtml(String(value))}</strong></div>`;
  });

  return [
    '<div class="trend-card" data-visual-role="evaluation-trend-chart">',
    '<svg viewBox="0 0 100 100" role="img" aria-label="Evaluation score trend">',
    '<line x1="8" y1="92" x2="94" y2="92" class="axis"></line>',
    '<line x1="8" y1="10" x2="8" y2="92" class="axis"></line>',
    `<path d="${escapeHtml(pathData)}" class="trend-line"></path>`,
    ...points.map(
      (point) =>
        `<circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="2.7"><title>${escapeHtml(`${point.label}: ${point.score}`)}</title></circle>`
    ),
    "</svg>",
    '<div class="trend-meta">',
    `<strong>${escapeHtml(trends.status)}</strong>`,
    `<span>${escapeHtml(`${trends.runCount} runs / delta ${trends.delta ?? "none"}`)}</span>`,
    ...dimensions,
    "</div>",
    "</div>"
  ].join("");
}

function timelineList(items: Array<{ time: string; label: string; detail: string }>): string {
  if (items.length === 0) return empty("No timeline events are available.");
  return [
    '<ol class="timeline">',
    ...items.map(
      (item) =>
        `<li><time>${escapeHtml(item.time)}</time><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.detail)}</span></li>`
    ),
    "</ol>"
  ].join("");
}

function evidenceChain(data: ConsoleData): string {
  const rows = [
    ["Raw sources", data.summary.sources],
    ["Requirements", data.summary.requirements],
    ["Tasks", data.summary.tasks],
    ["Checks", data.summary.checks],
    ["Reviews", data.summary.reviews],
    ["Decisions", data.summary.decisions],
    ["GBrain reports", data.gbrain?.reports.length ?? 0]
  ];
  return `<div class="chain">${rows.map(([label, value]) => `<div><span>${escapeHtml(String(label))}</span><strong>${escapeHtml(String(value))}</strong></div>`).join("")}</div>`;
}

function visualChecks(data: ConsoleData): string {
  const checks = data.consoleVisualChecks;
  if (!checks) return empty("No console visual check report is available.");
  return [
    `<div class="visual-status"><strong class="${statusClass(checks.status)}">${escapeHtml(checks.status)}</strong><span>${escapeHtml(`${checks.summary.passed} passed / ${checks.summary.failed} failed`)}</span></div>`,
    '<ul class="compact-list">',
    ...checks.checks.map(
      (check) =>
        `<li><strong class="${statusClass(check.status)}">${escapeHtml(check.status)}</strong><span>${escapeHtml(check.label)}</span></li>`
    ),
    "</ul>"
  ].join("");
}

function approvalQueue(data: ConsoleData): string {
  const missing = data.readiness?.missing ?? [];
  const pendingReviews = data.reviews.filter((review) => review.status === "pending" || review.status === "changes_requested");
  const rows = [
    ...missing.map((item) => ({ kind: "missing gate", detail: item })),
    ...pendingReviews.map((review) => ({ kind: review.status, detail: `${review.source}: ${review.summary}` }))
  ];
  if (rows.length === 0) return empty("No approval queue items are available.");
  return [
    '<div class="table-wrap"><table><thead><tr><th>Kind</th><th>Detail</th></tr></thead><tbody>',
    ...rows.map((row) => `<tr><td>${escapeHtml(row.kind)}</td><td>${escapeHtml(row.detail)}</td></tr>`),
    "</tbody></table></div>"
  ].join("");
}

function memoryAndMail(data: ConsoleData): string {
  const rows = [
    ["Sleep routines", data.summary.sleepRoutines],
    ["Memory proposals", data.summary.memoryProposals],
    ["Agent mail", data.summary.agentMail],
    ["Agent leases", data.summary.agentLeases]
  ];
  return `<div class="chain">${rows.map(([label, value]) => `<div><span>${escapeHtml(String(label))}</span><strong>${escapeHtml(String(value))}</strong></div>`).join("")}</div>`;
}

function infrastructure(data: ConsoleData): string {
  const registry = data.infrastructure.registry;
  if (!registry) return empty("No infrastructure registry is available.");
  return [
    '<div class="infra">',
    ...registry.hosts.map(
      (host) =>
        `<div><strong>${escapeHtml(host.label)}</strong><span>${escapeHtml(host.role)}</span><small>${escapeHtml(host.notes)}</small></div>`
    ),
    "</div>"
  ].join("");
}

function deployment(data: ConsoleData): string {
  if (data.deployment.snapshots.length === 0) return empty("No deployment snapshots are available.");
  return [
    '<div class="infra">',
    ...data.deployment.snapshots.slice(-6).map(
      (snapshot) =>
        `<div><strong>${escapeHtml(snapshot.system)}</strong><span>${escapeHtml(snapshot.summary.host ?? "unknown host")}</span><small>${escapeHtml(`${snapshot.summary.services} services / ${snapshot.summary.modelEndpoints} model endpoints / ${snapshot.summary.runnerPools} runner pools`)}</small></div>`
    ),
    "</div>"
  ].join("");
}

function gbrain(data: ConsoleData): string {
  const exportBundle = data.gbrain?.exportBundle;
  const reportCount = data.gbrain?.reports.length ?? 0;
  if (!exportBundle && reportCount === 0) return empty("No GBrain export or report imports are available.");
  return `<div class="chain"><div><span>Export documents</span><strong>${escapeHtml(String(exportBundle?.documents.length ?? 0))}</strong></div><div><span>Imported reports</span><strong>${escapeHtml(String(reportCount))}</strong></div></div>`;
}

function artifactList(data: ConsoleData): string {
  const artifacts = Object.entries(data.artifacts).filter(([, value]) => Boolean(value));
  if (artifacts.length === 0) return empty("No artifact paths are available.");
  return [
    '<dl class="artifacts">',
    ...artifacts.map(([name, value]) => `<div><dt>${escapeHtml(name)}</dt><dd>${escapeHtml(String(value))}</dd></div>`),
    "</dl>"
  ].join("");
}

function empty(message: string): string {
  return `<p class="empty">${escapeHtml(message)}</p>`;
}

function logoMark(): string {
  return '<img class="logo-mark" src="../../../../assets/ariadne-logo-square.png" alt="" aria-hidden="true">';
}

function statusClass(value: string | undefined): string {
  if (value === "passed" || value === "ready" || value === "approved" || value === "complete") return "ok";
  if (value === "failed" || value === "blocked" || value === "changes_requested") return "bad";
  if (value === "review_required" || value === "pending" || value === "skipped" || value === "warning") return "warn";
  return "muted";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeScriptJson(value: string): string {
  return value.replace(/</g, "\\u003c");
}

function css(): string {
  return `
:root {
  color-scheme: light;
  --bg: #f7f8f8;
  --ink: #1e2324;
  --muted: #697170;
  --line: #d8ddda;
  --panel: #ffffff;
  --accent: #2f6f5e;
  --warn: #8a641f;
  --bad: #9d3e35;
  --mono: "SFMono-Regular", "JetBrains Mono", ui-monospace, monospace;
  --sans: "Geist", "Aptos", "Helvetica Neue", Arial, sans-serif;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--sans);
  letter-spacing: 0;
}
.shell {
  width: min(1440px, calc(100vw - 40px));
  margin: 0 auto;
  padding: 32px 0 56px;
}
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(260px, 0.7fr);
  gap: 28px;
  align-items: end;
  min-height: 220px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 28px;
}
.hero-copy {
  min-width: 0;
  overflow-wrap: anywhere;
}
.brand-lockup {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}
.logo-mark {
  width: 44px;
  height: 44px;
  border-radius: 9px;
  flex: 0 0 auto;
  object-fit: cover;
  object-position: center;
}
.eyebrow, .label {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}
h1 {
  margin: 0;
  font-size: clamp(38px, 6vw, 82px);
  line-height: .92;
  letter-spacing: 0;
}
.lead {
  max-width: 760px;
  margin: 18px 0 0;
  color: var(--muted);
  font-size: 17px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}
.stamp {
  margin: 6px 0 0;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.status-panel {
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 18px;
  min-height: 142px;
  min-width: 0;
  display: grid;
  align-content: space-between;
}
.status-panel strong {
  font-family: var(--mono);
  font-size: 22px;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  border-bottom: 1px solid var(--line);
}
.metric {
  min-height: 116px;
  padding: 18px 16px;
  border-right: 1px solid var(--line);
  display: grid;
  align-content: space-between;
}
.metric:last-child { border-right: 0; }
.metric span, .metric small {
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.metric strong {
  font-family: var(--mono);
  font-size: clamp(28px, 3vw, 44px);
  line-height: 1;
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, .8fr);
  gap: 34px;
  padding-top: 34px;
}
.block {
  border-top: 1px solid var(--line);
  padding: 20px 0 30px;
}
.block h2 {
  margin: 0 0 18px;
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.gate-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid var(--line);
  background: var(--panel);
}
.gate {
  min-height: 86px;
  padding: 14px;
  border-right: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  display: grid;
  align-content: space-between;
}
.gate:nth-child(3n) { border-right: 0; }
.gate span, td span, .timeline span, .infra span, .infra small {
  display: block;
  color: var(--muted);
}
.gate strong, .status {
  font-family: var(--mono);
  font-size: 13px;
}
.ok { color: var(--accent); }
.warn { color: var(--warn); }
.bad { color: var(--bad); }
.muted { color: var(--muted); }
.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--line);
  background: var(--panel);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th, td {
  padding: 13px 14px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: top;
}
th {
  color: var(--muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .08em;
}
td:first-child strong {
  font-family: var(--mono);
  margin-bottom: 4px;
  display: block;
}
.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--line);
}
.timeline li {
  display: grid;
  grid-template-columns: minmax(180px, .35fr) minmax(0, 1fr);
  gap: 18px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
}
time, .artifacts dt, .chain strong {
  font-family: var(--mono);
}
time {
  color: var(--muted);
  font-size: 12px;
}
.chain, .infra, .artifacts {
  display: grid;
  gap: 10px;
}
.chain div, .infra div, .artifacts div, .trend-card {
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 13px;
}
.chain div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
.infra strong { display: block; margin-bottom: 4px; }
.infra small { margin-top: 6px; line-height: 1.35; }
.artifacts {
  margin: 0;
}
.artifacts dt {
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 12px;
}
.artifacts dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.empty {
  margin: 0;
  border: 1px dashed var(--line);
  padding: 18px;
  color: var(--muted);
}
.trend-card {
  display: grid;
  grid-template-columns: minmax(220px, .9fr) minmax(220px, 1fr);
  gap: 18px;
  align-items: center;
}
.trend-card svg {
  width: 100%;
  min-height: 220px;
}
.trend-line {
  fill: none;
  stroke: var(--accent);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.axis {
  stroke: var(--line);
  stroke-width: 1;
}
circle {
  fill: var(--panel);
  stroke: var(--accent);
  stroke-width: 2;
}
.trend-meta {
  display: grid;
  gap: 10px;
}
.trend-meta strong {
  font-family: var(--mono);
  font-size: 18px;
}
.trend-row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 42px;
  gap: 10px;
  align-items: center;
}
meter {
  width: 100%;
}
.visual-status {
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 13px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.compact-list {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.compact-list li {
  border-bottom: 1px solid var(--line);
  padding-bottom: 8px;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}
@media (max-width: 980px) {
  .shell { width: min(calc(100vw - 28px), 760px); }
  .hero, .layout { grid-template-columns: 1fr; }
  .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .metric:nth-child(2n) { border-right: 0; }
  .gate-grid { grid-template-columns: 1fr; }
  .gate, .gate:nth-child(3n) { border-right: 0; }
  .timeline li { grid-template-columns: 1fr; gap: 6px; }
  .trend-card { grid-template-columns: 1fr; }
}
`;
}
