# Public beta status

**Snapshot date:** 2026-08-31
**Drawing-status reconciliation:** 2026-09-20 (does not refresh the deployment snapshot)
**Alembic:** `150`
**Registration:** `invite_only` (do not relax)
**AI registry:** keep BYOK / no silent provider fallback for users

This snapshot was refreshed after the docs consolidation in #1649 and the
production advance that carried PR #1648 (filing handoffs + targeted
corrections). That production advance invalidated the earlier Gate 0.3 and
partial 0.4 exact-release evidence under the checklist freeze rule; both must be
rerun on the next frozen candidate. Use the checklist and a fresh private
exact-SHA packet for the current decision and release evidence.

**How to use this file:** This is the current-state source of truth for “where we are.”
Gate checkboxes and completion rules live in [`PUBLIC_BETA_CHECKLIST.md`](PUBLIC_BETA_CHECKLIST.md).
Operator drills: [`acceptance/GATE0_OPERATOR_UNBLOCK.md`](acceptance/GATE0_OPERATOR_UNBLOCK.md).
Evidence ledger: [`BETA_TODO.md`](BETA_TODO.md).

This source-controlled file intentionally does not embed a “current `main`
SHA.” A commit cannot contain its own final Git hash, so that claim becomes
stale as soon as the status edit is merged. For release proof, run
[`scripts/collect_gate0_release_evidence.sh`](../scripts/collect_gate0_release_evidence.sh)
and use its private packet for the exact deployed revision, successful
`CI Required Gate`, Alembic head, service inventory, registration mode, and
smoke result.

## Verdict

| Release level | Ready? | Why |
|---|---|---|
| Private invite beta (Gate 0) | **NO** | 0.3–0.6 must be rerun on one frozen release; backup P0 residual 4B–4C still open; written approval open |
| Public waitlist/open (Gate A) | **NO** | Needs Gate 0 + A0 decisions + A4 provider trace |
| Paid self-serve (Gate B) | **NO** | Needs Gate 0+A; B3 and B4 acceptance open |
| Advertised scale (Gate C) | **NO** | C0–C4 engineering shipped; no box is accepted until its own gate-specific evidence exists, and C1 needs a green measured run |

## Done (engineering + accepted)

