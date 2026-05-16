# Benchmark Run: smoke

Id: benchmark-run-smoke-2026-05-16T18-29-06-696Z
Status: passed
Generated: 2026-05-16T18:29:06.696Z
Mode: local_deterministic
Pack: <PACK_ROOT>/benchmark-pack.json
Target projects: bench-smoke

## Summary

- Steps: 13
- Passed: 13
- Failed: 0
- Missing required artifacts: 0

## Steps

| Project | Step | Status | Detail |
| --- | --- | --- | --- |
| bench-smoke | ingest | passed | completed |
| bench-smoke | assemble | passed | completed |
| bench-smoke | prd | passed | completed |
| bench-smoke | gsd | passed | completed |
| bench-smoke | gsd2-export | passed | completed |
| bench-smoke | execution | passed | completed |
| bench-smoke | playwright | passed | completed |
| bench-smoke | evaluation | passed | completed |
| bench-smoke | infra | passed | completed |
| bench-smoke | control | passed | completed |
| bench-smoke | behavior-checks | passed | completed |
| bench-smoke | gbrain-export | passed | completed |
| bench-smoke | artifact-checks | passed | completed |

## Acceptance

| Criterion | Status |
| --- | --- |
| Artifact checks pass with no missing required artifacts. | passed |
| The generated PRD contains the core evidence, planning, verification, and control requirements. | passed |
| No command requires a live external service. | passed |
