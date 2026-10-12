# Mutation Readiness: deployment

Id: mutation-readiness-deployment-2026-10-12T17-52-25-200Z
Status: ready_for_bounded_review
Risk: medium
Generated: 2026-10-12T17:52:25.200Z
Execute: false
Approval: approval-2026-10-12T17-52-20-034Z (approved)

## Scope

proxmox/codex-dev: Back up DB/config/release/units/overlay code+console; install activity scripts from d0fbc7d; add read-only controlEvidenceDirs; update overlay dist/src consoleHtml+consoleBrowserChecks only; restart ariadne-activity; refresh console

## Auth Evidence

- control/approvals/approval-2026-10-12T17-52-20-034Z.json

## Supporting Evidence

- none

## Dry Run

```bash
bash /home/james/ariadne-run/dash-deploy/dryrun.sh
```

## Proposed Live Command

```bash
bash /home/james/ariadne-run/dash-deploy/apply.sh
```

## Post-Action Verification

```bash
bash /home/james/ariadne-run/dash-deploy/verify.sh
```

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/dash-deploy/rollback.sh

## Required Gates

- bounded scope recorded
- auth evidence reviewed
- dry-run command reviewed
- rollback command reviewed
- human approval record approved
- CodeRabbit or human review approval
- post-action verification command defined
- deployment target and rollback host verified
