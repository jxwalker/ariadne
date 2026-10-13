# Mutation Execution

Id: mutation-execution-2026-10-13T07-15-03-777Z
Plan: mutation-readiness-deployment-2026-10-13T07-14-56-886Z
Target: deployment
Status: passed
Started: 2026-10-13T07:15:03.777Z
Finished: 2026-10-13T07:15:29.717Z
Duration ms: 25939
Execute: true
Audit: projects/ariadne/control/mutation-readiness-audit.json
Dry run: mutation-dry-run-2026-10-13T07-15-01-274Z

## Live Command

```bash
bash /home/james/ariadne-run/ops-deploy/apply.sh
```

Exit code: 0

## Post Verification

```bash
bash /home/james/ariadne-run/ops-deploy/verify.sh
```

Exit code: 0

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/ops-deploy/rollback.sh
