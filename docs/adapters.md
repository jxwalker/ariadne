# Adapter Contracts

The roadmap adapters are file-contract surfaces first. They produce evidence and plans that humans and later live adapters can inspect.

## Source Hygiene

`ingest` scans text-bearing sources for common secret patterns before copying them into the vault. High-severity findings block promotion unless `--allow-secret-findings` is passed.

## Source Extraction Results

`extraction-import` imports reviewed output from OCR, transcription, PDF extraction, or visual-description tools and attaches it to the original source record:

```bash
npm run ariadne -- extraction-import --project ariadne --record <record-id> --from extracted.md --kind ocr --tool tesseract
```

`extraction-plan` records the explicit runner selection before any OCR or transcription tool is run:

```bash
npm run ariadne -- extraction-plan --project ariadne --record <record-id> --tool whisper.cpp --host "M5 Max" --runner mac
```

The plan is non-mutating. It binds a handoff record to a tool, host, runner type, extraction kind, planned output path, constraints, and the exact `extraction-import` command to run after review.

Artifacts:

- `raw/<record-id>/extracted-<extraction-id>.md`
- `extractions/extraction-<timestamp>.json`
- `extractions/extraction-<timestamp>.md`
- `extractions/plans/extraction-plan-<timestamp>.json`
- `extractions/plans/extraction-plan-<timestamp>.md`

The command preserves the raw evidence, records the external tool and optional confidence, and updates the manifest with both the latest extracted text path and the full list of imported extraction paths.

## NotebookLM

`notebooklm-import` normalises a manual NotebookLM markdown/text export into:

- `requirements/notebooklm-import.json`
- `requirements/notebooklm-import.md`

`notebooklm-mutation-plan` is the review gate before any NotebookLM browser or API automation. It records one notebook label, one action, the exact dry-run/live/post-verification commands, rollback, approval, and evidence:

```bash
npm run ariadne -- notebooklm-mutation-plan --project ariadne --notebook "Ariadne Sources" --action export-notes --scope "Export reviewed NotebookLM notes" --auth-evidence control/approvals/approval-...json --dry-run "notebooklmctl notebook show 'Ariadne Sources'" --live-command "notebooklmctl notebook export-notes 'Ariadne Sources' --output notebooklm-export.md" --post-verify "test -s notebooklm-export.md" --rollback "Remove generated export and return to manual import" --approval approval-...
```

Supported actions are `create-source`, `refresh-source`, `generate-summary`, and `export-notes`. The command does not call NotebookLM; it writes `execute=false` readiness evidence for review. Manual import remains the fallback.

`notebooklm-mutation-plan` artifacts:

- `control/mutation-readiness/mutation-readiness-notebooklm-<timestamp>.json`
- `control/mutation-readiness/mutation-readiness-notebooklm-<timestamp>.md`

## GSD2

`gsd2-export` writes `gsd/gsd2-bundle.json`, a flattened task bundle with milestone metadata. `gsd2-import` can rebuild a roadmap from that bundle.

`gsd2-process` collects a read-only snapshot from the selected local `gsd` executable:

```bash
npm run ariadne -- gsd2-process --project ariadne --binary gsd
```

It runs `gsd --version`, `gsd list`, and `gsd --help`, then records version, package list, supported output modes, and subcommands. It does not run `gsd headless`, `gsd auto`, model commands, package install/update, or worktree mutation.

`gsd2-mutation-plan` is the review gate before Ariadne submits a task to GSD2. It records one task id, one execution mode, optional package name, the exact dry-run/live/post-verification commands, rollback, approval, and evidence:

```bash
npm run ariadne -- gsd2-mutation-plan --project ariadne --task TASK-001 --mode headless --package ariadne-roadmap --scope "Submit one reviewed task to GSD2" --auth-evidence control/approvals/approval-...json --dry-run "gsd task show TASK-001 --package ariadne-roadmap" --live-command "gsd headless TASK-001 --package ariadne-roadmap" --post-verify "gsd task show TASK-001 --package ariadne-roadmap" --rollback "Remove generated worktree and mark TASK-001 planned" --approval approval-...
```

Supported modes are `headless`, `auto`, and `worktree`. The command does not invoke GSD2; it writes `execute=false` readiness evidence for review.

Artifacts:

- `gsd/process/gsd2-process-<timestamp>.json`
- `gsd/process/gsd2-process-<timestamp>.md`
- `control/mutation-readiness/mutation-readiness-gsd2-<timestamp>.json`
- `control/mutation-readiness/mutation-readiness-gsd2-<timestamp>.md`

## Decision Logging

`decision` records timestamped architectural decisions in the project decisions directory. It builds a `DecisionRecord` through `recordDecision`, renders the companion Markdown with `renderDecision`, and writes both:

- `decisions/<decision-id>.json`
- `decisions/<decision-id>.md`

Typical fields include status, context, consequences, and source references so later control reports can point back to the evidence behind a decision.

## Execution

`worktree-guard` checks the execution run before any worktree creation:

- repo path present
- working tree clean
- worktree paths available
- branches do not already exist

`--apply` is the only mode that creates worktrees.

## Verification And Review

`playwright-capture` opens a target URL with Playwright Chromium, captures a screenshot and trace archive, and records them as Playwright evidence:

```bash
npm run ariadne -- playwright-capture --project ariadne --target-url http://localhost:3000 --selector "text=Dashboard"
```

Artifacts:

- `verification/playwright-captures/target-<timestamp>.png`
- `verification/playwright-captures/target-<timestamp>.zip`
- `verification/playwright-<timestamp>.json`
- `verification/playwright-<timestamp>.md`

