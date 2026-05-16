# Smoke Benchmark Pack

Set: smoke
Generated: 2026-05-16T09:45:59.627Z

Prove the minimum evidence-to-control pipeline on one compact Markdown source.

## Files

| Path | Role | Description |
| --- | --- | --- |
| sources/source.md | source | Single compact source covering intake, planning, execution, verification, and control. |
| expected/required-artifacts.json | expected | Required artifact ids expected from the standard roadmap plus artifact-checks flow. |

## Recommended Commands

```bash
npm run ariadne -- ingest --project bench-smoke <PACK_ROOT>/sources/source.md
npm run ariadne -- assemble --project bench-smoke
npm run ariadne -- roadmap --project bench-smoke --target-url http://localhost:3000
npm run ariadne -- artifact-checks --project bench-smoke
```

## Acceptance

- Artifact checks pass with no missing required artifacts.
- The generated PRD contains the core evidence, planning, verification, and control requirements.
- No command requires a live external service.
