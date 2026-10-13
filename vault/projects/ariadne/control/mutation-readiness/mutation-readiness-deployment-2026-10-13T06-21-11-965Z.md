# Mutation Readiness: deployment

Id: mutation-readiness-deployment-2026-10-13T06-21-11-965Z
Status: ready_for_bounded_review
Risk: medium
Generated: 2026-10-13T06:21:11.965Z
Execute: false
Approval: approval-2026-10-13T06-21-05-808Z (approved)

## Scope

proxmox/codex-dev: Pin claude-dev host key, install remote_collect.py + ariadne-remote-collect timer (30s); Mac bridge untouched

## Auth Evidence

- control/approvals/approval-2026-10-13T06-21-05-808Z.json

## Supporting Evidence

- none

## Dry Run

```bash
bash /home/james/ariadne-run/bridge-retire/dryrun.sh
```

## Proposed Live Command

```bash
bash /home/james/ariadne-run/bridge-retire/apply.sh
```

## Post-Action Verification

```bash
bash /home/james/ariadne-run/bridge-retire/verify.sh
```

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/bridge-retire/rollback.sh

## Required Gates

- bounded scope recorded
- auth evidence reviewed
- dry-run command reviewed
- rollback command reviewed
- human approval record approved
- CodeRabbit or human review approval
- post-action verification command defined
- deployment target and rollback host verified
