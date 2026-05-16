# Dev Pipeline

`dev-pipeline` is the control layer for an end-to-end agentic coding system. It is not a replacement coding assistant. It is the outer harness around assistants, dashboards, memory systems, testing tools, CI, review bots, and local infrastructure.

The system starts with source-grounded intake: drawings, white papers, dictated notes, screenshots, architecture documents, and exported research are preserved as raw evidence before any summary is trusted. From that evidence it generates dossiers, PRDs, GSD task bundles, execution plans, Playwright plans, evaluation records, and control reports.

## Principles

- Preserve raw evidence before summarising.
- Assemble context instead of dumping context.
- Keep work in small, reviewable slices.
- Treat tests, Playwright evidence, CI, CodeRabbit, and human approval as stronger than memory.
- Keep live adapters read-only until the evidence path is proven.
- Integrate existing tools through explicit file and CLI contracts.

## Current Capabilities

- Ingest local files into `vault/projects/<project>/raw/`.
- Extract safe text from Markdown, text, and macOS `.docx` files.
- Write manifests, hot indexes, context dossiers, PRDs, GSD roadmaps, GSD2 bundles, execution plans, decision records, Playwright plans, infrastructure registries, evaluation plans, and merge-readiness reports.
- Import manual NotebookLM exports, CI status, CodeRabbit review text, read-only infrastructure snapshots, and Playwright evidence.
- Guard worktree creation without mutating by default.
- Record pipeline evaluation scores so we can measure whether the harness is improving.

## What It Does Not Do Yet

- It does not call model APIs.
- It does not call NotebookLM.
- It does not mutate Proxmox, TrueNAS, GitHub, runners, or external repos.
- It does not execute generated plans automatically.
- It does not submit governed OpenScorpion activity.

Those live paths are roadmap items. The current job is to make state, evidence, and control legible first.

## Quick Start

```bash
npm install
npm run check
npm test
npm run cli -- ingest --project agentic-coding /path/to/source.md /path/to/source.docx
npm run cli -- assemble --project agentic-coding
npm run cli -- roadmap --project agentic-coding --target-url http://localhost:3000 --repo /path/to/repo
npm run cli -- evaluation --project agentic-coding --target mac-local
npm run cli -- control --project agentic-coding
npm run cli -- dashboard-data --project agentic-coding
npm run cli -- status --project agentic-coding
```

## Vault Layout

```text
vault/projects/<project>/
  raw/
  context/
  requirements/
  gsd/
  execution/
  verification/
  control/
  decisions/
  infrastructure/
  evaluation/
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
8. Use `evaluation` and `evaluation-record` to score the pipeline itself.
9. Use `dashboard-data` to publish a normalised read-only view for dashboard work.

## Adapter Commands

```bash
npm run cli -- notebooklm-import --project agentic-coding --from notebooklm-export.md
npm run cli -- gsd2-export --project agentic-coding
npm run cli -- gsd2-import --project agentic-coding --from gsd2-bundle.json
npm run cli -- decision --project agentic-coding --title "Decision" --context "Context" --decision "Choice"
npm run cli -- execution --project agentic-coding --repo /path/to/repo
npm run cli -- worktree-guard --project agentic-coding --run run.json
npm run cli -- playwright --project agentic-coding --target-url http://localhost:3000
npm run cli -- playwright-evidence --project agentic-coding --target-url http://localhost:3000 --status skipped
npm run cli -- evaluation --project agentic-coding --target mac-local
npm run cli -- evaluation-record --project agentic-coding --plan evaluation-plan.json --scores D1=80,D2=75,D3=60
npm run cli -- import-ci --project agentic-coding --from checks.json
npm run cli -- import-coderabbit --project agentic-coding --from coderabbit.md
npm run cli -- dashboard-data --project agentic-coding
npm run cli -- infra --project agentic-coding
npm run cli -- infra-snapshot --project agentic-coding --from manifest.json
npm run cli -- openscorpion-draft --project agentic-coding --title "Evidence package" --type dev-pipeline.evidence --evidence path-a,path-b
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

## Harness Engineering Model

The design follows the harness-engineering framing: use feedforward guides to improve what agents do first, and feedback sensors to catch problems before humans see them. Computational sensors such as type checks, tests, static checks, and Playwright should run early and often. Inferential sensors such as CodeRabbit, architecture review, and LLM judges are valuable but should be recorded as evidence with cost and nondeterminism in mind.

## Deployment Intent

The target estate is heterogeneous:

- Mac laptops/workstations for local development and UI verification.
- DGX Spark for high-memory and GPU-heavy model/evaluation workloads.
- Proxmox dev Linux machine for always-on orchestration, runners, and read-only infra adapters.
- TrueNAS for durable artifact storage and backup.

See [Deployment](docs/deployment.md) for the staged plan.
