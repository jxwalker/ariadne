# Artifact Checks

Project: e2e-local-stress-beta
Status: passed
Generated: 2026-05-17T10:45:17.889Z

## Summary

- Required checks: 13
- Optional checks: 44
- Present artifacts: 16
- Missing required artifacts: 0

## Checks

| Id | Required | Status | Count | Path |
| --- | --- | --- | --- | --- |
| manifest | yes | present | - | projects/e2e-local-stress-beta/manifest.jsonl |
| hot-index | yes | present | - | projects/e2e-local-stress-beta/HOT_INDEX.md |
| dossier | yes | present | 1 | projects/e2e-local-stress-beta/context/dossier-*.md |
| prd-json | yes | present | - | projects/e2e-local-stress-beta/requirements/prd.json |
| prd-markdown | yes | present | - | projects/e2e-local-stress-beta/requirements/PRD.md |
| gsd-roadmap | yes | present | - | projects/e2e-local-stress-beta/gsd/roadmap.json |
| gsd-tasks | yes | present | - | projects/e2e-local-stress-beta/gsd/TASKS.md |
| gsd2-bundle | yes | present | - | projects/e2e-local-stress-beta/gsd/gsd2-bundle.json |
| gsd2-process-snapshots | no | missing | 0 | projects/e2e-local-stress-beta/gsd/process/gsd2-process-*.json |
| execution-runs | yes | present | 1 | projects/e2e-local-stress-beta/execution/run-*.json |
| playwright-plan | yes | present | - | projects/e2e-local-stress-beta/verification/playwright-plan.json |
| playwright-captures | no | missing | 0 | projects/e2e-local-stress-beta/verification/playwright-captures/target-*.png |
| playwright-traces | no | missing | 0 | projects/e2e-local-stress-beta/verification/playwright-captures/target-*.zip |
| healer-proposals | no | missing | 0 | projects/e2e-local-stress-beta/verification/healer-proposals/healer-*.json |
| evaluation-plan | yes | present | - | projects/e2e-local-stress-beta/evaluation/evaluation-plan.json |
| benchmark-runs | no | missing | 0 | projects/e2e-local-stress-beta/evaluation/benchmark-run-*.json |
| infra-registry | yes | present | - | projects/e2e-local-stress-beta/infrastructure/registry.json |
| infra-snapshots | no | present | 1 | projects/e2e-local-stress-beta/infrastructure/infra-snapshot-*.json |
| control-report | yes | present | - | projects/e2e-local-stress-beta/control/merge-readiness.json |
| console-data | no | missing | - | projects/e2e-local-stress-beta/console/console-data.json |
| console-html | no | missing | - | projects/e2e-local-stress-beta/console/index.html |
| console-visual-checks | no | missing | - | projects/e2e-local-stress-beta/console/visual-checks.json |
| console-browser-checks | no | missing | - | projects/e2e-local-stress-beta/console/browser-checks.json |
| recovery-report | no | missing | - | projects/e2e-local-stress-beta/control/recovery-report.json |
| usage-report | no | missing | - | projects/e2e-local-stress-beta/evaluation/usage-report.json |
| behavior-checks | no | present | - | projects/e2e-local-stress-beta/evaluation/behavior-checks.json |
| gbrain-export | no | present | - | projects/e2e-local-stress-beta/integrations/gbrain/gbrain-export.json |
| github-snapshots | no | missing | 0 | projects/e2e-local-stress-beta/integrations/github/github-snapshot-*.json |
| approval-records | no | missing | 0 | projects/e2e-local-stress-beta/control/approvals/approval-*.json |
| mutation-readiness-plans | no | missing | 0 | projects/e2e-local-stress-beta/control/mutation-readiness/mutation-readiness-*.json |
| mutation-readiness-audit | no | missing | - | projects/e2e-local-stress-beta/control/mutation-readiness-audit.json |
| live-adapter-readiness | no | missing | - | projects/e2e-local-stress-beta/control/live-adapter-readiness.json |
| live-adapter-next-actions | no | missing | - | projects/e2e-local-stress-beta/control/live-adapter-next-actions.json |
| live-adapter-approval-pack | no | missing | - | projects/e2e-local-stress-beta/control/live-adapter-approval-pack.json |
| live-adapter-approval-reviews | no | missing | 0 | projects/e2e-local-stress-beta/control/live-adapter-approval-reviews/approval-review-*.json |
| live-adapter-approval-review-audit | no | missing | - | projects/e2e-local-stress-beta/control/live-adapter-approval-review-audit.json |
| live-adapter-dossiers | no | missing | 0 | projects/e2e-local-stress-beta/control/live-adapter-dossiers/live-adapter-dossier-*.json |
| live-adapter-cutover-audit | no | missing | - | projects/e2e-local-stress-beta/control/live-adapter-cutover-audit.json |
| live-adapter-review-session | no | missing | - | projects/e2e-local-stress-beta/control/live-adapter-review-session.json |
| live-adapter-evidence-templates | no | missing | - | projects/e2e-local-stress-beta/control/live-adapter-evidence-templates.json |
| live-adapter-operator-evidence-checks | no | missing | 0 | projects/e2e-local-stress-beta/control/live-adapter-operator-evidence-checks/operator-evidence-check-*.json |
| live-adapter-operator-evidence-check-all | no | missing | - | projects/e2e-local-stress-beta/control/live-adapter-operator-evidence-check-all.json |
| live-adapter-operator-evidence | no | missing | 0 | projects/e2e-local-stress-beta/control/live-adapter-operator-evidence/operator-evidence-*.json |
| live-adapter-operator-evidence-audit | no | missing | - | projects/e2e-local-stress-beta/control/live-adapter-operator-evidence-audit.json |
| live-adapter-operator-evidence-workplan | no | missing | - | projects/e2e-local-stress-beta/control/live-adapter-operator-evidence-workplan.json |
| live-adapter-operator-evidence-queue | no | missing | - | projects/e2e-local-stress-beta/control/live-adapter-operator-evidence-queue.json |
| live-adapter-operator-evidence-workspace | no | missing | - | projects/e2e-local-stress-beta/control/live-adapter-operator-evidence-workspace.json |
| live-adapter-operator-evidence-workspace-files | no | missing | 0 | projects/e2e-local-stress-beta/control/operator-evidence/**/*.md |
| roadmap-completion-audit | no | missing | - | projects/e2e-local-stress-beta/control/roadmap-completion-audit.json |
| mutation-dry-runs | no | missing | 0 | projects/e2e-local-stress-beta/control/mutation-dry-runs/mutation-dry-run-*.json |
| mutation-executions | no | missing | 0 | projects/e2e-local-stress-beta/control/mutation-executions/mutation-execution-*.json |
| extraction-results | no | missing | 0 | projects/e2e-local-stress-beta/extractions/extraction-*.json |
| extraction-runner-plans | no | missing | 0 | projects/e2e-local-stress-beta/extractions/plans/extraction-plan-*.json |
| coordination-records | no | missing | 0 | projects/e2e-local-stress-beta/coordination/**/*.json |
| hermes-cron-snapshots | no | missing | 0 | projects/e2e-local-stress-beta/coordination/hermes/hermes-cron-*.json |
| hermes-cron-proposals | no | missing | 0 | projects/e2e-local-stress-beta/coordination/hermes/hermes-cron-proposal-*.json |
| deployment-snapshots | no | missing | 0 | projects/e2e-local-stress-beta/deployment/deployment-*.json |
