# Testing And Evaluation System

The evaluation system measures whether the pipeline itself is becoming more reliable. It is inspired by harness engineering: keep cheap computational sensors close to generation, use inferential sensors where semantic judgment is needed, and record every claim as evidence.

## Goals

- Detect whether source fidelity is being preserved.
- Score whether PRDs, GSD tasks, execution plans, and verification artifacts are useful.
- Compare runs across Mac, DGX Spark, Proxmox Linux, and future runner pools.
- Surface regressions in the harness before they become automation failures.
- Give console work a concrete data model.

## Artifact Contract

`evaluation` writes:

```text
vault/projects/<project>/evaluation/evaluation-plan.json
vault/projects/<project>/evaluation/evaluation-plan.md
```

`evaluation-record` writes timestamped run records:

```text
vault/projects/<project>/evaluation/evaluation-<timestamp>.json
vault/projects/<project>/evaluation/evaluation-<timestamp>.md
```

`evaluation-trends` writes the longitudinal trend report:

```text
vault/projects/<project>/evaluation/evaluation-trends.json
vault/projects/<project>/evaluation/evaluation-trends.md
```

`gsd2-process` writes selected local GSD process evidence:

```text
vault/projects/<project>/gsd/process/gsd2-process-<timestamp>.json
vault/projects/<project>/gsd/process/gsd2-process-<timestamp>.md
```

`usage-import` appends normalised token/cost records and `usage-report` writes the aggregate report:

```text
vault/projects/<project>/evaluation/usage-metrics.jsonl
vault/projects/<project>/evaluation/usage-report.json
vault/projects/<project>/evaluation/usage-report.md
```

`local-runtime-probe --canary` can append `local-llm` usage records from short Ollama or OpenAI-compatible local model canaries, including DS4, LM Studio, and Atlas. Use `--canary-endpoints` plus endpoint-specific model flags when only one local runtime should be exercised or the default model is too large for a quick probe. For unattended runs, set `ARIADNE_ATLAS_URL` and `ARIADNE_ATLAS_CANARY_MODEL` in the shell or in the local git-ignored `.env` file; the same pattern works for Ollama, DS4, and LM Studio endpoint and canary-model variables. Ariadne only imports `ARIADNE_` keys from `.env`, and exported shell variables take precedence. Canary requests use a strict no-think `READY` health prompt, a 128-token reasoning-tolerant completion budget, and a minimum 30-second generation timeout. Those records flow into the same usage report. Runtime probe artifacts redact configured non-loopback endpoint URLs at write time, and live evidence promotion applies a second sanitizer before sharing probe summaries.

`artifact-checks` writes the deterministic artifact contract report:

```text
vault/projects/<project>/evaluation/artifact-checks.json
vault/projects/<project>/evaluation/artifact-checks.md
```

`e2e-smoke` writes a single local end-to-end smoke report:

```text
vault/projects/<project>/evaluation/e2e-smoke-<timestamp>.json
vault/projects/<project>/evaluation/e2e-smoke-<timestamp>.md
```

The smoke command composes existing evaluators rather than inventing a parallel test path: behavior checks, optional Hermes/model runtime probes, mutation-readiness repair guidance, console HTML generation, deterministic console visual checks, Playwright browser checks, artifact checks, the roadmap completion audit, and the roadmap-control refresh pass. It does not create approvals, import operator evidence, start services, or mutate external systems. `blocked` is a valid result when roadmap gates are waiting for operator evidence.

`console-visual-checks` writes the deterministic console visual contract report:

```text
vault/projects/<project>/console/visual-checks.json
vault/projects/<project>/console/visual-checks.md
```

`console-browser-checks` writes the Playwright-backed console render report and screenshot:

```text
vault/projects/<project>/console/browser-checks.json
vault/projects/<project>/console/browser-checks.md
vault/projects/<project>/console/screenshots/console-<timestamp>.png
```

`behavior-checks` writes behavior-confidence checks:

```text
vault/projects/<project>/evaluation/behavior-checks.json
vault/projects/<project>/evaluation/behavior-checks.md
```

`mutation-readiness` writes non-executing live-adapter readiness plans:

```text
vault/projects/<project>/control/mutation-readiness/mutation-readiness-<target>-<timestamp>.json
vault/projects/<project>/control/mutation-readiness/mutation-readiness-<target>-<timestamp>.md
```

