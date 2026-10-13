# PROS follow-on fan-out (wave 2)

**Status:** PROS-1…13 Done on `main`. Wave 2 complete (#1755–#1757).  
**As of:** 2026-08-14  
**Backlog:** [`../pros-backlog.md`](../pros-backlog.md)

Five standalone PBIs. **One agent per PBI. One concern per PR.** Each agent
reads **only** that PBI folder plus this file and
[`../AGENT_MESSAGING.md`](../AGENT_MESSAGING.md). Do not combine PBIs.

Paste the PBI’s `AGENT.md` as the implementing agent’s prompt.

## Assignment

| PBI | Folder | Branch | Needs from siblings at runtime |
| --- | --- | --- | --- |
| PROS-9 | [`../PROS-9/`](../PROS-9/IMPLEMENTATION_PLAN.md) | `cursor/pros-9-parse-1906` | OCR extract on `main`. HITL Apply copies PROS-6. |
| PROS-10 | [`../PROS-10/`](../PROS-10/IMPLEMENTATION_PLAN.md) | `cursor/pros-10-find-law-1906` | Lookup on `main`. Corpus may grow via PROS-11; tool always calls `lookup_citation`. |
| PROS-11 | [`../PROS-11/`](../PROS-11/IMPLEMENTATION_PLAN.md) | `cursor/pros-11-cn-jpo-1906` | PROS-8 layout on `main`. Additive `cn` / `jpo` folders only. |
| PROS-12 | [`../PROS-12/`](../PROS-12/IMPLEMENTATION_PLAN.md) | `cursor/pros-12-agent-thread-1906` | Matter agent on `main`. **Takes Alembic next head first.** |
| PROS-13 | [`../PROS-13/`](../PROS-13/IMPLEMENTATION_PLAN.md) | `cursor/pros-13-docket-1906` | OA `mailed_date` on `main`. **Rebase migration onto PROS-12’s head.** |

## Exclusive owned paths (do not edit another PBI’s set)

| PBI | Exclusive (create/own) |
| --- | --- |
| PROS-9 | `backend/app/prosecution_parse.py`, `backend/app/routers/prosecution_parse.py`, `backend/app/workers/prosecution_parse_tasks.py`, `backend/tests/test_prosecution_parse.py`, `frontend/components/prosecution/office-action-parse.tsx` (+ `.test.tsx`), `frontend/e2e/pros-9-parse.spec.ts` |
| PROS-10 | `backend/app/law/find_law.py`, `backend/app/routers/law_find.py`, `backend/app/workers/law_find_tasks.py`, `backend/tests/test_law_find.py`, `frontend/components/prosecution/find-law-panel.tsx` (+ `.test.tsx`), `frontend/e2e/pros-10-find-law.spec.ts` |
| PROS-11 | `backend/app/law/corpus/cn/**`, `backend/app/law/corpus/jpo/**`, `backend/tests/test_law_cn_jpo.py`, `frontend/e2e/pros-11-cn-jpo.spec.ts` |
| PROS-12 | `backend/app/prosecution_agent_thread.py`, `backend/alembic/versions/139_prosecution_agent_threads.py` (confirm head at start), `backend/tests/test_prosecution_agent_thread.py`, `frontend/e2e/pros-12-agent-thread.spec.ts` |
| PROS-13 | `backend/app/prosecution_docket.py`, `backend/app/routers/prosecution_docket.py`, `backend/alembic/versions/14x_prosecution_docket.py` (after 12), `backend/tests/test_prosecution_docket.py`, `frontend/components/prosecution/docket-panel.tsx` (+ `.test.tsx`), `frontend/e2e/pros-13-docket.spec.ts` |

PROS-12 may **additively** edit `prosecution_agent.py` / `routers/prosecution_agent.py` / `matter-agent-panel.tsx` for `thread_id` only. Do not rewrite tools or Apply.

PROS-11 may **additively** edit `lookup.py` constants + `law-lookup-disclosure.tsx` options. Do not move US/UK/EPO files.

## Shared seams (additive only)

| Seam | Rule |
| --- | --- |
| `frontend/lib/api.ts` | Append a named export block at EOF. Do not reformat. |
| `frontend/lib/glossary.ts` | Additive nouns: `officeActionParse`, `findLaw`, `docketDeadline`. PROS-11 updates `lawJurisdiction` to name CN/JPO. |
| `docs/USER_GUIDE.md` | Append a labelled Handoff subsection. Do not rewrite siblings. PROS-10 may replace the one sentence that says there is no `find_law`. |
| `backend/app/expensive_route_catalog.py` | Additive `_route(...)` only, then `python3 scripts/generate_expensive_route_policy.py`. |
| `backend/app/job_queues.py` | PROS-9: `app.prosecution.parse` → `claim_review`. PROS-10: `app.law.find` → `claim_review`. |
| `backend/app/main.py` | `include_router` for your new router only. |
| `backend/app/ai/registry/function_registry.json` + `functions.py` + `fallback.py` + `function_estimates.json` | Additive keys only. PROS-9: `prosecution_oa_parse`. PROS-10: `law_find_law`. Rebase if both land. |
| `frontend/components/prosecution/office-action-panel.tsx` | Additive import + one mount. Do not restyle add-OA. |
| `frontend/e2e/README.md` | Register your spec only (`npm run e2e:update`). |
| `frontend/e2e/lifecycle-fixture.ts` | Additive handlers only. |
| `docs/security/tenant_access_matrix.csv` | Regenerated. Rebase if another new-router PR lands first. |
| Alembic | **PROS-12 first** (confirm `alembic heads` is exactly one). PROS-13 sets `down_revision` to 12’s revision. 9/10/11: no migration. |
| Evidence Ledger / Drawings / CI / Create / Help RAG / `#1750` signer | Do not touch. Do **not** edit `docs/delivery/AGENT_BOARD.md` while #1750 is open. |

## Copy-from

| Need | Copy from |
| --- | --- |
| Tenant 404 | `require_patent`; `test_prosecution_office_action.py` |
| Job + 502 enqueue fail | `routers/prosecution_agent.py` |
| HITL Apply | Matter-agent Apply: worker stores proposal; POST apply writes rows |
| Law miss | `lookup.py` `not_in_corpus_detail`; HTTP 200 + `found: false` |
| Preflight token | `prosecution_agent.py` / `white_paper_artwork_revisions.py` |
| Corpus JSON | `backend/app/law/corpus/epo/epc_art_54.json` |

## Honesty (every PBI)

- No product mocks or silent fallbacks. Fail closed + Retry.
- Law miss = HTTP 200 + `found: false`. Never invent statute/MPEP/EPC/PA/CN/JPO text.
- Access miss = **404**, not 403.
- Parse worker never writes `office_action_rejections`. Apply is HITL.
- `find_law` never returns model-generated statute text — only `lookup_citation` hits.
- Do not auto-flip `granted` / `abandoned` / `response_filed`.
- Docket due dates are counsel-entered. A statutory suggestion is labelled not official.

## Merge order

9 / 10 / 11 may land in any order. **12 before 13** (Alembic). Rebase shared seams after the first of 9/10 lands.

## What not to implement

Rejection auto-file with the PTO. Full CNIPA/JPO guideline dumps. A second Create/Help chatbot. Portfolio docketing product (deadlines on this patent only).
