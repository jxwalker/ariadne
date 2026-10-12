# Mutation Readiness: deployment

Id: mutation-readiness-deployment-2026-10-12T15-32-36-775Z
Status: ready_for_bounded_review
Risk: medium
Generated: 2026-10-12T15:32:36.775Z
Execute: false
Approval: approval-2026-10-12T15-32-32-921Z (approved)

## Scope

proxmox/codex-dev: Back up DB/config/release/units, install 9782e98 package via repo installer, restart ariadne-activity; ~/workspaces/ariadne overlay archived not overwritten

## Auth Evidence

- control/approvals/approval-2026-10-12T15-32-32-921Z.json

## Supporting Evidence

- none

## Dry Run

```bash
bash /home/james/ariadne-run/redeploy/dryrun.sh
```

## Proposed Live Command

```bash
bash /home/james/ariadne-run/redeploy/apply.sh
```

## Post-Action Verification

```bash
bash /home/james/ariadne-run/redeploy/verify.sh
```

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/redeploy/rollback.sh

## Required Gates

- bounded scope recorded
- auth evidence reviewed
- dry-run command reviewed
- rollback command reviewed
- human approval record approved
- CodeRabbit or human review approval
- post-action verification command defined
- deployment target and rollback host verified
