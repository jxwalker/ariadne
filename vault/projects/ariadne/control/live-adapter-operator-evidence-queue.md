# Live Adapter Operator Evidence Queue

Project: ariadne
Status: evidence_required
Generated: 2026-05-18T15:27:15.740Z
Mutation approved: false
Operator evidence audit: projects/ariadne/control/live-adapter-operator-evidence-audit.json
Workplan: projects/ariadne/control/live-adapter-operator-evidence-workplan.json

## Summary

- Targets: 6
- Complete targets: 1
- Ready for import: 0
- Needs evidence: 5
- Needs rework: 0
- Unchecked targets: 0
- Latest checks: 6

## Rule

This queue is an operator aid only. It does not record operator evidence, approve mutation, or grant live-adapter authority.

## Targets

| Target | Status | Latest check | Missing | Missing section labels | Next action |
| --- | --- | --- | ---: | --- | --- |
| github | needs_evidence | operator-evidence-check-github-2026-05-18T15-10-33-229Z | 9 | Operator identity and timestamp, Approval packet review, Authentication or authorization boundary, Bounded action statement, Rollback or disable path, Post-action verification command, Dry-run command and safe output, Target-guarded execution wrapper, Exact confirm-plan proof | Fill the missing sections in the operator evidence workspace file and rerun the preflight check. |
| deployment | complete | operator-evidence-check-deployment-2026-05-18T15-10-34-678Z | 0 | none | No operator evidence action is needed for this target. |
| hermes-cron | needs_evidence | operator-evidence-check-hermes-cron-2026-05-18T15-10-35-295Z | 9 | Operator identity and timestamp, Approval packet review, Authentication or authorization boundary, Bounded action statement, Rollback or disable path, Post-action verification command, Dry-run command and safe output, Target-guarded execution wrapper, Exact confirm-plan proof | Fill the missing sections in the operator evidence workspace file and rerun the preflight check. |
| openscorpion | needs_evidence | operator-evidence-check-openscorpion-2026-05-18T15-10-35-916Z | 9 | Operator identity and timestamp, Approval packet review, Authentication or authorization boundary, Bounded action statement, Rollback or disable path, Post-action verification command, Dry-run command and safe output, Target-guarded execution wrapper, Exact confirm-plan proof | Fill the missing sections in the operator evidence workspace file and rerun the preflight check. |
| gsd2 | needs_evidence | operator-evidence-check-gsd2-2026-05-18T15-10-36-552Z | 9 | Operator identity and timestamp, Approval packet review, Authentication or authorization boundary, Bounded action statement, Rollback or disable path, Post-action verification command, Dry-run command and safe output, Target-guarded execution wrapper, Exact confirm-plan proof | Fill the missing sections in the operator evidence workspace file and rerun the preflight check. |
| notebooklm | needs_evidence | operator-evidence-check-notebooklm-2026-05-18T15-10-37-116Z | 9 | Operator identity and timestamp, Approval packet review, Authentication or authorization boundary, Bounded action statement, Rollback or disable path, Post-action verification command, Dry-run command and safe output, Target-guarded execution wrapper, Exact confirm-plan proof | Fill the missing sections in the operator evidence workspace file and rerun the preflight check. |

## Commands

### github

Status: needs_evidence
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-github.md

#### Check

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target github --from vault/projects/ariadne/control/operator-evidence/github/operator-evidence.md
```

#### Import

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target github --from vault/projects/ariadne/control/operator-evidence/github/operator-evidence.md --by <operator>
```

### deployment

Status: complete
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-deployment.md

#### Check

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target deployment --from vault/projects/ariadne/control/operator-evidence/deployment/operator-evidence.md
```

#### Import

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target deployment --from vault/projects/ariadne/control/operator-evidence/deployment/operator-evidence.md --by <operator>
```

### hermes-cron

Status: needs_evidence
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-hermes-cron.md

#### Check

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target hermes-cron --from vault/projects/ariadne/control/operator-evidence/hermes-cron/operator-evidence.md
```

#### Import

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target hermes-cron --from vault/projects/ariadne/control/operator-evidence/hermes-cron/operator-evidence.md --by <operator>
```

### openscorpion

Status: needs_evidence
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-openscorpion.md

#### Check

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target openscorpion --from vault/projects/ariadne/control/operator-evidence/openscorpion/operator-evidence.md
```

#### Import

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target openscorpion --from vault/projects/ariadne/control/operator-evidence/openscorpion/operator-evidence.md --by <operator>
```

### gsd2

Status: needs_evidence
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-gsd2.md

#### Check

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target gsd2 --from vault/projects/ariadne/control/operator-evidence/gsd2/operator-evidence.md
```

#### Import

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target gsd2 --from vault/projects/ariadne/control/operator-evidence/gsd2/operator-evidence.md --by <operator>
```

### notebooklm

Status: needs_evidence
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-notebooklm.md

#### Check

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target notebooklm --from vault/projects/ariadne/control/operator-evidence/notebooklm/operator-evidence.md
```

#### Import

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target notebooklm --from vault/projects/ariadne/control/operator-evidence/notebooklm/operator-evidence.md --by <operator>
```
