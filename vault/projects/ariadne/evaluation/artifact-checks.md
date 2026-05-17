# Artifact Checks

Project: ariadne
Status: passed
Generated: 2026-05-17T09:51:58.717Z

## Summary

- Required checks: 13
- Optional checks: 44
- Present artifacts: 48
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
| gsd2-process-snapshots | no | present | 1 | projects/ariadne/gsd/process/gsd2-process-*.json |
| execution-runs | yes | present | 4 | projects/ariadne/execution/run-*.json |
| playwright-plan | yes | present | - | projects/ariadne/verification/playwright-plan.json |
| playwright-captures | no | present | 2 | projects/ariadne/verification/playwright-captures/target-*.png |
| playwright-traces | no | present | 2 | projects/ariadne/verification/playwright-captures/target-*.zip |
| healer-proposals | no | present | 1 | projects/ariadne/verification/healer-proposals/healer-*.json |
| evaluation-plan | yes | present | - | projects/ariadne/evaluation/evaluation-plan.json |
| benchmark-runs | no | missing | 0 | projects/ariadne/evaluation/benchmark-run-*.json |
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
| mutation-readiness-plans | no | present | 1 | projects/ariadne/control/mutation-readiness/mutation-readiness-*.json |
| mutation-readiness-audit | no | present | - | projects/ariadne/control/mutation-readiness-audit.json |
| live-adapter-readiness | no | present | - | projects/ariadne/control/live-adapter-readiness.json |
| live-adapter-next-actions | no | present | - | projects/ariadne/control/live-adapter-next-actions.json |
| live-adapter-approval-pack | no | present | - | projects/ariadne/control/live-adapter-approval-pack.json |
| live-adapter-approval-reviews | no | missing | 0 | projects/ariadne/control/live-adapter-approval-reviews/approval-review-*.json |
| live-adapter-approval-review-audit | no | present | - | projects/ariadne/control/live-adapter-approval-review-audit.json |
| live-adapter-dossiers | no | present | 6 | projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-*.json |
| live-adapter-cutover-audit | no | present | - | projects/ariadne/control/live-adapter-cutover-audit.json |
| live-adapter-review-session | no | present | - | projects/ariadne/control/live-adapter-review-session.json |
| live-adapter-evidence-templates | no | present | - | projects/ariadne/control/live-adapter-evidence-templates.json |
| live-adapter-operator-evidence-checks | no | present | 13 | projects/ariadne/control/live-adapter-operator-evidence-checks/operator-evidence-check-*.json |
| live-adapter-operator-evidence-check-all | no | present | - | projects/ariadne/control/live-adapter-operator-evidence-check-all.json |
| live-adapter-operator-evidence | no | missing | 0 | projects/ariadne/control/live-adapter-operator-evidence/operator-evidence-*.json |
| live-adapter-operator-evidence-audit | no | present | - | projects/ariadne/control/live-adapter-operator-evidence-audit.json |
| live-adapter-operator-evidence-workplan | no | present | - | projects/ariadne/control/live-adapter-operator-evidence-workplan.json |
| live-adapter-operator-evidence-queue | no | present | - | projects/ariadne/control/live-adapter-operator-evidence-queue.json |
| live-adapter-operator-evidence-workspace | no | present | - | projects/ariadne/control/live-adapter-operator-evidence-workspace.json |
| live-adapter-operator-evidence-workspace-files | no | present | 36 | projects/ariadne/control/operator-evidence/**/*.md |
| roadmap-completion-audit | no | present | - | projects/ariadne/control/roadmap-completion-audit.json |
| mutation-dry-runs | no | missing | 0 | projects/ariadne/control/mutation-dry-runs/mutation-dry-run-*.json |
| mutation-executions | no | missing | 0 | projects/ariadne/control/mutation-executions/mutation-execution-*.json |
| extraction-results | no | missing | 0 | projects/ariadne/extractions/extraction-*.json |
| extraction-runner-plans | no | missing | 0 | projects/ariadne/extractions/plans/extraction-plan-*.json |
| coordination-records | no | present | 4 | projects/ariadne/coordination/**/*.json |
| hermes-cron-snapshots | no | missing | 0 | projects/ariadne/coordination/hermes/hermes-cron-*.json |
| hermes-cron-proposals | no | missing | 0 | projects/ariadne/coordination/hermes/hermes-cron-proposal-*.json |
| deployment-snapshots | no | present | 1 | projects/ariadne/deployment/deployment-*.json |
