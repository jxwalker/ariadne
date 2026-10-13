# Product Backlog — US drafting craft (meet and beat M-Cube)

Single source of truth for CRAFT PBIs, ordered by implementation sequence.

Program brief: [`CRAFT-PROGRAM.md`](CRAFT-PROGRAM.md)  
Wave 1 plan: [`CRAFT/IMPLEMENTATION_PLAN.md`](CRAFT/IMPLEMENTATION_PLAN.md)  
Test plan: [`CRAFT/TEST_PLAN.md`](CRAFT/TEST_PLAN.md)  
Later waves: [`CRAFT/FANOUT.md`](CRAFT/FANOUT.md)  
Gap snapshot: [`../archive/reviews/COMPETITIVE_GAP_MCUBE_2026-08-19.md`](../archive/reviews/COMPETITIVE_GAP_MCUBE_2026-08-19.md)

This backlog is the CRAFT todo list. Do not add `CRAFT/TODO.md`.

| ID | Actor | User Story | Status | Conditions of Satisfaction (CoS) |
| --- | --- | --- | --- | --- |
| [CRAFT-2](./CRAFT-2/prd.md) | Inventor | As I draft from sources that include figures, I want the system to **read the drawings** (numerals, parts, relations) or fail honestly, so claims and spec are not written as if Fig. 1 was never seen. | Done | Vision job on pinned Evidence images/PDF pages; durable DrawingMap; fail-closed; explicit Continue-without-map; feeds claim+spec prompts; not white-paper artwork review. |
| [CRAFT-1](./CRAFT-1/prd.md) | Inventor | As I run **non-full-auto** Create or Generate specification, I want to **approve or revise claims before the specification is written**, so I do not spend a spec on an independent claim I never signed off. Full-auto never pauses. | Done | Claims persist first; guided+copilot pause; `claim_approval` not in `AUTO_RESOLVABLE_GATES`; full-auto sequential no pause; existing dual content not re-blocked; Approve / Revise then spec. |
| [CRAFT-E2E](./CRAFT-E2E.md) | Engineer | As a reviewer, I want one CoS spec proving full-auto still flies through, guided pauses at claims, and vision fail-closed. | Done | Playwright + API; registered in `e2e/README.md`. |
| [CRAFT-3](./CRAFT-3/prd.md) | Inventor / counsel | As I watch an expensive job, I want a **durable timeline of each reasoning artifact**, not a spinner. | Done | Persist node log on the job; UI accordion; no request-held SSE. |
| [CRAFT-4](./CRAFT-4/prd.md) | Inventor | At the claim gate I want **verbatim claim-to-evidence support** (Explicit / Implicit / Unsupported), reusing Evidence Ledger, so I can send claims back before spec write. | Done | Quotes must appear in evidence text; unsupported is a warning not a silent pass; full-auto still writes the report onto the job. |
| [CRAFT-5](./CRAFT-5/prd.md) | Counsel | After OA parse Apply, I want a **strategy job**: mine spec quotes, stress vs cited art, recommend argue / merge-dependent / introduce-spec-feature — HITL before redline. | Done | Reuse OA object + References; worker proposes; Apply then existing PROS-5 redline; WAIT PROS-9. |
| [CRAFT-6](./CRAFT-6/prd.md) | Counsel | As I amend, I want retrieve-or-fail **35 U.S.C. 132** and **MPEP 2163** (and §112 we have), never invented new-matter law. | Done | Corpus JSON + lookup; amendment gate flags unverifiable insertions; miss stays miss. |
| [CRAFT-7](./CRAFT-7/prd.md) | Counsel | Before I Apply an OA response, I want a **harmful-admission / estoppel** warning on proposed prose. | Done | Warnings only; never auto-rewrite; not a legal conclusion. |
| [CRAFT-8](./CRAFT-8/prd.md) | Inventor / counsel | As I review cited art that has figures, I want a **visual feature collision** on the existing chart, not a second ledger. | Done | Vision on cited-art figures + our DrawingMap; cells on `ClaimElementCitation`; patentability only. |
| [CRAFT-9](./CRAFT-9/prd.md) | Inventor | On Refine I want **figure/text mismatches** mined into claim tightening, so constraints the drawing shows are not left out of the claims. | Done | Feeds `claim_tightener` / `patent_review`; HITL apply; uses CRAFT-2 map + generated 1.84 sheets. |
| [CRAFT-10](./CRAFT-10/prd.md) | Counsel | As I extract a USPTO office action, I want the **examiner opinion body** split from captions/search notes the way M-Cube splits CNIPA headings — for US forms. | Done | Deterministic structure first; model fill only with quote-in-extract; not a certified OA. |
| [CRAFT-11](./CRAFT-11/prd.md) | Counsel | **Later:** UKIPO specification section mode + UK new-matter lookup, without mixing US BRI. | Done | Wave 4. Jurisdiction explicit; `us` unchanged; UK Statement of Invention + PA 1977 s.76 retrieve-or-fail. |
| [CRAFT-12](./CRAFT-12/prd.md) | Counsel | **Later:** EPO problem-solution + Art. 123(2) strategy graph on the same OA object. | Done | Wave 4. Explicit `jurisdiction=epo`; Art. 69 not injected into USPTO charts. |
| [CRAFT-13](./CRAFT-13/prd.md) | Counsel | **Later:** UKIPO / EPO OA notice extractors. | Done | Wave 4. After CRAFT-10. Fixtures; `used_structure=false` honesty. |
| CRAFT-14 | Counsel | As counsel opening the USPTO specification Word file, I want 37 CFR 1.52(b)(5) page numbers and (b)(6) paragraph numbers, and a warning when the abstract exceeds 150 words (1.72(b)). | Agreed | Export ZIP and counsel package specification; headings, claims and abstract are not paragraph-numbered; text unchanged. |
| CRAFT-15 | Counsel | As counsel reading the claim gate, I want support labels that describe the string match (exact wording / partial wording match / no matching wording), never a legal support conclusion. | Agreed | Display labels only; stored values and the API are unchanged. |
| CRAFT-16 | Inventor / counsel | As a drafter, I want figure/text mismatch findings to be advisory, with no one-click claim rewrite. | Agreed | Follows CRAFT-9. The Apply API snapshots, audits and refuses a stale proposal. |
| CRAFT-17 | Counsel | As counsel, I want to record a claim-element × reference mapping (pin cite, verbatim quote, §102/§103 with a combination rationale) in the UI and then verify it. | Agreed | Uses the existing `ClaimElementCitation` routes; no second chart ledger. |
| CRAFT-18 | Inventor / counsel | As a reader of research results or an exported report, I want automated anticipation/obviousness ratings labelled as automated screening, not an opinion. | Agreed | Research results and report exports. |
| CRAFT-19 | Counsel | As counsel, I want office-action strategy that follows the statutory basis (101, 102, 103, 112(a), 112(b), double patenting) and picks distinguishing features per rejection from the rejected claims' limitations. | Agreed | Follows CRAFT-5 and CRAFT-12; deterministic; human review unchanged; retrieve-or-fail law only. |
| CRAFT-20 | Counsel | As counsel, I want US prior-art numbers checked against USPTO data and publication dates filled only from a matched record. | Proposed | Deferred until after the October demo. |

