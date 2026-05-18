# Live Adapter Operator Evidence Workspace

Project: ariadne
Target: hermes-cron
Status: awaiting_operator_input
Generated: 2026-05-18T08:09:23.403Z
Mutation approved: false
Approval granted: false

## Rule

This workspace is fillable operator paperwork. It does not create evidence records, approve mutation, or grant live-adapter authority.

## References

- Queue: projects/ariadne/control/live-adapter-operator-evidence-queue.json
- Workplan: projects/ariadne/control/live-adapter-operator-evidence-workplan.json

## Summary

- Targets: 1
- Workspace files: 1
- Support files: 6
- Targets needing evidence: 1
- Targets ready for import: 0
- GBrain query items: 3

## Targets

### hermes-cron

Status: needs_evidence
Workspace: projects/ariadne/control/operator-evidence/hermes-cron
Evidence file: projects/ariadne/control/operator-evidence/hermes-cron/operator-evidence.md

#### Check Command

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target hermes-cron --from vault/projects/ariadne/control/operator-evidence/hermes-cron/operator-evidence.md
```

#### Import Command

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target hermes-cron --from vault/projects/ariadne/control/operator-evidence/hermes-cron/operator-evidence.md --by <operator>
```

#### Missing Sections

- Operator identity and timestamp
- Approval packet review
- Authentication or authorization boundary
- Bounded action statement
- Rollback or disable path
- Post-action verification command
- Dry-run command and safe output
- Target-guarded execution wrapper
- Exact confirm-plan proof

#### Support Files

- projects/ariadne/control/operator-evidence/hermes-cron/packet-review.md
- projects/ariadne/control/operator-evidence/hermes-cron/auth-boundary.md
- projects/ariadne/control/operator-evidence/hermes-cron/rollback-post-verify.md
- projects/ariadne/control/operator-evidence/hermes-cron/dry-run-review.md
- projects/ariadne/control/operator-evidence/hermes-cron/gbrain-notes.md
- projects/ariadne/control/operator-evidence/hermes-cron/read-only-assist.md
