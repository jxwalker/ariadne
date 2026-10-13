# Product Backlog — Prosecution after Handoff

Single source of truth for proposed PROS PBIs, ordered by implementation
sequence (hygiene first because it needs no migration).

Program brief: [`PROS-PROGRAM.md`](PROS-PROGRAM.md)  
Plan: [`PROS/IMPLEMENTATION_PLAN.md`](PROS/IMPLEMENTATION_PLAN.md)

**Status of this backlog:** PROS-1…13 Done on `main`. Write-ups: [`PROS-PROGRAM.md`](./PROS-PROGRAM.md). Fan-out: [`PROS/FANOUT.md`](./PROS/FANOUT.md).

| ID | Actor | User Story | Status | Conditions of Satisfaction (CoS) |
| --- | --- | --- | --- | --- |
| [PROS-3](./PROS-3/prd.md) | Inventor / counsel | As I edit claims, I want antecedent-basis and indefiniteness **warnings** on the claim tree so I can fix dumb §112 issues before I spend AI on expansion. | Done | Deterministic linter on `Claim.depends_on`; GET warnings; claims UI shows warning not error; never auto-rewrite; no legal-verdict copy. |
| [PROS-2](./PROS-2/prd.md) | Inventor / counsel | As I review claims or an office action, I want the **exact current wording** of a cited US provision, or an honest miss, so the product never invents MPEP/statute text. | Done | In-repo edition-stamped corpus; lookup by citation; missing → “not in corpus”; sync-allowed; no LLM `find_law` in v1. |
| [PROS-1](./PROS-1/prd.md) | Counsel / inventor | As counsel after Handoff, I want an **office action and a response** as durable objects on the patent — PDF attached, rejections listed, arguments I write — not a filing-status stamp. | Done | Handoff tab; upload via existing sources; structured rejections; response rows; originals sacred; no OCR/AI parse/amendment redlines in v1. |
| [PROS-E2E](./PROS/PROS-E2E.md) | Engineer | As a reviewer, I want one counsel-path CoS spec so hygiene, lookup, and OA/response are proven together. | Done | Playwright + API CoS; registered in `e2e/README.md`. |
| [PROS-4](./PROS-4/prd.md) | Counsel | As counsel on Handoff, I want searchable text from the attached office-action PDF so I can quote the examiner without retyping a scan. | Done | Job-only OCR; extract stored as Evidence; original bytes/hash unchanged; fail stays failed + Retry; no silent empty extract; no auto-parse of rejection rows in this PBI. |
| [PROS-7](./PROS-7/prd.md) | Counsel | As counsel, I want the patent’s Filing status to show Office action once I have attached one, without me remembering to set the stamp. | Done | First OA sets `filing_status` to `office_action`; stamp ≠ document; glossary still distinguishes them; not a docketing system. |
| [PROS-5](./PROS-5/prd.md) | Counsel | As counsel, I want a proposed claim amendment as a reviewable redline against the current claim set, and a path to native Word tracked changes, without losing the ledger. | Done | Artifact-revision propose→apply; originals sacred until apply; Word DOCX is export/sync; accepted claims stay in Postgres; open X still fail closed. |
| [PROS-8](./PROS-8/prd.md) | Counsel | As counsel on a UK or EPO matter (then other offices), I want retrieve-or-fail lookup for that jurisdiction, with jurisdiction explicit so US BRI and EP Art. 69 are never mixed. | Done | Same lookup interface as PROS-2; UK + EPO corpora first; explicit jurisdiction on the review; miss ≠ invented text; no `find_law` LLM. |
| [PROS-6](./PROS-6/prd.md) | Counsel | As counsel on one patent, I want a narrow agent that can look up a provision, read the OA extract, and draft against rejection rows — with HITL and a visible tool trail. | Done | Patent-scoped; must use existing tools; law miss stays a miss; job-only + preflight; HITL before apply; not Create/Help chat; OCR extract optional (`no_extract`). |
| [PROS-9](./PROS-9/prd.md) | Counsel | As counsel with a succeeded OA extract, I want proposed rejection rows I can Apply, so I do not retype grounds the letter already states. | Done | HITL; quote must appear in extract; worker never writes rows; `no_extract` is honest; not a certified OA. |
| [PROS-10](./PROS-10/prd.md) | Counsel | As counsel, I want to ask where a doctrine lives and get the shipped excerpt, not a remembered paraphrase. | Done | LLM returns citations only; text from `lookup_citation`; invented cite = miss; job-only + preflight. |
| [PROS-11](./PROS-11/prd.md) | Counsel | As counsel on a CN or JP matter, I want retrieve-or-fail lookup for that office’s key articles. | Done | Curated CN + JPO excerpts; official URLs; cross-office miss; no scrape; no invented law. |
| [PROS-12](./PROS-12/prd.md) | Counsel | As counsel, I want a follow-up Ask on the same office action to see the prior trail, not a blank turn. | Done | Thread + message tables; `thread_id` on the turn job; worker still does not write responses; one Alembic head. |
| [PROS-13](./PROS-13/prd.md) | Counsel | As counsel, I want a response due date on this patent’s office action that I entered, not a silent PTO calendar. | Done | Counsel-entered dates; optional labelled US SSP suggestion; never auto-flip granted/abandoned/response_filed. |
| PROS-14 | Inventor / counsel | As I edit claims, I want dependency, multiple-dependent (37 CFR 1.75(c)), §112(f) trigger and fee-threshold **warnings** alongside antecedent basis. | Agreed | Extends PROS-3 in the same deterministic engine; warnings only; no legal-verdict copy; the "about" false positive is fixed. |
| PROS-15 | Counsel | As counsel responding to an office action, I want a 37 CFR 1.121(c) claim listing (status identifiers, underlining and strike-through, canceled claims by number) as a Word file. | Agreed | Built from the existing amendment model. |
| PROS-16 | Counsel | As counsel, I want scanned office actions read by OCR in the production image. | Proposed | Deferred; text-layer PDFs work today. |

