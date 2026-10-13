# Product delivery

**Status:** Living PBI backlogs for active product programs  
**As of:** 2026-08-19

This directory holds active PBI backlogs. It is not a second public-beta or
north-star roadmap. Release gates stay in
[`../PUBLIC_BETA_CHECKLIST.md`](../PUBLIC_BETA_CHECKLIST.md). UI surface evidence
stays in
[`../../design/north-star-ui/SURFACE-TRACKER.md`](../../design/north-star-ui/SURFACE-TRACKER.md).
The map of this system is [`.planning/CANONICAL.md`](../../.planning/CANONICAL.md)
— that file is not a backlog.

### Where the plan, todo, and tests live

| Artifact | File | CRAFT example |
|---|---|---|
| Program intent + locks | `*-PROGRAM.md` | [`CRAFT-PROGRAM.md`](CRAFT-PROGRAM.md) |
| Todo list (PBI status) | `*-backlog.md` | [`craft-backlog.md`](craft-backlog.md) |
| Sequenced engineering plan | `<PROG>/IMPLEMENTATION_PLAN.md` | [`CRAFT/IMPLEMENTATION_PLAN.md`](CRAFT/IMPLEMENTATION_PLAN.md) |
| Test plan | `<PROG>/TEST_PLAN.md` + task `## Test Plan` + `*-E2E` | [`CRAFT/TEST_PLAN.md`](CRAFT/TEST_PLAN.md) |
| Per-PBI mini-PRD | `<PBI>/prd.md` | [`CRAFT-1/prd.md`](CRAFT-1/prd.md) |
| Per-PBI task index | `<PBI>/tasks.md` | [`CRAFT-1/tasks.md`](CRAFT-1/tasks.md) |
| Dated competitive note | `docs/archive/reviews/` | [`../archive/reviews/COMPETITIVE_GAP_MCUBE_2026-08-19.md`](../archive/reviews/COMPETITIVE_GAP_MCUBE_2026-08-19.md) |

Do not add `TODO.md` next to a backlog. The backlog row is the todo.

Older numeric PBIs 1–8 are historical under
[`../archive/delivery/`](../archive/delivery/).

## Active programs

This index maps a program to the files that own it. It deliberately carries no
per-item status: a status written here is a copy, and every copy in this table
had drifted from its backlog — LM-0…6 were listed as Proposed after four of
them were Done and LM-0 had moved to awaiting a script lock, and CRAFT was
listed as 4–13 Proposed after all thirteen were Done. **The backlog row is the
status.** Read it there.

| Program | ID range | Backlog | Brief |
|---|---|---|---|
| Help system | HELP-1…7 | [`backlog.md`](backlog.md) | [`HELP-PROGRAM.md`](HELP-PROGRAM.md) |
| Create shortlist loop | CREATE-1 | [`create-backlog.md`](create-backlog.md) | [`CREATE-PROGRAM.md`](CREATE-PROGRAM.md) |
| Prosecution after Handoff | PROS-1…13 | [`pros-backlog.md`](pros-backlog.md) | [`PROS-PROGRAM.md`](PROS-PROGRAM.md) |
| Last mile — RLLB evidence chain | LM-0…6 | [`last-mile-backlog.md`](last-mile-backlog.md) | [`LAST-MILE-PROGRAM.md`](LAST-MILE-PROGRAM.md) |
| Security findings | SEC-1…8 | [`sec-backlog.md`](sec-backlog.md) | [`SEC-PROGRAM.md`](SEC-PROGRAM.md) |
| Briefing kinds, org profiles, presentations | BRIEF-1…8 | [`brief-backlog.md`](brief-backlog.md) | [`BRIEF-PROGRAM.md`](BRIEF-PROGRAM.md) |
| US drafting craft vs M-Cube | CRAFT-1…13 | [`craft-backlog.md`](craft-backlog.md) | [`CRAFT-PROGRAM.md`](CRAFT-PROGRAM.md) |
| Clarity — invention-centric surface, fidelity, counsel | CLR-0…32 | [`clr-backlog.md`](clr-backlog.md) | [`CLR-PROGRAM.md`](CLR-PROGRAM.md) · first-time nav brief [`CLR/IA-FIRST-TIME-NAV-BRIEF.md`](CLR/IA-FIRST-TIME-NAV-BRIEF.md) |

## Multi-agent messaging

| Document | Owns |
|---|---|
| [`AGENT_MESSAGING.md`](AGENT_MESSAGING.md) | Protocol: claims, notes, checklist |
| [`AGENT_BOARD.md`](AGENT_BOARD.md) | Generated index of [`board/`](board/): one claim file per branch, one note file per note |
| [`../../scripts/agents/list_open_pr_files.sh`](../../scripts/agents/list_open_pr_files.sh) | Open-PR file scan |

Open GitHub PRs remain authoritative for exact file lists. The board is for
pre-PR claims and “say so” notes only.

| Document | Owns |
|---|---|
| `*-backlog.md` / `backlog.md` | Ordered PBIs, status, CoS summary, history |
| `*-PROGRAM.md` | Program intent and collision rules |
| `<PBI>/prd.md` | Per-PBI mini-PRD |
| `<PBI>/tasks.md` | Task index for that PBI |
| `CREATE-1/IMPLEMENTATION_PLAN.md` | Sequenced engineering plan + collision matrix |
| `PROS/IMPLEMENTATION_PLAN.md` | Prosecution first-slice plan (shipped #1715 + #1720) |
| `PROS/FANOUT.md` | Parallel follow-on assignment (wave 2: PROS-9…13) |
| `LAST-MILE/IMPLEMENTATION_PLAN.md` | RLLB last-mile sequence, seed contract, collision matrix |
| `CRAFT/IMPLEMENTATION_PLAN.md` | Wave 1: vision on evidence + claim-approval gate (US) |
| `CRAFT/TEST_PLAN.md` | CRAFT scenarios, env, CoS commands |
| `CRAFT/FANOUT.md` | Waves 2–4 (OA strategy, node log, UK/EPO later) |

Before starting an implementation task: read the program collision section,
read [`AGENT_BOARD.md`](AGENT_BOARD.md), claim your seams, and run
`scripts/agents/list_open_pr_files.sh`.
