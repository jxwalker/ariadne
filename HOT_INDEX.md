# Hot Index

This is the working doorway into the Ariadne repository.

## Current State

- The repository now has the roadmap control spine: intake, PRD, GSD tasks, execution plans, Playwright plans, control reports, and infrastructure registry contracts.
- The implementation remains non-mutating for external repositories, Proxmox, runners, and model services.
- Live adapters should be added only after their read-only evidence path is tested.

## Canonical Source Documents

- `/Users/james/Downloads/Designing the Ultimate Agentic Coding System.docx`
- `/Users/james/Downloads/ars_memoriae_whitepaper_revised.md`
- `/Users/james/Downloads/codex_hermes_infra_spec.md`

## Commands

Set `REPO_PATH` to the repository you want Ariadne to plan against, or replace it with a relative path such as `.`.

```bash
npm run ariadne -- ingest --project agentic-coding <files...>
npm run ariadne -- assemble --project agentic-coding
npm run ariadne -- roadmap --project agentic-coding --target-url http://localhost:3000 --repo "$REPO_PATH"
npm run ariadne -- control --project agentic-coding
npm run ariadne -- status --project agentic-coding
npm run check
npm test
```
