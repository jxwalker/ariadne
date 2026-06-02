/**
 * Memory consolidation ("sleep") routine.
 *
 * This module embodies patent family M-005: a periodic consolidation routine
 * that assembles a durable consolidation record, detects STALE derived
 * artifacts by comparing each derived artifact's generation timestamp against
 * the latest modification timestamp of its source records, and emits concrete
 * REFRESH COMMANDS for the stale artifacts. In keeping with the project's
 * REGULA/ETHOS philosophy of restraint and non-mutation, this routine is
 * strictly advisory: it only records and recommends, and never auto-executes a
 * refresh. The assembled report carries `mutated: false` as a literal type to
 * make the non-mutating contract explicit at the type level.
 *
 * The core logic here is pure and dependency-light; it operates on in-memory
 * inputs and performs no filesystem access.
 */

/** A derived artifact and the source records it was generated from. */
export interface ConsolidationArtifact {
  id: string;
  /** ISO-8601 timestamp at which this derived artifact was generated. */
  generatedAt: string;
  /** Ids of the source records this artifact was derived from. */
  sourceIds: string[];
}

/** In-memory inputs for a single consolidation pass. */
export interface ConsolidationInput {
  /** Human-readable scope of this consolidation pass. */
  scope: string;
  /** Derived artifacts to evaluate for staleness. */
  artifacts: ConsolidationArtifact[];
  /** Map of source record id to its latest modification ISO-8601 timestamp. */
  sources: Record<string, string>;
}

/** Advisory consolidation report. Always non-mutating (`mutated === false`). */
export interface ConsolidationReport {
  scope: string;
  summary: string;
  evidenceRefs: string[];
  staleArtifacts: string[];
  refreshCommands: string[];
  nextActions: string[];
  mutated: false;
}

/**
 * Detects derived artifacts whose any source `modifiedAt` is strictly newer
 * than the artifact's own `generatedAt`. Pure: returns the subset of input
 * artifacts considered stale, in input order.
 *
 * A source id absent from the `sources` map contributes no staleness signal.
 */
export function detectStaleArtifacts(input: ConsolidationInput): ConsolidationArtifact[] {
  return input.artifacts.filter((artifact) => {
    const generatedAt = Date.parse(artifact.generatedAt);
    return artifact.sourceIds.some((sourceId) => {
      const modifiedAt = input.sources[sourceId];
      if (modifiedAt === undefined) return false;
      return Date.parse(modifiedAt) > generatedAt;
    });
  });
}

/**
 * Returns a deterministic, advisory refresh-command string for an artifact.
 * This is a recommendation only; the consolidation routine never runs it.
 */
export function refreshCommandFor(artifactId: string): string {
  return `npm run ariadne -- refresh --artifact ${artifactId}`;
}

/**
 * Assembles the advisory consolidation report from in-memory inputs. The report
 * records the scope, a summary, evidence references (the evaluated artifact
 * ids), the detected stale artifacts, one refresh command per stale artifact,
 * and the recommended next actions. `mutated` is always literally `false`: this
 * routine records and recommends but never refreshes.
 */
export function buildConsolidationReport(input: ConsolidationInput): ConsolidationReport {
  const stale = detectStaleArtifacts(input);
  const staleArtifacts = stale.map((artifact) => artifact.id);
  const refreshCommands = staleArtifacts.map((id) => refreshCommandFor(id));
  const summary =
    staleArtifacts.length === 0
      ? `Consolidation of "${input.scope}": ${input.artifacts.length} artifact(s) reviewed; none stale.`
      : `Consolidation of "${input.scope}": ${input.artifacts.length} artifact(s) reviewed; ${staleArtifacts.length} stale and pending operator refresh.`;
  const nextActions =
    staleArtifacts.length === 0
      ? []
      : refreshCommands.map((command) => `Operator review required: run \`${command}\` to refresh the stale artifact.`);
  return {
    scope: input.scope,
    summary,
    evidenceRefs: input.artifacts.map((artifact) => artifact.id),
    staleArtifacts,
    refreshCommands,
    nextActions,
    mutated: false
  };
}
