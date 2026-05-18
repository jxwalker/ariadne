import type { ConsoleData, ConsoleWorkflow } from "./types.js";
import { guidanceForHumanVerificationSection } from "./humanVerificationWorksheetMarkdown.js";
import { selectNextOperatorEvidenceTarget } from "./liveAdapterOperatorEvidenceNextTarget.js";

type ConsoleWorkflowInput = Omit<ConsoleData, "workflow">;

export function buildConsoleWorkflow(data: ConsoleWorkflowInput): ConsoleWorkflow {
  return {
    schemaVersion: 1,
    stages: projectWorkflowStages(data),
    nextAction: nextBestAction(data),
    operatorChecklist: operatorChecklist(data),
    routes: workflowRoutes(data),
    modes: [
      {
        id: "guided",
        label: "Guided",
        audience: "First-time coders and operators who want one clear next step.",
        primarySurface: "ariadne-console",
        supportSurfaces: ["notebooklm", "gbrain"],
        interaction: "Open the console, follow the workflow lane, and use the Next Best Action packet.",
        commandPolicy: "hidden-by-default",
        nextStep: "Follow the visible next action; use generated packets rather than the command reference."
      },
      {
        id: "developer",
        label: "Developer",
        audience: "Experienced builders working on a bounded implementation slice.",
        primarySurface: "ariadne-console",
        supportSurfaces: ["ariadne-runner", "hermes", "gbrain"],
        interaction: "Use the console for state and the runner for refresh, test, evidence import, and review loops.",
        commandPolicy: "shown-as-needed",
        nextStep: "Refresh the artifact that backs the blocked stage, then rerun checks and browser evidence."
      },
      {
        id: "operator",
        label: "Operator",
        audience: "Humans reviewing evidence before Ariadne can touch external systems.",
        primarySurface: "ariadne-console",
        supportSurfaces: ["ariadne-runner", "hermes"],
        interaction: "Fill target evidence workspaces from real systems, preflight them, then record review decisions.",
        commandPolicy: "expert",
        nextStep: "Work one target packet at a time; approval, dry-run, rollback, and verification remain separate gates."
      },
      {
        id: "automation",
        label: "Automation",
        audience: "Background routines, sleep reviews, memory proposals, mail, and scheduled refreshes.",
        primarySurface: "hermes",
        supportSurfaces: ["ariadne-runner", "ariadne-console"],
        interaction: "Hermes runs reviewed routines and feeds Ariadne evidence; Ariadne remains the audit and gate surface.",
        commandPolicy: "background-only",
        nextStep: "Schedule only proposal or refresh jobs until the relevant mutation-readiness gates are approved."
      }
    ],
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

function workflowRoutes(data: ConsoleWorkflowInput): ConsoleWorkflow["routes"] {
  const selectedTarget = selectNextOperatorEvidenceTarget(
    data.liveAdapterOperatorEvidenceQueue,
    data.liveAdapterOperatorEvidenceWorkplan,
    data.liveAdapterOperatorEvidenceAudit
  );
  const operatorRouteCurrent = Boolean(selectedTarget);
  const roadmapBlocked = (data.summary.roadmapCompletionBlocked ?? 0) > 0;
  const verifyBlocked =
    (data.consoleBrowserChecks?.summary.failed ?? 0) > 0 || data.checks.some((check) => check.status === "failed");
  const currentAction = nextBestAction(data);
  return [
    {
      id: "idea-to-system",
      label: "Idea to working system",
      audience: "First-time coders, founders, and operators starting from notes, NotebookLM, drawings, or white papers.",
      current: !operatorRouteCurrent && data.summary.sources === 0,
      primarySurface: "ariadne-console",
      supportSurfaces: ["notebooklm", "gbrain", "ariadne-runner"],
      summary: "Capture source material, shape it into tasks, build a bounded slice, verify it, review it, then operate it.",
      steps: [
        {
          id: "capture-source",
          title: "Capture source material",
          detail: "Import notes, NotebookLM exports, dictated transcripts, drawings, screenshots, white papers, or repo context.",
          stage: "capture",
          surface: "ariadne-console",
          artifactRef: data.artifacts.hotIndex ?? "context/HOT_INDEX.md"
        },
        {
          id: "shape-plan",
          title: "Shape the plan",
          detail: "Generate the PRD, roadmap, task bundle, ambiguity list, and acceptance criteria from preserved evidence.",
          stage: "shape",
          surface: "ariadne-runner",
          artifactRef: data.artifacts.prd ?? data.artifacts.roadmap ?? "requirements and GSD artifacts"
        },
        {
          id: "build-verify-review",
          title: "Build, verify, review",
          detail: "Work a small implementation slice, run deterministic checks and Playwright evidence, then collect reviewer signals.",
          stage: "verify",
          surface: "ariadne-console",
          artifactRef: data.artifacts.consoleBrowserChecks ?? data.artifacts.artifactChecks ?? "verification artifacts"
        }
      ]
    },
    {
      id: "implementation-slice",
      label: "Implementation slice",
      audience: "Experienced developers moving a bounded feature through branch, tests, PR, reviewers, and merge.",
      current: !operatorRouteCurrent && (roadmapBlocked || verifyBlocked),
      primarySurface: "ariadne-console",
      supportSurfaces: ["ariadne-runner", "hermes", "gbrain"],
      summary: "Use the console for state, the runner for refresh and tests, and GitHub reviewers for the ship decision.",
      steps: [
        {
          id: "open-blocker",
          title: "Open the blocker",
          detail: "Start from the Next Best Action and its backing artifact instead of scanning command references.",
          stage: "review",
          surface: "ariadne-console",
          artifactRef: currentAction.artifactRef ?? data.artifacts.roadmapCompletionAudit ?? "current blocker"
        },
        {
          id: "refresh-run-checks",
          title: "Refresh and run checks",
          detail: "Regenerate only the artifacts behind the blocked stage, then run type, unit, build, browser, and visual checks.",
          stage: "verify",
          surface: "ariadne-runner",
          command: `npm run ariadne -- roadmap-control-refresh --project ${data.project}`
        },
        {
          id: "review-merge",
          title: "Review and merge",
          detail: "Push the bounded branch, collect Grok/CodeRabbit feedback, fix actionable items, merge, and prune stale branches.",
          stage: "review",
          surface: "ariadne-console",
          artifactRef: data.artifacts.githubSnapshots ?? "GitHub PR evidence"
        }
      ]
    },
    {
      id: "operator-evidence",
      label: selectedTarget ? `${selectedTarget.target} evidence gate` : "Operator evidence gate",
      audience: "Humans verifying external-system facts before Ariadne can import evidence or execute mutations.",
      current: operatorRouteCurrent,
      primarySurface: "ariadne-console",
      supportSurfaces: ["ariadne-runner", "gbrain"],
      summary: selectedTarget
        ? `Fill ${selectedTarget.missingSections} missing section(s), preflight the workspace, then import only after human verification.`
        : "Fill target evidence workspaces from real systems before cutover or mutation work can proceed.",
      steps: [
        {
          id: "read-packet",
          title: "Read the target packet",
          detail: "Use the packet and read-only assist file to understand what is missing without treating generated text as proof.",
          stage: "review",
          surface: "ariadne-console",
          artifactRef: selectedTarget
            ? `projects/${data.project}/control/live-adapter-operator-evidence-next-${selectedTarget.target}.md`
            : data.artifacts.liveAdapterOperatorEvidenceQueue ?? "operator evidence queue"
        },
        {
          id: "fill-preflight",
          title: "Fill and preflight evidence",
          detail: "Record observations from source systems in operator-evidence.md, then run the target preflight check.",
          stage: "review",
          surface: "ariadne-runner",
          command: selectedTarget
            ? `npm run ariadne -- live-adapter-operator-evidence-check-all --project ${data.project} --source workspace --target ${selectedTarget.target}`
            : undefined
        },
        {
          id: "import-review-cutover",
          title: "Import, review, cutover audit",
          detail: "Import only passing evidence, then refresh the review session and cutover audit before any live adapter work.",
          stage: "operate",
          surface: "ariadne-console",
          artifactRef: data.artifacts.liveAdapterCutoverAudit ?? "live adapter cutover audit"
        }
      ]
    },
    {
      id: "automation-loop",
      label: "Sleep, memory, and automation loop",
      audience: "Operators wiring recurring reviews, memory proposals, mail, and background refresh jobs.",
      current: !operatorRouteCurrent && !roadmapBlocked && (data.summary.hermesCronSnapshots > 0 || data.summary.localRuntimeProbes > 0),
      primarySurface: "hermes",
      supportSurfaces: ["ariadne-console", "ariadne-runner", "gbrain"],
      summary: "Hermes schedules reviewed routines and feeds Ariadne evidence; Ariadne remains the cockpit and gatekeeper.",
      steps: [
        {
          id: "propose-routine",
          title: "Propose the routine",
          detail: "Create sleep, memory, mail, lease, cron, or deployment records as reviewable evidence first.",
          stage: "operate",
          surface: "hermes",
          artifactRef: data.artifacts.hermesCronProposals ?? "coordination artifacts"
        },
        {
          id: "record-evidence",
          title: "Record runtime evidence",
          detail: "Import read-only snapshots, runtime probes, and GBrain reports without granting mutation authority.",
          stage: "operate",
          surface: "ariadne-runner",
          artifactRef: data.artifacts.localRuntimeProbes ?? data.artifacts.hermesCronSnapshots ?? "runtime evidence"
        },
        {
          id: "review-memory",
          title: "Review memory and state",
          detail: "Use GBrain as advisory search context; keep approvals, gates, and deployment state in Ariadne artifacts.",
          stage: "review",
          surface: "gbrain",
          artifactRef: data.artifacts.gbrainExport ?? "GBrain evidence bundle"
        }
      ]
    }
  ];
}

function operatorChecklist(data: ConsoleWorkflowInput): ConsoleWorkflow["operatorChecklist"] {
  const selectedTarget = selectNextOperatorEvidenceTarget(
    data.liveAdapterOperatorEvidenceQueue,
    data.liveAdapterOperatorEvidenceWorkplan,
    data.liveAdapterOperatorEvidenceAudit
  );
  if (!selectedTarget) return undefined;
  const assistTarget = data.liveAdapterOperatorEvidenceAssist?.targets.find(
    (target) => target.target === selectedTarget.target
  );
  const queueTarget = data.liveAdapterOperatorEvidenceQueue?.targets.find((target) => target.target === selectedTarget.target);
  const workplanTarget = data.liveAdapterOperatorEvidenceWorkplan?.targets.find(
    (target) => target.target === selectedTarget.target
  );
  const fallbackMissingSections = queueTarget?.missingSections ?? workplanTarget?.missingSections ?? [];
  const checklistRows =
    assistTarget?.reviewChecklist && assistTarget.reviewChecklist.length > 0
      ? assistTarget.reviewChecklist
      : fallbackMissingSections.map((missingSection) => ({
          missingSection,
          humanVerificationPrompt: `Human operator must verify ${selectedTarget.target} ${missingSection} from source systems or cited Ariadne refs before recording it in operator-evidence.md.`,
          existingEvidenceRefs: workplanTarget?.evidenceRefs ?? queueTarget?.evidenceRefs ?? [],
          promotedLiveEvidenceRefs: [],
          gbrainQueries: workplanTarget?.gbrainQueries ?? [],
          humanVerificationRequired: true as const
        }));
  if (checklistRows.length === 0) return undefined;
  const evidenceFileRef =
    assistTarget?.evidenceFileRef ?? `projects/${data.project}/control/operator-evidence/${selectedTarget.target}/operator-evidence.md`;
  const assistFileRef =
    assistTarget?.assistFileRef ?? `projects/${data.project}/control/operator-evidence/${selectedTarget.target}/read-only-assist.md`;
  return {
    target: selectedTarget.target,
    status: assistTarget?.status ?? queueTarget?.status ?? selectedTarget.status ?? "needs_evidence",
    evidenceFileRef,
    assistFileRef,
    checkCommand:
      assistTarget?.checkCommand ??
      queueTarget?.checkCommand ??
      workplanTarget?.checkCommand ??
      `npm run ariadne -- live-adapter-operator-evidence-check --project ${data.project} --target ${selectedTarget.target} --from vault/${evidenceFileRef}`,
    importCommand:
      assistTarget?.importCommand ??
      queueTarget?.importCommand ??
      workplanTarget?.importCommand ??
      `npm run ariadne -- live-adapter-operator-evidence --project ${data.project} --target ${selectedTarget.target} --from vault/${evidenceFileRef} --by <operator>`,
    missingSections: checklistRows.length,
    sections: checklistRows.map((row) => {
      const guidance = guidanceForHumanVerificationSection(row.missingSection);
      return {
        missingSection: row.missingSection,
        prompt: row.humanVerificationPrompt,
        startWith: guidance.startWith,
        recordIn: guidance.recordIn,
        preflight: guidance.preflight,
        existingEvidenceRefs: row.existingEvidenceRefs,
        promotedLiveEvidenceRefs: row.promotedLiveEvidenceRefs,
        gbrainQueries: row.gbrainQueries
      };
    })
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
      steps: operatorEvidenceActionSteps(data.project, selectedTarget.target),
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
      steps: [
        {
          id: "open-roadmap-audit",
          title: "Open roadmap audit",
          detail: "Read the blocked requirement and follow its next commands.",
          surface: "ariadne-console",
          kind: "read",
          artifactRef: data.artifacts.roadmapCompletionAudit ?? "control/roadmap-completion-audit.md"
        }
      ],
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
      steps: [
        {
          id: "open-readiness-report",
          title: "Open readiness report",
          detail: "Resolve the first missing merge-readiness gate, then regenerate control artifacts.",
          surface: "ariadne-runner",
          kind: "check",
          artifactRef: data.artifacts.control ?? "control/merge-readiness.md",
          command: `npm run ariadne -- control --project ${data.project}`
        }
      ],
      source: "merge-readiness"
    };
  }

  return {
    id: "ready-for-next-slice",
    title: "Ready for next slice",
    status: "ready",
    detail: "Current artifacts do not expose a blocking action.",
    artifactRef: data.artifacts.hotIndex ?? "HOT_INDEX.md",
    steps: [
      {
        id: "choose-next-slice",
        title: "Choose next bounded slice",
        detail: "Use the roadmap and console state to pick the next reviewable implementation slice.",
        surface: "ariadne-console",
        kind: "read",
        artifactRef: data.artifacts.hotIndex ?? "HOT_INDEX.md"
      }
    ],
    source: "workflow-fallback"
  };
}

function operatorEvidenceActionSteps(project: string, target: string): ConsoleWorkflow["nextAction"]["steps"] {
  const operatorEvidenceRef = `projects/${project}/control/operator-evidence/${target}/operator-evidence.md`;
  return [
    {
      id: "open-next-packet",
      title: "Open the target packet",
      detail: "Read the selected target packet before changing evidence files.",
      surface: "ariadne-console",
      kind: "read",
      artifactRef: `projects/${project}/control/live-adapter-operator-evidence-next-${target}.md`,
      command: `npm run ariadne -- live-adapter-operator-evidence-next --project ${project} --target ${target}`
    },
    {
      id: "fill-operator-evidence",
      title: "Fill verified observations",
      detail: "Record only real operator observations in the target operator-evidence.md file.",
      surface: "ariadne-console",
      kind: "fill",
      artifactRef: operatorEvidenceRef,
      command: `npm run ariadne -- live-adapter-operator-evidence-workspace --project ${project} --target ${target}`
    },
    {
      id: "review-assist-and-gbrain",
      title: "Review assist and GBrain context",
      detail: "Use read-only assist refs and advisory GBrain queries as context; do not treat them as proof.",
      surface: "gbrain",
      kind: "review",
      artifactRef: `projects/${project}/control/live-adapter-operator-evidence-assist-${target}.md`,
      command: `npm run ariadne -- live-adapter-operator-evidence-assist --project ${project} --target ${target}`
    },
    {
      id: "preflight-evidence",
      title: "Run preflight",
      detail: "Check the filled workspace without importing evidence or approving mutation.",
      surface: "ariadne-runner",
      kind: "check",
      artifactRef: `projects/${project}/control/live-adapter-operator-evidence-check-all-${target}.md`,
      command: `npm run ariadne -- live-adapter-operator-evidence-check-all --project ${project} --source workspace --target ${target}`
    },
    {
      id: "import-after-human-verification",
      title: "Import only if complete",
      detail: "Import ready evidence only after the human-filled file passes preflight.",
      surface: "ariadne-runner",
      kind: "import",
      artifactRef: operatorEvidenceRef,
      command: `npm run ariadne -- live-adapter-operator-evidence-import-ready --project ${project} --by <operator> --target ${target}`
    },
    {
      id: "review-cutover-state",
      title: "Review cutover state",
      detail: "Refresh the target review session and cutover audit after evidence import.",
      surface: "ariadne-console",
      kind: "review",
      artifactRef: `projects/${project}/control/live-adapter-review-session-${target}.md`,
      command: `npm run ariadne -- live-adapter-review-session --project ${project} --target ${target}`
    },
    {
      id: "audit-cutover",
      title: "Audit live-adapter cutover",
      detail: "Confirm cutover remains blocked or ready before any implementation replaces placeholders.",
      surface: "ariadne-runner",
      kind: "check",
      artifactRef: `projects/${project}/control/live-adapter-cutover-audit-${target}.md`,
      command: `npm run ariadne -- live-adapter-cutover-audit --project ${project} --target ${target}`
    }
  ];
}
