import { writeTextArtifact } from "./artifacts.js";
import { collectConsoleData, generateConsoleData } from "./consoleData.js";
import { operatorEvidenceTargetMissingSections } from "./liveAdapterOperatorEvidence.js";
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
    ...data.benchmarkRuns.map((run) => ({
      time: run.generatedAt,
      label: `Benchmark ${run.status}: ${run.set}`,
      detail: `${run.summary.passed} passed / ${run.summary.failed} failed`
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
    ...data.coordination.hermesCronSnapshots.map((snapshot) => ({
      time: snapshot.importedAt,
      label: `Hermes cron snapshot${snapshot.host ? `: ${snapshot.host}` : ""}`,
      detail: `${snapshot.summary.jobs} jobs / ${snapshot.summary.enabled} enabled`
    })),
    ...data.deployment.snapshots.map((snapshot) => ({
      time: snapshot.importedAt,
      label: `Deployment snapshot: ${snapshot.system}`,
      detail: `${snapshot.mode} / ${snapshot.summary.host ?? "unknown host"}`
    })),
    ...data.github.snapshots.map((snapshot) => ({
      time: snapshot.importedAt,
      label: `GitHub snapshot: ${snapshot.repository ?? "unknown repository"}`,
      detail: `${snapshot.summary.pullRequests} PRs / ${snapshot.summary.pendingChecks} pending checks`
    })),
    ...(data.mutationReadinessAudit
      ? [
          {
            time: data.mutationReadinessAudit.generatedAt,
            label: `Mutation audit: ${data.mutationReadinessAudit.status}`,
            detail: `${data.mutationReadinessAudit.summary.ready} ready / ${data.mutationReadinessAudit.summary.blocked} blocked`
          }
        ]
      : []),
    ...(data.mutationReadinessRepairPlan
      ? [
          {
            time: data.mutationReadinessRepairPlan.generatedAt,
            label: `Mutation repair: ${data.mutationReadinessRepairPlan.status}`,
            detail: `${data.mutationReadinessRepairPlan.summary.missingPlans} missing / ${data.mutationReadinessRepairPlan.summary.repairablePlans} repairable / ${data.mutationReadinessRepairPlan.summary.operatorActionRequired} operator action / ${data.mutationReadinessRepairPlan.summary.blocked} blocked`
          }
        ]
      : []),
    ...(data.liveAdapterReadiness
      ? [
          {
            time: data.liveAdapterReadiness.generatedAt,
            label: `Live adapters: ${data.liveAdapterReadiness.status}`,
            detail: `${data.liveAdapterReadiness.summary.ready} ready / ${data.liveAdapterReadiness.summary.blocked} blocked`
          }
        ]
      : []),
    ...(data.liveAdapterNextActions
      ? [
          {
            time: data.liveAdapterNextActions.generatedAt,
            label: `Live adapter actions: ${data.liveAdapterNextActions.status}`,
            detail: `${data.liveAdapterNextActions.summary.actionItems} action items`
          }
        ]
      : []),
    ...(data.liveAdapterApprovalPack
      ? [
          {
            time: data.liveAdapterApprovalPack.generatedAt,
            label: `Live adapter approval pack: ${data.liveAdapterApprovalPack.status}`,
            detail: `${data.liveAdapterApprovalPack.summary.packets} operator packets`
          }
        ]
      : []),
    ...(data.liveAdapterCutoverAudit
      ? [
          {
            time: data.liveAdapterCutoverAudit.generatedAt,
            label: `Live adapter cutover: ${data.liveAdapterCutoverAudit.status}`,
            detail: `${data.liveAdapterCutoverAudit.summary.ready} ready / ${data.liveAdapterCutoverAudit.summary.blocked} blocked`
          }
        ]
      : []),
    ...(data.liveAdapterReviewSession
      ? [
          {
            time: data.liveAdapterReviewSession.generatedAt,
            label: `Live adapter review session: ${data.liveAdapterReviewSession.status}`,
            detail: `${data.liveAdapterReviewSession.summary.operatorReviewRequired} review-required / ${data.liveAdapterReviewSession.summary.readyForAdapterWork} adapter-ready`
          }
        ]
      : []),
    ...(data.liveAdapterEvidenceTemplatePack
      ? [
          {
            time: data.liveAdapterEvidenceTemplatePack.generatedAt,
            label: `Live adapter evidence templates: ${data.liveAdapterEvidenceTemplatePack.status}`,
            detail: `${data.liveAdapterEvidenceTemplatePack.summary.templates} templates / ${data.liveAdapterEvidenceTemplatePack.summary.evidenceItems} evidence items`
          }
        ]
      : []),
    ...(data.liveAdapterOperatorEvidenceWorkplan
      ? [
          {
            time: data.liveAdapterOperatorEvidenceWorkplan.generatedAt,
            label: `Operator evidence workplan: ${data.liveAdapterOperatorEvidenceWorkplan.status}`,
            detail: `${data.liveAdapterOperatorEvidenceWorkplan.summary.checkCommands ?? 0} check commands / ${data.liveAdapterOperatorEvidenceWorkplan.summary.importCommands} import commands`
          }
        ]
      : []),
    ...(data.liveAdapterOperatorEvidenceAssist
      ? [
          {
            time: data.liveAdapterOperatorEvidenceAssist.generatedAt,
            label: `Operator evidence assist: ${data.liveAdapterOperatorEvidenceAssist.status}`,
            detail: `${data.liveAdapterOperatorEvidenceAssist.summary.assistFiles} assist files / ${data.liveAdapterOperatorEvidenceAssist.summary.existingEvidenceRefs} existing refs`
          }
        ]
      : []),
    ...(data.liveAdapterOperatorEvidenceAudit
      ? [
          {
            time: data.liveAdapterOperatorEvidenceAudit.generatedAt,
            label: `Live adapter operator evidence: ${data.liveAdapterOperatorEvidenceAudit.status}`,
            detail: `${data.liveAdapterOperatorEvidenceAudit.summary.completeTargets} complete / ${data.liveAdapterOperatorEvidenceAudit.summary.missingTargets} missing`
          }
        ]
      : []),
    ...(data.roadmapCompletionAudit
      ? [
          {
            time: data.roadmapCompletionAudit.generatedAt,
            label: `Roadmap completion: ${data.roadmapCompletionAudit.status}`,
            detail: `${data.roadmapCompletionAudit.summary.passed} passed / ${data.roadmapCompletionAudit.summary.blocked} blocked`
          }
        ]
      : [])
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
    workflowOverview(data.workflow),
    '<section class="metrics" aria-label="Project metrics">',
    metric("Sources", data.summary.sources),
    metric("Extractions", data.summary.extractionResults, "results"),
    metric("Requirements", data.summary.requirements),
    metric("Tasks", data.summary.tasks),
    metric("GSD2", data.summary.gsd2ProcessSnapshots, "process"),
    metric("Runs", data.summary.executionRuns),
    metric("Checks", data.summary.checks, failedChecks > 0 ? `${failedChecks} failed` : "recorded"),
    metric("Healer", data.summary.healerProposals, "proposals"),
    metric("GitHub", data.summary.githubSnapshots, "snapshots"),
    metric("Approvals", data.summary.pendingApprovals, `${data.summary.approvals} total`),
    metric("Mutation", data.summary.mutationReadinessPlans, "readiness"),
    metric("Dry Runs", data.summary.mutationDryRuns, "mutation"),
    metric("Exec", data.summary.mutationExecutions, "mutation"),
    metric("Audit", data.summary.mutationReadinessAuditStatus ?? "none", "mutation"),
    metric(
      "Repair Plan",
      data.summary.mutationReadinessRepairStatus ?? "none",
      `${data.summary.mutationReadinessRepairMissingPlans ?? 0} missing, ${data.summary.mutationReadinessRepairRepairablePlans ?? 0} repair, ${data.summary.mutationReadinessRepairOperatorActionRequired ?? 0} op, ${data.summary.mutationReadinessRepairBlocked ?? 0} blocked`
    ),
    metric("Live Adapters", data.summary.liveAdapterBlocked ?? "none", `${data.summary.liveAdapterReady ?? 0} ready`),
    metric("Adapter Actions", data.summary.liveAdapterActionItems ?? "none", "operator"),
    metric("Approval Packs", data.summary.liveAdapterApprovalPackets ?? "none", "operator"),
    metric("Packet Reviews", data.summary.acceptedLiveAdapterApprovalReviews ?? "none", `${data.summary.liveAdapterApprovalReviews ?? 0} total`),
    metric("Review Audit", data.summary.liveAdapterApprovalReviewAuditStatus ?? "none", `${data.summary.currentLiveAdapterApprovalReviews ?? 0} current`),
    metric("Dossiers", data.summary.liveAdapterTargetDossiers ?? "none", "adapter"),
    metric("Cutover", data.summary.liveAdapterCutoverAuditStatus ?? "none", `${data.summary.liveAdapterCutoverReady ?? 0} ready`),
    metric("Review Session", data.summary.liveAdapterReviewSessionStatus ?? "none", `${data.summary.liveAdapterReviewSessionRequired ?? 0} required`),
    metric("Evidence Templates", data.summary.liveAdapterEvidenceTemplates ?? "none", data.summary.liveAdapterEvidenceTemplateStatus ?? "operator"),
    metric("Evidence Workplan", data.summary.liveAdapterOperatorEvidenceWorkplanStatus ?? "none", `${data.summary.liveAdapterOperatorEvidenceWorkplanTargets ?? 0} targets`),
    metric("Evidence Queue", data.summary.liveAdapterOperatorEvidenceQueueStatus ?? "none", `${data.summary.liveAdapterOperatorEvidenceQueueReady ?? 0} ready`),
    metric("Evidence Assist", data.summary.liveAdapterOperatorEvidenceAssistStatus ?? "none", `${data.summary.liveAdapterOperatorEvidenceAssistRefs ?? 0} refs`),
    metric("Evidence Checks", data.summary.liveAdapterOperatorEvidenceChecks ?? "none", "preflight"),
    metric("Operator Evidence", data.summary.liveAdapterOperatorEvidenceStatus ?? "none", `${data.summary.liveAdapterOperatorEvidenceComplete ?? 0} complete`),
    metric("Roadmap Audit", data.summary.roadmapCompletionStatus ?? "none", `${data.summary.roadmapCompletionBlocked ?? 0} blocked`),
    metric("Hermes", data.summary.hermesCronSnapshots, `${data.summary.hermesCronProposals} proposals`),
    metric("Recovery", data.summary.recoveryIssues, "issues"),
    metric("Browser", data.summary.consoleBrowserChecks ?? "none", "console"),
    metric(
      "Evaluation",
      data.summary.latestEvaluationScore ?? latestEvaluation?.overallScore ?? "none",
      data.summary.evaluationTrendStatus ?? "latest"
    ),
    metric("Benchmarks", data.summary.benchmarkRuns, "runs"),
    metric("Runtime", data.summary.localRuntimeProbes, `${data.summary.localRuntimeModels ?? 0} models`),
    "</section>",
    '<section class="layout">',
    '<div class="main-column">',
    section("Gate Matrix", gateMatrix(data)),
    section("Evaluation Trends", evaluationTrendChart(data)),
    section("Benchmark Runs", benchmarkRuns(data)),
    section("Task Flow", taskTable(data)),
    section("Approval Queue", approvalQueue(data)),
    section("Mutation Audit", mutationReadinessAudit(data)),
    section("Mutation Repair", mutationReadinessRepairPlan(data)),
    section("Live Adapters", liveAdapters(data)),
    section("Review Session", reviewSession(data)),
    section("Evidence Templates", evidenceTemplates(data)),
    section("Evidence Workplan", operatorEvidenceWorkplan(data)),
    section("Evidence Queue", operatorEvidenceQueue(data)),
    section("Evidence Assist", operatorEvidenceAssist(data)),
    section("Operator Evidence", operatorEvidence(data)),
    section("Roadmap Audit", roadmapCompletion(data)),
    section("Timeline", timelineList(timeline.slice(0, 12))),
    "</div>",
    '<aside class="side-column">',
    section("Evidence Chain", evidenceChain(data)),
    section("Extraction Results", extractionResults(data)),
    section("Healer Proposals", healerProposals(data)),
    section("Visual Checks", visualChecks(data)),
    section("Browser Checks", browserChecks(data)),
    section("Recovery", recovery(data)),
    section("Memory And Mail", memoryAndMail(data)),
    section("Infrastructure", infrastructure(data)),
    section("Deployment", deployment(data)),
    section("GitHub", github(data)),
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

function workflowOverview(workflow: ConsoleData["workflow"]): string {
  return [
    '<section class="workflow" aria-label="Ariadne workflow">',
    '<div class="workflow-lanes">',
    ...workflow.stages.map(
      (stage) =>
        `<article class="workflow-stage"><div><span>${escapeHtml(stage.label)}</span><strong class="${statusClass(stage.status)}">${escapeHtml(stage.status)}</strong></div><p>${escapeHtml(stage.detail)}</p><small>${escapeHtml(stage.proofRef)}</small></article>`
    ),
    "</div>",
    '<div class="next-action" data-visual-role="next-best-action">',
    '<span class="label">Next best action</span>',
    `<strong class="${statusClass(workflow.nextAction.status)}">${escapeHtml(workflow.nextAction.title)}</strong>`,
    `<p>${escapeHtml(workflow.nextAction.detail)}</p>`,
    `<small>${escapeHtml(workflow.nextAction.artifactRef)}</small>`,
    ...(workflow.nextAction.command ? [commandDisclosure("Primary runner command", workflow.nextAction.command)] : []),
    actionSteps(workflow.nextAction.steps),
    "</div>",
    operatorChecklist(workflow.operatorChecklist),
    workflowRoutes(workflow.routes),
    '<div class="workflow-modes" data-visual-role="operator-modes">',
    '<div class="workflow-subhead"><span class="label">Operator modes</span><p>Choose the surface by user intent; Hermes is the runtime backplane, not the only front door.</p></div>',
    ...workflow.modes.map(
      (mode) =>
        `<article class="mode-tile"><div><strong>${escapeHtml(mode.label)}</strong><span>${escapeHtml(mode.commandPolicy)}</span></div><p>${escapeHtml(mode.audience)}</p><small>${escapeHtml(mode.interaction)}</small><em>${escapeHtml(mode.nextStep)}</em></article>`
    ),
    "</div>",
    '<div class="workflow-surfaces" data-visual-role="workflow-surfaces">',
    '<div class="workflow-subhead"><span class="label">Surface split</span><p>Every surface has a bounded role and explicit mutation authority.</p></div>',
    ...workflow.surfaces.map(
      (surface) =>
        `<div class="surface-row"><strong>${escapeHtml(surface.label)}</strong><span>${escapeHtml(surface.mutationAuthority)}</span><p>${escapeHtml(surface.role)}</p></div>`
    ),
    "</div>",
    "</section>"
  ].join("");
}

function workflowRoutes(routes: ConsoleData["workflow"]["routes"] | undefined): string {
  if (!routes || routes.length === 0) return "";
  return [
    '<div class="workflow-routes" data-visual-role="workflow-routes">',
    '<div class="workflow-subhead"><span class="label">Interaction routes</span><p>Choose one route by intent; Hermes coordinates background work, while the Console remains the human cockpit.</p></div>',
    ...routes.map(
      (route) =>
        `<article class="route-card${route.current ? " route-current" : ""}"><div><strong>${escapeHtml(route.label)}</strong><span>${route.current ? "current" : escapeHtml(route.primarySurface)}</span></div><p>${escapeHtml(route.summary)}</p><small>${escapeHtml(route.audience)}</small><ol>${route.steps
          .map(
            (step) =>
              `<li><span>${escapeHtml(step.stage)}</span><strong>${escapeHtml(step.title)}</strong><p>${escapeHtml(step.detail)}</p>${step.artifactRef ? `<small>${escapeHtml(step.artifactRef)}</small>` : ""}${step.command ? commandDisclosure("Runner command", step.command) : ""}</li>`
          )
          .join("")}</ol></article>`
    ),
    "</div>"
  ].join("");
}

function actionSteps(steps: ConsoleData["workflow"]["nextAction"]["steps"] | undefined): string {
  if (!steps || steps.length === 0) return "";
  return [
    '<ol class="action-steps" data-visual-role="next-action-steps">',
    ...steps.map(
      (step) =>
        `<li><div><span>${escapeHtml(step.kind)}</span><strong>${escapeHtml(step.title)}</strong></div><p>${escapeHtml(step.detail)}</p>${step.artifactRef ? `<small>${escapeHtml(step.artifactRef)}</small>` : ""}${step.command ? commandDisclosure("Runner command", step.command) : ""}</li>`
    ),
    "</ol>"
  ].join("");
}

function operatorChecklist(checklist: ConsoleData["workflow"]["operatorChecklist"] | undefined): string {
  if (!checklist) return "";
  return [
    '<div class="operator-checklist" data-visual-role="operator-evidence-checklist">',
    '<div class="workflow-subhead"><span class="label">Evidence checklist</span><p>Work one missing section at a time; GBrain is context, not proof.</p></div>',
    `<div class="checklist-summary"><strong>${escapeHtml(checklist.target)}</strong><span class="checklist-status ${statusClass(checklist.status)}">${escapeHtml(checklist.status)}</span><small>${checklist.missingSections} missing section(s)</small></div>`,
    `<div class="checklist-progress" data-visual-role="operator-evidence-progress"><strong>Start here: ${escapeHtml(checklist.fillProgress.currentSection)}</strong><span>${checklist.fillProgress.readyForHumanFill}/${checklist.missingSections} ready for human fill</span><span>${checklist.fillProgress.contextBacked} context-backed</span><span>${checklist.fillProgress.promotedLiveEvidenceBacked} live-evidence-backed</span><span>${checklist.fillProgress.gbrainBacked} GBrain-backed</span></div>`,
    '<ol class="checklist-sections">',
    ...checklist.sections.map(
      (section) =>
        `<li class="${section.current ? "checklist-current" : ""}"><div><strong>${escapeHtml(section.missingSection)}</strong><span class="${statusClass(section.status)}">${escapeHtml(`${section.status}${section.current ? " (current)" : ""}`)}</span></div><p>${escapeHtml(section.prompt)}</p><dl><dt>Start with</dt><dd>${escapeHtml(section.startWith)}</dd><dt>Record in</dt><dd>${escapeHtml(section.recordIn)}</dd><dt>Preflight</dt><dd>${escapeHtml(section.preflight)}</dd></dl><small>${section.existingEvidenceRefs.length} existing ref(s), ${section.promotedLiveEvidenceRefs.length} promoted live ref(s), ${section.gbrainQueries.length} GBrain quer${section.gbrainQueries.length === 1 ? "y" : "ies"}</small></li>`
    ),
    "</ol>",
    `<small>Evidence: ${escapeHtml(checklist.evidenceFileRef)}</small>`,
    `<small>Assist: ${escapeHtml(checklist.assistFileRef)}</small>`,
    commandDisclosure("Preflight command", checklist.checkCommand),
    commandDisclosure("Import command after human verification", checklist.importCommand),
    "</div>"
  ].join("");
}

function commandDisclosure(label: string, command: string): string {
  return `<details class="command-disclosure"><summary>${escapeHtml(label)}</summary><code>${escapeHtml(command)}</code></details>`;
}

function metric(label: string, value: string | number, note = "total"): string {
  const isLongText = typeof value === "string" && (value.length > 6 || value.includes("_"));
  return [
    `<div class="metric${isLongText ? " metric-text" : ""}">`,
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

function benchmarkRuns(data: ConsoleData): string {
  if (data.benchmarkRuns.length === 0) return empty("No benchmark run reports are available.");
  return [
    '<div class="table-wrap"><table><thead><tr><th>Set</th><th>Status</th><th>Projects</th><th>Steps</th><th>Missing Required</th></tr></thead><tbody>',
    ...data.benchmarkRuns.slice(-6).map(
      (run) =>
        `<tr><td>${escapeHtml(run.set)}</td><td class="${statusClass(run.status)}">${escapeHtml(run.status)}</td><td>${escapeHtml(run.targetProjects.join(", "))}</td><td>${escapeHtml(`${run.summary.passed}/${run.summary.steps}`)}</td><td>${escapeHtml(String(run.summary.missingRequiredArtifacts))}</td></tr>`
    ),
    "</tbody></table></div>"
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
    ["Extraction results", data.summary.extractionResults],
    ["Requirements", data.summary.requirements],
    ["Tasks", data.summary.tasks],
    ["GSD2 process", data.summary.gsd2ProcessSnapshots],
    ["Checks", data.summary.checks],
    ["Reviews", data.summary.reviews],
    ["Decisions", data.summary.decisions],
    ["Healer proposals", data.summary.healerProposals],
    ["GitHub snapshots", data.summary.githubSnapshots],
    ["Pending approvals", data.summary.pendingApprovals],
    ["Recovery issues", data.summary.recoveryIssues],
    ["Browser checks", data.summary.consoleBrowserChecks ?? "none"],
    ["Hermes cron", data.summary.hermesCronSnapshots],
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

function extractionResults(data: ConsoleData): string {
  if (data.extractionResults.length === 0) return empty("No OCR, transcription, or PDF extraction results are available.");
  return [
    '<div class="infra">',
    ...data.extractionResults.slice(-5).map(
      (result) =>
        `<div><strong>${escapeHtml(result.extractionKind)}</strong><span>${escapeHtml(result.tool)}</span><small>${escapeHtml(`${result.sourceRecordId} -> ${result.extractedTextPath}`)}</small></div>`
    ),
    "</div>"
  ].join("");
}

function healerProposals(data: ConsoleData): string {
  if (data.healerProposals.length === 0) return empty("No review-gated healer proposals are available.");
  return [
    '<div class="infra">',
    ...data.healerProposals.slice(-5).map(
      (proposal) =>
        `<div><strong>${escapeHtml(proposal.status)}</strong><span>${escapeHtml(proposal.evidenceRecordId)}</span><small>${escapeHtml(`${proposal.proposedActions.length} actions / apply=${proposal.apply}`)}</small></div>`
    ),
    "</div>"
  ].join("");
}

function browserChecks(data: ConsoleData): string {
  const checks = data.consoleBrowserChecks;
  if (!checks) return empty("No browser-backed console check report is available.");
  return [
    `<div class="visual-status"><strong class="${statusClass(checks.status)}">${escapeHtml(checks.status)}</strong><span>${escapeHtml(`${checks.summary.passed} passed / ${checks.summary.failed} failed`)}</span></div>`,
    `<p class="metadata">${escapeHtml(`Screenshot: ${checks.screenshotPath}`)}</p>`,
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
  const pendingApprovals = data.approvals.filter((approval) => approval.status === "requested");
  const blockedMutation = data.mutationReadinessPlans.filter((plan) => plan.status !== "ready_for_bounded_review");
  const auditBlockers =
    data.mutationReadinessAudit?.checks.flatMap((check) =>
      check.blockers.map((blocker) => ({
        kind: `audit ${check.target}`,
        detail: `${check.planId}: ${blocker}`
      }))
    ) ?? [];
  const repairPlanActions =
    data.mutationReadinessRepairPlan?.targets
      .filter((target) => target.status !== "audit_passed")
      .map((target) => ({
        kind: `mutation repair ${target.status}`,
        detail: `${target.target}: ${target.remainingBlockers[0] ?? target.operatorBlockers[0] ?? target.repairableBlockers[0] ?? target.regenerationCommand}`
      })) ?? [];
  const cutoverBlockers =
    data.liveAdapterCutoverAudit?.targets.flatMap((target) =>
      target.blockers.map((blocker) => ({
        kind: `cutover ${target.target}`,
        detail: blocker
      }))
    ) ?? [];
  const operatorEvidenceBlockers =
    data.liveAdapterOperatorEvidenceAudit?.targets.flatMap((target) =>
      target.blockers.map((blocker) => ({
        kind: `operator evidence ${target.target}`,
        detail: blocker
      }))
    ) ?? [];
  const healerReviews = data.healerProposals.filter((proposal) => proposal.status === "review_required");
  const rows = [
    ...missing.map((item) => ({ kind: "missing gate", detail: item })),
    ...pendingReviews.map((review) => ({ kind: review.status, detail: `${review.source}: ${review.summary}` })),
    ...healerReviews.map((proposal) => ({
      kind: "healer review",
      detail: `${proposal.evidenceRecordId}: ${proposal.proposedActions.length} proposed actions`
    })),
    ...pendingApprovals.map((approval) => ({
      kind: `approval ${approval.risk}`,
      detail: `${approval.target}: ${approval.action}`
    })),
    ...blockedMutation.map((plan) => ({
      kind: `mutation ${plan.status}`,
      detail: `${plan.target}: ${plan.scope}`
    })),
    ...auditBlockers,
    ...repairPlanActions,
    ...cutoverBlockers,
    ...operatorEvidenceBlockers
  ];
  if (rows.length === 0) return empty("No approval queue items are available.");
  return [
    '<div class="table-wrap"><table><thead><tr><th>Kind</th><th>Detail</th></tr></thead><tbody>',
    ...rows.map((row) => `<tr><td>${escapeHtml(row.kind)}</td><td>${escapeHtml(row.detail)}</td></tr>`),
    "</tbody></table></div>"
  ].join("");
}

function mutationReadinessAudit(data: ConsoleData): string {
  const audit = data.mutationReadinessAudit;
  if (!audit) return empty("No mutation-readiness audit is available.");
  return [
    `<div class="visual-status"><strong class="${statusClass(audit.status)}">${escapeHtml(audit.status)}</strong><span>${escapeHtml(`${audit.summary.ready} ready / ${audit.summary.blocked} blocked`)}</span></div>`,
    '<div class="table-wrap"><table><thead><tr><th>Plan</th><th>Target</th><th>Status</th><th>Blockers</th></tr></thead><tbody>',
    ...audit.checks.map(
      (check) =>
        `<tr><td>${escapeHtml(check.planId)}</td><td>${escapeHtml(check.target)}</td><td>${escapeHtml(check.status)}</td><td>${escapeHtml(check.blockers.length === 0 ? "none" : check.blockers.join("; "))}</td></tr>`
    ),
    "</tbody></table></div>"
  ].join("");
}

function mutationReadinessRepairPlan(data: ConsoleData): string {
  const repairPlan = data.mutationReadinessRepairPlan;
  if (!repairPlan) return empty("No mutation-readiness repair plan is available.");
  return [
    `<div class="visual-status"><strong class="${statusClass(repairPlan.status)}">${escapeHtml(repairPlan.status)}</strong><span>${escapeHtml(`${repairPlan.summary.auditPassed} audit-passed / ${repairPlan.summary.missingPlans} missing / ${repairPlan.summary.repairablePlans} repairable / ${repairPlan.summary.operatorActionRequired} operator-action-required`)}</span></div>`,
    '<p class="metadata">Mutation readiness repair is read-only guidance; mutationAllowed=false and every command remains a scaffold until operator evidence fills the placeholders.</p>',
    '<div class="table-wrap"><table><thead><tr><th>Target</th><th>Status</th><th>Latest Plan</th><th>Repairable</th><th>Operator</th><th>Remaining</th><th>Approval Command</th><th>Regeneration Command</th><th>Next Commands</th></tr></thead><tbody>',
    ...repairPlan.targets.map(mutationRepairTargetRow),
    "</tbody></table></div>"
  ].join("");
}

function mutationRepairTargetRow(target: NonNullable<ConsoleData["mutationReadinessRepairPlan"]>["targets"][number]): string {
  return [
    "<tr>",
    `<td>${escapeHtml(target.target)}</td>`,
    `<td class="${statusClass(target.status)}">${escapeHtml(target.status)}</td>`,
    `<td>${escapeHtml(target.latestPlanId ?? "none")}</td>`,
    `<td>${escapeHtml(inlineOrNone(target.repairableBlockers))}</td>`,
    `<td>${escapeHtml(inlineOrNone(target.operatorBlockers))}</td>`,
    `<td>${escapeHtml(inlineOrNone(target.remainingBlockers))}</td>`,
    `<td><code>${escapeHtml(target.approvalCommand ?? "none")}</code></td>`,
    `<td><code>${escapeHtml(target.regenerationCommand)}</code></td>`,
    `<td>${escapeHtml(String(target.nextActionCommands.length))}</td>`,
    "</tr>"
  ].join("");
}

function inlineOrNone(items: string[]): string {
  return items.length === 0 ? "none" : items.join("; ");
}

function liveAdapters(data: ConsoleData): string {
  const readiness = data.liveAdapterReadiness;
  const nextActions = data.liveAdapterNextActions;
  const approvalPack = data.liveAdapterApprovalPack;
  const cutoverAudit = data.liveAdapterCutoverAudit;
  if (!readiness && !nextActions && !approvalPack && !cutoverAudit) return empty("No live-adapter readiness evidence is available.");
  const actionsByTarget = new Map(nextActions?.targets.map((target) => [target.target, target.actions]) ?? []);
  const approvalTargets = new Set(approvalPack?.packets.map((packet) => packet.target) ?? []);
  const reviewAuditByTarget = new Map(data.liveAdapterApprovalReviewAudit?.targets.map((target) => [target.target, target]) ?? []);
  const cutoverByTarget = new Map(cutoverAudit?.targets.map((target) => [target.target, target]) ?? []);
  const rows =
    (readiness?.targets ?? cutoverAudit?.targets ?? []).map((target) => ({
      target: target.target,
      status: target.status,
      blockers: target.blockers,
      actionCount: actionsByTarget.get(target.target)?.length ?? 0,
      nextAction: actionsByTarget.get(target.target)?.[0]?.title ?? "none",
      approvalPacket: approvalTargets.has(target.target) ? "yes" : "no",
      packetReview: reviewAuditByTarget.get(target.target)?.status ?? "missing",
      cutover: cutoverByTarget.get(target.target)?.status ?? "unknown"
    }));
  return [
    `<div class="visual-status"><strong class="${statusClass(readiness?.status)}">${escapeHtml(readiness?.status ?? "unknown")}</strong><span>${escapeHtml(`${readiness?.summary.ready ?? 0} ready / ${readiness?.summary.blocked ?? 0} blocked / ${nextActions?.summary.actionItems ?? 0} actions / ${approvalPack?.summary.packets ?? 0} approval packets / ${data.summary.currentLiveAdapterApprovalReviews ?? 0} current reviews / ${cutoverAudit?.summary.ready ?? 0} cutover-ready`)}</span></div>`,
    '<div class="table-wrap"><table><thead><tr><th>Target</th><th>Status</th><th>Cutover</th><th>Actions</th><th>Approval Pack</th><th>Packet Review</th><th>Next</th><th>Blockers</th></tr></thead><tbody>',
    ...rows.map(
      (row) =>
        `<tr><td>${escapeHtml(row.target)}</td><td class="${statusClass(row.status)}">${escapeHtml(row.status)}</td><td class="${statusClass(row.cutover)}">${escapeHtml(row.cutover)}</td><td>${escapeHtml(String(row.actionCount))}</td><td>${escapeHtml(row.approvalPacket)}</td><td>${escapeHtml(row.packetReview)}</td><td>${escapeHtml(row.nextAction)}</td><td>${escapeHtml(row.blockers.length === 0 ? "none" : row.blockers.join("; "))}</td></tr>`
    ),
    "</tbody></table></div>"
  ].join("");
}

function reviewSession(data: ConsoleData): string {
  const session = data.liveAdapterReviewSession;
  if (!session) return empty("No live-adapter review session is available.");
  return [
    `<div class="visual-status"><strong class="${statusClass(session.status)}">${escapeHtml(session.status)}</strong><span>${escapeHtml(`${session.summary.operatorReviewRequired} review-required / ${session.summary.readyForAdapterWork} adapter-ready / ${session.summary.gbrainReports} GBrain reports`)}</span></div>`,
    '<p class="metadata">Review session only: mutationApproved=false and GBrain is advisory memory. Mutation repair commands remain scaffolds until operator evidence and approval gates pass.</p>',
    '<div class="table-wrap"><table><thead><tr><th>Target</th><th>Status</th><th>Cutover</th><th>Review</th><th>Repair</th><th>First Action</th><th>Repair Commands</th><th>GBrain Queries</th></tr></thead><tbody>',
    ...session.targets.map(reviewSessionTargetRow),
    "</tbody></table></div>"
  ].join("");
}

function reviewSessionTargetRow(target: NonNullable<ConsoleData["liveAdapterReviewSession"]>["targets"][number]): string {
  const mutationRepairStatus = target.mutationRepairStatus ?? "unknown";
  const mutationRepairNextActionCommands = target.mutationRepairNextActionCommands ?? [];
  return [
    "<tr>",
    `<td>${escapeHtml(target.target)}</td>`,
    `<td class="${statusClass(target.status)}">${escapeHtml(target.status)}</td>`,
    `<td class="${statusClass(target.cutoverStatus)}">${escapeHtml(target.cutoverStatus)}</td>`,
    `<td>${escapeHtml(target.reviewAuditStatus)}</td>`,
    `<td class="${statusClass(mutationRepairStatus)}">${escapeHtml(mutationRepairStatus)}</td>`,
    `<td>${escapeHtml(target.firstAction ?? "none")}</td>`,
    `<td>${escapeHtml(String(mutationRepairNextActionCommands.length))}</td>`,
    `<td>${escapeHtml(String(target.gbrainContext.suggestedQueries.length))}</td>`,
    "</tr>"
  ].join("");
}

function evidenceTemplates(data: ConsoleData): string {
  const pack = data.liveAdapterEvidenceTemplatePack;
  if (!pack) return empty("No live-adapter evidence templates are available.");
  return [
    `<div class="visual-status"><strong class="${statusClass(pack.status)}">${escapeHtml(pack.status)}</strong><span>${escapeHtml(`${pack.summary.templates} templates / ${pack.summary.evidenceItems} evidence items / ${pack.summary.gbrainQueryItems} GBrain queries`)}</span></div>`,
    '<p class="metadata">Templates are blank collection aids, not approval records or evidence.</p>',
    '<div class="table-wrap"><table><thead><tr><th>Target</th><th>Status</th><th>Template</th><th>Evidence Items</th><th>GBrain Queries</th></tr></thead><tbody>',
    ...pack.templates.map(
      (template) =>
        `<tr><td>${escapeHtml(template.target)}</td><td class="${statusClass(template.status)}">${escapeHtml(template.status)}</td><td>${escapeHtml(template.templateRef)}</td><td>${escapeHtml(String(template.requiredEvidence.length))}</td><td>${escapeHtml(String(template.gbrainQueries.length))}</td></tr>`
    ),
    "</tbody></table></div>"
  ].join("");
}

function operatorEvidenceWorkplan(data: ConsoleData): string {
  const workplan = data.liveAdapterOperatorEvidenceWorkplan;
  if (!workplan) return empty("No live-adapter operator evidence workplan is available.");
  return [
    `<div class="visual-status"><strong class="${statusClass(workplan.status)}">${escapeHtml(workplan.status)}</strong><span>${escapeHtml(`${workplan.summary.checkCommands ?? 0} check commands / ${workplan.summary.importCommands} import commands / ${workplan.summary.gbrainQueries} GBrain queries`)}</span></div>`,
    '<p class="metadata">The workplan is an evidence collection queue, not approval evidence.</p>',
    '<div class="table-wrap"><table><thead><tr><th>Target</th><th>Status</th><th>Template</th><th>Check Command</th><th>Import Command</th><th>Cutover Blockers</th></tr></thead><tbody>',
    ...workplan.targets.map(
      (target) =>
        `<tr><td>${escapeHtml(target.target)}</td><td class="${statusClass(target.status)}">${escapeHtml(target.status)}</td><td>${escapeHtml(target.templateRef)}</td><td>${escapeHtml(target.checkCommand ?? "not generated")}</td><td>${escapeHtml(target.importCommand)}</td><td>${escapeHtml(String(target.cutoverBlockers.length))}</td></tr>`
    ),
    "</tbody></table></div>"
  ].join("");
}

function operatorEvidenceQueue(data: ConsoleData): string {
  const queue = data.liveAdapterOperatorEvidenceQueue;
  if (!queue) return empty("No live-adapter operator evidence queue is available.");
  return [
    `<div class="visual-status"><strong class="${statusClass(queue.status)}">${escapeHtml(queue.status)}</strong><span>${escapeHtml(`${queue.summary.readyForImport} ready for import / ${queue.summary.uncheckedTargets} unchecked / ${queue.summary.needsEvidence} need evidence`)}</span></div>`,
    '<p class="metadata">The queue orders operator work from preflight checks; it is not approval evidence.</p>',
    '<div class="table-wrap"><table><thead><tr><th>Target</th><th>Status</th><th>Latest Check</th><th>Missing</th><th>Next Action</th></tr></thead><tbody>',
    ...queue.targets.map(
      (target) =>
        `<tr><td>${escapeHtml(target.target)}</td><td class="${statusClass(target.status)}">${escapeHtml(target.status)}</td><td>${escapeHtml(target.latestCheckId ?? "none")}</td><td>${escapeHtml(String(target.latestCheckMissingSections ?? target.missingSections.length))}</td><td>${escapeHtml(target.nextAction)}</td></tr>`
    ),
    "</tbody></table></div>"
  ].join("");
}

function operatorEvidenceAssist(data: ConsoleData): string {
  const assist = data.liveAdapterOperatorEvidenceAssist;
  if (!assist) return empty("No live-adapter operator evidence assist is available.");
  return [
    `<div class="visual-status"><strong class="${statusClass(assist.status)}">${escapeHtml(assist.status)}</strong><span>${escapeHtml(`${assist.summary.assistFiles} assist files / ${assist.summary.existingEvidenceRefs} existing refs / ${assist.summary.gbrainQueries} GBrain queries`)}</span></div>`,
    '<p class="metadata">Assist packets are read-only collection aids; they are not operator evidence, approval, or mutation authority.</p>',
    '<div class="table-wrap"><table><thead><tr><th>Target</th><th>Status</th><th>Assist File</th><th>Existing Refs</th><th>Missing Sections</th><th>Next Step</th></tr></thead><tbody>',
    ...assist.targets.map(
      (target) =>
        `<tr><td>${escapeHtml(target.target)}</td><td class="${statusClass(target.status)}">${escapeHtml(target.status)}</td><td>${escapeHtml(target.assistFileRef)}</td><td>${escapeHtml(String(target.existingEvidenceRefs.length))}</td><td>${escapeHtml(String(target.missingSections.length))}</td><td>${escapeHtml(target.nextSteps[0] ?? "none")}</td></tr>`
    ),
    "</tbody></table></div>"
  ].join("");
}

function operatorEvidence(data: ConsoleData): string {
  const audit = data.liveAdapterOperatorEvidenceAudit;
  if (!audit) return empty("No live-adapter operator evidence audit is available.");
  return [
    `<div class="visual-status"><strong class="${statusClass(audit.status)}">${escapeHtml(audit.status)}</strong><span>${escapeHtml(`${audit.summary.completeTargets} complete / ${audit.summary.incompleteTargets} incomplete / ${audit.summary.missingTargets} missing / ${audit.summary.records} records`)}</span></div>`,
    '<p class="metadata">Operator evidence records do not approve mutation and GBrain notes remain advisory.</p>',
    '<div class="table-wrap"><table><thead><tr><th>Target</th><th>Status</th><th>Records</th><th>Latest</th><th>Missing</th><th>GBrain</th></tr></thead><tbody>',
    ...audit.targets.map((target) => {
      const missingSections = operatorEvidenceTargetMissingSections(target);
      return `<tr><td>${escapeHtml(target.target)}</td><td class="${statusClass(target.status)}">${escapeHtml(target.status)}</td><td>${escapeHtml(String(target.recordCount))}</td><td>${escapeHtml(target.latestRecordId ?? "none")}</td><td>${escapeHtml(missingSections.length === 0 ? "none" : missingSections.join("; "))}</td><td>${escapeHtml(String(target.advisoryWarnings.length))}</td></tr>`;
    }),
    "</tbody></table></div>"
  ].join("");
}

function roadmapCompletion(data: ConsoleData): string {
  const audit = data.roadmapCompletionAudit;
  if (!audit) return empty("No roadmap completion audit is available.");
  const blocked = audit.requirements.filter((requirement) => requirement.status === "blocked");
  return [
    `<div class="visual-status"><strong class="${statusClass(audit.status)}">${escapeHtml(audit.status)}</strong><span>${escapeHtml(`${audit.summary.passed} passed / ${audit.summary.blocked} blocked / ${audit.summary.advisory} advisory`)}</span></div>`,
    '<p class="metadata">Completion is only true when every requirement is proven by current artifacts.</p>',
    '<ul class="compact-list">',
    ...(blocked.length === 0
      ? ["<li><strong>complete</strong><span>No blocked roadmap requirements.</span></li>"]
      : blocked.map(
          (requirement) =>
            `<li><strong>${escapeHtml(requirement.id)}</strong><span>${escapeHtml(requirement.detail)}</span></li>`
        )),
    "</ul>"
  ].join("");
}

function recovery(data: ConsoleData): string {
  const report = data.recovery;
  if (!report) return empty("No recovery report is available.");
  return [
    `<div class="visual-status"><strong class="${statusClass(report.status)}">${escapeHtml(report.status)}</strong><span>${escapeHtml(`${report.summary.incompleteRuns} incomplete / ${report.summary.missingGates} missing gates`)}</span></div>`,
    '<ul class="compact-list">',
    ...report.issues.slice(0, 6).map(
      (issue) =>
        `<li><strong class="${statusClass(issue.severity)}">${escapeHtml(issue.severity)}</strong><span>${escapeHtml(issue.detail)}</span></li>`
    ),
    "</ul>"
  ].join("");
}

function memoryAndMail(data: ConsoleData): string {
  const rows = [
    ["Sleep routines", data.summary.sleepRoutines],
    ["Memory proposals", data.summary.memoryProposals],
    ["Agent mail", data.summary.agentMail],
    ["Agent leases", data.summary.agentLeases],
    ["Hermes cron snapshots", data.summary.hermesCronSnapshots],
    ["Hermes cron proposals", data.summary.hermesCronProposals]
  ];
  const latest = data.coordination.hermesCronSnapshots.at(-1);
  const latestProposal = data.coordination.hermesCronProposals.at(-1);
  const summary = latest
    ? `<div class="metadata">Latest Hermes snapshot: ${escapeHtml(`${latest.summary.jobs} jobs / ${latest.summary.enabled} enabled`)}</div>`
    : "";
  const proposal = latestProposal
    ? `<div class="metadata">Latest Hermes proposal: ${escapeHtml(`${latestProposal.summary.proposedActions} actions / ${latestProposal.mode}`)}</div>`
    : "";
  return `<div class="chain">${rows.map(([label, value]) => `<div><span>${escapeHtml(String(label))}</span><strong>${escapeHtml(String(value))}</strong></div>`).join("")}</div>${summary}${proposal}`;
}

function infrastructure(data: ConsoleData): string {
  const registry = data.infrastructure.registry;
  const latestProbe = data.infrastructure.runtimeProbes.at(-1);
  if (!registry) return empty("No infrastructure registry is available.");
  return [
    ...(latestProbe
      ? [
          `<div class="metadata">Latest runtime probe: ${escapeHtml(`${latestProbe.summary.reachable} reachable / ${latestProbe.summary.degraded} degraded / ${latestProbe.summary.unreachable} unreachable / ${latestProbe.summary.models} models`)}</div>`
        ]
      : []),
    '<div class="infra">',
    ...registry.hosts.map(
      (host) =>
        `<div><strong>${escapeHtml(host.label)}</strong><span>${escapeHtml(host.role)}</span><small>${escapeHtml(host.notes)}</small></div>`
    ),
    ...(latestProbe
      ? latestProbe.modelEndpoints.map(
          (endpoint) =>
            `<div><strong>${escapeHtml(endpoint.id)}</strong><span>${escapeHtml(`${endpoint.status} / ${endpoint.kind}`)}</span><small>${escapeHtml(`${endpoint.models.length} models / canary ${endpoint.canary?.status ?? "not-run"}`)}</small></div>`
        )
      : []),
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

function github(data: ConsoleData): string {
  if (data.github.snapshots.length === 0) return empty("No GitHub snapshots are available.");
  return [
    '<div class="infra">',
    ...data.github.snapshots.slice(-4).map(
      (snapshot) =>
        `<div><strong>${escapeHtml(snapshot.repository ?? "unknown repository")}</strong><span>${escapeHtml(`${snapshot.summary.pullRequests} PRs / ${snapshot.summary.checks} checks`)}</span><small>${escapeHtml(`${snapshot.summary.passingChecks} passing / ${snapshot.summary.failingChecks} failing / ${snapshot.summary.pendingChecks} pending`)}</small></div>`
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
  if (
    value === "passed" ||
    value === "ready" ||
    value === "ready_for_bounded_review" ||
    value === "ready_for_operator_review" ||
    value === "ready_for_adapter_work" ||
    value === "ready_for_cutover" ||
    value === "approved" ||
    value === "complete" ||
    value === "ready_for_review" ||
    value === "ready_for_import" ||
    value === "ready_for_adapter" ||
    value === "audit_passed" ||
    value === "ready_for_human_fill" ||
    value === "info"
  ) {
    return "ok";
  }
  if (value === "failed" || value === "blocked" || value === "changes_requested" || value === "blocking") return "bad";
  if (
    value === "review_required" ||
    value === "operator_review_required" ||
    value === "incomplete" ||
    value === "missing_evidence" ||
    value === "pending" ||
    value === "skipped" ||
    value === "warning" ||
    value === "attention_required" ||
    value === "awaiting_operator_evidence" ||
    value === "awaiting_operator_review" ||
    value === "actions_required" ||
    value === "evidence_required" ||
    value === "missing_plan" ||
    value === "repairable_plan" ||
    value === "operator_action_required" ||
    value === "needs_evidence" ||
    value === "needs_rework" ||
    value === "unchecked" ||
    value === "context_available" ||
    value === "missing_context"
  ) {
    return "warn";
  }
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
.workflow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, .42fr);
  gap: 20px;
  padding: 22px 0;
  border-bottom: 1px solid var(--line);
}
.workflow-lanes {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  border: 1px solid var(--line);
  background: var(--panel);
}
.workflow-stage {
  min-width: 0;
  min-height: 164px;
  padding: 14px;
  border-right: 1px solid var(--line);
  display: grid;
  align-content: space-between;
  gap: 14px;
}
.workflow-stage:last-child { border-right: 0; }
.workflow-stage div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
}
.workflow-stage span, .workflow-stage small, .next-action small {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
}
.workflow-stage strong {
  font-family: var(--mono);
  font-size: 12px;
  text-align: right;
  overflow-wrap: anywhere;
}
.workflow-stage p, .next-action p {
  margin: 0;
  color: var(--ink);
  font-size: 13px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.workflow-stage small, .next-action small {
  display: block;
  overflow-wrap: anywhere;
}
.next-action {
  min-width: 0;
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 16px;
  display: grid;
  align-content: space-between;
  gap: 12px;
}
.next-action strong {
  font-family: var(--mono);
  font-size: 20px;
  line-height: 1.2;
  overflow-wrap: anywhere;
}
.next-action code {
  display: block;
  max-width: 100%;
  overflow-x: auto;
  padding: 10px;
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--ink);
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.4;
}
.command-disclosure {
  min-width: 0;
}
.command-disclosure summary {
  cursor: pointer;
  color: var(--accent);
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.4;
}
.action-steps {
  list-style: decimal;
  list-style-position: outside;
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 10px;
}
.action-steps li {
  min-width: 0;
  border-top: 1px solid var(--line);
  padding-top: 10px;
}
.action-steps div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}
.action-steps li > * + * {
  margin-top: 8px;
}
.action-steps span {
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
}
.action-steps strong {
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.25;
}
.action-steps p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.action-steps code {
  font-size: 11px;
}
.operator-checklist {
  grid-column: 1 / -1;
  min-width: 0;
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 16px;
  display: grid;
  gap: 14px;
}
.checklist-summary {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}
.checklist-summary strong {
  font-family: var(--mono);
  font-size: 16px;
}
.checklist-summary span {
  color: var(--accent);
  font-family: var(--mono);
  font-size: 12px;
}
.checklist-progress {
  border: 1px solid var(--line);
  background: var(--bg);
  padding: 12px;
  display: flex;
  gap: 12px;
  align-items: baseline;
  flex-wrap: wrap;
}
.checklist-progress strong {
  color: var(--ink);
  font-family: var(--mono);
  font-size: 13px;
}
.checklist-progress span {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.checklist-sections {
  list-style: decimal;
  list-style-position: outside;
  margin: 0;
  padding-left: 20px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.checklist-sections li {
  min-width: 0;
  border: 1px solid var(--line);
  padding: 12px;
  background: var(--bg);
}
.checklist-sections li.checklist-current {
  border-color: var(--accent);
  box-shadow: inset 0 3px 0 var(--accent);
}
.checklist-sections li > * + * {
  margin-top: 8px;
}
.checklist-sections div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}
.checklist-sections strong {
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.25;
}
.checklist-sections span,
.checklist-sections small {
  color: var(--muted);
  font-size: 11px;
}
.checklist-sections p {
  margin: 0;
  color: var(--ink);
  font-size: 12px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.checklist-sections dl {
  margin: 0;
  display: grid;
  gap: 6px;
}
.checklist-sections dt {
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
}
.checklist-sections dd {
  margin: 0;
  color: var(--ink);
  font-size: 12px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.workflow-routes,
.workflow-modes,
.workflow-surfaces {
  grid-column: 1 / -1;
  min-width: 0;
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 16px;
}
.workflow-routes {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.workflow-modes {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.workflow-surfaces {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}
.workflow-subhead {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 18px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 12px;
}
.workflow-subhead p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.45;
  text-align: right;
  overflow-wrap: anywhere;
}
.route-card,
.mode-tile,
.surface-row {
  min-width: 0;
  display: grid;
  gap: 10px;
  align-content: start;
}
.route-card {
  border: 1px solid var(--line);
  background: var(--bg);
  padding: 12px;
}
.route-current {
  border-color: var(--accent);
  box-shadow: inset 0 3px 0 var(--accent);
}
.mode-tile {
  padding-right: 0;
}
.route-card div,
.mode-tile div,
.surface-row {
  display: grid;
  gap: 6px;
}
.route-card div,
.mode-tile div {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
}
.route-card strong,
.mode-tile strong,
.surface-row strong {
  color: var(--ink);
  font-family: var(--mono);
  font-size: 15px;
  line-height: 1.2;
  overflow-wrap: anywhere;
}
.route-card span,
.mode-tile span,
.surface-row span {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}
.route-card p,
.route-card small,
.mode-tile p,
.mode-tile small,
.mode-tile em,
.surface-row p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  font-style: normal;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.route-card ol {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 10px;
}
.route-card li {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.4;
}
.route-card li > * + * {
  margin-top: 5px;
}
.route-card li strong {
  display: block;
  font-size: 12px;
}
.route-card li p {
  margin: 0;
}
.route-card code {
  font-size: 11px;
}
.mode-tile em {
  color: var(--ink);
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
  overflow-wrap: anywhere;
}
.metric-text strong {
  font-size: 18px;
  line-height: 1.18;
  align-self: center;
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
.metadata {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  overflow-wrap: anywhere;
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
  .hero, .layout, .workflow { grid-template-columns: 1fr; }
  .workflow-lanes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .workflow-stage:nth-child(2n) { border-right: 0; }
  .workflow-routes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .workflow-modes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .workflow-surfaces { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .checklist-sections { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .workflow-subhead { display: grid; }
  .workflow-subhead p { text-align: left; }
  .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .metric:nth-child(2n) { border-right: 0; }
  .gate-grid { grid-template-columns: 1fr; }
  .gate, .gate:nth-child(3n) { border-right: 0; }
  .timeline li { grid-template-columns: 1fr; gap: 6px; }
  .trend-card { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .workflow-lanes { grid-template-columns: 1fr; }
  .workflow-stage { border-right: 0; border-bottom: 1px solid var(--line); }
  .workflow-stage:last-child { border-bottom: 0; }
  .workflow-routes,
  .workflow-modes, .workflow-surfaces { grid-template-columns: 1fr; }
  .checklist-sections { grid-template-columns: 1fr; }
}
`;
}
