# Artifact Checks

Project: ariadne
Status: passed
Generated: 2026-05-16T16:20:46.800Z

## Summary

- Required checks: 13
- Optional checks: 19
- Present artifacts: 29
- Missing required artifacts: 0

## Checks

| Id | Required | Status | Count | Path |
| --- | --- | --- | --- | --- |
| manifest | yes | present | - | projects/ariadne/manifest.jsonl |
| hot-index | yes | present | - | projects/ariadne/HOT_INDEX.md |
| dossier | yes | present | 2 | projects/ariadne/context/dossier-*.md |
| prd-json | yes | present | - | projects/ariadne/requirements/prd.json |
| prd-markdown | yes | present | - | projects/ariadne/requirements/PRD.md |
| gsd-roadmap | yes | present | - | projects/ariadne/gsd/roadmap.json |
| gsd-tasks | yes | present | - | projects/ariadne/gsd/TASKS.md |
| gsd2-bundle | yes | present | - | projects/ariadne/gsd/gsd2-bundle.json |
| execution-runs | yes | present | 4 | projects/ariadne/execution/run-*.json |
| playwright-plan | yes | present | - | projects/ariadne/verification/playwright-plan.json |
| playwright-captures | no | present | 2 | projects/ariadne/verification/playwright-captures/target-*.png |
| playwright-traces | no | present | 2 | projects/ariadne/verification/playwright-captures/target-*.zip |
| healer-proposals | no | present | 1 | projects/ariadne/verification/healer-proposals/healer-*.json |
| evaluation-plan | yes | present | - | projects/ariadne/evaluation/evaluation-plan.json |
| infra-registry | yes | present | - | projects/ariadne/infrastructure/registry.json |
| infra-snapshots | no | present | 1 | projects/ariadne/infrastructure/infra-snapshot-*.json |
| control-report | yes | present | - | projects/ariadne/control/merge-readiness.json |
| console-data | no | present | - | projects/ariadne/console/console-data.json |
| console-html | no | present | - | projects/ariadne/console/index.html |
| console-visual-checks | no | present | - | projects/ariadne/console/visual-checks.json |
| console-browser-checks | no | present | - | projects/ariadne/console/browser-checks.json |
| recovery-report | no | present | - | projects/ariadne/control/recovery-report.json |
| usage-report | no | present | - | projects/ariadne/evaluation/usage-report.json |
| behavior-checks | no | present | - | projects/ariadne/evaluation/behavior-checks.json |
| gbrain-export | no | present | - | projects/ariadne/integrations/gbrain/gbrain-export.json |
| github-snapshots | no | present | 1 | projects/ariadne/integrations/github/github-snapshot-*.json |
| approval-records | no | present | 1 | projects/ariadne/control/approvals/approval-*.json |
| extraction-results | no | missing | 0 | projects/ariadne/extractions/extraction-*.json |
| extraction-runner-plans | no | missing | 0 | projects/ariadne/extractions/plans/extraction-plan-*.json |
| coordination-records | no | present | 4 | projects/ariadne/coordination/**/*.json |
| hermes-cron-snapshots | no | missing | 0 | projects/ariadne/coordination/hermes/hermes-cron-*.json |
| deployment-snapshots | no | present | 1 | projects/ariadne/deployment/deployment-*.json |
