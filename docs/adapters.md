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

Artifacts:

- `evaluation/evaluation-plan.json`
- `evaluation/evaluation-plan.md`
- `evaluation/evaluation-<timestamp>.json`
- `evaluation/evaluation-<timestamp>.md`

## Infrastructure And Governance

`infra-snapshot` imports a read-only JSON snapshot. `openscorpion-draft` writes a governed activity draft with `submit: false`; live submission requires a later approved adapter.
