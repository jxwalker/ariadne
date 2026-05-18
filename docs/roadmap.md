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
- explicit OCR/transcription/PDF runner selection records with tool and host placement
- OCR, transcription, PDF text, and visual-description result imports
- source sensitivity labels
- manifest schema versioning
- secret scanning before vault promotion

## Milestone 1: Source-Grounded PRD

Goal: turn the dossier into requirements without losing source fidelity.

Implemented:

- manual dossier import
- PRD JSON schema
- PRD Markdown export
- source reference map
- ambiguity log
- NotebookLM manual export normaliser
- target-specific NotebookLM mutation-readiness plan generation for notebook actions

Next:

- live NotebookLM automation adapter only after authentication, terms, export stability, dry-run, rollback, and approval records are explicit

## Milestone 2: GSD2 Bridge

Goal: turn PRD sections into milestones, slices, and tasks.

Implemented:

- GSD-style roadmap JSON
- task Markdown export
- task success criteria
- verification command registry
- GSD2-compatible bundle export/import
- read-only local GSD process snapshot from the selected `gsd` executable
- target-specific GSD2 mutation-readiness plan generation for reviewed task execution
- decision log records

Next:

- live GSD2 headless task submission only after approved readiness, dry-run, rollback, and post-verification evidence

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
- non-executing mutation-readiness plans with auth evidence, dry run, live command, rollback, and approval state

Next:

- mutation-capable commit/PR/check/review loop after a mutation-readiness plan is reviewed and accepted

## Milestone 4: UI Verification

Goal: make browser-facing work prove itself.

Implemented:

- Playwright test plan generation from PRD
- generated role-oriented test skeleton
- trace/screenshot/accessibility evidence contract
- Playwright evidence records
- target-app screenshot and trace evidence capture
- browser-backed console screenshot checks with Playwright Chromium
- healer proposals tied to failed Playwright evidence and review gates
- healer automation gate scaffolds that keep repair execution blocked until review, approval, dry-run, exact `--confirm-plan`, and fresh Playwright evidence are explicit

Next:

- optional automatic repair execution after the existing healer automation gates can be satisfied by operator-reviewed repair plans

## Milestone 5: Control Plane

Goal: make claims answer to evidence.

Implemented:

- merge readiness reports
- policy gate list
- evidence and missing-gate classification
- CI status ingestion
- CodeRabbit feedback ingestion
- GitHub PR/check snapshot ingestion
- target-specific GitHub mutation-readiness plan generation for PR merges and workflow reruns
- target-specific NotebookLM mutation-readiness plan generation for notebook actions
- target-specific GSD2 mutation-readiness plan generation for reviewed task execution
- target-specific Hermes cron mutation-readiness plan generation for scheduler actions and jobs
- target-specific OpenScorpion mutation-readiness plan generation for activity routes
- target-specific deployment mutation-readiness plan generation for Proxmox, TrueNAS, DGX Spark, and Mac hosts
- explicit approval workflow records
- test history through check records
- mutation-readiness artifacts for future live adapters
- mutation-readiness audit report for blocked live-adapter plans
- guarded execution records for approved readiness dry-run commands
- confirmed live-command execution records with post-action verification evidence
- target-guarded live mutation execution wrapper
- per-target execute wrappers that delegate to target-guarded execution after readiness plans pass audit, dry-run, rollback, and post-verification review
- per-target live adapter readiness report for approved plans, passed dry-runs, and target-guarded execution evidence
- per-target live adapter next-action report that turns operator-evidence and readiness blockers into operator steps
- per-target live adapter approval packs that draft operator evidence checklists without approving or executing adapters
- operator review records for live-adapter approval packets, with `mutationApproved=false`
- approval-review audit reports that validate accepted packet reviews before readiness can rely on them
- target-specific live adapter dossiers that combine readiness, approval packets, review audit, mutation audit, next actions, and GBrain memory context
- live adapter cutover audits that verify complete operator evidence, current operator review, audit-passed plans, auth evidence, rollback, post-verification, dry-run, target-guarded execution, wrapper, dossier, and advisory GBrain context before placeholder replacement, including target-scoped audits for one-adapter cutover reviews
- live adapter review sessions that consolidate target dossiers, operator packet-review commands, cutover blockers, and advisory GBrain queries into one non-mutating operator packet
- live adapter review sessions link existing operator-evidence queues and read-only assist packets so preflight refs and assist next steps are visible in the operator packet
- live adapter evidence templates that give operators blank, non-authoritative files for packet-review evidence, auth-boundary proof, rollback/post-verification checks, dry-run notes, target-execution notes, and advisory GBrain results
- live adapter operator-evidence workplans that turn missing evidence into per-target check/import commands, template refs, cutover blockers, and advisory GBrain queries
- live adapter operator-evidence preflight checks that evaluate filled workspace files without creating evidence records or approving mutation
- live adapter operator-evidence batch preflight checks that evaluate every target workspace file or one target-scoped workspace file and refresh the queue without creating evidence records
- live adapter operator-evidence queue that ranks targets by latest preflight and import state without granting approval
- live adapter operator-evidence ready-import batches that import only complete preflighted evidence files for all targets or one target without granting approval
- live adapter operator-evidence workspaces that generate fillable per-target evidence files and supporting notes without granting approval, including target-scoped summary artifacts for one-adapter review sessions
- live adapter review sessions and operator-evidence assist packets that gather current commands, cutover blockers, read-only support refs, and advisory memory without creating operator evidence, including target-scoped artifacts for one-adapter review sessions
- live adapter next-target operator-evidence packets that select the current blocked target and refresh the workspace, read-only assist, workspace preflight, review session, and cutover audit without importing evidence or granting approval
- live adapter operator-evidence drafts and all-target draft packs that turn next-packet human verification worksheets into non-authoritative candidate review notes without touching `operator-evidence.md`, importing evidence, or granting approval
- sanitized live evidence promotion records that hash ignored local runtime, E2E, SSH, and deployment artifacts, redact private host or endpoint details, and make the resulting summaries citable during operator review without creating operator evidence or approvals
- live adapter operator-evidence import and audit that hashes filled evidence files, identifies missing operator proof, and surfaces per-target blockers without granting mutation approval

