# Ariadne

![Ariadne logo](assets/ariadne-logo-simple.png)

`ariadne` is the control layer for an end-to-end agentic coding system. It is not a replacement coding assistant. It is the outer harness around assistants, consoles, memory systems, testing tools, CI, review bots, and local infrastructure.

Tagline: evidence-threaded agentic engineering.

The system starts with source-grounded intake: drawings, white papers, dictated notes, screenshots, architecture documents, and exported research are preserved as raw evidence before any summary is trusted. From that evidence it generates dossiers, PRDs, GSD task bundles, execution plans, Playwright plans, evaluation records, and control reports.

## Principles

- Preserve raw evidence before summarising.
- Assemble context instead of dumping context.
- Keep work in small, reviewable slices.
- Treat tests, Playwright evidence, CI, CodeRabbit, and human approval as stronger than memory.
- Keep live adapters read-only until the evidence path is proven.
- Integrate existing tools through explicit file and command contracts.

## Current Capabilities

- Ingest local files into `vault/projects/<project>/raw/`.
- Extract safe text from Markdown, text, and macOS `.docx` files.
- Plan OCR/transcription/PDF extraction runner selection before external tools run.
- Import OCR, transcription, PDF text, and visual-description results back onto the original source record.
- Write manifests, hot indexes, context dossiers, PRDs, GSD roadmaps, GSD2 bundles, execution plans, decision records, Playwright plans, infrastructure registries, evaluation plans, merge-readiness reports, and crash-recovery reports.
- Collect a read-only GSD2 process snapshot from the selected local `gsd` executable.
- Import manual NotebookLM exports, CI status, CodeRabbit review text, read-only GitHub PR/check snapshots, read-only infrastructure snapshots, and Playwright evidence.
- Collect a sanitized live read-only local host inventory snapshot.
- Capture target-app screenshots and Playwright traces from a URL before recording the evidence.
- Generate review-gated healer proposals from failed Playwright evidence without applying repairs automatically.
- Import token and cost metrics from Hermes, CodeRabbit, OpenAI, CI, or manual JSON exports.
- Export Ariadne evidence into an optional GBrain import bundle and import GBrain query/eval reports back as evidence.
- Record behavior-confidence checks for approved review fixtures, mutation gates, approval workflow records, read-only infrastructure snapshots, and non-submitting governance drafts.
- Record mutation-readiness plans that bind approval, auth evidence, dry runs, live commands, rollback, and verification gates before live adapters are considered.
- Audit mutation-readiness plans before any live adapter is implemented or enabled.
- Record file-backed sleep routines, memory proposals, agent mail, interagent leases, read-only Hermes cron snapshots/proposals, and read-only deployment snapshots.
- Render evaluation trend charts in the static console and generate deterministic plus browser-backed console checks.
- Guard worktree creation without mutating by default.
- Check whether the expected pipeline artifacts exist before scoring or release decisions.
- Generate smoke, realistic, and stress benchmark source packs for repeatable harness evaluation.
- Generate evaluation trend reports from scored pipeline runs.
- Record pipeline evaluation scores so we can measure whether the harness is improving.

## What It Does Not Do Yet

- It does not call model APIs.
- It does not call NotebookLM.
- Normal flows do not mutate Proxmox, TrueNAS, GitHub, runners, or external repos; external-system changes are only permitted through `mutation-execute` with an approved plan, a passed dry-run record, and an exact `--confirm-plan` match.
- It does not create, enable, disable, or run Hermes cron jobs.
- It does not execute generated plans automatically.
- It does not submit governed OpenScorpion activity.

Those live paths are roadmap items. The current job is to make state, evidence, and control legible first.

## Quick Start

