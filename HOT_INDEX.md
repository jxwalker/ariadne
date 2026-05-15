# Hot Index

This is the working doorway into the dev-pipeline repository.

## Current State

- The repository now has the roadmap control spine: intake, PRD, GSD tasks, execution plans, Playwright plans, control reports, and infrastructure registry contracts.
- The implementation remains non-mutating for external repositories, Proxmox, runners, and model services.
- Live adapters should be added only after their read-only evidence path is tested.

## Canonical Source Documents

- `/Users/james/Downloads/Designing the Ultimate Agentic Coding System.docx`
- `/Users/james/Downloads/ars_memoriae_whitepaper_revised.md`
- `/Users/james/Downloads/codex_hermes_infra_spec.md`

## Commands

```bash
npm run cli -- ingest --project agentic-coding <files...>
npm run cli -- assemble --project agentic-coding
npm run cli -- roadmap --project agentic-coding --target-url http://localhost:3000 --repo /Users/james/Documents/dev/dev-pipeline
npm run cli -- control --project agentic-coding
npm run cli -- status --project agentic-coding
npm run check
npm test
```
