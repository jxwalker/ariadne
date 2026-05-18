# Live Adapter Next Actions

Project: ariadne
Status: actions_required
Generated: 2026-05-18T15:10:37.333Z
Readiness: projects/ariadne/control/live-adapter-readiness.json
Operator evidence audit: projects/ariadne/control/live-adapter-operator-evidence-audit.json

## Summary

- Targets: 6
- Ready: 0
- Blocked: 6
- Action items: 36

## Targets

### github

Readiness: blocked
Execute command: github-mutation-execute
Blockers: no accepted operator review exists for live-adapter approval packet; no readiness plan passes audit; no passed dry-run evidence exists for an audit-passed plan; no passed target-guarded execution evidence exists

| Action | Status | Rationale | Command |
| --- | --- | --- | --- |
| Prepare, fill, and import operator evidence | pending | The target has no imported operator evidence record. Refresh the target packet, fill the generated workspace file with real observations, and import it before packet review or cutover. | npm run ariadne -- live-adapter-operator-evidence-next --project <project> --target github |
| Record operator review of the approval packet | pending | Before a live adapter can replace placeholder shell commands, an operator must review the target packet and record whether the packet is accepted, rejected, or needs changes. This does not approve live mutation. | npm run ariadne -- live-adapter-approval-review --project <project> --target github --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence> |
| Resolve existing readiness plan blockers | pending | Existing plan mutation-readiness-github-2026-05-16T16-50-54-241Z is blocked by: approval state is approval_required; approval record is requested; post-action verification command is missing. Approve the existing plan only after operator review, and regenerate it with post-action verification if that gate is missing. | Review mutation-readiness-github-2026-05-16T16-50-54-241Z; after operator approval, record approval-decision, ensure --post-verify is present, then rerun npm run ariadne -- mutation-readiness-audit --project <project> |
| Run the reviewed dry-run command | pending | Dry-run evidence proves the reviewed command path before the live command is eligible for target-guarded execution. | After mutation-readiness-github-2026-05-16T16-50-54-241Z passes audit, run npm run ariadne -- mutation-dry-run --project <project> --plan mutation-readiness-github-2026-05-16T16-50-54-241Z |
| Capture target-guarded execution evidence | blocked | The live adapter should only replace placeholder shell commands after the audited target wrapper has successfully verified the same target and recorded post-action verification evidence. | Run a passed dry-run for an audit-passed plan first. |

### deployment

Readiness: blocked
Execute command: deployment-mutation-execute
Blockers: no readiness plan passes audit; no passed dry-run evidence exists for an audit-passed plan; no passed target-guarded execution evidence exists

| Action | Status | Rationale | Command |
| --- | --- | --- | --- |
| Resolve existing readiness plan blockers | pending | Existing plan mutation-readiness-deployment-2026-05-18T14-54-52-671Z is blocked by: approval state is approval_required; approval record is requested. Approve the existing plan only after operator review, and regenerate it with post-action verification if that gate is missing. | Review mutation-readiness-deployment-2026-05-18T14-54-52-671Z; after operator approval, record approval-decision, ensure --post-verify is present, then rerun npm run ariadne -- mutation-readiness-audit --project <project> |
| Run the reviewed dry-run command | pending | Dry-run evidence proves the reviewed command path before the live command is eligible for target-guarded execution. | After mutation-readiness-deployment-2026-05-18T14-54-52-671Z passes audit, run npm run ariadne -- mutation-dry-run --project <project> --plan mutation-readiness-deployment-2026-05-18T14-54-52-671Z |
| Capture target-guarded execution evidence | blocked | The live adapter should only replace placeholder shell commands after the audited target wrapper has successfully verified the same target and recorded post-action verification evidence. | Run a passed dry-run for an audit-passed plan first. |

### hermes-cron

Readiness: blocked
Execute command: hermes-cron-mutation-execute
Blockers: no accepted operator review exists for live-adapter approval packet; no target-specific readiness plan exists; no readiness plan passes audit; no passed dry-run evidence exists for an audit-passed plan; no passed target-guarded execution evidence exists

