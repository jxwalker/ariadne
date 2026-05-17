# Artifact Checks

Project: e2e-local-smoke
Status: passed
Generated: 2026-05-17T10:46:05.362Z

## Summary

- Required checks: 13
- Optional checks: 44
- Present artifacts: 20
- Missing required artifacts: 0

## Checks

| Id | Required | Status | Count | Path |
| --- | --- | --- | --- | --- |
| manifest | yes | present | - | projects/e2e-local-smoke/manifest.jsonl |
| hot-index | yes | present | - | projects/e2e-local-smoke/HOT_INDEX.md |
| dossier | yes | present | 1 | projects/e2e-local-smoke/context/dossier-*.md |
| prd-json | yes | present | - | projects/e2e-local-smoke/requirements/prd.json |
| prd-markdown | yes | present | - | projects/e2e-local-smoke/requirements/PRD.md |
| gsd-roadmap | yes | present | - | projects/e2e-local-smoke/gsd/roadmap.json |
| gsd-tasks | yes | present | - | projects/e2e-local-smoke/gsd/TASKS.md |
| gsd2-bundle | yes | present | - | projects/e2e-local-smoke/gsd/gsd2-bundle.json |
| gsd2-process-snapshots | no | missing | 0 | projects/e2e-local-smoke/gsd/process/gsd2-process-*.json |
| execution-runs | yes | present | 1 | projects/e2e-local-smoke/execution/run-*.json |
| playwright-plan | yes | present | - | projects/e2e-local-smoke/verification/playwright-plan.json |
| playwright-captures | no | missing | 0 | projects/e2e-local-smoke/verification/playwright-captures/target-*.png |
| playwright-traces | no | missing | 0 | projects/e2e-local-smoke/verification/playwright-captures/target-*.zip |
| healer-proposals | no | missing | 0 | projects/e2e-local-smoke/verification/healer-proposals/healer-*.json |
| evaluation-plan | yes | present | - | projects/e2e-local-smoke/evaluation/evaluation-plan.json |
| benchmark-runs | no | present | 1 | projects/e2e-local-smoke/evaluation/benchmark-run-*.json |
| infra-registry | yes | present | - | projects/e2e-local-smoke/infrastructure/registry.json |
| infra-snapshots | no | missing | 0 | projects/e2e-local-smoke/infrastructure/infra-snapshot-*.json |
| control-report | yes | present | - | projects/e2e-local-smoke/control/merge-readiness.json |
| console-data | no | present | - | projects/e2e-local-smoke/console/console-data.json |
| console-html | no | present | - | projects/e2e-local-smoke/console/index.html |
| console-visual-checks | no | present | - | projects/e2e-local-smoke/console/visual-checks.json |
| console-browser-checks | no | present | - | projects/e2e-local-smoke/console/browser-checks.json |
| recovery-report | no | missing | - | projects/e2e-local-smoke/control/recovery-report.json |
| usage-report | no | missing | - | projects/e2e-local-smoke/evaluation/usage-report.json |
| behavior-checks | no | present | - | projects/e2e-local-smoke/evaluation/behavior-checks.json |
| gbrain-export | no | present | - | projects/e2e-local-smoke/integrations/gbrain/gbrain-export.json |
| github-snapshots | no | missing | 0 | projects/e2e-local-smoke/integrations/github/github-snapshot-*.json |
| approval-records | no | missing | 0 | projects/e2e-local-smoke/control/approvals/approval-*.json |
| mutation-readiness-plans | no | missing | 0 | projects/e2e-local-smoke/control/mutation-readiness/mutation-readiness-*.json |
| mutation-readiness-audit | no | missing | - | projects/e2e-local-smoke/control/mutation-readiness-audit.json |
| live-adapter-readiness | no | missing | - | projects/e2e-local-smoke/control/live-adapter-readiness.json |
| live-adapter-next-actions | no | missing | - | projects/e2e-local-smoke/control/live-adapter-next-actions.json |
| live-adapter-approval-pack | no | missing | - | projects/e2e-local-smoke/control/live-adapter-approval-pack.json |
| live-adapter-approval-reviews | no | missing | 0 | projects/e2e-local-smoke/control/live-adapter-approval-reviews/approval-review-*.json |
| live-adapter-approval-review-audit | no | missing | - | projects/e2e-local-smoke/control/live-adapter-approval-review-audit.json |
| live-adapter-dossiers | no | missing | 0 | projects/e2e-local-smoke/control/live-adapter-dossiers/live-adapter-dossier-*.json |
| live-adapter-cutover-audit | no | missing | - | projects/e2e-local-smoke/control/live-adapter-cutover-audit.json |
| live-adapter-review-session | no | missing | - | projects/e2e-local-smoke/control/live-adapter-review-session.json |
| live-adapter-evidence-templates | no | missing | - | projects/e2e-local-smoke/control/live-adapter-evidence-templates.json |
| live-adapter-operator-evidence-checks | no | missing | 0 | projects/e2e-local-smoke/control/live-adapter-operator-evidence-checks/operator-evidence-check-*.json |
| live-adapter-operator-evidence-check-all | no | missing | - | projects/e2e-local-smoke/control/live-adapter-operator-evidence-check-all.json |
| live-adapter-operator-evidence | no | missing | 0 | projects/e2e-local-smoke/control/live-adapter-operator-evidence/operator-evidence-*.json |
| live-adapter-operator-evidence-audit | no | missing | - | projects/e2e-local-smoke/control/live-adapter-operator-evidence-audit.json |
| live-adapter-operator-evidence-workplan | no | missing | - | projects/e2e-local-smoke/control/live-adapter-operator-evidence-workplan.json |
| live-adapter-operator-evidence-queue | no | missing | - | projects/e2e-local-smoke/control/live-adapter-operator-evidence-queue.json |
| live-adapter-operator-evidence-workspace | no | missing | - | projects/e2e-local-smoke/control/live-adapter-operator-evidence-workspace.json |
| live-adapter-operator-evidence-workspace-files | no | missing | 0 | projects/e2e-local-smoke/control/operator-evidence/**/*.md |
| roadmap-completion-audit | no | missing | - | projects/e2e-local-smoke/control/roadmap-completion-audit.json |
| mutation-dry-runs | no | missing | 0 | projects/e2e-local-smoke/control/mutation-dry-runs/mutation-dry-run-*.json |
| mutation-executions | no | missing | 0 | projects/e2e-local-smoke/control/mutation-executions/mutation-execution-*.json |
| extraction-results | no | missing | 0 | projects/e2e-local-smoke/extractions/extraction-*.json |
| extraction-runner-plans | no | missing | 0 | projects/e2e-local-smoke/extractions/plans/extraction-plan-*.json |
| coordination-records | no | missing | 0 | projects/e2e-local-smoke/coordination/**/*.json |
| hermes-cron-snapshots | no | missing | 0 | projects/e2e-local-smoke/coordination/hermes/hermes-cron-*.json |
| hermes-cron-proposals | no | missing | 0 | projects/e2e-local-smoke/coordination/hermes/hermes-cron-proposal-*.json |
| deployment-snapshots | no | missing | 0 | projects/e2e-local-smoke/deployment/deployment-*.json |
