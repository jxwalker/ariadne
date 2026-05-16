# Testing And Evaluation System

The evaluation system measures whether the pipeline itself is becoming more reliable. It is inspired by harness engineering: keep cheap computational sensors close to generation, use inferential sensors where semantic judgment is needed, and record every claim as evidence.

## Goals

- Detect whether source fidelity is being preserved.
- Score whether PRDs, GSD tasks, execution plans, and verification artifacts are useful.
- Compare runs across Mac, DGX Spark, Proxmox Linux, and future runner pools.
- Surface regressions in the harness before they become automation failures.
- Give console work a concrete data model.

## Artifact Contract

`evaluation` writes:

```text
vault/projects/<project>/evaluation/evaluation-plan.json
vault/projects/<project>/evaluation/evaluation-plan.md
```

`evaluation-record` writes timestamped run records:

```text
vault/projects/<project>/evaluation/evaluation-<timestamp>.json
vault/projects/<project>/evaluation/evaluation-<timestamp>.md
```

## Dimensions

| Id | Dimension | Sensors |
| --- | --- | --- |
| D1 | Evidence fidelity | manifest, hashes, hygiene reports, dossier source refs |
| D2 | Planning quality | PRD, roadmap, GSD2 bundle, write scopes |
| D3 | Execution safety | execution run, worktree guard, decision records |
| D4 | Verification strength | typecheck, unit tests, build, Playwright, CodeRabbit |
| D5 | Operational fit | infra registry, snapshots, control report |

## Standard Evaluation Flow

```bash
npm run cli -- roadmap --project ariadne --target-url http://localhost:3000 --repo /path/to/repo
npm run cli -- evaluation --project ariadne --target mac-local
npm run check
npm test
npm run build
npm run cli -- control --project ariadne
npm run cli -- evaluation-record --project ariadne --plan vault/projects/ariadne/evaluation/evaluation-plan.json --scores D1=80,D2=75,D3=70,D4=65,D5=60 --evidence vault/projects/ariadne/control/merge-readiness.md
```

## Benchmark Sets

Use three benchmark sets as the system matures:

- Smoke: one Markdown source, one PRD, one GSD bundle, one control report.
- Realistic: a mixed source packet with `.docx`, Markdown, images, manual NotebookLM export, CI import, and review import.
- Stress: multi-project vault, stale artifacts, failed checks, invalid infrastructure snapshot, and interrupted execution run.

## Pass Criteria

A run is acceptable when:

- deterministic checks pass,
- evidence paths exist,
- control report has no unexplained missing gates,
- evaluation records cite the evidence used for scoring,
- regressions are listed rather than hidden.

## Future Automation

Next evaluation work should add:

- automatic artifact existence checks,
- Playwright screenshot and trace ingestion,
- mutation or fixture-based tests for behavior harness confidence,
- cost and token metrics from Hermes or CodeRabbit,
- longitudinal trend reports for console visualisation.
