# Deployment Guide

Deployment should follow the same rule as the rest of the project: observe first, then control.

## Target Estate

| System | Role | First adapter mode |
| --- | --- | --- |
| Mac laptops/workstations | local development, docs, UI verification, quick tests | local runner |
| DGX Spark | GPU and high-memory model/evaluation workloads | read-only model endpoint registry |
| Proxmox dev Linux machine | always-on orchestration, runners, Hermes, consoles | read-only host inventory |
| TrueNAS | durable vault backup and artifact storage | read-only storage manifest |

## Staged Rollout

### Stage 0: Local Mac

- Keep `ariadne` as a local TypeScript runner.
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
- Keep Atlas registered under a neutral `atlas.local` alias; use `ARIADNE_ATLAS_URL` or `--atlas-url` for the actual LAN or tailnet address during live probes.
- Keep snapshots manual or read-only.
- Use `infra-live-local` for the current Mac or Linux host.
- Use `infra-live-ssh` only for approved remote hosts where a read-only SSH probe is acceptable.
- Use `deployment-live-ssh` when Ariadne should turn an approved SSH probe into a Proxmox, TrueNAS, DGX Spark, or Mac deployment profile.
- Treat live local, live SSH, runtime probe, and E2E smoke artifacts as local evidence by default. They are ignored by Git because they can include private host aliases, endpoint URLs, screenshots, or timestamp churn; commit a sanitized derived artifact only when it is intended to become project evidence.
- Use `deployment-snapshot` for estate-specific views:

```bash
npm run ariadne -- deployment-snapshot --project ariadne --system proxmox --from proxmox.json
npm run ariadne -- deployment-snapshot --project ariadne --system truenas --from truenas.json
npm run ariadne -- deployment-snapshot --project ariadne --system dgx-spark --from dgx-spark.json
npm run ariadne -- deployment-snapshot --project ariadne --system mac --from mac.json
npm run ariadne -- infra-live-local --project ariadne --notes "current host read-only inventory"
npm run ariadne -- infra-live-ssh --project ariadne --host beast --target james@beast.lan --notes "approved read-only remote inventory"
npm run ariadne -- deployment-live-ssh --project ariadne --system dgx-spark --host "DGX Spark" --target james@dgx-spark.lan --notes "approved read-only deployment profile"
```

### Stage 3: Always-On Orchestration

- Run Hermes and Ariadne Console candidates on the Proxmox Linux host.
- Keep `ariadne` as the state/control repo.
- Use Hermes cron or sleep routines to propose reports, not mutate systems.
- Use `sleep-record`, `memory-proposal`, `agent-mail`, and `agent-lease` as the durable coordination format before wiring live Hermes cron jobs.

### Stage 4: Runner And Worktree Automation

- Add self-hosted runners only after repo trust boundaries are explicit.
- Use fresh worktrees for code-writing agents.
- Require worktree guard, CI evidence, CodeRabbit evidence, and human approval before merge.

### Stage 5: GPU Evaluation

- Use DGX Spark for heavy model evaluation and inferential sensors.
- Keep fast computational sensors on Mac/Linux.
- Store evaluation outputs back into the vault as artifacts.
- Use `local-runtime-probe --canary` to record Hermes, Ollama, DS4/OpenAI-compatible, LM Studio, and Atlas endpoint health before routing evaluation workloads. The console reads these runtime probe artifacts as infrastructure evidence; a degraded canary is evidence to tune the endpoint or model choice, not approval to mutate services.

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

## GBrain Placement

GBrain is a candidate memory/search substrate. Ariadne should export to it with `gbrain-export` and import reports with `gbrain-report-import`. Do not make GBrain the source of truth for approvals, gates, or deployment state; those stay in Ariadne artifacts.
