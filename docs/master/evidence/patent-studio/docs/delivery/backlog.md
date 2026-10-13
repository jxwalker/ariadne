# Product Backlog — Help system

Single source of truth for active Help PBIs, ordered by priority.

Program brief: [`HELP-PROGRAM.md`](HELP-PROGRAM.md)  
Historical PBIs 1–8: [`../archive/delivery/backlog.md`](../archive/delivery/backlog.md)

| ID | Actor | User Story | Status | Conditions of Satisfaction (CoS) |
| --- | --- | --- | --- | --- |
| [HELP-7](./HELP-7/prd.md) | Engineer / all users | As the product evolves, I want Help to stay truthful without a manual wiki pass so answers do not drift from glossary, routes, or USER_GUIDE. | Done | Corpus validators in CI; glossary/nav/USER_GUIDE changes require help updates or explicit `help-impact: none`; index hash freshness; ownership map documented; golden-question hook ready for HELP-6. |
| [HELP-1](./HELP-1/prd.md) | Inventor / counsel / admin | As a blocked user, I want a real Help center with searchable articles so I can solve credits, billing, keys, and getting-started without email. | Done | `/support` serves markdown articles + search; legacy `?topic=` aliases work; recovery strip preserved; USER_GUIDE Help naming/coach drift fixed in the same program; e2e CoS passes. |
| [HELP-2](./HELP-2/prd.md) | Inventor / counsel | As a user in a patent stage, I want stage primers and vocabulary articles so I know what Ideate→Handoff and Work/Filing mean without guessing. | Done | Lifecycle + glossary articles shipped; stage primers on patent shell; Learn more deep-links from Intake/Evidence/Filing/Work; glossary definitions not forked. |
| [HELP-6](./HELP-6/prd.md) | Inventor / counsel / admin | As a stuck user, I want to ask Help in plain language and get a cited answer (or an honest escalate) so I rarely need to email support. | Done | Grounded assistant on Help home; retrieve corpus + live facts; structured citations/deep links; credit-empty users can still ask; escalate fills contact packet; golden eval in CI. |
| [HELP-3](./HELP-3/prd.md) | Inventor / counsel | As a user on an empty or decision surface, I want the next step in place so I do not have to open Help for ordinary work. | Done | Shared empty-state contract on high-traffic zeros; decision helpers for keep/reject, corrections, handoff readiness; Ask Help prefill optional. |
| [HELP-5](./HELP-5/prd.md) | Inventor | As a first-time inventor, I want Create and Help “Getting started” to describe the same real path so docs never invent a coach that is gone. | Done | One truthful first-run path; Help article mirrors Create; USER_GUIDE coach claim removed/replaced; no A4 funding-policy changes. |
| [HELP-4](./HELP-4/prd.md) | Inventor / counsel / admin | As a user still blocked after Ask Help, I want Contact to carry enough context that support can answer without a follow-up. | Done | Role rails; extended support context packet; contact UX prefers post-escalate; billing opaque ref preserved; no raw org/user ids in mailto. |

## Collision reminder

