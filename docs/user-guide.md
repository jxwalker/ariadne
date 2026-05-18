# Ariadne MVP User Guide

This guide is for the first useful version of Ariadne: install it once, open the console, follow the next action, and keep the work evidence-backed.

You do not need to learn every command to use the MVP.

## 1. Install Once

From the repo root:

```bash
./install.sh
```

The installer checks Node.js, installs dependencies, installs Playwright Chromium, runs type checks and tests, builds Ariadne, refreshes the control plane, verifies the console, captures a browser screenshot, and prints the next operator handoff.

Use the same command after pulling updates:

```bash
git pull --ff-only
./install.sh
```

If the wrapper is not executable on your machine, use the npm script directly:

```bash
npm run setup:mvp
```

If you want to initialise a different project name:

```bash
ARIADNE_PROJECT=my-project npm run setup:mvp
```

When setup completes, open the console path it prints:

```text
vault/projects/ariadne/console/index.html
```

On macOS you can open it directly:

```bash
open vault/projects/ariadne/console/index.html
```

## 2. Start In The Console

![Ariadne console overview](images/console-overview.png)

The console is the normal operating surface. Read it in this order:

1. Workflow lane: where the project sits from Capture to Operate.
2. Next Best Action: the one thing to do now.
3. Action steps: the few steps behind that next action.
4. Evidence checklist: the current human proof gate, if one exists.
5. Gate and evidence panels: checks, runtime state, reviews, blockers, and trend evidence.

The console is local static HTML. It does not mutate external systems.

For the MVP, treat every session as this loop:

```text
Open console -> read Next Best Action -> do only that action -> run the printed check -> reopen console
```

## 3. Use One Handoff Command

When you need the smallest current instruction:

```bash
npm run ariadne -- operator-next --project ariadne
```

This refreshes the current operator packet and prints:

- target;
- evidence file to fill;
- current missing section;
- one-section guide command;
- preflight command; and
- later import command.

When you want only the current missing section:

```bash
npm run ariadne -- operator-section --project ariadne
```

When you want a guided workflow explanation:

```bash
npm run ariadne -- guide --project ariadne
```

## 4. Understand The Current MVP Blocker

The MVP can already ingest sources, shape work, plan implementation, generate verification plans, render the console, run checks, collect evidence, and score evaluation runs.

The current whole-roadmap blocker is deliberate: live adapters are stopped until a human verifies real external-system facts.

![Operator evidence checklist](images/evidence-checklist.png)

For an operator evidence gate:

1. Run `operator-next`.
2. Open the evidence file it prints.
3. Start with the file's **Current Section Handoff** and **Section Fill Order**.
4. Fill only facts you verified from the real system.
5. Use generated assist files, GBrain notes, and promoted live evidence as review context only.
6. Run the printed preflight command.
7. Import the evidence only after preflight passes.

Generated notes are never proof by themselves.

## 5. Add New Ideas Or Research

Put raw project material into the vault:

```bash
npm run ariadne -- ingest --project ariadne ./notes.md ./whitepaper.docx
npm run ariadne -- assemble --project ariadne
npm run ariadne -- roadmap-control-refresh --project ariadne
```

Then reopen:

```text
vault/projects/ariadne/console/index.html
```

NotebookLM exports should be imported as reviewed source files:

```bash
npm run ariadne -- notebooklm-import --project ariadne --from notebooklm-export.md
```

Drawings, screenshots, PDFs, and dictated audio should be turned into reviewed text before they become planning evidence:

```bash
npm run ariadne -- extraction-plan --project ariadne --record <record-id> --tool manual --host "M5 Max" --runner mac
npm run ariadne -- extraction-import --project ariadne --record <record-id> --from extracted.md --kind visual-description --tool manual-review
```

## 6. Choose The Right Route

| Route | Start here | What you do |
| --- | --- | --- |
| Idea to working system | Console | Add sources, assemble context, shape PRD/GSD tasks, then follow the next action. |
| Implementation slice | Console plus runner | Work one branch, run checks, capture Playwright evidence, import review/CI state, then assess readiness. |
| Operator evidence gate | Console plus evidence file | Verify real external-system facts, fill `operator-evidence.md`, preflight, then import. |
| Sleep and memory loop | Hermes plus Ariadne evidence | Record scheduled routines, memory proposals, agent mail, leases, and runtime state. |

Hermes is the background runtime, not the whole UI. Ariadne remains the evidence cockpit. NotebookLM and GBrain provide context; they do not approve work.

## 7. Verify The MVP

For normal development:

```bash
npm run check
npm test
npm run build
```

For console/UI evidence:

```bash
npm run ariadne -- console-visual-checks --project ariadne
npm run ariadne -- console-browser-checks --project ariadne
```

For the full local smoke path:

```bash
npm run ariadne -- e2e-smoke --project ariadne
```

`e2e-smoke` can correctly report `blocked` while operator evidence is missing. The MVP pass condition is that the pipeline runs and reports `0 failed`.

## 8. Where To Go Next

- [Workflow Guide](workflows.md): how the user routes fit together.
- [Developer Guide](developer-guide.md): how to change Ariadne safely.
- [Command Reference](command-reference.md): dense expert command list.
- [Evaluation Guide](evaluation.md): how to measure pipeline quality.
- [Deployment Guide](deployment.md): how Ariadne maps across Macs, DGX Spark, Proxmox, and TrueNAS.
