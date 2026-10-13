import { spawnSync } from "node:child_process";
import { userInfo, homedir } from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

// No password, URL or remote host options: phase 1 uses the approved local peer map.
export function ledgerQuery(sql: string): unknown {
  const result = spawnSync("/usr/lib/postgresql/17/bin/psql", ["-X", "-qAt", "-v", "ON_ERROR_STOP=1",
    "-h", path.join(homedir(), ".local/state/ariadne-master-pg/socket"), "-p", "55432",
    "-U", "ariadne_master", "-d", "ariadne_master"], {
    input: sql, encoding: "utf8", timeout: 30000, maxBuffer: 16 * 1024 * 1024,
    env: { PATH: process.env.PATH, HOME: homedir(), PGPASSFILE: "/dev/null" }
  });
  if (result.error || result.status !== 0) throw new Error("Local ledger query failed; check peer map and migration status");
  return JSON.parse(result.stdout.trim());
}
export function ledgerCommand(payload: unknown): unknown {
  if (userInfo().username !== "james") throw new Error("Phase 1 ledger writes are operator-only");
  const json = JSON.stringify(payload).replaceAll("'", "''");
  return ledgerQuery(Array.isArray(payload)
    ? `SELECT jsonb_agg(master.command('james', value) ORDER BY ord) FROM jsonb_array_elements('${json}'::jsonb) WITH ORDINALITY AS c(value,ord);`
    : `SELECT master.command('james', '${json}'::jsonb);`);
}
export async function runLedger(command: string, file?: string): Promise<void> {
  if (command === "ledger-view") console.log(JSON.stringify(ledgerQuery("SELECT master.snapshot();"), null, 2));
  else {
    if (!file) throw new Error("ledger-command requires --file <command.json>");
    const result = ledgerCommand(JSON.parse(await fs.readFile(file, "utf8")));
    console.log(JSON.stringify(result, null, 2));
    if (Array.isArray(result) ? result.some(r => !r.ok) : !(result as {ok: boolean}).ok) process.exitCode = 1;
  }
}
