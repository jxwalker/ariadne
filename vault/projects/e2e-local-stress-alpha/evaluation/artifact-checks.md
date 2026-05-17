# Artifact Checks

Project: e2e-local-stress-alpha
Status: passed
Generated: 2026-05-17T10:45:17.877Z

## Summary

- Required checks: 13
- Optional checks: 44
- Present artifacts: 15
- Missing required artifacts: 0

## Checks

| Id | Required | Status | Count | Path |
| --- | --- | --- | --- | --- |
| manifest | yes | present | - | projects/e2e-local-stress-alpha/manifest.jsonl |
| hot-index | yes | present | - | projects/e2e-local-stress-alpha/HOT_INDEX.md |
| dossier | yes | present | 1 | projects/e2e-local-stress-alpha/context/dossier-*.md |
| prd-json | yes | present | - | projects/e2e-local-stress-alpha/requirements/prd.json |
| prd-markdown | yes | present | - | projects/e2e-local-stress-alpha/requirements/PRD.md |
| gsd-roadmap | yes | present | - | projects/e2e-local-stress-alpha/gsd/roadmap.json |
| gsd-tasks | yes | present | - | projects/e2e-local-stress-alpha/gsd/TASKS.md |
| gsd2-bundle | yes | present | - | projects/e2e-local-stress-alpha/gsd/gsd2-bundle.json |
| gsd2-process-snapshots | no | missing | 0 | projects/e2e-local-stress-alpha/gsd/process/gsd2-process-*.json |
| execution-runs | yes | present | 1 | projects/e2e-local-stress-alpha/execution/run-*.json |
| playwright-plan | yes | present | - | projects/e2e-local-stress-alpha/verification/playwright-plan.json |
| playwright-captures | no | missing | 0 | projects/e2e-local-stress-alpha/verification/playwright-captures/target-*.png |
| playwright-traces | no | missing | 0 | projects/e2e-local-stress-alpha/verification/playwright-captures/target-*.zip |
| healer-proposals | no | missing | 0 | projects/e2e-local-stress-alpha/verification/healer-proposals/healer-*.json |
| evaluation-plan | yes | present | - | projects/e2e-local-stress-alpha/evaluation/evaluation-plan.json |
| benchmark-runs | no | missing | 0 | projects/e2e-local-stress-alpha/evaluation/benchmark-run-*.json |
| infra-registry | yes | present | - | projects/e2e-local-stress-alpha/infrastructure/registry.json |
| infra-snapshots | no | missing | 0 | projects/e2e-local-stress-alpha/infrastructure/infra-snapshot-*.json |
| control-report | yes | present | - | projects/e2e-local-stress-alpha/control/merge-readiness.json |
| console-data | no | missing | - | projects/e2e-local-stress-alpha/console/console-data.json |
| console-html | no | missing | - | projects/e2e-local-stress-alpha/console/index.html |
| console-visual-checks | no | missing | - | projects/e2e-local-stress-alpha/console/visual-checks.json |
| console-browser-checks | no | missing | - | projects/e2e-local-stress-alpha/console/browser-checks.json |
| recovery-report | no | missing | - | projects/e2e-local-stress-alpha/control/recovery-report.json |
| usage-report | no | missing | - | projects/e2e-local-stress-alpha/evaluation/usage-report.json |
| behavior-checks | no | present | - | projects/e2e-local-stress-alpha/evaluation/behavior-checks.json |
| gbrain-export | no | present | - | projects/e2e-local-stress-alpha/integrations/gbrain/gbrain-export.json |
| github-snapshots | no | missing | 0 | projects/e2e-local-stress-alpha/integrations/github/github-snapshot-*.json |
| approval-records | no | missing | 0 | projects/e2e-local-stress-alpha/control/approvals/approval-*.json |
| mutation-readiness-plans | no | missing | 0 | projects/e2e-local-stress-alpha/control/mutation-readiness/mutation-readiness-*.json |
| mutation-readiness-audit | no | missing | - | projects/e2e-local-stress-alpha/control/mutation-readiness-audit.json |
| live-adapter-readiness | no | missing | - | projects/e2e-local-stress-alpha/control/live-adapter-readiness.json |
| live-adapter-next-actions | no | missing | - | projects/e2e-local-stress-alpha/control/live-adapter-next-actions.json |
| live-adapter-approval-pack | no | missing | - | projects/e2e-local-stress-alpha/control/live-adapter-approval-pack.json |
| live-adapter-approval-reviews | no | missing | 0 | projects/e2e-local-stress-alpha/control/live-adapter-approval-reviews/approval-review-*.json |
| live-adapter-approval-review-audit | no | missing | - | projects/e2e-local-stress-alpha/control/live-adapter-approval-review-audit.json |
| live-adapter-dossiers | no | missing | 0 | projects/e2e-local-stress-alpha/control/live-adapter-dossiers/live-adapter-dossier-*.json |
| live-adapter-cutover-audit | no | missing | - | projects/e2e-local-stress-alpha/control/live-adapter-cutover-audit.json |
| live-adapter-review-session | no | missing | - | projects/e2e-local-stress-alpha/control/live-adapter-review-session.json |
| live-adapter-evidence-templates | no | missing | - | projects/e2e-local-stress-alpha/control/live-adapter-evidence-templates.json |
| live-adapter-operator-evidence-checks | no | missing | 0 | projects/e2e-local-stress-alpha/control/live-adapter-operator-evidence-checks/operator-evidence-check-*.json |
| live-adapter-operator-evidence-check-all | no | missing | - | projects/e2e-local-stress-alpha/control/live-adapter-operator-evidence-check-all.json |
| live-adapter-operator-evidence | no | missing | 0 | projects/e2e-local-stress-alpha/control/live-adapter-operator-evidence/operator-evidence-*.json |
| live-adapter-operator-evidence-audit | no | missing | - | projects/e2e-local-stress-alpha/control/live-adapter-operator-evidence-audit.json |
| live-adapter-operator-evidence-workplan | no | missing | - | projects/e2e-local-stress-alpha/control/live-adapter-operator-evidence-workplan.json |
| live-adapter-operator-evidence-queue | no | missing | - | projects/e2e-local-stress-alpha/control/live-adapter-operator-evidence-queue.json |
| live-adapter-operator-evidence-workspace | no | missing | - | projects/e2e-local-stress-alpha/control/live-adapter-operator-evidence-workspace.json |
| live-adapter-operator-evidence-workspace-files | no | missing | 0 | projects/e2e-local-stress-alpha/control/operator-evidence/**/*.md |
| roadmap-completion-audit | no | missing | - | projects/e2e-local-stress-alpha/control/roadmap-completion-audit.json |
| mutation-dry-runs | no | missing | 0 | projects/e2e-local-stress-alpha/control/mutation-dry-runs/mutation-dry-run-*.json |
| mutation-executions | no | missing | 0 | projects/e2e-local-stress-alpha/control/mutation-executions/mutation-execution-*.json |
| extraction-results | no | missing | 0 | projects/e2e-local-stress-alpha/extractions/extraction-*.json |
| extraction-runner-plans | no | missing | 0 | projects/e2e-local-stress-alpha/extractions/plans/extraction-plan-*.json |
| coordination-records | no | missing | 0 | projects/e2e-local-stress-alpha/coordination/**/*.json |
| hermes-cron-snapshots | no | missing | 0 | projects/e2e-local-stress-alpha/coordination/hermes/hermes-cron-*.json |
| hermes-cron-proposals | no | missing | 0 | projects/e2e-local-stress-alpha/coordination/hermes/hermes-cron-proposal-*.json |
| deployment-snapshots | no | missing | 0 | projects/e2e-local-stress-alpha/deployment/deployment-*.json |
