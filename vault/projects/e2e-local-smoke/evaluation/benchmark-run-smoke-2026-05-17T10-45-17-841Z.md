# Benchmark Run: smoke

Id: benchmark-run-smoke-2026-05-17T10-45-17-841Z
Status: passed
Generated: 2026-05-17T10:45:17.841Z
Mode: local_deterministic
Pack: <PACK_ROOT>/benchmark-pack.json
Target projects: e2e-local-smoke

## Summary

- Steps: 13
- Passed: 13
- Failed: 0
- Missing required artifacts: 0

## Steps

| Project | Step | Status | Detail |
| --- | --- | --- | --- |
| e2e-local-smoke | ingest | passed | completed |
| e2e-local-smoke | assemble | passed | completed |
| e2e-local-smoke | prd | passed | completed |
| e2e-local-smoke | gsd | passed | completed |
| e2e-local-smoke | gsd2-export | passed | completed |
| e2e-local-smoke | execution | passed | completed |
| e2e-local-smoke | playwright | passed | completed |
| e2e-local-smoke | evaluation | passed | completed |
| e2e-local-smoke | infra | passed | completed |
| e2e-local-smoke | control | passed | completed |
| e2e-local-smoke | behavior-checks | passed | completed |
| e2e-local-smoke | gbrain-export | passed | completed |
| e2e-local-smoke | artifact-checks | passed | completed |

## Acceptance

| Criterion | Status |
| --- | --- |
| Artifact checks pass with no missing required artifacts. | passed |
| The generated PRD contains the core evidence, planning, verification, and control requirements. | passed |
| No command requires a live external service. | passed |
