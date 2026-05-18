# Live Adapter Target Dossier: deployment

Project: ariadne
Status: ready_for_operator_review
Generated: 2026-05-18T15:10:37.341Z

## Summary

- Blockers: 3
- Review audit blockers: 0
- Actions: 3
- Approval packet present: true
- Review audit status: current_accepted
- Mutation plans: 0/1 ready
- GBrain reports: 0

## Operator Checklist

- Read the target approval packet.
- Check authentication or authorization evidence for the exact target account, host, or service.
- Check rollback and post-verification commands are concrete enough to execute later.
- Check dry-run and target-guarded execution steps remain non-placeholder and bounded.
- Query GBrain for prior decisions, stale assumptions, and related evidence before accepting the packet.
- Do not record another packet review unless the packet or evidence changes.

## Next Actions

- pending: Resolve existing readiness plan blockers - Review mutation-readiness-deployment-2026-05-18T14-54-52-671Z; after operator approval, record approval-decision, ensure --post-verify is present, then rerun npm run ariadne -- mutation-readiness-audit --project <project>
- pending: Run the reviewed dry-run command - After mutation-readiness-deployment-2026-05-18T14-54-52-671Z passes audit, run npm run ariadne -- mutation-dry-run --project <project> --plan mutation-readiness-deployment-2026-05-18T14-54-52-671Z
- blocked: Capture target-guarded execution evidence - Run a passed dry-run for an audit-passed plan first.

## Readiness Blockers

- no readiness plan passes audit
- no passed dry-run evidence exists for an audit-passed plan
- no passed target-guarded execution evidence exists

## Approval Review Audit

Status: current_accepted
- none

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
- projects/ariadne/control/live-adapter-approval-reviews/approval-review-deployment-2026-05-18T14-57-00-710Z.json
- projects/ariadne/control/operator-evidence/deployment/operator-evidence.md
