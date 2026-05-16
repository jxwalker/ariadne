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
npm run ariadne -- ingest --project ariadne ./notes.md ./whitepaper.docx
npm run ariadne -- assemble --project ariadne
```

The important output paths are printed by the runner. The hot index is always at:

```text
vault/projects/ariadne/HOT_INDEX.md
```

## Generate The Planning Spine

```bash
npm run ariadne -- prd --project ariadne
npm run ariadne -- gsd --project ariadne
npm run ariadne -- gsd2-export --project ariadne
npm run ariadne -- gsd2-process --project ariadne --binary gsd
```

`gsd2-process` records the selected local `gsd` executable version, package list, output modes, and subcommands. It is read-only and does not invoke headless execution, models, package install/update, or worktree mutation.

For a complete local planning pass:

```bash
npm run ariadne -- roadmap --project ariadne --target-url http://localhost:3000 --repo /path/to/repo
```

## Add Manual Research

NotebookLM, browser research, or other human-reviewed exports should be imported as files:

```bash
npm run ariadne -- notebooklm-import --project ariadne --from notebooklm-export.md
```

Do not paste untracked conclusions into the plan. Preserve the source export and let the vault reference it.

## Import OCR, Transcription, Or Drawing Descriptions

When `ingest` creates a handoff for an image, audio file, or PDF, first record the selected tool and host placement:

```bash
npm run ariadne -- extraction-plan --project ariadne --record <record-id> --tool whisper.cpp --host "M5 Max" --runner mac
```

The plan writes `extractions/plans/extraction-plan-...json` and `.md` with the raw input path, handoff path, planned output path, constraints, and exact follow-up import command. It does not run the extraction tool.

After the external tool output has been reviewed, import the resulting text:

```bash
npm run ariadne -- extraction-import --project ariadne --record <record-id> --from extracted.md --kind visual-description --tool manual-review --confidence 0.9 --notes "Checked against the original whiteboard."
```

Supported kinds are `ocr`, `transcription`, `pdf-text`, and `visual-description`. The command updates the original source record with `extracted.md` and writes durable extraction evidence under `vault/projects/ariadne/extractions/`.

## Prepare Work

Generate an execution run:

```bash
npm run ariadne -- execution --project ariadne --repo /path/to/repo
```

Check whether the worktree plan is safe:

```bash
npm run ariadne -- worktree-guard --project ariadne --run vault/projects/ariadne/execution/run-...json
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
npm run ariadne -- record-check --project ariadne --name typecheck --status passed --command "npm run check"
npm run ariadne -- record-check --project ariadne --name unit-tests --status passed --command "npm test"
npm run ariadne -- record-check --project ariadne --name build --status passed --command "npm run build"
```

Record UI evidence when a target exists:

```bash
npm run ariadne -- playwright-capture --project ariadne --target-url http://localhost:3000 --selector "text=Dashboard"
npm run ariadne -- playwright-evidence --project ariadne --target-url http://localhost:3000 --status passed --screenshot path/to/screenshot.png --trace path/to/trace.zip
```

Use `playwright-capture` when Ariadne should create the screenshot and trace itself. It writes artifacts under `vault/projects/ariadne/verification/playwright-captures/` and records a standard Playwright evidence file under `verification/`. Use `playwright-evidence` when the screenshot and trace already came from another test runner.

When a Playwright evidence record fails, create a review-gated repair proposal:

```bash
npm run ariadne -- healer-proposal --project ariadne --evidence vault/projects/ariadne/verification/playwright-...json
```

The proposal cites the failed evidence, screenshot, and trace; suggests bounded repair actions; and keeps `apply: false` so no test or app code changes without review.

## Evaluate The Pipeline

Create an evaluation plan:

```bash
npm run ariadne -- evaluation --project ariadne --target mac-local
```

Check that the expected artifact spine exists:

```bash
npm run ariadne -- artifact-checks --project ariadne
```

The report is written to `vault/projects/ariadne/evaluation/artifact-checks.md` and lists each required or optional artifact path. Required missing artifacts make the report status `missing`.

Generate repeatable benchmark source packs:

```bash
npm run ariadne -- benchmark-pack --set all
```

This writes smoke, realistic, and stress packs under `benchmarks/source-packs/`. Each pack has a `benchmark-pack.json`, a README, source files, and recommended commands for exercising the harness.

After a real run, record scores:

```bash
npm run ariadne -- evaluation-record --project ariadne --plan vault/projects/ariadne/evaluation/evaluation-plan.json --scores D1=80,D2=70,D3=65,D4=75,D5=60 --evidence vault/projects/ariadne/control/merge-readiness.md
```

Scores are deliberately explicit and inspectable. They are not a model grade; they are an operator's current assessment backed by evidence references.

Generate a trend report after one or more scored runs:

```bash
npm run ariadne -- evaluation-trends --project ariadne
```

The report is written to `vault/projects/ariadne/evaluation/evaluation-trends.md` and shows latest score, previous score, overall delta, per-dimension deltas, latest regressions, and latest recommendations.

Import token and cost metrics from a JSON export:

```bash
npm run ariadne -- usage-import --project ariadne --from usage.json --source hermes
npm run ariadne -- usage-report --project ariadne
```

The importer accepts common fields such as `input_tokens`, `output_tokens`, `prompt_tokens`, `completion_tokens`, `total_tokens`, and `cost_usd`. The report is written to `vault/projects/ariadne/evaluation/usage-report.md`.

Run behavior checks before trusting an execution slice:

```bash
npm run ariadne -- behavior-checks --project ariadne --approved-fixture coderabbit.md
```

This checks approval evidence, mutation gates, read-only infrastructure snapshots, non-submitting governance drafts, and worktree guard records.

## Optional GBrain Memory Index

Ariadne can export a derived bundle for GBrain:

```bash
npm run ariadne -- gbrain-export --project ariadne
```

Import the generated JSON or Markdown into GBrain if you want hybrid search over Ariadne evidence. Keep Ariadne as the source of truth. If GBrain produces query or eval output, import that report back:

```bash
npm run ariadne -- gbrain-report-import --project ariadne --from gbrain-report.json
```

## Coordinate Long-Running Agents

Use file-backed records before adding live scheduling or interagent services:

```bash
npm run ariadne -- sleep-record --project ariadne --scope nightly --summary "Review stale gates" --evidence control/merge-readiness.md --next "Refresh console data"
npm run ariadne -- memory-proposal --project ariadne --title "Adapter lesson" --proposal "Keep live adapters read-only until proven." --evidence docs/adapters.md
npm run ariadne -- agent-mail --project ariadne --from planner --to executor --subject "Next slice" --body "Run checks before editing."
npm run ariadne -- agent-lease --project ariadne --agent executor --resource repo:/ariadne --status acquired
npm run ariadne -- hermes-cron-import --project ariadne --from hermes-cron.json --host beast
npm run ariadne -- hermes-cron-proposal --project ariadne --scope nightly
```

These records are intentionally append-only and live under `vault/projects/ariadne/coordination/`. Hermes cron imports are read-only snapshots and proposals are review-only recommendations: Ariadne records what Hermes says is scheduled, but does not create, enable, disable, or run jobs.

## Import Deployment Evidence

For Macs, DGX Spark, Proxmox, TrueNAS, GitHub, and generic estate snapshots:

```bash
npm run ariadne -- deployment-snapshot --project ariadne --system proxmox --from deployment.json
```

Snapshots are read-only evidence. They are used by the console and evaluation system to make deployment posture visible without granting mutation capability.

For an approved remote host, collect a host-specific live deployment profile over SSH:

```bash
npm run ariadne -- deployment-live-ssh --project ariadne --system dgx-spark --host "DGX Spark" --target james@dgx-spark.lan --notes "Approved read-only deployment profile"
```

This writes both a sanitized infrastructure snapshot and a deployment snapshot. Supported live deployment systems are `proxmox`, `truenas`, `dgx-spark`, and `mac`; the collector remains read-only and derives confidence from observed capabilities such as Proxmox tooling, ZFS, Docker, and `nvidia-smi`.

For the current machine, collect a sanitized live read-only local inventory:

```bash
npm run ariadne -- infra-live-local --project ariadne --notes "Mac workstation read-only snapshot"
```

This uses local Node.js OS APIs only. It hashes the hostname and omits network and MAC addresses before writing `infrastructure/infra-snapshot-live-local-...json`.

For an approved remote host reachable over SSH, collect a sanitized read-only inventory:

```bash
npm run ariadne -- infra-live-ssh --project ariadne --host beast --target james@beast.lan --notes "Approved read-only remote snapshot"
```

The saved snapshot keeps the host label, hashes the SSH target and reported hostname, omits network and MAC addresses, and records OS, CPU, memory, filesystem count, and common platform capabilities. The command runs only a fixed read-only POSIX inventory script.

## Import GitHub PR And Check Evidence

Use `github-snapshot` when Ariadne needs durable PR and check-state evidence:

```bash
npm run ariadne -- github-snapshot --project ariadne --from github-pr.json --repo jxwalker/ariadne
npm run ariadne -- github-snapshot --project ariadne --repo jxwalker/ariadne --pr 10
```

The `--from` path is deterministic and works with saved fixtures. The `--repo` path uses the local `gh` CLI in read-only mode. The adapter records PR state, draft status, review decision, and check rollup summaries under `vault/projects/ariadne/integrations/github/`.

## Request Mutation Approval

Before enabling any mutation-capable adapter, record the request:

```bash
npm run ariadne -- approval-request --project ariadne --by planner --target github --action "Enable PR mutation adapter" --risk medium --reason "Manual gate before live mutation" --rollback "Disable adapter and return to manual PR flow"
```

After review, record the decision:

```bash
npm run ariadne -- approval-decision --project ariadne --approval approval-... --status approved --by james --notes "Approved for a bounded test only."
```

Approval records live under `vault/projects/ariadne/control/approvals/`. They are evidence and queue items, not executable authority.

Before implementing or enabling a live mutation adapter, record the bounded readiness plan:

```bash
npm run ariadne -- mutation-readiness --project ariadne --target github --scope "Single PR merge adapter" --auth-evidence control/approvals/approval-...json --dry-run "gh pr view 1 --json statusCheckRollup" --live-command "gh pr merge 1 --squash" --rollback "Revert merge commit and disable adapter" --approval approval-...
```

The readiness plan writes `execute=false`. It must cite auth evidence, a dry-run command, the proposed live command, rollback, approval state, and target-specific gates. It is still not permission to execute; it is the artifact reviewers use before a live adapter exists.

## Check Readiness

```bash
npm run ariadne -- control --project ariadne
```

The control report is the answer to: what is proven, what is missing, and what gate still blocks the work?

## Recover Interrupted Work

```bash
npm run ariadne -- recovery-report --project ariadne
```

The recovery report reads the recorded execution runs, worktree guard files, check history, review history, and merge-readiness report. It writes `vault/projects/ariadne/control/recovery-report.md` with resume actions for each run and a list of issues that need attention before continuing.

## Publish Console Data

```bash
npm run ariadne -- console-data --project ariadne
npm run ariadne -- console-html --project ariadne --refresh-data
npm run ariadne -- console-visual-checks --project ariadne
npm run ariadne -- console-browser-checks --project ariadne
```

This writes `vault/projects/ariadne/console/console-data.json`, a read-only projection for future UI work, and `vault/projects/ariadne/console/index.html`, a static console you can open locally. Both are safe to regenerate.

`console-visual-checks` writes `vault/projects/ariadne/console/visual-checks.md`. It verifies the generated console has the expected visual sections, parseable embedded data, a trend chart or empty-state hook, and no local absolute path leaks.

`console-browser-checks` writes `vault/projects/ariadne/console/browser-checks.md` and a PNG screenshot under `vault/projects/ariadne/console/screenshots/`. It uses Playwright Chromium to prove that the static console renders in a real browser.

## Handling Secrets

Ingest scans text-bearing files for common secret patterns. High-severity findings block ingestion by default. Use `--allow-secret-findings` only when intentionally preserving a sensitive artifact inside an appropriately protected vault.
