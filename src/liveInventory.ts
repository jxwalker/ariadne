import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";
import { timestampFile, writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { slugifyProject } from "./paths.js";
import type { InfraSnapshot } from "./types.js";

const execFileAsync = promisify(execFile);

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

interface SshInventory {
  collector: "ssh-posix-read-only";
  mode: "read_only";
  sanitization: {
    target: "sha256-12";
    hostname: "sha256-12";
    networkAddresses: "omitted";
    macAddresses: "omitted";
  };
  target: {
    hostId: string;
    targetHash: string;
  };
  host: {
    hostnameHash: string;
    platform: string;
    arch: string;
    release: string;
    uptimeSeconds?: number;
  };
  hardware: {
    cpuCount?: number;
    memoryTotalKiB?: number;
  };
  storage: {
    filesystemCount?: number;
  };
  capabilities: {
    docker: boolean;
    proxmox: boolean;
    zfs: boolean;
    nvidiaSmi: boolean;
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

export async function collectSshInfraSnapshot(input: {
  project: string;
  vaultRoot: string;
  hostId: string;
  target: string;
  sshBinary?: string;
  notes?: string;
}): Promise<{ jsonPath: string; markdownPath: string; snapshot: InfraSnapshot }> {
  const project = slugifyProject(input.project);
  const hostId = input.hostId;
  const hostSlug = slugifyProject(input.hostId);
  const importedAt = new Date();
  const stdout = await runSshInventory(input.target, input.sshBinary ?? "ssh");
  const raw = parseSshInventory(stdout, hostId, input.target);
  const snapshot: InfraSnapshot = {
    schemaVersion: 1,
    project,
    importedAt: importedAt.toISOString(),
    sourcePath: `<LIVE_READ_ONLY>/ssh/${hostSlug}`,
    snapshotKind: "live_read_only",
    summary: {
      collector: raw.collector,
      mode: raw.mode,
      host: hostId,
      platform: raw.host.platform,
      arch: raw.host.arch,
      cpuCount: raw.hardware.cpuCount,
      memoryTotalMiB: raw.hardware.memoryTotalKiB ? Math.round(raw.hardware.memoryTotalKiB / 1024) : undefined,
      filesystemCount: raw.storage.filesystemCount,
      docker: raw.capabilities.docker,
      proxmox: raw.capabilities.proxmox,
      zfs: raw.capabilities.zfs,
      nvidiaSmi: raw.capabilities.nvidiaSmi,
      notes: input.notes
    },
    raw
  };
  const name = `infra-snapshot-live-ssh-${hostSlug}-${timestampFile(importedAt)}`;
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

export function parseSshInventory(output: string, hostId: string, target: string): SshInventory {
  const values = parseKeyValueOutput(output);
  const hostname = stringValue(values.hostname) ?? "unknown";
  return {
    collector: "ssh-posix-read-only",
    mode: "read_only",
    sanitization: {
      target: "sha256-12",
      hostname: "sha256-12",
      networkAddresses: "omitted",
      macAddresses: "omitted"
    },
    target: {
      hostId,
      targetHash: sha12(target)
    },
    host: {
      hostnameHash: sha12(hostname),
      platform: stringValue(values.uname_s) ?? "unknown",
      arch: stringValue(values.uname_m) ?? "unknown",
      release: stringValue(values.uname_r) ?? "unknown",
      uptimeSeconds: numberValue(values.uptime_seconds)
    },
    hardware: {
      cpuCount: numberValue(values.cpu_count),
      memoryTotalKiB: numberValue(values.memory_total_kib)
    },
    storage: {
      filesystemCount: numberValue(values.filesystem_count)
    },
    capabilities: {
      docker: booleanValue(values.has_docker),
      proxmox: booleanValue(values.has_pve),
      zfs: booleanValue(values.has_zfs),
      nvidiaSmi: booleanValue(values.has_nvidia_smi)
    }
  };
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

async function runSshInventory(target: string, sshBinary: string): Promise<string> {
  assertSafeSshTarget(target);
  const { stdout } = await execFileAsync(
    sshBinary,
    ["-o", "BatchMode=yes", "-o", "ConnectTimeout=10", target, `sh -c ${shellQuote(SSH_INVENTORY_SCRIPT)}`],
    { timeout: 20_000, maxBuffer: 64 * 1024, encoding: "utf8" }
  );
  return stdout;
}

function assertSafeSshTarget(target: string): void {
  const safeTarget = /^(?:[A-Za-z0-9._-]+@)?(?:[A-Za-z0-9._-]+|\[[0-9A-Fa-f:.]+\])(?::[0-9]{1,5})?$/;
  if (!safeTarget.test(target)) {
    throw new Error("Unsafe SSH target. Use a host, user@host, host:port, or user@host:port value.");
  }
}

function parseKeyValueOutput(output: string): Record<string, string> {
  return Object.fromEntries(
    output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf("=");
        if (separator === -1) return undefined;
        return [line.slice(0, separator), line.slice(separator + 1)];
      })
      .filter((entry): entry is [string, string] => entry !== undefined)
  );
}

function stringValue(value: string | undefined): string | undefined {
  return value && value !== "unknown" ? value : undefined;
}

function numberValue(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function booleanValue(value: string | undefined): boolean {
  return value === "yes";
}

function sha12(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
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
    "- Collector uses read-only inventory commands.",
    "- Hostname and SSH target are hashed when present.",
    "- Network and MAC addresses are omitted.",
    "- No remote host, infrastructure, repository, or deployment mutation is attempted.",
    ""
  ].join("\n");
}

const SSH_INVENTORY_SCRIPT = `
kv() { printf '%s=%s\\n' "$1" "$2"; }
first_value() {
  for cmd in "$@"; do
    value=$(sh -c "$cmd" 2>/dev/null | head -n 1 || true)
    if [ -n "$value" ]; then
      printf '%s' "$value"
      return 0
    fi
  done
  printf 'unknown'
}
kv hostname "$(first_value hostname 'uname -n')"
kv uname_s "$(first_value 'uname -s')"
kv uname_m "$(first_value 'uname -m')"
kv uname_r "$(first_value 'uname -r')"
uptime_value=$(awk '{print int($1)}' /proc/uptime 2>/dev/null | head -n 1 || true)
if [ -z "$uptime_value" ]; then
  uptime_value=$(sysctl -n kern.boottime 2>/dev/null | head -n 1 || true)
fi
kv uptime_seconds "\${uptime_value:-unknown}"
kv cpu_count "$(first_value 'getconf _NPROCESSORS_ONLN' nproc 'sysctl -n hw.ncpu')"
memory_total_kib=$(awk '/MemTotal/ {print $2}' /proc/meminfo 2>/dev/null | head -n 1 || true)
kv memory_total_kib "\${memory_total_kib:-unknown}"
kv filesystem_count "$(df -kP 2>/dev/null | awk 'NR>1 {count++} END {print count+0}')"
command -v docker >/dev/null 2>&1 && kv has_docker yes || kv has_docker no
command -v pvesh >/dev/null 2>&1 && kv has_pve yes || kv has_pve no
command -v zpool >/dev/null 2>&1 && kv has_zfs yes || kv has_zfs no
command -v nvidia-smi >/dev/null 2>&1 && kv has_nvidia_smi yes || kv has_nvidia_smi no
`;
