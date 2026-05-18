# Read-Only Operator Evidence Assist: deployment

Project: ariadne
Generated: 2026-05-18T08:36:30.764Z
Target: deployment
Status: needs_evidence
Mutation approved: false
Approval granted: false
Operator evidence record created: false

## Rule

This file is generated from existing Ariadne artifacts. It is not operator evidence. A human operator must verify any fact before recording it in operator-evidence.md.

## Workspace

- Workspace dir: projects/ariadne/control/operator-evidence/deployment
- Evidence file: projects/ariadne/control/operator-evidence/deployment/operator-evidence.md

## Commands

These commands are safe to run during assist review because they only validate the current workspace file.

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target deployment --from vault/projects/ariadne/control/operator-evidence/deployment/operator-evidence.md
```

## Import Command After Human Verification

Run this only after a human operator has filled operator-evidence.md with verified observations and the check command reports complete evidence.

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target deployment --from vault/projects/ariadne/control/operator-evidence/deployment/operator-evidence.md --by <operator>
```

## Existing Ariadne Evidence Refs

- projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-deployment.md
- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-deployment.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace-deployment.json
- projects/ariadne/control/operator-evidence/deployment/operator-evidence.md
- projects/ariadne/control/live-adapter-operator-evidence-audit.json
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-17T23-37-04-509Z.json
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T08-15-50-017Z.json
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T08-28-02-295Z.json
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T08-36-20-265Z.json

## Promoted Live Evidence

### Atlas Qwen runtime canary evidence

- Ref: projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-17T23-37-04-509Z.json
- Generated: 2026-05-17T23:37:04.509Z
- Sources: 2 (2 parsed, 2 redaction(s))
- Source kinds: local-runtime-probe, e2e-smoke
- local-runtime-probe; 8/8 services reachable; 13 models; atlas canary passed qwen3.6-35b-a3b-nvfp4-atlas; 1 redaction(s)
- e2e-smoke; 11 passed, 1 blocked, 0 failed; 1 redaction(s)

### Latest Atlas Qwen runtime and smoke evidence

- Ref: projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T08-15-50-017Z.json
- Generated: 2026-05-18T08:15:50.017Z
- Sources: 2 (2 parsed, 2 redaction(s))
- Source kinds: local-runtime-probe, e2e-smoke
- local-runtime-probe; 8/8 services reachable; 13 models; atlas canary passed qwen3.6-35b-a3b-nvfp4-atlas; 1 redaction(s)
- e2e-smoke; 11 passed, 2 blocked, 0 failed; 1 redaction(s)

### Atlas qwen3.6 canary runtime evidence

- Ref: projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T08-28-02-295Z.json
- Generated: 2026-05-18T08:28:02.295Z
- Sources: 1 (1 parsed, 1 redaction(s))
- Source kinds: local-runtime-probe
- local-runtime-probe; 8/8 services reachable; 13 models; atlas canary passed qwen3.6-35b-a3b-nvfp4-atlas; 1 redaction(s)

### Atlas e2e smoke and runtime evidence

- Ref: projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T08-36-20-265Z.json
- Generated: 2026-05-18T08:36:20.265Z
- Sources: 2 (2 parsed, 2 redaction(s))
- Source kinds: e2e-smoke, local-runtime-probe
- e2e-smoke; 11 passed, 2 blocked, 0 failed; 1 redaction(s)
- local-runtime-probe; 8/8 services reachable; 13 models; atlas canary passed qwen3.6-35b-a3b-nvfp4-atlas; 1 redaction(s)


## Human Verification Worksheet