## Stage 0 follow-ups

Unless marked otherwise below, **Proposed**; historical sources are mapped in the
[reconciliation](../stage-0/product-quality-reconciliation.md). These do not
reopen completed CRAFT work or authorize prompt changes.

```yaml
packages:
  - id: CRAFT-S0-QUOTES
    status: Source-bound verification implemented in merged PR2548 and Word pagination repaired in merged PR3039; bounded local UI/document and revocation checks recorded. Residual access-policy and exact-release signed-in UAT acceptance remain open.
    sources: [Q-S1-006]
    hypothesis: A quote is evidence only when checked against the retained authorized source, not merely a caller-supplied matching haystack.
    tests_first: Retain test_claim_traceability.py guards and the merged citation source-proof regressions; missing or fabricated matching caller text must not acquire source-verified status through human review. Reproduce a current defect before changing the implementation.
    in_scope: Source-bound quote validation and explicit unsupported classification.
    out_of_scope: Legal conclusions, automatic claim rewrite, source ingestion changes and copying live matter text into fixtures.
    file_fence: [docs/delivery/CRAFT-S0-QUOTES.md, backend/tests/test_citation_retained_quote.py, backend/tests/test_citation_source_proof_currency.py, backend/tests/test_citation_source_characterisation.py, backend/tests/test_citation_source_verification_api.py, backend/tests/test_citation_source_migration.py, backend/tests/test_claim_element_citations.py, backend/tests/test_stage0_evidence_status_characterisation.py]
    risk: A fabricated but self-consistent payload is mistaken for verbatim support.
    acceptance: Forged or unverifiable source bindings do not become verified support; retain unsupported warnings and a positive retained-source case. Complete the residual access-policy review, rendered UI/document inspection and signed-in UAT workflow in CRAFT-S0-QUOTES.md; any product follow-up needs fresh shared-file ownership.
    evidence: Q-S1-006 describes the pre-repair path. PR2548 merged the approved retained-source proof, separate human-review status, access-filtered capture preview and regression coverage. CRAFT-S0-QUOTES.md retains the historical reproduction and owns current verification evidence and acceptance limits; implementation merge is not live acceptance.
  - id: CRAFT-S0-PROMPT-CONTRACTS
    status: Characterisation recorded in the existing prompt inventory; missing current prompt-bound captures remain explicit, not repaired or quality-approved.
    sources: [Q-S1-002, Q-S1-017, Q-S1-020]
    hypothesis: Function keys, prompt families, jurisdiction labels and fixture coverage must be inventoried separately before any prompt consolidation.
    tests_first: Characterize current key-to-caller and UK-label-to-prompt mappings; already-green locks need no fabricated RED.
    in_scope: Exact-SHA per-function present/missing fixture map; multiplexed prompt families; UK headings versus selected prompt key.
    out_of_scope: Recapture without spend approval, treating adapter fixtures as quality gold, prompt unification and default-model swaps.
    file_fence: [backend/tests/test_ai_fixtures.py, backend/tests/test_ai_fixture_capture_script.py, backend/tests/test_law_jurisdiction.py, backend/app/patent_sections.py]
    risk: A cleanup silently rewrites drafting behavior or declares stale captures current model-quality evidence.
    acceptance: Every current function/family has present or missing evidence with source SHA; token-envelope exclusions remain explicit; UK labels do not imply a separate UK prompt family. No copied fixed count of functions or missing fixtures.
    evidence: The issue2060 inventory is refreshed after the model migration; its 2026-09-06 CRAFT addendum at main321a7567773b8651a3d948e39363160bd2ae14f8 joins every registered function to present/missing module captures, separates prompt-family provenance from function-key examples and records UK label/shared-section-key routing. Missing captures and live quality remain unproven, not current product defects inferred from an old proposal.
```

