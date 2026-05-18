# Live Adapter Operator Evidence Draft Report: github

Project: ariadne
Generated: 2026-05-18T08:36:31.520Z
Status: drafted_for_human_verification
Mutation approved: false
Approval granted: false
Operator evidence record created: false

## Rule

This report creates a non-authoritative draft only. It does not import operator evidence, approve mutation, or grant live-adapter authority.

## Summary

- Target: github
- Missing sections: 9
- Candidate rows: 9
- Existing evidence refs: 11
- Promoted live evidence refs: 0
- GBrain queries: 3

## Refs

- Source packet: projects/ariadne/control/live-adapter-operator-evidence-next-github.json
- Draft file: projects/ariadne/control/operator-evidence/github/operator-evidence-draft.md

## Commands

### Check After Human Edits

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target github --from vault/projects/ariadne/control/operator-evidence/github/operator-evidence.md
```

### Import After Human Verification

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target github --from vault/projects/ariadne/control/operator-evidence/github/operator-evidence.md --by <operator>
```

## Human Verification Rows

| Missing section | Human verification required | Existing refs | Promoted refs | GBrain queries |
| --- | --- | ---: | ---: | ---: |
| Operator identity and timestamp | true | 11 | 0 | 3 |
| Approval packet review | true | 11 | 0 | 3 |
| Authentication or authorization boundary | true | 11 | 0 | 3 |
| Bounded action statement | true | 11 | 0 | 3 |
| Rollback or disable path | true | 11 | 0 | 3 |
| Post-action verification command | true | 11 | 0 | 3 |
| Dry-run command and safe output | true | 11 | 0 | 3 |
| Target-guarded execution wrapper | true | 11 | 0 | 3 |
| Exact confirm-plan proof | true | 11 | 0 | 3 |

## Notes

- This draft is non-authoritative and must not be imported directly.
- A human operator must verify every row against source systems or cited Ariadne refs before copying facts into operator-evidence.md.
- The draft does not approve mutation, grant live-adapter authority, or create an operator evidence record.
- GBrain context remains advisory; Ariadne evidence refs and source-system observations carry the gates.
