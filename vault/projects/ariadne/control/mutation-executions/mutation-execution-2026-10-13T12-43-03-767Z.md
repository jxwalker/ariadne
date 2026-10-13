# Mutation Execution

Id: mutation-execution-2026-10-13T12-43-03-767Z
Plan: mutation-readiness-deployment-2026-10-13T12-42-57-851Z
Target: deployment
Status: passed
Started: 2026-10-13T12:43:03.767Z
Finished: 2026-10-13T12:43:05.925Z
Duration ms: 2157
Execute: true
Audit: projects/ariadne/control/mutation-readiness-audit.json
Dry run: mutation-dry-run-2026-10-13T12-43-01-724Z

## Live Command

```bash
bash /home/james/ariadne-run/names-nobox/apply.sh
```

Exit code: 0

## Post Verification

```bash
bash /home/james/ariadne-run/names-nobox/verify.sh
```

Exit code: 0

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/names-nobox/rollback.sh
