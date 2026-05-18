# auth boundary: deployment

Project: ariadne
Generated: 2026-05-17T08:33:54.763Z
Mutation approved: false

## Purpose

Record observed authentication, authorization, and account-boundary facts for this target.

## Observations

- Operator: codex-agent-jimm5 under local user james
- Timestamp: 2026-05-18T14:53:05Z
- Evidence refs: vault/projects/ariadne/infrastructure/runtime/local-runtime-probe-2026-05-18T14-53-07-316Z.json; vault/projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-18T14-53-28-810Z.json
- Decision or finding: local command boundary observed on jimm5.local as user james, uid 501, admin group present; Atlas endpoint responded to /v1/models with qwen3.6-35b-a3b-nvfp4-atlas and the Ariadne Atlas canary passed.
- Notes: Persisted runtime probe redacts the non-loopback Atlas URL. This observation proves read-only runtime reachability and local operator account context only; it does not prove sudo authority on a deployment host and does not approve mutation.

## Related Commands

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target deployment --from vault/projects/ariadne/control/operator-evidence/deployment/operator-evidence.md
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target deployment --from vault/projects/ariadne/control/operator-evidence/deployment/operator-evidence.md --by <operator>
npm run ariadne -- live-adapter-approval-review --project ariadne --target deployment --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
```

## Relevant Cutover Blockers

- Operator evidence complete: No operator evidence record exists for deployment.
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.
