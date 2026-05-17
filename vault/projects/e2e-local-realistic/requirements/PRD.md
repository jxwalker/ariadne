# E2e Local Realistic PRD

Generated: 2026-05-17T10:45:17.846Z
Source dossier: <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md

## Goals

- Turn unstructured source material into a source-grounded, test-driven coding workflow.
- Run bounded agentic implementation loops with strong evidence and review gates.
- Keep memory, rules, morals, and evidence visible to humans throughout.

## Non-Goals

- Do not replace Codex, GSD2, NotebookLM, GitHub, CodeRabbit, or Playwright.
- Do not mutate infrastructure or external repositories from PRD generation.
- Do not treat model output as execution approval.

## Requirements

### REQ-001: Source evidence intake

Preserve drawings, whitepapers, dictated notes, documents, and related artifacts before any summarisation or automation.

Priority: must

Acceptance:
- Raw artifacts are copied into the durable vault.
- Each artifact has a digest, source path, kind, and timestamp.
- Extracted text remains linked to the raw evidence.

Sources:
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:7
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:9
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:22
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:35
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:37
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:39
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:41

### REQ-002: Source-grounded PRD synthesis

Convert evidence dossiers and NotebookLM-style grounded exports into requirements, ambiguities, acceptance criteria, and source references.

Priority: must

Acceptance:
- PRD records source references for every major claim.
- Ambiguities are separated from accepted requirements.
- Manual exports work before automation is attempted.

Sources:
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:7
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:9
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:22
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:35
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:37
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:39
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:41

### REQ-003: GSD2 task bridge

Transform accepted requirements into milestones, vertical slices, tasks, success criteria, and verification commands.

Priority: must

Acceptance:
- Tasks are independently inspectable as JSON and Markdown.
- Each task names expected write areas and verification commands.
- Tasks preserve requirement traceability.

Sources:
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:7
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:9
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:22
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:35
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:37
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:39
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:41

### REQ-004: Bounded execution loop

Plan isolated worktree execution with explicit branch names, gates, stop conditions, and review points.

Priority: must

Acceptance:
- Execution runs are recorded before work begins.
- The system can identify planned worktrees and gates.
- External mutations remain blocked unless a later approved adapter is enabled.

Sources:
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:7
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:9
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:22
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:35
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:37
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:39
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:41

### REQ-005: Playwright UI verification evidence

Generate UI test plans and Playwright skeletons from requirements, with room for screenshots, traces, and healer proposals.

Priority: should

Acceptance:
- Generated tests use role-oriented locators where possible.
- Scenario records link back to requirement ids.
- Evidence paths are recorded separately from claims.

Sources:
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:7
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:9
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:22
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:35
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:37
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:39
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:41

### REQ-006: Review and CI control plane

Collect deterministic checks, CodeRabbit feedback, human review, and merge-readiness state into one evidence surface.

Priority: must

Acceptance:
- Merge readiness lists satisfied and missing gates.
- CI and review records are imported without being treated as hidden authority.
- Blocked states are explicit.

Sources:
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:7
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:9
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:22
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:35
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:37
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:39
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:41

### REQ-007: Infrastructure substrate registry

Represent Proxmox, DGX Spark, M-series Macs, Hermes, OpenScorpion, local model endpoints, and runner pools as read-only registry records first.

Priority: must

Acceptance:
- Infrastructure records are readable without model calls.
- Runner trust boundaries are explicit.
- Mutation plans require approval and remain non-executing in this slice.

Sources:
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:7
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:9
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:22
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:35
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:37
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:39
- <VAULT_ROOT>/projects/e2e-local-realistic/context/dossier-2026-05-17T10-45-17-846Z.md:41

## Ambiguities

- NotebookLM automation must remain manual/import-first until authentication, terms, and export stability are explicit.
- GSD2 integration should be file-contract based before depending on a specific local installation.
- Execution adapters need an approved mutation model before they can push branches or alter infrastructure.
- Playwright can generate plans now, but browser execution requires a concrete target app URL.
- Infrastructure planning should begin read-only because Proxmox and runner changes have high blast radius.
