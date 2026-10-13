# Canonical planning index

**Status:** Living planning index  
**As of:** 19 August 2026

This file is the **single map** of where plans live. It is not a backlog, not
a todo list, and not a release checklist. Do not copy PBI status, SHAs, or
gate state into this file.

## One planning system

There is one system. Each question has one owner. Do not add a parallel
roadmap or a second todo file.

| You need | Owner | Not |
|---|---|---|
| **What product work is in flight?** | [`docs/delivery/README.md`](../docs/delivery/README.md) and that program’s `*-backlog.md` | A new roadmap markdown, `BETA_TODO.md` as a feature list, this file |
| **Detailed plan / tasks / test plan for a PBI** | That PBI folder: `prd.md`, `tasks.md`, `IMPLEMENTATION_PLAN.md` or the program plan, plus `## Test Plan` on every task | A second TODO file, a chat-only plan |
| **Who is editing which seam?** | [`docs/delivery/AGENT_BOARD.md`](../docs/delivery/AGENT_BOARD.md) + open PRs (`scripts/agents/list_open_pr_files.sh`) | Restating file lists here |
| **Is the release allowed?** | [`docs/PUBLIC_BETA_CHECKLIST.md`](../docs/PUBLIC_BETA_CHECKLIST.md) | Delivery backlogs, this index |
| **Did this UI surface ship?** | [`design/north-star-ui/SURFACE-TRACKER.md`](../design/north-star-ui/SURFACE-TRACKER.md) | A PBI inventing a second surface tracker |
| **Dated research (competitive, audits)** | [`docs/archive/`](../docs/archive/) | Treating an archive review as a living backlog |

**How a feature is planned (CRAFT, PROS, CREATE, …):**

1. Gap or intent → dated note under `docs/archive/` if it is research, **or**
   straight to a program brief if it is already a delivery decision.
2. Program brief (`*-PROGRAM.md`) + backlog row (`*-backlog.md`) — the
   **todo list**.
3. `IMPLEMENTATION_PLAN.md` — sequenced PRs, collisions, APIs.
4. Each Agreed PBI: `prd.md` + `tasks.md` + per-task file with
   Requirements, Implementation Plan, **Test Plan**, Verification.
5. Program or PBI `TEST_PLAN.md` / `*-E2E.md` — CoS tests.
6. Implementation on a `cursor/` / `claude/` / `jxw/` branch; claim the board;
   one concern per PR.

If two delivery docs disagree about whether a PBI is in scope, the
**backlog row** wins. If two docs disagree about how to build the current
wave, that wave’s `IMPLEMENTATION_PLAN.md` wins. Archive reviews never win.

## Current release context

Resolve the current `main` revision from Git and the current deployed revision
from the private exact-SHA release packet. Runtime lineage for north-star UI
work is append-only in
[`design/north-star-ui/RELEASE_LEDGER.csv`](../design/north-star-ui/RELEASE_LEDGER.csv).
The public-beta decision and gate state live in
[`docs/PUBLIC_BETA_CHECKLIST.md`](../docs/PUBLIC_BETA_CHECKLIST.md), not in this
index. Do not copy a mutable PR, SHA, migration head, registration mode, or
service count into this file.

## Active sources

### Product delivery (the work queue)

Index: [`docs/delivery/README.md`](../docs/delivery/README.md).

