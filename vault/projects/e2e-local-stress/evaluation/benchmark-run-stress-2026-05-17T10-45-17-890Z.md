# Benchmark Run: stress

Id: benchmark-run-stress-2026-05-17T10-45-17-890Z
Status: passed
Generated: 2026-05-17T10:45:17.890Z
Mode: local_deterministic
Pack: <PACK_ROOT>/benchmark-pack.json
Target projects: e2e-local-stress-alpha, e2e-local-stress-beta

## Summary

- Steps: 29
- Passed: 29
- Failed: 0
- Missing required artifacts: 0

## Steps

| Project | Step | Status | Detail |
| --- | --- | --- | --- |
| e2e-local-stress-alpha | ingest | passed | completed |
| e2e-local-stress-alpha | assemble | passed | completed |
| e2e-local-stress-alpha | prd | passed | completed |
| e2e-local-stress-alpha | gsd | passed | completed |
| e2e-local-stress-alpha | gsd2-export | passed | completed |
| e2e-local-stress-alpha | execution | passed | completed |
| e2e-local-stress-alpha | playwright | passed | completed |
| e2e-local-stress-alpha | evaluation | passed | completed |
| e2e-local-stress-alpha | infra | passed | completed |
| e2e-local-stress-alpha | control | passed | completed |
| e2e-local-stress-alpha | behavior-checks | passed | completed |
| e2e-local-stress-alpha | gbrain-export | passed | completed |
| e2e-local-stress-alpha | artifact-checks | passed | completed |
| e2e-local-stress-beta | ingest | passed | completed |
| e2e-local-stress-beta | assemble | passed | completed |
| e2e-local-stress-beta | prd | passed | completed |
| e2e-local-stress-beta | gsd | passed | completed |
| e2e-local-stress-beta | gsd2-export | passed | completed |
| e2e-local-stress-beta | execution | passed | completed |
| e2e-local-stress-beta | playwright | passed | completed |
| e2e-local-stress-beta | evaluation | passed | completed |
| e2e-local-stress-beta | infra | passed | completed |
| e2e-local-stress-beta | import-ci | passed | completed |
| e2e-local-stress-beta | import-coderabbit | passed | completed |
| e2e-local-stress-beta | infra-snapshot | passed | completed |
| e2e-local-stress-beta | control | passed | completed |
| e2e-local-stress-beta | behavior-checks | passed | completed |
| e2e-local-stress-beta | gbrain-export | passed | completed |
| e2e-local-stress-beta | artifact-checks | passed | completed |

## Acceptance

| Criterion | Status |
| --- | --- |
| The benchmark can create more than one project in a vault. | passed |
| Failed checks and pending review evidence remain explicit. | passed |
| No fixture contains a real credential or requires a live host. | passed |