`playwright-evidence`, `import-ci`, and `import-coderabbit` write evidence records into the project control plane. They do not mark the project ready unless the required gates are satisfied.

`healer-proposal` reads failed Playwright evidence and writes a repair proposal that must be reviewed before any code or test change is accepted:

```bash
npm run ariadne -- healer-proposal --project ariadne --evidence vault/projects/ariadne/verification/playwright-...json
```

Artifacts:

- `verification/healer-proposals/healer-<timestamp>.json`
- `verification/healer-proposals/healer-<timestamp>.md`

The proposal records observations, suggested files, verification commands, review gates, automation gates, and next-command scaffolds. It always writes `apply: false` and `automationGates.mutationAllowed: false`; the scaffolded approval, mutation-readiness, dry-run, execute, and recapture commands are not permission to mutate until the listed review and approval gates pass.

`github-snapshot` records read-only pull request and check state from either a saved GitHub JSON export or the `gh` CLI:

```bash
npm run ariadne -- github-snapshot --project ariadne --from github-pr.json --repo jxwalker/ariadne
npm run ariadne -- github-snapshot --project ariadne --repo jxwalker/ariadne --pr 10
```

The live mode only runs read operations through `gh pr view` or `gh pr list`. It does not create branches, update PRs, approve reviews, retry checks, or merge.

`github-mutation-plan` is the target-specific GitHub bridge on top of the generic mutation readiness substrate. It does not run GitHub mutations. It creates a reviewed readiness plan for either a squash PR merge or a failed workflow-run rerun, with dry-run, live, post-verification, and rollback commands prefilled:

```bash
npm run ariadne -- github-mutation-plan --project ariadne --repo jxwalker/ariadne --action merge-pr --pr 29 --auth-evidence control/approvals/approval-...json --approval approval-...
npm run ariadne -- github-mutation-plan --project ariadne --repo jxwalker/ariadne --action rerun-failed-run --run-id 123456789 --auth-evidence control/approvals/approval-...json --approval approval-...
```

Execution still goes through `mutation-dry-run` and `mutation-execute`.

`github-snapshot` artifacts:

- `integrations/github/github-snapshot-<timestamp>.json`
- `integrations/github/github-snapshot-<timestamp>.md`

`github-mutation-plan` artifacts:

- `control/mutation-readiness/mutation-readiness-github-<timestamp>.json`
- `control/mutation-readiness/mutation-readiness-github-<timestamp>.md`

`deployment-mutation-plan` is the target-specific deployment bridge on top of the same readiness substrate. It does not connect to a host or execute deployment commands. It records a bounded plan for one estate system and host, carrying the exact dry-run, live command, post-verification command, rollback, approval, and auth evidence reviewers need before a live deployment adapter can exist:

```bash
npm run ariadne -- deployment-mutation-plan --project ariadne --system proxmox --host beast --scope "Restart Ariadne worker service" --auth-evidence control/approvals/approval-...json --dry-run "ssh beast systemctl status ariadne" --live-command "ssh beast sudo systemctl restart ariadne" --post-verify "ssh beast systemctl is-active ariadne" --rollback "ssh beast sudo systemctl restart ariadne-previous" --approval approval-...
```

Supported systems are `proxmox`, `truenas`, `dgx-spark`, and `mac`. The host label is included in the plan scope and rollback prefix so a deployment approval for one machine cannot be mistaken for a general estate mutation.

`deployment-mutation-plan` artifacts:

- `control/mutation-readiness/mutation-readiness-deployment-<timestamp>.json`
- `control/mutation-readiness/mutation-readiness-deployment-<timestamp>.md`

`hermes-cron-mutation-plan` is the target-specific Hermes scheduler bridge on top of mutation readiness. It does not create, update, enable, disable, delete, or run Hermes jobs. It records one scheduler action and one job label, then captures the exact reviewed dry-run, live, post-verification, and rollback commands:

```bash
npm run ariadne -- hermes-cron-mutation-plan --project ariadne --action update --job nightly-memory-review --host beast --scope "Update nightly memory review schedule" --auth-evidence control/approvals/approval-...json --dry-run "hermes cron get nightly-memory-review --host beast" --live-command "hermes cron update nightly-memory-review --host beast --from reviewed-job.json" --post-verify "hermes cron get nightly-memory-review --host beast" --rollback "hermes cron update nightly-memory-review --host beast --from previous-job.json" --approval approval-...
```

Supported actions are `create`, `update`, `enable`, `disable`, and `delete`. `run-now` is intentionally excluded from the planning wrapper because it is an immediate execution action, not a durable scheduler-state change.

`hermes-cron-mutation-plan` artifacts:

- `control/mutation-readiness/mutation-readiness-hermes-cron-<timestamp>.json`
- `control/mutation-readiness/mutation-readiness-hermes-cron-<timestamp>.md`

## Recovery

`recovery-report` reads the vault state and writes a crash-resume report without mutating worktrees, branches, PRs, or external systems. It identifies incomplete execution runs, missing worktree guard reports, failed checks, pending reviews, and missing readiness gates.

Artifacts:

- `control/recovery-report.json`
- `control/recovery-report.md`

## Approval Workflow

`approval-request` records an explicit human approval request before any mutation-capable adapter can be enabled. `approval-decision` records the decision. These commands only write evidence; they do not execute the requested action.

`mutation-readiness` records the bounded plan that must exist before a mutation-capable adapter is implemented or enabled. It binds target, risk, scope, auth evidence, supporting evidence, dry-run command, proposed live command, post-action verification command, rollback, approval record, and target-specific gates. It also writes `execute=false`, so it is readiness evidence rather than execution authority.

