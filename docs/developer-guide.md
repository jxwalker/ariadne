# Developer Guide

This repo is a TypeScript CLI that writes typed artifacts to a local vault. It should stay boring, inspectable, and evidence-first.

## Setup

```bash
npm install
npm run check
npm test
npm run build
```

## Design Rules

- Add adapters as file contracts before live integrations.
- Keep every artifact JSON-serializable and schema-versioned.
- Prefer deterministic validation over model judgment.
- Keep external mutation behind explicit commands and human approval.
- Preserve generated artifacts when they are part of the current roadmap evidence.

## Code Layout

- `src/cli.ts`: command routing and argument parsing.
- `src/vault.ts`: source intake, manifest, hot index, dossier.
- `src/prd.ts`: requirements generation from dossier evidence.
- `src/gsd.ts`: roadmap and task export.
- `src/execution.ts`: non-mutating execution run records.
- `src/worktreeGuard.ts`: git readiness checks and optional guarded worktree creation.
- `src/playwrightPlan.ts` and `src/playwrightEvidence.ts`: UI verification planning and evidence.
- `src/controlPlane.ts`: checks, reviews, merge readiness.
- `src/consoleData.ts`: normalised read-only console projection.
- `src/consoleHtml.ts`: static console renderer over console data.
- `src/evaluation.ts`: pipeline evaluation plans and run scores.
- `src/artifactChecks.ts`: deterministic artifact contract checks for the evaluation harness.
- `src/infrastructure.ts` and `src/infraSnapshot.ts`: substrate registry and read-only imports.
- `src/types.ts`: shared record contracts.

## Adding A New Adapter

1. Add types in `src/types.ts`.
2. Add a small module in `src/<adapter>.ts`.
3. Write JSON and Markdown artifacts with `writeJsonArtifact` and `writeTextArtifact`.
4. Add a CLI command in `src/cli.ts`.
5. Add a test that proves the artifact path and one failure mode.
6. Update `docs/adapters.md` and `README.md`.

## Testing Standard

Every change should pass:

```bash
npm run check
npm test
npm run build
```

For UI-facing changes, add Playwright evidence or explicitly record why it was skipped.

For review-gated work, run CodeRabbit after local checks and address actionable feedback before merge.

## Evaluation Dimensions

The evaluation layer currently scores:

- `D1`: evidence fidelity
- `D2`: planning quality
- `D3`: execution safety
- `D4`: verification strength
- `D5`: operational fit

Do not optimize the score by weakening dimensions. If a dimension is too easy to satisfy, tighten the sensors.

## Live Adapter Rule

A live adapter must start read-only. Mutation requires a separate approved plan that names:

- target system
- credentials or auth method
- rollback path
- evidence to capture before and after
- human approval checkpoint
