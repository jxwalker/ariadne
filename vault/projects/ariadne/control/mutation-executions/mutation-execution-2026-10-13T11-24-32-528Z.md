# Mutation Execution

Id: mutation-execution-2026-10-13T11-24-32-528Z
Plan: mutation-readiness-deployment-2026-10-13T11-24-26-641Z
Target: deployment
Status: passed
Started: 2026-10-13T11:24:32.528Z
Finished: 2026-10-13T11:24:39.291Z
Duration ms: 6763
Execute: true
Audit: projects/ariadne/control/mutation-readiness-audit.json
Dry run: mutation-dry-run-2026-10-13T11-24-30-443Z

## Live Command

```bash
bash /home/james/ariadne-run/names-display/apply.sh
```

Exit code: 0

## Post Verification

```bash
bash /home/james/ariadne-run/names-display/verify.sh
```

Exit code: 0

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/names-display/rollback.sh
