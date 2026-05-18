# Live Adapter Review Session

Project: ariadne
Target: all
Status: operator_review_required
Generated: 2026-05-18T08:09:24.986Z
Mutation approved: false
Operator decision required: true

## Summary

- Targets: 6
- Operator review required: 6
- Ready for adapter work: 0
- Blocked: 0
- Action items: 40
- Current accepted reviews: 0
- Cutover-ready targets: 0
- GBrain reports: 0

## Rule

This session is a review packet. It does not approve mutation and does not authorize external-system changes. GBrain context is advisory memory only; Ariadne artifacts remain the source of truth.

## References

- Next actions: projects/ariadne/control/live-adapter-next-actions.json
- Approval pack: projects/ariadne/control/live-adapter-approval-pack.json
- Approval-review audit: projects/ariadne/control/live-adapter-approval-review-audit.json
- Cutover audit: projects/ariadne/control/live-adapter-cutover-audit.json
- Mutation repair plan: projects/ariadne/control/mutation-readiness-repair-plan.json
- Operator evidence audit: projects/ariadne/control/live-adapter-operator-evidence-audit.json
- Operator evidence queue: projects/ariadne/control/live-adapter-operator-evidence-queue.json
- Operator evidence assist: projects/ariadne/control/live-adapter-operator-evidence-assist.json
- Dossiers: projects/ariadne/control/live-adapter-dossiers

## Targets

### github

Status: operator_review_required
Readiness: blocked
Cutover: blocked
Review audit: missing_review
Operator evidence: needs_evidence
Operator evidence queue: needs_evidence
First action: Prepare, fill, and import operator evidence
Dossier: projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-github.json

#### Operator Evidence Action

Evidence file: projects/ariadne/control/operator-evidence/github/operator-evidence.md

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target github --from vault/projects/ariadne/control/operator-evidence/github/operator-evidence.md
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target github --from vault/projects/ariadne/control/operator-evidence/github/operator-evidence.md --by <operator>
```

Missing operator evidence sections:
- Operator identity and timestamp
- Approval packet review
- Authentication or authorization boundary
- Bounded action statement
- Rollback or disable path
- Post-action verification command
- Dry-run command and safe output
- Target-guarded execution wrapper
- Exact confirm-plan proof

Latest preflight: projects/ariadne/control/live-adapter-operator-evidence-checks/operator-evidence-check-github-2026-05-18T08-09-23-059Z.json

Read-only assist: projects/ariadne/control/operator-evidence/github/read-only-assist.md

Assist next steps:
- Open read-only-assist.md and the listed support refs.
- Verify each relevant fact manually before copying it into operator-evidence.md.
- Fill the Operator and Review timestamp fields with real operator values.
- Run the check command, then import only after the check is complete and the operator evidence file contains verified human observations.

#### Review Command

```bash
npm run ariadne -- live-adapter-approval-review --project <project> --target github --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
```

#### Approval Request Draft

```bash
npm run ariadne -- approval-request --project ariadne --by <operator> --target github --action "Enable one reviewed GitHub mutation adapter action" --risk medium --reason "Permit a bounded PR or workflow operation after checks, review, and branch policy are verified" --rollback "Document how to revert or undo the PR/workflow operation and restore manual review flow." --evidence <auth-or-policy-evidence>
```

#### Mutation Plan Draft

```bash
npm run ariadne -- github-mutation-plan --project <project> --repo <owner/name> --action <merge-pr|rerun-failed-run> --auth-evidence <paths> --approval <approval-id>
```

#### Mutation Repair

Status: operator_action_required

Approval request:

```bash
npm run ariadne -- approval-request --project <project> --by <operator> --target github --action "<bounded action>" --risk <low|medium|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence>
```

Regeneration:

```bash
npm run ariadne -- github-mutation-plan --project <project> --repo <owner/name> --action <merge-pr|rerun-failed-run> --auth-evidence <paths> --approval <approval-id>
```

Next action commands:
- npm run ariadne -- live-adapter-operator-evidence-next --project <project> --target github
- npm run ariadne -- live-adapter-approval-review --project <project> --target github --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
- Review mutation-readiness-github-2026-05-16T16-50-54-241Z; after operator approval, record approval-decision, ensure --post-verify is present, then rerun npm run ariadne -- mutation-readiness-audit --project <project>
- After mutation-readiness-github-2026-05-16T16-50-54-241Z passes audit, run npm run ariadne -- mutation-dry-run --project <project> --plan mutation-readiness-github-2026-05-16T16-50-54-241Z
- Run a passed dry-run for an audit-passed plan first.

#### Required Evidence

- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- repository, PR, branch policy, and check-rollup evidence

#### Blockers

- no accepted operator review exists for live-adapter approval packet
- no readiness plan passes audit
- no passed dry-run evidence exists for an audit-passed plan
- no passed target-guarded execution evidence exists

#### Cutover Blockers

- Operator evidence complete: No operator evidence record exists for github.; Missing operator evidence section: Operator identity and timestamp; Missing operator evidence section: Approval packet review; Missing operator evidence section: Authentication or authorization boundary; Missing operator evidence section: Bounded action statement; Missing operator evidence section: Rollback or disable path; Missing operator evidence section: Post-action verification command; Missing operator evidence section: Dry-run command and safe output; Missing operator evidence section: Target-guarded execution wrapper; Missing operator evidence section: Exact confirm-plan proof
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

#### GBrain Advisory Queries

Export: projects/ariadne/integrations/gbrain/gbrain-export.json
Reports:
- none
Queries:
- Find prior Ariadne decisions and evidence for the github live adapter.
- List risks, rollback requirements, and stale assumptions for github approval.
- Summarize operator-review evidence still missing before github mutation readiness.

#### Evidence

- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-github.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace-github.json
- projects/ariadne/control/operator-evidence/github/operator-evidence.md

### deployment

Status: operator_review_required
Readiness: blocked
Cutover: blocked
Review audit: missing_review
Operator evidence: needs_evidence
Operator evidence queue: needs_evidence
First action: Prepare, fill, and import operator evidence
Dossier: projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-deployment.json

#### Operator Evidence Action

Evidence file: projects/ariadne/control/operator-evidence/deployment/operator-evidence.md

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target deployment --from vault/projects/ariadne/control/operator-evidence/deployment/operator-evidence.md
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target deployment --from vault/projects/ariadne/control/operator-evidence/deployment/operator-evidence.md --by <operator>
```

