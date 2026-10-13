# Product Backlog — Create shortlist loop

Single source of truth for active Create shortlist PBIs, ordered by priority.

Program brief: [`CREATE-PROGRAM.md`](CREATE-PROGRAM.md)

| ID | Actor | User Story | Status | Conditions of Satisfaction (CoS) |
| --- | --- | --- | --- | --- |
| [CREATE-1](./CREATE-1/prd.md) | Inventor | As an inventor on Create, I want to loop Keep/Reject and Generate more until I choose a shortlist (≤ ceiling), then draft exactly those candidates with optional guidance, so the system never ignores my decisions or silently adds inventions. | Done | Shortlist loop shipped (#1692) + E2E CoS (#1695). |

## Stage 0 follow-ups

These are **Proposed**, not permission to implement or spend. Source IDs and
exact-SHA dispositions are in the [reconciliation](../stage-0/product-quality-reconciliation.md).
Before code, agree one behavior-level slice and its task/test plan. Existing
green characterization remains valid evidence; record RED only for a behavior
change. Current open-PR ownership overrides these prospective file fences.

The navigation/status slice of CREATE-S0-HONESTY is being implemented under
the remaining-roadmap goal; its scoped requirements and evidence are in
[the task](CREATE-S0-HONESTY.md). Automatic-mode naming remains a separate
decision. This is not full-package or release acceptance.

```yaml
packages:
  - id: CREATE-S0-HONESTY
    sources: [S1-P-01, S1-P-02, S1-P-03, S1-P-04]
    hypothesis: Navigation verbs, waiting headings and worker-state copy must describe the action actually available.
    tests_first: Keep the current label locks; add RED for each agreed label/state change before implementing it.
    in_scope: Home link verbs; bookmark versus waiting decision; stalled versus unavailable; one agreed automatic-mode name.
    out_of_scope: Resume API behavior, provider calls, queue recovery and changing flight-mode semantics.
    file_fence: [frontend/lib/create-autopilot-recovery.ts, frontend/components/create/create-journey.tsx, frontend/e2e/autopilot-labels-characterisation.spec.ts]
    risk: A navigation link presented as Resume implies work started; a cosmetic change must not start paid work.
    acceptance: Links use navigation language unless they perform the action; bookmark-only state does not imply a decision; overdue and unavailable differ. Mixed-list grouping is an explicit design decision, not automatically a bug.
    evidence: Navigation/status correction and RED/GREEN evidence are tracked in CREATE-S0-HONESTY.md; preserve bookmark navigation and existing mixed-list grouping. Automatic-mode naming and deployment acceptance remain open.
  - id: CREATE-S0-GROUNDING
    sources: [Q-S1-008]
    hypothesis: Connector failure must remain distinguishable from no hits, and model-provided references must not acquire false source provenance.
    tests_first: Preserve test_prior_art_grounding_failures_are_reported.py; add a synthetic failure-to-persistence test before changing reference acceptance.
    in_scope: Verify each stored reference against gathered hits; explicit degraded assessment and abstention on absent evidence.
    out_of_scope: New search providers, prompt redesign, model swaps and queue fallback.
    file_fence: [backend/app/generation/prior_art_grounding.py, backend/app/generation/handlers.py, backend/tests/test_prior_art_grounding.py, backend/tests/test_prior_art_grounding_failures_are_reported.py]
    risk: Treating an invented reference as retrieved art; equally, discarding useful partial results without explanation.
    acceptance: Failed lanes remain visible; no unsupported reference is labelled a gathered hit; empty and failed searches have different evidence. Establish remaining persistence gap before declaring a fix necessary.
    evidence: The helper already reports connector failures and rejects unmatched model links. Issue2510 repairs the remaining unavailable/non-list assessment return that dropped grounding warnings before stage persistence; isolated-DB RED/GREEN and boundaries are in CREATE-S0-GROUNDING.md. This is not live-provider quality or full-package acceptance.
  - id: CREATE-S0-BINDINGS
    sources: [Q-S1-011, Q-S1-019]
    hypothesis: Shortlist and credential preflight must agree with execution without confusing a candidate with a drafted patent.
    tests_first: Retain shortlist freeze tests; test stored platform keys and BYOK independently before any preflight change.
    in_scope: Regression of kept IDs/count, missing-key explanation and resolved binding parity.
    out_of_scope: New catalog defaults, live provider traffic and independent repair of another owner's migration.
    file_fence: [backend/tests/test_generation_shortlist.py, backend/tests/test_generation_control_plane.py, backend/tests/test_usage_router.py]
    risk: An unavailable estimate blocks valid work, or a passed preflight spends through a different binding.
    acceptance: Kept shortlist remains authoritative; missing credentials fail explicitly; availability comes from the same resolved execution policy. A candidate is never labelled a saved draft solely because it exists.
    evidence: CREATE-1 already owns shortlist behavior; PR2469 owns current usage-preflight parity. Wait for that change and the issue2060 inventory before defining a residual implementation slice.
```

## Collision reminder

Before implementation: read
[CREATE-PROGRAM.md § Collision avoidance](CREATE-PROGRAM.md#collision-avoidance)
and diff open PRs. Do not edit Evidence Ledger or unrelated migrations from
Create shortlist tasks.

## PBI History

| Timestamp (UTC) | PBI_ID | Event | Details | User |
| --- | --- | --- | --- | --- |
| 2026-08-11T15:46:00Z | CREATE-1 | create_pbi | Created Create shortlist loop PBI from UX review of ignored keep/reject + gap-fill. | cursor-agent |
| 2026-08-11T15:46:00Z | CREATE-1 | propose_for_backlog | UX rules locked with james; plan docs + tasks written for review before code. | james / cursor-agent |
| 2026-08-11T22:30:00Z | CREATE-1 | plan_hardening | Serious IMPLEMENTATION_PLAN + CREATE collision tables; agent messaging board/protocol added for multi-agent coordination. | cursor-agent |
| 2026-08-11T22:30:00Z | CREATE-1 | start_implementation | CREATE-1 tasks opened; implementation tracked on `cursor/create-1-backend-fcd9`. | cursor-agent |
| 2026-08-12T07:58:30Z | CREATE-1 | submit_for_review | #1692 merged (shortlist loop + docs). CREATE-1-1…5 Done; CREATE-1-E2E remains for fuller CoS. | cursor-agent |
| 2026-08-12T10:15:00Z | CREATE-1 | e2e_cos | CREATE-1-E2E Playwright + API CoS opened on `cursor/create-1-e2e-fcd9`. | cursor-agent |
| 2026-08-12T13:30:00Z | CREATE-1 | approve | CREATE-1-E2E merged in #1695; PBI Done. | cursor-agent |
