import type { HumanVerificationWorksheetRow } from "./types.js";

export function renderHumanVerificationWorksheetTable(items: HumanVerificationWorksheetRow[]): string[] {
  return [
    "| Missing section | Human verification prompt | Existing refs | Promoted live evidence | GBrain queries |",
    "| --- | --- | ---: | ---: | ---: |",
    ...(items.length === 0
      ? [
          "| none | No missing sections. Confirm the imported operator record remains current before relying on it. | 0 | 0 | 0 |"
        ]
      : items.map(
          (item) =>
            `| ${markdownCell(item.missingSection)} | ${markdownCell(item.humanVerificationPrompt)} | ${item.existingEvidenceRefs.length} | ${item.promotedLiveEvidenceRefs.length} | ${item.gbrainQueries.length} |`
        ))
  ];
}

export function renderHumanVerificationFillOrder(items: HumanVerificationWorksheetRow[]): string[] {
  return [
    "| Step | Missing section | Start with | Record verified observation in | Preflight check |",
    "| ---: | --- | --- | --- | --- |",
    ...(items.length === 0
      ? ["| 1 | none | No missing sections. | Keep the current imported evidence record under review. | Rerun the target check before cutover. |"]
      : items.map((item, index) => {
          const guidance = guidanceForHumanVerificationSection(item.missingSection);
          return `| ${index + 1} | ${markdownCell(item.missingSection)} | ${markdownCell(guidance.startWith)} | ${markdownCell(guidance.recordIn)} | ${markdownCell(guidance.preflight)} |`;
        }))
  ];
}

export function renderHumanVerificationReferenceDetails(items: HumanVerificationWorksheetRow[]): string[] {
  if (items.length === 0) return ["- none"];
  const existingEvidenceRefs = unique(items.flatMap((item) => item.existingEvidenceRefs));
  const promotedLiveEvidenceRefs = unique(items.flatMap((item) => item.promotedLiveEvidenceRefs));
  const gbrainQueries = unique(items.flatMap((item) => item.gbrainQueries));
  return [
    "### Common References",
    "",
    "Existing refs:",
    ...markdownList(existingEvidenceRefs),
    "",
    "Promoted live evidence refs:",
    ...markdownList(promotedLiveEvidenceRefs),
    "",
    "GBrain queries:",
    ...markdownList(gbrainQueries),
    "",
    "### Section-Specific Prompts",
    "",
    ...items.flatMap((item) => [
      `#### ${markdownCell(item.missingSection)}`,
      "",
      `Prompt: ${markdownCell(item.humanVerificationPrompt)}`,
      ""
    ])
  ];
}

export function markdownCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, " ");
}

export function guidanceForHumanVerificationSection(section: string): { startWith: string; recordIn: string; preflight: string } {
  const normalized = section.toLowerCase();
  if (normalized.includes("operator identity") || normalized.includes("timestamp")) {
    return {
      startWith: "operator-evidence.md header plus current source-system timestamp",
      recordIn: "operator-evidence.md",
      preflight: "Confirm the operator and timestamp fields are real values."
    };
  }
  if (normalized.includes("approval packet") || normalized.includes("confirm-plan")) {
    return {
      startWith: "packet-review.md, approval pack, and approval-review audit",
      recordIn: "operator-evidence.md approval/confirm-plan sections",
      preflight: "Confirm approval remains bounded and non-stale."
    };
  }
  if (
    normalized.includes("authentication") ||
    normalized.includes("authorization") ||
    normalized.includes("auth boundary")
  ) {
    return {
      startWith: "auth-boundary.md, mutation-readiness audit, and target dossier",
      recordIn: "operator-evidence.md authentication boundary section",
      preflight: "Confirm credentials, scope, and host/user boundary are explicit."
    };
  }
  if (normalized.includes("bounded action")) {
    return {
      startWith: "target dossier, approval pack, and mutation-readiness repair plan",
      recordIn: "operator-evidence.md bounded action section",
      preflight: "Confirm the exact target and allowed operation are narrow."
    };
  }
  if (normalized.includes("rollback") || normalized.includes("post-action")) {
    return {
      startWith: "rollback-post-verify.md and cutover audit",
      recordIn: "operator-evidence.md rollback/post-action verification sections",
      preflight: "Confirm rollback and verification commands are runnable before mutation."
    };
  }
  if (normalized.includes("dry-run") || normalized.includes("target-guarded")) {
    return {
      startWith: "dry-run-review.md, target dossier, and command wrapper evidence",
      recordIn: "operator-evidence.md dry-run/target-guarded wrapper sections",
      preflight: "Confirm dry-run output is safe and the wrapper rejects wrong targets."
    };
  }
  return {
    startWith: "read-only-assist.md and the listed evidence refs",
    recordIn: "operator-evidence.md",
    preflight: "Rerun the target check after adding verified observations."
  };
}

function markdownList(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}