## Collision reminder

Read [PROS-PROGRAM.md § Collision avoidance](PROS-PROGRAM.md#collision-avoidance).
Do not edit Evidence Ledger, drawings, CI, or `patent-next-action*` from PROS
tasks while those PRs are open.

## PBI History

| Timestamp (UTC) | PBI_ID | Event | Details | User |
| --- | --- | --- | --- | --- |
| 2026-09-27T12:30:00Z | PROS-14, PROS-15 | create_pbi / user_approves | Created from the 2026-09-27 demo-readiness review for the October production demo to in-house IP counsel and outside patent counsel; each item was scoped and adversarially re-checked against `main` before this row. James directed the implementation ("let's get work done"). | james / claude |
| 2026-09-27T12:30:00Z | PROS-16 | create_pbi | Recorded as Proposed from the same review; deferred until after the demo. | claude |
| 2026-08-13T07:30:00Z | PROS-3 | create_pbi | Created claim-hygiene PBI from gap analysis Program E. | cursor-agent |
| 2026-08-13T07:30:00Z | PROS-2 | create_pbi | Created US law lookup PBI from gap analysis Program B. | cursor-agent |
| 2026-08-13T07:30:00Z | PROS-1 | create_pbi | Created OA + response PBI from gap analysis Program A (thin). | cursor-agent |
| 2026-08-13T07:30:00Z | PROS-E2E | create_pbi | Program-level E2E CoS. | cursor-agent |
| 2026-08-13T17:49:00Z | PROS-3 | approve | First-slice hygiene shipped in #1715 (API) and #1720 (UI). | cursor-agent |
| 2026-08-13T17:49:00Z | PROS-2 | approve | First-slice law lookup shipped in #1720. | cursor-agent |
| 2026-08-13T17:49:00Z | PROS-1 | approve | First-slice office action + response shipped in #1720. | cursor-agent |
| 2026-08-13T17:49:00Z | PROS-E2E | approve | Counsel-path CoS spec shipped in #1720. | cursor-agent |
| 2026-08-13T19:01:00Z | PROS-4 | create_pbi | Follow-on: OCR the office-action PDF (gap OCR-1). | cursor-agent |
| 2026-08-13T19:01:00Z | PROS-7 | create_pbi | Follow-on: auto-set filing status when an OA object exists. | cursor-agent |
| 2026-08-13T19:01:00Z | PROS-5 | create_pbi | Follow-on: Word / amendment redlines (gap original PROS-1). | cursor-agent |
| 2026-08-13T19:01:00Z | PROS-8 | create_pbi | Follow-on: UK, EPO, and other-jurisdiction law lookup (gap Program H). | cursor-agent |
| 2026-08-13T19:01:00Z | PROS-6 | create_pbi | Follow-on: patent-scoped matter agent (gap AGENT-1). | cursor-agent |
| 2026-08-13T21:50:00Z | PROS-4 | plan_hardening | Standalone IMPLEMENTATION_PLAN + tasks + E2E CoS for parallel fan-out. | cursor-agent |
| 2026-08-13T21:50:00Z | PROS-7 | plan_hardening | Standalone IMPLEMENTATION_PLAN + tasks + E2E CoS for parallel fan-out. | cursor-agent |
| 2026-08-13T21:50:00Z | PROS-5 | plan_hardening | Standalone IMPLEMENTATION_PLAN + tasks + E2E CoS for parallel fan-out. | cursor-agent |
| 2026-08-13T21:50:00Z | PROS-8 | plan_hardening | Standalone IMPLEMENTATION_PLAN + tasks + E2E CoS for parallel fan-out. | cursor-agent |
| 2026-08-13T21:50:00Z | PROS-6 | plan_hardening | Standalone IMPLEMENTATION_PLAN + tasks + E2E CoS for parallel fan-out. | cursor-agent |
| 2026-08-14T08:58:00Z | PROS-7 | user_approves | User Agreed PROS-7 / 4 / 5; start implementation. | cursor-agent |
| 2026-08-14T08:58:00Z | PROS-4 | user_approves | User Agreed; isolated agent `cursor/pros-4-ocr-1906`. | cursor-agent |
| 2026-08-14T08:58:00Z | PROS-5 | user_approves | User Agreed; isolated agent `cursor/pros-5-redlines-1906`. | cursor-agent |
| 2026-08-14T08:58:00Z | PROS-7 | start_work | InProgress on `cursor/pros-7-filing-status-1906`. | cursor-agent |
| 2026-08-14T08:58:00Z | PROS-4 | start_work | InProgress; do not wait on PROS-7. | cursor-agent |
| 2026-08-14T08:58:00Z | PROS-5 | start_work | InProgress; do not wait on OCR. | cursor-agent |
| 2026-08-14T10:30:00Z | PROS-7 | approve | Merged #1740 — filing-status stamp on first OA. | cursor-agent |
| 2026-08-14T10:30:00Z | PROS-4 | approve | Merged #1742 — job-only OA extract. | cursor-agent |
| 2026-08-14T10:30:00Z | PROS-5 | approve | Merged #1741 — amendment redlines + Word tracked changes. | cursor-agent |
| 2026-08-14T11:02:00Z | PROS-8 | user_approves | User Agreed PROS-8 + PROS-6. | cursor-agent |
| 2026-08-14T11:02:00Z | PROS-6 | user_approves | User Agreed PROS-8 + PROS-6. | cursor-agent |
| 2026-08-14T11:02:00Z | PROS-8 | start_work | InProgress on `cursor/pros-8-jurisdictions-1906`. | cursor-agent |
| 2026-08-14T11:02:00Z | PROS-6 | start_work | InProgress on `cursor/pros-6-matter-agent-1906`. | cursor-agent |
| 2026-08-14T14:05:00Z | PROS-8 | approve | Merged #1744 — jurisdiction-scoped US/UK/EPO lookup. | cursor-agent |
| 2026-08-14T16:57:00Z | PROS-6 | approve | Merged #1743 — patent-scoped matter agent (tools + HITL). | cursor-agent |
| 2026-08-14T18:45:00Z | PROS-9 | create_pbi | Wave 2: auto-parse rejection rows from OCR (HITL). | cursor-agent |
| 2026-08-14T18:45:00Z | PROS-10 | create_pbi | Wave 2: find_law LLM retriever (citations then corpus). | cursor-agent |
| 2026-08-14T18:45:00Z | PROS-11 | create_pbi | Wave 2: CN / JPO corpora. | cursor-agent |
| 2026-08-14T18:45:00Z | PROS-12 | create_pbi | Wave 2: multi-turn matter-agent thread table. | cursor-agent |
| 2026-08-14T18:45:00Z | PROS-13 | create_pbi | Wave 2: docketing / counsel-entered deadlines. | cursor-agent |
| 2026-08-14T18:45:00Z | PROS-9 | user_approves | User Agreed fan-out + implement each. | cursor-agent |
| 2026-08-14T18:45:00Z | PROS-10 | user_approves | User Agreed fan-out + implement each. | cursor-agent |
| 2026-08-14T18:45:00Z | PROS-11 | user_approves | User Agreed fan-out + implement each. | cursor-agent |
| 2026-08-14T18:45:00Z | PROS-12 | user_approves | User Agreed fan-out + implement each. | cursor-agent |
| 2026-08-14T18:45:00Z | PROS-13 | user_approves | User Agreed fan-out + implement each. | cursor-agent |
| 2026-08-14T18:45:00Z | PROS-9 | start_work | InProgress on `cursor/pros-9-parse-1906`. | cursor-agent |
| 2026-08-14T18:45:00Z | PROS-10 | start_work | InProgress on `cursor/pros-10-find-law-1906`. | cursor-agent |
| 2026-08-14T18:45:00Z | PROS-11 | start_work | InProgress on `cursor/pros-11-cn-jpo-1906`. | cursor-agent |
| 2026-08-14T18:45:00Z | PROS-12 | start_work | InProgress on `cursor/pros-12-agent-thread-1906`. | cursor-agent |
| 2026-08-14T18:45:00Z | PROS-13 | start_work | InProgress on `cursor/pros-13-docket-1906`. | cursor-agent |
| 2026-08-14T21:30:00Z | PROS-11 | approve | CN/JPO corpora ready on `cursor/pros-11-cn-jpo-1906`. | cursor-agent |
| 2026-08-14T21:55:00Z | PROS-10 | approve | find_law retriever ready on `cursor/pros-10-find-law-1906`. | cursor-agent |
| 2026-08-20T17:20:00Z | PROS-9 | approve | Merged earlier as #1755; CoS re-verified (pytest green); backlog Done. | cursor-agent |
| 2026-08-20T17:20:00Z | PROS-12 | approve | Merged earlier as #1756; CoS re-verified (pytest green); backlog Done. | cursor-agent |
| 2026-08-20T17:20:00Z | PROS-13 | approve | Merged earlier as #1757; CoS re-verified (pytest green); backlog Done. | cursor-agent |
