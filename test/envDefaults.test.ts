import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadLocalEnvDefaults, parseEnvAssignments } from "../src/envDefaults.js";

describe("env defaults", () => {
  it("loads .env assignments without overriding existing environment values", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-env-"));
    await fs.writeFile(
      path.join(temp, ".env"),
      [
        "ARIADNE_ATLAS_URL=http://atlas.local:8888/v1",
        "ARIADNE_ATLAS_CANARY_MODEL=qwen3.6-35b-a3b-nvfp4-atlas",
        "ARIADNE_DUPLICATE=first",
        "ARIADNE_EXISTING=from-file",
        "ARIADNE_DUPLICATE=second",
        "PATH=/tmp/ignored"
      ].join("\n")
    );
    const env: NodeJS.ProcessEnv = { ARIADNE_EXISTING: "from-env" };

    await loadLocalEnvDefaults({ cwd: temp, env });

    expect(env.ARIADNE_ATLAS_URL).toBe("http://atlas.local:8888/v1");
    expect(env.ARIADNE_ATLAS_CANARY_MODEL).toBe("qwen3.6-35b-a3b-nvfp4-atlas");
    expect(env.ARIADNE_DUPLICATE).toBe("second");
    expect(env.ARIADNE_EXISTING).toBe("from-env");
    expect(env.PATH).toBeUndefined();
  });

  it("ignores a missing .env file", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-env-"));
    const env: NodeJS.ProcessEnv = {};

    await loadLocalEnvDefaults({ cwd: temp, env });

    expect(env).toEqual({});
  });

  it("parses shell-style assignment lines conservatively", () => {
    expect(
      parseEnvAssignments(`
        # local runtime defaults
        export ARIADNE_ATLAS_URL="http://atlas.local:8888/v1"
        ARIADNE_ATLAS_CANARY_MODEL='qwen3.6-35b-a3b-nvfp4-atlas'
        ARIADNE_TIMEOUT_MS=60000 # local only
        QUOTED_WITH_COMMENT="keeps value" # strips comment
        HASH_IN_QUOTES="keeps # hash"
        1INVALID=value
        NOT_AN_ASSIGNMENT
      `)
    ).toEqual([
      { key: "ARIADNE_ATLAS_URL", value: "http://atlas.local:8888/v1" },
      { key: "ARIADNE_ATLAS_CANARY_MODEL", value: "qwen3.6-35b-a3b-nvfp4-atlas" },
      { key: "ARIADNE_TIMEOUT_MS", value: "60000" },
      { key: "QUOTED_WITH_COMMENT", value: "keeps value" },
      { key: "HASH_IN_QUOTES", value: "keeps # hash" }
    ]);
  });

  it("rejects unusually large .env files", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-env-"));
    await fs.writeFile(path.join(temp, ".env"), `ARIADNE_BIG=${"x".repeat(70 * 1024)}`);

    await expect(loadLocalEnvDefaults({ cwd: temp, env: {} })).rejects.toThrow(".env is too large");
  });
});
