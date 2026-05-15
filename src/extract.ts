import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import type { SourceKind } from "./types.js";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".heic", ".tiff"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".wav", ".aiff", ".aac"]);

export function sourceKind(filePath: string): SourceKind {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".md" || ext === ".markdown") return "markdown";
  if (ext === ".txt" || ext === ".text") return "text";
  if (ext === ".docx") return "docx";
  if (ext === ".pdf") return "pdf";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (AUDIO_EXTENSIONS.has(ext)) return "audio";
  return "unknown";
}

export async function extractText(filePath: string): Promise<string | undefined> {
  const kind = sourceKind(filePath);

  if (kind === "markdown" || kind === "text") {
    return fs.readFile(filePath, "utf8");
  }

  if (kind === "docx" && process.platform === "darwin") {
    return execFileSync("textutil", ["-convert", "txt", "-stdout", filePath], {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024
    });
  }

  return undefined;
}

export function normaliseExtractedText(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

