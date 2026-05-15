import path from "node:path";

export function defaultVaultRoot(cwd = process.cwd()): string {
  return path.join(cwd, "vault");
}

export function slugifyProject(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new Error("Project name must contain at least one letter or number.");
  }

  return slug;
}

export function safeFileName(value: string): string {
  const safe = value.replace(/[^a-zA-Z0-9._ -]+/g, "_").trim();
  return safe || "source";
}

export function projectDir(vaultRoot: string, project: string): string {
  return path.join(vaultRoot, "projects", slugifyProject(project));
}