`mutation-readiness-audit` aggregates all readiness plans and reports whether each plan has approved human authorization, existing evidence refs, a non-mutating dry-run command, a post-action verification command, rollback text, and `execute=false`. It never runs dry-run or live commands.

`mutation-readiness-repair-plan` is the read-only repair guide when that audit blocks. It refreshes the audit and live-adapter next-actions report, then classifies each live-adapter target as audit-passed, missing a plan, repairable by regenerating a target-specific plan, or waiting on operator approval/evidence. It emits approval-request and regeneration command scaffolds with `mutationAllowed=false`; it never imports evidence, grants approval, runs dry-runs, or executes live commands.

`mutation-dry-run` executes only the reviewed dry-run command for one readiness plan, and only when that exact plan passes the readiness audit. It captures stdout, stderr, exit code, duration, audit reference, and `execute=false` as evidence. It never runs the proposed live command or post-action verification command.

`mutation-execute` executes the proposed live command only when the plan passes readiness audit, has a passed dry-run record, and the operator supplies `--confirm-plan` matching the exact plan id. It then runs the post-action verification command and records live output, verification output, rollback text, audit reference, dry-run reference, and `execute=true`. Console projections redact command output; the full output remains in the execution artifact.

`target-mutation-execute` adds one more guard before delegating to `mutation-execute`: the operator must name the expected target, and Ariadne refuses to execute if the readiness plan targets anything else.

Target-specific execute wrappers hard-code that guard for the live adapters: `github-mutation-execute`, `deployment-mutation-execute`, `hermes-cron-mutation-execute`, `openscorpion-mutation-execute`, `gsd2-mutation-execute`, and `notebooklm-mutation-execute`. They do not add a separate execution path; each wrapper delegates to `target-mutation-execute` semantics and refuses plans for any other target.

`live-adapter-readiness` reports whether each target has enough evidence to replace placeholder shell commands with a real adapter. A target is ready only when it has an audit-passed readiness plan, passed dry-run evidence, and passed target-guarded execution evidence. The report is still non-mutating; it writes `control/live-adapter-readiness.json` and `.md`.

`live-adapter-next-actions` turns readiness and operator-evidence blockers into an operator packet. It lists the next operator-evidence packet command, approval request, target-specific mutation plan, dry-run, target-guarded execution, or placeholder-replacement step still needed for each target. Operator-evidence actions start with `live-adapter-operator-evidence-next` so the workspace, assist packet, preflight, review session, and cutover audit are refreshed before a human imports evidence. It does not decide approvals or run commands; it writes `control/live-adapter-next-actions.json` and `.md`.

`live-adapter-approval-pack` turns those next actions into operator review packets. Each packet gives the recommended risk, approval-request command draft, target-specific evidence checklist, mutation-plan command, dry-run step, execution step, rollback requirement, and post-verification requirement. Ariadne does not approve its own adapters; this command writes `control/live-adapter-approval-pack.json` and `.md` for all targets, or `control/live-adapter-approval-pack-<target>.json` and `.md` when `--target` narrows the report.

`live-adapter-approval-review` records that an operator has reviewed a packet and classified it as `accepted`, `needs_changes`, or `rejected`. It writes `mutationApproved=false`; live mutation still requires the later approval, readiness, dry-run, and execution gates.

`live-adapter-approval-review-audit` checks the packet-review records before they are allowed to influence live-adapter readiness. It verifies accepted reviews reference a real packet generation time, evidence refs still exist, malformed records are rejected, and current accepted reviews are visible per target.

`live-adapter-dossier` creates a target-specific operator packet by combining readiness blockers, next actions, approval-pack details, approval-review audit state, mutation-readiness audit checks, and GBrain memory context. GBrain is used as a derived memory search surface only: the dossier records available export/report refs and suggested queries, but Ariadne remains the source of truth.

`live-adapter-cutover-audit` is the final non-mutating audit before implementation work replaces placeholder shell commands with a real target adapter. It requires complete imported operator evidence, current accepted packet-review evidence, an audit-passed mutation-readiness plan, auth evidence accepted by that audit, rollback and post-verification acceptance, passed dry-run evidence, passed target-guarded execution evidence, a known target wrapper, and a target dossier. GBrain context is carried as advisory memory, never as approval authority. Add `--target <target>` to write a scoped audit such as `control/live-adapter-cutover-audit-hermes-cron.json` while leaving the all-target audit available for estate-level review.

`live-adapter-review-session` consolidates the current operator review work into one non-mutating packet. It regenerates the target dossiers, approval pack, approval-review audit, mutation-readiness repair plan, operator-evidence audit, and cutover audit, then writes `control/live-adapter-review-session.json` and `.md` with one section per target: first action, operator-evidence status, evidence file, check/import commands, missing operator-evidence sections, packet-review command, approval request draft, mutation-plan draft, mutation-repair status and commands, required evidence, cutover blockers, dossier refs, and GBrain advisory queries. Add `--target <target>` to write a one-adapter packet such as `control/live-adapter-review-session-hermes-cron.json`; scoped sessions prefer matching scoped operator-evidence assist files when they exist. The scoped review packet points at its scoped cutover audit and target dossier, while approval-review, mutation-repair, and operator-evidence audit refs remain the global source artifacts because those evaluators still summarize all targets before the session filters the selected target. It always writes `mutationApproved=false`; it helps an operator review the packet but does not approve live mutation.