Missing operator evidence sections:
- Operator identity and timestamp
- Approval packet review
- Authentication or authorization boundary
- Bounded action statement
- Rollback or disable path
- Post-action verification command
- Dry-run command and safe output
- Target-guarded execution wrapper
- Exact confirm-plan proof

Latest preflight: projects/ariadne/control/live-adapter-operator-evidence-checks/operator-evidence-check-deployment-2026-05-18T08-09-22-087Z.json

Read-only assist: projects/ariadne/control/operator-evidence/deployment/read-only-assist.md

Assist next steps:
- Open read-only-assist.md and the listed support refs.
- Verify each relevant fact manually before copying it into operator-evidence.md.
- Fill the Operator and Review timestamp fields with real operator values.
- Run the check command, then import only after the check is complete and the operator evidence file contains verified human observations.

#### Review Command

```bash
npm run ariadne -- live-adapter-approval-review --project <project> --target deployment --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
```

#### Approval Request Draft

```bash
npm run ariadne -- approval-request --project ariadne --by <operator> --target deployment --action "Enable one reviewed deployment mutation adapter action" --risk high --reason "Permit a bounded estate operation after host auth, rollback, and service verification are proven" --rollback "Document the exact host-level rollback command or service restore path before execution." --evidence <auth-or-policy-evidence>
```

#### Mutation Plan Draft

```bash
npm run ariadne -- deployment-mutation-plan --project <project> --system <proxmox|truenas|dgx-spark|mac> --host <host> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
```

#### Mutation Repair

Status: missing_plan

Approval request:

```bash
npm run ariadne -- approval-request --project <project> --by <operator> --target deployment --action "<bounded action>" --risk <low|medium|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence>
```

Regeneration:

