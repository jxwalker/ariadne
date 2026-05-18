import type { ConsoleData, ConsoleWorkflow } from "./types.js";
import { selectNextOperatorEvidenceTarget } from "./liveAdapterOperatorEvidenceNextTarget.js";

type ConsoleWorkflowInput = Omit<ConsoleData, "workflow">;

export function buildConsoleWorkflow(data: ConsoleWorkflowInput): ConsoleWorkflow {
  return {
    schemaVersion: 1,
    stages: projectWorkflowStages(data),
    nextAction: nextBestAction(data),
    surfaces: [
      {
        id: "ariadne-console",
        label: "Ariadne Console",
        role: "Human cockpit for workflow stage, next action, gates, evidence lineage, review state, and operations state.",
        mutationAuthority: "none"
      },
      {
        id: "hermes",
        label: "Hermes",
        role: "Runtime backplane for sessions, sleep routines, scheduler evidence, memory review, mail, and background coordination.",
        mutationAuthority: "reviewed-external"
      },
      {
        id: "notebooklm",
        label: "NotebookLM",
        role: "Source-grounded research input whose reviewed exports are imported as preserved evidence.",
        mutationAuthority: "reviewed-external"
      },
      {
        id: "gbrain",
        label: "GBrain",
        role: "Advisory semantic memory for evidence search and review context; not approval or verification proof.",
        mutationAuthority: "none"
      },
      {
        id: "ariadne-runner",
        label: "ariadne runner",
        role: "Expert automation surface for refreshing artifacts, importing evidence, and executing approved mutation plans.",
        mutationAuthority: "approved-mutation-only"
      }
    ]
  };
}

function projectWorkflowStages(data: ConsoleWorkflowInput): ConsoleWorkflow["stages"] {
  const failedChecks = data.checks.filter((check) => check.status === "failed").length;
  const passedChecks = data.checks.filter((check) => check.status === "passed").length;
  const failedBrowserChecks = data.consoleBrowserChecks?.summary.failed ?? 0;
  const latestRun = data.executionRuns.at(-1);
  const hasPlaywrightEvidence = data.playwrightEvidence.length > 0 || Boolean(data.consoleBrowserChecks);
  const reviewStatus = data.summary.roadmapCompletionStatus ?? data.summary.liveAdapterReviewSessionStatus ?? "pending";
  const operateStatus =
    data.summary.hermesCronSnapshots > 0 || data.summary.localRuntimeProbes > 0 || data.summary.deploymentSnapshots > 0
      ? "ready"
      : "pending";

  return [
    {
      id: "capture",
      label: "Capture",
      status: data.summary.sources > 0 ? "complete" : "missing",
      detail: `${data.summary.sources} source file(s), ${data.summary.extractionResults} extraction result(s).`,
      proofRef: data.artifacts.hotIndex ?? "HOT_INDEX.md"
    },
    {
      id: "shape",
      label: "Shape",
      status: data.summary.requirements > 0 && data.summary.tasks > 0 ? "complete" : "pending",
      detail: `${data.summary.requirements} requirement(s), ${data.summary.tasks} task(s).`,
      proofRef: data.artifacts.prd ?? data.artifacts.roadmap ?? "requirements and GSD artifacts"
    },
    {
      id: "build",
      label: "Build",
      status: latestRun ? latestRun.status : "pending",
      detail: latestRun ? `${latestRun.taskIds.length} task(s) in latest run.` : "No execution run recorded.",
      proofRef: latestRun?.id ?? data.artifacts.roadmap ?? "execution run"
    },
    {
      id: "verify",
      label: "Verify",
      status: failedChecks > 0 || failedBrowserChecks > 0 ? "failed" : passedChecks > 0 || hasPlaywrightEvidence ? "ready" : "pending",
      detail: `${passedChecks} passed check(s), ${failedChecks} failed check(s), ${failedBrowserChecks} browser failure(s), ${data.playwrightEvidence.length} UI evidence record(s).`,
      proofRef: data.artifacts.consoleBrowserChecks ?? data.artifacts.artifactChecks ?? "verification artifacts"
    },
    {
      id: "review",
      label: "Review",
      status: reviewStatus,
      detail: `${data.summary.pendingApprovals} pending approval(s), ${data.summary.roadmapCompletionBlocked ?? 0} roadmap blocker(s).`,
      proofRef: data.artifacts.roadmapCompletionAudit ?? data.artifacts.liveAdapterReviewSession ?? "review artifacts"
    },
    {
      id: "operate",
      label: "Operate",
      status: operateStatus,
      detail: `${data.summary.hermesCronSnapshots} Hermes snapshot(s), ${data.summary.localRuntimeProbes} runtime probe(s), ${data.summary.deploymentSnapshots} deployment snapshot(s).`,
      proofRef: data.artifacts.localRuntimeProbes ?? "operations artifacts"
    }
  ];
}

function nextBestAction(data: ConsoleWorkflowInput): ConsoleWorkflow["nextAction"] {
  const selectedTarget = selectNextOperatorEvidenceTarget(
    data.liveAdapterOperatorEvidenceQueue,
    data.liveAdapterOperatorEvidenceWorkplan,
    data.liveAdapterOperatorEvidenceAudit
  );
  if (selectedTarget) {
    const queueTarget = data.liveAdapterOperatorEvidenceQueue?.targets.find(
      (target) => target.target === selectedTarget.target
    );
    return {
      id: `operator-evidence-${selectedTarget.target}`,
      title: `${selectedTarget.target} operator evidence`,
      status: selectedTarget.status,
      detail: `${selectedTarget.missingSections} missing section(s). ${selectedTarget.nextAction ?? "Review operator evidence."}`,
      artifactRef:
        queueTarget?.evidenceRefs[0] ??
        queueTarget?.templateRef ??
        data.artifacts.liveAdapterOperatorEvidenceQueue ??
        "control/live-adapter-operator-evidence-queue.json",
      command: `npm run ariadne -- live-adapter-operator-evidence-next --project ${data.project} --target ${selectedTarget.target}`,
      source: "operator-evidence-queue"
    };
  }

  const blockedRequirement = data.roadmapCompletionAudit?.requirements.find((requirement) => requirement.status === "blocked");
  if (blockedRequirement) {
    return {
      id: `roadmap-${blockedRequirement.id}`,
      title: blockedRequirement.id,
      status: blockedRequirement.status,
      detail: blockedRequirement.detail,
      artifactRef: data.artifacts.roadmapCompletionAudit ?? "control/roadmap-completion-audit.md",
      source: "roadmap-completion-audit"
    };
  }

  if ((data.readiness?.missing.length ?? 0) > 0) {
    return {
      id: "merge-readiness",
      title: "Merge readiness gates",
      status: data.summary.readinessStatus ?? "blocked",
      detail: data.readiness?.missing[0] ?? "A merge-readiness gate is missing.",
      artifactRef: data.artifacts.control ?? "control/merge-readiness.md",
      source: "merge-readiness"
    };
  }

  return {
    id: "ready-for-next-slice",
    title: "Ready for next slice",
    status: "ready",
    detail: "Current artifacts do not expose a blocking action.",
    artifactRef: data.artifacts.hotIndex ?? "HOT_INDEX.md",
    source: "workflow-fallback"
  };
}
