# Product Backlog — Briefing kinds

Single source of truth for BRIEF PBIs, ordered by sequence.

Program brief: [`BRIEF-PROGRAM.md`](BRIEF-PROGRAM.md)

| ID | Actor | User Story | Status | Conditions of Satisfaction (CoS) |
| --- | --- | --- | --- | --- |
| [BRIEF-1](./BRIEF-1/prd.md) | Inventor | As an inventor, I want to choose a briefing kind (YC memo or internal build-and-patent pitch) so Refine does not always write a seed-stage investor memo. | Done | Kind registry; start accepts `kind`; existing empty POST stays YC; pipeline skip is per-kind; Refine wizard lists kinds. |
| [BRIEF-2](./BRIEF-2/prd.md) | Inventor / org admin | As a DXC (or SME) teammate, I want a reusable org audience profile I can edit, so every patent briefing can speak in our voice. | Done | Org-scoped CRUD; guided intake; snapshot pinned on generate; members use, owner/admin edit. |
| [BRIEF-3](./BRIEF-3/prd.md) | Inventor / org admin | As someone briefing a public enterprise, I want to research it online into a draft profile I must edit before use. | Done | Durable research job; citations; status stays draft until save; no fake profile on failure. |
| [BRIEF-4](./BRIEF-4/prd.md) | Inventor / org admin | As a repeat inventor, I want to save kind + profile + style as a named template and start from it on Create or Refine. | Done | Template CRUD; start accepts `template_id`; Create outputs uses the same start contract. |
| [BRIEF-5](./BRIEF-5/prd.md) | Inventor | As a presenter, I want an HTML slide deck of the idea I can click through and export. | Done | `html_deck` kind; trusted player; HTML export; PPTX via existing renderer. |
| [BRIEF-6](./BRIEF-6/prd.md) | Inventor | As a reader of Help and Files, I want one briefing path, not a YC paper plus a leftover pitch-deck row. | Done | Kind/format badges; Help + USER_GUIDE; leftover executive-brief stays break-glass. |
| BRIEF-7 | Inventor | As an inventor writing an internal pitch, I want to type a company or market and have AI fill the organization prompts. | Done | Wizard research-and-fill; company or segment query; citations stay draft; failed research does not look ready. |
| [BRIEF-8](./BRIEF-8/prd.md) | Inventor | As an inventor using Research and fill, I want the public notes about that company or market to land in the prompts. | Done | Sonar payload is parsed; empty notes fail; prompts stay visible while research runs. |

## Stage 0 regression disposition

Q-S1-015 from the [reconciliation](../stage-0/product-quality-reconciliation.md)
is retained under **BRIEF-1/3/6**, not a new independently claimable backlog:
kind/format persistence, draft research metadata and derived-briefing labels
remain their contracts. Keep the existing white-paper/briefing regression
tests green. Use synthetic data to check that derived briefing research does
not silently become an Evidence item and that stored kind/format survives
reader/export. If that check exposes a writer gap, agree a narrow RED-first
follow-up before changing it; do not infer a current defect from the old
proposal. No prompt/model change, live research, or protected matter content.

## Collision reminder

Read [BRIEF-PROGRAM.md](BRIEF-PROGRAM.md). Do not edit Evidence Ledger write
paths or unrelated Alembic heads.

## PBI History

| Timestamp (UTC) | PBI_ID | Event | Details | User |
| --- | --- | --- | --- | --- |
| 2026-08-18T14:30:00Z | BRIEF-1…6 | create_pbi | Created BRIEF program from approved briefing-kinds plan. | james / cursor-agent |
| 2026-08-18T14:30:00Z | BRIEF-1…6 | propose_for_backlog | Plan approved; rules locked (org-scoped profiles, shipped kinds, HTML decks). | james |
| 2026-08-18T14:30:00Z | BRIEF-1…6 | start_implementation | Implementation on `cursor/briefing-kinds`. | cursor-agent |
| 2026-08-18T15:10:00Z | BRIEF-1…6 | complete_implementation | Kinds, profiles, research, templates, decks, and Help path shipped. | cursor-agent |
| 2026-08-18T20:00:00Z | BRIEF-7 | create_pbi | Internal-pitch wizard should research a company or market into the guided prompts. | james / cursor-agent |
| 2026-08-18T20:00:00Z | BRIEF-7 | start_implementation | Implement on `cursor/briefing-research-fill`. | cursor-agent |
| 2026-08-18T21:06:00Z | BRIEF-7 | complete_implementation | [#1815](https://github.com/jxwalker/patent-studio/pull/1815) merged. | cursor-agent |
| 2026-08-19T06:50:00Z | BRIEF-8 | create_pbi | Production Research and fill left internal-pitch prompts empty. | james / cursor-agent |
| 2026-08-19T06:50:00Z | BRIEF-8 | start_implementation | Implement on `cursor/briefing-research-notes`. | cursor-agent |
| 2026-08-19T09:15:00Z | BRIEF-8 | complete_implementation | [#1818](https://github.com/jxwalker/patent-studio/pull/1818) merged and promoted. | cursor-agent |