`live-adapter-evidence-templates` creates blank operator evidence templates for each target. The aggregate report is written to `control/live-adapter-evidence-templates.json` and `.md`, while per-target Markdown templates are written under `control/live-adapter-evidence-templates/`. These templates list packet-review, auth-boundary, rollback, post-verification, dry-run, target-guarded execution, and GBrain advisory items, but they are not evidence until an operator fills them with real observations.

`live-adapter-operator-evidence-workplan` converts the current operator-evidence audit into an execution queue. It writes `control/live-adapter-operator-evidence-workplan.json` and `.md` with the template ref, check command, import command, packet-review command, missing sections, required evidence, cutover blockers, and GBrain advisory queries for each target. It is a collection aid only: it keeps `mutationApproved=false` and does not count as operator evidence.

`live-adapter-operator-evidence-check` preflights one filled operator evidence file without recording it as evidence. It hashes the source file, evaluates the same required sections as the importer, and writes `control/live-adapter-operator-evidence-checks/operator-evidence-check-<target>-<timestamp>.json` and `.md` with `recorded=false`, `operatorEvidenceRecordCreated=false`, `mutationApproved=false`, and `approvalGranted=false`. Use it before import when an operator wants a deterministic missing-section list without changing the authoritative evidence set.

`live-adapter-operator-evidence-check-all` reads the operator workspace when present, falls back to the current evidence-template pack, runs the same preflight checker once for every live-adapter target, writes `control/live-adapter-operator-evidence-check-all.json` and `.md`, and refreshes the operator-evidence queue. Use `--source workspace` to require workspace files or `--source templates` to preflight the blank templates explicitly. It is useful before an operator work session because it turns unchecked targets into explicit missing-section counts and labels without creating evidence records or approvals.

`live-adapter-operator-evidence-queue` combines the operator-evidence audit, workplan, and latest preflight checks into one target queue. It writes `control/live-adapter-operator-evidence-queue.json` and `.md`, classifying each target as `unchecked`, `needs_evidence`, `ready_for_import`, `needs_rework`, or `complete`, with missing-section counts and labels visible in the target table. It is an operator aid only and keeps `mutationApproved=false`.

`live-adapter-operator-evidence-import-ready` imports only queue targets whose latest preflight check is complete. It skips unchecked, incomplete, already-complete, and needs-rework targets, then refreshes the operator-evidence audit and queue. It writes `control/live-adapter-operator-evidence-import-ready.json` and `.md`, keeps `mutationApproved=false`, keeps `approvalGranted=false`, and does not bypass review, dry-run, execution, or cutover gates.

`live-adapter-operator-evidence-workspace` turns the queue and workplan into fillable operator files under `control/operator-evidence/<target>/`. Each target gets `operator-evidence.md` plus support files for packet review, auth boundary, rollback/post-verification, dry-run review, GBrain notes, and read-only assist notes. The evidence file is section-first: it starts with the current missing section, a fill-order table, and per-section observation notes so an operator can verify one fact at a time. The generated commands point at the workspace evidence file, but the workspace remains paperwork only until an operator fills and imports it.

`live-adapter-operator-evidence-assist` generates `control/live-adapter-operator-evidence-assist.json` and `.md`, then writes a `read-only-assist.md` file beside each target's evidence file. The assist packet gathers existing Ariadne support refs from the current workplan, summarizes promoted live-evidence records with source kinds and compact runtime/smoke bullets, and lists next steps for human review. It is not proof: it keeps `operatorEvidenceRecordCreated=false`, `mutationApproved=false`, and `approvalGranted=false`.

`live-adapter-operator-evidence-next` selects the current operator-evidence target from the queue, unless `--target` is provided, and refreshes the target workspace, read-only assist, workspace preflight, review session, and cutover audit in one packet. It writes `control/live-adapter-operator-evidence-next-<target>.json` and `.md` with generated refs, missing section labels, support refs, a human verification worksheet, concrete per-section reference details, non-mutating check/review/cutover commands, and a separate import command under an after-human-verification heading. It is preparation only: it does not import evidence, approve mutation, or grant live-adapter authority.

`operator-next` is the short human-facing wrapper for that packet. It refreshes the current packet and console, then prints the console path, packet path, exact `operator-evidence.md` file to fill, current missing section, section start guidance, record location, preflight expectation, one-section guide command, the preflight command, and the import command that remains gated until after human verification.

`operator-section` is the focused one-section handoff for a human who is filling `operator-evidence.md`. It writes `control/live-adapter-operator-evidence-section-<target>.json` and `.md` for the current missing section or an explicit `--section`, including start refs, record location, GBrain advisory queries, promoted live-evidence refs, and the same preflight/import commands. It does not import evidence, approve mutation, or grant live-adapter authority.

`live-evidence-promote` turns local-only live artifacts into sanitized evidence summaries that can be cited during operator review. It accepts ignored runtime probes, E2E smoke reports, live SSH inventory, deployment snapshots, or other JSON/text files with `--from`, but source paths must resolve inside the selected project vault and each source must fit the small live-evidence size cap. It hashes every source, extracts known Ariadne summaries, redacts private URLs, source paths, SSH targets, email-like values, and private IP strings, then writes `control/live-evidence-promotions/live-evidence-promotion-<target>-<timestamp>.json` and `.md`. This is still not operator evidence or approval: it keeps `operatorEvidenceRecordCreated=false`, `mutationApproved=false`, and `approvalGranted=false`.

`live-adapter-operator-evidence` imports a filled operator evidence file for one target. It hashes the source file, checks whether the operator identity, packet review, auth boundary, bounded action, rollback, post-verification, dry-run, target-wrapper, and exact `--confirm-plan` sections are present, and writes `control/live-adapter-operator-evidence/operator-evidence-<target>-<timestamp>.json` and `.md`. It also records whether GBrain notes are present, but GBrain remains advisory only. The record always writes `mutationApproved=false` and `approvalGranted=false`.

