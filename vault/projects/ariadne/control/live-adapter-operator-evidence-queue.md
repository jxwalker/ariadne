# Live Adapter Operator Evidence Queue

Project: ariadne
Status: evidence_required
Generated: 2026-05-17T06:55:42.801Z
Mutation approved: false
Operator evidence audit: projects/ariadne/control/live-adapter-operator-evidence-audit.json
Workplan: projects/ariadne/control/live-adapter-operator-evidence-workplan.json

## Summary

- Targets: 6
- Complete targets: 0
- Ready for import: 0
- Needs evidence: 1
- Needs rework: 0
- Unchecked targets: 5
- Latest checks: 1

## Rule

This queue is an operator aid only. It does not record operator evidence, approve mutation, or grant live-adapter authority.

## Targets

| Target | Status | Latest check | Missing | Next action |
| --- | --- | --- | --- | --- |
| github | needs_evidence | operator-evidence-check-github-2026-05-17T06-36-28-110Z | 9 | Fill the missing sections in the operator evidence template and rerun the preflight check. |
| deployment | unchecked | none | 0 | Run the preflight check command against the target template before importing evidence. |
| hermes-cron | unchecked | none | 0 | Run the preflight check command against the target template before importing evidence. |
| openscorpion | unchecked | none | 0 | Run the preflight check command against the target template before importing evidence. |
| gsd2 | unchecked | none | 0 | Run the preflight check command against the target template before importing evidence. |
| notebooklm | unchecked | none | 0 | Run the preflight check command against the target template before importing evidence. |

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

Status: unchecked
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

Status: unchecked
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

Status: unchecked
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

Status: unchecked
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

Status: unchecked
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-notebooklm.md

#### Check

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target notebooklm --from vault/projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-notebooklm.md
```

#### Import

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target notebooklm --from vault/projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-notebooklm.md --by <operator>
```
