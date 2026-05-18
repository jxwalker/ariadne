import type {
  LiveAdapterOperatorEvidenceAudit,
  LiveAdapterOperatorEvidenceQueue,
  LiveAdapterOperatorEvidenceWorkplan
} from "./types.js";

export type OperatorEvidenceTarget = LiveAdapterOperatorEvidenceQueue["targets"][number]["target"];

export interface NextOperatorEvidenceTarget {
  target: OperatorEvidenceTarget;
  status:
    | LiveAdapterOperatorEvidenceQueue["targets"][number]["status"]
    | LiveAdapterOperatorEvidenceWorkplan["targets"][number]["status"]
    | LiveAdapterOperatorEvidenceAudit["targets"][number]["status"];
  missingSections: number;
  nextAction?: string;
}

export function selectNextOperatorEvidenceTarget(
  queue: LiveAdapterOperatorEvidenceQueue | undefined,
  workplan: LiveAdapterOperatorEvidenceWorkplan | undefined,
  audit: LiveAdapterOperatorEvidenceAudit | undefined
): NextOperatorEvidenceTarget | undefined {
  const queueTargets = orderedTargets(Array.isArray(queue?.targets) ? queue.targets : []);
  const workplanTargets = orderedTargets(Array.isArray(workplan?.targets) ? workplan.targets : []);
  const auditTargets = orderedTargets(Array.isArray(audit?.targets) ? audit.targets : []);
  const priority: Array<LiveAdapterOperatorEvidenceQueue["targets"][number]["status"]> = [
    "ready_for_import",
    "needs_rework",
    "needs_evidence",
    "unchecked"
  ];
  for (const status of priority) {
    const target = queueTargets.find((item) => item.status === status);
    if (target) {
      return {
        target: target.target,
        status: target.status,
        missingSections: target.latestCheckMissingSections ?? target.missingSections.length,
        nextAction: target.nextAction
      };
    }
  }

  const workplanTarget = workplanTargets.find((target) => target.status !== "complete");
  if (workplanTarget) {
    return {
      target: workplanTarget.target,
      status: workplanTarget.status,
      missingSections: workplanTarget.missingSections.length,
      nextAction: workplanTarget.firstAction
    };
  }

  const auditTarget = auditTargets.find((target) => target.status !== "complete");
  if (auditTarget) {
    return {
      target: auditTarget.target,
      status: auditTarget.status,
      missingSections: auditTarget.missingSections.length,
      nextAction: auditTarget.blockers[0] ?? auditFallbackNextAction(auditTarget)
    };
  }
  return undefined;
}

export function nextOperatorEvidenceCommands(project: string, target: OperatorEvidenceTarget): string[] {
  return [
    `npm run ariadne -- live-adapter-operator-evidence-next --project ${project} --target ${target}`,
    `npm run ariadne -- live-adapter-operator-evidence-workspace --project ${project} --target ${target}`,
    `npm run ariadne -- live-adapter-operator-evidence-assist --project ${project} --target ${target}`,
    `npm run ariadne -- live-adapter-operator-evidence-draft --project ${project} --target ${target}`,
    `npm run ariadne -- live-adapter-operator-evidence-check-all --project ${project} --source workspace --target ${target}`,
    `npm run ariadne -- live-adapter-operator-evidence-import-ready --project ${project} --by <operator> --target ${target}`,
    `npm run ariadne -- live-adapter-review-session --project ${project} --target ${target}`,
    `npm run ariadne -- live-adapter-cutover-audit --project ${project} --target ${target}`
  ];
}

function orderedTargets<T extends { target: string }>(targets: T[]): T[] {
  return [...targets].sort((left, right) => left.target.localeCompare(right.target));
}

function auditFallbackNextAction(target: LiveAdapterOperatorEvidenceAudit["targets"][number]): string {
  const missingSection = target.missingSections[0];
  if (missingSection) return `Collect missing operator evidence section: ${missingSection}.`;
  return `Review operator evidence for ${target.target}.`;
}
