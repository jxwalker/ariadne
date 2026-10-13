# Product Backlog — Last mile (RLLB 2026)

Single source of truth for last-mile PBIs, ordered by the live walk.

Program brief: [`LAST-MILE-PROGRAM.md`](LAST-MILE-PROGRAM.md)  
Plan: [`LAST-MILE/IMPLEMENTATION_PLAN.md`](LAST-MILE/IMPLEMENTATION_PLAN.md)

**Status of this backlog:** The **RLLB demo commitments (LM-0…6) are closed.**
The live demo was cancelled on 2026-09-05 — see
[LAST-MILE-PROGRAM.md § Cancellation](LAST-MILE-PROGRAM.md#cancellation), which
is the authoritative record. LM-1–4 shipped on `main` in
[#1778](https://github.com/jxwalker/patent-studio/pull/1778) and remain live
product. LM-0's script lock, LM-5 and LM-6 are cancelled unstarted; no work was
in flight on any of them.

**The [Stage 0 follow-ups](#stage-0-follow-ups) below are unaffected and remain
open.** LM-S0-EXPORT, LM-S0-NEXT-ACTION, LM-S0-USAGE, LM-S0-EVALUATION and
LM-S0-COVERAGE are proposals about export verbs, journey signposting, spend
reconciliation, release evidence and coverage semantics. None of them depended
on the demo, and cancelling it cancels none of them. This backlog is not closed
as a file; only its LM-0…6 rows are.

| ID | Actor | User Story | Status | Conditions of Satisfaction (CoS) |
| --- | --- | --- | --- | --- |
| [LM-0](./LAST-MILE/LM-0/prd.md) | Founder / PM | As a speaker at RLLB, I want a corporate one-pager, a firm one-pager, a three-month beta outline, and a locked demo script so I can plant a seed without improvising claims. | Cancelled (artifacts stand) | Four artifacts exist under `LAST-MILE/gtm/` and `DEMO-SCRIPT.md`; every claim matches the honesty table; no public-beta date; no exclusivity. **Verified 2026-09-03:** all four artifacts are on `main` and neither names a public-beta date nor offers exclusivity. The one open condition was the founder locking the demo script; that is moot now the demo is cancelled. The three GTM one-pagers are unaffected as documents. |
| [LM-1](./LAST-MILE/LM-1/prd.md) | Engineer | As a demo operator, I want a synthetic tenant I can reset in one command so rehearsal never depends on leftover state or customer data. | Done | Seed + reset scripts; refuse production host; demo org flags on, all others off; fixture has capture, spec location, verified + missing + proposed links, one human-reviewed prior-art issue, sendable counsel-ready patent; tests prove idempotent reset. |
| [LM-2](./LAST-MILE/LM-2/prd.md) | Corporate IP lead (demo) | As a stranger on the patent, I want to open Traceability and see which claim limitations are supported, missing, or only proposed, without an engineer explaining the database. | Done | Flag-off UI unchanged; demo deep-link opens the existing panel; seeded rows are visible as verified / missing / proposed; no new rail item; e2e on the seed. |
| [LM-3](./LAST-MILE/LM-3/prd.md) | Counsel recipient | As counsel opening the ZIP, I want a deterministic traceability report in orientation so I can see coverage and hashes without trusting a slide. | Done | `00_orientation/TRACEABILITY` in the ZIP when the org flag is on; no AI; START_HERE lists it; honesty block present; omitted when flag off; builder tests. |
| [LM-4](./LAST-MILE/LM-4/prd.md) | Legal ops | As a beta sponsor, I want four frozen operational numbers so a three-month beta can answer Matt’s questions with evidence, not anecdotes. | Done | Versioned `patent-studio.beta-metrics.v0`; four metrics + missing-data flags; no substantive text; flag-gated GET on the existing ledger router; tiny flag-on surface; fixture tests. |
| [LM-5](./LAST-MILE/LM-5/prd.md) | Engineer (stretch) | As a speaker, I want an optional local integrity check on a synthetic bundle so I can show tamper detection without claiming independent patent-semantic verification. | Cancelled | Was a demo stretch only, never started. Operator script only; uses existing Phase 5.6 local verifier; pass + flipped-byte fail; copy is restrained; no new download route; no `apcg-verifier`. |
| [LM-6](./LAST-MILE/LM-6/prd.md) | Founder + engineer | As the opening-keynote speaker, I want two rehearsals and a leave-behind on a frozen demo tenant so the live walk cannot surprise us. | Cancelled | Existed only to make the live walk safe; never started. Script timed ≤12 minutes; leave-behind PDF/screenshots from the synthetic tenant; demo host frozen from 5 Sep; no production customer data. |
| LM-7 | Platform admin | As a platform admin, I want to turn Traceability and Beta metrics on for one organisation with an audited reason, so production never depends on the seed or a hand edit. | Agreed | Platform-admin route outside the counsel tag; organisation-scoped audit row; tenant-matrix row; flag-off regression; two-organisation coverage per the Evidence Ledger ADR §7. Supersedes the seed-only rollout rule in `LAST-MILE-PROGRAM.md` in the same PR. |
| LM-8 | Presenter | As the presenter of the October production demo, I want a two-persona walk (in-house counsel, outside counsel), a setup checklist, a do-not-click list and an honest-answers sheet, with the leave-behinds corrected. | Agreed | Replaces the cancelled RLLB walk; current vocabulary; no seed; no public-beta date; no exclusivity. |

## Stage 0 follow-ups

The packages below are **Proposed extensions**, not changes to LM-0…6 or an
authorization to edit other programs' internals. **They are unaffected by the
demo cancellation** recorded in
[LAST-MILE-PROGRAM.md § Cancellation](LAST-MILE-PROGRAM.md#cancellation): that
closed the RLLB demo commitments only, and these packages remain open. Agree a scoped task/test plan
and shared-seam ownership before implementation. The
[source reconciliation](../stage-0/product-quality-reconciliation.md) owns only
historical attribution; this backlog owns these proposals.

```yaml
packages:
  - id: LM-S0-EXPORT
    sources: [S1-P-05, S1-P-06, S1-P-07, Q-S1-016]
    hypothesis: Queue, navigation, download and electronic filing are different user actions and must remain distinguishable.
    tests_first: Keep export-document-generation-characterisation.spec.ts; RED for queued Word mislabeled as download and unequal patent/project IDs before changing either surface.
    in_scope: Reader/project export verbs and recovery destinations; counsel versus patent-export names; actual ZIP members versus index entries.
    out_of_scope: New PDF engine, changing counsel generation, automated filing, and treating local Markdown as inherently defective.
    file_fence: [frontend/components/reader/full-patent-reader.tsx, "frontend/app/(app)/projects/[id]/page.tsx", frontend/e2e/export-document-generation-characterisation.spec.ts, backend/tests/test_pbi3_cos_package_honesty.py, backend/tests/test_counsel_traceability_report.py]
    risk: A queued job looks downloaded; a wrong project link exposes a dead end; a ZIP looks like a submitted filing.
    acceptance: Download produces bytes or is labelled preparation; navigation uses the real project identifier; Markdown/Print say what they do; absent PDF is not advertised; ZIP index lists only present readable members; no filing claim.
    evidence: Word still queues in the current Reader; LM-3 already owns deterministic traceability. Preserve its green regression instead of inventing RED.
  - id: LM-S0-NEXT-ACTION
    sources: [S1-P-08]
    hypothesis: Each inventor state should expose one useful next action at a named viewport without duplicate or self-link controls.
    tests_first: Use current route-inventory evidence and next-step-signpost-characterisation.spec.ts; RED only on a still-reproducible wrong action or competing primary.
    in_scope: State-aware signposting on Create, Draft, Research, Claims, Drawings, Reader and Handoff.
    out_of_scope: Generation semantics, score thresholds as automatic quality approval, and changing controls based only on historical screenshots.
    file_fence: [frontend/components/journey/next-step-card.tsx, frontend/components/patents/patent-next-action.tsx, frontend/e2e/next-step-signpost-characterisation.spec.ts]
    risk: Adding a second control or pointing back to the current page makes the journey less clear.
    acceptance: Record route, role, state and viewport; each proposed change resolves a demonstrated dead end. Do not re-add the already-removed claims-review self-link. Wait for current route and counsel-readiness owners.
    evidence: Issues2084,2091,2162 own the source-based route inventory, live-walk contract and door tests; PR2470 owns handoff actions. The authenticated-UAT identical-action follow-up is implemented in [#3008](https://github.com/jxwalker/patent-studio/pull/3008). The current-page secondary-link follow-up is implemented in [#3010](https://github.com/jxwalker/patent-studio/pull/3010), retaining the requirement as guidance. Failing-before/passing-after and responsive production-build evidence live in [the scoped task](LAST-MILE/LM-S0-NEXT-ACTION.md). Review, exact-version CI and deployed acceptance remain separate gates; this does not close LM-S0-NEXT-ACTION.
  - id: LM-S0-USAGE
    sources: [S1-P-09, S1-P-10, S1-P-11, S1-P-12]
    hypothesis: A user can reconcile displayed spend only when basis, period, account scope and budget ceiling are explicit.
    tests_first: RED with absent is_estimated plus catalog source, mixed today/total basis, admin versus inventor, and separate platform/personal caps; keep usage-ui-characterisation fixtures synthetic.
    in_scope: Basis labels, total-versus-today card wiring, named cap identity and clearly labelled mine/team scope.
    out_of_scope: Changing prices, importing invoices, billing-schema changes and assuming all provider-token rows contain provider-reported dollars.
    file_fence: [frontend/components/settings/usage-tab.tsx, frontend/components/create/create-journey.tsx, frontend/e2e/usage-ui-characterisation.spec.ts, frontend/e2e/usage-ui-characterisation.fixture.ts]
    risk: Calling estimates Actual misrepresents spend; an ambiguous Available badge contradicts a different ceiling.
    acceptance: Missing basis is unknown or estimated, never Actual by default; card title uses the same basis/period as its main value; platform and personal caps are named separately; inventor never receives team scope. Team as admin default is acceptable when explicit.
    evidence: Settings Usage [#2525](https://github.com/jxwalker/patent-studio/pull/2525) fixes formatUsd missing-flag→Actual defaults and total/today card basis mismatch. Admin detail basis labels are implemented in [#2543](https://github.com/jxwalker/patent-studio/pull/2543), with evidence in [the Admin plan](LAST-MILE/LM-S0-USAGE-ADMIN.md). Named personal/organization budget scope, unknown/team states and separate platform-limit explanation are implemented in [#2545](https://github.com/jxwalker/patent-studio/pull/2545); [the cap-identity plan](LAST-MILE/LM-S0-USAGE-CAPS.md) owns verification and remaining gates. The [Settings plan](LAST-MILE/LM-S0-USAGE.md#26-september-2026-partial-acceptance-and-daily-period-follow-up) records partial read-only inventor UAT acceptance and [#3046](https://github.com/jxwalker/patent-studio/pull/3046)'s daily-period label and account-transition cache follow-up. Full deployed acceptance remains open — do not mark LM-S0-USAGE done. Backend invoice provenance and PR2469 preflight work remain independent; do not repair their files here.
  - id: LM-S0-EVALUATION
    sources: [Q-S1-001, Q-S1-003]
    hypothesis: Release confidence needs scored scenario evidence and actual provider journeys, not module fixtures labelled gold.
    tests_first: Preserve existing pack validators; RED for missing required scenario/model evidence only when implementing the approved scorer or gate.
    in_scope: Approved twelve-matter corpus and human rubric; scenario coverage; retained real-model evidence and three consecutive clean stage runs.
    out_of_scope: Paid jobs in ordinary CI, automatic synthetic-to-legally-cleared equivalence, and a new competing release checklist.
    file_fence: [docs/acceptance/STAGE_GATE_RUNNER.md, scripts/run_stage_gate.sh, docs/stage-0/real-llm-journey-matrix.md]
    risk: Green fixture CI or a model-generated score becomes unsupported demo/beta readiness evidence.
    acceptance: The public-beta checklist owns the decision; every evaluated matter has clearance and immutable provenance; RWLs are scenarios; required model rows have exact-SHA private evidence. Unknown cost and missing runs fail the evidence bar, not silently pass.
    evidence: The real-LLM matrix is an execution specification only. Existing stage-gate screenshot/trace/cost stubs are not live-model proof.
  - id: LM-S0-COVERAGE
    sources: [Q-S1-004, Q-S1-005, Q-S1-007, Q-S1-012]
    hypothesis: Human verification, machine classification and two legacy/ledger coverage counters must not collapse into a misleading ready label.
    tests_first: Retain proposed/rejected and traceability regressions; add RED only for a consumer proven to conflate counters, unverified classification or stale readiness.
    in_scope: Read-model explanation and explicit coverage formula; verified versus candidate classifications; stored review and handoff agreement.
    out_of_scope: Silent legacy-citation migration, rewriting Evidence Ledger decisions, IDS forms and parallel repair of PR2470.
    file_fence: [backend/tests/test_stage0_evidence_status_characterisation.py, backend/tests/test_evidence_ledger_beta_metrics.py, backend/tests/test_packaging_readiness_is_not_a_count.py, backend/tests/test_counsel_traceability_report.py]
    risk: Proposed or legacy support is presented as verified, or a non-sendable package appears ready.
    acceptance: Proposed/rejected never inflate verified support; legacy counters remain explicit; decision history remains; unreviewed references are visible. Validate current counsel policy with its owner before changing which issues block handoff.
    evidence: LM-2/3 already provide traceability and honesty; the old blanket assertion that all open X/unclassified references currently pass is not established by this reconciliation. Explicit ledger/legacy support labels and overlap explanations are in draft [#2546](https://github.com/jxwalker/patent-studio/pull/2546); [the coverage-label plan](LAST-MILE/LM-S0-COVERAGE.md) owns test evidence and remaining acceptance. This is not completion of LM-S0-COVERAGE.
```

## Collision reminder

[#1774](https://github.com/jxwalker/patent-studio/pull/1774) and
[#1778](https://github.com/jxwalker/patent-studio/pull/1778) are merged.
Do not edit Evidence Ledger package internals, prosecution, Create, or
public-beta checklists from remaining last-mile work.

## PBI History

| Timestamp (UTC) | PBI_ID | Event | Details | User |
| --- | --- | --- | --- | --- |
| 2026-09-27T12:30:00Z | LM-7, LM-8 | create_pbi / user_approves | Created from the 2026-09-27 demo-readiness review for the October production demo to in-house IP counsel and outside patent counsel; each item was scoped and adversarially re-checked against `main` before this row. James directed the implementation ("let's get work done"). | james / claude |
| 2026-09-03T09:05:00Z | LM-0 | update | Artifacts verified present on `main` and free of a public-beta date or exclusivity; status corrected from Proposed, which was stale. Script lock still outstanding. | claude |
| 2026-08-15T12:10:00Z | LM-1…LM-4 | approve | Shipped on `main` via [#1778](https://github.com/jxwalker/patent-studio/pull/1778). | cursor-agent |
| 2026-08-15T09:30:00Z | LM-0…LM-6 | create_pbi | Last-mile program drafted from Fawcett feedback + RLLB date. | cursor-agent |
