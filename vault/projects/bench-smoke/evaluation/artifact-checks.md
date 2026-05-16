# Artifact Checks

Project: bench-smoke
Status: passed
Generated: 2026-05-16T18:29:09.268Z

## Summary

- Required checks: 13
- Optional checks: 24
- Present artifacts: 20
- Missing required artifacts: 0

## Checks

| Id | Required | Status | Count | Path |
| --- | --- | --- | --- | --- |
| manifest | yes | present | - | projects/bench-smoke/manifest.jsonl |
| hot-index | yes | present | - | projects/bench-smoke/HOT_INDEX.md |
| dossier | yes | present | 1 | projects/bench-smoke/context/dossier-*.md |
| prd-json | yes | present | - | projects/bench-smoke/requirements/prd.json |
| prd-markdown | yes | present | - | projects/bench-smoke/requirements/PRD.md |
| gsd-roadmap | yes | present | - | projects/bench-smoke/gsd/roadmap.json |
| gsd-tasks | yes | present | - | projects/bench-smoke/gsd/TASKS.md |
| gsd2-bundle | yes | present | - | projects/bench-smoke/gsd/gsd2-bundle.json |
| gsd2-process-snapshots | no | missing | 0 | projects/bench-smoke/gsd/process/gsd2-process-*.json |
| execution-runs | yes | present | 1 | projects/bench-smoke/execution/run-*.json |
| playwright-plan | yes | present | - | projects/bench-smoke/verification/playwright-plan.json |
| playwright-captures | no | missing | 0 | projects/bench-smoke/verification/playwright-captures/target-*.png |
| playwright-traces | no | missing | 0 | projects/bench-smoke/verification/playwright-captures/target-*.zip |
| healer-proposals | no | missing | 0 | projects/bench-smoke/verification/healer-proposals/healer-*.json |
| evaluation-plan | yes | present | - | projects/bench-smoke/evaluation/evaluation-plan.json |
| benchmark-runs | no | present | 1 | projects/bench-smoke/evaluation/benchmark-run-*.json |
| infra-registry | yes | present | - | projects/bench-smoke/infrastructure/registry.json |
| infra-snapshots | no | missing | 0 | projects/bench-smoke/infrastructure/infra-snapshot-*.json |
| control-report | yes | present | - | projects/bench-smoke/control/merge-readiness.json |
| console-data | no | present | - | projects/bench-smoke/console/console-data.json |
| console-html | no | present | - | projects/bench-smoke/console/index.html |
| console-visual-checks | no | present | - | projects/bench-smoke/console/visual-checks.json |
| console-browser-checks | no | present | - | projects/bench-smoke/console/browser-checks.json |
| recovery-report | no | missing | - | projects/bench-smoke/control/recovery-report.json |
| usage-report | no | missing | - | projects/bench-smoke/evaluation/usage-report.json |
| behavior-checks | no | present | - | projects/bench-smoke/evaluation/behavior-checks.json |
| gbrain-export | no | present | - | projects/bench-smoke/integrations/gbrain/gbrain-export.json |
| github-snapshots | no | missing | 0 | projects/bench-smoke/integrations/github/github-snapshot-*.json |
| approval-records | no | missing | 0 | projects/bench-smoke/control/approvals/approval-*.json |
| mutation-readiness-plans | no | missing | 0 | projects/bench-smoke/control/mutation-readiness/mutation-readiness-*.json |
| mutation-readiness-audit | no | missing | - | projects/bench-smoke/control/mutation-readiness-audit.json |
| extraction-results | no | missing | 0 | projects/bench-smoke/extractions/extraction-*.json |
| extraction-runner-plans | no | missing | 0 | projects/bench-smoke/extractions/plans/extraction-plan-*.json |
| coordination-records | no | missing | 0 | projects/bench-smoke/coordination/**/*.json |
| hermes-cron-snapshots | no | missing | 0 | projects/bench-smoke/coordination/hermes/hermes-cron-*.json |
| hermes-cron-proposals | no | missing | 0 | projects/bench-smoke/coordination/hermes/hermes-cron-proposal-*.json |
| deployment-snapshots | no | missing | 0 | projects/bench-smoke/deployment/deployment-*.json |
