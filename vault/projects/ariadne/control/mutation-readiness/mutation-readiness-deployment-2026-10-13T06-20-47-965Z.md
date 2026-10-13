# Mutation Readiness: deployment

Id: mutation-readiness-deployment-2026-10-13T06-20-47-965Z
Status: ready_for_bounded_review
Risk: medium
Generated: 2026-10-13T06:20:47.965Z
Execute: false
Approval: approval-2026-10-13T06-20-41-561Z (approved)

## Scope

proxmox/codex-dev: Append codex-dev id_ed25519_lab.pub to claude-dev authorized_keys (done from JW-MBP with backup); verify codex-dev->claude-dev SSH with pinned host key

## Auth Evidence

- control/approvals/approval-2026-10-13T06-20-41-561Z.json

## Supporting Evidence

- none

## Dry Run

```bash
bash /home/james/ariadne-run/claude-dev-key/dryrun.sh
```

## Proposed Live Command

```bash
bash /home/james/ariadne-run/claude-dev-key/apply.sh
```

## Post-Action Verification

```bash
bash /home/james/ariadne-run/claude-dev-key/verify.sh
```

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/claude-dev-key/rollback.sh

## Required Gates

- bounded scope recorded
- auth evidence reviewed
- dry-run command reviewed
- rollback command reviewed
- human approval record approved
- CodeRabbit or human review approval
- post-action verification command defined
- deployment target and rollback host verified
