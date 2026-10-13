# Mutation Execution

Id: mutation-execution-2026-10-13T10-50-04-159Z
Plan: mutation-readiness-deployment-2026-10-13T10-49-55-196Z
Target: deployment
Status: passed
Started: 2026-10-13T10:50:04.159Z
Finished: 2026-10-13T10:50:04.325Z
Duration ms: 165
Execute: true
Audit: projects/ariadne/control/mutation-readiness-audit.json
Dry run: mutation-dry-run-2026-10-13T10-50-01-282Z

## Live Command

```bash
bash /home/james/ariadne-run/enrol-bots/apply.sh
```

Exit code: 0

## Post Verification

```bash
bash /home/james/ariadne-run/enrol-bots/verify.sh
```

Exit code: 0

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/enrol-bots/rollback.sh
