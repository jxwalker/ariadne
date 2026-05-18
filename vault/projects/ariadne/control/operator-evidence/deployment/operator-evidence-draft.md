# Operator Evidence Draft: deployment

Project: ariadne
Generated: 2026-05-18T15:10:34.896Z
Status: non-authoritative draft
Mutation approved: false
Approval granted: false
Operator evidence record created: false

## Instructions

- Do not import this file directly.
- Use this draft to review candidate refs, then copy verified facts into operator-evidence.md.
- Keep unknown or unverified checklist items unchecked in operator-evidence.md.
- Run the check command against operator-evidence.md after human edits.

## Commands

### Check Human-Filled Evidence

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target deployment --from vault/projects/ariadne/control/operator-evidence/deployment/operator-evidence.md
```

### Import After Human Verification

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target deployment --from vault/projects/ariadne/control/operator-evidence/deployment/operator-evidence.md --by <operator>
```

## Candidate Review Rows


## Copy Checklist Into operator-evidence.md After Verification

These placeholders are intentionally not evidence. Replace them only after a human operator verifies the facts.

```markdown
- Operator: <human operator>
- Review timestamp: <verified timestamp>
- Packet reviewed: <reviewed packet ref>
- Decision for packet completeness: <complete|needs_changes plus reason>
- Missing evidence: <none or explicit missing items>

## Required Evidence To Attach

- [ ] operator identity and review timestamp
- [ ] reviewed approval packet path and generation timestamp
- [ ] authentication or authorization boundary observed for this target
- [ ] bounded action statement and explicit non-goals
- [ ] rollback or disable path checked by the operator
- [ ] post-action verification command checked by the operator
- [ ] dry-run command and expected safe output shape
- [ ] target-guarded execution command and expected post-verification output shape
- [ ] proof that execution used mutation-execute or a target-specific wrapper with an exact --confirm-plan match
```

## Notes

- This draft is non-authoritative and must not be imported directly.
- A human operator must verify every row against source systems or cited Ariadne refs before copying facts into operator-evidence.md.
- The draft does not approve mutation, grant live-adapter authority, or create an operator evidence record.
- GBrain context remains advisory; Ariadne evidence refs and source-system observations carry the gates.
