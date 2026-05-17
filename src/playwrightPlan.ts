import { readJsonArtifact, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { loadPrd } from "./prd.js";
import { slugifyProject } from "./paths.js";
import type { PlaywrightEvidencePlan } from "./types.js";

interface GeneratePlaywrightOptions {
  project: string;
  vaultRoot: string;
  targetUrl?: string;
}

export async function generatePlaywrightPlan(options: GeneratePlaywrightOptions): Promise<{
  jsonPath: string;
  markdownPath: string;
  specPath: string;
  plan: PlaywrightEvidencePlan;
}> {
  const project = slugifyProject(options.project);
  const prd = await loadPrd(options.vaultRoot, project);
  const targetUrl = options.targetUrl ?? "http://localhost:3000";
  const plan: PlaywrightEvidencePlan = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    targetUrl,
    scenarios: prd.requirements.map((requirement) => ({
      id: `PW-${requirement.id.replace("REQ-", "")}`,
      title: requirement.title,
      requirementIds: [requirement.id],
      assertions: requirement.acceptance.slice(0, 3)
    }))
  };

  const jsonPath = await writeJsonArtifact(options.vaultRoot, project, "verification", "playwright-plan.json", plan);
  const markdownPath = await writeTextArtifact(
    options.vaultRoot,
    project,
    "verification",
    "playwright-plan.md",
    renderPlaywrightPlan(plan)
  );
  const specPath = await writeTextArtifact(
    options.vaultRoot,
    project,
    "verification",
    "generated.playwright.spec.ts",
    renderPlaywrightSpec(plan)
  );

  return { jsonPath, markdownPath, specPath, plan };
}

export async function loadPlaywrightPlan(
  vaultRoot: string,
  project: string
): Promise<PlaywrightEvidencePlan> {
  return readJsonArtifact<PlaywrightEvidencePlan>(vaultRoot, project, "verification", "playwright-plan.json");
}

function renderPlaywrightPlan(plan: PlaywrightEvidencePlan): string {
  const scenarios = plan.scenarios.map((scenario) =>
    [
      `## ${scenario.id}: ${scenario.title}`,
      "",
      `Requirements: ${scenario.requirementIds.join(", ")}`,
      "",
      "Assertions:",
      ...scenario.assertions.map((assertion) => `- ${assertion}`),
      ""
    ].join("\n")
  );

  return [
    `# Playwright Evidence Plan: ${plan.project}`,
    "",
    `Generated: ${plan.generatedAt}`,
    `Target URL: ${plan.targetUrl}`,
    "",
    ...scenarios,
    "## Evidence To Capture",
    "",
    "- Playwright trace archive",
    "- screenshot on failure",
    "- accessibility tree snapshot where a locator is repaired",
    "- generated test diff and review note before accepting healer changes",
    ""
  ].join("\n");
}

function testName(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function renderPlaywrightSpec(plan: PlaywrightEvidencePlan): string {
  const scenarios = plan.scenarios.map((scenario) => ({
    id: scenario.id,
    title: scenario.title,
    requirementIds: scenario.requirementIds,
    assertions: scenario.assertions
  }));

  return [
    "import { expect, test } from '@playwright/test';",
    "",
    "// Generated from Ariadne requirements. Add app-specific locators before using as a release gate.",
    `const TARGET_URL = process.env.PLAYWRIGHT_TARGET_URL;`,
    `if (!TARGET_URL) throw new Error(${JSON.stringify(`PLAYWRIGHT_TARGET_URL is required. Suggested target: ${plan.targetUrl}`)});`,
    "",
    `const scenarios = ${JSON.stringify(scenarios, null, 2)} as const;`,
    "",
    "for (const scenario of scenarios) {",
    "  test(`${scenario.id} ${scenario.title}`, async ({ page }) => {",
    "    await page.goto(TARGET_URL);",
    "    const documentRoot = page.locator('main, [role=\"main\"], body').first();",
    "    await expect(documentRoot).toBeVisible();",
    "    await expect(documentRoot).toContainText(/\\S/);",
    "    expect(scenario.assertions.length).toBeGreaterThan(0);",
    "    test.info().annotations.push({ type: 'requirements', description: scenario.requirementIds.join(', ') });",
    "    test.info().annotations.push({ type: 'ariadne-assertions', description: scenario.assertions.join(' | ') });",
    "  });",
    "}",
    ""
  ].join("\n");
}
