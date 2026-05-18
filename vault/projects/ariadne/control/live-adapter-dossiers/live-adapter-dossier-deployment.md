# Live Adapter Target Dossier: deployment

Project: ariadne
Status: ready_for_operator_review
Generated: 2026-05-18T04:58:56.278Z

## Summary

- Blockers: 5
- Review audit blockers: 1
- Actions: 7
- Approval packet present: true
- Review audit status: missing_review
- Mutation plans: 0/0 ready
- GBrain reports: 0

## Operator Checklist

- Read the target approval packet.
- Check authentication or authorization evidence for the exact target account, host, or service.
- Check rollback and post-verification commands are concrete enough to execute later.
- Check dry-run and target-guarded execution steps remain non-placeholder and bounded.
- Query GBrain for prior decisions, stale assumptions, and related evidence before accepting the packet.
- Record an approval-packet review only after the packet and evidence are complete.

## Next Actions

- pending: Prepare, fill, and import operator evidence - npm run ariadne -- live-adapter-operator-evidence-next --project <project> --target deployment
- pending: Record operator review of the approval packet - npm run ariadne -- live-adapter-approval-review --project <project> --target deployment --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
- pending: Record an operator approval request - npm run ariadne -- approval-request --project <project> --by <operator> --target deployment --action "<bounded action>" --risk <low|medium|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence>
- blocked: Create a target-specific mutation-readiness plan - npm run ariadne -- deployment-mutation-plan --project <project> --system <proxmox|truenas|dgx-spark|mac> --host <host> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
- pending: Fix readiness audit blockers - npm run ariadne -- mutation-readiness-audit --project <project>
- blocked: Run the reviewed dry-run command - Create and audit-pass a target-specific readiness plan first.
- blocked: Capture target-guarded execution evidence - Run a passed dry-run for an audit-passed plan first.

## Readiness Blockers

- no accepted operator review exists for live-adapter approval packet
- no target-specific readiness plan exists
- no readiness plan passes audit
- no passed dry-run evidence exists for an audit-passed plan
- no passed target-guarded execution evidence exists

## Approval Review Audit

Status: missing_review
- no accepted operator review exists

## GBrain Context

Export: projects/ariadne/integrations/gbrain/gbrain-export.json
Reports:
- none
Suggested queries:
- Find prior Ariadne decisions and evidence for the deployment live adapter.
- List risks, rollback requirements, and stale assumptions for deployment approval.
- Summarize operator-review evidence still missing before deployment mutation readiness.

## Evidence

- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace.json
- projects/ariadne/control/operator-evidence/deployment/operator-evidence.md
