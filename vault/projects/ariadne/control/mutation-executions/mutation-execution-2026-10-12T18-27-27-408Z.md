# Mutation Execution

Id: mutation-execution-2026-10-12T18-27-27-408Z
Plan: mutation-readiness-deployment-2026-10-12T18-27-19-846Z
Target: deployment
Status: passed
Started: 2026-10-12T18:27:27.408Z
Finished: 2026-10-12T18:27:37.917Z
Duration ms: 10507
Execute: true
Audit: projects/ariadne/control/mutation-readiness-audit.json
Dry run: mutation-dry-run-2026-10-12T18-27-24-418Z

## Live Command

```bash
bash /home/james/ariadne-run/controls-closed/apply.sh
```

Exit code: 0

## Post Verification

```bash
bash /home/james/ariadne-run/controls-closed/verify.sh
```

Exit code: 0

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/controls-closed/rollback.sh