`live-adapter-operator-evidence-audit` summarizes those imported records across GitHub, deployment, Hermes cron, OpenScorpion, GSD2, and NotebookLM. Targets with no imported evidence are treated as missing the full required section set, so status and queue summaries show the real collection workload instead of a zero-section placeholder. Missing or incomplete target evidence becomes an approval-queue blocker in the console, while complete operator evidence still does not bypass approval-review, mutation-readiness, dry-run, target execution, or cutover gates.

```bash
npm run ariadne -- approval-request --project ariadne --by planner --target github --action "Enable PR mutation adapter" --risk medium --reason "Manual gate before live mutation" --rollback "Disable adapter and return to manual PR flow"
npm run ariadne -- approval-decision --project ariadne --approval approval-... --status approved --by james --notes "Approved for a bounded test only."
npm run ariadne -- mutation-readiness --project ariadne --target github --scope "Single PR merge adapter" --auth-evidence control/approvals/approval-...json --dry-run "gh pr view 1 --json statusCheckRollup" --live-command "gh pr merge 1 --squash" --post-verify "gh pr view 1 --json mergeStateStatus,statusCheckRollup" --rollback "Revert merge commit and disable adapter" --approval approval-...
npm run ariadne -- notebooklm-mutation-plan --project ariadne --notebook "Ariadne Sources" --action export-notes --scope "Export reviewed NotebookLM notes" --auth-evidence control/approvals/approval-...json --dry-run "notebooklmctl notebook show 'Ariadne Sources'" --live-command "notebooklmctl notebook export-notes 'Ariadne Sources' --output notebooklm-export.md" --post-verify "test -s notebooklm-export.md" --rollback "Remove generated export and return to manual import" --approval approval-...
npm run ariadne -- gsd2-mutation-plan --project ariadne --task TASK-001 --mode headless --package ariadne-roadmap --scope "Submit one reviewed task to GSD2" --auth-evidence control/approvals/approval-...json --dry-run "gsd task show TASK-001 --package ariadne-roadmap" --live-command "gsd headless TASK-001 --package ariadne-roadmap" --post-verify "gsd task show TASK-001 --package ariadne-roadmap" --rollback "Remove generated worktree and mark TASK-001 planned" --approval approval-...
npm run ariadne -- hermes-cron-mutation-plan --project ariadne --action update --job nightly-memory-review --host beast --scope "Update nightly memory review schedule" --auth-evidence control/approvals/approval-...json --dry-run "hermes cron get nightly-memory-review --host beast" --live-command "hermes cron update nightly-memory-review --host beast --from reviewed-job.json" --post-verify "hermes cron get nightly-memory-review --host beast" --rollback "hermes cron update nightly-memory-review --host beast --from previous-job.json" --approval approval-...
npm run ariadne -- openscorpion-mutation-plan --project ariadne --activity activity-001 --type ariadne.evidence --action submit-activity --route governed --scope "Submit reviewed evidence package" --auth-evidence control/approvals/approval-...json --dry-run "openscorpion activity validate activity-001 --route governed" --live-command "openscorpion activity submit activity-001 --route governed" --post-verify "openscorpion activity status activity-001 --route governed" --rollback "openscorpion activity withdraw activity-001 --route governed" --approval approval-...
npm run ariadne -- deployment-mutation-plan --project ariadne --system proxmox --host beast --scope "Restart Ariadne worker service" --auth-evidence control/approvals/approval-...json --dry-run "ssh beast systemctl status ariadne" --live-command "ssh beast sudo systemctl restart ariadne" --post-verify "ssh beast systemctl is-active ariadne" --rollback "ssh beast sudo systemctl restart ariadne-previous" --approval approval-...
npm run ariadne -- mutation-readiness-audit --project ariadne
npm run ariadne -- mutation-dry-run --project ariadne --plan mutation-readiness-github-...
npm run ariadne -- live-adapter-readiness --project ariadne
npm run ariadne -- live-adapter-next-actions --project ariadne
npm run ariadne -- live-adapter-approval-pack --project ariadne --target all
npm run ariadne -- live-adapter-approval-review --project ariadne --target github --by james --status accepted --packet control/live-adapter-approval-pack.json --evidence control/live-adapter-approval-pack.json
npm run ariadne -- live-adapter-approval-review-audit --project ariadne
npm run ariadne -- live-adapter-dossier --project ariadne --target github
npm run ariadne -- live-adapter-cutover-audit --project ariadne
npm run ariadne -- live-adapter-cutover-audit --project ariadne --target hermes-cron
npm run ariadne -- live-adapter-review-session --project ariadne
npm run ariadne -- live-adapter-review-session --project ariadne --target hermes-cron
npm run ariadne -- live-adapter-evidence-templates --project ariadne
npm run ariadne -- live-adapter-operator-evidence-workplan --project ariadne
npm run ariadne -- live-adapter-operator-evidence-queue --project ariadne
npm run ariadne -- live-adapter-operator-evidence-workspace --project ariadne
npm run ariadne -- live-adapter-operator-evidence-assist --project ariadne
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target github --from vault/projects/ariadne/control/operator-evidence/github/operator-evidence.md
npm run ariadne -- live-adapter-operator-evidence-check-all --project ariadne --source workspace
npm run ariadne -- live-adapter-operator-evidence-import-ready --project ariadne --by james
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target github --from vault/projects/ariadne/control/operator-evidence/github/operator-evidence.md --by james
npm run ariadne -- live-adapter-operator-evidence-audit --project ariadne
npm run ariadne -- live-adapter-operator-evidence-next --project ariadne
npm run ariadne -- github-mutation-execute --project ariadne --plan mutation-readiness-github-... --confirm-plan mutation-readiness-github-...
npm run ariadne -- target-mutation-execute --project ariadne --target github --plan mutation-readiness-github-... --confirm-plan mutation-readiness-github-...
npm run ariadne -- mutation-execute --project ariadne --plan mutation-readiness-github-... --confirm-plan mutation-readiness-github-...
```