Next:

- target-specific live adapter implementations should replace placeholder shell commands only after the operator evidence audit, cutover audit, and implementation approval are ready for that target

## Milestone 6: Infrastructure Substrate

Goal: connect Hermes, Proxmox, DGX Spark, M-series Macs, and runners.

Implemented:

- read-only infrastructure registry contract
- runner pool planning contract
- local model endpoint registry contract
- Atlas model endpoint registered with a neutral alias and explicit live-probe override path
- environment-default runtime endpoint and canary-model configuration for unattended local model probes
- explicit no-mutation rules
- read-only infrastructure snapshot imports
- sanitized live read-only local host inventory collector
- sanitized live read-only SSH remote host inventory collector
- host-specific read-only SSH deployment collectors for Proxmox, TrueNAS, DGX Spark, and Macs
- OpenScorpion governed activity drafts
- target-specific OpenScorpion mutation-readiness plan generation for activity routes
- explicit approval records before mutation-capable adapters

Next:

- live OpenScorpion governed activity submission after approved readiness, dry-run, rollback, post-verification, and non-public payload evidence

## Milestone 7: Evaluation Harness

Goal: measure whether the pipeline is producing better, safer, more verified work.

Implemented:

- evaluation plan artifacts
- evaluation run records
- D1-D5 score model for evidence, planning, execution, verification, and operations
- automatic artifact existence checks
- benchmark source packs for smoke, realistic, and stress runs
- deterministic benchmark-run reports that exercise local packs through the pipeline
- trend report generation
- conservative roadmap-completion audit that blocks until artifact, behavior, evaluation, console, GBrain, operator-evidence, review-session, and cutover evidence prove the roadmap complete
- roadmap-completion audit next-target guidance that emits the one-step next operator packet command plus target-scoped operator-evidence, review-session, and cutover commands from the current queue
- roadmap-control-refresh command that regenerates live-adapter control artifacts, operator evidence queue, next operator packet, roadmap audit, GBrain export, artifact checks, console data, and console HTML before completion decisions
- token/cost metrics from Hermes and review tools
- runner support for `evaluation`, `evaluation-record`, `evaluation-trends`, `usage-import`, `usage-report`, `artifact-checks`, `benchmark-pack`, and `benchmark-run`
- mutation and approved-fixture checks for behavior confidence
- runner support for `behavior-checks`

## Milestone 8: Orchestration Visualisation

Goal: make the harness inspectable as a live operations surface.

Implemented:

- documented console object model
- documented gate matrix and infrastructure map concepts
- read-only console data projection
- static read-only console HTML
- local runtime probe summaries for Hermes, Ollama, DS4/OpenAI-compatible endpoints, LM Studio, and Atlas in the infrastructure console view
- project timeline from artifacts
- infra topology view for Macs, DGX Spark, Proxmox, TrueNAS, runners, Hermes, and model endpoints
- approval queue backed by review, decision, and control artifacts
- memory, agent-mail, deployment, and GBrain summary panels
- console visual regression checks
- browser-backed console screenshot checks
- evaluation trend charts
- approval-review audit status and current-review counts in the operations console
- live-adapter dossier count in the operations console
- live-adapter cutover status and target readiness in the operations console
- live-adapter review-session status and per-target review table in the operations console
- live-adapter evidence-template status and per-target template table in the operations console
- live-adapter operator-evidence workplan status in the operations console
- end-to-end smoke report that composes behavior checks, runtime probe evidence, console visual/browser checks, artifact checks, and roadmap audit

## Milestone 9: Sleep, Memory, And Agent Mail

Goal: let long-running agents coordinate without losing state or hiding decisions.

Implemented:

- file-backed sleep routine records
- memory consolidation proposals with evidence refs
- agent mail inbox/outbox records scoped to project, task, and run ids
- interagent lease and ownership records
- optional GBrain read-only export and report import
- GBrain memory context in live-adapter target dossiers
- read-only Hermes cron snapshot import
- proposal-only Hermes cron recommendations from imported scheduler evidence
- target-specific Hermes cron mutation-readiness plan generation

Next:

- live Hermes cron adapter only after scheduler authentication, dry-run, rollback, post-verification, and approval records are explicit

## Milestone 10: Live Deployment Adapters

Goal: safely deploy across the local estate.

Implemented:

- read-only Proxmox snapshot import
- read-only TrueNAS snapshot import
- DGX Spark model/evaluation endpoint snapshot import
- Mac workstation capability snapshot import
- sanitized live read-only local host inventory collector
- sanitized live read-only SSH remote host inventory collector
- host-specific read-only SSH deployment collectors for Proxmox, TrueNAS, DGX Spark, and Macs
- GitHub deployment/check snapshot import
- explicit approval workflow before mutation-capable adapters
- mutation-readiness artifacts before deployment mutation
- target-specific deployment mutation-readiness plan generation

Next:

- mutation-capable deployment adapters only after approved readiness, dry-run, rollback, and post-verification evidence
