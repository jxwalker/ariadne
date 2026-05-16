# Adapter Contracts

The roadmap adapters are file-contract surfaces first. They produce evidence and plans that humans and later live adapters can inspect.

## Source Hygiene

`ingest` scans text-bearing sources for common secret patterns before copying them into the vault. High-severity findings block promotion unless `--allow-secret-findings` is passed.

## Source Extraction Results

`extraction-import` imports reviewed output from OCR, transcription, PDF extraction, or visual-description tools and attaches it to the original source record:

```bash
npm run ariadne -- extraction-import --project ariadne --record <record-id> --from extracted.md --kind ocr --tool tesseract
```

`extraction-plan` records the explicit runner selection before any OCR or transcription tool is run:

```bash
npm run ariadne -- extraction-plan --project ariadne --record <record-id> --tool whisper.cpp --host "M5 Max" --runner mac
```

The plan is non-mutating. It binds a handoff record to a tool, host, runner type, extraction kind, planned output path, constraints, and the exact `extraction-import` command to run after review.

Artifacts:

- `raw/<record-id>/extracted-<extraction-id>.md`
- `extractions/extraction-<timestamp>.json`
- `extractions/extraction-<timestamp>.md`
- `extractions/plans/extraction-plan-<timestamp>.json`
- `extractions/plans/extraction-plan-<timestamp>.md`

The command preserves the raw evidence, records the external tool and optional confidence, and updates the manifest with both the latest extracted text path and the full list of imported extraction paths.

## NotebookLM

`notebooklm-import` normalises a manual NotebookLM markdown/text export into:

- `requirements/notebooklm-import.json`
- `requirements/notebooklm-import.md`

Automation is intentionally not implemented yet. Manual import remains the fallback.

## GSD2

`gsd2-export` writes `gsd/gsd2-bundle.json`, a flattened task bundle with milestone metadata. `gsd2-import` can rebuild a roadmap from that bundle.

`gsd2-process` collects a read-only snapshot from the selected local `gsd` executable:

```bash
npm run ariadne -- gsd2-process --project ariadne --binary gsd
```

It runs `gsd --version`, `gsd list`, and `gsd --help`, then records version, package list, supported output modes, and subcommands. It does not run `gsd headless`, `gsd auto`, model commands, package install/update, or worktree mutation.

Artifacts:

- `gsd/process/gsd2-process-<timestamp>.json`
- `gsd/process/gsd2-process-<timestamp>.md`

## Decision Logging

`decision` records timestamped architectural decisions in the project decisions directory. It builds a `DecisionRecord` through `recordDecision`, renders the companion Markdown with `renderDecision`, and writes both:

- `decisions/<decision-id>.json`
- `decisions/<decision-id>.md`

Typical fields include status, context, consequences, and source references so later control reports can point back to the evidence behind a decision.

## Execution

`worktree-guard` checks the execution run before any worktree creation:

- repo path present
- working tree clean
- worktree paths available
- branches do not already exist

`--apply` is the only mode that creates worktrees.

## Verification And Review

`playwright-capture` opens a target URL with Playwright Chromium, captures a screenshot and trace archive, and records them as Playwright evidence:

```bash
npm run ariadne -- playwright-capture --project ariadne --target-url http://localhost:3000 --selector "text=Dashboard"
```

Artifacts:

- `verification/playwright-captures/target-<timestamp>.png`
- `verification/playwright-captures/target-<timestamp>.zip`
- `verification/playwright-<timestamp>.json`
- `verification/playwright-<timestamp>.md`

`playwright-evidence`, `import-ci`, and `import-coderabbit` write evidence records into the project control plane. They do not mark the project ready unless the required gates are satisfied.

`healer-proposal` reads failed Playwright evidence and writes a repair proposal that must be reviewed before any code or test change is accepted:

```bash
npm run ariadne -- healer-proposal --project ariadne --evidence vault/projects/ariadne/verification/playwright-...json
```

Artifacts:

- `verification/healer-proposals/healer-<timestamp>.json`
- `verification/healer-proposals/healer-<timestamp>.md`

The proposal records observations, suggested files, verification commands, and review gates. It always writes `apply: false`.

`github-snapshot` records read-only pull request and check state from either a saved GitHub JSON export or the `gh` CLI:

```bash
npm run ariadne -- github-snapshot --project ariadne --from github-pr.json --repo jxwalker/ariadne
npm run ariadne -- github-snapshot --project ariadne --repo jxwalker/ariadne --pr 10
```

The live mode only runs read operations through `gh pr view` or `gh pr list`. It does not create branches, update PRs, approve reviews, retry checks, or merge.

Artifacts:

- `integrations/github/github-snapshot-<timestamp>.json`
- `integrations/github/github-snapshot-<timestamp>.md`

## Recovery

`recovery-report` reads the vault state and writes a crash-resume report without mutating worktrees, branches, PRs, or external systems. It identifies incomplete execution runs, missing worktree guard reports, failed checks, pending reviews, and missing readiness gates.