Q-S1-013 is retained under **CRAFT-4/11** (stored section/claim support and
jurisdiction headings); Q-S1-014 under **CRAFT-2/CRAFT-E2E** (map failure,
empty and explicit skipped states). Preserve their existing regression tests.
Do not resurrect the old three-state drawing-map description or equate
generated-sheet layout checks with certified office acceptance. Artifact
wording remains coordinated with `LM-S0-EXPORT`.

The [CRAFT-S0-QUOTES task](CRAFT-S0-QUOTES.md) distinguishes the merged repair
from its remaining release acceptance. Do not reopen the historical
caller-text defect solely because the acceptance item remains open.

The CRAFT-S0-PROMPT-CONTRACTS characterization is the dated coverage addendum in
the [existing prompt inventory](../stage-0/prompt-model-eval-inventory.md).
It records missing evidence; it does not complete live-model quality acceptance.

## Collision reminder

Read [CRAFT-PROGRAM.md § Collision avoidance](CRAFT-PROGRAM.md#collision-avoidance).
Do not edit Evidence Ledger writes, BRIEF-8, or PROS-9…13 exclusive paths from
CRAFT tasks.

## PBI History

| Timestamp (UTC) | PBI_ID | Event | Details | User |
| --- | --- | --- | --- | --- |
| 2026-09-27T12:30:00Z | CRAFT-14…19 | create_pbi / user_approves | Created from the 2026-09-27 demo-readiness review for the October production demo to in-house IP counsel and outside patent counsel; each item was scoped and adversarially re-checked against `main` before this row. James directed the implementation ("let's get work done"). | james / claude |
| 2026-09-27T12:30:00Z | CRAFT-20 | create_pbi | Recorded as Proposed from the same review; deferred until after the demo. | claude |
| 2026-08-21T04:40Z | CRAFT-1…13, CRAFT-E2E | approve | All CRAFT PRs #1821/#1826/#1842/#1843/#1830/#1832/#1829/#1841/#1835/#1834/#1836/#1837 merged; dedupe corrupted backlog rows → Done on main. | cursor-agent |
| 2026-08-19T09:15:00Z | CRAFT-1…13, CRAFT-E2E | create_pbi | Created CRAFT program from M-Cube comparison; US first, UK/EU later; keep full-auto; claim gate + vision locked. | james / cursor-agent |
| 2026-08-19T09:15:00Z | CRAFT-1, CRAFT-2, CRAFT-E2E | propose_for_backlog / user_approves | User locked: keep full-auto; non-full-auto claim-approval gate; vision on evidence in Draft; close remaining gaps in plan. | james |
| 2026-08-20T19:55:00Z | CRAFT-1, CRAFT-2, CRAFT-E2E | approve | Wave 1 merged via #1821; backlog + task docs → Done. | cursor-agent |
| 2026-08-20T18:50:00Z | CRAFT-3 | user_approves / start_work / submit_for_review | Agreed via /goal implement CRAFT; node log shipped; pytest+vitest green; PR #1826. | cursor-agent |
| 2026-08-20T23:52:00Z | CRAFT-3 | approve | Tip CI CLEAN on #1826; backlog → Done ahead of merge. | cursor-agent |
| 2026-08-20T18:55:00Z | CRAFT-6 | approve | 35 U.S.C. 132 + MPEP 2163 corpus + amendment warnings; pytest green. | cursor-agent |
| 2026-08-20T19:30:00Z | CRAFT-4 | approve | Claim-to-evidence gate panel + full-auto job store Done on `cursor/craft-4-claim-trace-621e`. | cursor-agent |
| 2026-08-20T20:35:00Z | CRAFT-7 | approve | Admission audit on Apply Done on `cursor/craft-7-admission-audit-621e`. | cursor-agent |
| 2026-08-20T21:00:00Z | CRAFT-10 | approve | USPTO notice structure Done on `cursor/craft-10-uspto-notice-621e`. | cursor-agent |
| 2026-08-20T20:10:00Z | CRAFT-5 | approve | OA strategy HITL Done on `cursor/craft-5-oa-strategy-621e`. | cursor-agent |
| 2026-08-20T21:25:00Z | CRAFT-9 | approve | Figure/text mismatch HITL Done on `cursor/craft-9-figure-mismatch-621e`. | cursor-agent |
| 2026-08-20T19:30:00Z | CRAFT-11 | start_work | Wave 4 UKIPO section mode + s.76 on `cursor/craft-11-ukipo-spec-621e`. | cursor-agent |
| 2026-08-20T21:50:00Z | CRAFT-11 | submit_for_review | Local CoS 7 passed; PR #1835 InReview pending CI. | cursor-agent |
| 2026-08-20T23:54:00Z | CRAFT-11 | approve | Tip CI was CLEAN; backlog → Done ahead of merge. | cursor-agent |
| 2026-08-21T01:48:00Z | CRAFT-11 | submit_for_review | Rollback premature Done to InReview until merge; tip CoS green; PR #1835. | cursor-agent |
| 2026-08-20T21:50:00Z | CRAFT-8 | approve | Visual collision on chart cells Done on `cursor/craft-8-visual-collision-621e`. | cursor-agent |
| 2026-08-21T02:08:00Z | CRAFT-8 | submit_for_review | Rollback premature Done to InReview until merge; merged CRAFT-11 tip + OpenAPI regen. | cursor-agent |
| 2026-08-20T21:51:00Z | CRAFT-12 | submit_for_review | Local CoS 15 passed; PR #1836 InReview pending CI. | cursor-agent |
| 2026-08-20T23:54:00Z | CRAFT-12 | approve | Tip CI was CLEAN; backlog → Done ahead of merge. | cursor-agent |
| 2026-08-21T01:48:00Z | CRAFT-12 | submit_for_review | Rollback premature Done to InReview until merge; tip CoS green; PR #1836. | cursor-agent |
| 2026-08-20T20:30:00Z | CRAFT-13 | start_work | UKIPO/EPO notice structure on `cursor/craft-13-uk-epo-notice-621e` (based on CRAFT-10). | cursor-agent |
| 2026-08-20T21:45:00Z | CRAFT-13 | submit_for_review | Local CoS 12 passed; PR #1837 InReview pending CI. | cursor-agent |
| 2026-08-20T23:54:00Z | CRAFT-13 | approve | Tip CI was CLEAN; backlog → Done ahead of merge. | cursor-agent |
| 2026-08-21T01:48:00Z | CRAFT-13 | submit_for_review | Rollback premature Done to InReview until merge; tip CoS green; PR #1837. | cursor-agent |
