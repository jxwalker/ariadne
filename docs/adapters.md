# Adapter Contracts

The roadmap adapters are file-contract surfaces first. They produce evidence and plans that humans and later live adapters can inspect.

## Source Hygiene

`ingest` scans text-bearing sources for common secret patterns before copying them into the vault. High-severity findings block promotion unless `--allow-secret-findings` is passed.

## NotebookLM

`notebooklm-import` normalises a manual NotebookLM markdown/text export into:

- `requirements/notebooklm-import.json`
- `requirements/notebooklm-import.md`

Automation is intentionally not implemented yet. Manual import remains the fallback.

## GSD2

`gsd2-export` writes `gsd/gsd2-bundle.json`, a flattened task bundle with milestone metadata. `gsd2-import` can rebuild a roadmap from that bundle.

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

`playwright-evidence`, `import-ci`, and `import-coderabbit` write evidence records into the project control plane. They do not mark the project ready unless the required gates are satisfied.

## Evaluation

`evaluation` creates a project evaluation plan with dimensions for evidence fidelity, planning quality, execution safety, verification strength, and operational fit. `evaluation-record` stores scored run evidence so the pipeline can be compared across machines and over time.

`evaluation-trends` reads timestamped evaluation records and writes overall plus per-dimension deltas for console charting and release review.

`usage-import` appends token and cost metrics from Hermes, CodeRabbit, OpenAI, CI, or manual JSON exports. `usage-report` aggregates those records by source and model so evaluation can track model/review spend without live service calls.

`artifact-checks` is a deterministic evaluation sensor. It verifies that the required evidence spine exists before an operator records scores or relies on a control report. Optional console artifacts are reported without blocking the status.

`behavior-checks` records behavior-confidence checks for:

- approved review fixtures,
- explicit human-approval gates before mutation,
- read-only infrastructure snapshot modes,
- non-submitting OpenScorpion activity drafts,
- worktree guard records.

`benchmark-pack` materialises repeatable source packs for smoke, realistic, and stress evaluations. The packs are local files only; they do not ingest sources or call live services by themselves.

Artifacts:

- `evaluation/evaluation-plan.json`
- `evaluation/evaluation-plan.md`
- `evaluation/evaluation-<timestamp>.json`
- `evaluation/evaluation-<timestamp>.md`
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

Artifacts are written under `coordination/`, `coordination/mail/`, and `coordination/leases/`.

## Console Data

`console-data` writes a normalised read-only projection of the vault to:

- `console/console-data.json`

The record includes source summaries, requirements, GSD tasks, execution runs, checks, reviews, decisions, Playwright evidence, evaluation runs, infrastructure registry/snapshots, merge readiness, and key artifact paths. It is intended as the stable data contract for future console UI work.

`console-html` renders that contract into:

- `console/index.html`

Use `--refresh-data` to regenerate `console/console-data.json` before rendering the HTML.

## Infrastructure And Governance

`infra-snapshot` imports a read-only JSON snapshot. `openscorpion-draft` writes a governed activity draft with `submit: false`; live submission requires a later approved adapter.

`deployment-snapshot` imports read-only estate snapshots for Proxmox, TrueNAS, DGX Spark, Macs, GitHub, or generic systems. This is the deployment adapter bridge for visualising where Ariadne can run without granting mutation capability.
