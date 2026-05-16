# Deployment Guide

Deployment should follow the same rule as the rest of the project: observe first, then control.

## Target Estate

| System | Role | First adapter mode |
| --- | --- | --- |
| Mac laptops/workstations | local development, docs, UI verification, quick tests | local CLI |
| DGX Spark | GPU and high-memory model/evaluation workloads | read-only model endpoint registry |
| Proxmox dev Linux machine | always-on orchestration, runners, Hermes, consoles | read-only host inventory |
| TrueNAS | durable vault backup and artifact storage | read-only storage manifest |

## Staged Rollout

### Stage 0: Local Mac

- Keep `ariadne` as a local TypeScript CLI.
- Store project artifacts under the repo `vault/`.
- Use local `npm run check`, `npm test`, `npm run build`.
- Record manual evaluation runs.

### Stage 1: Shared Artifact Storage

- Mirror or back up `vault/projects/` to TrueNAS.
- Keep the repo checkout local until backup and restore are verified.
- Do not put live credentials in the vault.

### Stage 2: Read-Only Infrastructure Inventory

- Import JSON snapshots from Proxmox, TrueNAS, Macs, and DGX Spark.
- Record host roles, model endpoints, runner pools, and trust boundaries.
- Keep snapshots manual or read-only.

### Stage 3: Always-On Orchestration

- Run Hermes and Ariadne Console candidates on the Proxmox Linux host.
- Keep `ariadne` as the state/control repo.
- Use Hermes cron or sleep routines to propose reports, not mutate systems.

### Stage 4: Runner And Worktree Automation

- Add self-hosted runners only after repo trust boundaries are explicit.
- Use fresh worktrees for code-writing agents.
- Require worktree guard, CI evidence, CodeRabbit evidence, and human approval before merge.

### Stage 5: GPU Evaluation

- Use DGX Spark for heavy model evaluation and inferential sensors.
- Keep fast computational sensors on Mac/Linux.
- Store evaluation outputs back into the vault as artifacts.

## Network And Security Notes

- Consoles should bind to localhost first.
- LAN exposure needs explicit auth, reverse proxy, TLS, and backup access path.
- Secrets belong in host secret stores or tool-specific auth files, not generated artifacts.
- Infrastructure mutation requires a separate approved plan and rollback notes.

## Console Candidates

- Hermes built-in console and gateway for sessions, memory, cron, and multi-backend execution.
- Hermes Web UI for chat, sessions, scheduled jobs, usage analytics, skills, memory, logs, profiles, and web terminal.
- OpenClaw Mission Control-style object model for boards, tasks, agents, gateways, approvals, and audit timeline.

The Ariadne Console should not start by cloning any one UI. It should expose the vault's native objects: sources, dossiers, requirements, tasks, runs, checks, reviews, decisions, infra snapshots, evaluations, and readiness.