| Missing section | Human verification prompt | Existing refs | Promoted live evidence | GBrain queries |
| --- | --- | ---: | ---: | ---: |
| Operator identity and timestamp | Human operator must verify deployment Operator identity and timestamp from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 15 | 4 | 3 |
| Approval packet review | Human operator must verify deployment Approval packet review from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 15 | 4 | 3 |
| Authentication or authorization boundary | Human operator must verify deployment Authentication or authorization boundary from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 15 | 4 | 3 |
| Bounded action statement | Human operator must verify deployment Bounded action statement from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 15 | 4 | 3 |
| Rollback or disable path | Human operator must verify deployment Rollback or disable path from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 15 | 4 | 3 |
| Post-action verification command | Human operator must verify deployment Post-action verification command from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 15 | 4 | 3 |
| Dry-run command and safe output | Human operator must verify deployment Dry-run command and safe output from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 15 | 4 | 3 |
| Target-guarded execution wrapper | Human operator must verify deployment Target-guarded execution wrapper from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 15 | 4 | 3 |
| Exact confirm-plan proof | Human operator must verify deployment Exact confirm-plan proof from source systems or cited Ariadne refs before recording it in operator-evidence.md. | 15 | 4 | 3 |

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
- projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-deployment.md
- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-deployment.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace-deployment.json
- projects/ariadne/control/operator-evidence/deployment/operator-evidence.md
- projects/ariadne/control/live-adapter-operator-evidence-audit.json
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-17T23-37-04-509Z.json
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T08-15-50-017Z.json
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T08-28-02-295Z.json
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T08-36-20-265Z.json

Promoted live evidence refs:
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-17T23-37-04-509Z.json
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T08-15-50-017Z.json
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T08-28-02-295Z.json
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T08-36-20-265Z.json

GBrain queries:
- Find prior Ariadne decisions and evidence for the deployment live adapter.
- List risks, rollback requirements, and stale assumptions for deployment approval.
- Summarize operator-review evidence still missing before deployment mutation readiness.

### Section-Specific Prompts

#### Operator identity and timestamp

Prompt: Human operator must verify deployment Operator identity and timestamp from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Approval packet review

Prompt: Human operator must verify deployment Approval packet review from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Authentication or authorization boundary

Prompt: Human operator must verify deployment Authentication or authorization boundary from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Bounded action statement

Prompt: Human operator must verify deployment Bounded action statement from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Rollback or disable path

Prompt: Human operator must verify deployment Rollback or disable path from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Post-action verification command

Prompt: Human operator must verify deployment Post-action verification command from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Dry-run command and safe output

Prompt: Human operator must verify deployment Dry-run command and safe output from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Target-guarded execution wrapper

Prompt: Human operator must verify deployment Target-guarded execution wrapper from source systems or cited Ariadne refs before recording it in operator-evidence.md.

#### Exact confirm-plan proof

Prompt: Human operator must verify deployment Exact confirm-plan proof from source systems or cited Ariadne refs before recording it in operator-evidence.md.


## Support File Refs

- projects/ariadne/control/operator-evidence/deployment/packet-review.md
- projects/ariadne/control/operator-evidence/deployment/auth-boundary.md
- projects/ariadne/control/operator-evidence/deployment/rollback-post-verify.md
- projects/ariadne/control/operator-evidence/deployment/dry-run-review.md
- projects/ariadne/control/operator-evidence/deployment/gbrain-notes.md
- projects/ariadne/control/operator-evidence/deployment/read-only-assist.md

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
- host identity, service state, sudo boundary, and rollback host evidence

## Cutover Blockers

- Operator evidence complete: No operator evidence record exists for deployment.; Missing operator evidence section: Operator identity and timestamp; Missing operator evidence section: Approval packet review; Missing operator evidence section: Authentication or authorization boundary; Missing operator evidence section: Bounded action statement; Missing operator evidence section: Rollback or disable path; Missing operator evidence section: Post-action verification command; Missing operator evidence section: Dry-run command and safe output; Missing operator evidence section: Target-guarded execution wrapper; Missing operator evidence section: Exact confirm-plan proof
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

## GBrain Advisory Queries

- Find prior Ariadne decisions and evidence for the deployment live adapter.
- List risks, rollback requirements, and stale assumptions for deployment approval.
- Summarize operator-review evidence still missing before deployment mutation readiness.

## Next Steps

- Open read-only-assist.md and the listed support refs.
- Verify each relevant fact manually before copying it into operator-evidence.md.
- Fill the Operator and Review timestamp fields with real operator values.
- Run the check command, then import only after the check is complete and the operator evidence file contains verified human observations.
