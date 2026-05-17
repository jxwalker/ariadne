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

`gsd2-process` writes selected local GSD process evidence:

```text
vault/projects/<project>/gsd/process/gsd2-process-<timestamp>.json
vault/projects/<project>/gsd/process/gsd2-process-<timestamp>.md
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

`mutation-readiness` writes non-executing live-adapter readiness plans:

```text
vault/projects/<project>/control/mutation-readiness/mutation-readiness-<target>-<timestamp>.json
vault/projects/<project>/control/mutation-readiness/mutation-readiness-<target>-<timestamp>.md
```

`mutation-readiness-audit` writes the aggregate gate report for those plans:

```text
vault/projects/<project>/control/mutation-readiness-audit.json
vault/projects/<project>/control/mutation-readiness-audit.md
```

The audit is a non-mutating evaluator. It checks approval state, evidence refs, dry-run command safety, post-action verification, rollback text, and `execute=false`.

`live-adapter-cutover-audit` is the final non-mutating evaluator before replacing placeholder commands with target adapters. It checks complete operator evidence, current packet-review evidence, audit-passed readiness plans, auth evidence, rollback and post-verification acceptance, passed dry-run evidence, passed target-guarded execution evidence, target wrapper availability, generated dossiers, and advisory GBrain context.

`live-adapter-review-session` is an operator-facing evaluator over the same evidence. It proves the current review workload is explicit by listing every target's first action, packet-review command, approval request draft, mutation-plan draft, required evidence, dossier ref, cutover blockers, and GBrain advisory queries. It is not a gate bypass: it writes `mutationApproved=false` and only makes the next human review step inspectable.

`live-adapter-evidence-templates` turns that review workload into blank per-target collection files. It improves evaluation by making missing proof explicit without letting placeholders pass gates: templates are marked `awaiting_operator_evidence` and are not counted as approval evidence until a human fills them with concrete observations and artifact refs.

`live-adapter-operator-evidence-check` evaluates a filled operator file without creating an evidence record. It is a preflight path for catching missing sections while writing `recorded=false`, `operatorEvidenceRecordCreated=false`, `mutationApproved=false`, and `approvalGranted=false`.

`live-adapter-operator-evidence-check-all` evaluates every current target template with the same preflight logic, writes one aggregate batch report, and refreshes the queue. It improves evaluation coverage by making unchecked targets explicit before an operator starts filling or importing evidence.

`live-adapter-operator-evidence-queue` evaluates the operator work queue after preflight checks. It does not prove evidence by itself; it tells the operator which targets are unchecked, which need more evidence, and which checked files are ready to import.

`live-adapter-operator-evidence` and `live-adapter-operator-evidence-audit` evaluate those filled operator files. The importer hashes the source, checks required evidence sections, keeps GBrain notes advisory, and writes `mutationApproved=false` plus `approvalGranted=false`. The audit reports complete, incomplete, and missing targets so the console can show evidence blockers before any live-adapter implementation work proceeds.

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
npm run ariadne -- benchmark-run --project bench-smoke --set smoke
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

Run a pack through the local deterministic pipeline with:

```bash
npm run ariadne -- benchmark-run --project bench-smoke --set smoke
npm run ariadne -- benchmark-run --project bench-all --set all
```

`benchmark-run` reads the pack manifest, ingests source files into benchmark projects, generates PRD/GSD/GSD2/execution/Playwright/evaluation/infrastructure/control/GBrain artifacts, imports role-specific fixtures, runs artifact checks, and records a benchmark report. It does not call live services or execute mutation-capable commands.

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
- benchmark runs prove the source packs can drive the local pipeline end to end,
- console visual checks prove the static console renders expected sections and trend chart hooks,
- regressions are listed rather than hidden.

## Future Automation

Next evaluation work should add optional automatic repair execution only after review gates and mutation approvals are explicit.
