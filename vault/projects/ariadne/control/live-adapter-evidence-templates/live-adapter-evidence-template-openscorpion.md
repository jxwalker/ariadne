# Live Adapter Operator Evidence Template: openscorpion

Project: ariadne
Generated: 2026-05-17T04:46:39.080Z
Status: awaiting_operator_evidence
Mutation approved: false

## Instructions

- Fill this file with real operator observations before using it as review evidence.
- Leave unknown or unverified items marked as missing.
- Do not treat GBrain responses as approval evidence; cite Ariadne artifacts for gate proof.

## Review Commands

### Packet Review

```bash
npm run ariadne -- live-adapter-approval-review --project <project> --target openscorpion --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
```

### Approval Request Draft

```bash
npm run ariadne -- approval-request --project ariadne --by <operator> --target openscorpion --action "Enable one reviewed OpenScorpion governed activity action" --risk medium --reason "Permit a bounded governed activity submission after route and non-public payload policy are proven" --rollback "Document the withdraw/update path and governed audit trail for the activity." --evidence <auth-or-policy-evidence>
```

### Mutation Plan Draft

```bash
npm run ariadne -- openscorpion-mutation-plan --project <project> --activity <id> --type <type> --action <submit-activity|update-activity|withdraw-activity> --route <governed|staging> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
```

## Operator Observations

- Operator:
- Review timestamp:
- Packet reviewed:
- Decision for packet completeness:
- Missing evidence:
- Notes:

## Required Evidence To Attach

- [ ] operator identity and review timestamp
- [ ] reviewed approval packet path and generation timestamp
- [ ] authentication or authorization boundary observed for this target
- [ ] bounded action statement and explicit non-goals
- [ ] rollback or disable path checked by the operator
- [ ] post-action verification command checked by the operator
- [ ] dry-run command and expected safe output shape
- [ ] target-guarded execution command and expected post-verification output shape
- [ ] proof that execution used mutation-execute or a target-specific wrapper with an exact --confirm-plan match
- [ ] operator approval request record
- [ ] authentication or authorization evidence
- [ ] bounded scope statement
- [ ] dry-run command output evidence
- [ ] post-action verification command
- [ ] rollback or disable path
- [ ] governed route, payload sensitivity, and activity status evidence

## Suggested Evidence File Refs

- control/operator-evidence/openscorpion-packet-review.md
- control/operator-evidence/openscorpion-auth-boundary.md
- control/operator-evidence/openscorpion-rollback-post-verify.md
- control/operator-evidence/openscorpion-dry-run-review.md

## Current Cutover Blockers

- Operator evidence complete: No operator evidence record exists for openscorpion.
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

## GBrain Advisory Queries

- [ ] Find prior Ariadne decisions and evidence for the openscorpion live adapter.
- [ ] List risks, rollback requirements, and stale assumptions for openscorpion approval.
- [ ] Summarize operator-review evidence still missing before openscorpion mutation readiness.

## GBrain Notes

- Query result refs:
- Stale assumptions found:
- Related Ariadne evidence refs:
