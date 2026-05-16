# Realistic Benchmark Pack

Set: realistic
Generated: 2026-05-16T09:45:59.631Z

Exercise mixed source intake and manual adapter imports that resemble a real Ariadne project handoff.

## Files

| Path | Role | Description |
| --- | --- | --- |
| sources/whitepaper.md | source | Whitepaper-style source with architecture and governance requirements. |
| sources/dictated-notes.txt | source | Dictated-note style source with rough operator instructions. |
| sources/sketch-handoff.md | source | Textual handoff for a design sketch or whiteboard image. |
| imports/notebooklm-export.md | notebooklm_export | Manual NotebookLM-style export for adapter import tests. |
| imports/ci-checks.json | ci_status | Passing CI fixture for import-ci. |
| imports/coderabbit-review.md | coderabbit_review | Approved CodeRabbit-style review fixture for import-coderabbit. |
| imports/infra-snapshot.json | infra_snapshot | Read-only infrastructure snapshot fixture. |

## Recommended Commands

```bash
npm run cli -- ingest --project bench-realistic <PACK_ROOT>/sources/whitepaper.md <PACK_ROOT>/sources/dictated-notes.txt <PACK_ROOT>/sources/sketch-handoff.md
npm run cli -- assemble --project bench-realistic
npm run cli -- roadmap --project bench-realistic --target-url http://localhost:3000
npm run cli -- notebooklm-import --project bench-realistic --from <PACK_ROOT>/imports/notebooklm-export.md
npm run cli -- import-ci --project bench-realistic --from <PACK_ROOT>/imports/ci-checks.json
npm run cli -- import-coderabbit --project bench-realistic --from <PACK_ROOT>/imports/coderabbit-review.md
npm run cli -- infra-snapshot --project bench-realistic --from <PACK_ROOT>/imports/infra-snapshot.json
npm run cli -- artifact-checks --project bench-realistic
```

## Acceptance

- Mixed source intake produces three source records.
- Manual NotebookLM, CI, CodeRabbit, and infrastructure imports create evidence records.
- Control and artifact-check reports are generated without live mutations.
