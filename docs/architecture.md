# Architecture

The architecture is built around the four pillars from `Ars Memoriae`:

- skills: methods, playbooks, tools, and repeatable procedures
- memory: retained evidence, lessons, project state, and durable context
- rules: explicit permissions, gates, approval requirements, and constraints
- morals: truthfulness, restraint, proportionality, privacy, and human judgment

Those pillars are implemented through six layers:

- durable vault: raw and durable records
- hot index: compact orientation layer
- context assembler: task-specific dossier generation
- loop and sleep: recurring review, consolidation, and cautious speculation
- evidence and control plane: tests, CI, reviews, policies, approvals, and metrics
- human surface: dashboards, docs, review screens, and command output

## Adapter Model

The repo should grow through adapters with explicit contracts:

- source intake adapter: local files, drawings, docs, transcripts, screenshots
- source-grounded synthesis adapter: NotebookLM export, manual markdown imports, future RAG tools
- task planner adapter: GSD2 roadmap and task database integration
- execution adapter: Codex or Claude Code in isolated worktrees
- verification adapter: unit tests, integration tests, Playwright, accessibility checks, screenshots
- review adapter: CodeRabbit, GitHub PR checks, human review
- evaluation adapter: pipeline scorecards, regression notes, benchmark runs
- infrastructure adapter: Hermes, Proxmox, DGX Spark, self-hosted runners, local model endpoints
- governance adapter: OpenScorpion evidence and policy routing

The adapters should exchange files and typed records. The control layer should be able to explain what it knows without depending on any one model provider.

## Harness Engineering

The control layer is the user-owned harness around coding agents. It uses:

- feedforward guides: source dossiers, PRDs, GSD tasks, AGENTS.md, adapter contracts, developer docs
- computational feedback: type checks, unit tests, build, static checks, artifact validation, Playwright
- inferential feedback: CodeRabbit, human review, future architecture and behavior judges
- continuous health checks: evaluation runs, missing-gate trends, stale artifact detection, sleep/memory summaries

The goal is to keep cheap, deterministic sensors as far left as possible and reserve expensive inferential sensors for semantic questions.

## Operational Surfaces

The first dashboard should read the vault instead of becoming another source of truth. It should visualise evidence lineage, task state, gates, reviews, infrastructure placement, and evaluation trends. Hermes, Hermes Web UI, and Mission Control-style systems are integration candidates, but the durable object model remains this repo's artifact contracts.

## Sleep, Memory, And Interagent State

Long-running automation should be represented as records before it becomes behavior:

- sleep routines: recurring reviews that propose next actions and stale-state cleanup
- memory routines: extract durable lessons from completed runs, with source links
- agent mail: append-only messages between agents, tied to task/run ids
- interagent state: leases, ownership, worktree paths, current blockers, and handoff notes

These should land as file-backed adapters first, then live Hermes or dashboard integrations later.
