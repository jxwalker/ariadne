# Mutation Execution

Id: mutation-execution-2026-10-13T06-21-22-058Z
Plan: mutation-readiness-deployment-2026-10-13T06-21-11-965Z
Target: deployment
Status: passed
Started: 2026-10-13T06:21:22.058Z
Finished: 2026-10-13T06:21:25.402Z
Duration ms: 3344
Execute: true
Audit: projects/ariadne/control/mutation-readiness-audit.json
Dry run: mutation-dry-run-2026-10-13T06-21-18-132Z

## Live Command

```bash
bash /home/james/ariadne-run/bridge-retire/apply.sh
```

Exit code: 0

## Post Verification

```bash
bash /home/james/ariadne-run/bridge-retire/verify.sh
```

Exit code: 0

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/bridge-retire/rollback.sh
