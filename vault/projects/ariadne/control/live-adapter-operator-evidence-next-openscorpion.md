# Live Adapter Operator Evidence Next Packet: openscorpion

Project: ariadne
Generated: 2026-05-18T08:36:32.443Z
Target: openscorpion
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
- workspace: projects/ariadne/control/live-adapter-operator-evidence-workspace-openscorpion.json
- assist: projects/ariadne/control/live-adapter-operator-evidence-assist-openscorpion.json
- checkBatch: projects/ariadne/control/live-adapter-operator-evidence-check-all-openscorpion.json
- reviewSession: projects/ariadne/control/live-adapter-review-session-openscorpion.json
- cutoverAudit: projects/ariadne/control/live-adapter-cutover-audit-openscorpion.json

## Operator Commands

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target openscorpion --from vault/projects/ariadne/control/operator-evidence/openscorpion/operator-evidence.md
npm run ariadne -- live-adapter-review-session --project ariadne --target openscorpion
npm run ariadne -- live-adapter-cutover-audit --project ariadne --target openscorpion
```

## Import Command After Human Verification

Run this only after a human operator has filled operator-evidence.md with verified observations and the check command reports complete evidence.

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target openscorpion --from vault/projects/ariadne/control/operator-evidence/openscorpion/operator-evidence.md --by <operator>
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
| Operator identity and timestamp | Human operator must verify openscorpion Operator identity and timestamp from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Approval packet review | Human operator must verify openscorpion Approval packet review from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Authentication or authorization boundary | Human operator must verify openscorpion Authentication or authorization boundary from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Bounded action statement | Human operator must verify openscorpion Bounded action statement from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Rollback or disable path | Human operator must verify openscorpion Rollback or disable path from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Post-action verification command | Human operator must verify openscorpion Post-action verification command from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Dry-run command and safe output | Human operator must verify openscorpion Dry-run command and safe output from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Target-guarded execution wrapper | Human operator must verify openscorpion Target-guarded execution wrapper from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |
| Exact confirm-plan proof | Human operator must verify openscorpion Exact confirm-plan proof from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 11 | 0 | 3 |

## Human Verification Fill Order

| Step | Missing section | Start with | Record verified observation in | Preflight check |
| ---: | --- | --- | --- | --- |
| 1 | Operator identity and timestamp | operator-evidence.md header plus current source-system timestamp | operator-evidence.md | Confirm the operator and timestamp fields are real values. |
| 2 | Approval packet review | packet-review.md, approval pack, and approval-review audit | operator-evidence.md approval/confirm-plan sections | Confirm approval remains bounded and non-stale. |
| 3 | Authentication or authorization boundary | auth-boundary.md, mutation-readiness audit, and target dossier | operator-evidence.md authentication boundary section | Confirm credentials, scope, and host/user boundary are explicit. |
| 4 | Bounded action statement | target dossier, approval pack, and mutation-readiness repair plan | operator-evidence.md bounded action section | Confirm the exact target and allowed operation are narrow. |
| 5 | Rollback or disable path | rollback-post-verify.md and cutover audit | operator-evidence.md rollback/post-action verification sections | Confirm rollback and verification commands are runnable before mutation. |
| 6 | Post-action verification command | rollback-post-verify.md and cutover audit | operator-evidence.md rollback/post-action verification sections | Confirm rollback and verification commands are runnable before mutation. |
| 7 | Dry-run command and safe output | dry-run-review.md, target dossier, and command wrapper evidence | operator-evidence.md dry-run/target-guarded wrapper sections | Confirm dry-run output is safe and the wrapper rejects wrong targets. |
| 8 | Target-guarded execution wrapper | dry-run-review.md, target dossier, and command wrapper evidence | operator-evidence.md dry-run/target-guarded wrapper sections | Confirm dry-run output is safe and the wrapper rejects wrong targets. |
| 9 | Exact confirm-plan proof | packet-review.md, approval pack, and approval-review audit | operator-evidence.md approval/confirm-plan sections | Confirm approval remains bounded and non-stale. |

## Human Verification Reference Details

### Common References

Existing refs:
- projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-openscorpion.md
- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-openscorpion.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace-openscorpion.json
- projects/ariadne/control/operator-evidence/openscorpion/operator-evidence.md
- projects/ariadne/control/live-adapter-operator-evidence-audit.json

Promoted live evidence refs:
- none

GBrain queries:
- Find prior Ariadne decisions and evidence for the openscorpion live adapter.
- List risks, rollback requirements, and stale assumptions for openscorpion approval.
- Summarize operator-review evidence still missing before openscorpion mutation readiness.

### Section-Specific Prompts

#### Operator identity and timestamp

Prompt: Human operator must verify openscorpion Operator identity and timestamp from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Approval packet review

Prompt: Human operator must verify openscorpion Approval packet review from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Authentication or authorization boundary

Prompt: Human operator must verify openscorpion Authentication or authorization boundary from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Bounded action statement

Prompt: Human operator must verify openscorpion Bounded action statement from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Rollback or disable path

Prompt: Human operator must verify openscorpion Rollback or disable path from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Post-action verification command

Prompt: Human operator must verify openscorpion Post-action verification command from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Dry-run command and safe output

Prompt: Human operator must verify openscorpion Dry-run command and safe output from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Target-guarded execution wrapper

Prompt: Human operator must verify openscorpion Target-guarded execution wrapper from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Exact confirm-plan proof

Prompt: Human operator must verify openscorpion Exact confirm-plan proof from source systems or cited Ariadne refs before recording it in operator-evidence.md.


## Evidence Refs

- projects/ariadne/control/operator-evidence/openscorpion/operator-evidence.md
- projects/ariadne/control/operator-evidence/openscorpion/read-only-assist.md
- projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-openscorpion.md
- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-openscorpion.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace-openscorpion.json
- projects/ariadne/control/live-adapter-operator-evidence-audit.json
- projects/ariadne/control/operator-evidence/openscorpion/packet-review.md
- projects/ariadne/control/operator-evidence/openscorpion/auth-boundary.md
- projects/ariadne/control/operator-evidence/openscorpion/rollback-post-verify.md
- projects/ariadne/control/operator-evidence/openscorpion/dry-run-review.md
- projects/ariadne/control/operator-evidence/openscorpion/gbrain-notes.md
