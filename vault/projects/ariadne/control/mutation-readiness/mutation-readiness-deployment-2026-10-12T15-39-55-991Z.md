# Mutation Readiness: deployment

Id: mutation-readiness-deployment-2026-10-12T15-39-55-991Z
Status: ready_for_bounded_review
Risk: medium
Generated: 2026-10-12T15:39:55.991Z
Execute: false
Approval: approval-2026-10-12T15-39-52-026Z (approved)

## Scope

proxmox/codex-dev: Generate webhook secret file, set githubSecretFile in server.json, restart ariadne-activity, create repo webhook (JSON, runbook events) via gh, ping

## Auth Evidence

- control/approvals/approval-2026-10-12T15-39-52-026Z.json

## Supporting Evidence

- none

## Dry Run

```bash
bash /home/james/ariadne-run/webhook/dryrun.sh
```

## Proposed Live Command

```bash
bash /home/james/ariadne-run/webhook/apply.sh
```

## Post-Action Verification

```bash
bash /home/james/ariadne-run/webhook/verify.sh
```

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/webhook/rollback.sh

## Required Gates

- bounded scope recorded
- auth evidence reviewed
- dry-run command reviewed
- rollback command reviewed
- human approval record approved
- CodeRabbit or human review approval
- post-action verification command defined
- deployment target and rollback host verified
