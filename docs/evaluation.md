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

`evaluation-trends` writes the longitudinal trend report:

```text
vault/projects/<project>/evaluation/evaluation-trends.json
vault/projects/<project>/evaluation/evaluation-trends.md
```

`usage-import` appends normalised token/cost records and `usage-report` writes the aggregate report:

```text
vault/projects/<project>/evaluation/usage-metrics.jsonl
vault/projects/<project>/evaluation/usage-report.json
vault/projects/<project>/evaluation/usage-report.md
```

`artifact-checks` writes the deterministic artifact contract report:

```text
vault/projects/<project>/evaluation/artifact-checks.json
vault/projects/<project>/evaluation/artifact-checks.md
```

`console-visual-checks` writes the deterministic console visual contract report:

```text
vault/projects/<project>/console/visual-checks.json
vault/projects/<project>/console/visual-checks.md
```

`console-browser-checks` writes the Playwright-backed console render report and screenshot:

```text
vault/projects/<project>/console/browser-checks.json
vault/projects/<project>/console/browser-checks.md
vault/projects/<project>/console/screenshots/console-<timestamp>.png
```

`behavior-checks` writes behavior-confidence checks:

```text
vault/projects/<project>/evaluation/behavior-checks.json
vault/projects/<project>/evaluation/behavior-checks.md
```

`hermes-cron-import` writes read-only scheduler evidence:

```text
vault/projects/<project>/coordination/hermes/hermes-cron-<timestamp>.json
vault/projects/<project>/coordination/hermes/hermes-cron-<timestamp>.md
```

`hermes-cron-proposal` writes review-only scheduler recommendations:

```text
vault/projects/<project>/coordination/hermes/hermes-cron-proposal-<timestamp>.json
vault/projects/<project>/coordination/hermes/hermes-cron-proposal-<timestamp>.md
```

`benchmark-pack` writes repeatable input packs:

```text
benchmarks/source-packs/<set>/benchmark-pack.json
benchmarks/source-packs/<set>/README.md
benchmarks/source-packs/<set>/...
```

`playwright-capture` writes browser artifacts and a companion evidence record:

```text
vault/projects/<project>/verification/playwright-captures/target-<timestamp>.png
vault/projects/<project>/verification/playwright-captures/target-<timestamp>.zip
vault/projects/<project>/verification/playwright-<timestamp>.json
vault/projects/<project>/verification/playwright-<timestamp>.md
```

`healer-proposal` writes review-gated repair proposals for failed Playwright evidence:

```text
vault/projects/<project>/verification/healer-proposals/healer-<timestamp>.json
vault/projects/<project>/verification/healer-proposals/healer-<timestamp>.md
```

## Dimensions

| Id | Dimension | Sensors |
| --- | --- | --- |
| D1 | Evidence fidelity | manifest, hashes, hygiene reports, extraction records, dossier source refs |
| D2 | Planning quality | PRD, roadmap, GSD2 bundle, write scopes |
| D3 | Execution safety | execution run, worktree guard, decision records |
| D4 | Verification strength | typecheck, unit tests, build, Playwright, CodeRabbit |
| D5 | Operational fit | infra registry, snapshots, control report |

## Standard Evaluation Flow

```bash
npm run ariadne -- roadmap --project ariadne --target-url http://localhost:3000 --repo /path/to/repo
npm run ariadne -- evaluation --project ariadne --target mac-local
npm run check
npm test
npm run build
npm run ariadne -- artifact-checks --project ariadne
npm run ariadne -- benchmark-pack --set all
npm run ariadne -- evaluation-trends --project ariadne
npm run ariadne -- usage-report --project ariadne
npm run ariadne -- playwright-capture --project ariadne --target-url http://localhost:3000 --selector "text=Dashboard"
npm run ariadne -- healer-proposal --project ariadne --evidence vault/projects/ariadne/verification/playwright-...json
npm run ariadne -- behavior-checks --project ariadne --approved-fixture coderabbit.md
npm run ariadne -- console-html --project ariadne --refresh-data
npm run ariadne -- console-visual-checks --project ariadne
npm run ariadne -- console-browser-checks --project ariadne
npm run ariadne -- control --project ariadne
npm run ariadne -- evaluation-record --project ariadne --plan vault/projects/ariadne/evaluation/evaluation-plan.json --scores D1=80,D2=75,D3=70,D4=65,D5=60 --evidence vault/projects/ariadne/control/merge-readiness.md
```

## Benchmark Sets

Use three benchmark sets:

- Smoke: one Markdown source and expected artifact ids for the standard roadmap plus artifact-checks flow.
- Realistic: a mixed source packet with whitepaper-style prose, dictated notes, sketch handoff, manual NotebookLM export, CI import, CodeRabbit review import, and read-only infra snapshot.
- Stress: multi-project sources, stale execution seed, failed checks, pending review, and unusual infrastructure snapshot shape.

Generate them with:

```bash
npm run ariadne -- benchmark-pack --set all
```

## Pass Criteria

A run is acceptable when:

- deterministic checks pass,
- evidence paths exist,
- artifact checks have no missing required artifacts,
- optional extraction result checks are understood when the source packet includes drawings, audio, or PDFs,
- control report has no unexplained missing gates,
- evaluation records cite the evidence used for scoring,
- trend reports show whether scores are stable, improving, or declining,
- token/cost reports make review and model-spend visible,
- behavior checks prove approved fixtures and no-mutation gates are present,
- console visual checks prove the static console renders expected sections and trend chart hooks,
- regressions are listed rather than hidden.

## Future Automation

Next evaluation work should add:

- browser-backed screenshot comparison for target apps,
- optional automatic repair execution only after review gates and mutation approvals are explicit.
