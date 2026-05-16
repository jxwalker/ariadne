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
- OCR, transcription, PDF text, and visual-description result imports
- source sensitivity labels
- manifest schema versioning
- secret scanning before vault promotion

Next:

- live OCR/transcription runner selection after tool choice and host placement are explicit

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
- read-only GitHub PR/check snapshot records
- crash recovery reports from recorded state files
- explicit approval request and decision records before mutation-capable adapters

Next:

- mutation-capable commit/PR/check/review loop after an approval record is reviewed and accepted

## Milestone 4: UI Verification

Goal: make browser-facing work prove itself.

Implemented:

- Playwright test plan generation from PRD
- generated role-oriented test skeleton
- trace/screenshot/accessibility evidence contract
- Playwright evidence records
- target-app screenshot and trace evidence capture
- browser-backed console screenshot checks with Playwright Chromium

Next:

- healer loop that proposes repairs, with review gates

## Milestone 5: Control Plane

Goal: make claims answer to evidence.

Implemented:

- merge readiness reports
- policy gate list
- evidence and missing-gate classification
- CI status ingestion
- CodeRabbit feedback ingestion
- GitHub PR/check snapshot ingestion
- explicit approval workflow records
- test history through check records

Next:

- GitHub mutation and check-retry adapter only after approval

## Milestone 6: Infrastructure Substrate

Goal: connect Hermes, Proxmox, DGX Spark, M-series Macs, and runners.

Implemented:

- read-only infrastructure registry contract
- runner pool planning contract
- local model endpoint registry contract
- explicit no-mutation rules
- read-only infrastructure snapshot imports
- OpenScorpion governed activity drafts
- explicit approval records before mutation-capable adapters

Next:

- live read-only infrastructure inventory from approved hosts
- OpenScorpion governed activity submission after approval
- mutation implementation only after a bounded approval record is accepted

## Milestone 7: Evaluation Harness

Goal: measure whether the pipeline is producing better, safer, more verified work.

Implemented:

- evaluation plan artifacts
- evaluation run records
- D1-D5 score model for evidence, planning, execution, verification, and operations
- automatic artifact existence checks
- benchmark source packs for smoke, realistic, and stress runs
- trend report generation
- token/cost metrics from Hermes and review tools
- runner support for `evaluation`, `evaluation-record`, `evaluation-trends`, `usage-import`, `usage-report`, `artifact-checks`, and `benchmark-pack`
- mutation and approved-fixture checks for behavior confidence
- runner support for `behavior-checks`

## Milestone 8: Orchestration Visualisation

Goal: make the harness inspectable as a live operations surface.

Implemented:

- documented console object model
- documented gate matrix and infrastructure map concepts
- read-only console data projection
- static read-only console HTML
- project timeline from artifacts
- infra topology view for Macs, DGX Spark, Proxmox, TrueNAS, runners, Hermes, and model endpoints
- approval queue backed by review, decision, and control artifacts
- memory, agent-mail, deployment, and GBrain summary panels
- console visual regression checks
- browser-backed console screenshot checks
- evaluation trend charts

## Milestone 9: Sleep, Memory, And Agent Mail

Goal: let long-running agents coordinate without losing state or hiding decisions.

Implemented:

- file-backed sleep routine records
- memory consolidation proposals with evidence refs
- agent mail inbox/outbox records scoped to project, task, and run ids
- interagent lease and ownership records
- optional GBrain read-only export and report import

Next:

- Hermes cron integration after read-only evidence paths are proven

## Milestone 10: Live Deployment Adapters

Goal: safely deploy across the local estate.

Implemented:

- read-only Proxmox snapshot import
- read-only TrueNAS snapshot import
- DGX Spark model/evaluation endpoint snapshot import
- Mac workstation capability snapshot import
- GitHub deployment/check snapshot import
- explicit approval workflow before mutation-capable adapters

Next:

- live read-only inventory collectors for approved hosts
- mutation-capable deployment adapters only after approved rollback plans
