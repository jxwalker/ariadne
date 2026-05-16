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
- secret scanning before vault promotion

Next:

- optional OCR adapter implementation
- optional transcription adapter implementation

## Milestone 1: Source-Grounded PRD

Goal: turn the dossier into requirements without losing source fidelity.

Implemented:

- manual dossier import
- PRD JSON schema
- PRD Markdown export
- source reference map
- ambiguity log
- NotebookLM manual export normaliser

Next:

- NotebookLM automation adapter only after authentication and safety are explicit

## Milestone 2: GSD2 Bridge

Goal: turn PRD sections into milestones, slices, and tasks.

Implemented:

- GSD-style roadmap JSON
- task Markdown export
- task success criteria
- verification command registry
- GSD2-compatible bundle export/import
- decision log records

Next:

- actual GSD2 process adapter if a local GSD2 install is selected

## Milestone 3: Execution Loop

Goal: execute bounded tasks until verified.

Implemented:

- non-mutating execution run records
- planned fresh worktree paths per task
- branch naming
- explicit gates
- stop conditions and human escalation
- guarded worktree readiness checks

Next:

- commit/PR/check/review loop
- crash recovery from state files

## Milestone 4: UI Verification

Goal: make browser-facing work prove itself.

Implemented:

- Playwright test plan generation from PRD
- generated role-oriented test skeleton
- trace/screenshot/accessibility evidence contract
- Playwright evidence records

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
- CI status ingestion
- CodeRabbit feedback ingestion
- test history through check records

Next:

- GitHub live check adapter

## Milestone 6: Infrastructure Substrate

Goal: connect Hermes, Proxmox, DGX Spark, M-series Macs, and runners.

Implemented:

- read-only infrastructure registry contract
- runner pool planning contract
- local model endpoint registry contract
- explicit no-mutation rules
- read-only infrastructure snapshot imports
- OpenScorpion governed activity drafts

Next:

- live read-only infrastructure inventory from approved hosts
- OpenScorpion governed activity submission after approval
- explicit approval before any mutation

## Milestone 7: Evaluation Harness

Goal: measure whether the pipeline is producing better, safer, more verified work.

Implemented:

- evaluation plan artifacts
- evaluation run records
- D1-D5 score model for evidence, planning, execution, verification, and operations
- automatic artifact existence checks
- CLI support for `evaluation`, `evaluation-record`, and `artifact-checks`

Next:

- benchmark source packs for smoke, realistic, and stress runs
- trend report generation
- token/cost metrics from Hermes and review tools
- mutation and approved-fixture checks for behavior confidence

## Milestone 8: Orchestration Visualisation

Goal: make the harness inspectable as a live operations surface.

Implemented:

- documented console object model
- documented gate matrix and infrastructure map concepts
- read-only console data projection
- static read-only console HTML

Next:

- console visual regression checks
- project timeline from artifacts
- evaluation trend charts
- infra topology view for Macs, DGX Spark, Proxmox, TrueNAS, runners, Hermes, and model endpoints
- approval queue backed by decision and control artifacts

## Milestone 9: Sleep, Memory, And Agent Mail

Goal: let long-running agents coordinate without losing state or hiding decisions.

Next:

- file-backed sleep routine records
- memory consolidation proposals with evidence refs
- agent mail inbox/outbox records scoped to project, task, and run ids
- interagent lease and ownership records
- Hermes cron integration after read-only evidence paths are proven

## Milestone 10: Live Deployment Adapters

Goal: safely deploy across the local estate.

Next:

- read-only Proxmox inventory adapter
- read-only TrueNAS storage snapshot adapter
- DGX Spark model/evaluation endpoint registry
- Mac workstation capability snapshots
- GitHub live check adapter
- explicit approval workflow before any mutation-capable adapter
