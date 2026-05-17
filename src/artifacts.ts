import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { projectDir, slugifyProject } from "./paths.js";

export async function ensureArtifactDir(
  vaultRoot: string,
  project: string,
  name: string
): Promise<string> {
  const dir = path.join(projectDir(vaultRoot, project), name);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function writeJsonArtifact(
  vaultRoot: string,
  project: string,
  dirName: string,
  fileName: string,
  value: unknown
): Promise<string> {
  const dir = await ensureArtifactDir(vaultRoot, project, dirName);
  const filePath = path.join(dir, fileName);
  await writeFileAtomically(filePath, `${JSON.stringify(value, null, 2)}\n`);
  return filePath;
}

export async function writeTextArtifact(
  vaultRoot: string,
  project: string,
  dirName: string,
  fileName: string,
  text: string
): Promise<string> {
  const dir = await ensureArtifactDir(vaultRoot, project, dirName);
  const filePath = path.join(dir, fileName);
  await writeFileAtomically(filePath, text.endsWith("\n") ? text : `${text}\n`);
  return filePath;
}

async function writeFileAtomically(filePath: string, text: string): Promise<void> {
  const dir = path.dirname(filePath);
  const tempPath = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`);
  try {
    await fs.writeFile(tempPath, text);
    await fs.rename(tempPath, filePath);
  } catch (error) {
    await fs.rm(tempPath, { force: true });
    throw error;
  }
}

export async function readJsonArtifact<T>(
  vaultRoot: string,
  project: string,
  dirName: string,
  fileName: string
): Promise<T> {
  const filePath = path.join(projectDir(vaultRoot, project), dirName, fileName);
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

export async function latestFile(
  vaultRoot: string,
  project: string,
  dirName: string,
  prefix: string,
  suffix: string
): Promise<string | undefined> {
  const dir = path.join(projectDir(vaultRoot, project), dirName);
  try {
    const names = await fs.readdir(dir);
    const matches = names
      .filter((name) => name.startsWith(prefix) && name.endsWith(suffix))
      .sort();
    const latest = matches.at(-1);
    return latest ? path.join(dir, latest) : undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

export function timestampFile(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

export function projectTitle(project: string): string {
  return slugifyProject(project)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
