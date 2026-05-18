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

function markdownList(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}
