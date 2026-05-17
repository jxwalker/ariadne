# Agent Operating Instructions

This repository implements Ariadne, the control layer for an end-to-end agentic coding system.

## Doctrine

- Preserve raw evidence before summarising.
- Assemble context instead of dumping context.
- Keep execution in small, reviewable slices.
- Use fresh worktrees for code-writing agents.
- Treat tests, Playwright evidence, CI, and review feedback as stronger than memory.
- Do not mutate infrastructure, repositories, runners, or model routing without an explicit approved plan.
- Prefer integrating existing tools through clear contracts over rebuilding a coding assistant.

## Runner Name

The canonical runner is `ariadne`. Do not refer to the main entrypoint as `cli`, do not add `npm run cli`, and do not create new `src/cli*` entrypoints. Use:

```bash
npm run ariadne -- <command> --project <project>
```

The npm package binary is also `ariadne`, backed by `src/ariadne.ts`.

## Current Boundary

The codebase now includes planning, evidence, evaluation, console, read-only adapter, and guarded mutation-readiness flows. Normal commands may write local vault artifacts, but they must not mutate external systems unless the user has an explicit approved plan and invokes the audited execution path.

Allowed normal work:

- ingest and assemble source evidence
- generate requirements, GSD tasks, execution plans, Playwright plans, console data, and evaluation artifacts
- import reviewed external evidence such as CI, CodeRabbit, NotebookLM exports, GitHub snapshots, GBrain reports, and infrastructure snapshots
- collect read-only local or SSH inventory evidence
- generate live-adapter approval packs, reviews, dossiers, audits, and next-action reports

Blocked without the full mutation gate:

- pushing commits or merging PRs from an adapter
- calling NotebookLM write actions
- changing Proxmox, TrueNAS, DGX Spark, Macs, Hermes cron jobs, runners, or model routing
- submitting governed OpenScorpion activity
- executing generated live commands

Mutation-capable paths must use `mutation-readiness`, pass `mutation-readiness-audit`, record approval and dry-run evidence, and execute only through `mutation-execute` or a target-specific `*-mutation-execute` wrapper with an exact `--confirm-plan` match.
