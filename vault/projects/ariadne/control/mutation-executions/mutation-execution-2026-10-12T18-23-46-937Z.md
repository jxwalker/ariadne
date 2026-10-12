# Mutation Execution

Id: mutation-execution-2026-10-12T18-23-46-937Z
Plan: mutation-readiness-deployment-2026-10-12T18-23-40-442Z
Target: deployment
Status: passed
Started: 2026-10-12T18:23:46.937Z
Finished: 2026-10-12T18:23:53.430Z
Duration ms: 6492
Execute: true
Audit: projects/ariadne/control/mutation-readiness-audit.json
Dry run: mutation-dry-run-2026-10-12T18-23-44-694Z

## Live Command

```bash
bash /home/james/ariadne-run/retire-may/apply.sh
```

Exit code: 0

## Post Verification

```bash
bash /home/james/ariadne-run/retire-may/verify.sh
```

Exit code: 0

## Rollback

proxmox/codex-dev: codex-dev: bash /home/james/ariadne-run/retire-may/rollback.sh
