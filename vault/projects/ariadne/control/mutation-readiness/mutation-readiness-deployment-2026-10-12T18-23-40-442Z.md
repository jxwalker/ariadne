# Mutation Readiness: deployment

Id: mutation-readiness-deployment-2026-10-12T18-23-40-442Z
Status: ready_for_bounded_review
Risk: medium
Generated: 2026-10-12T18:23:40.442Z
Execute: false
Approval: approval-2026-10-12T18-23-36-210Z (approved)

## Scope

proxmox/codex-dev: Record rejected (retired/superseded) decisions on approval-2026-05-16T13-21-33-834Z and approval-2026-05-18T14-53-53-213Z; regenerate mutation-readiness audit; no infrastructure change

## Auth Evidence

- control/approvals/approval-2026-10-12T18-23-36-210Z.json

## Supporting Evidence

- none

## Dry Run

```bash
bash /home/james/ariadne-run/retire-may/dryrun.sh
```

## Proposed Live Command

```bash
bash /home/james/ariadne-run/retire-may/apply.sh
```

## Post-Action Verification

```bash
bash /home/james/ariadne-run/retire-may/verify.sh
```

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/retire-may/rollback.sh

## Required Gates

- bounded scope recorded
- auth evidence reviewed
- dry-run command reviewed
- rollback command reviewed
- human approval record approved
- CodeRabbit or human review approval
- post-action verification command defined
- deployment target and rollback host verified
