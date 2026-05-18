import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { operatorEvidenceAuditMissingSections } from "./liveAdapterOperatorEvidence.js";
import { nextOperatorEvidenceCommands, selectNextOperatorEvidenceTarget } from "./liveAdapterOperatorEvidenceNextTarget.js";
import { projectDir, slugifyProject } from "./paths.js";
import type {
  ArtifactCheckReport,
  BehaviorCheckReport,
  ConsoleBrowserCheckReport,
  ConsoleData,
  ConsoleVisualCheckReport,
  EvaluationTrendReport,
  LiveAdapterCutoverAudit,
  LiveAdapterOperatorEvidenceAudit,
  LiveAdapterOperatorEvidenceAssist,
  LiveAdapterOperatorEvidenceQueue,
  LiveAdapterOperatorEvidenceWorkspace,
  LiveAdapterOperatorEvidenceWorkplan,
  LiveAdapterReviewSession,
  LiveAdapterTargetDossier,
  RoadmapCompletionAudit
} from "./types.js";

type Requirement = RoadmapCompletionAudit["requirements"][number];

export async function generateRoadmapCompletionAudit(input: {
  project: string;
  vaultRoot: string;
}): Promise<{ jsonPath: string; markdownPath: string; audit: RoadmapCompletionAudit }> {
  const project = slugifyProject(input.project);
  const dir = projectDir(input.vaultRoot, project);
  const artifactChecks = await readJson<ArtifactCheckReport>(path.join(dir, "evaluation", "artifact-checks.json"));
  const behaviorChecks = await readJson<BehaviorCheckReport>(path.join(dir, "evaluation", "behavior-checks.json"));
  const consoleVisualChecks = await readJson<ConsoleVisualCheckReport>(path.join(dir, "console", "visual-checks.json"));
  const consoleBrowserChecks = await readJson<ConsoleBrowserCheckReport>(path.join(dir, "console", "browser-checks.json"));
  const evaluationTrends = await readJson<EvaluationTrendReport>(path.join(dir, "evaluation", "evaluation-trends.json"));
  const consoleData = await readJson<ConsoleData>(path.join(dir, "console", "console-data.json"));
  const operatorEvidenceAudit = await readJson<LiveAdapterOperatorEvidenceAudit>(
    path.join(dir, "control", "live-adapter-operator-evidence-audit.json")
  );
  const operatorEvidenceWorkplan = await readJson<LiveAdapterOperatorEvidenceWorkplan>(
    path.join(dir, "control", "live-adapter-operator-evidence-workplan.json")
  );
  const operatorEvidenceQueue = await readJson<LiveAdapterOperatorEvidenceQueue>(
    path.join(dir, "control", "live-adapter-operator-evidence-queue.json")
  );
  const operatorEvidenceWorkspace = await readJson<LiveAdapterOperatorEvidenceWorkspace>(
    path.join(dir, "control", "live-adapter-operator-evidence-workspace.json")
  );
  const operatorEvidenceAssist = await readJson<LiveAdapterOperatorEvidenceAssist>(
    path.join(dir, "control", "live-adapter-operator-evidence-assist.json")
  );
  const cutoverAudit = await readJson<LiveAdapterCutoverAudit>(path.join(dir, "control", "live-adapter-cutover-audit.json"));
  const reviewSession = await readJson<LiveAdapterReviewSession>(path.join(dir, "control", "live-adapter-review-session.json"));
  const dossiers = await readDossiers(path.join(dir, "control", "live-adapter-dossiers"));
  const gbrainExportExists = await exists(path.join(dir, "integrations", "gbrain", "gbrain-export.json"));
  const gbrainReports = await countMatching(path.join(dir, "integrations", "gbrain"), /^gbrain-report-.+\.json$/);
  const operatorEvidenceSummary = operatorEvidenceAudit?.summary;
  const operatorEvidenceMissingSections = operatorEvidenceAuditMissingSections(operatorEvidenceAudit);
  const nextOperatorEvidenceTarget = selectNextOperatorEvidenceTarget(
    operatorEvidenceQueue,
    operatorEvidenceWorkplan,
    operatorEvidenceAudit
  );
  const nextOperatorEvidenceAssist = nextOperatorEvidenceTarget
    ? await readJson<LiveAdapterOperatorEvidenceAssist>(
        path.join(dir, "control", `live-adapter-operator-evidence-assist-${nextOperatorEvidenceTarget.target}.json`)
      )
    : undefined;

  const requirements: Requirement[] = [
    {
      id: "core-artifact-contracts",
      title: "Core pipeline artifacts are present",
      status: artifactChecks?.status === "passed" ? "passed" : "blocked",
      detail: artifactChecks
        ? `${artifactChecks.summary.present} artifacts present; ${artifactChecks.summary.missingRequired} required missing.`
        : "Artifact check report is missing.",
      evidenceRefs: ["projects/" + project + "/evaluation/artifact-checks.json"],
      nextCommands: artifactChecks?.status === "passed" ? [] : [`npm run ariadne -- artifact-checks --project ${project}`]
    },
    {
      id: "behavior-confidence",
      title: "Behavior confidence checks are passing",
      status: behaviorChecks?.status === "passed" ? "passed" : "blocked",
      detail: behaviorChecks
        ? `${behaviorChecks.summary.passed}/${behaviorChecks.checks.length} behavior checks passed; ${behaviorChecks.summary.failed} failed.`
        : "Behavior check report is missing.",
      evidenceRefs: ["projects/" + project + "/evaluation/behavior-checks.json"],
      nextCommands: behaviorChecks?.status === "passed" ? [] : [`npm run ariadne -- behavior-checks --project ${project}`]
    },
    {
      id: "evaluation-harness",
      title: "Evaluation harness has current trend evidence",
      status: evaluationTrends ? "passed" : "blocked",
      detail: evaluationTrends
        ? `Evaluation trend status is ${evaluationTrends.status}; latest score is ${evaluationTrends.latestScore ?? "unknown"}.`
        : "Evaluation trend report is missing.",
      evidenceRefs: ["projects/" + project + "/evaluation/evaluation-trends.json"],
      nextCommands: evaluationTrends ? [] : [`npm run ariadne -- evaluation-trends --project ${project}`]
    },
    {
      id: "console-verification",
      title: "Orchestration console is rendered and browser-checked",
      status: consoleVisualChecks?.status === "passed" && consoleBrowserChecks?.status === "passed" ? "passed" : "blocked",
      detail: `Visual checks: ${consoleVisualChecks?.status ?? "missing"}; browser checks: ${consoleBrowserChecks?.status ?? "missing"}.`,
      evidenceRefs: ["projects/" + project + "/console/visual-checks.json", "projects/" + project + "/console/browser-checks.json"],
      nextCommands:
        consoleVisualChecks?.status === "passed" && consoleBrowserChecks?.status === "passed"
          ? []
          : [
              `npm run ariadne -- console-html --project ${project} --refresh-data`,
              `npm run ariadne -- console-visual-checks --project ${project}`,
              `npm run ariadne -- console-browser-checks --project ${project}`
            ]
    },
    {
      id: "sleep-memory-agent-mail",
      title: "Sleep, memory, agent mail, and lease records are visible",
      status:
        (consoleData?.summary.sleepRoutines ?? 0) > 0 &&
        (consoleData?.summary.memoryProposals ?? 0) > 0 &&
        (consoleData?.summary.agentMail ?? 0) > 0 &&
        (consoleData?.summary.agentLeases ?? 0) > 0
          ? "passed"
          : "blocked",
      detail: `sleep=${consoleData?.summary.sleepRoutines ?? 0}, memory=${consoleData?.summary.memoryProposals ?? 0}, mail=${consoleData?.summary.agentMail ?? 0}, leases=${consoleData?.summary.agentLeases ?? 0}.`,
      evidenceRefs: ["projects/" + project + "/console/console-data.json"],
      nextCommands: [
        `npm run ariadne -- sleep-record --project ${project} --scope <scope> --summary <text>`,
        `npm run ariadne -- memory-proposal --project ${project} --title <title> --proposal <text>`,
        `npm run ariadne -- agent-mail --project ${project} --from <agent> --to <agent> --subject <text> --body <text>`
      ]
    },
    {
      id: "gbrain-advisory-context",
      title: "GBrain is incorporated as advisory memory",
      status: dossiers.length > 0 && dossiers.every((dossier) => (dossier.gbrainContext?.suggestedQueries?.length ?? 0) > 0) ? "passed" : "blocked",
      detail: `${dossiers.length} live-adapter dossier(s) include GBrain advisory queries; export=${gbrainExportExists ? "present" : "missing"}; imported reports=${gbrainReports}.`,
      evidenceRefs: [
        "projects/" + project + "/control/live-adapter-dossiers",
        "projects/" + project + "/integrations/gbrain/gbrain-export.json"
      ],
      nextCommands: gbrainExportExists ? [] : [`npm run ariadne -- gbrain-export --project ${project}`]
    },
    {
      id: "operator-evidence",
      title: "All live-adapter targets have complete operator evidence",
      status: operatorEvidenceAudit?.status === "complete" ? "passed" : "blocked",
      detail: operatorEvidenceAudit
        ? `${operatorEvidenceSummary?.completeTargets ?? 0}/${operatorEvidenceSummary?.targets ?? 0} targets complete; ${operatorEvidenceSummary?.missingTargets ?? 0} missing evidence; ${operatorEvidenceMissingSections ?? 0} missing section(s).`
        : "Operator evidence audit is missing.",
      evidenceRefs: ["projects/" + project + "/control/live-adapter-operator-evidence-audit.json"],
      nextCommands: [
        ...(nextOperatorEvidenceTarget
          ? nextOperatorEvidenceCommands(project, nextOperatorEvidenceTarget.target)
          : []),
        `npm run ariadne -- live-adapter-operator-evidence-workplan --project ${project}`,
        `npm run ariadne -- live-adapter-operator-evidence-queue --project ${project}`,
        `npm run ariadne -- live-adapter-evidence-templates --project ${project}`,
        `npm run ariadne -- live-adapter-operator-evidence-workspace --project ${project}`,
        `npm run ariadne -- live-adapter-operator-evidence-assist --project ${project}`,
        `npm run ariadne -- live-adapter-operator-evidence-check-all --project ${project} --source workspace`,
        `npm run ariadne -- live-adapter-operator-evidence-import-ready --project ${project} --by <operator>`,
        `npm run ariadne -- live-adapter-operator-evidence-check --project ${project} --target <target> --from vault/projects/${project}/control/operator-evidence/<target>/operator-evidence.md`,
        `npm run ariadne -- live-adapter-operator-evidence --project ${project} --target <target> --from vault/projects/${project}/control/operator-evidence/<target>/operator-evidence.md --by <operator>`,
        `npm run ariadne -- live-adapter-operator-evidence-audit --project ${project}`
      ]
    },
    {
      id: "live-adapter-cutover",
      title: "Live-adapter cutover gates are ready",
      status: cutoverAudit?.status === "ready_for_cutover" ? "passed" : "blocked",
      detail: cutoverAudit
        ? `${cutoverAudit.summary.ready}/${cutoverAudit.summary.targets} targets ready; ${cutoverAudit.summary.blockedGates} gates blocked.`
        : "Live-adapter cutover audit is missing.",
      evidenceRefs: ["projects/" + project + "/control/live-adapter-cutover-audit.json"],
      nextCommands: [
        ...(nextOperatorEvidenceTarget
          ? [`npm run ariadne -- live-adapter-cutover-audit --project ${project} --target ${nextOperatorEvidenceTarget.target}`]
          : []),
        `npm run ariadne -- live-adapter-cutover-audit --project ${project}`
      ]
    },
    {
      id: "operator-review-session",
      title: "Operator review session reflects live-adapter state",
      status: reviewSession?.status === "ready_for_adapter_work" ? "passed" : "blocked",
      detail: reviewSession
        ? `${reviewSession.summary.readyForAdapterWork}/${reviewSession.summary.targets} targets ready for adapter work; ${reviewSession.summary.operatorReviewRequired} still require operator review.`
        : "Live-adapter review session is missing.",
      evidenceRefs: ["projects/" + project + "/control/live-adapter-review-session.json"],
      nextCommands: [
        ...(nextOperatorEvidenceTarget
          ? [`npm run ariadne -- live-adapter-review-session --project ${project} --target ${nextOperatorEvidenceTarget.target}`]
          : []),
        `npm run ariadne -- live-adapter-review-session --project ${project}`
      ]
    }
  ];

  const summary = {
    requirements: requirements.length,
    passed: requirements.filter((requirement) => requirement.status === "passed").length,
    blocked: requirements.filter((requirement) => requirement.status === "blocked").length,
    advisory: requirements.filter((requirement) => requirement.status === "advisory").length
  };
  const operatorEvidenceRequirement = requirements.find((requirement) => requirement.id === "operator-evidence");
  if (operatorEvidenceRequirement && operatorEvidenceWorkplan) {
    operatorEvidenceRequirement.detail += ` Workplan status is ${operatorEvidenceWorkplan.status} with ${operatorEvidenceWorkplan.summary.checkCommands} check command(s) and ${operatorEvidenceWorkplan.summary.importCommands} import command(s).`;
    operatorEvidenceRequirement.evidenceRefs.push("projects/" + project + "/control/live-adapter-operator-evidence-workplan.json");
  }
  if (operatorEvidenceRequirement && operatorEvidenceQueue) {
    operatorEvidenceRequirement.detail += ` Queue status is ${operatorEvidenceQueue.status} with ${operatorEvidenceQueue.summary.readyForImport} target(s) ready for import and ${operatorEvidenceQueue.summary.uncheckedTargets} unchecked target(s).`;
    operatorEvidenceRequirement.evidenceRefs.push("projects/" + project + "/control/live-adapter-operator-evidence-queue.json");
  }
  if (operatorEvidenceRequirement && operatorEvidenceWorkspace) {
    operatorEvidenceRequirement.detail += ` Workspace status is ${operatorEvidenceWorkspace.status} with ${operatorEvidenceWorkspace.summary.workspaceFiles} fillable file(s).`;
    operatorEvidenceRequirement.evidenceRefs.push("projects/" + project + "/control/live-adapter-operator-evidence-workspace.json");
  }
  const aggregateAssist = nextOperatorEvidenceAssist ?? operatorEvidenceAssist;
  if (operatorEvidenceRequirement && aggregateAssist) {
    operatorEvidenceRequirement.detail += ` Assist status is ${aggregateAssist.status} with ${aggregateAssist.summary.promotedLiveEvidence} promoted live-evidence item(s).`;
    addEvidenceRefs(operatorEvidenceRequirement, [assistRef(project, aggregateAssist)]);
  }
  if (operatorEvidenceRequirement && nextOperatorEvidenceTarget) {
    operatorEvidenceRequirement.detail += ` Next target is ${nextOperatorEvidenceTarget.target} (${nextOperatorEvidenceTarget.status}, ${nextOperatorEvidenceTarget.missingSections} missing section(s)).`;
    addEvidenceRefs(operatorEvidenceRequirement, [
      `projects/${project}/control/operator-evidence/${nextOperatorEvidenceTarget.target}/operator-evidence.md`
    ]);
    const nextAssistTarget = aggregateAssist?.targets.find((target) => target.target === nextOperatorEvidenceTarget.target);
    if (nextAssistTarget) {
      operatorEvidenceRequirement.detail += ` Next target assist has ${nextAssistTarget.existingEvidenceRefs.length} existing ref(s), ${nextAssistTarget.promotedLiveEvidence.length} promoted live-evidence item(s), and ${nextAssistTarget.supportFileRefs.length} support file(s).`;
      addEvidenceRefs(operatorEvidenceRequirement, [
        nextAssistTarget.assistFileRef,
        ...nextAssistTarget.promotedLiveEvidence.map((item) => item.ref)
      ]);
    }
  }
  const audit: RoadmapCompletionAudit = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    status: summary.blocked === 0 ? "complete" : "blocked",
    summary,
    requirements
  };
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "control", "roadmap-completion-audit.json", audit);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "control", "roadmap-completion-audit.md", renderAudit(audit));
  return { jsonPath, markdownPath, audit };
}

