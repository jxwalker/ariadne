# Live Adapter Approval Pack

Project: ariadne
Status: ready_for_operator_review
Generated: 2026-05-17T00:28:19.912Z
Next actions: projects/ariadne/control/live-adapter-next-actions.json

## Summary

- Targets: 6
- Packets: 6
- Blocked targets: 6
- Ready targets: 0

## Operator Rule

Ariadne does not approve its own live adapters. These packets draft the evidence and command checklist an operator must review before creating or deciding approval records.

## Packets

### github

Readiness: blocked
Recommended risk: medium
Operator decision required: true

#### Approval Request

```bash
npm run ariadne -- approval-request --project ariadne --by <operator> --target github --action "Enable one reviewed GitHub mutation adapter action" --risk medium --reason "Permit a bounded PR or workflow operation after checks, review, and branch policy are verified" --rollback "Document how to revert or undo the PR/workflow operation and restore manual review flow." --evidence <auth-or-policy-evidence>
```

#### Required Evidence

- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- repository, PR, branch policy, and check-rollup evidence

#### Mutation Plan

```bash
Create or repair the target-specific mutation-readiness plan after operator approval exists. npm run ariadne -- github-mutation-plan --project <project> --repo <owner/name> --action <merge-pr|rerun-failed-run> --auth-evidence <paths> --approval <approval-id>
```

#### Dry Run

```bash
After mutation-readiness-github-2026-05-16T16-50-54-241Z passes audit, run npm run ariadne -- mutation-dry-run --project <project> --plan mutation-readiness-github-2026-05-16T16-50-54-241Z
```

#### Execution

```bash
Run a passed dry-run for an audit-passed plan first.
```

Rollback: Document how to revert or undo the PR/workflow operation and restore manual review flow.
Post-verification: Verify PR/workflow status, check rollup, and repository state after execution.

#### Blockers

- no accepted operator review exists for live-adapter approval packet
- no readiness plan passes audit
- no passed dry-run evidence exists for an audit-passed plan
- no passed target-guarded execution evidence exists

#### Next Actions

- pending: Record operator review of the approval packet
- pending: Resolve existing readiness plan blockers
- pending: Run the reviewed dry-run command
- blocked: Capture target-guarded execution evidence

### deployment

Readiness: blocked
Recommended risk: high
Operator decision required: true

#### Approval Request

```bash
npm run ariadne -- approval-request --project ariadne --by <operator> --target deployment --action "Enable one reviewed deployment mutation adapter action" --risk high --reason "Permit a bounded estate operation after host auth, rollback, and service verification are proven" --rollback "Document the exact host-level rollback command or service restore path before execution." --evidence <auth-or-policy-evidence>
```

#### Required Evidence

- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- host identity, service state, sudo boundary, and rollback host evidence

#### Mutation Plan

```bash
npm run ariadne -- deployment-mutation-plan --project <project> --system <proxmox|truenas|dgx-spark|mac> --host <host> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
```

#### Dry Run

```bash
Create and audit-pass a target-specific readiness plan first.
```

#### Execution

```bash
Run a passed dry-run for an audit-passed plan first.
```

Rollback: Document the exact host-level rollback command or service restore path before execution.
Post-verification: Verify service state, host health, and affected endpoint behavior after execution.

#### Blockers

- no accepted operator review exists for live-adapter approval packet
- no target-specific readiness plan exists
- no readiness plan passes audit
- no passed dry-run evidence exists for an audit-passed plan
- no passed target-guarded execution evidence exists

#### Next Actions

- pending: Record operator review of the approval packet
- pending: Record an operator approval request
- blocked: Create a target-specific mutation-readiness plan
- pending: Fix readiness audit blockers
- blocked: Run the reviewed dry-run command
- blocked: Capture target-guarded execution evidence

### hermes-cron

Readiness: blocked
Recommended risk: medium
Operator decision required: true

#### Approval Request

```bash
npm run ariadne -- approval-request --project ariadne --by <operator> --target hermes-cron --action "Enable one reviewed Hermes cron mutation adapter action" --risk medium --reason "Permit a bounded scheduler change after auth, next-run behavior, and disable path are proven" --rollback "Document the exact disable or restore command for the scheduler job." --evidence <auth-or-policy-evidence>
```

#### Required Evidence

- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- scheduler auth, existing job snapshot, next-run, and disable-path evidence

#### Mutation Plan

```bash
npm run ariadne -- hermes-cron-mutation-plan --project <project> --action <create|update|enable|disable|delete> --job <id> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
```

#### Dry Run

```bash
Create and audit-pass a target-specific readiness plan first.
```

#### Execution

```bash
Run a passed dry-run for an audit-passed plan first.
```

Rollback: Document the exact disable or restore command for the scheduler job.
Post-verification: Verify job state, schedule, next run, and expected enabled/disabled state after execution.

#### Blockers

- no accepted operator review exists for live-adapter approval packet
- no target-specific readiness plan exists
- no readiness plan passes audit
- no passed dry-run evidence exists for an audit-passed plan
- no passed target-guarded execution evidence exists

