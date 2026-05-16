import fs from "node:fs/promises";
import path from "node:path";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { collectSshInfraSnapshot } from "./liveInventory.js";
import { projectDir, slugifyProject } from "./paths.js";
import type { DeploymentSnapshot, InfraSnapshot } from "./types.js";

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

export async function collectSshDeploymentSnapshot(input: {
  project: string;
  vaultRoot: string;
  system: Exclude<DeploymentSnapshot["system"], "github" | "generic">;
  hostId: string;
  target: string;
  sshBinary?: string;
  notes?: string;
}): Promise<{
  jsonPath: string;
  markdownPath: string;
  snapshot: DeploymentSnapshot;
  infraSnapshotPath: string;
}> {
  const project = slugifyProject(input.project);
  const importedAt = new Date();
  const infra = await collectSshInfraSnapshot({
    project,
    vaultRoot: input.vaultRoot,
    hostId: input.hostId,
    target: input.target,
    sshBinary: input.sshBinary,
    notes: input.notes
  });
  const summary = summariseInfraSnapshot(infra.snapshot, input.system);
  const snapshot: DeploymentSnapshot = {
    schemaVersion: 1,
    project,
    importedAt: importedAt.toISOString(),
    sourcePath: infra.snapshot.sourcePath,
    system: input.system,
    mode: "read_only",
    summary,
    raw: {
      source: "infra-live-ssh",
      sourceInfraSnapshot: infra.snapshot
    }
  };
  const name = `deployment-live-ssh-${input.system}-${slugifyProject(input.hostId)}-${timestampFile(importedAt)}`;
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "deployment", `${name}.json`, snapshot);
  const markdownPath = await writeTextArtifact(input.vaultRoot, project, "deployment", `${name}.md`, renderSnapshot(snapshot));
  return { jsonPath, markdownPath, snapshot, infraSnapshotPath: infra.jsonPath };
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

export function liveDeploymentSystemOption(value: string): Exclude<DeploymentSnapshot["system"], "github" | "generic"> {
  const system = deploymentSystemOption(value);
  if (system === "github" || system === "generic") {
    throw new Error("--system must be proxmox, truenas, dgx-spark, or mac for live SSH deployment collection.");
  }
  return system;
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

function summariseInfraSnapshot(
  snapshot: InfraSnapshot,
  system: Exclude<DeploymentSnapshot["system"], "github" | "generic">
): DeploymentSnapshot["summary"] {
  const raw = objectValue(snapshot.raw);
  const summary = objectValue(snapshot.summary);
  const capabilities = objectValue(raw?.capabilities);
  const capabilityNames = capabilityList(capabilities);
  const evidence = [
    `snapshotKind: ${snapshot.snapshotKind}`,
    raw?.collector ? `collector: ${String(raw.collector)}` : undefined,
    ...capabilityNames.map((capability) => `capability: ${capability}`)
  ].filter((value): value is string => Boolean(value));
  const warnings: string[] = [];
  if (snapshot.snapshotKind !== "live_read_only") {
    warnings.push("Source infrastructure snapshot is not marked live_read_only.");
  }
  if (raw?.collector !== "ssh-posix-read-only") {
    warnings.push("Source infrastructure snapshot was not produced by the SSH read-only collector.");
  }

  const hasDocker = booleanNested(capabilities, "docker");
  const hasProxmox = booleanNested(capabilities, "proxmox");
  const hasZfs = booleanNested(capabilities, "zfs");
  const hasNvidia = booleanNested(capabilities, "nvidiaSmi");
  const profile = profileCounts(system, {
    docker: hasDocker,
    proxmox: hasProxmox,
    zfs: hasZfs,
    nvidiaSmi: hasNvidia
  });

  return {
    keys: ["capabilities", "collector", "hardware", "host", "storage"],
    host: stringValue(summary?.host),
    services: profile.services,
    modelEndpoints: profile.modelEndpoints,
    runnerPools: profile.runnerPools,
    storagePools: profile.storagePools,
    collector: stringValue(raw?.collector),
    sourceSnapshotKind: snapshot.snapshotKind,
    confidence: profile.confidence,
    capabilities: capabilityNames,
    evidence,
    warnings
  };
}

function profileCounts(
  system: Exclude<DeploymentSnapshot["system"], "github" | "generic">,
  capabilities: { docker: boolean; proxmox: boolean; zfs: boolean; nvidiaSmi: boolean }
): Pick<DeploymentSnapshot["summary"], "services" | "modelEndpoints" | "runnerPools" | "storagePools" | "confidence"> {
  if (system === "proxmox") {
    return {
      services: capabilities.proxmox ? 1 : 0,
      modelEndpoints: 0,
      runnerPools: capabilities.docker ? 1 : 0,
      storagePools: capabilities.zfs ? 1 : 0,
      confidence: capabilities.proxmox ? "high" : capabilities.zfs ? "medium" : "low"
    };
  }
  if (system === "truenas") {
    return {
      services: capabilities.zfs ? 1 : 0,
      modelEndpoints: 0,
      runnerPools: 0,
      storagePools: capabilities.zfs ? 1 : 0,
      confidence: capabilities.zfs ? "medium" : "low"
    };
  }
  if (system === "dgx-spark") {
    return {
      services: capabilities.docker ? 1 : 0,
      modelEndpoints: capabilities.nvidiaSmi ? 1 : 0,
      runnerPools: capabilities.docker ? 1 : 0,
      storagePools: capabilities.zfs ? 1 : 0,
      confidence: capabilities.nvidiaSmi ? "high" : capabilities.docker ? "medium" : "low"
    };
  }
  return {
    services: 0,
    modelEndpoints: 0,
    runnerPools: capabilities.docker ? 1 : 0,
    storagePools: capabilities.zfs ? 1 : 0,
    confidence: "medium"
  };
}

function capabilityList(capabilities: Record<string, unknown> | undefined): string[] {
  if (!capabilities) return [];
  const labels: Record<string, string> = {
    docker: "docker",
    proxmox: "proxmox",
    zfs: "zfs",
    nvidiaSmi: "nvidia-smi"
  };
  return Object.entries(labels)
    .filter(([key]) => booleanNested(capabilities, key))
    .map(([, label]) => label);
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function booleanNested(obj: Record<string, unknown> | undefined, key: string): boolean {
  return obj?.[key] === true;
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
