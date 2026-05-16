# User Guide

This guide is for operating `ariadne` as a source-grounded coding harness.

## Mental Model

The repo turns messy project input into auditable work packages:

1. Raw evidence goes into the vault.
2. The vault produces a context dossier.
3. The dossier becomes requirements.
4. Requirements become GSD tasks.
5. Tasks become execution and verification plans.
6. Checks, reviews, Playwright evidence, and evaluations decide whether the work is ready.

## Start A Project

```bash
npm install
npm run check
npm test
npm run cli -- ingest --project ariadne ./notes.md ./whitepaper.docx
npm run cli -- assemble --project ariadne
```

The important output paths are printed by the CLI. The hot index is always at:

```text
vault/projects/ariadne/HOT_INDEX.md
```

## Generate The Planning Spine

```bash
npm run cli -- prd --project ariadne
npm run cli -- gsd --project ariadne
npm run cli -- gsd2-export --project ariadne
```

For a complete local planning pass:

```bash
npm run cli -- roadmap --project ariadne --target-url http://localhost:3000 --repo /path/to/repo
```

## Add Manual Research

NotebookLM, browser research, or other human-reviewed exports should be imported as files:

```bash
npm run cli -- notebooklm-import --project ariadne --from notebooklm-export.md
```

Do not paste untracked conclusions into the plan. Preserve the source export and let the vault reference it.

## Prepare Work

Generate an execution run:

```bash
npm run cli -- execution --project ariadne --repo /path/to/repo
```

Check whether the worktree plan is safe:

```bash
npm run cli -- worktree-guard --project ariadne --run vault/projects/ariadne/execution/run-...json
```

Only use `--apply` after reviewing the generated run and guard report.

## Record Verification

Use deterministic checks first:

```bash
npm run check
npm test
npm run build
```

Record them if they are part of a control report:

```bash
npm run cli -- record-check --project ariadne --name typecheck --status passed --command "npm run check"
npm run cli -- record-check --project ariadne --name unit-tests --status passed --command "npm test"
npm run cli -- record-check --project ariadne --name build --status passed --command "npm run build"
```

Record UI evidence when a target exists:

```bash
npm run cli -- playwright-evidence --project ariadne --target-url http://localhost:3000 --status passed --screenshot path/to/screenshot.png --trace path/to/trace.zip
```

## Evaluate The Pipeline

Create an evaluation plan:

```bash
npm run cli -- evaluation --project ariadne --target mac-local
```

Check that the expected artifact spine exists:

```bash
npm run cli -- artifact-checks --project ariadne
```

The report is written to `vault/projects/ariadne/evaluation/artifact-checks.md` and lists each required or optional artifact path. Required missing artifacts make the report status `missing`.

Generate repeatable benchmark source packs:

```bash
npm run cli -- benchmark-pack --set all
```

This writes smoke, realistic, and stress packs under `benchmarks/source-packs/`. Each pack has a `benchmark-pack.json`, a README, source files, and recommended commands for exercising the harness.

After a real run, record scores:

```bash
npm run cli -- evaluation-record --project ariadne --plan vault/projects/ariadne/evaluation/evaluation-plan.json --scores D1=80,D2=70,D3=65,D4=75,D5=60 --evidence vault/projects/ariadne/control/merge-readiness.md
```

Scores are deliberately explicit and inspectable. They are not a model grade; they are an operator's current assessment backed by evidence references.

## Check Readiness

```bash
npm run cli -- control --project ariadne
```

The control report is the answer to: what is proven, what is missing, and what gate still blocks the work?

## Publish Console Data

```bash
npm run cli -- console-data --project ariadne
npm run cli -- console-html --project ariadne --refresh-data
```

This writes `vault/projects/ariadne/console/console-data.json`, a read-only projection for future UI work, and `vault/projects/ariadne/console/index.html`, a static console you can open locally. Both are safe to regenerate.

## Handling Secrets

Ingest scans text-bearing files for common secret patterns. High-severity findings block ingestion by default. Use `--allow-secret-findings` only when intentionally preserving a sensitive artifact inside an appropriately protected vault.
