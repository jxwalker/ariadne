# Mutation Execution

Id: mutation-execution-2026-10-13T06-20-57-196Z
Plan: mutation-readiness-deployment-2026-10-13T06-20-47-965Z
Target: deployment
Status: passed
Started: 2026-10-13T06:20:57.196Z
Finished: 2026-10-13T06:20:57.771Z
Duration ms: 575
Execute: true
Audit: projects/ariadne/control/mutation-readiness-audit.json
Dry run: mutation-dry-run-2026-10-13T06-20-54-004Z

## Live Command

```bash
bash /home/james/ariadne-run/claude-dev-key/apply.sh
```

Exit code: 0

## Post Verification

```bash
bash /home/james/ariadne-run/claude-dev-key/verify.sh
```

Exit code: 0

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/claude-dev-key/rollback.sh
