# Mutation Execution

Id: mutation-execution-2026-10-12T15-19-53-674Z
Plan: mutation-readiness-deployment-2026-10-12T15-19-14-572Z
Target: deployment
Status: passed
Started: 2026-10-12T15:19:53.674Z
Finished: 2026-10-12T15:20:00.862Z
Duration ms: 7186
Execute: true
Audit: projects/ariadne/control/mutation-readiness-audit.json
Dry run: mutation-dry-run-2026-10-12T15-19-47-678Z

## Live Command

```bash
bash /home/james/ariadne-run/ingest/apply.sh
```

Exit code: 0

## Post Verification

```bash
bash /home/james/ariadne-run/ingest/verify.sh
```

Exit code: 0

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/ingest/rollback.sh; delete CNAME ingest.scorpion-labs.com; cloudflared tunnel delete ariadne-ingest
