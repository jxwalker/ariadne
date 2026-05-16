# Stress Benchmark Pack

Set: stress
Generated: 2026-05-16T09:45:59.633Z

Exercise stale, failed, noisy, and multi-project conditions without including real secrets or live system mutations.

## Files

| Path | Role | Description |
| --- | --- | --- |
| project-alpha/source.md | source | First project source for multi-project vault tests. |
| project-beta/source.md | source | Second project source for multi-project vault tests. |
| imports/failed-ci.json | ci_status | Failing CI fixture for control-plane regression tests. |
| imports/pending-coderabbit-review.md | coderabbit_review | Pending review fixture with no approval signal. |
| imports/odd-infra-snapshot.json | infra_snapshot | Valid JSON with unusual shape for snapshot summarisation tests. |
| stale/interrupted-run.json | execution_seed | Interrupted execution fixture for future benchmark-run ingestion. |

## Recommended Commands

```bash
npm run ariadne -- ingest --project bench-stress-alpha <PACK_ROOT>/project-alpha/source.md
npm run ariadne -- ingest --project bench-stress-beta <PACK_ROOT>/project-beta/source.md
npm run ariadne -- import-ci --project bench-stress-beta --from <PACK_ROOT>/imports/failed-ci.json
npm run ariadne -- import-coderabbit --project bench-stress-beta --from <PACK_ROOT>/imports/pending-coderabbit-review.md
npm run ariadne -- infra-snapshot --project bench-stress-beta --from <PACK_ROOT>/imports/odd-infra-snapshot.json
```

## Acceptance

- The benchmark can create more than one project in a vault.
- Failed checks and pending review evidence remain explicit.
- No fixture contains a real credential or requires a live host.