Artifacts:

- `control/approvals/approval-<timestamp>.json`
- `control/approvals/approval-<timestamp>.md`
- `control/mutation-readiness/mutation-readiness-<target>-<timestamp>.json`
- `control/mutation-readiness/mutation-readiness-<target>-<timestamp>.md`
- `control/mutation-readiness-audit.json`
- `control/mutation-readiness-audit.md`
- `control/mutation-dry-runs/mutation-dry-run-<timestamp>.json`
- `control/mutation-dry-runs/mutation-dry-run-<timestamp>.md`
- `control/mutation-executions/mutation-execution-<timestamp>.json`
- `control/mutation-executions/mutation-execution-<timestamp>.md`
- `control/live-adapter-readiness.json`
- `control/live-adapter-next-actions.json`
- `control/live-adapter-approval-pack.json`
- `control/live-adapter-approval-reviews/approval-review-<target>-<timestamp>.json`
- `control/live-adapter-approval-reviews/approval-review-<target>-<timestamp>.md`
- `control/live-adapter-approval-review-audit.json`
- `control/live-adapter-approval-review-audit.md`
- `control/live-adapter-dossiers/live-adapter-dossier-<target>.json`
- `control/live-adapter-dossiers/live-adapter-dossier-<target>.md`
- `control/live-adapter-cutover-audit.json`
- `control/live-adapter-cutover-audit-<target>.json`
- `control/live-adapter-cutover-audit.md`
- `control/live-adapter-review-session.json`
- `control/live-adapter-review-session-<target>.json`
- `control/live-adapter-review-session.md`
- `control/live-adapter-evidence-templates.json`
- `control/live-adapter-evidence-templates.md`
- `control/live-adapter-evidence-templates/live-adapter-evidence-template-<target>.md`
- `control/live-adapter-operator-evidence-workplan.json`
- `control/live-adapter-operator-evidence-workplan.md`
- `control/live-adapter-operator-evidence-checks/operator-evidence-check-<target>-<timestamp>.json`
- `control/live-adapter-operator-evidence-checks/operator-evidence-check-<target>-<timestamp>.md`
- `control/live-adapter-operator-evidence-check-all.json`
- `control/live-adapter-operator-evidence-check-all.md`
- `control/live-adapter-operator-evidence-queue.json`
- `control/live-adapter-operator-evidence-queue.md`
- `control/live-adapter-operator-evidence-import-ready.json`
- `control/live-adapter-operator-evidence-import-ready.md`
- `control/live-adapter-operator-evidence-assist.json`
- `control/live-adapter-operator-evidence-assist.md`
- `control/live-adapter-operator-evidence-workspace.json`
- `control/live-adapter-operator-evidence-workspace.md`
- `control/live-adapter-operator-evidence-workspace-<target>.json`
- `control/live-adapter-operator-evidence-workspace-<target>.md`
- `control/live-adapter-operator-evidence-next-<target>.json`
- `control/live-adapter-operator-evidence-next-<target>.md`
- `control/live-adapter-operator-evidence-section-<target>.json`
- `control/live-adapter-operator-evidence-section-<target>.md`
- section handoff artifacts contain the current missing-section prompt, start refs, GBrain advisory queries, evidence file, and preflight/import commands for `operator-section`
- `control/live-evidence-promotions/live-evidence-promotion-<target>-<timestamp>.json`
- `control/live-evidence-promotions/live-evidence-promotion-<target>-<timestamp>.md`
- `control/operator-evidence/<target>/operator-evidence.md`
- `control/operator-evidence/<target>/{packet-review,auth-boundary,rollback-post-verify,dry-run-review,gbrain-notes,read-only-assist}.md`
- `control/live-adapter-operator-evidence/operator-evidence-<target>-<timestamp>.json`
- `control/live-adapter-operator-evidence/operator-evidence-<target>-<timestamp>.md`
- `control/live-adapter-operator-evidence-audit.json`
- `control/live-adapter-operator-evidence-audit.md`

## Evaluation

`evaluation` creates a project evaluation plan with dimensions for evidence fidelity, planning quality, execution safety, verification strength, and operational fit. `evaluation-record` stores scored run evidence so the pipeline can be compared across machines and over time.

`evaluation-trends` reads timestamped evaluation records and writes overall plus per-dimension deltas for console charting and release review.

`usage-import` appends token and cost metrics from Hermes, CodeRabbit, OpenAI, CI, local LLM canaries, or manual JSON exports. `usage-report` aggregates those records by source and model, so evaluation can track model/review spend without live service calls.

`artifact-checks` is a deterministic evaluation sensor. It verifies that the required evidence spine exists before an operator records scores or relies on a control report. Optional console artifacts are reported without blocking the status.

`behavior-checks` records behavior-confidence checks for:

- approved review fixtures,
- explicit human-approval gates before mutation,
- approval workflow records for mutation-capable adapters,
- read-only infrastructure snapshot modes,
- non-submitting OpenScorpion activity drafts,
- worktree guard records.

