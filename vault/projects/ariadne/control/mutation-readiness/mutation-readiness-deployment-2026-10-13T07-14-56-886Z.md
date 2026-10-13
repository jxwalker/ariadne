# Mutation Readiness: deployment

Id: mutation-readiness-deployment-2026-10-13T07-14-56-886Z
Status: ready_for_bounded_review
Risk: medium
Generated: 2026-10-13T07:14:56.886Z
Execute: false
Approval: approval-2026-10-13T07-14-52-343Z (approved)

## Scope

proxmox/codex-dev: ariadne-activity release scripts

## Auth Evidence

- control/approvals/approval-2026-10-13T07-14-52-343Z.json

## Supporting Evidence

- none

## Dry Run

```bash
bash /home/james/ariadne-run/ops-deploy/dryrun.sh
```

## Proposed Live Command

```bash
bash /home/james/ariadne-run/ops-deploy/apply.sh
```

## Post-Action Verification

```bash
bash /home/james/ariadne-run/ops-deploy/verify.sh
```

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/ops-deploy/rollback.sh

## Required Gates

- bounded scope recorded
- auth evidence reviewed
- dry-run command reviewed
- rollback command reviewed
- human approval record approved
- CodeRabbit or human review approval
- post-action verification command defined
- deployment target and rollback host verified
