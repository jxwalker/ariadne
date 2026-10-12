# Mutation Execution

Id: mutation-execution-2026-10-12T17-52-35-403Z
Plan: mutation-readiness-deployment-2026-10-12T17-52-25-200Z
Target: deployment
Status: passed
Started: 2026-10-12T17:52:35.403Z
Finished: 2026-10-12T17:53:29.933Z
Duration ms: 54530
Execute: true
Audit: projects/ariadne/control/mutation-readiness-audit.json
Dry run: mutation-dry-run-2026-10-12T17-52-30-629Z

## Live Command

```bash
bash /home/james/ariadne-run/dash-deploy/apply.sh
```

Exit code: 0

## Post Verification

```bash
bash /home/james/ariadne-run/dash-deploy/verify.sh
```

Exit code: 0

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/dash-deploy/rollback.sh
