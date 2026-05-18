# Read-Only Operator Evidence Assist: github

Project: ariadne
Generated: 2026-05-18T08:16:01.571Z
Target: github
Status: needs_evidence
Mutation approved: false
Approval granted: false
Operator evidence record created: false

## Rule

This file is generated from existing Ariadne artifacts. It is not operator evidence. A human operator must verify any fact before recording it in operator-evidence.md.

## Workspace

- Workspace dir: projects/ariadne/control/operator-evidence/github
- Evidence file: projects/ariadne/control/operator-evidence/github/operator-evidence.md

## Commands

These commands are safe to run during assist review because they only validate the current workspace file.

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target github --from vault/projects/ariadne/control/operator-evidence/github/operator-evidence.md
```

## Import Command After Human Verification

Run this only after a human operator has filled operator-evidence.md with verified observations and the check command reports complete evidence.

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target github --from vault/projects/ariadne/control/operator-evidence/github/operator-evidence.md --by <operator>
```

## Existing Ariadne Evidence Refs

- projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-github.md
- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-github.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace-github.json
- projects/ariadne/control/operator-evidence/github/operator-evidence.md
- projects/ariadne/control/live-adapter-operator-evidence-audit.json

## Promoted Live Evidence

- none

## Human Verification Worksheet

| Missing section | Human verification prompt | Existing refs | Promoted live evidence | GBrain queries |
| --- | --- | ---: | ---: | ---: |
| Operator identity and timestamp | Human operator must verify github Operator identity and timestamp from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Approval packet review | Human operator must verify github Approval packet review from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Authentication or authorization boundary | Human operator must verify github Authentication or authorization boundary from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Bounded action statement | Human operator must verify github Bounded action statement from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Rollback or disable path | Human operator must verify github Rollback or disable path from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Post-action verification command | Human operator must verify github Post-action verification command from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Dry-run command and safe output | Human operator must verify github Dry-run command and safe output from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Target-guarded execution wrapper | Human operator must verify github Target-guarded execution wrapper from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Exact confirm-plan proof | Human operator must verify github Exact confirm-plan proof from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |

## Human Verification Reference Details

### Common References

Existing refs:
- projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-github.md
- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-github.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace-github.json
- projects/ariadne/control/operator-evidence/github/operator-evidence.md
- projects/ariadne/control/live-adapter-operator-evidence-audit.json

Promoted live evidence refs:
- none

GBrain queries:
- Find prior Ariadne decisions and evidence for the github live adapter.
- List risks, rollback requirements, and stale assumptions for github approval.
- Summarize operator-review evidence still missing before github mutation readiness.

### Section-Specific Prompts

#### Operator identity and timestamp

Prompt: Human operator must verify github Operator identity and timestamp from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Approval packet review

Prompt: Human operator must verify github Approval packet review from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Authentication or authorization boundary

Prompt: Human operator must verify github Authentication or authorization boundary from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Bounded action statement

Prompt: Human operator must verify github Bounded action statement from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Rollback or disable path

Prompt: Human operator must verify github Rollback or disable path from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Post-action verification command

Prompt: Human operator must verify github Post-action verification command from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Dry-run command and safe output

Prompt: Human operator must verify github Dry-run command and safe output from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Target-guarded execution wrapper

Prompt: Human operator must verify github Target-guarded execution wrapper from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Exact confirm-plan proof

Prompt: Human operator must verify github Exact confirm-plan proof from source systems or cited Ariadne refs before recording it in operator-evidence.md.


## Support File Refs

- projects/ariadne/control/operator-evidence/github/packet-review.md
- projects/ariadne/control/operator-evidence/github/auth-boundary.md
- projects/ariadne/control/operator-evidence/github/rollback-post-verify.md
- projects/ariadne/control/operator-evidence/github/dry-run-review.md
- projects/ariadne/control/operator-evidence/github/gbrain-notes.md
- projects/ariadne/control/operator-evidence/github/read-only-assist.md

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
- repository, PR, branch policy, and check-rollup evidence

## Cutover Blockers

- Operator evidence complete: No operator evidence record exists for github.; Missing operator evidence section: Operator identity and timestamp; Missing operator evidence section: Approval packet review; Missing operator evidence section: Authentication or authorization boundary; Missing operator evidence section: Bounded action statement; Missing operator evidence section: Rollback or disable path; Missing operator evidence section: Post-action verification command; Missing operator evidence section: Dry-run command and safe output; Missing operator evidence section: Target-guarded execution wrapper; Missing operator evidence section: Exact confirm-plan proof
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

## GBrain Advisory Queries

- Find prior Ariadne decisions and evidence for the github live adapter.
- List risks, rollback requirements, and stale assumptions for github approval.
- Summarize operator-review evidence still missing before github mutation readiness.

## Next Steps

- Open read-only-assist.md and the listed support refs.
- Verify each relevant fact manually before copying it into operator-evidence.md.
- Fill the Operator and Review timestamp fields with real operator values.
- Run the check command, then import only after the check is complete and the operator evidence file contains verified human observations.
