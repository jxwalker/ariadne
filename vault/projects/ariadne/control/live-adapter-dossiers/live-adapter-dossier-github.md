# Live Adapter Target Dossier: github

Project: ariadne
Status: ready_for_operator_review
Generated: 2026-05-17T06:55:42.783Z

## Summary

- Blockers: 4
- Review audit blockers: 1
- Actions: 5
- Approval packet present: true
- Review audit status: missing_review
- Mutation plans: 0/1 ready
- GBrain reports: 0

## Operator Checklist

- Read the target approval packet.
- Check authentication or authorization evidence for the exact target account, host, or service.
- Check rollback and post-verification commands are concrete enough to execute later.
- Check dry-run and target-guarded execution steps remain non-placeholder and bounded.
- Query GBrain for prior decisions, stale assumptions, and related evidence before accepting the packet.
- Record an approval-packet review only after the packet and evidence are complete.

## Next Actions

- pending: Fill and import operator evidence - npm run ariadne -- live-adapter-operator-evidence --project <project> --target github --from vault/projects/<project>/control/live-adapter-evidence-templates/live-adapter-evidence-template-github.md --by <operator>
- pending: Record operator review of the approval packet - npm run ariadne -- live-adapter-approval-review --project <project> --target github --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
- pending: Resolve existing readiness plan blockers - Review mutation-readiness-github-2026-05-16T16-50-54-241Z; after operator approval, record approval-decision, ensure --post-verify is present, then rerun npm run ariadne -- mutation-readiness-audit --project <project>
- pending: Run the reviewed dry-run command - After mutation-readiness-github-2026-05-16T16-50-54-241Z passes audit, run npm run ariadne -- mutation-dry-run --project <project> --plan mutation-readiness-github-2026-05-16T16-50-54-241Z
- blocked: Capture target-guarded execution evidence - Run a passed dry-run for an audit-passed plan first.

## Readiness Blockers

- no accepted operator review exists for live-adapter approval packet
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
- Find prior Ariadne decisions and evidence for the github live adapter.
- List risks, rollback requirements, and stale assumptions for github approval.
- Summarize operator-review evidence still missing before github mutation readiness.

## Evidence

- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-evidence-templates.json
- projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-github.md