`roadmap-completion-audit` is a conservative completion sensor for the full Ariadne roadmap. It reads the current artifact checks, behavior checks, evaluation trends, console visual/browser checks, coordination records, GBrain advisory context, operator-evidence audit, live-adapter cutover audit, and review-session state. The audit is blocked until those current artifacts prove completion; it does not infer readiness from intent or from partial roadmap progress.

`roadmap-control-refresh` is the non-mutating refresh pass to run before judging a long-lived checkout or generated vault. It regenerates live-adapter readiness, next actions, approval review state, dossiers, operator evidence workplan/workspace/assist/checks/queue, the next operator packet, review session, cutover audit, roadmap completion audit, GBrain export, artifact checks, console data, and console HTML. The report itself records `mutationApproved=false`, `approvalGranted=false`, and `operatorEvidenceRecordCreated=false`.

`benchmark-pack` materialises repeatable source packs for smoke, realistic, and stress evaluations. The packs are local files only; they do not ingest sources or call live services by themselves.

`benchmark-run` runs one generated pack through the local deterministic Ariadne pipeline and records the outcome as evaluation evidence. It uses the pack's file roles to ingest sources and import fixtures, then generates planning, verification, control, behavior, GBrain, and artifact-check outputs. It does not call live services or execute mutation-capable commands.

Artifacts:

- `evaluation/evaluation-plan.json`
- `evaluation/evaluation-plan.md`
- `evaluation/evaluation-<timestamp>.json`
- `evaluation/evaluation-<timestamp>.md`
- `evaluation/benchmark-run-<set>-<timestamp>.json`
- `evaluation/benchmark-run-<set>-<timestamp>.md`
- `evaluation/evaluation-trends.json`
- `evaluation/evaluation-trends.md`
- `evaluation/usage-metrics.jsonl`
- `evaluation/usage-report.json`
- `evaluation/usage-report.md`
- `evaluation/artifact-checks.json`
- `evaluation/artifact-checks.md`
- `evaluation/behavior-checks.json`
- `evaluation/behavior-checks.md`
- `control/roadmap-control-refresh.json`
- `control/roadmap-control-refresh.md`
- `control/roadmap-completion-audit.json`
- `control/roadmap-completion-audit.md`
- `benchmarks/source-packs/<set>/benchmark-pack.json`
- `benchmarks/source-packs/<set>/README.md`

## GBrain

