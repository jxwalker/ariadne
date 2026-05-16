# Mutation Readiness: github

Id: mutation-readiness-github-2026-05-16T16-50-54-241Z
Status: approval_required
Risk: medium
Generated: 2026-05-16T16:50:54.241Z
Execute: false
Approval: approval-2026-05-16T13-21-33-834Z (requested)

## Scope

Bounded mutation-capable PR adapter for one Ariadne branch after all review gates pass

## Auth Evidence

- vault/projects/ariadne/integrations/github/github-snapshot-2026-05-16T12-25-16-576Z.json

## Supporting Evidence

- vault/projects/ariadne/control/approvals/approval-2026-05-16T13-21-33-834Z.json
- vault/projects/ariadne/control/merge-readiness.json

## Dry Run

```bash
gh pr view <number> --json statusCheckRollup,reviewDecision,mergeStateStatus
```

## Proposed Live Command

```bash
gh pr merge <number> --squash --delete-branch
```

## Rollback

Revert the squash merge commit, disable the mutation adapter, and return to manual PR workflow

## Required Gates

- bounded scope recorded
- auth evidence reviewed
- dry-run command reviewed
- rollback command reviewed
- human approval record approved
- CodeRabbit or human review approval
- post-action verification command defined
- branch, PR, and merge policy verified

## Notes

Readiness only; approval is still requested and no live command is executed.