```bash
npm run ariadne -- deployment-mutation-plan --project <project> --system <proxmox|truenas|dgx-spark|mac> --host <host> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
```

Next action commands:
- npm run ariadne -- live-adapter-operator-evidence-next --project <project> --target deployment
- npm run ariadne -- live-adapter-approval-review --project <project> --target deployment --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
- npm run ariadne -- approval-request --project <project> --by <operator> --target deployment --action "<bounded action>" --risk <low|medium|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence>
- npm run ariadne -- deployment-mutation-plan --project <project> --system <proxmox|truenas|dgx-spark|mac> --host <host> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
- npm run ariadne -- mutation-readiness-audit --project <project>
- Create and audit-pass a target-specific readiness plan first.
- Run a passed dry-run for an audit-passed plan first.

#### Required Evidence

- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- host identity, service state, sudo boundary, and rollback host evidence

#### Blockers

- no accepted operator review exists for live-adapter approval packet
- no target-specific readiness plan exists
- no readiness plan passes audit
- no passed dry-run evidence exists for an audit-passed plan
- no passed target-guarded execution evidence exists

#### Cutover Blockers

- Operator evidence complete: No operator evidence record exists for deployment.; Missing operator evidence section: Operator identity and timestamp; Missing operator evidence section: Approval packet review; Missing operator evidence section: Authentication or authorization boundary; Missing operator evidence section: Bounded action statement; Missing operator evidence section: Rollback or disable path; Missing operator evidence section: Post-action verification command; Missing operator evidence section: Dry-run command and safe output; Missing operator evidence section: Target-guarded execution wrapper; Missing operator evidence section: Exact confirm-plan proof
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

#### GBrain Advisory Queries

Export: projects/ariadne/integrations/gbrain/gbrain-export.json
Reports:
- none
Queries:
- Find prior Ariadne decisions and evidence for the deployment live adapter.
- List risks, rollback requirements, and stale assumptions for deployment approval.
- Summarize operator-review evidence still missing before deployment mutation readiness.

#### Evidence

- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-deployment.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace-deployment.json
- projects/ariadne/control/operator-evidence/deployment/operator-evidence.md

### hermes-cron

Status: operator_review_required
Readiness: blocked
Cutover: blocked
Review audit: missing_review
Operator evidence: needs_evidence
Operator evidence queue: needs_evidence
First action: Prepare, fill, and import operator evidence
Dossier: projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-hermes-cron.json

#### Operator Evidence Action