| Action | Status | Rationale | Command |
| --- | --- | --- | --- |
| Prepare, fill, and import operator evidence | pending | The target has no imported operator evidence record. Refresh the target packet, fill the generated workspace file with real observations, and import it before packet review or cutover. | npm run ariadne -- live-adapter-operator-evidence-next --project <project> --target hermes-cron |
| Record operator review of the approval packet | pending | Before a live adapter can replace placeholder shell commands, an operator must review the target packet and record whether the packet is accepted, rejected, or needs changes. This does not approve live mutation. | npm run ariadne -- live-adapter-approval-review --project <project> --target hermes-cron --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence> |
| Record an operator approval request | pending | Live adapters need explicit human authorization before any target-specific readiness plan can be treated as reviewable. | npm run ariadne -- approval-request --project <project> --by <operator> --target hermes-cron --action "<bounded action>" --risk <low\|medium\|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence> |
| Create a target-specific mutation-readiness plan | blocked | Ariadne needs reviewed dry-run, live, post-verification, rollback, auth evidence, and approval refs before any live adapter can be wired. | npm run ariadne -- hermes-cron-mutation-plan --project <project> --action <create\|update\|enable\|disable\|delete> --job <id> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id> |
| Fix readiness audit blockers | pending | The readiness audit must pass before dry-run or execution evidence can count for a live adapter. | npm run ariadne -- mutation-readiness-audit --project <project> |
| Run the reviewed dry-run command | blocked | Dry-run evidence proves the reviewed command path before the live command is eligible for target-guarded execution. | Create and audit-pass a target-specific readiness plan first. |
| Capture target-guarded execution evidence | blocked | The live adapter should only replace placeholder shell commands after the audited target wrapper has successfully verified the same target and recorded post-action verification evidence. | Run a passed dry-run for an audit-passed plan first. |

### openscorpion

Readiness: blocked
Execute command: openscorpion-mutation-execute
Blockers: no accepted operator review exists for live-adapter approval packet; no target-specific readiness plan exists; no readiness plan passes audit; no passed dry-run evidence exists for an audit-passed plan; no passed target-guarded execution evidence exists

| Action | Status | Rationale | Command |
| --- | --- | --- | --- |
| Prepare, fill, and import operator evidence | pending | The target has no imported operator evidence record. Refresh the target packet, fill the generated workspace file with real observations, and import it before packet review or cutover. | npm run ariadne -- live-adapter-operator-evidence-next --project <project> --target openscorpion |
| Record operator review of the approval packet | pending | Before a live adapter can replace placeholder shell commands, an operator must review the target packet and record whether the packet is accepted, rejected, or needs changes. This does not approve live mutation. | npm run ariadne -- live-adapter-approval-review --project <project> --target openscorpion --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence> |
| Record an operator approval request | pending | Live adapters need explicit human authorization before any target-specific readiness plan can be treated as reviewable. | npm run ariadne -- approval-request --project <project> --by <operator> --target openscorpion --action "<bounded action>" --risk <low\|medium\|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence> |
| Create a target-specific mutation-readiness plan | blocked | Ariadne needs reviewed dry-run, live, post-verification, rollback, auth evidence, and approval refs before any live adapter can be wired. | npm run ariadne -- openscorpion-mutation-plan --project <project> --activity <id> --type <type> --action <submit-activity\|update-activity\|withdraw-activity> --route <governed\|staging> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id> |
| Fix readiness audit blockers | pending | The readiness audit must pass before dry-run or execution evidence can count for a live adapter. | npm run ariadne -- mutation-readiness-audit --project <project> |
| Run the reviewed dry-run command | blocked | Dry-run evidence proves the reviewed command path before the live command is eligible for target-guarded execution. | Create and audit-pass a target-specific readiness plan first. |
| Capture target-guarded execution evidence | blocked | The live adapter should only replace placeholder shell commands after the audited target wrapper has successfully verified the same target and recorded post-action verification evidence. | Run a passed dry-run for an audit-passed plan first. |

### gsd2

Readiness: blocked
Execute command: gsd2-mutation-execute
Blockers: no accepted operator review exists for live-adapter approval packet; no target-specific readiness plan exists; no readiness plan passes audit; no passed dry-run evidence exists for an audit-passed plan; no passed target-guarded execution evidence exists

