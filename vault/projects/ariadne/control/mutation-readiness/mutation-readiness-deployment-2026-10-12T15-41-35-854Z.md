# Mutation Readiness: deployment

Id: mutation-readiness-deployment-2026-10-12T15-41-35-854Z
Status: ready_for_bounded_review
Risk: medium
Generated: 2026-10-12T15:41:35.854Z
Execute: false
Approval: approval-2026-10-12T15-41-31-964Z (approved)

## Scope

proxmox/codex-dev: Add scoped source codex-dev-grok-cli (scorpion-labs, jxwalker/ariadne) to sources.json, write mode-600 sender config, run grok -p via activity_sender wrapper, deliver to https://ingest.scorpion-labs.com

## Auth Evidence

- control/approvals/approval-2026-10-12T15-41-31-964Z.json

## Supporting Evidence

- none

## Dry Run

```bash
bash /home/james/ariadne-run/grok/dryrun.sh
```

## Proposed Live Command

```bash
bash /home/james/ariadne-run/grok/apply.sh
```

## Post-Action Verification

```bash
bash /home/james/ariadne-run/grok/verify.sh
```

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/grok/rollback.sh

## Required Gates

- bounded scope recorded
- auth evidence reviewed
- dry-run command reviewed
- rollback command reviewed
- human approval record approved
- CodeRabbit or human review approval
- post-action verification command defined
- deployment target and rollback host verified