Evidence file: projects/ariadne/control/operator-evidence/hermes-cron/operator-evidence.md

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target hermes-cron --from vault/projects/ariadne/control/operator-evidence/hermes-cron/operator-evidence.md
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target hermes-cron --from vault/projects/ariadne/control/operator-evidence/hermes-cron/operator-evidence.md --by <operator>
```

Missing operator evidence sections:
- Operator identity and timestamp
- Approval packet review
- Authentication or authorization boundary
- Bounded action statement
- Rollback or disable path
- Post-action verification command
- Dry-run command and safe output
- Target-guarded execution wrapper
- Exact confirm-plan proof

Latest preflight: projects/ariadne/control/live-adapter-operator-evidence-checks/operator-evidence-check-hermes-cron-2026-05-18T08-09-23-505Z.json

Read-only assist: projects/ariadne/control/operator-evidence/hermes-cron/read-only-assist.md

Assist next steps:
- Open read-only-assist.md and the listed support refs.
- Verify each relevant fact manually before copying it into operator-evidence.md.
- Fill the Operator and Review timestamp fields with real operator values.
- Run the check command, then import only after the check is complete and the operator evidence file contains verified human observations.

#### Review Command

```bash
npm run ariadne -- live-adapter-approval-review --project <project> --target hermes-cron --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
```

#### Approval Request Draft

```bash
npm run ariadne -- approval-request --project ariadne --by <operator> --target hermes-cron --action "Enable one reviewed Hermes cron mutation adapter action" --risk medium --reason "Permit a bounded scheduler change after auth, next-run behavior, and disable path are proven" --rollback "Document the exact disable or restore command for the scheduler job." --evidence <auth-or-policy-evidence>
```

#### Mutation Plan Draft

```bash
npm run ariadne -- hermes-cron-mutation-plan --project <project> --action <create|update|enable|disable|delete> --job <id> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
```

#### Mutation Repair

Status: missing_plan

Approval request:

```bash
npm run ariadne -- approval-request --project <project> --by <operator> --target hermes-cron --action "<bounded action>" --risk <low|medium|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence>
```

Regeneration:

```bash
npm run ariadne -- hermes-cron-mutation-plan --project <project> --action <create|update|enable|disable|delete> --job <id> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
```

Next action commands:
- npm run ariadne -- live-adapter-operator-evidence-next --project <project> --target hermes-cron
- npm run ariadne -- live-adapter-approval-review --project <project> --target hermes-cron --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
- npm run ariadne -- approval-request --project <project> --by <operator> --target hermes-cron --action "<bounded action>" --risk <low|medium|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence>
- npm run ariadne -- hermes-cron-mutation-plan --project <project> --action <create|update|enable|disable|delete> --job <id> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
- npm run ariadne -- mutation-readiness-audit --project <project>
- Create and audit-pass a target-specific readiness plan first.
- Run a passed dry-run for an audit-passed plan first.

#### Required Evidence

- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- scheduler auth, existing job snapshot, next-run, and disable-path evidence

#### Blockers

- no accepted operator review exists for live-adapter approval packet
- no target-specific readiness plan exists
- no readiness plan passes audit
- no passed dry-run evidence exists for an audit-passed plan
- no passed target-guarded execution evidence exists

#### Cutover Blockers

- Operator evidence complete: No operator evidence record exists for hermes-cron.; Missing operator evidence section: Operator identity and timestamp; Missing operator evidence section: Approval packet review; Missing operator evidence section: Authentication or authorization boundary; Missing operator evidence section: Bounded action statement; Missing operator evidence section: Rollback or disable path; Missing operator evidence section: Post-action verification command; Missing operator evidence section: Dry-run command and safe output; Missing operator evidence section: Target-guarded execution wrapper; Missing operator evidence section: Exact confirm-plan proof
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

#### GBrain Advisory Queries

Export: projects/ariadne/integrations/gbrain/gbrain-export.json
Reports:
- none
Queries:
- Find prior Ariadne decisions and evidence for the hermes-cron live adapter.
- List risks, rollback requirements, and stale assumptions for hermes-cron approval.
- Summarize operator-review evidence still missing before hermes-cron mutation readiness.

#### Evidence

- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-hermes-cron.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace-hermes-cron.json
- projects/ariadne/control/operator-evidence/hermes-cron/operator-evidence.md

### openscorpion

Status: operator_review_required
Readiness: blocked
Cutover: blocked
Review audit: missing_review
Operator evidence: needs_evidence
Operator evidence queue: needs_evidence
First action: Prepare, fill, and import operator evidence
Dossier: projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-openscorpion.json

#### Operator Evidence Action

Evidence file: projects/ariadne/control/operator-evidence/openscorpion/operator-evidence.md

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target openscorpion --from vault/projects/ariadne/control/operator-evidence/openscorpion/operator-evidence.md
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target openscorpion --from vault/projects/ariadne/control/operator-evidence/openscorpion/operator-evidence.md --by <operator>
```

Missing operator evidence sections:
- Operator identity and timestamp
- Approval packet review
- Authentication or authorization boundary
- Bounded action statement
- Rollback or disable path
- Post-action verification command
- Dry-run command and safe output
- Target-guarded execution wrapper
- Exact confirm-plan proof

Latest preflight: projects/ariadne/control/live-adapter-operator-evidence-checks/operator-evidence-check-openscorpion-2026-05-18T08-09-23-949Z.json

Read-only assist: projects/ariadne/control/operator-evidence/openscorpion/read-only-assist.md

Assist next steps:
- Open read-only-assist.md and the listed support refs.
- Verify each relevant fact manually before copying it into operator-evidence.md.
- Fill the Operator and Review timestamp fields with real operator values.
- Run the check command, then import only after the check is complete and the operator evidence file contains verified human observations.

#### Review Command