`mutation-readiness-audit` writes the aggregate gate report for those plans:

```text
vault/projects/<project>/control/mutation-readiness-audit.json
vault/projects/<project>/control/mutation-readiness-audit.md
```

The audit is a non-mutating evaluator. It checks approval state, evidence refs, dry-run command safety, post-action verification, rollback text, and `execute=false`.

`mutation-readiness-repair-plan` writes the non-mutating repair guide for blocked plans:

```text
vault/projects/<project>/control/mutation-readiness-repair-plan.json
vault/projects/<project>/control/mutation-readiness-repair-plan.md
```

The repair plan does not approve or execute anything. It classifies blocker types and emits target-specific approval/regeneration command scaffolds so stale plans can be rebuilt with the missing gates.

`console-data` and `console-html` include the same repair-plan artifact. `console-data` also exposes `workflow.stages`, `workflow.nextAction`, `workflow.nextAction.steps`, `workflow.modes`, and `workflow.surfaces` so Hermes dashboards and future live UIs can read the same operator journey, progressive next-action plan, and user-mode routing as the static console. The console summary shows missing, repairable, operator-action-required, and blocked repair counts; the rendered console shows each target's current classification and regeneration scaffold beside the mutation audit. This makes blocked roadmap work visible without turning guidance into approval evidence.

`live-adapter-cutover-audit` is the final non-mutating evaluator before replacing placeholder commands with target adapters. It checks complete operator evidence, current packet-review evidence, audit-passed readiness plans, auth evidence, rollback and post-verification acceptance, passed dry-run evidence, passed target-guarded execution evidence, target wrapper availability, generated dossiers, and advisory GBrain context. It can run against all targets or one adapter with `--target <target>`, which writes a scoped audit artifact without weakening any gate.

`live-adapter-review-session` is an operator-facing evaluator over the same evidence. It proves the current review workload is explicit by listing every target's first action, packet-review command, approval request draft, mutation-plan draft, mutation-repair status and commands, required evidence, dossier ref, cutover blockers, and GBrain advisory queries. When operator-evidence queue or assist artifacts already exist, the review session links them and shows target queue status, latest preflight refs, read-only assist refs, and assist next steps. It can also run with `--target <target>` to produce a one-adapter operator packet and prefer that target's scoped assist packet. It is not a gate bypass: it writes `mutationApproved=false` and only makes the next human review step inspectable.

`live-adapter-evidence-templates` turns that review workload into blank per-target collection files. It improves evaluation by making missing proof explicit without letting placeholders pass gates: templates are marked `awaiting_operator_evidence` and are not counted as approval evidence until a human fills them with concrete observations and artifact refs.

`live-adapter-operator-evidence-check` evaluates a filled operator file without creating an evidence record. It is a preflight path for catching missing sections while writing `recorded=false`, `operatorEvidenceRecordCreated=false`, `mutationApproved=false`, and `approvalGranted=false`.

`live-adapter-operator-evidence-check-all` evaluates every current target workspace file with the same preflight logic, writes one aggregate batch report, and refreshes the queue. It defaults to the workspace when it exists; `--source templates` keeps the older blank-template preflight available. It improves evaluation coverage by making unchecked targets explicit before an operator imports evidence. When `--target` is supplied and a current queue exists, the command writes the target-scoped batch/check artifacts without refreshing unrelated global queue or workplan reports; the later import-ready step refreshes global audit state only when evidence is actually imported.

`live-adapter-operator-evidence-queue` evaluates the operator work queue after preflight checks. It does not prove evidence by itself; it tells the operator which targets are unchecked, which need more evidence, and which checked files are ready to import. `roadmap-completion-audit` uses that queue to identify the next target and print the one-step next operator packet command first, followed by target-scoped workspace, assist, preflight, import-ready, review-session, and cutover commands so operators can advance one adapter without touching the rest of the estate. The next packet carries the human verification worksheet forward and keeps the import command under an after-human-verification heading.

`status` exposes the same next-target selection in the normal project summary. When operator evidence is blocked it prints the target, queue/audit status, missing-section count, next action, the one-step next operator packet command, and target-scoped follow-up commands. This keeps the unattended loop grounded in the same evidence as `roadmap-completion-audit` without creating approval or operator evidence.