```bash
npm install
npm run check
npm test
npm run ariadne -- ingest --project ariadne /path/to/source.md /path/to/source.docx
npm run ariadne -- assemble --project ariadne
npm run ariadne -- roadmap --project ariadne --target-url http://localhost:3000 --repo /path/to/repo
npm run ariadne -- evaluation --project ariadne --target mac-local
npm run ariadne -- artifact-checks --project ariadne
npm run ariadne -- benchmark-pack --set all
npm run ariadne -- benchmark-run --project bench-smoke --set smoke
npm run ariadne -- mutation-dry-run --project ariadne --plan mutation-readiness-github-...
npm run ariadne -- mutation-execute --project ariadne --plan mutation-readiness-github-... --confirm-plan mutation-readiness-github-...
npm run ariadne -- evaluation-trends --project ariadne
npm run ariadne -- usage-report --project ariadne
npm run ariadne -- control --project ariadne
npm run ariadne -- recovery-report --project ariadne
npm run ariadne -- console-data --project ariadne
npm run ariadne -- console-html --project ariadne --refresh-data
npm run ariadne -- console-visual-checks --project ariadne
npm run ariadne -- console-browser-checks --project ariadne
npm run ariadne -- infra-live-local --project ariadne
npm run ariadne -- infra-live-ssh --project ariadne --host beast --target james@beast.lan
npm run ariadne -- status --project ariadne
```

## Vault Layout

```text
vault/projects/<project>/
  raw/
  context/
  requirements/
  extractions/
  gsd/
  execution/
  verification/
  control/
  decisions/
  infrastructure/
  integrations/gbrain/
  coordination/
  deployment/
  evaluation/
  console/
  manifest.jsonl
  HOT_INDEX.md
```

## Core Workflow

1. Put raw source material into the vault with `ingest`.
2. Assemble a bounded context dossier with `assemble`.
3. Generate source-grounded requirements with `prd`.
4. Generate the GSD roadmap and GSD2 bundle with `gsd` and `gsd2-export`.
5. Generate execution, Playwright, infrastructure, evaluation, and control artifacts with `roadmap`.
6. Use `worktree-guard` before creating any task worktree.
7. Record deterministic checks, Playwright evidence, CI, CodeRabbit, and human reviews.
8. Use `artifact-checks` to verify the expected evidence spine exists.
9. Use `behavior-checks` to verify approval and no-mutation behavior fixtures.
10. Use `evaluation` and `evaluation-record` to score the pipeline itself.
11. Use `gbrain-export` when Ariadne evidence should be indexed by GBrain.
12. Use `console-data` to publish a normalised read-only view for console work.
13. Use `console-html` to generate a static local console at `console/index.html`.

## Adapter Commands

