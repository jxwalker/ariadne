# Mutation Readiness Audit

Project: ariadne
Status: blocked
Generated: 2026-05-18T15:10:37.351Z
Mutation allowed: false

## Summary

- Plans: 2
- Ready: 0
- Blocked: 2
- Approval required: 2
- Approval rejected: 0
- Missing evidence: 0
- Unsafe dry-runs: 0
- Executable plans: 0

## Checks

| Plan | Target | Status | Blockers | Warnings |
| --- | --- | --- | --- | --- |
| mutation-readiness-deployment-2026-05-18T14-54-52-671Z | deployment | blocked | approval state is approval_required; approval record is requested | high-risk plan requires explicit operator review even after this audit passes |
| mutation-readiness-github-2026-05-16T16-50-54-241Z | github | blocked | approval state is approval_required; approval record is requested; post-action verification command is missing | none |
