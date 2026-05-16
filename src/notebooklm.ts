import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { slugifyProject } from "./paths.js";
import type { NotebookLmImport } from "./types.js";

interface ImportNotebookLmOptions {
  project: string;
  vaultRoot: string;
  sourcePath: string;
}

export async function importNotebookLmExport(options: ImportNotebookLmOptions): Promise<{
  jsonPath: string;
  markdownPath: string;
  imported: NotebookLmImport;
}> {
  const project = slugifyProject(options.project);
  const sourcePath = path.resolve(options.sourcePath);
  const text = await fs.readFile(sourcePath, "utf8");
  const imported = normaliseNotebookLmText(project, sourcePath, text);

  const jsonPath = await writeJsonArtifact(options.vaultRoot, project, "requirements", "notebooklm-import.json", imported);
  const markdownPath = await writeTextArtifact(
    options.vaultRoot,
    project,
    "requirements",
    "notebooklm-import.md",
    renderNotebookLmImport(imported)
  );
  return { jsonPath, markdownPath, imported };
}

export function normaliseNotebookLmText(project: string, sourcePath: string, text: string): NotebookLmImport {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const title = firstNonEmpty(lines)?.replace(/^#\s+/, "") ?? "NotebookLM Export";
  const sections: NotebookLmImport["sections"] = [];
  const citations: NotebookLmImport["citations"] = [];
  let currentHeading = "Summary";
  let currentBody: string[] = [];

  for (const line of lines) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      currentHeading = heading[2]!.trim();
      currentBody = [];
      continue;
    }

    const citation = /\[([0-9]+)\]|Source:\s*(.+)$/i.exec(line);
    if (citation) {
      citations.push({
        marker: citation[1] ?? `source-${citations.length + 1}`,
        text: line.trim()
      });
    }
    currentBody.push(line);
  }

  flush();

  return {
    schemaVersion: 1,
    project,
    importedAt: new Date().toISOString(),
    sourcePath,
    title,
    sections: sections.filter((section) => section.body.trim().length > 0),
    citations
  };

  function flush(): void {
    if (currentBody.length > 0) {
      sections.push({
        heading: currentHeading,
        body: currentBody.join("\n").trim()
      });
    }
  }
}

function firstNonEmpty(lines: string[]): string | undefined {
  return lines.find((line) => line.trim().length > 0)?.trim();
}

function renderNotebookLmImport(imported: NotebookLmImport): string {
  return [
    `# NotebookLM Import: ${imported.title}`,
    "",
    `Imported: ${imported.importedAt}`,
    `Source: ${imported.sourcePath}`,
    "",
    "## Sections",
    "",
    ...imported.sections.flatMap((section) => [`### ${section.heading}`, "", section.body, ""]),
    "## Citations",
    "",
    ...(imported.citations.length
      ? imported.citations.map((citation) => `- ${citation.marker}: ${citation.text}`)
      : ["- None detected"]),
    ""
  ].join("\n");
}
