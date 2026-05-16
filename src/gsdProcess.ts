import { execFileSync } from "node:child_process";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { slugifyProject } from "./paths.js";
import type { Gsd2ProcessSnapshot } from "./types.js";

export async function collectGsd2ProcessSnapshot(input: {
  project: string;
  vaultRoot: string;
  binary?: string;
}): Promise<{ jsonPath: string; markdownPath: string; snapshot: Gsd2ProcessSnapshot }> {
  const project = slugifyProject(input.project);
  const importedAt = new Date();
  const binary = input.binary ?? "gsd";
  const version = run(binary, ["--version"]).trim();
  const list = run(binary, ["list"]).trim();
  const help = run(binary, ["--help"]);
  const snapshot: Gsd2ProcessSnapshot = {
    schemaVersion: 1,
    project,
    importedAt: importedAt.toISOString(),
    mode: "read_only",
    binary,
    version,
    packageCount: packageLines(list).length,
    packages: packageLines(list),
    supportedModes: supportedModes(help),
    subcommands: subcommands(help),
    warnings: warnings(version, help),
    raw: {
      version,
      list,
      help
    }
  };
  const name = `gsd2-process-${timestampFile(importedAt)}`;
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "gsd/process", `${name}.json`, snapshot);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "gsd/process", `${name}.md`, renderSnapshot(snapshot));
  return { jsonPath, markdownPath, snapshot };
}

function run(binary: string, args: string[]): string {
  try {
    return execFileSync(binary, args, {
      encoding: "utf8",
      timeout: 10_000,
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to run ${binary} ${args.join(" ")}: ${message}`);
  }
}

function packageLines(output: string): string[] {
  if (!output || /no packages installed/i.test(output)) return [];
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function supportedModes(help: string): string[] {
  const match = help.match(/--mode\s+<([^>]+)>/);
  if (!match?.[1]) return [];
  return match[1]
    .split("|")
    .map((mode) => mode.trim())
    .filter(Boolean);
}

function subcommands(help: string): string[] {
  const lines = help.split("\n");
  const start = lines.findIndex((line) => line.trim() === "Subcommands:");
  if (start === -1) return [];
  return lines
    .slice(start + 1)
    .map((line) => line.trim())
    .filter((line) => /^[a-z][a-z-]*/.test(line))
    .map((line) => line.split(/\s+/)[0]!)
    .filter(Boolean);
}

function warnings(version: string, help: string): string[] {
  const values: string[] = [];
  if (!version) values.push("GSD did not return a version.");
  if (!help.includes("headless")) values.push("GSD help does not expose a headless command.");
  values.push("Snapshot is read-only; Ariadne did not run GSD headless, auto, install, update, worktree, or model commands.");
  return values;
}

function renderSnapshot(snapshot: Gsd2ProcessSnapshot): string {
  return [
    "# GSD2 Process Snapshot",
    "",
    `Imported: ${snapshot.importedAt}`,
    `Mode: ${snapshot.mode}`,
    `Binary: ${snapshot.binary}`,
    `Version: ${snapshot.version}`,
    "",
    "## Supported Modes",
    "",
    ...list(snapshot.supportedModes),
    "",
    "## Subcommands",
    "",
    ...list(snapshot.subcommands),
    "",
    "## Packages",
    "",
    ...list(snapshot.packages),
    "",
    "## Warnings",
    "",
    ...list(snapshot.warnings),
    ""
  ].join("\n");
}

function list(items: string[]): string[] {
  return items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);
}
