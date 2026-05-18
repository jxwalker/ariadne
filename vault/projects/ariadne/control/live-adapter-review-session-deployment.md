# Live Adapter Review Session

Project: ariadne
Target: deployment
Status: operator_review_required
Generated: 2026-05-18T15:10:34.885Z
Mutation approved: false
Operator decision required: true

## Summary

- Targets: 1
- Operator review required: 0
- Ready for adapter work: 0
- Blocked: 1
- Action items: 3
- Current accepted reviews: 1
- Cutover-ready targets: 0
- GBrain reports: 0

## Rule

This session is a review packet. It does not approve mutation and does not authorize external-system changes. GBrain context is advisory memory only; Ariadne artifacts remain the source of truth.

## References

- Next actions: projects/ariadne/control/live-adapter-next-actions.json
- Approval pack: projects/ariadne/control/live-adapter-approval-pack.json
- Approval-review audit: projects/ariadne/control/live-adapter-approval-review-audit.json
- Cutover audit: projects/ariadne/control/live-adapter-cutover-audit-deployment.json
- Mutation repair plan: projects/ariadne/control/mutation-readiness-repair-plan.json
- Operator evidence audit: projects/ariadne/control/live-adapter-operator-evidence-audit.json
- Operator evidence queue: projects/ariadne/control/live-adapter-operator-evidence-queue.json
- Operator evidence assist: projects/ariadne/control/live-adapter-operator-evidence-assist-deployment.json
- Dossiers: projects/ariadne/control/live-adapter-dossiers

## Targets

### deployment

Status: blocked
Readiness: blocked
Cutover: blocked
Review audit: current_accepted
Operator evidence: complete
Operator evidence queue: complete
First action: Resolve existing readiness plan blockers
Dossier: projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-deployment.json

#### Operator Evidence Action

Evidence file: projects/ariadne/control/operator-evidence/deployment/operator-evidence.md

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target deployment --from vault/projects/ariadne/control/operator-evidence/deployment/operator-evidence.md
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target deployment --from vault/projects/ariadne/control/operator-evidence/deployment/operator-evidence.md --by <operator>
```

Missing operator evidence sections:
- none

Latest preflight: projects/ariadne/control/live-adapter-operator-evidence-checks/operator-evidence-check-deployment-2026-05-18T15-10-34-678Z.json

Read-only assist: projects/ariadne/control/operator-evidence/deployment/read-only-assist.md

Assist next steps:
- No assist action is needed unless the operator wants to refresh the evidence packet.

#### Review Command

```bash
npm run ariadne -- live-adapter-approval-review --project ariadne --target deployment --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
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

Status: operator_action_required

Approval request:

```bash
npm run ariadne -- approval-request --project <project> --by <operator> --target deployment --action "<bounded action>" --risk <low|medium|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence>
```

Regeneration:

```bash
npm run ariadne -- deployment-mutation-plan --project <project> --system <proxmox|truenas|dgx-spark|mac> --host <host> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
```

Next action commands:
- Review mutation-readiness-deployment-2026-05-18T14-54-52-671Z; after operator approval, record approval-decision, ensure --post-verify is present, then rerun npm run ariadne -- mutation-readiness-audit --project <project>
- After mutation-readiness-deployment-2026-05-18T14-54-52-671Z passes audit, run npm run ariadne -- mutation-dry-run --project <project> --plan mutation-readiness-deployment-2026-05-18T14-54-52-671Z
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

- no readiness plan passes audit
- no passed dry-run evidence exists for an audit-passed plan
- no passed target-guarded execution evidence exists

#### Cutover Blockers

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
- projects/ariadne/control/live-adapter-approval-reviews/approval-review-deployment-2026-05-18T14-57-00-710Z.json
- projects/ariadne/control/operator-evidence/deployment/operator-evidence.md
