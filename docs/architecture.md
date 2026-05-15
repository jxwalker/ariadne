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
- infrastructure adapter: Hermes, Proxmox, DGX Spark, self-hosted runners, local model endpoints
- governance adapter: OpenScorpion evidence and policy routing

The adapters should exchange files and typed records. The control layer should be able to explain what it knows without depending on any one model provider.

