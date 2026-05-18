# Live Adapter Operator Evidence Next Packet: github

Project: ariadne
Generated: 2026-05-18T08:16:01.819Z
Target: github
Selected by: explicit
Status: operator_action_required
Mutation approved: false
Approval granted: false
Operator evidence record created: false

## Rule

This packet runs only non-mutating preparation steps. It does not import operator evidence, approve mutation, or grant live-adapter authority.

## Summary

- Missing sections: 9
- Existing evidence refs: 11
- Promoted live evidence: 0
- Support file refs: 6
- Cutover blocked gates: 7
- Verification worksheet rows: 9

## Generated Refs

- workplan: projects/ariadne/control/live-adapter-operator-evidence-workplan.json
- queue: projects/ariadne/control/live-adapter-operator-evidence-queue.json
- operatorEvidenceAudit: projects/ariadne/control/live-adapter-operator-evidence-audit.json
- workspace: projects/ariadne/control/live-adapter-operator-evidence-workspace-github.json
- assist: projects/ariadne/control/live-adapter-operator-evidence-assist-github.json
- checkBatch: projects/ariadne/control/live-adapter-operator-evidence-check-all-github.json
- reviewSession: projects/ariadne/control/live-adapter-review-session-github.json
- cutoverAudit: projects/ariadne/control/live-adapter-cutover-audit-github.json

## Operator Commands

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target github --from vault/projects/ariadne/control/operator-evidence/github/operator-evidence.md
npm run ariadne -- live-adapter-review-session --project ariadne --target github
npm run ariadne -- live-adapter-cutover-audit --project ariadne --target github
```

## Import Command After Human Verification

Run this only after a human operator has filled operator-evidence.md with verified observations and the check command reports complete evidence.

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target github --from vault/projects/ariadne/control/operator-evidence/github/operator-evidence.md --by <operator>
```

## Next Action

- Fill the missing sections in the operator evidence workspace file and rerun the preflight check.

## Missing Section Labels

- Operator identity and timestamp
- Approval packet review
- Authentication or authorization boundary
- Bounded action statement
- Rollback or disable path
- Post-action verification command
- Dry-run command and safe output
- Target-guarded execution wrapper
- Exact confirm-plan proof

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


## Evidence Refs

- projects/ariadne/control/operator-evidence/github/operator-evidence.md
- projects/ariadne/control/operator-evidence/github/read-only-assist.md
- projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-github.md
- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-github.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace-github.json
- projects/ariadne/control/live-adapter-operator-evidence-audit.json
- projects/ariadne/control/operator-evidence/github/packet-review.md
- projects/ariadne/control/operator-evidence/github/auth-boundary.md
- projects/ariadne/control/operator-evidence/github/rollback-post-verify.md
- projects/ariadne/control/operator-evidence/github/dry-run-review.md
- projects/ariadne/control/operator-evidence/github/gbrain-notes.md
