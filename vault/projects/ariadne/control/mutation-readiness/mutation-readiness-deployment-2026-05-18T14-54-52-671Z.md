# Mutation Readiness: deployment

Id: mutation-readiness-deployment-2026-05-18T14-54-52-671Z
Status: approval_required
Risk: high
Generated: 2026-05-18T14:54:52.671Z
Execute: false
Approval: approval-2026-05-18T14-53-53-213Z (requested)

## Scope

mac/jimm5.local: Atlas runtime health verification and local Mac deployment boundary review; no service mutation

## Auth Evidence

- vault/projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T14-53-28-810Z.json

## Supporting Evidence

- vault/projects/ariadne/control/approvals/approval-2026-05-18T14-53-53-213Z.json
- vault/projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T14-53-28-810Z.json

## Dry Run

```bash
ARIADNE_ATLAS_URL=http://100.91.237.82:8888/v1 ARIADNE_ATLAS_CANARY_MODEL=qwen3.6-35b-a3b-nvfp4-atlas npm run ariadne -- local-runtime-probe --project ariadne --canary --canary-endpoints atlas --timeout-ms 60000
```

## Proposed Live Command

```bash
printf 'deployment live command intentionally disabled until an explicit approval decision is approved and a target-specific command is substituted'
```

## Post-Action Verification

```bash
npm run ariadne -- status --project ariadne
```

## Rollback

mac/jimm5.local: no live mutation is approved by this plan; rollback is to discard the requested approval and readiness plan, then rerun status and runtime probe

## Required Gates

- bounded scope recorded
- auth evidence reviewed
- dry-run command reviewed
- rollback command reviewed
- human approval record approved
- CodeRabbit or human review approval
- post-action verification command defined
- deployment target and rollback host verified

## Notes

Plan records deployment evidence and command shape only. approvalStatus=requested keeps mutation blocked.