```bash
npm run ariadne -- live-adapter-approval-review --project <project> --target openscorpion --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
```

#### Approval Request Draft

```bash
npm run ariadne -- approval-request --project ariadne --by <operator> --target openscorpion --action "Enable one reviewed OpenScorpion governed activity action" --risk medium --reason "Permit a bounded governed activity submission after route and non-public payload policy are proven" --rollback "Document the withdraw/update path and governed audit trail for the activity." --evidence <auth-or-policy-evidence>
```

#### Mutation Plan Draft

```bash
npm run ariadne -- openscorpion-mutation-plan --project <project> --activity <id> --type <type> --action <submit-activity|update-activity|withdraw-activity> --route <governed|staging> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
```

#### Mutation Repair

Status: missing_plan

Approval request:

```bash
npm run ariadne -- approval-request --project <project> --by <operator> --target openscorpion --action "<bounded action>" --risk <low|medium|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence>
```

Regeneration:

```bash
npm run ariadne -- openscorpion-mutation-plan --project <project> --activity <id> --type <type> --action <submit-activity|update-activity|withdraw-activity> --route <governed|staging> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
```

Next action commands:
- npm run ariadne -- live-adapter-operator-evidence-next --project <project> --target openscorpion
- npm run ariadne -- live-adapter-approval-review --project <project> --target openscorpion --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
- npm run ariadne -- approval-request --project <project> --by <operator> --target openscorpion --action "<bounded action>" --risk <low|medium|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence>
- npm run ariadne -- openscorpion-mutation-plan --project <project> --activity <id> --type <type> --action <submit-activity|update-activity|withdraw-activity> --route <governed|staging> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
- npm run ariadne -- mutation-readiness-audit --project <project>
- Create and audit-pass a target-specific readiness plan first.
- Run a passed dry-run for an audit-passed plan first.

#### Required Evidence

- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- governed route, payload sensitivity, and activity status evidence

#### Blockers

- no accepted operator review exists for live-adapter approval packet
- no target-specific readiness plan exists
- no readiness plan passes audit
- no passed dry-run evidence exists for an audit-passed plan
- no passed target-guarded execution evidence exists

#### Cutover Blockers

- Operator evidence complete: No operator evidence record exists for openscorpion.; Missing operator evidence section: Operator identity and timestamp; Missing operator evidence section: Approval packet review; Missing operator evidence section: Authentication or authorization boundary; Missing operator evidence section: Bounded action statement; Missing operator evidence section: Rollback or disable path; Missing operator evidence section: Post-action verification command; Missing operator evidence section: Dry-run command and safe output; Missing operator evidence section: Target-guarded execution wrapper; Missing operator evidence section: Exact confirm-plan proof
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

#### GBrain Advisory Queries

Export: projects/ariadne/integrations/gbrain/gbrain-export.json
Reports:
- none
Queries:
- Find prior Ariadne decisions and evidence for the openscorpion live adapter.
- List risks, rollback requirements, and stale assumptions for openscorpion approval.
- Summarize operator-review evidence still missing before openscorpion mutation readiness.

#### Evidence

- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-openscorpion.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace-openscorpion.json
- projects/ariadne/control/operator-evidence/openscorpion/operator-evidence.md

### gsd2

Status: operator_review_required
Readiness: blocked
Cutover: blocked
Review audit: missing_review
Operator evidence: needs_evidence
Operator evidence queue: needs_evidence
First action: Prepare, fill, and import operator evidence
Dossier: projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-gsd2.json

#### Operator Evidence Action

