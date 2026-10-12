# Mutation Execution

Id: mutation-execution-2026-10-12T15-19-30-908Z
Plan: mutation-readiness-deployment-2026-10-12T15-19-14-572Z
Target: deployment
Status: failed
Started: 2026-10-12T15:19:30.908Z
Finished: 2026-10-12T15:19:35.977Z
Duration ms: 5068
Execute: true
Audit: projects/ariadne/control/mutation-readiness-audit.json
Dry run: mutation-dry-run-2026-10-12T15-19-24-735Z

## Live Command

```bash
bash /home/james/ariadne-run/ingest/apply.sh
```

Exit code: 1

## Post Verification

```bash
bash /home/james/ariadne-run/ingest/verify.sh
```

Exit code: none

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/ingest/rollback.sh; delete CNAME ingest.scorpion-labs.com; cloudflared tunnel delete ariadne-ingest