`gbrain-export` writes a read-only Ariadne evidence bundle for optional import into [GBrain](https://github.com/garrytan/gbrain). Ariadne remains the source of truth; GBrain is treated as a derived memory/search substrate. The export includes source records, requirements, tasks, decisions, evaluations, infrastructure registry data, live-adapter dossiers, operator assist summaries, promoted live evidence, and the current roadmap-completion audit when those artifacts exist.

Artifacts:

- `integrations/gbrain/gbrain-export.json`
- `integrations/gbrain/gbrain-export.md`

`gbrain-report-import` imports a GBrain query, search, or eval report JSON back into Ariadne as evidence:

- `integrations/gbrain/gbrain-report-<timestamp>.json`
- `integrations/gbrain/gbrain-report-<timestamp>.md`

## Sleep, Memory, And Agent Mail

The coordination adapters are append-only file records:

- `sleep-record`: recurring review summaries and proposed next actions.
- `memory-proposal`: durable lessons proposed from evidence, not silently written into global memory.
- `agent-mail`: interagent inbox/outbox messages tied to optional task and run ids.
- `agent-lease`: ownership records for worktrees, repos, hosts, or other contested resources.
- `hermes-cron-import`: read-only evidence imports from Hermes cron/job snapshots.
- `hermes-cron-proposal`: proposal-only recommendations from imported Hermes scheduler evidence.

Artifacts are written under `coordination/`, `coordination/mail/`, `coordination/leases/`, and `coordination/hermes/`.

`hermes-cron-import` normalises common cron export shapes such as `jobs`, `cronJobs`, `scheduledJobs`, or `tasks`. It records job names, schedules, enabled state, last/next run hints, and a short intent summary. It redacts obvious secret-like fields and never creates, enables, disables, or runs Hermes jobs.

```bash
npm run ariadne -- hermes-cron-import --project ariadne --from hermes-cron.json --host beast
npm run ariadne -- hermes-cron-proposal --project ariadne --scope nightly
```

Artifacts:

- `coordination/hermes/hermes-cron-<timestamp>.json`
- `coordination/hermes/hermes-cron-<timestamp>.md`
- `coordination/hermes/hermes-cron-proposal-<timestamp>.json`
- `coordination/hermes/hermes-cron-proposal-<timestamp>.md`

`hermes-cron-mutation-plan` is the review gate before any live Hermes scheduler adapter. Use it to bind one scheduler action and job label to the proposed commands:

```bash
npm run ariadne -- hermes-cron-mutation-plan --project ariadne --action update --job nightly-memory-review --host beast --scope "Update nightly memory review schedule" --auth-evidence control/approvals/approval-...json --dry-run "hermes cron get nightly-memory-review --host beast" --live-command "hermes cron update nightly-memory-review --host beast --from reviewed-job.json" --post-verify "hermes cron get nightly-memory-review --host beast" --rollback "hermes cron update nightly-memory-review --host beast --from previous-job.json" --approval approval-...
```

The plan remains non-executing. It feeds the same `mutation-readiness-audit`, `mutation-dry-run`, and `mutation-execute` gates used by other mutation adapters.

## Console Data

`console-data` writes a normalised read-only projection of the vault to:

- `console/console-data.json`

The record includes source summaries, requirements, GSD tasks, execution runs, checks, reviews, decisions, Playwright evidence, evaluation runs, GitHub snapshots, recovery state, infrastructure registry/snapshots, merge readiness, and key artifact paths. It is intended as the stable data contract for future console UI work.

`console-html` renders that contract into:

- `console/index.html`

Use `--refresh-data` to regenerate `console/console-data.json` before rendering the HTML.

`console-visual-checks` performs deterministic checks against the generated console HTML. It verifies the expected visual sections, embedded data, evaluation trend chart or empty state, and absence of local absolute-path leaks.

`console-browser-checks` opens the generated console with Playwright Chromium, verifies key rendered sections, parses embedded data, captures a screenshot, and writes browser-backed evidence.

Artifacts:

- `console/visual-checks.json`
- `console/visual-checks.md`
- `console/browser-checks.json`
- `console/browser-checks.md`
- `console/screenshots/console-<timestamp>.png`

## Infrastructure And Governance

`infra-snapshot` imports a read-only JSON snapshot. `openscorpion-draft` writes a governed activity draft with `submit: false`.

`openscorpion-mutation-plan` is the review gate before any OpenScorpion activity submission. It records one activity id, activity type, supported action, route, exact dry-run/live/post-verification commands, rollback, approval, and evidence:

```bash
npm run ariadne -- openscorpion-mutation-plan --project ariadne --activity activity-001 --type ariadne.evidence --action submit-activity --route governed --scope "Submit reviewed evidence package" --auth-evidence control/approvals/approval-...json --dry-run "openscorpion activity validate activity-001 --route governed" --live-command "openscorpion activity submit activity-001 --route governed" --post-verify "openscorpion activity status activity-001 --route governed" --rollback "openscorpion activity withdraw activity-001 --route governed" --approval approval-...
```

Supported actions are `submit-activity`, `update-activity`, and `withdraw-activity`. Supported routes are `governed` and `staging`; public submission is intentionally not a planning route. The command does not call OpenScorpion; it writes `execute=false`.

`infra-live-local` collects a sanitized live read-only snapshot of the current host:

```bash
npm run ariadne -- infra-live-local --project ariadne --notes "Mac workstation read-only snapshot"
```

The collector uses local Node.js OS APIs, hashes the hostname, omits network and MAC addresses, and records `snapshotKind: live_read_only`. It does not connect to remote hosts or mutate infrastructure.

`local-runtime-probe` records the current runtime surface for Hermes and local model servers:

```bash
npm run ariadne -- local-runtime-probe --project ariadne --canary --canary-endpoints ds4-openai --ds4-canary-model deepseek-v4-flash
```

It checks the Hermes dashboard URL, Hermes CLI status/doctor/gateway commands, Ollama, DS4/OpenAI-compatible, LM Studio, and Atlas endpoints. With `--canary`, it sends a strict no-think `READY` prompt and records observed local model usage as `local-llm` metrics. Use `--canary-endpoints` to limit the canary to selected runtimes and endpoint-specific model flags when a default model is cold or too large for a quick probe. Atlas defaults to `http://127.0.0.1:8888/v1` and can be overridden with `ARIADNE_ATLAS_URL` or `--atlas-url`; the other runtime URLs and canary models support the same environment-default pattern. It writes `infrastructure/runtime/local-runtime-probe-<timestamp>.json` and `infrastructure/runtime/local-runtime-probe-<timestamp>.md`; the Markdown file is the human-readable probe report. The command redacts configured non-loopback endpoint URLs in the persisted JSON and Markdown artifacts while still using the raw URL for live reachability and canary calls. It does not start services, load models, create Hermes cron jobs, or mutate infrastructure.

`infra-live-ssh` collects the same class of evidence from an approved remote host over SSH:

```bash
npm run ariadne -- infra-live-ssh --project ariadne --host beast --target james@beast.lan --notes "Approved read-only remote snapshot"
```

The SSH collector runs a fixed POSIX read-only inventory script, stores the human host label, hashes the SSH target and reported hostname, omits network and MAC addresses, and records capabilities such as Docker, Proxmox, ZFS, and `nvidia-smi`. It does not upload files, edit configuration, restart services, or execute mutation-capable commands.

`deployment-snapshot` imports read-only estate snapshots for Proxmox, TrueNAS, DGX Spark, Macs, GitHub, or generic systems. This is the deployment adapter bridge for visualising where Ariadne can run without granting mutation capability.

`deployment-live-ssh` collects a host-specific deployment profile from an approved SSH target:

```bash
npm run ariadne -- deployment-live-ssh --project ariadne --system proxmox --host beast --target james@beast.lan --notes "Approved read-only deployment profile"
```

It first records the sanitized SSH infrastructure snapshot, then writes a deployment snapshot for `proxmox`, `truenas`, `dgx-spark`, or `mac`. The profile includes capability evidence, a confidence level, and counts for model endpoints, runner pools, storage pools, and services. It never mutates the host.

`deployment-mutation-plan` is the next review gate after read-only deployment evidence. Use it to bind one system and host to the proposed deployment commands before any live deployment adapter is built:

```bash
npm run ariadne -- deployment-mutation-plan --project ariadne --system proxmox --host beast --scope "Restart Ariadne worker service" --auth-evidence control/approvals/approval-...json --dry-run "ssh beast systemctl status ariadne" --live-command "ssh beast sudo systemctl restart ariadne" --post-verify "ssh beast systemctl is-active ariadne" --rollback "ssh beast sudo systemctl restart ariadne-previous" --approval approval-...
```

The plan still has `execute=false`; follow with `mutation-readiness-audit`, `mutation-dry-run`, and `mutation-execute` only after review.