Evidence file: projects/ariadne/control/operator-evidence/gsd2/operator-evidence.md

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target gsd2 --from vault/projects/ariadne/control/operator-evidence/gsd2/operator-evidence.md
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target gsd2 --from vault/projects/ariadne/control/operator-evidence/gsd2/operator-evidence.md --by <operator>
```

Missing operator evidence sections:
- Operator identity and timestamp
- Approval packet review
- Authentication or authorization boundary
- Bounded action statement
- Rollback or disable path
- Post-action verification command
- Dry-run command and safe output
- Target-guarded execution wrapper
- Exact confirm-plan proof

Latest preflight: projects/ariadne/control/live-adapter-operator-evidence-checks/operator-evidence-check-gsd2-2026-05-18T08-09-24-383Z.json

Read-only assist: projects/ariadne/control/operator-evidence/gsd2/read-only-assist.md

Assist next steps:
- Open read-only-assist.md and the listed support refs.
- Verify each relevant fact manually before copying it into operator-evidence.md.
- Fill the Operator and Review timestamp fields with real operator values.
- Run the check command, then import only after the check is complete and the operator evidence file contains verified human observations.

#### Review Command

```bash
npm run ariadne -- live-adapter-approval-review --project <project> --target gsd2 --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
```

#### Approval Request Draft

```bash
npm run ariadne -- approval-request --project ariadne --by <operator> --target gsd2 --action "Enable one reviewed GSD2 task submission action" --risk medium --reason "Permit a bounded GSD2 task operation after process contract and workspace effects are proven" --rollback "Document generated worktree cleanup and task-state restoration." --evidence <auth-or-policy-evidence>
```

#### Mutation Plan Draft

```bash
npm run ariadne -- gsd2-mutation-plan --project <project> --task <id> --mode <headless|auto|worktree> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
```

#### Mutation Repair

Status: missing_plan

Approval request:

```bash
npm run ariadne -- approval-request --project <project> --by <operator> --target gsd2 --action "<bounded action>" --risk <low|medium|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence>
```

Regeneration:

```bash
npm run ariadne -- gsd2-mutation-plan --project <project> --task <id> --mode <headless|auto|worktree> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
```

Next action commands:
- npm run ariadne -- live-adapter-operator-evidence-next --project <project> --target gsd2
- npm run ariadne -- live-adapter-approval-review --project <project> --target gsd2 --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
- npm run ariadne -- approval-request --project <project> --by <operator> --target gsd2 --action "<bounded action>" --risk <low|medium|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence>
- npm run ariadne -- gsd2-mutation-plan --project <project> --task <id> --mode <headless|auto|worktree> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
- npm run ariadne -- mutation-readiness-audit --project <project>
- Create and audit-pass a target-specific readiness plan first.
- Run a passed dry-run for an audit-passed plan first.

#### Required Evidence

- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- local GSD2 binary/process snapshot and package/task identity evidence

#### Blockers

- no accepted operator review exists for live-adapter approval packet
- no target-specific readiness plan exists
- no readiness plan passes audit
- no passed dry-run evidence exists for an audit-passed plan
- no passed target-guarded execution evidence exists

#### Cutover Blockers

- Operator evidence complete: No operator evidence record exists for gsd2.; Missing operator evidence section: Operator identity and timestamp; Missing operator evidence section: Approval packet review; Missing operator evidence section: Authentication or authorization boundary; Missing operator evidence section: Bounded action statement; Missing operator evidence section: Rollback or disable path; Missing operator evidence section: Post-action verification command; Missing operator evidence section: Dry-run command and safe output; Missing operator evidence section: Target-guarded execution wrapper; Missing operator evidence section: Exact confirm-plan proof
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

#### GBrain Advisory Queries

Export: projects/ariadne/integrations/gbrain/gbrain-export.json
Reports:
- none
Queries:
- Find prior Ariadne decisions and evidence for the gsd2 live adapter.
- List risks, rollback requirements, and stale assumptions for gsd2 approval.
- Summarize operator-review evidence still missing before gsd2 mutation readiness.

#### Evidence

- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-gsd2.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace-gsd2.json
- projects/ariadne/control/operator-evidence/gsd2/operator-evidence.md

### notebooklm

Status: operator_review_required
Readiness: blocked
Cutover: blocked
Review audit: missing_review
Operator evidence: needs_evidence
Operator evidence queue: needs_evidence
First action: Prepare, fill, and import operator evidence
Dossier: projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-notebooklm.json

#### Operator Evidence Action

Evidence file: projects/ariadne/control/operator-evidence/notebooklm/operator-evidence.md

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target notebooklm --from vault/projects/ariadne/control/operator-evidence/notebooklm/operator-evidence.md
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target notebooklm --from vault/projects/ariadne/control/operator-evidence/notebooklm/operator-evidence.md --by <operator>
```

