# Live Adapter Operator Evidence Template: deployment

Project: ariadne
Generated: 2026-05-18T05:22:24.471Z
Status: awaiting_operator_evidence
Mutation approved: false

## Instructions

- Fill this file with real operator observations before using it as review evidence.
- Leave unknown or unverified items marked as missing.
- Do not treat GBrain responses as approval evidence; cite Ariadne artifacts for gate proof.

## Review Commands

### Packet Review

```bash
npm run ariadne -- live-adapter-approval-review --project <project> --target deployment --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
```

### Approval Request Draft

```bash
npm run ariadne -- approval-request --project ariadne --by <operator> --target deployment --action "Enable one reviewed deployment mutation adapter action" --risk high --reason "Permit a bounded estate operation after host auth, rollback, and service verification are proven" --rollback "Document the exact host-level rollback command or service restore path before execution." --evidence <auth-or-policy-evidence>
```

### Mutation Plan Draft

```bash
npm run ariadne -- deployment-mutation-plan --project <project> --system <proxmox|truenas|dgx-spark|mac> --host <host> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id>
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
- [ ] host identity, service state, sudo boundary, and rollback host evidence

## Suggested Evidence File Refs

- control/operator-evidence/deployment-packet-review.md
- control/operator-evidence/deployment-auth-boundary.md
- control/operator-evidence/deployment-rollback-post-verify.md
- control/operator-evidence/deployment-dry-run-review.md

## Current Cutover Blockers

- Operator evidence complete: No operator evidence record exists for deployment.
  - Missing: Operator identity and timestamp
  - Missing: Approval packet review
  - Missing: Authentication or authorization boundary
  - Missing: Bounded action statement
  - Missing: Rollback or disable path
  - Missing: Post-action verification command
  - Missing: Dry-run command and safe output
  - Missing: Target-guarded execution wrapper
  - Missing: Exact confirm-plan proof
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

## GBrain Advisory Queries

- [ ] Find prior Ariadne decisions and evidence for the deployment live adapter.
- [ ] List risks, rollback requirements, and stale assumptions for deployment approval.
- [ ] Summarize operator-review evidence still missing before deployment mutation readiness.

## GBrain Notes

- Query result refs:
- Stale assumptions found:
- Related Ariadne evidence refs:
