# Stage 0 (characterisation and stage gate)

**Status:** Living index  
**As of:** 2026-09-05

This directory is the Stage 0 characterisation and stage-gate evidence home.
It is not a product backlog and not a second roadmap. Product todos stay in
[`../delivery/`](../delivery/). The planning map stays in
[`.planning/CANONICAL.md`](../../.planning/CANONICAL.md).

Resolve the current `main` tip from Git before treating any snapshot SHA in a
child file as current. Do not paste mutable tip SHAs into this index.

## What Stage 0 is

Stage 0 locks how the system behaves today: inventories, characterisation
tests, threat and reliability baselines, ownership rules, and the stage-gate
runner contract. Packages land as docs and tests that record current behaviour.
They are not Stage 1 product or runtime fixes by themselves.

## PASS bar (honest)

Stage 0 is **not PASS** while any of the following remain open:

- required **real-LLM journeys executed** (a matrix alone is not enough)
- a collected **exact-SHA runner evidence pack**
- a **live walk** executed from the checklist lineage
- **baseline metrics** retained as programme evidence
- at least **twelve legally cleared matters** in versioned workload packs
- **three consecutive clean stage-gate runs**, with all required evidence

The **PS-0-04** [prompt/model inventory](prompt-model-eval-inventory.md) has
landed in [#2481](https://github.com/jxwalker/patent-studio/pull/2481). It records
source at its own pinned SHA, not scored provider executions or live deployment
settings. The PS-0-03 workload catalogue likewise does not supply scored runs.

Packages on `main` are not a PASS. Green mocked smoke, narrow unit tests, or
fixture-mode AI readiness are not a PASS. No stage PASSes on mocks alone.
Gate vocabulary (`PASS` / `FAIL` / `BLOCKED`) lives in
[`severity-blocker-defect-ownership.md`](severity-blocker-defect-ownership.md).

## Characterisation files already on `main`

Non-exhaustive. Prefer the file over this list when they disagree.

| File | Role |
| --- | --- |
| [`workload-catalogue.md`](workload-catalogue.md) | PS-0-03 scenario workloads, artifact families and legal-use/authority register |
| [`prompt-model-eval-inventory.md`](prompt-model-eval-inventory.md) | PS-0-04 pinned prompt/model/retrieval/evaluation inventory; not fresh provider execution evidence |
| [`journey-chrome-inventory.md`](journey-chrome-inventory.md) | PS-0-25 current route census and PS-0-29 entry-door browser evidence; replaces stale source inventory |
| [`live-walk-checklist.md`](live-walk-checklist.md) | PS-0-27 guarded read-only inventor procedure; unexecuted, not a live-walk PASS |
| [`architecture-inventory.md`](architecture-inventory.md) | PS-0-01 services, queues, storage, providers, journeys |
| [`test-coverage-map.md`](test-coverage-map.md) | PS-0-02 pyramid coverage map |
| [`severity-blocker-defect-ownership.md`](severity-blocker-defect-ownership.md) | PS-0-09 severity, blockers, ownership |
| [`threat-model.md`](threat-model.md) | PS-0-12 threat and failure-mode inventory |
| [`reliability-baseline.md`](reliability-baseline.md) | PS-0-13 queue/worker/migration/restore baseline |
| [`runtime-characterisation-drill.md`](runtime-characterisation-drill.md) | PS-0-17 real test-DB drill |
| [`stage-1-runtime-backlog.md`](stage-1-runtime-backlog.md) | PS-0-19 Stage 1 Runtime work packages (planning) |
| [`usage-cost-ledger-characterisation.md`](usage-cost-ledger-characterisation.md) | PS-0-21 usage/cost ledger |
| [`usage-ledger-call-sites-and-login-history.md`](usage-ledger-call-sites-and-login-history.md) | PS-0-26 callers and login history |
| [`auth-event-persistence.md`](auth-event-persistence.md) | PS-0-28 auth-event persistence |
| [`evidence-retention-characterisation.md`](evidence-retention-characterisation.md) | PS-0-08 evidence retention |
| [`initial-risk-register.md`](initial-risk-register.md) | Initial Stage 0 risk register |
| [`rebuild-characterisation.md`](rebuild-characterisation.md) | Clean-clone rebuild characterisation |
| [`baseline-quality-latency-cost-characterisation.md`](baseline-quality-latency-cost-characterisation.md) | Quality/latency/cost baseline (failing retained) |
| [`ai-readiness-script-boundary.md`](ai-readiness-script-boundary.md) | AI readiness script vs real-LLM gate boundary |

Related characterisation also lives as tests and scripts outside this folder
(for example Autopilot labels, Playwright journey, export smoke, stage-gate
runner, SHA/SBOM lock). Those packages landed on `main`; this index does not
duplicate their file lists.

There is no discrete **PS-0-05** issue or PR in this repository as of this
refresh. Evidence characterisation that did land uses other package numbers
(for example PS-0-08 retention and the PS-0-12 evidence-status tests).

## Stage 0 packages that were carried by a pull request

This is an index from package number to the pull request that carried it. It is
**not** a statement of which are open: a table of open PRs is wrong the moment
one merges or is closed, and this one has been wrong before. GitHub is the
authority —

```bash
gh pr list --state open --search "PS-0"
scripts/agents/list_open_pr_files.sh
```

| PR | Package |
| --- | --- |
| [#2468](https://github.com/jxwalker/patent-studio/pull/2468) | PS-0-03 workload catalogue; replaces superseded [#2044](https://github.com/jxwalker/patent-studio/pull/2044) |
| [#2481](https://github.com/jxwalker/patent-studio/pull/2481) | PS-0-04 prompt/model/retrieval/eval inventory; replaces superseded [#2066](https://github.com/jxwalker/patent-studio/pull/2066) |
| [#2068](https://github.com/jxwalker/patent-studio/pull/2068) | PS-0-20 Stage 1 Product backlog + real-LLM journey matrix |
| [#2080](https://github.com/jxwalker/patent-studio/pull/2080) | PS-0-23 Stage 1 Quality backlog |
| [#2082](https://github.com/jxwalker/patent-studio/pull/2082) | PS-0-24 Product Usage addendum + Create/Import doors |
| [#2086](https://github.com/jxwalker/patent-studio/pull/2086) | PS-0-25 journey-chrome inventory |
| [#2093](https://github.com/jxwalker/patent-studio/pull/2093) | PS-0-27 live-walk checklist |

This index does not rebase, merge, or close any of them.

**Preserved source:** branch `ps-0-29-entry-doors` supplied historical intent for
[issue #2162](https://github.com/jxwalker/patent-studio/issues/2162). Current isolated
coverage is `frontend/e2e/entry-doors-current.spec.ts`, with source and harness
RED/GREEN evidence in the route inventory above. Historical #2086/#2093 remain
lineage, not current route or safety authority. Current open-PR file ownership
still governs collisions.

## Stage 1 Runtime work packages

Runtime and Trust implementation packages derived from Stage 0 evidence live in
[`stage-1-runtime-backlog.md`](stage-1-runtime-backlog.md). That file is a
work-package inventory, not a product roadmap. Implementation has started on
`main`; read its status header before claiming a package. Open leftover PRs
stay on GitHub; do not close them from a docs refresh.

## Coordination

- Agent board: [`../delivery/AGENT_BOARD.md`](../delivery/AGENT_BOARD.md)
- Open-PR file scan: `scripts/agents/list_open_pr_files.sh`
- The #1905 freeze is discharged (2026-09-02): those paths carry no standing
  prohibition. They remain an authorization boundary — change them with a
  behaviour-level test and review, and check the open-PR file scan first