| Action | Status | Rationale | Command |
| --- | --- | --- | --- |
| Prepare, fill, and import operator evidence | pending | The target has no imported operator evidence record. Refresh the target packet, fill the generated workspace file with real observations, and import it before packet review or cutover. | npm run ariadne -- live-adapter-operator-evidence-next --project <project> --target gsd2 |
| Record operator review of the approval packet | pending | Before a live adapter can replace placeholder shell commands, an operator must review the target packet and record whether the packet is accepted, rejected, or needs changes. This does not approve live mutation. | npm run ariadne -- live-adapter-approval-review --project <project> --target gsd2 --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence> |
| Record an operator approval request | pending | Live adapters need explicit human authorization before any target-specific readiness plan can be treated as reviewable. | npm run ariadne -- approval-request --project <project> --by <operator> --target gsd2 --action "<bounded action>" --risk <low\|medium\|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence> |
| Create a target-specific mutation-readiness plan | blocked | Ariadne needs reviewed dry-run, live, post-verification, rollback, auth evidence, and approval refs before any live adapter can be wired. | npm run ariadne -- gsd2-mutation-plan --project <project> --task <id> --mode <headless\|auto\|worktree> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id> |
| Fix readiness audit blockers | pending | The readiness audit must pass before dry-run or execution evidence can count for a live adapter. | npm run ariadne -- mutation-readiness-audit --project <project> |
| Run the reviewed dry-run command | blocked | Dry-run evidence proves the reviewed command path before the live command is eligible for target-guarded execution. | Create and audit-pass a target-specific readiness plan first. |
| Capture target-guarded execution evidence | blocked | The live adapter should only replace placeholder shell commands after the audited target wrapper has successfully verified the same target and recorded post-action verification evidence. | Run a passed dry-run for an audit-passed plan first. |

### notebooklm

Readiness: blocked
Execute command: notebooklm-mutation-execute
Blockers: no accepted operator review exists for live-adapter approval packet; no target-specific readiness plan exists; no readiness plan passes audit; no passed dry-run evidence exists for an audit-passed plan; no passed target-guarded execution evidence exists

| Action | Status | Rationale | Command |
| --- | --- | --- | --- |
| Prepare, fill, and import operator evidence | pending | The target has no imported operator evidence record. Refresh the target packet, fill the generated workspace file with real observations, and import it before packet review or cutover. | npm run ariadne -- live-adapter-operator-evidence-next --project <project> --target notebooklm |
| Record operator review of the approval packet | pending | Before a live adapter can replace placeholder shell commands, an operator must review the target packet and record whether the packet is accepted, rejected, or needs changes. This does not approve live mutation. | npm run ariadne -- live-adapter-approval-review --project <project> --target notebooklm --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence> |
| Record an operator approval request | pending | Live adapters need explicit human authorization before any target-specific readiness plan can be treated as reviewable. | npm run ariadne -- approval-request --project <project> --by <operator> --target notebooklm --action "<bounded action>" --risk <low\|medium\|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence> |
| Create a target-specific mutation-readiness plan | blocked | Ariadne needs reviewed dry-run, live, post-verification, rollback, auth evidence, and approval refs before any live adapter can be wired. | npm run ariadne -- notebooklm-mutation-plan --project <project> --notebook <id> --action <create-source\|refresh-source\|generate-summary\|export-notes> --scope <scope> --auth-evidence <paths> --dry-run <cmd> --live-command <cmd> --post-verify <cmd> --rollback <text> --approval <approval-id> |
| Fix readiness audit blockers | pending | The readiness audit must pass before dry-run or execution evidence can count for a live adapter. | npm run ariadne -- mutation-readiness-audit --project <project> |
| Run the reviewed dry-run command | blocked | Dry-run evidence proves the reviewed command path before the live command is eligible for target-guarded execution. | Create and audit-pass a target-specific readiness plan first. |
| Capture target-guarded execution evidence | blocked | The live adapter should only replace placeholder shell commands after the audited target wrapper has successfully verified the same target and recorded post-action verification evidence. | Run a passed dry-run for an audit-passed plan first. |
