# Live Adapter Review Session

Project: ariadne
Target: hermes-cron
Status: operator_review_required
Generated: 2026-05-18T08:16:02.258Z
Mutation approved: false
Operator decision required: true

## Summary

- Targets: 1
- Operator review required: 1
- Ready for adapter work: 0
- Blocked: 0
- Action items: 7
- Current accepted reviews: 0
- Cutover-ready targets: 0
- GBrain reports: 0

## Rule

This session is a review packet. It does not approve mutation and does not authorize external-system changes. GBrain context is advisory memory only; Ariadne artifacts remain the source of truth.

## References

- Next actions: projects/ariadne/control/live-adapter-next-actions.json
- Approval pack: projects/ariadne/control/live-adapter-approval-pack.json
- Approval-review audit: projects/ariadne/control/live-adapter-approval-review-audit.json
- Cutover audit: projects/ariadne/control/live-adapter-cutover-audit-hermes-cron.json
- Mutation repair plan: projects/ariadne/control/mutation-readiness-repair-plan.json
- Operator evidence audit: projects/ariadne/control/live-adapter-operator-evidence-audit.json
- Operator evidence queue: projects/ariadne/control/live-adapter-operator-evidence-queue.json
- Operator evidence assist: projects/ariadne/control/live-adapter-operator-evidence-assist-hermes-cron.json
- Dossiers: projects/ariadne/control/live-adapter-dossiers

## Targets

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

Latest preflight: projects/ariadne/control/live-adapter-operator-evidence-checks/operator-evidence-check-hermes-cron-2026-05-18T08-16-02-133Z.json

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