| Program | Backlog | Brief / plan |
|---|---|---|
| Help (Done) | [`backlog.md`](../docs/delivery/backlog.md) | [`HELP-PROGRAM.md`](../docs/delivery/HELP-PROGRAM.md) |
| Create shortlist | [`create-backlog.md`](../docs/delivery/create-backlog.md) | [`CREATE-PROGRAM.md`](../docs/delivery/CREATE-PROGRAM.md) |
| Prosecution | [`pros-backlog.md`](../docs/delivery/pros-backlog.md) | [`PROS-PROGRAM.md`](../docs/delivery/PROS-PROGRAM.md) |
| Last mile (RLLB) | [`last-mile-backlog.md`](../docs/delivery/last-mile-backlog.md) | [`LAST-MILE-PROGRAM.md`](../docs/delivery/LAST-MILE-PROGRAM.md) |
| Security | [`sec-backlog.md`](../docs/delivery/sec-backlog.md) | [`SEC-PROGRAM.md`](../docs/delivery/SEC-PROGRAM.md) |
| Briefing | [`brief-backlog.md`](../docs/delivery/brief-backlog.md) | [`BRIEF-PROGRAM.md`](../docs/delivery/BRIEF-PROGRAM.md) |
| US drafting craft (CRAFT) | [`craft-backlog.md`](../docs/delivery/craft-backlog.md) | [`CRAFT-PROGRAM.md`](../docs/delivery/CRAFT-PROGRAM.md) · [wave 1 plan](../docs/delivery/CRAFT/IMPLEMENTATION_PLAN.md) · [test plan](../docs/delivery/CRAFT/TEST_PLAN.md) |

Coordination: [`AGENT_MESSAGING.md`](../docs/delivery/AGENT_MESSAGING.md),
[`AGENT_BOARD.md`](../docs/delivery/AGENT_BOARD.md).

### Release

- [`docs/PUBLIC_BETA_CHECKLIST.md`](../docs/PUBLIC_BETA_CHECKLIST.md) — gates
- [`docs/PUBLIC_BETA_STATUS.md`](../docs/PUBLIC_BETA_STATUS.md) — dated snapshot
- [`docs/PUBLIC_BETA_SCALE_PLAN.md`](../docs/PUBLIC_BETA_SCALE_PLAN.md) — acceptance
- [`docs/BETA_TODO.md`](../docs/BETA_TODO.md) — historical release evidence, not
  a feature backlog
- [`docs/OPERATOR_PLAYBOOK.md`](../docs/OPERATOR_PLAYBOOK.md) — operator sequence

### Design and UX

- [`docs/UX_GUIDE.md`](../docs/UX_GUIDE.md)
- [`docs/STYLE_GUIDE.md`](../docs/STYLE_GUIDE.md)
- [`design/north-star-ui/README.md`](../design/north-star-ui/README.md)
- [`design/north-star-ui/SURFACE-TRACKER.md`](../design/north-star-ui/SURFACE-TRACKER.md)
- [`design/north-star-ui/RELEASE_LEDGER.csv`](../design/north-star-ui/RELEASE_LEDGER.csv)

### Architecture and engineering

- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)
- [`docs/DEVELOPER_GUIDE.md`](../docs/DEVELOPER_GUIDE.md)
- [`docs/OPERATIONS_GUIDE.md`](../docs/OPERATIONS_GUIDE.md)
- [`docs/security/README.md`](../docs/security/README.md)
- [`docs/README.md`](../docs/README.md)
- [`CI.md`](../CI.md), [`AGENTS.md`](../AGENTS.md), [`CONTRIBUTING.md`](../CONTRIBUTING.md)
- [`docs/operations/AI_REVIEW_BOTS.md`](../docs/operations/AI_REVIEW_BOTS.md)

North-star compatibility pointer (validator):
[`milestones/NORTH-STAR-UI-IMPLEMENTATION.md`](milestones/NORTH-STAR-UI-IMPLEMENTATION.md).

## Planning rules

1. Use the owning document in the tables above. Do not create a parallel
   roadmap, checklist, UX audit, style guide, architecture snapshot, or
   release ledger.
2. Before **product-code** work, pick **one Agreed PBI** from a delivery
   backlog (or one surface-tracker row for UI-only north-star work). Claim
   seams on the agent board. Do not start from an archive review alone.
3. Keep release state in the public-beta checklist. Do not copy SHA, health,
   or provider values into plans unless they are dated evidence with a source
   link.
4. Archived plans under [`archive/`](archive/) and
   [`../docs/archive/`](../docs/archive/) are historical. Promote a still-valid
   action into a backlog row before working on it.
5. Keep `main` and production claims exact-SHA based. Re-fetch before
   branching. Deploy only via the UAT-first rules in
   `docs/operations/UAT_RELEASES.md`.