Artifacts:

- `control/recovery-report.json`
- `control/recovery-report.md`

## Approval Workflow

`approval-request` records an explicit human approval request before any mutation-capable adapter can be enabled. `approval-decision` records the decision. These commands only write evidence; they do not execute the requested action.

`mutation-readiness` records the bounded plan that must exist before a mutation-capable adapter is implemented or enabled. It binds target, risk, scope, auth evidence, supporting evidence, dry-run command, proposed live command, post-action verification command, rollback, approval record, and target-specific gates. It also writes `execute=false`, so it is readiness evidence rather than execution authority.

`mutation-readiness-audit` aggregates all readiness plans and reports whether each plan has approved human authorization, existing evidence refs, a non-mutating dry-run command, a post-action verification command, rollback text, and `execute=false`. It never runs dry-run or live commands.

`mutation-dry-run` executes only the reviewed dry-run command for one readiness plan, and only when that exact plan passes the readiness audit. It captures stdout, stderr, exit code, duration, audit reference, and `execute=false` as evidence. It never runs the proposed live command or post-action verification command.

```bash
npm run ariadne -- approval-request --project ariadne --by planner --target github --action "Enable PR mutation adapter" --risk medium --reason "Manual gate before live mutation" --rollback "Disable adapter and return to manual PR flow"
npm run ariadne -- approval-decision --project ariadne --approval approval-... --status approved --by james --notes "Approved for a bounded test only."
npm run ariadne -- mutation-readiness --project ariadne --target github --scope "Single PR merge adapter" --auth-evidence control/approvals/approval-...json --dry-run "gh pr view 1 --json statusCheckRollup" --live-command "gh pr merge 1 --squash" --post-verify "gh pr view 1 --json mergeStateStatus,statusCheckRollup" --rollback "Revert merge commit and disable adapter" --approval approval-...
npm run ariadne -- mutation-readiness-audit --project ariadne
npm run ariadne -- mutation-dry-run --project ariadne --plan mutation-readiness-github-...
```

Artifacts:

- `control/approvals/approval-<timestamp>.json`
- `control/approvals/approval-<timestamp>.md`
- `control/mutation-readiness/mutation-readiness-<target>-<timestamp>.json`
- `control/mutation-readiness/mutation-readiness-<target>-<timestamp>.md`
- `control/mutation-readiness-audit.json`
- `control/mutation-readiness-audit.md`
- `control/mutation-dry-runs/mutation-dry-run-<timestamp>.json`
- `control/mutation-dry-runs/mutation-dry-run-<timestamp>.md`

## Evaluation

`evaluation` creates a project evaluation plan with dimensions for evidence fidelity, planning quality, execution safety, verification strength, and operational fit. `evaluation-record` stores scored run evidence so the pipeline can be compared across machines and over time.

`evaluation-trends` reads timestamped evaluation records and writes overall plus per-dimension deltas for console charting and release review.

`usage-import` appends token and cost metrics from Hermes, CodeRabbit, OpenAI, CI, or manual JSON exports. `usage-report` aggregates those records by source and model so evaluation can track model/review spend without live service calls.

`artifact-checks` is a deterministic evaluation sensor. It verifies that the required evidence spine exists before an operator records scores or relies on a control report. Optional console artifacts are reported without blocking the status.

`behavior-checks` records behavior-confidence checks for:

- approved review fixtures,
- explicit human-approval gates before mutation,
- approval workflow records for mutation-capable adapters,
- read-only infrastructure snapshot modes,
- non-submitting OpenScorpion activity drafts,
- worktree guard records.

`benchmark-pack` materialises repeatable source packs for smoke, realistic, and stress evaluations. The packs are local files only; they do not ingest sources or call live services by themselves.

`benchmark-run` runs one generated pack through the local deterministic Ariadne pipeline and records the outcome as evaluation evidence. It uses the pack's file roles to ingest sources and import fixtures, then generates planning, verification, control, behavior, GBrain, and artifact-check outputs. It does not call live services or execute mutation-capable commands.

Artifacts:

- `evaluation/evaluation-plan.json`
- `evaluation/evaluation-plan.md`
- `evaluation/evaluation-<timestamp>.json`
- `evaluation/evaluation-<timestamp>.md`
- `evaluation/benchmark-run-<set>-<timestamp>.json`
- `evaluation/benchmark-run-<set>-<timestamp>.md`
- `evaluation/evaluation-trends.json`
- `evaluation/evaluation-trends.md`
- `evaluation/usage-metrics.jsonl`
- `evaluation/usage-report.json`
- `evaluation/usage-report.md`
- `evaluation/artifact-checks.json`
- `evaluation/artifact-checks.md`
- `evaluation/behavior-checks.json`
- `evaluation/behavior-checks.md`
- `benchmarks/source-packs/<set>/benchmark-pack.json`
- `benchmarks/source-packs/<set>/README.md`

## GBrain

