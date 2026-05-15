# Dev Pipeline

`dev-pipeline` is the thin control repository for an end-to-end agentic coding system. It starts with source-grounded intake: drawings, whitepapers, dictated notes, screenshots, and architecture documents are preserved as evidence, then assembled into bounded dossiers for NotebookLM, GSD2, Codex, Playwright, CodeRabbit, GitHub Actions, Hermes, OpenScorpion, and local infrastructure.

The first implemented slice is intentionally narrow:

- preserve raw source artifacts in a durable vault
- extract text where it is safe to do so
- maintain a project manifest and hot index
- assemble a compact context dossier for the next planning or execution loop

This repo does not yet mutate external repositories, Proxmox, GitHub runners, or local model services. That comes after the state and evidence layer is trustworthy.

## Quick Start

```bash
npm install
npm run check
npm test
npm run cli -- ingest --project agentic-coding /path/to/source.md /path/to/source.docx
npm run cli -- assemble --project agentic-coding
npm run cli -- roadmap --project agentic-coding --target-url http://localhost:3000 --repo /path/to/repo
npm run cli -- gsd2-export --project agentic-coding
npm run cli -- worktree-guard --project agentic-coding --run /path/to/run.json
npm run cli -- status --project agentic-coding
```

Artifacts are written under:

```text
vault/projects/<project>/
  raw/
  context/
  requirements/
  gsd/
  execution/
  verification/
  control/
  infrastructure/
  manifest.jsonl
  HOT_INDEX.md
```

## System Shape

The larger system is a set of contracts, not a replacement coding assistant.

- Source intake keeps raw evidence and extracted text.
- NotebookLM or another source-grounded analyst turns evidence into PRD material.
- GSD2 decomposes the PRD into milestones, slices, and tasks.
- Codex or Claude Code executes bounded tasks in fresh worktrees.
- Playwright tests verify the live UI and produce evidence.
- CodeRabbit and CI act as semantic and deterministic review gates.
- Hermes supervises long-running loops.
- OpenScorpion is the governed model and evidence route where model calls or policy evidence are required.
- Proxmox, DGX Spark, M-series Macs, and self-hosted runners provide execution substrate.

## Current Roadmap

1. Source vault and context dossier CLI. Implemented.
2. NotebookLM/manual export PRD contract. Implemented as source-grounded PRD artifact generation.
3. GSD2 task import/export contract. Implemented as JSON and Markdown task export.
4. Worktree execution controller with explicit gates. Implemented as non-mutating execution run plans.
5. Playwright planner/generator/healer loop. Implemented as test-plan and generated-spec artifact contract; browser execution comes when a target app exists.
6. GitHub Actions, CodeRabbit, and branch protection control plane. Implemented as merge-readiness evidence surface; live adapter is next.
7. Hermes and infrastructure adapters for Proxmox, DGX Spark, and local model endpoints. Implemented as read-only registry and placement-plan contract; live inventory is next.

## Adapter Commands

These commands add live-safe integration surfaces without mutating external systems by default:

```bash
npm run cli -- notebooklm-import --project agentic-coding --from notebooklm-export.md
npm run cli -- gsd2-export --project agentic-coding
npm run cli -- gsd2-import --project agentic-coding --from gsd2-bundle.json
npm run cli -- worktree-guard --project agentic-coding --run run.json
npm run cli -- playwright-evidence --project agentic-coding --target-url http://localhost:3000 --status skipped
npm run cli -- import-ci --project agentic-coding --from checks.json
npm run cli -- import-coderabbit --project agentic-coding --from coderabbit.md
npm run cli -- infra-snapshot --project agentic-coding --from manifest.json
npm run cli -- openscorpion-draft --project agentic-coding --title "Evidence package" --type dev-pipeline.evidence --evidence path-a,path-b
```
