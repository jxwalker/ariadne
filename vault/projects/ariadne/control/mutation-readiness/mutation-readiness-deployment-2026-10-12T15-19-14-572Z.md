# Mutation Readiness: deployment

Id: mutation-readiness-deployment-2026-10-12T15-19-14-572Z
Status: ready_for_bounded_review
Risk: medium
Generated: 2026-10-12T15:19:14.572Z
Execute: false
Approval: approval-2026-10-12T15-19-06-018Z (approved)

## Scope

proxmox/codex-dev: Create tunnel ariadne-ingest, DNS ingest.scorpion-labs.com, loopback nginx allowlist proxy 127.0.0.1:18096 -> 18095; user units ariadne-ingest-proxy/ariadne-ingest-tunnel; no change to ariadne-activity, tailnet Serve or other tunnels

## Auth Evidence

- control/approvals/approval-2026-10-12T15-19-06-018Z.json

## Supporting Evidence

- none

## Dry Run

```bash
bash /home/james/ariadne-run/ingest/dryrun.sh
```

## Proposed Live Command

```bash
bash /home/james/ariadne-run/ingest/apply.sh
```

## Post-Action Verification

```bash
bash /home/james/ariadne-run/ingest/verify.sh
```

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/ingest/rollback.sh; delete CNAME ingest.scorpion-labs.com; cloudflared tunnel delete ariadne-ingest

## Required Gates

- bounded scope recorded
- auth evidence reviewed
- dry-run command reviewed
- rollback command reviewed
- human approval record approved
- CodeRabbit or human review approval
- post-action verification command defined
- deployment target and rollback host verified
