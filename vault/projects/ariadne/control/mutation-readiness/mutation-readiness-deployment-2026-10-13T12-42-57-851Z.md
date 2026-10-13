# Mutation Readiness: deployment

Id: mutation-readiness-deployment-2026-10-13T12-42-57-851Z
Status: ready_for_bounded_review
Risk: medium
Generated: 2026-10-13T12:42:57.851Z
Execute: false
Approval: approval-2026-10-13T12-42-53-993Z (approved)

## Scope

proxmox/codex-dev: codex-dev ariadne sources.json displayName for box-scorpion-build-bot, box-scorpion-verifier, box-patent-studio-ui-bot, box-ariadne-bot

## Auth Evidence

- control/approvals/approval-2026-10-13T12-42-53-993Z.json

## Supporting Evidence

- none

## Dry Run

```bash
bash /home/james/ariadne-run/names-nobox/dryrun.sh
```

## Proposed Live Command

```bash
bash /home/james/ariadne-run/names-nobox/apply.sh
```

## Post-Action Verification

```bash
bash /home/james/ariadne-run/names-nobox/verify.sh
```

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/names-nobox/rollback.sh

## Required Gates

- bounded scope recorded
- auth evidence reviewed
- dry-run command reviewed
- rollback command reviewed
- human approval record approved
- CodeRabbit or human review approval
- post-action verification command defined
- deployment target and rollback host verified