When the persisted roadmap-completion audit is older than newer control artifacts, `status` now prints the stale sources and the exact `roadmap-control-refresh` command. This prevents operators from relying on an old audit file when the live queue, repair plan, review session, or cutover audit has moved on.

`roadmap-control-refresh` is the deterministic refresh pass for stale control outputs. It regenerates mutation-readiness audit and repair guidance, live-adapter readiness, next actions, approval pack, approval-review audit, dossiers, evidence templates, operator workplan, workspace, read-only assist, workspace preflight, queue, next operator packet, review session, cutover audit, roadmap completion audit, GBrain export, and artifact checks. It writes `control/roadmap-control-refresh.json` and `.md`, keeps `mutationApproved=false`, and does not import operator evidence.

`live-adapter-operator-evidence-workspace` evaluates the queue into concrete operator paperwork. It proves the remaining work has target-specific files, check commands, import commands, support refs, and GBrain note slots, but it still does not prove the evidence has been filled or approved.

When `live-adapter-operator-evidence-workspace` is run with `--target` and a current queue/workplan already exists, it reuses those artifacts and writes only the scoped workspace plus that target's fillable files. This keeps one-adapter paperwork from refreshing unrelated global control reports.

`live-adapter-operator-evidence-assist` writes read-only per-target assist files beside the operator workspace files. It gathers existing Ariadne support refs from the workplan so the operator has a shorter review path, adds a human verification worksheet for every missing section, and keeps the import command behind an explicit after-verification heading. It keeps `operatorEvidenceRecordCreated=false`, `mutationApproved=false`, and `approvalGranted=false`.

`live-adapter-operator-evidence-draft` turns the current next-packet worksheet into a non-authoritative operator review draft:

```text
vault/projects/<project>/control/live-adapter-operator-evidence-draft-<target>.json
vault/projects/<project>/control/live-adapter-operator-evidence-draft-<target>.md
vault/projects/<project>/control/operator-evidence/<target>/operator-evidence-draft.md
```

`live-adapter-operator-evidence-drafts` generates that same non-authoritative draft for every live-adapter target and writes a pack summary:

```text
vault/projects/<project>/control/live-adapter-operator-evidence-drafts.json
vault/projects/<project>/control/live-adapter-operator-evidence-drafts.md
```

The drafts are intentionally separate from `operator-evidence.md`. They gather candidate actions, existing refs, promoted live evidence refs, and GBrain advisory queries, but they must not be imported directly. A human operator still has to verify the facts, update each target's `operator-evidence.md`, run the preflight check, and only then run the import command.

`live-adapter-operator-evidence` and `live-adapter-operator-evidence-audit` evaluate those filled operator files. The importer hashes the source, checks required evidence sections, keeps GBrain notes advisory, and writes `mutationApproved=false` plus `approvalGranted=false`.

The audit reports complete, incomplete, and missing targets. It expands missing targets into the full required section count so the console and roadmap audit can show the actual evidence workload before any live-adapter implementation work proceeds.

`hermes-cron-import` writes read-only scheduler evidence:

```text
vault/projects/<project>/coordination/hermes/hermes-cron-<timestamp>.json
vault/projects/<project>/coordination/hermes/hermes-cron-<timestamp>.md
```

`hermes-cron-proposal` writes review-only scheduler recommendations:

```text
vault/projects/<project>/coordination/hermes/hermes-cron-proposal-<timestamp>.json
vault/projects/<project>/coordination/hermes/hermes-cron-proposal-<timestamp>.md
```

`benchmark-pack` writes repeatable input packs:

```text
benchmarks/source-packs/<set>/benchmark-pack.json
benchmarks/source-packs/<set>/README.md
benchmarks/source-packs/<set>/...
```

`playwright-capture` writes browser artifacts and a companion evidence record:

```text
vault/projects/<project>/verification/playwright-captures/target-<timestamp>.png
vault/projects/<project>/verification/playwright-captures/target-<timestamp>.zip
vault/projects/<project>/verification/playwright-<timestamp>.json
vault/projects/<project>/verification/playwright-<timestamp>.md
```

`healer-proposal` writes review-gated repair proposals for failed Playwright evidence:

```text
vault/projects/<project>/verification/healer-proposals/healer-<timestamp>.json
vault/projects/<project>/verification/healer-proposals/healer-<timestamp>.md
```

Each proposal now includes explicit automation gates and scaffold commands for approval, mutation-readiness planning, dry-run, execution, and fresh Playwright recapture. The commands are intentionally inert guidance until human review, approval, mutation-readiness, dry-run, exact `--confirm-plan`, and post-repair Playwright evidence gates have all passed.

## Dimensions

| Id | Dimension | Sensors |
| --- | --- | --- |
| D1 | Evidence fidelity | manifest, hashes, hygiene reports, extraction records, dossier source refs |
| D2 | Planning quality | PRD, roadmap, GSD2 bundle, write scopes |
| D3 | Execution safety | execution run, worktree guard, decision records |
| D4 | Verification strength | typecheck, unit tests, build, Playwright, CodeRabbit |
| D5 | Operational fit | infra registry, snapshots, control report |

## Standard Evaluation Flow

```bash
npm run ariadne -- roadmap --project ariadne --target-url http://localhost:3000 --repo /path/to/repo
npm run ariadne -- evaluation --project ariadne --target mac-local
npm run check
npm test
npm run build
npm run ariadne -- artifact-checks --project ariadne
npm run ariadne -- benchmark-pack --set all
npm run ariadne -- benchmark-run --project bench-smoke --set smoke
npm run ariadne -- evaluation-trends --project ariadne
npm run ariadne -- usage-report --project ariadne
npm run ariadne -- playwright-capture --project ariadne --target-url http://localhost:3000 --selector "text=Dashboard"
npm run ariadne -- healer-proposal --project ariadne --evidence vault/projects/ariadne/verification/playwright-...json
npm run ariadne -- behavior-checks --project ariadne --approved-fixture coderabbit.md
npm run ariadne -- console-html --project ariadne --refresh-data
npm run ariadne -- console-visual-checks --project ariadne
npm run ariadne -- console-browser-checks --project ariadne
npm run ariadne -- control --project ariadne
npm run ariadne -- evaluation-record --project ariadne --plan vault/projects/ariadne/evaluation/evaluation-plan.json --scores D1=80,D2=75,D3=70,D4=65,D5=60 --evidence vault/projects/ariadne/control/merge-readiness.md
```

## Benchmark Sets

Use three benchmark sets:

- Smoke: one Markdown source and expected artifact ids for the standard roadmap plus artifact-checks flow.
- Realistic: a mixed source packet with whitepaper-style prose, dictated notes, sketch handoff, manual NotebookLM export, CI import, CodeRabbit review import, and read-only infra snapshot.
- Stress: multi-project sources, stale execution seed, failed checks, pending review, and unusual infrastructure snapshot shape.

Generate them with:

```bash
npm run ariadne -- benchmark-pack --set all
```

Run a pack through the local deterministic pipeline with:

```bash
npm run ariadne -- benchmark-run --project bench-smoke --set smoke
npm run ariadne -- benchmark-run --project bench-all --set all
```

`benchmark-run` reads the pack manifest, ingests source files into benchmark projects, generates PRD/GSD/GSD2/execution/Playwright/evaluation/infrastructure/control/GBrain artifacts, imports role-specific fixtures, runs artifact checks, and records a benchmark report. It does not call live services or execute mutation-capable commands.

## Pass Criteria

A run is acceptable when:

- deterministic checks pass,
- evidence paths exist,
- artifact checks have no missing required artifacts,
- optional extraction result checks are understood when the source packet includes drawings, audio, or PDFs,
- control report has no unexplained missing gates,
- evaluation records cite the evidence used for scoring,
- trend reports show whether scores are stable, improving, or declining,
- token/cost reports make review and model-spend visible,
- behavior checks prove approved fixtures and no-mutation gates are present,
- benchmark runs prove the source packs can drive the local pipeline end to end,
- console visual checks prove the static console renders expected sections and trend chart hooks,
- regressions are listed rather than hidden.

## Future Automation

Optional automatic repair execution remains future work. The current healer proposal contract exposes the gates and next-command scaffold, but actual execution is still blocked until review, approval, dry-run, exact `--confirm-plan`, and fresh Playwright evidence are explicit.
