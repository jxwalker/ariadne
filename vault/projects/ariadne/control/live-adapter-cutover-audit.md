# Live Adapter Cutover Audit

Project: ariadne
Status: blocked
Generated: 2026-05-17T03:27:57.982Z
Mutation allowed: false

This audit does not enable or execute live adapters. It verifies whether a target has enough current evidence to replace placeholder commands with a target-specific live adapter implementation.

## Summary

- Targets: 6
- Ready: 0
- Blocked: 6
- Passed gates: 12
- Blocked gates: 42
- Advisory gates: 6

## Targets

| Target | Status | Execute command | Ready plan | Accepted review | Blockers |
| --- | --- | --- | --- | --- | --- |
| github | blocked | github-mutation-execute | - | - | Operator evidence complete: No operator evidence record exists for github.<br>Current accepted operator packet review: no accepted operator review exists<br>Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.<br>Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.<br>Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.<br>Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.<br>Target-guarded execution evidence passed: No passed target-guarded execution evidence exists. |
| deployment | blocked | deployment-mutation-execute | - | - | Operator evidence complete: No operator evidence record exists for deployment.<br>Current accepted operator packet review: no accepted operator review exists<br>Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.<br>Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.<br>Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.<br>Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.<br>Target-guarded execution evidence passed: No passed target-guarded execution evidence exists. |
| hermes-cron | blocked | hermes-cron-mutation-execute | - | - | Operator evidence complete: No operator evidence record exists for hermes-cron.<br>Current accepted operator packet review: no accepted operator review exists<br>Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.<br>Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.<br>Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.<br>Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.<br>Target-guarded execution evidence passed: No passed target-guarded execution evidence exists. |
| openscorpion | blocked | openscorpion-mutation-execute | - | - | Operator evidence complete: No operator evidence record exists for openscorpion.<br>Current accepted operator packet review: no accepted operator review exists<br>Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.<br>Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.<br>Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.<br>Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.<br>Target-guarded execution evidence passed: No passed target-guarded execution evidence exists. |
| gsd2 | blocked | gsd2-mutation-execute | - | - | Operator evidence complete: No operator evidence record exists for gsd2.<br>Current accepted operator packet review: no accepted operator review exists<br>Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.<br>Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.<br>Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.<br>Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.<br>Target-guarded execution evidence passed: No passed target-guarded execution evidence exists. |
| notebooklm | blocked | notebooklm-mutation-execute | - | - | Operator evidence complete: No operator evidence record exists for notebooklm.<br>Current accepted operator packet review: no accepted operator review exists<br>Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.<br>Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.<br>Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.<br>Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.<br>Target-guarded execution evidence passed: No passed target-guarded execution evidence exists. |

## Gate Detail

### github

| Gate | Status | Detail |
| --- | --- | --- |
| Operator evidence complete | blocked | No operator evidence record exists for github. |
| Current accepted operator packet review | blocked | no accepted operator review exists |
| Mutation-readiness audit passed | blocked | No target-specific mutation-readiness plan passes audit. |
| Credential and auth-boundary evidence accepted | blocked | No passing readiness audit is available to prove auth evidence. |
| Rollback and post-verification contract accepted | blocked | A passing readiness audit is required to prove rollback and post-verification. |
| Dry-run evidence passed | blocked | No passed dry-run evidence exists for an audit-passed plan. |
| Target-guarded execution evidence passed | blocked | No passed target-guarded execution evidence exists. |
| Target execute wrapper is known | passed | Use github-mutation-execute for target-guarded execution. |
| Operator dossier present | passed | Dossier status is ready_for_operator_review. |
| GBrain memory context available | advisory | GBrain context is available as advisory memory, not source-of-truth approval evidence. |

GBrain queries:

- Find prior Ariadne decisions and evidence for the github live adapter.
- List risks, rollback requirements, and stale assumptions for github approval.
- Summarize operator-review evidence still missing before github mutation readiness.

### deployment

| Gate | Status | Detail |
| --- | --- | --- |
| Operator evidence complete | blocked | No operator evidence record exists for deployment. |
| Current accepted operator packet review | blocked | no accepted operator review exists |
| Mutation-readiness audit passed | blocked | No target-specific mutation-readiness plan passes audit. |
| Credential and auth-boundary evidence accepted | blocked | No passing readiness audit is available to prove auth evidence. |
| Rollback and post-verification contract accepted | blocked | A passing readiness audit is required to prove rollback and post-verification. |
| Dry-run evidence passed | blocked | No passed dry-run evidence exists for an audit-passed plan. |
| Target-guarded execution evidence passed | blocked | No passed target-guarded execution evidence exists. |
| Target execute wrapper is known | passed | Use deployment-mutation-execute for target-guarded execution. |
| Operator dossier present | passed | Dossier status is ready_for_operator_review. |
| GBrain memory context available | advisory | GBrain context is available as advisory memory, not source-of-truth approval evidence. |

GBrain queries:

- Find prior Ariadne decisions and evidence for the deployment live adapter.
- List risks, rollback requirements, and stale assumptions for deployment approval.
- Summarize operator-review evidence still missing before deployment mutation readiness.

