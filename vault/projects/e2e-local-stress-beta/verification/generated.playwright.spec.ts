import { expect, test } from '@playwright/test';

// Generated from Ariadne requirements. Add app-specific locators before using as a release gate.
const TARGET_URL = process.env.PLAYWRIGHT_TARGET_URL;
if (!TARGET_URL) throw new Error("PLAYWRIGHT_TARGET_URL is required. Suggested target: http://127.0.0.1:9119");

const scenarios = [
  {
    "id": "PW-001",
    "title": "Source evidence intake",
    "requirementIds": [
      "REQ-001"
    ],
    "assertions": [
      "Raw artifacts are copied into the durable vault.",
      "Each artifact has a digest, source path, kind, and timestamp.",
      "Extracted text remains linked to the raw evidence."
    ]
  },
  {
    "id": "PW-002",
    "title": "Source-grounded PRD synthesis",
    "requirementIds": [
      "REQ-002"
    ],
    "assertions": [
      "PRD records source references for every major claim.",
      "Ambiguities are separated from accepted requirements.",
      "Manual exports work before automation is attempted."
    ]
  },
  {
    "id": "PW-003",
    "title": "GSD2 task bridge",
    "requirementIds": [
      "REQ-003"
    ],
    "assertions": [
      "Tasks are independently inspectable as JSON and Markdown.",
      "Each task names expected write areas and verification commands.",
      "Tasks preserve requirement traceability."
    ]
  },
  {
    "id": "PW-004",
    "title": "Bounded execution loop",
    "requirementIds": [
      "REQ-004"
    ],
    "assertions": [
      "Execution runs are recorded before work begins.",
      "The system can identify planned worktrees and gates.",
      "External mutations remain blocked unless a later approved adapter is enabled."
    ]
  },
  {
    "id": "PW-005",
    "title": "Playwright UI verification evidence",
    "requirementIds": [
      "REQ-005"
    ],
    "assertions": [
      "Generated tests use role-oriented locators where possible.",
      "Scenario records link back to requirement ids.",
      "Evidence paths are recorded separately from claims."
    ]
  },
  {
    "id": "PW-006",
    "title": "Review and CI control plane",
    "requirementIds": [
      "REQ-006"
    ],
    "assertions": [
      "Merge readiness lists satisfied and missing gates.",
      "CI and review records are imported without being treated as hidden authority.",
      "Blocked states are explicit."
    ]
  },
  {
    "id": "PW-007",
    "title": "Infrastructure substrate registry",
    "requirementIds": [
      "REQ-007"
    ],
    "assertions": [
      "Infrastructure records are readable without model calls.",
      "Runner trust boundaries are explicit.",
      "Mutation plans require approval and remain non-executing in this slice."
    ]
  }
] as const;

for (const scenario of scenarios) {
  test(`${scenario.id} ${scenario.title}`, async ({ page }) => {
    await page.goto(TARGET_URL);
    const documentRoot = page.locator('main, [role="main"], body').first();
    await expect(documentRoot).toBeVisible();
    await expect(documentRoot).toContainText(/\S/);
    expect(scenario.assertions.length).toBeGreaterThan(0);
    test.info().annotations.push({ type: 'requirements', description: scenario.requirementIds.join(', ') });
    test.info().annotations.push({ type: 'ariadne-assertions', description: scenario.assertions.join(' | ') });
  });
}
