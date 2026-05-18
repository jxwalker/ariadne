import { describe, expect, it } from "vitest";
import {
  nextOperatorEvidenceCommands,
  selectNextOperatorEvidenceTarget
} from "../src/liveAdapterOperatorEvidenceNextTarget.js";
import type {
  LiveAdapterOperatorEvidenceAudit,
  LiveAdapterOperatorEvidenceQueue,
  LiveAdapterOperatorEvidenceWorkplan
} from "../src/types.js";

describe("live adapter operator evidence next target", () => {
  it("prioritizes queue targets by import readiness, then status priority and target name", () => {
    const queue: LiveAdapterOperatorEvidenceQueue = {
      schemaVersion: 1,
      project: "ariadne",
      generatedAt: "2026-05-17T00:00:00.000Z",
      status: "evidence_required",
      mutationApproved: false,
      operatorEvidenceAuditRef: "control/live-adapter-operator-evidence-audit.json",
      workplanRef: "control/live-adapter-operator-evidence-workplan.json",
      summary: {
        targets: 3,
        completeTargets: 0,
        readyForImport: 1,
        needsEvidence: 1,
        needsRework: 1,
        uncheckedTargets: 0,
        latestChecks: 2
      },
      targets: [
        queueTarget("github", "needs_rework", 4),
        queueTarget("deployment", "ready_for_import", 0),
        queueTarget("gsd2", "needs_evidence", 9)
      ]
    };

    const selected = selectNextOperatorEvidenceTarget(queue, undefined, undefined);

    expect(selected).toEqual({
      target: "deployment",
      status: "ready_for_import",
      missingSections: 0,
      nextAction: "Import the complete preflighted operator evidence file."
    });
  });

  it("falls back from workplan to audit and always returns an audit next action", () => {
    const workplan: LiveAdapterOperatorEvidenceWorkplan = {
      schemaVersion: 1,
      project: "ariadne",
      generatedAt: "2026-05-17T00:00:00.000Z",
      status: "ready_for_review",
      mutationApproved: false,
      operatorEvidenceAuditRef: "control/live-adapter-operator-evidence-audit.json",
      reviewSessionRef: "control/live-adapter-review-session.json",
      evidenceTemplatesRef: "control/live-adapter-evidence-templates.json",
      cutoverAuditRef: "control/live-adapter-cutover-audit.json",
      summary: {
        targets: 1,
        completeTargets: 1,
        missingTargets: 0,
        incompleteTargets: 0,
        checkCommands: 0,
        importCommands: 0,
        gbrainQueries: 0
      },
      targets: [
        {
          target: "github",
          status: "complete",
          templateRef: "control/operator-evidence/github/template.md",
          checkCommand: "check github",
          importCommand: "import github",
          reviewCommand: "review github",
          missingSections: [],
          requiredEvidence: [],
          cutoverBlockers: [],
          gbrainQueries: [],
          evidenceRefs: []
        }
      ]
    };
    const audit: LiveAdapterOperatorEvidenceAudit = {
      schemaVersion: 1,
      project: "ariadne",
      generatedAt: "2026-05-17T00:00:00.000Z",
      status: "blocked",
      mutationApproved: false,
      summary: {
        targets: 1,
        records: 0,
        completeTargets: 0,
        incompleteTargets: 0,
        missingTargets: 1,
        missingSections: 1,
        advisoryWarnings: 0
      },
      targets: [
        {
          target: "deployment",
          status: "missing_evidence",
          recordCount: 0,
          missingSections: ["packet review"],
          advisoryWarnings: [],
          blockers: [],
          evidenceRefs: []
        }
      ]
    };

    const selected = selectNextOperatorEvidenceTarget(undefined, workplan, audit);

    expect(selected).toEqual({
      target: "deployment",
      status: "missing_evidence",
      missingSections: 1,
      nextAction: "Collect missing operator evidence section: packet review."
    });
  });

  it("builds the target-scoped operator command sequence", () => {
    expect(nextOperatorEvidenceCommands("ariadne", "hermes-cron")).toEqual([
      "npm run ariadne -- live-adapter-operator-evidence-next --project ariadne --target hermes-cron",
      "npm run ariadne -- live-adapter-operator-evidence-workspace --project ariadne --target hermes-cron",
      "npm run ariadne -- live-adapter-operator-evidence-assist --project ariadne --target hermes-cron",
      "npm run ariadne -- live-adapter-operator-evidence-draft --project ariadne --target hermes-cron",
      "npm run ariadne -- live-adapter-operator-evidence-check-all --project ariadne --source workspace --target hermes-cron",
      "npm run ariadne -- live-adapter-operator-evidence-import-ready --project ariadne --by <operator> --target hermes-cron",
      "npm run ariadne -- live-adapter-review-session --project ariadne --target hermes-cron",
      "npm run ariadne -- live-adapter-cutover-audit --project ariadne --target hermes-cron"
    ]);
  });
});

function queueTarget(
  target: LiveAdapterOperatorEvidenceQueue["targets"][number]["target"],
  status: LiveAdapterOperatorEvidenceQueue["targets"][number]["status"],
  missingSections: number
): LiveAdapterOperatorEvidenceQueue["targets"][number] {
  return {
    target,
    status,
    operatorEvidenceStatus: status === "complete" ? "complete" : "incomplete",
    latestCheckId: `${target}-check`,
    latestCheckRef: `control/operator-evidence-checks/${target}.json`,
    latestCheckStatus: missingSections === 0 ? "complete" : "incomplete",
    latestCheckMissingSections: missingSections,
    missingSections: Array.from({ length: missingSections }, (_, index) => `section ${index + 1}`),
    nextAction: status === "ready_for_import" ? "Import the complete preflighted operator evidence file." : "Fill evidence.",
    checkCommand: `check ${target}`,
    importCommand: `import ${target}`,
    templateRef: `control/operator-evidence/${target}/template.md`,
    evidenceRefs: []
  };
}