Before implementation: read
[HELP-PROGRAM.md § Collision avoidance](HELP-PROGRAM.md#collision-avoidance)
and diff open PRs. Do not edit Evidence Ledger, REV-3D drawings defect paths, or
unrelated migrations from Help tasks.

## Stage 0 follow-up — HELP-S0-EVAL

**Evaluator guard implemented** in
[`3b52d70ae8935332ba4097467ef34a53f86c04c7`](https://github.com/jxwalker/patent-studio/commit/3b52d70ae8935332ba4097467ef34a53f86c04c7).
Source Q-S1-009 in the
[reconciliation](../stage-0/product-quality-reconciliation.md) records the
historical missing/empty-case defect, not current evaluator behavior. Retain
the regression coverage; do not reopen this implementation from the old row.

```yaml
id: HELP-S0-EVAL
status: Evaluator guard implemented; live-model quality and release acceptance are separate.
hypothesis: A missing or empty golden-question file is missing evaluation evidence, not a passed Help quality check.
tests_first: Retain the existing missing/empty-case rejection, explicit bootstrap opt-in and populated-corpus controls; retain cite-or-escalate and retrieve-or-fail regressions. Reproduce any new defect before changing behavior.
in_scope: Fail-closed evaluator configuration and honest separation of keyword retrieval, deterministic composer and live model evidence.
out_of_scope: Vector database, corpus/prompt rewrite, legal advice and automatic live-provider spend.
file_fence: [scripts/eval_help_assistant.py, backend/tests/test_help_assistant.py, backend/tests/test_validate_help_corpus.py]
risk: An absent test corpus silently produces green evidence.
acceptance: Required evaluation fails with actionable missing/empty-case diagnostics; corpus miss never invents wording; fixture evaluation is not called live-model proof.
evidence: The merged evaluator returns1 by default for missing or empty cases with actionable diagnostics. An explicit --allow-unconfigured option permits bootstrap-only success; the CI callers do not pass it. test_validate_help_corpus.py covers both rejection and explicit opt-in alongside the populated-corpus control. HELP-6 and CRAFT-6/PROS-10 retain the grounded-answer/law safeguards.
```

Offline verification on 20 September 2026, against source
`4047a51fb1c10a13927a0ff75ef98beadd7d6c46`: all **8** tests in
[`test_validate_help_corpus.py`](../../backend/tests/test_validate_help_corpus.py)
passed with `pytest --noconftest`; the standalone
[`eval_help_assistant.py`](../../scripts/eval_help_assistant.py) passed its
**5** retained questions, and the corpus validator passed. The **6** offline
tests in [`test_help_assistant.py`](../../backend/tests/test_help_assistant.py)
also passed, including no-hit escalation and unknown-citation rejection; its
one authenticated HTTP test was deselected, not counted as live proof.
Both evaluator invocations in the
[CI workflow](../../.github/workflows/ci.yml) were inspected and use the
default fail-closed behavior. No corpus, prompt, application or CI behavior
changed for this verification, and no provider was called. The evaluator is
deterministic fixture evidence, not live-model quality or a Stage 0/release PASS.

The law and Help regression portion of Q-S1-009 stays with the completed
owners; it does not require breaking a green test to record an artificial RED.

## PBI History

| Timestamp (UTC) | PBI_ID | Event | Details | User |
| --- | --- | --- | --- | --- |
| 2026-08-10T08:23:33Z | HELP-7 | create_pbi | Created Help self-maintenance / anti-drift PBI. | cursor-agent |
| 2026-08-10T08:23:33Z | HELP-1 | create_pbi | Created Help foundation PBI. | cursor-agent |
| 2026-08-10T08:23:33Z | HELP-2 | create_pbi | Created lifecycle & vocabulary Help PBI. | cursor-agent |
| 2026-08-10T08:23:33Z | HELP-6 | create_pbi | Created grounded Help Assistant (AI/RAG) PBI. | cursor-agent |
| 2026-08-10T08:23:33Z | HELP-3 | create_pbi | Created empty-state & decision-help PBI. | cursor-agent |
| 2026-08-10T08:23:33Z | HELP-5 | create_pbi | Created first-run honesty PBI. | cursor-agent |
| 2026-08-10T08:23:33Z | HELP-4 | create_pbi | Created contact quality & role rails PBI. | cursor-agent |
| 2026-08-10T08:23:33Z | HELP-7 | propose_for_backlog | User approved Help program incl. AI/RAG and self-maintenance; Agreed + tasks created. | james |
| 2026-08-10T08:23:33Z | HELP-1 | propose_for_backlog | User approved Help program; Agreed + tasks created. | james |
| 2026-08-10T08:23:33Z | HELP-2 | propose_for_backlog | User approved Help program; Agreed + tasks created. | james |
| 2026-08-10T08:23:33Z | HELP-6 | propose_for_backlog | User approved grounded assistant; Agreed + tasks created. | james |
| 2026-08-10T08:23:33Z | HELP-3 | propose_for_backlog | User approved Help program; Agreed + tasks created. | james |
| 2026-08-10T08:23:33Z | HELP-5 | propose_for_backlog | User approved Help program; Agreed + tasks created. | james |
| 2026-08-10T08:23:33Z | HELP-4 | propose_for_backlog | User approved Help program; Agreed + tasks created. | james |
| 2026-08-10T09:28:15Z | HELP-7 | start_implementation | Started HELP-7 with HELP-1 foundation on cursor/help-foundation-fcd9. | cursor-agent |
| 2026-08-10T09:28:15Z | HELP-1 | start_implementation | Started HELP-1 corpus + Help home with HELP-7 validators. | cursor-agent |
| 2026-08-10T09:28:15Z | HELP-7 | task_done | Tasks HELP-7-1…HELP-7-E2E implemented in foundation PR. | cursor-agent |
| 2026-08-10T09:28:15Z | HELP-1 | task_done | Tasks HELP-1-1…HELP-1-E2E implemented in foundation PR. | cursor-agent |
| 2026-08-10T11:43:57Z | HELP-2 | start_implementation | Started HELP-2 lifecycle primers on cursor/help-2-lifecycle-fcd9. | cursor-agent |
| 2026-08-10T11:43:57Z | HELP-2 | task_done | HELP-2-1…HELP-2-E2E implemented; awaiting merge. | cursor-agent |
| 2026-08-10T12:15:00Z | HELP-2 | approve | Merged #1678 — stage primers, lifecycle articles, Learn more links. | cursor-agent |
| 2026-08-10T13:44:23Z | HELP-6 | start_implementation | Started HELP-6 grounded Ask Help on cursor/help-6-assistant-fcd9. | cursor-agent |
| 2026-08-10T13:44:23Z | HELP-6 | task_done | HELP-6-1…HELP-6-E2E implemented; awaiting merge. | cursor-agent |
| 2026-08-10T14:58:58Z | HELP-6 | approve | Merged #1680 — grounded Ask Help with citations and golden eval. | cursor-agent |
| 2026-08-10T16:29:26Z | HELP-3 | start_implementation | Started HELP-3 empty states + decision helpers on cursor/help-3-empty-states-fcd9. | cursor-agent |
| 2026-08-10T16:29:26Z | HELP-3 | task_done | HELP-3-1…HELP-3-E2E implemented; awaiting merge. | cursor-agent |
| 2026-08-10T16:59:56Z | HELP-3 | approve | Merged #1683 — empty-state contract + decision helpers. | cursor-agent |
| 2026-08-10T17:32:00Z | HELP-5 | start_implementation | Started HELP-5 first-run honesty on cursor/help-5-first-run-fcd9. | cursor-agent |
| 2026-08-10T17:32:00Z | HELP-5 | task_done | HELP-5-1…HELP-5-E2E implemented; awaiting merge. | cursor-agent |
| 2026-08-10T17:32:00Z | HELP-1 | approve | Foundation already merged (#1675); mark Done. | cursor-agent |
| 2026-08-10T17:36:22Z | HELP-4 | start_implementation | Started HELP-4 contact quality on cursor/help-4-contact-fcd9. | cursor-agent |
| 2026-08-10T17:36:22Z | HELP-4 | task_done | HELP-4-1…HELP-4-E2E implemented; awaiting merge. | cursor-agent |
| 2026-08-10T17:52:31Z | HELP-5 | approve | Merged #1685 — Getting started matches Create CTAs. | cursor-agent |
| 2026-08-10T19:15:15Z | HELP-4 | approve | Merged #1686 — role rails + escalate contact packet. | cursor-agent |
