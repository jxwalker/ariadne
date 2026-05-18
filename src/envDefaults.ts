import fs from "node:fs/promises";
import path from "node:path";

const MAX_ENV_DEFAULTS_BYTES = 64 * 1024;
const ENV_DEFAULT_KEY_PREFIX = "ARIADNE_";

export async function loadLocalEnvDefaults(input: {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  fileName?: string;
} = {}): Promise<void> {
  const cwd = input.cwd ?? process.cwd();
  const env = input.env ?? process.env;
  const fileName = input.fileName ?? ".env";
  const envPath = path.resolve(cwd, fileName);
  let stats: { size: number };
  try {
    stats = await fs.stat(envPath);
  } catch (error) {
    if (isMissingFile(error)) return;
    throw error;
  }
  if (stats.size > MAX_ENV_DEFAULTS_BYTES) {
    throw new Error(`${fileName} is too large for Ariadne defaults (${stats.size} bytes).`);
  }
  let content: string;
  try {
    content = await fs.readFile(envPath, "utf8");
  } catch (error) {
    if (isMissingFile(error)) return;
    throw error;
  }

  const predefinedKeys = new Set(Object.keys(env).filter((key) => env[key] !== undefined));
  for (const assignment of parseEnvAssignments(content)) {
    if (assignment.key.startsWith(ENV_DEFAULT_KEY_PREFIX) && !predefinedKeys.has(assignment.key)) {
      env[assignment.key] = assignment.value;
    }
  }
}

export function parseEnvAssignments(content: string): Array<{ key: string; value: string }> {
  const assignments: Array<{ key: string; value: string }> = [];
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const withoutExport = line.startsWith("export ") ? line.slice("export ".length).trimStart() : line;
    const separator = withoutExport.indexOf("=");
    if (separator <= 0) continue;
    const key = withoutExport.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    const rawValue = withoutExport.slice(separator + 1).trim();
    assignments.push({ key, value: parseEnvValue(rawValue) });
  }
  return assignments;
}

function parseEnvValue(rawValue: string): string {
  const value = stripInlineComment(rawValue).trimEnd();
  if (value.length >= 2) {
    const quote = value[0];
    if ((quote === `"` || quote === "'") && value.endsWith(quote)) {
      return value.slice(1, -1);
    }
  }
  return value;
}

function stripInlineComment(value: string): string {
  let quote: string | undefined;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if ((char === `"` || char === "'") && (index === 0 || value[index - 1] !== "\\")) {
      quote = quote === char ? undefined : quote ?? char;
      continue;
    }
    if (!quote && char === "#" && /\s/.test(value[index - 1] ?? "")) {
      return value.slice(0, index);
    }
  }
  return value;
}

function isMissingFile(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "ENOENT");
}
