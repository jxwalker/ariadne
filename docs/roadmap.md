# Roadmap

## Milestone 0: Trustworthy Intake

Goal: preserve source artifacts, extract text where safe, and assemble compact dossiers.

Implemented:

- raw artifact copy
- SHA-256 manifest records
- markdown, text, and macOS `.docx` extraction through `textutil`
- project hot index generation
- context dossier generation
- OCR handoff contracts for drawings/images
- audio transcription handoff contracts
- source sensitivity labels
- manifest schema versioning

Next:

- optional OCR adapter implementation
- optional transcription adapter implementation
- secret scanning before vault promotion

## Milestone 1: Source-Grounded PRD

Goal: turn the dossier into requirements without losing source fidelity.

Implemented:

- manual dossier import
- PRD JSON schema
- PRD Markdown export
- source reference map
- ambiguity log

Next:

- NotebookLM manual export normaliser
- NotebookLM automation adapter only after authentication and safety are explicit

## Milestone 2: GSD2 Bridge

Goal: turn PRD sections into milestones, slices, and tasks.

Implemented:

- GSD-style roadmap JSON
- task Markdown export
- task success criteria
- verification command registry

Next:

- actual GSD2 local import/export adapter
- decision log updates

## Milestone 3: Execution Loop

Goal: execute bounded tasks until verified.

Implemented:

- non-mutating execution run records
- planned fresh worktree paths per task
- branch naming
- explicit gates
- stop conditions and human escalation

Next:

- guarded worktree creation
- commit/PR/check/review loop
- crash recovery from state files

## Milestone 4: UI Verification

Goal: make browser-facing work prove itself.

Implemented:

- Playwright test plan generation from PRD
- generated role-oriented test skeleton
- trace/screenshot/accessibility evidence contract

Next:

- install Playwright when a target app is present
- screenshot and trace evidence capture
- healer loop that proposes repairs, with review gates

## Milestone 5: Control Plane

Goal: make claims answer to evidence.

Implemented:

- merge readiness reports
- policy gate list
- evidence and missing-gate classification

Next:

- CI status ingestion
- CodeRabbit feedback ingestion
- test history

## Milestone 6: Infrastructure Substrate

Goal: connect Hermes, Proxmox, DGX Spark, M-series Macs, and runners.

Implemented:

- read-only infrastructure registry contract
- runner pool planning contract
- local model endpoint registry contract
- explicit no-mutation rules

Next:

- live read-only infrastructure inventory
- OpenScorpion governed activity adapter
- explicit approval before any mutation
