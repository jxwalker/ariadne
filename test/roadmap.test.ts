import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateControlReport } from "../src/controlPlane.js";
import { planExecution } from "../src/execution.js";
import { generateGsd } from "../src/gsd.js";
import { generateInfrastructureRegistry } from "../src/infrastructure.js";
import { generatePlaywrightPlan } from "../src/playwrightPlan.js";
import { generatePrd } from "../src/prd.js";
import { assembleDossier, ingestFiles } from "../src/vault.js";

describe("roadmap generation", () => {
  it("turns an evidence dossier into PRD, GSD, execution, verification, infra, and control artifacts", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-roadmap-"));
    const source = path.join(temp, "manifesto.md");
    const vaultRoot = path.join(temp, "vault");

    await fs.writeFile(
      source,
      [
        "# Ariadne",
        "",
        "Use NotebookLM for grounded source synthesis.",
        "Use GSD2 for task decomposition.",
        "Use Playwright for browser evidence.",
        "Use Proxmox, Hermes, OpenScorpion, and CodeRabbit behind explicit gates.",
        ""
      ].join("\n")
    );

    await ingestFiles([source], { project: "ariadne", vaultRoot });
    await assembleDossier({ project: "ariadne", vaultRoot, maxCharsPerSource: 4000 });

    const prd = await generatePrd({ project: "ariadne", vaultRoot });
    expect(prd.prd.requirements).toHaveLength(7);

    const gsd = await generateGsd({ project: "ariadne", vaultRoot });
    expect(gsd.roadmap.milestones.flatMap((milestone) => milestone.tasks)).toHaveLength(7);

    const execution = await planExecution({ project: "ariadne", vaultRoot, repoPath: temp });
    expect(execution.run.status).toBe("planned");

    const playwright = await generatePlaywrightPlan({
      project: "ariadne",
      vaultRoot,
      targetUrl: "http://localhost:6001"
    });
    expect(playwright.plan.targetUrl).toBe("http://localhost:6001");

    const infra = await generateInfrastructureRegistry({ project: "ariadne", vaultRoot });
    expect(infra.registry.hosts.map((host) => host.id)).toContain("beast");
    expect(infra.registry.hosts.map((host) => host.id)).toContain("atlas-node");
    expect(infra.registry.modelEndpoints.map((endpoint) => endpoint.id)).toContain("atlas-local-models");

    const control = await generateControlReport({ project: "ariadne", vaultRoot });
    expect(control.report.status).toBe("review_required");
    expect(control.report.missing).toContain(`Execution run ${execution.run.id} is not complete`);
  });
});
