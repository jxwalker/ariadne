# User Guide

This guide is for operating `dev-pipeline` as a source-grounded coding harness.

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
npm run cli -- ingest --project agentic-coding ./notes.md ./whitepaper.docx
npm run cli -- assemble --project agentic-coding
```

The important output paths are printed by the CLI. The hot index is always at:

```text
vault/projects/agentic-coding/HOT_INDEX.md
```

## Generate The Planning Spine

```bash
npm run cli -- prd --project agentic-coding
npm run cli -- gsd --project agentic-coding
npm run cli -- gsd2-export --project agentic-coding
```

For a complete local planning pass:

```bash
npm run cli -- roadmap --project agentic-coding --target-url http://localhost:3000 --repo /path/to/repo
```

## Add Manual Research

NotebookLM, browser research, or other human-reviewed exports should be imported as files:

```bash
npm run cli -- notebooklm-import --project agentic-coding --from notebooklm-export.md
```

Do not paste untracked conclusions into the plan. Preserve the source export and let the vault reference it.

## Prepare Work

Generate an execution run:

```bash
npm run cli -- execution --project agentic-coding --repo /path/to/repo
```

Check whether the worktree plan is safe:

```bash
npm run cli -- worktree-guard --project agentic-coding --run vault/projects/agentic-coding/execution/run-...json
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
npm run cli -- record-check --project agentic-coding --name typecheck --status passed --command "npm run check"
npm run cli -- record-check --project agentic-coding --name unit-tests --status passed --command "npm test"
npm run cli -- record-check --project agentic-coding --name build --status passed --command "npm run build"
```

Record UI evidence when a target exists:

```bash
npm run cli -- playwright-evidence --project agentic-coding --target-url http://localhost:3000 --status passed --screenshot path/to/screenshot.png --trace path/to/trace.zip
```

## Evaluate The Pipeline

Create an evaluation plan:

```bash
npm run cli -- evaluation --project agentic-coding --target mac-local
```

After a real run, record scores:

```bash
npm run cli -- evaluation-record --project agentic-coding --plan vault/projects/agentic-coding/evaluation/evaluation-plan.json --scores D1=80,D2=70,D3=65,D4=75,D5=60 --evidence vault/projects/agentic-coding/control/merge-readiness.md
```

Scores are deliberately explicit and inspectable. They are not a model grade; they are an operator's current assessment backed by evidence references.

## Check Readiness

```bash
npm run cli -- control --project agentic-coding
```

The control report is the answer to: what is proven, what is missing, and what gate still blocks the work?

## Handling Secrets

Ingest scans text-bearing files for common secret patterns. High-severity findings block ingestion by default. Use `--allow-secret-findings` only when intentionally preserving a sensitive artifact inside an appropriately protected vault.
