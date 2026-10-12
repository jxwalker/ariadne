import fs from "node:fs/promises";
import path from "node:path";
import type { AgentTelemetrySnapshot } from "./types.js";
import { projectDir } from "./paths.js";

export async function readAgentTelemetry(vaultRoot: string, project: string): Promise<AgentTelemetrySnapshot[]> {
  const dir = path.join(projectDir(vaultRoot, project), "integrations", "agents");
  let files: string[];
  try { files = await fs.readdir(dir); } catch { return []; }
  const result: AgentTelemetrySnapshot[] = [];
  for (const file of files.filter(f => f.endsWith(".json"))) {
    try {
      const filePath = path.join(dir, file);
      if ((await fs.stat(filePath)).size > 1_000_000) continue;
      const data: unknown = JSON.parse(await fs.readFile(filePath, "utf8"));
      if (isAgentTelemetry(data)) result.push(data);
    } catch { /* A partial or malformed snapshot is not live evidence. */ }
  }
  return result.sort((a,b) => a.host.localeCompare(b.host));
}

export function isAgentTelemetry(value: unknown): value is AgentTelemetrySnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as AgentTelemetrySnapshot;
  const text = (s: unknown): s is string => typeof s === "string" && s.length <= 500;
  const time = (s: unknown) => text(s) && Number.isFinite(Date.parse(s));
  return v.schemaVersion === 1 && text(v.host) && time(v.collectedAt) && ["available","unreachable"].includes(v.status)
    && Array.isArray(v.sources) && v.sources.every(s => s && ["Claude","Codex"].includes(s.agent) && text(s.status) && text(s.method))
    && Array.isArray(v.sessions) && v.sessions.length <= 100 && v.sessions.every(s => s && text(s.id) && ["Claude","Codex"].includes(s.agent)
      && (s.update == null || text(s.update)) && text(s.host) && s.host === v.host && text(s.task) && ["working","idle","interrupted","error","stale","unknown"].includes(s.status)
      && text(s.repository) && (s.branch == null || text(s.branch)) && time(s.lastEventAt) && text(s.event) && text(s.lastTool) && text(s.source)
      && Array.isArray(s.changedFiles) && s.changedFiles.length <= 20 && s.changedFiles.every(text));
}
