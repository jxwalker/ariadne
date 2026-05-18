# Read-Only Operator Evidence Assist: hermes-cron

Project: ariadne
Generated: 2026-05-18T06:33:38.020Z
Target: hermes-cron
Status: needs_evidence
Mutation approved: false
Approval granted: false
Operator evidence record created: false

## Rule

This file is generated from existing Ariadne artifacts. It is not operator evidence. A human operator must verify any fact before recording it in operator-evidence.md.

## Workspace

- Workspace dir: projects/ariadne/control/operator-evidence/hermes-cron
- Evidence file: projects/ariadne/control/operator-evidence/hermes-cron/operator-evidence.md

## Commands

These commands are safe to run during assist review because they only validate the current workspace file.

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target hermes-cron --from vault/projects/ariadne/control/operator-evidence/hermes-cron/operator-evidence.md
```

## Import Command After Human Verification

Run this only after a human operator has filled operator-evidence.md with verified observations and the check command reports complete evidence.

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target hermes-cron --from vault/projects/ariadne/control/operator-evidence/hermes-cron/operator-evidence.md --by <operator>
```

## Existing Ariadne Evidence Refs

- projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-hermes-cron.md
- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-hermes-cron.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace-hermes-cron.json
- projects/ariadne/control/operator-evidence/hermes-cron/operator-evidence.md
- projects/ariadne/control/live-adapter-operator-evidence-audit.json

## Promoted Live Evidence

- none

## Human Verification Worksheet

| Missing section | Human verification prompt | Existing refs | Promoted live evidence | GBrain queries |
| --- | --- | ---: | ---: | ---: |
| Operator identity and timestamp | Human operator must verify hermes-cron Operator identity and timestamp from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Approval packet review | Human operator must verify hermes-cron Approval packet review from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Authentication or authorization boundary | Human operator must verify hermes-cron Authentication or authorization boundary from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Bounded action statement | Human operator must verify hermes-cron Bounded action statement from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Rollback or disable path | Human operator must verify hermes-cron Rollback or disable path from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Post-action verification command | Human operator must verify hermes-cron Post-action verification command from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Dry-run command and safe output | Human operator must verify hermes-cron Dry-run command and safe output from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Target-guarded execution wrapper | Human operator must verify hermes-cron Target-guarded execution wrapper from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Exact confirm-plan proof | Human operator must verify hermes-cron Exact confirm-plan proof from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |

## Support File Refs

- projects/ariadne/control/operator-evidence/hermes-cron/packet-review.md
- projects/ariadne/control/operator-evidence/hermes-cron/auth-boundary.md
- projects/ariadne/control/operator-evidence/hermes-cron/rollback-post-verify.md
- projects/ariadne/control/operator-evidence/hermes-cron/dry-run-review.md
- projects/ariadne/control/operator-evidence/hermes-cron/gbrain-notes.md
- projects/ariadne/control/operator-evidence/hermes-cron/read-only-assist.md

## Missing Sections

- Operator identity and timestamp
- Approval packet review
- Authentication or authorization boundary
- Bounded action statement
- Rollback or disable path
- Post-action verification command
- Dry-run command and safe output
- Target-guarded execution wrapper
- Exact confirm-plan proof

## Required Evidence

- operator identity and review timestamp
- reviewed approval packet path and generation timestamp
- authentication or authorization boundary observed for this target
- bounded action statement and explicit non-goals
- rollback or disable path checked by the operator
- post-action verification command checked by the operator
- dry-run command and expected safe output shape
- target-guarded execution command and expected post-verification output shape
- proof that execution used mutation-execute or a target-specific wrapper with an exact --confirm-plan match
- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- scheduler auth, existing job snapshot, next-run, and disable-path evidence

## Cutover Blockers

- Operator evidence complete: No operator evidence record exists for hermes-cron.; Missing operator evidence section: Operator identity and timestamp; Missing operator evidence section: Approval packet review; Missing operator evidence section: Authentication or authorization boundary; Missing operator evidence section: Bounded action statement; Missing operator evidence section: Rollback or disable path; Missing operator evidence section: Post-action verification command; Missing operator evidence section: Dry-run command and safe output; Missing operator evidence section: Target-guarded execution wrapper; Missing operator evidence section: Exact confirm-plan proof
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

## GBrain Advisory Queries

- Find prior Ariadne decisions and evidence for the hermes-cron live adapter.
- List risks, rollback requirements, and stale assumptions for hermes-cron approval.
- Summarize operator-review evidence still missing before hermes-cron mutation readiness.

## Next Steps

- Open read-only-assist.md and the listed support refs.
- Verify each relevant fact manually before copying it into operator-evidence.md.
- Fill the Operator and Review timestamp fields with real operator values.
- Run the check command, then import only after the check is complete and the operator evidence file contains verified human observations.