### hermes-cron

| Gate | Status | Detail |
| --- | --- | --- |
| Operator evidence complete | blocked | No operator evidence record exists for hermes-cron. |
| Current accepted operator packet review | blocked | no accepted operator review exists |
| Mutation-readiness audit passed | blocked | No target-specific mutation-readiness plan passes audit. |
| Credential and auth-boundary evidence accepted | blocked | No passing readiness audit is available to prove auth evidence. |
| Rollback and post-verification contract accepted | blocked | A passing readiness audit is required to prove rollback and post-verification. |
| Dry-run evidence passed | blocked | No passed dry-run evidence exists for an audit-passed plan. |
| Target-guarded execution evidence passed | blocked | No passed target-guarded execution evidence exists. |
| Target execute wrapper is known | passed | Use hermes-cron-mutation-execute for target-guarded execution. |
| Operator dossier present | passed | Dossier status is ready_for_operator_review. |
| GBrain memory context available | advisory | GBrain context is available as advisory memory, not source-of-truth approval evidence. |

GBrain queries:

- Find prior Ariadne decisions and evidence for the hermes-cron live adapter.
- List risks, rollback requirements, and stale assumptions for hermes-cron approval.
- Summarize operator-review evidence still missing before hermes-cron mutation readiness.

### openscorpion

| Gate | Status | Detail |
| --- | --- | --- |
| Operator evidence complete | blocked | No operator evidence record exists for openscorpion. |
| Current accepted operator packet review | blocked | no accepted operator review exists |
| Mutation-readiness audit passed | blocked | No target-specific mutation-readiness plan passes audit. |
| Credential and auth-boundary evidence accepted | blocked | No passing readiness audit is available to prove auth evidence. |
| Rollback and post-verification contract accepted | blocked | A passing readiness audit is required to prove rollback and post-verification. |
| Dry-run evidence passed | blocked | No passed dry-run evidence exists for an audit-passed plan. |
| Target-guarded execution evidence passed | blocked | No passed target-guarded execution evidence exists. |
| Target execute wrapper is known | passed | Use openscorpion-mutation-execute for target-guarded execution. |
| Operator dossier present | passed | Dossier status is ready_for_operator_review. |
| GBrain memory context available | advisory | GBrain context is available as advisory memory, not source-of-truth approval evidence. |

GBrain queries:

- Find prior Ariadne decisions and evidence for the openscorpion live adapter.
- List risks, rollback requirements, and stale assumptions for openscorpion approval.
- Summarize operator-review evidence still missing before openscorpion mutation readiness.

### gsd2

| Gate | Status | Detail |
| --- | --- | --- |
| Operator evidence complete | blocked | No operator evidence record exists for gsd2. |
| Current accepted operator packet review | blocked | no accepted operator review exists |
| Mutation-readiness audit passed | blocked | No target-specific mutation-readiness plan passes audit. |
| Credential and auth-boundary evidence accepted | blocked | No passing readiness audit is available to prove auth evidence. |
| Rollback and post-verification contract accepted | blocked | A passing readiness audit is required to prove rollback and post-verification. |
| Dry-run evidence passed | blocked | No passed dry-run evidence exists for an audit-passed plan. |
| Target-guarded execution evidence passed | blocked | No passed target-guarded execution evidence exists. |
| Target execute wrapper is known | passed | Use gsd2-mutation-execute for target-guarded execution. |
| Operator dossier present | passed | Dossier status is ready_for_operator_review. |
| GBrain memory context available | advisory | GBrain context is available as advisory memory, not source-of-truth approval evidence. |

GBrain queries:

- Find prior Ariadne decisions and evidence for the gsd2 live adapter.
- List risks, rollback requirements, and stale assumptions for gsd2 approval.
- Summarize operator-review evidence still missing before gsd2 mutation readiness.

### notebooklm

| Gate | Status | Detail |
| --- | --- | --- |
| Operator evidence complete | blocked | No operator evidence record exists for notebooklm. |
| Current accepted operator packet review | blocked | no accepted operator review exists |
| Mutation-readiness audit passed | blocked | No target-specific mutation-readiness plan passes audit. |
| Credential and auth-boundary evidence accepted | blocked | No passing readiness audit is available to prove auth evidence. |
| Rollback and post-verification contract accepted | blocked | A passing readiness audit is required to prove rollback and post-verification. |
| Dry-run evidence passed | blocked | No passed dry-run evidence exists for an audit-passed plan. |
| Target-guarded execution evidence passed | blocked | No passed target-guarded execution evidence exists. |
| Target execute wrapper is known | passed | Use notebooklm-mutation-execute for target-guarded execution. |
| Operator dossier present | passed | Dossier status is ready_for_operator_review. |
| GBrain memory context available | advisory | GBrain context is available as advisory memory, not source-of-truth approval evidence. |

GBrain queries:

- Find prior Ariadne decisions and evidence for the notebooklm live adapter.
- List risks, rollback requirements, and stale assumptions for notebooklm approval.
- Summarize operator-review evidence still missing before notebooklm mutation readiness.
