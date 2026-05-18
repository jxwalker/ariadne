# rollback post verify: deployment

Project: ariadne
Generated: 2026-05-17T08:33:54.763Z
Mutation approved: false

## Purpose

Record rollback or disable steps and the exact post-action verification command shape.

## Observations

- Operator: codex-agent-jimm5 under local user james
- Timestamp: 2026-05-18T14:54:52Z
- Evidence refs: vault/projects/ariadne/control/mutation-readiness/mutation-readiness-deployment-2026-05-18T14-54-52-671Z.json; vault/projects/ariadne/control/mutation-readiness-audit.json
- Decision or finding: rollback path for the current plan is discard-only because the plan does not approve live mutation; post-action verification command is `npm run ariadne -- status --project ariadne`.
- Notes: The readiness plan rollback text is `mac/jimm5.local: no live mutation is approved by this plan; rollback is to discard the requested approval and readiness plan, then rerun status and runtime probe`. Any future real deployment mutation still needs a host-specific rollback command before approval.

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
