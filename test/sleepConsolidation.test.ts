import { describe, expect, it } from "vitest";
import {
  buildConsolidationReport,
  detectStaleArtifacts,
  refreshCommandFor,
  type ConsolidationInput
} from "../src/sleepConsolidation.js";

function input(): ConsolidationInput {
  return {
    scope: "memory-consolidation",
    artifacts: [
      // stale: source-a was modified after this artifact was generated.
      { id: "artifact-stale", generatedAt: "2026-06-01T00:00:00.000Z", sourceIds: ["source-a", "source-b"] },
      // fresh: all sources are older than the artifact's generation time.
      { id: "artifact-fresh", generatedAt: "2026-06-02T00:00:00.000Z", sourceIds: ["source-c"] }
    ],
    sources: {
      "source-a": "2026-06-01T12:00:00.000Z",
      "source-b": "2026-05-30T00:00:00.000Z",
      "source-c": "2026-06-01T00:00:00.000Z"
    }
  };
}

describe("sleep consolidation (patent family M-005)", () => {
  it("detects an artifact whose source modifiedAt is newer than its generatedAt", () => {
    const stale = detectStaleArtifacts(input());
    expect(stale.map((artifact) => artifact.id)).toEqual(["artifact-stale"]);
  });

  it("does not flag an artifact whose sources are all older than its generatedAt", () => {
    const stale = detectStaleArtifacts(input());
    expect(stale.map((artifact) => artifact.id)).not.toContain("artifact-fresh");
  });

  it("emits exactly one refresh command per stale artifact and never mutates", () => {
    const report = buildConsolidationReport(input());
    expect(report.staleArtifacts).toEqual(["artifact-stale"]);
    expect(report.refreshCommands).toEqual([refreshCommandFor("artifact-stale")]);
    expect(report.refreshCommands).toHaveLength(report.staleArtifacts.length);
    expect(report.mutated).toBe(false);
  });

  it("leaves nextActions empty when nothing is stale", () => {
    const allFresh: ConsolidationInput = {
      scope: "memory-consolidation",
      artifacts: [{ id: "artifact-fresh", generatedAt: "2026-06-02T00:00:00.000Z", sourceIds: ["source-c"] }],
      sources: { "source-c": "2026-06-01T00:00:00.000Z" }
    };
    const report = buildConsolidationReport(allFresh);
    expect(report.staleArtifacts).toEqual([]);
    expect(report.refreshCommands).toEqual([]);
    expect(report.nextActions).toEqual([]);
    expect(report.mutated).toBe(false);
  });

  it("is deterministic: same input produces the same report", () => {
    expect(buildConsolidationReport(input())).toEqual(buildConsolidationReport(input()));
  });
});
