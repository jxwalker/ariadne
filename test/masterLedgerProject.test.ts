import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("master ledger CLI project boundary", () => {
  it("rejects missing or different projects before reading commands or connecting", () => {
    for (const command of ["ledger-command", "ledger-view"]) {
      for (const args of [[], ["--project", "patent-studio"], ["--project", "Ariadne"]]) {
        const result = spawnSync(process.execPath, ["--import", "tsx", "src/ariadne.ts", command, ...args, "--file", "/missing-command-must-not-be-read.json"], { encoding: "utf8", timeout: 15000 });
        expect(result.error).toBeUndefined();
        expect(result.status).toBe(1);
        expect(result.stdout).toBe("");
        expect(result.stderr.trim()).toBe("Ledger commands require --project ariadne");
      }
    }
  }, 30000);
  it("dispatches the explicitly selected master project", () => {
    const result = spawnSync(process.execPath, ["--import", "tsx", "src/ariadne.ts", "ledger-command", "--project", "ariadne"], { encoding: "utf8", timeout: 15000 });
    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe("ledger-command requires --file <command.json>");
  });
});