```bash
npm run ariadne -- notebooklm-import --project ariadne --from notebooklm-export.md
npm run ariadne -- extraction-plan --project ariadne --record <record-id> --tool whisper.cpp --host "M5 Max" --runner mac
npm run ariadne -- extraction-import --project ariadne --record <record-id> --from extracted.md --kind visual-description --tool manual-review
npm run ariadne -- gsd2-export --project ariadne
npm run ariadne -- gsd2-import --project ariadne --from gsd2-bundle.json
npm run ariadne -- gsd2-process --project ariadne --binary gsd
npm run ariadne -- decision --project ariadne --title "Decision" --context "Context" --decision "Choice"
npm run ariadne -- execution --project ariadne --repo /path/to/repo
npm run ariadne -- worktree-guard --project ariadne --run run.json
npm run ariadne -- playwright --project ariadne --target-url http://localhost:3000
npm run ariadne -- playwright-capture --project ariadne --target-url http://localhost:3000 --selector "text=Dashboard"
npm run ariadne -- playwright-evidence --project ariadne --target-url http://localhost:3000 --status skipped
npm run ariadne -- healer-proposal --project ariadne --evidence verification/playwright-failed.json
npm run ariadne -- evaluation --project ariadne --target mac-local
npm run ariadne -- evaluation-record --project ariadne --plan evaluation-plan.json --scores D1=80,D2=75,D3=60
npm run ariadne -- artifact-checks --project ariadne
npm run ariadne -- benchmark-pack --set all
npm run ariadne -- evaluation-trends --project ariadne
npm run ariadne -- usage-import --project ariadne --from usage.json --source hermes
npm run ariadne -- usage-report --project ariadne
npm run ariadne -- behavior-checks --project ariadne --approved-fixture coderabbit.md
npm run ariadne -- gbrain-export --project ariadne
npm run ariadne -- gbrain-report-import --project ariadne --from gbrain-report.json
npm run ariadne -- github-snapshot --project ariadne --repo jxwalker/ariadne --pr 10
npm run ariadne -- approval-request --project ariadne --by planner --target github --action "Enable PR mutation adapter" --risk medium --reason "Manual gate before live mutation" --rollback "Disable adapter and return to manual PR flow"
npm run ariadne -- sleep-record --project ariadne --scope nightly --summary "Review stale gates" --evidence control/merge-readiness.md --next "Refresh console data"
npm run ariadne -- memory-proposal --project ariadne --title "Lesson" --proposal "Keep GBrain as a derived index" --evidence docs/adapters.md
npm run ariadne -- agent-mail --project ariadne --from planner --to executor --subject "Next slice" --body "Run checks before editing"
npm run ariadne -- agent-lease --project ariadne --agent executor --resource repo:/ariadne --status acquired
npm run ariadne -- hermes-cron-import --project ariadne --from hermes-cron.json --host beast
npm run ariadne -- hermes-cron-proposal --project ariadne --scope nightly
npm run ariadne -- deployment-snapshot --project ariadne --system proxmox --from deployment.json
npm run ariadne -- deployment-live-ssh --project ariadne --system dgx-spark --host "DGX Spark" --target james@dgx-spark.lan
npm run ariadne -- import-ci --project ariadne --from checks.json
npm run ariadne -- import-coderabbit --project ariadne --from coderabbit.md
npm run ariadne -- approval-request --project ariadne --by planner --target github --action "Enable PR mutation adapter" --risk medium --reason "Manual gate before live mutation" --rollback "Disable adapter and return to manual PR flow"
npm run ariadne -- mutation-readiness --project ariadne --target github --scope "Single PR merge adapter" --auth-evidence control/approvals/approval-...json --dry-run "gh pr view 1 --json statusCheckRollup" --live-command "gh pr merge 1 --squash" --post-verify "gh pr view 1 --json mergeStateStatus,statusCheckRollup" --rollback "Revert merge commit and disable adapter" --approval approval-...
npm run ariadne -- mutation-readiness-audit --project ariadne
npm run ariadne -- recovery-report --project ariadne
npm run ariadne -- console-data --project ariadne
npm run ariadne -- console-html --project ariadne --refresh-data
npm run ariadne -- console-visual-checks --project ariadne
npm run ariadne -- console-browser-checks --project ariadne
npm run ariadne -- infra --project ariadne
npm run ariadne -- infra-snapshot --project ariadne --from manifest.json
npm run ariadne -- infra-live-local --project ariadne --notes "Mac workstation read-only snapshot"
npm run ariadne -- infra-live-ssh --project ariadne --host beast --target james@beast.lan --notes "Approved read-only remote snapshot"
npm run ariadne -- openscorpion-draft --project ariadne --title "Evidence package" --type ariadne.evidence --evidence path-a,path-b
```

## Documentation

- [User guide](docs/user-guide.md)
- [Developer guide](docs/developer-guide.md)
- [Evaluation system](docs/evaluation.md)
- [Deployment guide](docs/deployment.md)
- [Orchestration visualisation](docs/orchestration-visualisation.md)
- [Adapter contracts](docs/adapters.md)
- [Architecture](docs/architecture.md)
- [Roadmap](docs/roadmap.md)
- [Source contract](docs/source-contract.md)
- [Research notes](docs/research-notes.md)
- [Brand](docs/brand.md)

## Harness Engineering Model

The design follows the harness-engineering framing: use feedforward guides to improve what agents do first, and feedback sensors to catch problems before humans see them. Computational sensors such as type checks, tests, static checks, and Playwright should run early and often. Inferential sensors such as CodeRabbit, architecture review, and LLM judges are valuable but should be recorded as evidence with cost and nondeterminism in mind.

## Deployment Intent

The target estate is heterogeneous:

- Mac laptops/workstations for local development and UI verification.
- DGX Spark for high-memory and GPU-heavy model/evaluation workloads.
- Proxmox dev Linux machine for always-on orchestration, runners, and read-only infra adapters.
- TrueNAS for durable artifact storage and backup.

See [Deployment](docs/deployment.md) for the staged plan.
