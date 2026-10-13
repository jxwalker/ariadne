# Mutation Readiness: deployment

Id: mutation-readiness-deployment-2026-10-12T18-27-19-846Z
Status: ready_for_bounded_review
Risk: medium
Generated: 2026-10-12T18:27:19.846Z
Execute: false
Approval: approval-2026-10-12T18-27-15-222Z (approved)

## Scope

proxmox/codex-dev: Back up release; install activity_controls.py from feadc20; restart ariadne-activity

## Auth Evidence

- control/approvals/approval-2026-10-12T18-27-15-222Z.json

## Supporting Evidence

- none

## Dry Run

```bash
bash /home/james/ariadne-run/controls-closed/dryrun.sh
```

## Proposed Live Command

```bash
bash /home/james/ariadne-run/controls-closed/apply.sh
```

## Post-Action Verification

```bash
bash /home/james/ariadne-run/controls-closed/verify.sh
```

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/controls-closed/rollback.sh

## Required Gates

- bounded scope recorded
- auth evidence reviewed
- dry-run command reviewed
- rollback command reviewed
- human approval record approved
- CodeRabbit or human review approval
- post-action verification command defined
- deployment target and rollback host verified