#### Next Actions

- pending: Record operator review of the approval packet
- pending: Record an operator approval request
- blocked: Create a target-specific mutation-readiness plan
- pending: Fix readiness audit blockers
- blocked: Run the reviewed dry-run command
- blocked: Capture target-guarded execution evidence

### openscorpion

Readiness: blocked
Recommended risk: medium
Operator decision required: true

#### Approval Request

```bash
npm run ariadne -- approval-request --project ariadne --by <operator> --target openscorpion --action "Enable one reviewed OpenScorpion governed activity action" --risk medium --reason "Permit a bounded governed activity submission after route and non-public payload policy are proven" --rollback "Document the withdraw/update path and governed audit trail for the activity." --evidence <auth-or-policy-evidence>
```

#### Required Evidence

- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- governed route, payload sensitivity, and activity status evidence

#### Mutation Plan

```bash
npm run ariadne -- openscorpion-mutation-plan --project <project> --activity <id> --type <type> --action <submit-activity|update-activity|withdraw-activity> --route <governed|staging> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
```

#### Dry Run

```bash
Create and audit-pass a target-specific readiness plan first.
```

#### Execution

```bash
Run a passed dry-run for an audit-passed plan first.
```

Rollback: Document the withdraw/update path and governed audit trail for the activity.
Post-verification: Verify governed activity status and audit record after execution.

#### Blockers

- no accepted operator review exists for live-adapter approval packet
- no target-specific readiness plan exists
- no readiness plan passes audit
- no passed dry-run evidence exists for an audit-passed plan
- no passed target-guarded execution evidence exists

#### Next Actions

- pending: Record operator review of the approval packet
- pending: Record an operator approval request
- blocked: Create a target-specific mutation-readiness plan
- pending: Fix readiness audit blockers
- blocked: Run the reviewed dry-run command
- blocked: Capture target-guarded execution evidence

### gsd2

Readiness: blocked
Recommended risk: medium
Operator decision required: true

#### Approval Request

```bash
npm run ariadne -- approval-request --project ariadne --by <operator> --target gsd2 --action "Enable one reviewed GSD2 task submission action" --risk medium --reason "Permit a bounded GSD2 task operation after process contract and workspace effects are proven" --rollback "Document generated worktree cleanup and task-state restoration." --evidence <auth-or-policy-evidence>
```

#### Required Evidence

- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- local GSD2 binary/process snapshot and package/task identity evidence

#### Mutation Plan

```bash
npm run ariadne -- gsd2-mutation-plan --project <project> --task <id> --mode <headless|auto|worktree> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
```

#### Dry Run

```bash
Create and audit-pass a target-specific readiness plan first.
```

#### Execution

```bash
Run a passed dry-run for an audit-passed plan first.
```

Rollback: Document generated worktree cleanup and task-state restoration.
Post-verification: Verify task/package state and generated workspace effects after execution.

#### Blockers

- no accepted operator review exists for live-adapter approval packet
- no target-specific readiness plan exists
- no readiness plan passes audit
- no passed dry-run evidence exists for an audit-passed plan
- no passed target-guarded execution evidence exists

#### Next Actions

- pending: Record operator review of the approval packet
- pending: Record an operator approval request
- blocked: Create a target-specific mutation-readiness plan
- pending: Fix readiness audit blockers
- blocked: Run the reviewed dry-run command
- blocked: Capture target-guarded execution evidence

### notebooklm

Readiness: blocked
Recommended risk: medium
Operator decision required: true

#### Approval Request

```bash
npm run ariadne -- approval-request --project ariadne --by <operator> --target notebooklm --action "Enable one reviewed NotebookLM notebook action" --risk medium --reason "Permit a bounded NotebookLM operation after account terms, auth, and export stability are proven" --rollback "Document how to remove generated exports or revert source changes and return to manual import." --evidence <auth-or-policy-evidence>
```

#### Required Evidence

- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- NotebookLM auth, terms, source/export stability, and notebook identity evidence

#### Mutation Plan

```bash
npm run ariadne -- notebooklm-mutation-plan --project <project> --notebook <id> --action <create-source|refresh-source|generate-summary|export-notes> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
```

#### Dry Run

```bash
Create and audit-pass a target-specific readiness plan first.
```

#### Execution

```bash
Run a passed dry-run for an audit-passed plan first.
```

Rollback: Document how to remove generated exports or revert source changes and return to manual import.
Post-verification: Verify notebook/source/export state and saved artifact digest after execution.

#### Blockers

- no accepted operator review exists for live-adapter approval packet
- no target-specific readiness plan exists
- no readiness plan passes audit
- no passed dry-run evidence exists for an audit-passed plan
- no passed target-guarded execution evidence exists

#### Next Actions

- pending: Record operator review of the approval packet
- pending: Record an operator approval request
- blocked: Create a target-specific mutation-readiness plan
- pending: Fix readiness audit blockers
- blocked: Run the reviewed dry-run command
- blocked: Capture target-guarded execution evidence
