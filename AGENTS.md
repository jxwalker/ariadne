# Agent Operating Instructions

This repository implements the control layer for an end-to-end agentic coding system.

## Doctrine

- Preserve raw evidence before summarising.
- Assemble context instead of dumping context.
- Keep execution in small, reviewable slices.
- Use fresh worktrees for code-writing agents.
- Treat tests, Playwright evidence, CI, and review feedback as stronger than memory.
- Do not mutate infrastructure, repositories, runners, or model routing without an explicit approved plan.
- Prefer integrating existing tools through clear contracts over rebuilding a coding assistant.

## First Slice Boundary

The current code is only allowed to:

- ingest local source files
- copy raw artifacts into the vault
- extract text from safe local formats
- write manifests, hot indexes, and context dossiers

It must not:

- push commits
- call model APIs
- call NotebookLM
- call Proxmox
- call GitHub
- execute generated plans
- change external repos

