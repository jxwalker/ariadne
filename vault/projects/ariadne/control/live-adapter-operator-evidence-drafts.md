# Live Adapter Operator Evidence Draft Pack

Project: ariadne
Generated: 2026-05-18T08:09:22.754Z
Status: drafted_for_human_verification
Mutation approved: false
Approval granted: false
Operator evidence record created: false

## Rule

This pack creates non-authoritative drafts only. It does not import operator evidence, approve mutation, or grant live-adapter authority.

## Summary

- Targets: 6
- Drafts: 6
- Missing sections: 54
- Candidate rows: 54
- Existing evidence refs: 32
- Promoted live evidence refs: 1
- GBrain queries: 18

## Commands

### Check All Human-Filled Evidence

```bash
npm run ariadne -- live-adapter-operator-evidence-check-all --project ariadne --source workspace
```

### Import Ready Evidence After Human Verification

```bash
npm run ariadne -- live-adapter-operator-evidence-import-ready --project ariadne --by <operator>
```

## Drafts

| Target | Status | Missing sections | Candidate rows | Draft | Source packet |
| --- | --- | ---: | ---: | --- | --- |
| github | drafted_for_human_verification | 9 | 9 | projects/ariadne/control/live-adapter-operator-evidence-draft-github.json | projects/ariadne/control/live-adapter-operator-evidence-next-github.json |
| deployment | drafted_for_human_verification | 9 | 9 | projects/ariadne/control/live-adapter-operator-evidence-draft-deployment.json | projects/ariadne/control/live-adapter-operator-evidence-next-deployment.json |
| hermes-cron | drafted_for_human_verification | 9 | 9 | projects/ariadne/control/live-adapter-operator-evidence-draft-hermes-cron.json | projects/ariadne/control/live-adapter-operator-evidence-next-hermes-cron.json |
| openscorpion | drafted_for_human_verification | 9 | 9 | projects/ariadne/control/live-adapter-operator-evidence-draft-openscorpion.json | projects/ariadne/control/live-adapter-operator-evidence-next-openscorpion.json |
| gsd2 | drafted_for_human_verification | 9 | 9 | projects/ariadne/control/live-adapter-operator-evidence-draft-gsd2.json | projects/ariadne/control/live-adapter-operator-evidence-next-gsd2.json |
| notebooklm | drafted_for_human_verification | 9 | 9 | projects/ariadne/control/live-adapter-operator-evidence-draft-notebooklm.json | projects/ariadne/control/live-adapter-operator-evidence-next-notebooklm.json |

## Notes

- This pack is non-authoritative and must not be imported directly.
- Each draft points to operator-evidence.md as the human-filled import source.
- A human operator must verify each target draft before copying facts into the target operator-evidence.md file.
- The pack does not approve mutation, grant live-adapter authority, or create operator evidence records.
