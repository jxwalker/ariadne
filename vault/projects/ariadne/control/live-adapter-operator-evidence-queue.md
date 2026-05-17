# Live Adapter Operator Evidence Queue

Project: ariadne
Status: evidence_required
Generated: 2026-05-17T08:33:54.762Z
Mutation approved: false
Operator evidence audit: projects/ariadne/control/live-adapter-operator-evidence-audit.json
Workplan: projects/ariadne/control/live-adapter-operator-evidence-workplan.json

## Summary

- Targets: 6
- Complete targets: 0
- Ready for import: 0
- Needs evidence: 6
- Needs rework: 0
- Unchecked targets: 0
- Latest checks: 6

## Rule

This queue is an operator aid only. It does not record operator evidence, approve mutation, or grant live-adapter authority.

## Targets

| Target | Status | Latest check | Missing | Next action |
| --- | --- | --- | --- | --- |
| github | needs_evidence | operator-evidence-check-github-2026-05-17T07-32-10-440Z | 9 | Fill the missing sections in the operator evidence template and rerun the preflight check. |
| deployment | needs_evidence | operator-evidence-check-deployment-2026-05-17T07-32-10-447Z | 9 | Fill the missing sections in the operator evidence template and rerun the preflight check. |
| hermes-cron | needs_evidence | operator-evidence-check-hermes-cron-2026-05-17T07-32-10-448Z | 9 | Fill the missing sections in the operator evidence template and rerun the preflight check. |
| openscorpion | needs_evidence | operator-evidence-check-openscorpion-2026-05-17T07-32-10-449Z | 9 | Fill the missing sections in the operator evidence template and rerun the preflight check. |
| gsd2 | needs_evidence | operator-evidence-check-gsd2-2026-05-17T07-32-10-450Z | 9 | Fill the missing sections in the operator evidence template and rerun the preflight check. |
| notebooklm | needs_evidence | operator-evidence-check-notebooklm-2026-05-17T07-32-10-451Z | 9 | Fill the missing sections in the operator evidence template and rerun the preflight check. |

## Commands

### github

Status: needs_evidence
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-github.md

#### Check

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target github --from vault/projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-github.md
```

#### Import

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target github --from vault/projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-github.md --by <operator>
```

### deployment

Status: needs_evidence
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-deployment.md

#### Check

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target deployment --from vault/projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-deployment.md
```

#### Import

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target deployment --from vault/projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-deployment.md --by <operator>
```

### hermes-cron

Status: needs_evidence
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-hermes-cron.md

#### Check

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target hermes-cron --from vault/projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-hermes-cron.md
```

#### Import

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target hermes-cron --from vault/projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-hermes-cron.md --by <operator>
```

### openscorpion

Status: needs_evidence
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-openscorpion.md

#### Check

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target openscorpion --from vault/projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-openscorpion.md
```

#### Import

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target openscorpion --from vault/projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-openscorpion.md --by <operator>
```

### gsd2

Status: needs_evidence
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-gsd2.md

#### Check

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target gsd2 --from vault/projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-gsd2.md
```

#### Import

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target gsd2 --from vault/projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-gsd2.md --by <operator>
```

### notebooklm

Status: needs_evidence
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-notebooklm.md

#### Check

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target notebooklm --from vault/projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-notebooklm.md
```

#### Import

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target notebooklm --from vault/projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-notebooklm.md --by <operator>
```
