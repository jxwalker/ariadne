# Ariadne MVP User Guide

This guide is for getting from messy project material to a visible, tested, reviewable Ariadne workflow without learning every command.

## Install Once

From the repo root:

```bash
./scripts/ariadne-mvp-setup.sh
```

The script installs dependencies, installs Playwright Chromium, typechecks, runs tests, builds the runner, generates the console, and prints the next guide.

If you use a different project name:

```bash
ARIADNE_PROJECT=my-project ./scripts/ariadne-mvp-setup.sh
```

## Daily Start

Use this as the normal entrypoint:

```bash
npm run ariadne -- guide --project ariadne
```

Then open:

```text
vault/projects/ariadne/console/index.html
```

The console is the human cockpit. Hermes is the background runtime for scheduling, sleep, memory, mail, and coordination. GBrain is advisory memory. NotebookLM is source-grounded research input. The `ariadne` runner is the expert automation surface behind the UI.

## What To Look At First

![Ariadne console overview](images/console-overview.png)

Read the console top to bottom:

1. **Workflow lane**: Capture, Shape, Build, Verify, Review, Operate.
2. **Next Best Action**: the one thing to do now.
3. **Evidence checklist**: the current operator evidence target, current section, and context counts.
4. **Interaction routes**: choose the route that matches your intent.
5. **Gate and evidence panels**: proof, blockers, runtime state, and reviews.

When operator evidence is the blocker, the checklist becomes the main work surface:

![Operator evidence checklist](images/evidence-checklist.png)

The checklist can tell you where context exists and where to begin. It still cannot verify facts for you. Only the human-filled `operator-evidence.md` plus a passing preflight can move the gate.

## The Four Routes

| Route | Use it when | Main surface |
| --- | --- | --- |
| Idea to working system | You have notes, drawings, dictated ideas, screenshots, white papers, or NotebookLM exports. | Ariadne Console |
| Implementation slice | You are building a bounded feature through branch, tests, PR, review, and merge. | Ariadne Console plus runner |
| Operator evidence gate | Ariadne is blocked because a human must verify real external-system facts. | Ariadne Console |
| Sleep, memory, and automation loop | You are wiring Hermes routines, GBrain memory, agent mail, or recurring refreshes. | Hermes plus Ariadne evidence |

## Current MVP State

The current Ariadne project already has the intake, planning, verification, console, GBrain advisory context, and evaluation spine working.

The current blocker is intentional: live-adapter work is stopped until operator evidence is filled from real systems. Generated notes, GBrain output, and promoted live evidence can help you review, but they do not count as operator proof by themselves.

For the current target:

```bash
npm run ariadne -- guide --project ariadne
```

Follow the **Evidence checklist**:

- Start with the current section.
- Use the listed assist and evidence refs as context.
- Record only verified observations in `operator-evidence.md`.
- Run the preflight command.
- Import only after the preflight is complete.

## Add New Source Material

Put ideas and research into Ariadne as files:

```bash
npm run ariadne -- ingest --project ariadne ./notes.md ./whitepaper.docx
npm run ariadne -- assemble --project ariadne
npm run ariadne -- console-html --project ariadne --refresh-data
```

For NotebookLM, export reviewed notes to a file, then import:

```bash
npm run ariadne -- notebooklm-import --project ariadne --from notebooklm-export.md
```

For drawings, audio, or PDFs, create an extraction plan first, then import reviewed extracted text:

```bash
npm run ariadne -- extraction-plan --project ariadne --record <record-id> --tool manual --host "M5 Max" --runner mac
npm run ariadne -- extraction-import --project ariadne --record <record-id> --from extracted.md --kind visual-description --tool manual-review
```

## Refresh The Console

Use this when the state feels stale:

```bash
npm run ariadne -- roadmap-control-refresh --project ariadne
```

The command refreshes the control artifacts, GBrain export, console data, and console HTML in one pass.

## Verify The MVP

Before trusting a change:

```bash
npm run check
npm test
npm run build
npm run ariadne -- console-visual-checks --project ariadne
npm run ariadne -- console-browser-checks --project ariadne
npm run ariadne -- e2e-smoke --project ariadne
```

`e2e-smoke` may report `blocked` while operator evidence is missing. That is a correct MVP result if the failed count is zero.

## Command Reference

Most users should not start with the full command list. Use it only when the console or guide points you there:

- [Command reference](command-reference.md)
- [Workflows](workflows.md)
- [Developer guide](developer-guide.md)
- [Evaluation guide](evaluation.md)
- [Deployment guide](deployment.md)
