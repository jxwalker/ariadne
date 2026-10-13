# Mutation Readiness: deployment

Id: mutation-readiness-deployment-2026-10-13T11-24-26-641Z
Status: ready_for_bounded_review
Risk: medium
Generated: 2026-10-13T11:24:26.641Z
Execute: false
Approval: approval-2026-10-13T11-24-22-858Z (approved)

## Scope

proxmox/codex-dev: codex-dev ariadne-activity release scripts activity_dashboard.js

## Auth Evidence

- control/approvals/approval-2026-10-13T11-24-22-858Z.json

## Supporting Evidence

- none

## Dry Run

```bash
bash /home/james/ariadne-run/names-display/dryrun.sh
```

## Proposed Live Command

```bash
bash /home/james/ariadne-run/names-display/apply.sh
```

## Post-Action Verification

```bash
bash /home/james/ariadne-run/names-display/verify.sh
```

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/names-display/rollback.sh

## Required Gates

- bounded scope recorded
- auth evidence reviewed
- dry-run command reviewed
- rollback command reviewed
- human approval record approved
- CodeRabbit or human review approval
- post-action verification command defined
- deployment target and rollback host verified
