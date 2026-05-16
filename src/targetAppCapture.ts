import fs from "node:fs/promises";
import path from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";
import { ensureArtifactDir, timestampFile } from "./artifacts.js";
import { slugifyProject } from "./paths.js";
import { recordPlaywrightEvidence } from "./playwrightEvidence.js";
import type { PlaywrightEvidenceRecord } from "./types.js";

type WaitUntil = "load" | "domcontentloaded" | "networkidle";

export async function captureTargetAppEvidence(input: {
  project: string;
  vaultRoot: string;
  targetUrl: string;
  selector?: string;
  width?: number;
  height?: number;
  waitUntil?: WaitUntil;
  waitMs?: number;
  notes?: string;
}): Promise<{
  evidence: PlaywrightEvidenceRecord;
  jsonPath: string;
  markdownPath: string;
  screenshotPath?: string;
  tracePath?: string;
}> {
  const project = slugifyProject(input.project);
  const generatedAt = new Date();
  const artifactDir = await ensureArtifactDir(input.vaultRoot, project, "verification/playwright-captures");
  const baseName = `target-${timestampFile(generatedAt)}`;
  const screenshotPath = path.join(artifactDir, `${baseName}.png`);
  const tracePath = path.join(artifactDir, `${baseName}.zip`);
  const width = input.width ?? 1440;
  const height = input.height ?? 1000;
  let status: PlaywrightEvidenceRecord["status"] = "passed";
  const notes: string[] = [
    input.notes ?? "Captured target app screenshot and Playwright trace.",
    `Viewport: ${width}x${height}`,
    `Wait until: ${input.waitUntil ?? "load"}`
  ];
  let capturedScreenshot: string | undefined;
  let capturedTrace: string | undefined;

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    const page = await context.newPage();

    try {
      await page.goto(input.targetUrl, { waitUntil: input.waitUntil ?? "load", timeout: 30_000 });
      if (input.waitMs !== undefined && input.waitMs > 0) {
        await page.waitForTimeout(input.waitMs);
      }
      if (input.selector) {
        const visible = await page.locator(input.selector).first().isVisible({ timeout: 10_000 });
        if (!visible) {
          throw new Error(`Selector was not visible: ${input.selector}`);
        }
        notes.push(`Selector visible: ${input.selector}`);
      }
      capturedScreenshot = await captureScreenshot(page, screenshotPath);
    } catch (error) {
      status = "failed";
      notes.push(`Capture error: ${(error as Error).message}`);
      capturedScreenshot = await captureScreenshot(page, screenshotPath).catch(() => undefined);
    } finally {
      capturedTrace = await stopTracing(context, tracePath);
      await context.close().catch(() => undefined);
    }
  } finally {
    await browser.close();
  }

  const result = await recordPlaywrightEvidence({
    project,
    vaultRoot: input.vaultRoot,
    targetUrl: portableTargetUrl(input.targetUrl, input.vaultRoot),
    status,
    tracePath: capturedTrace ? path.relative(input.vaultRoot, capturedTrace) : undefined,
    screenshotPath: capturedScreenshot ? path.relative(input.vaultRoot, capturedScreenshot) : undefined,
    notes: notes.join("\n")
  });

  return {
    ...result,
    evidence: result.record,
    screenshotPath: capturedScreenshot,
    tracePath: capturedTrace
  };
}

function portableTargetUrl(targetUrl: string, vaultRoot: string): string {
  const vaultFileUrl = `file://${vaultRoot}`;
  if (targetUrl.startsWith(vaultFileUrl)) {
    return targetUrl.replace(vaultFileUrl, "file://<VAULT_ROOT>");
  }
  return targetUrl;
}

export function waitUntilOption(value: string | undefined): WaitUntil | undefined {
  if (value === undefined || value === "") return undefined;
  if (value === "load" || value === "domcontentloaded" || value === "networkidle") return value;
  throw new Error("--wait-until must be load, domcontentloaded, or networkidle.");
}

async function captureScreenshot(page: Page, screenshotPath: string): Promise<string> {
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const stat = await fs.stat(screenshotPath);
  if (stat.size <= 0) {
    throw new Error(`Screenshot was empty: ${screenshotPath}`);
  }
  return screenshotPath;
}

async function stopTracing(context: BrowserContext, tracePath: string): Promise<string | undefined> {
  try {
    await context.tracing.stop({ path: tracePath });
    const stat = await fs.stat(tracePath);
    return stat.size > 0 ? tracePath : undefined;
  } catch {
    return undefined;
  }
}