function assistRef(project: string, assist: LiveAdapterOperatorEvidenceAssist): string {
  return assist.target
    ? `projects/${project}/control/live-adapter-operator-evidence-assist-${assist.target}.json`
    : `projects/${project}/control/live-adapter-operator-evidence-assist.json`;
}

function addEvidenceRefs(requirement: Requirement, refs: string[]): void {
  requirement.evidenceRefs = Array.from(new Set([...requirement.evidenceRefs, ...refs]));
}

async function readJson<T>(filePath: string): Promise<T | undefined> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch {
    return undefined;
  }
}

async function readDossiers(dir: string): Promise<LiveAdapterTargetDossier[]> {
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch {
    return [];
  }
  const dossiers: LiveAdapterTargetDossier[] = [];
  for (const name of names.filter((item) => item.startsWith("live-adapter-dossier-") && item.endsWith(".json")).sort()) {
    const dossier = await readJson<LiveAdapterTargetDossier>(path.join(dir, name));
    if (dossier) dossiers.push(dossier);
  }
  return dossiers;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function countMatching(dir: string, pattern: RegExp): Promise<number> {
  try {
    return (await fs.readdir(dir)).filter((name) => pattern.test(name)).length;
  } catch {
    return 0;
  }
}

function renderAudit(audit: RoadmapCompletionAudit): string {
  return [
    "# Roadmap Completion Audit",
    "",
    `Project: ${audit.project}`,
    `Status: ${audit.status}`,
    `Generated: ${audit.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Requirements: ${audit.summary.requirements}`,
    `- Passed: ${audit.summary.passed}`,
    `- Blocked: ${audit.summary.blocked}`,
    `- Advisory: ${audit.summary.advisory}`,
    "",
    "## Requirements",
    "",
    "| Requirement | Status | Detail | Next commands | Evidence |",
    "| --- | --- | --- | --- | --- |",
    ...audit.requirements.map(
      (requirement) =>
        `| ${requirement.title} | ${requirement.status} | ${requirement.detail} | ${inlineList(requirement.nextCommands)} | ${inlineList(requirement.evidenceRefs)} |`
    ),
    ""
  ].join("\n");
}

function inlineList(items: string[]): string {
  return items.length === 0 ? "-" : items.join("<br>");
}
