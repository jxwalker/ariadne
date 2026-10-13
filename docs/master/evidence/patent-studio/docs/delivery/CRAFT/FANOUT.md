# CRAFT follow-on fan-out (waves 2–4)

**Status:** Waves 2–4 Done on `main` (CRAFT-3…13 merged 2026-08-21).  
**As of:** 2026-08-21  
**Backlog:** [`../craft-backlog.md`](../craft-backlog.md)  
**Wave 1:** [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md)  
**Test contracts:** [`TEST_PLAN.md`](./TEST_PLAN.md) §§4–6

One agent per PBI. One concern per PR. Wave 1 (CRAFT-1/2/E2E) is **not** in
this file.

## Wave 2 — Meet the remaining M-Cube loops (US)

| PBI | Needs from siblings / others | Beat M-Cube by |
| --- | --- | --- |
| [CRAFT-3](../CRAFT-3/prd.md) | Wave 1 jobs exist | Persist node artifacts on the job; no RAM session, no request-held SSE |
| [CRAFT-4](../CRAFT-4/prd.md) | CRAFT-1 gate on `main` | Verbatim quotes; fail if quote not in evidence; reuse Evidence Ledger |
| [CRAFT-5](../CRAFT-5/prd.md) | **WAIT PROS-9** parse Apply | HITL on **strategy** before redline (M-Cube OA has no HITL) |
| [CRAFT-6](../CRAFT-6/prd.md) | Law lookup on `main` | 35 U.S.C. 132 + MPEP 2163 retrieve-or-fail (they have no corpus) |
| [CRAFT-7](../CRAFT-7/prd.md) | CRAFT-5 or matter-agent Apply | Admission warnings; never auto-rewrite |

CRAFT-3 and CRAFT-6 have no runtime dependency on each other. CRAFT-4 needs
the gate. CRAFT-5 must not edit PROS-9 exclusive files; mount additively on
the Office action tab.

### Exclusive owned paths (wave 2)

| PBI | Exclusive |
| --- | --- |
| CRAFT-3 | `backend/app/drafting/node_log.py`, job metadata schema + `frontend/components/jobs/job-node-timeline.tsx`, `frontend/e2e/craft-3-node-log.spec.ts` |
| CRAFT-4 | `backend/app/drafting/claim_traceability.py`, `frontend/components/drafting/claim-traceability-panel.tsx` |
| CRAFT-5 | `backend/app/prosecution_strategy.py`, `backend/app/routers/prosecution_strategy.py`, `backend/app/workers/prosecution_strategy_tasks.py`, `frontend/components/prosecution/oa-strategy-panel.tsx` |
| CRAFT-6 | `backend/app/law/corpus/us/35_usc_132.json`, `backend/app/law/corpus/us/mpep_2163.json`, amendment-gate helper in `backend/app/drafting/new_matter.py` |
| CRAFT-7 | `backend/app/prosecution_admission_audit.py`, mount on existing Apply |

## Wave 3 — Beat compare and polish (US)

| PBI | Needs | Beat M-Cube by |
| --- | --- | --- |
| [CRAFT-8](../CRAFT-8/prd.md) | CRAFT-2 map | Collision cells on **existing** `ClaimElementCitation`; we also **search** art |
| [CRAFT-9](../CRAFT-9/prd.md) | CRAFT-2 + 1.84 renderer | Feed mismatches into `claim_tightener`; HITL; generated sheets + inventor figures |
| [CRAFT-10](../CRAFT-10/prd.md) | PROS-4 extract | USPTO notice structure (not CNIPA headings) |

## Wave 4 — UK and EU (later)

Do not start until US wave 2 is Done and the user Agrees jurisdiction work.
Jurisdiction is always explicit. US BRI and EP Art. 69 never mix on one chart.

| PBI | Scope |
| --- | --- |
| [CRAFT-11](../CRAFT-11/prd.md) | UKIPO spec section set + UK new-matter lookup |
| [CRAFT-12](../CRAFT-12/prd.md) | EPO problem-solution + Art. 123(2) on OA strategy |
| [CRAFT-13](../CRAFT-13/prd.md) | UKIPO / EPO OA notice extractors |

## Todo when a later PBI is Agreed

1. Write `<PBI>/IMPLEMENTATION_PLAN.md` (PROS-9 length) if the PRD is not
   enough for one agent.
2. Add `tasks.md` rows and per-task files with `## Test Plan`.
3. Implement the first failing tests from [`TEST_PLAN.md`](./TEST_PLAN.md)
   for that PBI.
4. Claim seams on the board. Do not start from the archive review alone.

## Shared seams (all later waves)

Same additive rules as the program brief. `frontend/lib/api.ts` EOF only.
No sixth rail item. No FTO. No official forms. No silent vision fallbacks.

## What not to implement (ever, in CRAFT)

- CNIPA 意见陈述书, Article 33 as a product surface, Chinese-only UI
- Tauri / CLI desktop / Jaccard RAG / JSON-in-Word “replacement sheets”
- Marketing “complete avoidance of new matter”
- Create or Help lawyer chatbot
- Second claim-chart database
