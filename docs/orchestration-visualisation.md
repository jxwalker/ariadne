# Orchestration Visualisation

The first visualisation should be an operations surface over evidence, not a chat UI.

## Objects To Visualise

- Sources: raw files, hashes, hygiene status, extraction status.
- Dossiers: assembled context and source coverage.
- Requirements: PRD goals, requirements, ambiguities.
- Tasks: GSD tasks, write scopes, verification commands.
- Execution: run status, worktree guard checks, stop conditions.
- Verification: typecheck, tests, build, Playwright evidence, CI, CodeRabbit.
- Decisions: accepted decisions and source references.
- Infrastructure: hosts, runner pools, model endpoints, snapshots.
- Evaluation: dimension scores, regressions, recommendations.
- Control: merge readiness and missing gates.

## Views

### Project Timeline

A chronological stream of ingests, generated artifacts, decisions, checks, reviews, and evaluation runs.

### Harness Board

Columns:

- intake
- requirements
- tasking
- execution
- verification
- review
- evaluation
- ready

Each card links to the artifact that proves its state.

### Gate Matrix

Rows are tasks or runs. Columns are gates: source, PRD, GSD, worktree guard, typecheck, unit tests, build, Playwright, review, control, human approval.

### Infrastructure Map

Nodes are Macs, DGX Spark, Proxmox, TrueNAS, runners, Hermes instances, and model endpoints. Edges show artifact flow and trust boundaries.

### Evaluation Trends

Line charts for D1-D5 scores over time, plus regression counts and missing-gate counts.

## Implementation Direction

Start with static JSON artifacts and generated Markdown. `console-data` creates a normalised read-only projection at `console/console-data.json`, and `console-html` renders the first static local console at `console/index.html`. A future live console should read the same JSON contract rather than scanning the vault directly. The console should remain read-only until the artifact model and access control are stable.

## Integration Lessons From Current Tools

- Hermes and Hermes Web UI show that sessions, memory, scheduled jobs, logs, model config, and terminal backends need one visible operations surface.
- Mission Control-style systems show the value of a shared UI/API object model for tasks, agents, gateways, approvals, and audit history.
- The Ariadne-specific gap is evidence lineage: every visual state should link back to a file artifact.
