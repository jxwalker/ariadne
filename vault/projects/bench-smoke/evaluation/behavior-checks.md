# Behavior Checks

Project: bench-smoke
Status: warning
Generated: 2026-05-16T18:29:06.694Z

## Summary

- Passed: 3
- Warnings: 3
- Failed: 0

## Checks

| Id | Status | Notes |
| --- | --- | --- |
| approved-fixture | warning | No approved review or approved fixture is present yet. |
| execution-mutation-gates | passed | Execution runs include explicit human approval gates before external mutation. |
| approval-workflow-records | warning | No explicit approval request records exist yet for mutation-capable adapters. |
| infra-read-only | passed | Infrastructure evidence is limited to manual, manifest, or live_read_only snapshot kinds. |
| governance-drafts-non-submitting | passed | OpenScorpion activity records are drafts with submit=false. |
| worktree-guard-fixture | warning | Worktree guard is available as a behavior fixture; record it for each real execution run before applying worktrees. |
