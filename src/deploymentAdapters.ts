import fs from "node:fs/promises";
import path from "node:path";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { DeploymentSnapshot } from "./types.js";

export async function importDeploymentSnapshot(input: {
  project: string;
  vaultRoot: string;
  sourcePath: string;
  system: DeploymentSnapshot["system"];
}): Promise<{ jsonPath: string; markdownPath: string; snapshot: DeploymentSnapshot }> {
  const project = slugifyProject(input.project);
  const sourcePath = path.resolve(input.sourcePath);
  const raw = JSON.parse(await fs.readFile(sourcePath, "utf8")) as unknown;
  const importedAt = new Date();
  const snapshot: DeploymentSnapshot = {
    schemaVersion: 1,
    project,
    importedAt: importedAt.toISOString(),
    sourcePath: portablePath(input.vaultRoot, project, sourcePath),
    system: input.system,
    mode: "read_only",
    summary: summarise(raw),
    raw
  };
  const name = `deployment-${input.system}-${timestampFile(importedAt)}`;
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "deployment", `${name}.json`, snapshot);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "deployment", `${name}.md`, renderSnapshot(snapshot));
  return { jsonPath, markdownPath, snapshot };
}

function portablePath(vaultRoot: string, project: string, filePath: string): string {
  const workspaceRoot = path.dirname(vaultRoot);
  const root = projectDir(vaultRoot, project);
  if (filePath.startsWith(root)) return filePath.split(root).join("<PROJECT_ROOT>");
  if (filePath.startsWith(vaultRoot)) return filePath.split(vaultRoot).join("<VAULT_ROOT>");
  if (filePath.startsWith(workspaceRoot)) return filePath.split(workspaceRoot).join("<WORKSPACE_ROOT>");
  return `<EXTERNAL_SOURCE>/${path.basename(filePath)}`;
}

export function deploymentSystemOption(value: string): DeploymentSnapshot["system"] {
  if (
    value === "proxmox" ||
    value === "truenas" ||
    value === "dgx-spark" ||
    value === "mac" ||
    value === "github" ||
    value === "generic"
  ) {
    return value;
  }
  throw new Error("--system must be proxmox, truenas, dgx-spark, mac, github, or generic.");
}

function summarise(raw: unknown): DeploymentSnapshot["summary"] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      keys: [],
      services: 0,
      modelEndpoints: 0,
      runnerPools: 0,
      storagePools: 0
    };
  }

  const obj = raw as Record<string, unknown>;
  return {
    keys: Object.keys(obj).sort(),
    host: stringNested(obj, ["host", "short_name"]) ?? stringNested(obj, ["host", "name"]) ?? stringValue(obj.host),
    services: countArray(obj.services) + countArray(obj.vms) + countArray(obj.containers),
    modelEndpoints: countArray(obj.modelEndpoints) + countArray(obj.model_endpoints),
    runnerPools: countArray(obj.runnerPools) + countArray(obj.runner_pools),
    storagePools: countArray(obj.storagePools) + countArray(obj.storage_pools) + countArray(obj.pools)
  };
}

function countArray(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function stringNested(obj: Record<string, unknown>, parts: string[]): string | undefined {
  let current: unknown = obj;
  for (const part of parts) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return stringValue(current);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function renderSnapshot(snapshot: DeploymentSnapshot): string {
  return [
    `# Deployment Snapshot: ${snapshot.system}`,
    "",
    `Mode: ${snapshot.mode}`,
    `Imported: ${snapshot.importedAt}`,
    `Source: ${snapshot.sourcePath}`,
    "",
    "## Summary",
    "",
    "```json",
    JSON.stringify(snapshot.summary, null, 2),
    "```",
    ""
  ].join("\n");
}
