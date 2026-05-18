# Read-Only Operator Evidence Assist: deployment

Project: ariadne
Generated: 2026-05-18T15:10:34.540Z
Target: deployment
Status: complete
Mutation approved: false
Approval granted: false
Operator evidence record created by assist: false

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
- projects/ariadne/control/live-adapter-operator-evidence/operator-evidence-deployment-2026-05-18T14-56-47-861Z.json
- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-deployment.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-approval-reviews/approval-review-deployment-2026-05-18T14-57-00-710Z.json
- projects/ariadne/control/operator-evidence/deployment/operator-evidence.md
- projects/ariadne/control/live-adapter-operator-evidence-audit.json
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-17T23-37-04-509Z.json
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T08-15-50-017Z.json
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T08-28-02-295Z.json
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T08-36-20-265Z.json
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T14-53-28-810Z.json

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

### Atlas deployment runtime evidence 2026-05-18

- Ref: projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T14-53-28-810Z.json
- Generated: 2026-05-18T14:53:28.810Z
- Sources: 1 (1 parsed, 1 redaction(s))
- Source kinds: local-runtime-probe
- local-runtime-probe; 8/8 services reachable; 13 models; atlas canary passed qwen3.6-35b-a3b-nvfp4-atlas; 1 redaction(s)


## Human Verification Worksheet

| Missing section | Human verification prompt | Existing refs | Promoted live evidence | GBrain queries |
| --- | --- | ---: | ---: | ---: |
| none | No missing sections. Confirm the imported operator record remains current before relying on it. | 0 | 0 | 0 |

## Human Verification Fill Order

| Step | Missing section | Start with | Record verified observation in | Preflight check |
| ---: | --- | --- | --- | --- |
| 1 | none | No missing sections. | Keep the current imported evidence record under review. | Rerun the target check before cutover. |

## Human Verification Reference Details

- none

## Support File Refs

- projects/ariadne/control/operator-evidence/deployment/packet-review.md
- projects/ariadne/control/operator-evidence/deployment/auth-boundary.md
- projects/ariadne/control/operator-evidence/deployment/rollback-post-verify.md
- projects/ariadne/control/operator-evidence/deployment/dry-run-review.md
- projects/ariadne/control/operator-evidence/deployment/gbrain-notes.md
- projects/ariadne/control/operator-evidence/deployment/read-only-assist.md

## Missing Sections

- none

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

- No assist action is needed unless the operator wants to refresh the evidence packet.
