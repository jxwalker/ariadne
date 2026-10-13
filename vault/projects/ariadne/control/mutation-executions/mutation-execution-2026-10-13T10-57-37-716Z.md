# Mutation Execution

Id: mutation-execution-2026-10-13T10-57-37-716Z
Plan: mutation-readiness-deployment-2026-10-13T10-57-30-932Z
Target: deployment
Status: passed
Started: 2026-10-13T10:57:37.716Z
Finished: 2026-10-13T10:57:44.432Z
Duration ms: 6714
Execute: true
Audit: projects/ariadne/control/mutation-readiness-audit.json
Dry run: mutation-dry-run-2026-10-13T10-57-35-328Z

## Live Command

```bash
bash /home/james/ariadne-run/enrol-display/apply.sh
```

Exit code: 0

## Post Verification

```bash
bash /home/james/ariadne-run/enrol-display/verify.sh
```

Exit code: 0

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/enrol-display/rollback.sh
