# Mutation Execution

Id: mutation-execution-2026-10-12T15-32-44-289Z
Plan: mutation-readiness-deployment-2026-10-12T15-32-36-775Z
Target: deployment
Status: passed
Started: 2026-10-12T15:32:44.289Z
Finished: 2026-10-12T15:32:59.440Z
Duration ms: 15149
Execute: true
Audit: projects/ariadne/control/mutation-readiness-audit.json
Dry run: mutation-dry-run-2026-10-12T15-32-40-579Z

## Live Command

```bash
bash /home/james/ariadne-run/redeploy/apply.sh
```

Exit code: 0

## Post Verification

```bash
bash /home/james/ariadne-run/redeploy/verify.sh
```

Exit code: 0

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/redeploy/rollback.sh