- **Runtime hardening (2026-08-31, engineering merged; deploys via the normal
  UAT train):** fail-closed queue submission and platform-credential decrypt
  ([#2150](https://github.com/jxwalker/patent-studio/pull/2150)); prior-art
  grounding outages reported instead of silently degrading
  ([#2151](https://github.com/jxwalker/patent-studio/pull/2151)); session
  revocation with `logout-all` (migration 149,
  [#2152](https://github.com/jxwalker/patent-studio/pull/2152)); Alembic
  startup serialized across containers
  ([#2153](https://github.com/jxwalker/patent-studio/pull/2153)); backup
  manifests record the schema revision and restores refuse an unknown one —
  backups taken before this are unverifiable until the next nightly produces a
  compliant manifest
  ([#2155](https://github.com/jxwalker/patent-studio/pull/2155)); production
  refuses the in-process job runner unless acknowledged
  ([#2156](https://github.com/jxwalker/patent-studio/pull/2156)); deletion
  cleanup is durably recorded and retried (migration 150,
  [#2157](https://github.com/jxwalker/patent-studio/pull/2157)); worker
  delivery-ownership fencing for the plain job lanes
  ([#2164](https://github.com/jxwalker/patent-studio/pull/2164)). The
  [SEC backlog](delivery/sec-backlog.md) rows SEC-1..SEC-7 are all
  implemented or closed.

- **Gate 0.1** access/release snapshot controls; **0.2** funding + spend safety (funded invite path).
- **UX-1–11** chrome consistency (align / ideas / chrome clusters).
- **Filing and corrections engineering** from PR #1648 is released: focused
  project handoffs, readiness-led selection, in-app package inspection,
  review-first ZIP navigation, targeted white-paper artwork changes, and the
  shared review-before-apply contract. Real-workflow acceptance remains in the
  [surface tracker](../design/north-star-ui/SURFACE-TRACKER.md). The REV-3A
  formal-drawing review path is also implemented; its remaining real-workflow
  and filing-PDF acceptance is recorded there.
- **Stripe eng:** `invoice.payment_failed` dunning path ([#1445](https://github.com/jxwalker/patent-studio/pull/1445)); OPS-7 subscription credit idempotency ([#1446](https://github.com/jxwalker/patent-studio/pull/1446)); `invoice.paid` recovery + stale/cross-sub guards ([#1451](https://github.com/jxwalker/patent-studio/pull/1451), [#1453](https://github.com/jxwalker/patent-studio/pull/1453)); 0.5 worksheet hardening ([#1450](https://github.com/jxwalker/patent-studio/pull/1450)).
- **OPS-9** platform spend ceiling guard ([#1447](https://github.com/jxwalker/patent-studio/pull/1447)); **OPS-8** atomic platform spend reservation ([#1449](https://github.com/jxwalker/patent-studio/pull/1449)).
- **Gate A1–A3, A5** accepted; **A4** funded and unfunded application paths passed at one exact production revision, with the independent provider no-call trace still open ([evidence](archive/acceptance/GATE_A4_ACCEPTANCE_2026-07-27.md)).
- **Gate B1, B2, B5** accepted; Stripe **sandbox** loop accepted (not live).
- **B4** object-storage **code** + eng-prep (boot warning, Admin status/validate, acceptance worksheet) shipped; production still local (ops cutover open — [`GATE_B4_OBJECT_STORAGE_ACCEPTANCE.md`](acceptance/GATE_B4_OBJECT_STORAGE_ACCEPTANCE.md)).
- **B3** organisation billing **engineering** shipped: ADR [`ORGANIZATION_BILLING_AND_OWNERSHIP.md`](decisions/ORGANIZATION_BILLING_AND_OWNERSHIP.md), organisation settings and funding controls ([#1471](https://github.com/jxwalker/patent-studio/pull/1471)), org-authoritative Stripe subscriptions and org-scoped plan/project enforcement ([#1473](https://github.com/jxwalker/patent-studio/pull/1473)). Production acceptance open ([`GATE_B3_ORGANIZATION_BILLING_ACCEPTANCE.md`](acceptance/GATE_B3_ORGANIZATION_BILLING_ACCEPTANCE.md)).
- **Gate C C0–C4 engineering** shipped: C0 target recorded in [`LOAD_GATE.md`](operations/LOAD_GATE.md); C1 load harness ([#1474](https://github.com/jxwalker/patent-studio/pull/1474)); C2 capacity model and replica-safe deploy ([#1478](https://github.com/jxwalker/patent-studio/pull/1478)); C3 operational metrics, DB-managed SLO thresholds, protected scrape, Prometheus alert rules and weekly baseline workflow ([#1479](https://github.com/jxwalker/patent-studio/pull/1479)); C4 horizontal correctness proof ([#1475](https://github.com/jxwalker/patent-studio/pull/1475)). No Gate C box is accepted until its own gate-specific evidence is complete. C1 requires a green measured run against an exact deployed revision; operator approval selects the window, it does not substitute for the run.
- **Backup Health green path:** scheduled `Backup Health` has exited success
  for consecutive daily runs through 2026-08-05 after #1599 reached production
  (latest inspected run
  [30981740672](https://github.com/jxwalker/patent-studio/actions/runs/30981740672),
  `CHECK_OUTCOME=success`). This proves monitor reporting on the happy path;
  it does **not** close 4B’s deliberate-failure drill or 4C restore.
- **polish-ready** shell / home / Intake / language clusters merged.
- **Gate D3 glossary enforcement** accepted on production with the remaining
  tracked surfaces covered by the required product-language guard
  ([evidence](archive/acceptance/GATE_D3_GLOSSARY_ACCEPTANCE_2026-07-28.md)).
- Operator handoff doc: [`GATE0_OPERATOR_UNBLOCK.md`](acceptance/GATE0_OPERATOR_UNBLOCK.md) ([#1452](https://github.com/jxwalker/patent-studio/pull/1452)).
- Eng Gate 0 code paths for 0.3–0.6 worksheets shipped 2026-07-26. The July
  0.3 drills and 0.4 invitation row were useful acceptance rehearsals, but
  later production advances invalidated both exact-release worksheets. All
  0.3–0.6 evidence is open on the next frozen candidate.
- Canonical docs consolidation landed in #1649; release authority remains
  [`PUBLIC_BETA_CHECKLIST.md`](PUBLIC_BETA_CHECKLIST.md).

## Now — unblock private invite (operator)

Numbered list matching [`GATE0_OPERATOR_UNBLOCK.md`](acceptance/GATE0_OPERATOR_UNBLOCK.md)
plus the backup P0 residual from [`BETA_TODO.md`](BETA_TODO.md):

1. **Freeze** a green exact production candidate and collect a private packet.
2. **0.3** reconfirm effective configuration, rerun forced-event privacy
   review, dead-man and paused-lane recovery, prove `monitor:background_jobs`
   delivery, and sign the
   [worksheet](acceptance/GATE0_3_OBSERVABILITY_ACCEPTANCE.md).
3. **0.4** rerun all five cold Outlook rows on that same frozen release,
   recording Inbox/Junk placement and redacted SPF/DKIM/DMARC evidence in the
   [worksheet](acceptance/GATE0_4_OUTLOOK_ACCEPTANCE.md).
4. **0.5** Stripe live + dunning + OPS-7 replay + recovery (`invoice.paid`).
5. **0.6** finish the exact-SHA journey, A4 provider trace, and NotebookLM A6.4–5 / A7–A8.
6. **Backup P0:** complete 4B deliberate failure drill and 4C unattended
   off-host restore; keep green-path Backup Health green through the window.
7. Written Gate 0 approval + refresh the private sign-off packet for the exact
   deployed release.

## Prioritized public-beta todo

Ordered by irreversible harm → uncontrolled cost → legal exposure →
reliability → conversion → polish. Detail and evidence links live in the
checklist and `BETA_TODO.md`.

### P0 — before any invite circulates

1. Freeze exact-SHA release packet; do not advance production mid-window.
2. Gate 0.3 observability drills on that SHA.
3. Gate 0.4 cold Outlook five-row matrix on that SHA.
4. Gate 0.5 Stripe live subscribe / allowance / cancel / dunning / OPS-7 /
   recovery / plan gates.
5. Gate 0.6 funded journey + NotebookLM A6.4–5 / A7–A8 (+ A4 provider trace).
6. Backup 4B negative proof + 4C unattended restore.
7. Operator written Gate 0 approval; keep `invite_only` / BYOK.

### P1 — invite confidence and public front door

1. UX-12 filing handoff real-workflow acceptance (desktop + 390px).
2. UX-13 correction real-workflow acceptance, including the implemented
   REV-3A formal-drawing review path.
3. A0 decisions: approve waitlist + Cloudflare Turnstile + retention/expiry
   ([decision](decisions/PUBLIC_BETA_REGISTRATION.md)).
4. Finish A4 provider no-call residual if not closed under Gate 0.6.
5. Gate A exit: one exact SHA, rollback to `invite_only`, operator approval.
6. Pre-invite hygiene still open in `BETA_TODO`: 4D host-decommission checklist,
   4E backup dead-man heartbeat, 4F backup-contents policy decisions, 9M CI
   host credential attestation/rotation.

### P2 — paid self-serve

1. B3 organization billing production acceptance
   ([worksheet](acceptance/GATE_B3_ORGANIZATION_BILLING_ACCEPTANCE.md)).
2. B4 production object-storage cutover + acceptance
   ([worksheet](acceptance/GATE_B4_OBJECT_STORAGE_ACCEPTANCE.md)).
3. Gate B exit on one exact SHA.

### P3 — advertised scale and hardening

1. C1 one green measured run at the committed 25/10/20 target.
2. C2 production concurrency from C1 + live drain record.
3. C3 protected scrape, forced alert/recovery, weekly baseline artifact.
4. C4 two-API-host proxy drill; operator approval of advertised claim.
5. Gate D1 continue module splits; D4 SSO only if a DXC cohort is offered.

## Standing constraints

- Registration stays `invite_only` until Gate A exit.
- AI registry stays BYOK — no silent provider fallback for users.
- Deploy only through the UAT-first workflow or guarded promotion script in
  [`operations/UAT_RELEASES.md`](operations/UAT_RELEASES.md).
- `ENCRYPTION_KEY` is immutable across deploys.
- Single Alembic head. The revision moves with every migration, so read it
  from `alembic heads` rather than from any document; a number written here
  is wrong within days.
- Cursor branches: `cursor/*`. Codex: `jxw/*`. Do not collide; never merge `jxw/*` from Cursor.

## Open engineering (non-invite)

- **REV-3A formal drawings:** review-before-replace is implemented. Complete
  the remaining Apply, Restore, Discard and filing-PDF real-workflow acceptance
  owned by the
  [surface tracker](../design/north-star-ui/SURFACE-TRACKER.md#rev-3a--formal-drawing-review-before-replace);
  implementation alone does not close UX-13 or approve a release.
- **Gate C:** none. C0–C4 engineering is merged; the open boxes are measured
  runs and operator approval, not code.
- **A4:** the unfunded BYOK-only path still needs an independent trace proving
  no provider call happens before the block
  ([evidence](archive/acceptance/GATE_A4_ACCEPTANCE_2026-07-27.md)).
- **Backup 4B/4C:** green-path reporting proven; deliberate failure and
  unattended restore remain operator/engineering follow-through in
  [`BETA_TODO.md`](BETA_TODO.md).
- **B4:** eng-prep shipped
  ([#1458](https://github.com/jxwalker/patent-studio/pull/1458)); production
  cutover still needs operator bucket credentials and the
  [`GATE_B4_OBJECT_STORAGE_ACCEPTANCE.md`](acceptance/GATE_B4_OBJECT_STORAGE_ACCEPTANCE.md)
  worksheet.
- Stacked open PRs `#1644`, `#1645`, and `#1647` appear to cover work absorbed
  by merged `#1648`; do not treat them as remaining public-beta blockers
  without confirming with their owners.

## Update rule

When a gate flips, update the snapshot date, Verdict, and Done/Now sections here
the same day, then flip checkboxes in
[`PUBLIC_BETA_CHECKLIST.md`](PUBLIC_BETA_CHECKLIST.md). When application code
is deployed or production configuration changes, collect a new private
exact-release packet instead of adding a self-referential SHA to this file.
