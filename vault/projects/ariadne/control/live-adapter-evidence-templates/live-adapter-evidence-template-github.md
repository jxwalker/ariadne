# Live Adapter Operator Evidence Template: github

Project: ariadne
Generated: 2026-05-17T06:04:26.670Z
Status: awaiting_operator_evidence
Mutation approved: false

## Instructions

- Fill this file with real operator observations before using it as review evidence.
- Leave unknown or unverified items marked as missing.
- Do not treat GBrain responses as approval evidence; cite Ariadne artifacts for gate proof.

## Review Commands

### Packet Review

```bash
npm run ariadne -- live-adapter-approval-review --project <project> --target github --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
```

### Approval Request Draft

```bash
npm run ariadne -- approval-request --project ariadne --by <operator> --target github --action "Enable one reviewed GitHub mutation adapter action" --risk medium --reason "Permit a bounded PR or workflow operation after checks, review, and branch policy are verified" --rollback "Document how to revert or undo the PR/workflow operation and restore manual review flow." --evidence <auth-or-policy-evidence>
```

### Mutation Plan Draft

```bash
npm run ariadne -- github-mutation-plan --project <project> --repo <owner/name> --action <merge-pr|rerun-failed-run> --auth-evidence <paths> --approval <approval-id>
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
- [ ] repository, PR, branch policy, and check-rollup evidence

## Suggested Evidence File Refs

- control/operator-evidence/github-packet-review.md
- control/operator-evidence/github-auth-boundary.md
- control/operator-evidence/github-rollback-post-verify.md
- control/operator-evidence/github-dry-run-review.md

## Current Cutover Blockers

- Operator evidence complete: No operator evidence record exists for github.
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

## GBrain Advisory Queries

- [ ] Find prior Ariadne decisions and evidence for the github live adapter.
- [ ] List risks, rollback requirements, and stale assumptions for github approval.
- [ ] Summarize operator-review evidence still missing before github mutation readiness.

## GBrain Notes

- Query result refs:
- Stale assumptions found:
- Related Ariadne evidence refs:
