# Benchmark Run: realistic

Id: benchmark-run-realistic-2026-05-17T10-45-17-863Z
Status: passed
Generated: 2026-05-17T10:45:17.863Z
Mode: local_deterministic
Pack: <PACK_ROOT>/benchmark-pack.json
Target projects: e2e-local-realistic

## Summary

- Steps: 19
- Passed: 19
- Failed: 0
- Missing required artifacts: 0

## Steps

| Project | Step | Status | Detail |
| --- | --- | --- | --- |
| e2e-local-realistic | ingest | passed | completed |
| e2e-local-realistic | assemble | passed | completed |
| e2e-local-realistic | prd | passed | completed |
| e2e-local-realistic | gsd | passed | completed |
| e2e-local-realistic | gsd2-export | passed | completed |
| e2e-local-realistic | execution | passed | completed |
| e2e-local-realistic | playwright | passed | completed |
| e2e-local-realistic | evaluation | passed | completed |
| e2e-local-realistic | infra | passed | completed |
| e2e-local-realistic | notebooklm-import | passed | completed |
| e2e-local-realistic | import-ci | passed | completed |
| e2e-local-realistic | import-coderabbit | passed | completed |
| e2e-local-realistic | usage-import | passed | completed |
| e2e-local-realistic | usage-report | passed | completed |
| e2e-local-realistic | infra-snapshot | passed | completed |
| e2e-local-realistic | control | passed | completed |
| e2e-local-realistic | behavior-checks | passed | completed |
| e2e-local-realistic | gbrain-export | passed | completed |
| e2e-local-realistic | artifact-checks | passed | completed |

## Acceptance

| Criterion | Status |
| --- | --- |
| Mixed source intake produces three source records. | passed |
| Manual NotebookLM, CI, CodeRabbit, usage, and infrastructure imports create evidence records. | passed |
| Control and artifact-check reports are generated without live mutations. | passed |