`gbrain-export` writes a read-only Ariadne evidence bundle for optional import into [GBrain](https://github.com/garrytan/gbrain). Ariadne remains the source of truth; GBrain is treated as a derived memory/search substrate.

Artifacts:

- `integrations/gbrain/gbrain-export.json`
- `integrations/gbrain/gbrain-export.md`

`gbrain-report-import` imports a GBrain query, search, or eval report JSON back into Ariadne as evidence:

- `integrations/gbrain/gbrain-report-<timestamp>.json`
- `integrations/gbrain/gbrain-report-<timestamp>.md`

## Sleep, Memory, And Agent Mail

The coordination adapters are append-only file records:

- `sleep-record`: recurring review summaries and proposed next actions.
- `memory-proposal`: durable lessons proposed from evidence, not silently written into global memory.
- `agent-mail`: interagent inbox/outbox messages tied to optional task and run ids.
- `agent-lease`: ownership records for worktrees, repos, hosts, or other contested resources.
- `hermes-cron-import`: read-only evidence imports from Hermes cron/job snapshots.
- `hermes-cron-proposal`: proposal-only recommendations from imported Hermes scheduler evidence.

Artifacts are written under `coordination/`, `coordination/mail/`, `coordination/leases/`, and `coordination/hermes/`.

`hermes-cron-import` normalises common cron export shapes such as `jobs`, `cronJobs`, `scheduledJobs`, or `tasks`. It records job names, schedules, enabled state, last/next run hints, and a short intent summary. It redacts obvious secret-like fields and never creates, enables, disables, or runs Hermes jobs.

```bash
npm run ariadne -- hermes-cron-import --project ariadne --from hermes-cron.json --host beast
npm run ariadne -- hermes-cron-proposal --project ariadne --scope nightly
```

Artifacts:

- `coordination/hermes/hermes-cron-<timestamp>.json`
- `coordination/hermes/hermes-cron-<timestamp>.md`
- `coordination/hermes/hermes-cron-proposal-<timestamp>.json`
- `coordination/hermes/hermes-cron-proposal-<timestamp>.md`

## Console Data

`console-data` writes a normalised read-only projection of the vault to:

- `console/console-data.json`

The record includes source summaries, requirements, GSD tasks, execution runs, checks, reviews, decisions, Playwright evidence, evaluation runs, GitHub snapshots, recovery state, infrastructure registry/snapshots, merge readiness, and key artifact paths. It is intended as the stable data contract for future console UI work.

`console-html` renders that contract into:

- `console/index.html`

Use `--refresh-data` to regenerate `console/console-data.json` before rendering the HTML.

`console-visual-checks` performs deterministic checks against the generated console HTML. It verifies the expected visual sections, embedded data, evaluation trend chart or empty state, and absence of local absolute-path leaks.

`console-browser-checks` opens the generated console with Playwright Chromium, verifies key rendered sections, parses embedded data, captures a screenshot, and writes browser-backed evidence.

Artifacts:

- `console/visual-checks.json`
- `console/visual-checks.md`
- `console/browser-checks.json`
- `console/browser-checks.md`
- `console/screenshots/console-<timestamp>.png`

## Infrastructure And Governance

`infra-snapshot` imports a read-only JSON snapshot. `openscorpion-draft` writes a governed activity draft with `submit: false`; live submission requires a later approved adapter.

`infra-live-local` collects a sanitized live read-only snapshot of the current host:

```bash
npm run ariadne -- infra-live-local --project ariadne --notes "Mac workstation read-only snapshot"
```

The collector uses local Node.js OS APIs, hashes the hostname, omits network and MAC addresses, and records `snapshotKind: live_read_only`. It does not connect to remote hosts or mutate infrastructure.

`infra-live-ssh` collects the same class of evidence from an approved remote host over SSH:

```bash
npm run ariadne -- infra-live-ssh --project ariadne --host beast --target james@beast.lan --notes "Approved read-only remote snapshot"
```

The SSH collector runs a fixed POSIX read-only inventory script, stores the human host label, hashes the SSH target and reported hostname, omits network and MAC addresses, and records capabilities such as Docker, Proxmox, ZFS, and `nvidia-smi`. It does not upload files, edit configuration, restart services, or execute mutation-capable commands.

`deployment-snapshot` imports read-only estate snapshots for Proxmox, TrueNAS, DGX Spark, Macs, GitHub, or generic systems. This is the deployment adapter bridge for visualising where Ariadne can run without granting mutation capability.

`deployment-live-ssh` collects a host-specific deployment profile from an approved SSH target:

```bash
npm run ariadne -- deployment-live-ssh --project ariadne --system proxmox --host beast --target james@beast.lan --notes "Approved read-only deployment profile"
```

It first records the sanitized SSH infrastructure snapshot, then writes a deployment snapshot for `proxmox`, `truenas`, `dgx-spark`, or `mac`. The profile includes capability evidence, a confidence level, and counts for model endpoints, runner pools, storage pools, and services. It never mutates the host.