Missing operator evidence sections:
- Operator identity and timestamp
- Approval packet review
- Authentication or authorization boundary
- Bounded action statement
- Rollback or disable path
- Post-action verification command
- Dry-run command and safe output
- Target-guarded execution wrapper
- Exact confirm-plan proof

Latest preflight: projects/ariadne/control/live-adapter-operator-evidence-checks/operator-evidence-check-notebooklm-2026-05-18T08-09-24-813Z.json

Read-only assist: projects/ariadne/control/operator-evidence/notebooklm/read-only-assist.md

Assist next steps:
- Open read-only-assist.md and the listed support refs.
- Verify each relevant fact manually before copying it into operator-evidence.md.
- Fill the Operator and Review timestamp fields with real operator values.
- Run the check command, then import only after the check is complete and the operator evidence file contains verified human observations.

#### Review Command

```bash
npm run ariadne -- live-adapter-approval-review --project <project> --target notebooklm --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
```

#### Approval Request Draft

```bash
npm run ariadne -- approval-request --project ariadne --by <operator> --target notebooklm --action "Enable one reviewed NotebookLM notebook action" --risk medium --reason "Permit a bounded NotebookLM operation after account terms, auth, and export stability are proven" --rollback "Document how to remove generated exports or revert source changes and return to manual import." --evidence <auth-or-policy-evidence>
```

#### Mutation Plan Draft

```bash
npm run ariadne -- notebooklm-mutation-plan --project <project> --notebook <id> --action <create-source|refresh-source|generate-summary|export-notes> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
```

#### Mutation Repair

Status: missing_plan

Approval request:

```bash
npm run ariadne -- approval-request --project <project> --by <operator> --target notebooklm --action "<bounded action>" --risk <low|medium|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence>
```

Regeneration:

```bash
npm run ariadne -- notebooklm-mutation-plan --project <project> --notebook <id> --action <create-source|refresh-source|generate-summary|export-notes> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
```

Next action commands:
- npm run ariadne -- live-adapter-operator-evidence-next --project <project> --target notebooklm
- npm run ariadne -- live-adapter-approval-review --project <project> --target notebooklm --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
- npm run ariadne -- approval-request --project <project> --by <operator> --target notebooklm --action "<bounded action>" --risk <low|medium|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence>
- npm run ariadne -- notebooklm-mutation-plan --project <project> --notebook <id> --action <create-source|refresh-source|generate-summary|export-notes> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
- npm run ariadne -- mutation-readiness-audit --project <project>
- Create and audit-pass a target-specific readiness plan first.
- Run a passed dry-run for an audit-passed plan first.

#### Required Evidence

- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- NotebookLM auth, terms, source/export stability, and notebook identity evidence

#### Blockers

- no accepted operator review exists for live-adapter approval packet
- no target-specific readiness plan exists
- no readiness plan passes audit
- no passed dry-run evidence exists for an audit-passed plan
- no passed target-guarded execution evidence exists

#### Cutover Blockers

- Operator evidence complete: No operator evidence record exists for notebooklm.; Missing operator evidence section: Operator identity and timestamp; Missing operator evidence section: Approval packet review; Missing operator evidence section: Authentication or authorization boundary; Missing operator evidence section: Bounded action statement; Missing operator evidence section: Rollback or disable path; Missing operator evidence section: Post-action verification command; Missing operator evidence section: Dry-run command and safe output; Missing operator evidence section: Target-guarded execution wrapper; Missing operator evidence section: Exact confirm-plan proof
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

#### GBrain Advisory Queries

Export: projects/ariadne/integrations/gbrain/gbrain-export.json
Reports:
- none
Queries:
- Find prior Ariadne decisions and evidence for the notebooklm live adapter.
- List risks, rollback requirements, and stale assumptions for notebooklm approval.
- Summarize operator-review evidence still missing before notebooklm mutation readiness.

#### Evidence

- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-notebooklm.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace-notebooklm.json
- projects/ariadne/control/operator-evidence/notebooklm/operator-evidence.md
