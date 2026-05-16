import { createHash } from "node:crypto";
import os from "node:os";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { slugifyProject } from "./paths.js";
import type { InfraSnapshot } from "./types.js";

interface LocalInventory {
  collector: "local-node-os";
  mode: "read_only";
  sanitization: {
    hostname: "sha256-12";
    networkAddresses: "omitted";
    macAddresses: "omitted";
  };
  host: {
    hostnameHash: string;
    platform: NodeJS.Platform;
    arch: string;
    release: string;
    type: string;
    uptimeSeconds: number;
  };
  runtime: {
    nodeVersion: string;
  };
  hardware: {
    cpuCount: number;
    cpuModel?: string;
    totalMemoryBytes: number;
    freeMemoryBytes: number;
  };
  network: {
    interfaceCount: number;
    interfaces: Array<{
      name: string;
      addressCount: number;
      families: string[];
      internal: boolean;
    }>;
  };
}

export async function collectLocalInfraSnapshot(input: {
  project: string;
  vaultRoot: string;
  notes?: string;
}): Promise<{ jsonPath: string; markdownPath: string; snapshot: InfraSnapshot }> {
  const project = slugifyProject(input.project);
  const importedAt = new Date();
  const raw = collectLocalInventory();
  const snapshot: InfraSnapshot = {
    schemaVersion: 1,
    project,
    importedAt: importedAt.toISOString(),
    sourcePath: "<LIVE_READ_ONLY>/local-host",
    snapshotKind: "live_read_only",
    summary: {
      collector: raw.collector,
      mode: raw.mode,
      host: "local-host",
      platform: raw.host.platform,
      arch: raw.host.arch,
      cpuCount: raw.hardware.cpuCount,
      totalMemoryGiB: Math.round((raw.hardware.totalMemoryBytes / 1024 ** 3) * 10) / 10,
      networkInterfaces: raw.network.interfaceCount,
      notes: input.notes
    },
    raw
  };
  const name = `infra-snapshot-live-local-${timestampFile(importedAt)}`;
  const jsonPath = await writeJsonArtifact(input.vaultRoot, project, "infrastructure", `${name}.json`, snapshot);
  const markdownPath = await writeTextArtifact(
    input.vaultRoot,
    project,
    "infrastructure",
    `${name}.md`,
    renderSnapshot(snapshot)
  );
  return { jsonPath, markdownPath, snapshot };
}

function collectLocalInventory(): LocalInventory {
  const cpus = os.cpus();
  const interfaces = Object.entries(os.networkInterfaces()).map(([name, values]) => {
    const addresses = values ?? [];
    return {
      name,
      addressCount: addresses.length,
      families: [...new Set(addresses.map((address) => address.family).filter(Boolean))].sort(),
      internal: addresses.length > 0 && addresses.every((address) => address.internal)
    };
  });
  return {
    collector: "local-node-os",
    mode: "read_only",
    sanitization: {
      hostname: "sha256-12",
      networkAddresses: "omitted",
      macAddresses: "omitted"
    },
    host: {
      hostnameHash: createHash("sha256").update(os.hostname()).digest("hex").slice(0, 12),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      type: os.type(),
      uptimeSeconds: Math.round(os.uptime())
    },
    runtime: {
      nodeVersion: process.version
    },
    hardware: {
      cpuCount: cpus.length,
      cpuModel: cpus[0]?.model,
      totalMemoryBytes: os.totalmem(),
      freeMemoryBytes: os.freemem()
    },
    network: {
      interfaceCount: interfaces.length,
      interfaces
    }
  };
}

function renderSnapshot(snapshot: InfraSnapshot): string {
  return [
    `# Live Read-Only Infrastructure Snapshot: ${snapshot.project}`,
    "",
    `Kind: ${snapshot.snapshotKind}`,
    `Imported: ${snapshot.importedAt}`,
    `Source: ${snapshot.sourcePath}`,
    "",
    "## Summary",
    "",
    "```json",
    JSON.stringify(snapshot.summary, null, 2),
    "```",
    "",
    "## Safety",
    "",
    "- Collector uses local read-only Node.js OS APIs.",
    "- Hostname is hashed.",
    "- Network and MAC addresses are omitted.",
    "- No remote host, infrastructure, repository, or deployment mutation is attempted.",
    ""
  ].join("\n");
}
