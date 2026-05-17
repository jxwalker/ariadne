# Infrastructure Registry: e2e-local-realistic

Generated: 2026-05-17T10:45:17.850Z

## Hosts

- m1-hermes: M1 Mac mini - always-on Hermes supervisor. Control-plane host for long-running supervision; verify live details before automation.
- m1-max: M1 Max - local development and testing. Apple Silicon development machine; use for local validation where available.
- m5-max: M5 Max - high-memory local agent workstation. Primary Mac-class local execution surface mentioned by user.
- dgx-spark: DGX Spark - local inference and memory-heavy workloads. Treat as planned/observed only until live endpoint inventory exists.
- beast: Proxmox dev server - runners, services, model endpoints, infrastructure substrate. Read-only inventory first; Proxmox live state is authoritative at execution time.

## Model Endpoints

- openscorpion-router: governed model route on beast (planned)
- dgx-local-models: local inference on dgx-spark (planned)

## Runner Pools

- trusted-private-runners: private jxwalker project repositories on beast. Boundary: persistent self-hosted runners only for trusted private repositories.
- public-repo-safe-path: public repositories on beast. Boundary: manual or ephemeral approval path; no untrusted public PRs on persistent runners.

## Rules

- No Proxmox mutation in this slice.
- No runner registration from registry generation.
- Live inventory must be collected before placement decisions are treated as current.
- OpenScorpion remains the governed model/evidence route for model-assisted planning.
