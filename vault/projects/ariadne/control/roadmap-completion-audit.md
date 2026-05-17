# Roadmap Completion Audit

Project: ariadne
Status: blocked
Generated: 2026-05-17T05:42:03.952Z

## Summary

- Requirements: 9
- Passed: 6
- Blocked: 3
- Advisory: 0

## Requirements

| Requirement | Status | Detail | Next commands | Evidence |
| --- | --- | --- | --- | --- |
| Core pipeline artifacts are present | passed | 42 artifacts present; 0 required missing. | - | projects/ariadne/evaluation/artifact-checks.json |
| Behavior confidence checks are passing | passed | 6/6 behavior checks passed; 0 failed. | - | projects/ariadne/evaluation/behavior-checks.json |
| Evaluation harness has current trend evidence | passed | Evaluation trend status is stable; latest score is 86. | - | projects/ariadne/evaluation/evaluation-trends.json |
| Orchestration console is rendered and browser-checked | passed | Visual checks: passed; browser checks: passed. | - | projects/ariadne/console/visual-checks.json<br>projects/ariadne/console/browser-checks.json |
| Sleep, memory, agent mail, and lease records are visible | passed | sleep=1, memory=1, mail=1, leases=1. | npm run ariadne -- sleep-record --project ariadne --scope <scope> --summary <text><br>npm run ariadne -- memory-proposal --project ariadne --title <title> --proposal <text><br>npm run ariadne -- agent-mail --project ariadne --from <agent> --to <agent> --subject <text> --body <text> | projects/ariadne/console/console-data.json |
| GBrain is incorporated as advisory memory | passed | 6 live-adapter dossier(s) include GBrain advisory queries; export=present; imported reports=1. | - | projects/ariadne/control/live-adapter-dossiers<br>projects/ariadne/integrations/gbrain/gbrain-export.json |
| All live-adapter targets have complete operator evidence | blocked | 0/6 targets complete; 6 missing evidence. | npm run ariadne -- live-adapter-evidence-templates --project ariadne<br>npm run ariadne -- live-adapter-operator-evidence --project ariadne --target <target> --from vault/projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-<target>.md --by <operator><br>npm run ariadne -- live-adapter-operator-evidence-audit --project ariadne | projects/ariadne/control/live-adapter-operator-evidence-audit.json |
| Live-adapter cutover gates are ready | blocked | 0/6 targets ready; 42 gates blocked. | npm run ariadne -- live-adapter-cutover-audit --project ariadne | projects/ariadne/control/live-adapter-cutover-audit.json |
| Operator review session reflects live-adapter state | blocked | 0/6 targets ready for adapter work; 6 still require operator review. | npm run ariadne -- live-adapter-review-session --project ariadne | projects/ariadne/control/live-adapter-review-session.json |
