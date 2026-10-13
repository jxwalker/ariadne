# Public beta release checklist

**Current status snapshot:** [`PUBLIC_BETA_STATUS.md`](PUBLIC_BETA_STATUS.md)

Date created: 2026-07-24

This is the canonical Patent Studio beta goal and the only status checklist.
Update this file when a gate changes state. The supporting documents provide
design, policy, and evidence detail, but do not maintain competing goals or
release statuses:

- [`PUBLIC_BETA_SCALE_PLAN.md`](PUBLIC_BETA_SCALE_PLAN.md): requirements,
  acceptance criteria, dependencies, and implementation sizing.
- [`operations/FREE_TIER_AND_BETA_FUNDING.md`](operations/FREE_TIER_AND_BETA_FUNDING.md):
  entitlement, funding, and spend-control policy.
- [`BETA_TODO.md`](BETA_TODO.md): detailed historical release and production
  acceptance evidence.
- [archived MVP release evidence](../.planning/archive/reference/mvp-milestones/MVP-RELEASE-EVIDENCE.md):
  dated MVP and production evidence.

## Canonical goal

Release Patent Studio from private invite beta through public, paid, and
advertised-scale beta without compromising invention confidentiality, tenant
isolation, filing integrity, service reliability, or bounded AI spend.

There is one goal and one ordered gate sequence:

1. **Gate 0:** approve the private invite beta.
2. **Gate A:** approve the public front door.
3. **Gate B:** approve paid self-service.
4. **Gate C:** approve advertised scale.
5. **Gate D:** complete post-launch hardening.

Gate 0 is the current release milestone. When a remaining Gate 0 item is
waiting solely on operator credentials, an external provider, or a controlled
acceptance window, engineering may advance the next code-owned item in Gate A.
That work remains part of this goal; it does not create a parallel goal or
change the current release level.

## Completion rule

An item is complete only when all applicable code, automated tests, required
CI, exact-main deployment, production acceptance, and dated evidence are
complete. A merged implementation without production acceptance remains open.

The application-affecting candidate must be the exact green `main` revision at
deployment. Later source-controlled status text must not claim to contain its
own final commit SHA; exact revision proof belongs in the private output from
`scripts/collect_gate0_release_evidence.sh`. Deploy and record the selected
green `main` revision before starting Gate 0.3–0.6 drills, then freeze that
revision through sign-off. If production advances after a drill starts,
invalidate the current Gate 0.3–0.6 evidence window, recollect the private
packet, and rerun all drills against the new revision before sign-off.

Record evidence in `BETA_TODO.md` or `MVP-RELEASE-EVIDENCE.md`, then add the
evidence link beside the completed item here. Do not paste long release
histories into this checklist.

## Release levels

| Release level | Required gates |
|---|---|
| Private invite beta | Gate 0 |
| Public waitlist or open beta | Gate 0 + Gate A |
| Paid self-serve beta | Gate 0 + Gate A + Gate B |
| Advertised scale beyond invite traffic | Gate 0 + Gate A + Gate B + Gate C |

Production registration remains `invite_only` until Gate 0 and Gate A are
complete. Gate D is post-launch hardening unless a Gate D item becomes a
release blocker through testing or incident evidence.

## Current baseline

- [x] Core MVP journey, tenant isolation, ownership, legal/trust, backup
      machinery, durable jobs, administrator configuration, and spend
      enforcement are implemented and released. Backup **monitor green path**
      is reporting in production; deliberate failure proof (4B residual) and
      unattended restore (4C) remain open in `BETA_TODO.md`.
- [x] The five-stage journey and in-place Research and Claim Review findings
      are implemented.
- [x] Per-user NotebookLM connection and immutable Evidence snapshots are
      implemented.
- [x] GitHub.com and administrator-approved enterprise GitHub hosts are
      implemented for Repository Mining.
- [x] Refresh this baseline and the dated evidence links after each production
      release before changing a release-level decision. Gate 0 engineering
      paths are shipped; the dated Gate 0.3 drill and Gate 0.4 invitation
      evidence were invalidated when production advanced, so complete 0.3–0.6
      evidence remains open on the next frozen candidate. See
      [`PUBLIC_BETA_STATUS.md`](PUBLIC_BETA_STATUS.md) for the dated operator
      snapshot. Re-record the exact deployed candidate SHA, its successful
      required gate, Alembic head, and health evidence in the private sign-off
      packet before any invite decision. Use
      [`acceptance/GATE0_RELEASE_EVIDENCE.md`](acceptance/GATE0_RELEASE_EVIDENCE.md)
      for the next exact-candidate packet. Gate A1-A3, A5, B1, B2, B5,
      NotebookLM recovery, Stripe sandbox, and object-storage code records are
      in `BETA_TODO.md`.

## Operator go / no-go (private invite)

Use this short checklist before circulating invite links. Detail lives in the
Gate 0 sections below and in [`BETA_TODO.md`](BETA_TODO.md). Gate 0.1
controls/policy are accepted. Before beginning the remaining drills, deploy a
selected green `main` revision and collect its exact release-candidate packet.
Do not deploy a newer revision after drills begin. If production advances,
invalidate the full Gate 0.3–0.6 evidence window, recollect the private packet,
and rerun every drill against the new revision before invite approval.

| Check | Status |
|---|---|
| Gate 0.1 access + release snapshot | Done (re-record exact candidate SHA at sign-off) |
| Gate 0.2 funding + spend safety | Done |
| Gate 0.3 Sentry + dead-man drills | **OPEN** — July drill evidence was invalidated by later production advances; collect a new exact-release packet and rerun the complete worksheet |
| Gate 0.4 cold Outlook matrix | **OPEN** — July invitation-only evidence was invalidated by later production advances; rerun all five rows on the frozen candidate |
| Gate 0.5 Stripe live + dunning | **OPEN** (sandbox only) |
| Gate 0.6 exact-SHA journey + NotebookLM A6–A8 | **OPEN** (A4 application paths passed; provider trace, full journey, and NotebookLM remain) |
| Backup integrity P0 residual (`BETA_TODO` 4B–4C) | **OPEN** — green-path Backup Health is reporting; deliberate failure drill and unattended restore remain |
| No open P0/P1 privacy, spend, or filing defects | Required at exit |
| Operator written approval to circulate invites | **OPEN** |
| Keep `invite_only` / `ai_registry_mode=byok` | Required (do not relax) |

**Verdict:** private invite beta is **not ready** until (a) Gate 0.3–0.6 are
accepted with dated evidence on one frozen release, (b) backup P0 residual
4B–4C is closed or explicitly waived with written risk acceptance, and (c)
the operator written-approval row is complete. Do not circulate invites until
those are satisfied. §0.7 UX consistency remains non-blocking invite-confidence
backlog.

## Gate 0: private invite beta

Gate 0 is the immediate release target. Product implementation is substantially
complete; the remaining work is mainly operator configuration and controlled
production acceptance.

**Active goal:** complete every non-conditional Gate 0 item, obtain explicit
operator approval, and release the private invite beta. Gates A-D are the
ordered roadmap after this goal, not parallel active goals.

### 0.1 Release and access controls

- [x] Registration defaults to invite-only.
- [x] Email verification gates paid AI, export, collaboration, filing, and
      destructive actions.
- [x] Cross-tenant access, canonical ownership, administrator inspection, and
      sensitive-secret boundaries have passed automated and production
      acceptance.
- [x] Record the exact green `main` SHA, Alembic head, service inventory,
      worker-lane health, and rollback point for the release candidate.
      [Evidence](BETA_TODO.md#gate-0-release-candidate-snapshot-2026-07-24).

### 0.2 Funding and spend safety

- [x] Set a nonzero platform daily AI spend ceiling in **Admin > Spend
      limits** and prove that it blocks before provider spend.
- [x] Confirm nonzero per-user daily call, token, and spend caps plus a
      nonzero per-run generation cap.
- [x] Choose and record the invite funding mode:
      administrator-funded one-time beta grant, or explicitly BYOK-only.
- [x] If funded, enable the versioned beta grant and prove with one disposable
      account: one grant, one matching debit, operational allowance exhaustion
      where the remaining balance cannot fund the next priced workload, no
      provider call after that block, and no duplicate grant on replay.
- [x] The BYOK-only branch is not applicable because Gate 0 uses the funded
      targeted-invite policy.
- [x] Review `/support?topic=credits` and `/support?topic=billing`.

Production funding and spend acceptance is recorded as item 9K under
[`BETA_TODO.md` P1](BETA_TODO.md#p1--before-invite-links-circulate).

Funding policy and authoritative configuration locations are defined in
[`operations/FREE_TIER_AND_BETA_FUNDING.md`](operations/FREE_TIER_AND_BETA_FUNDING.md).

### 0.3 Observability

Operator worksheet:
[`acceptance/GATE0_3_OBSERVABILITY_ACCEPTANCE.md`](acceptance/GATE0_3_OBSERVABILITY_ACCEPTANCE.md).

- [ ] Collect a fresh private exact-release packet and freeze production for
      the Gate 0.3–0.6 window.
- [ ] Reconfirm the effective database-backed backend/worker profile, deployed
      browser Sentry destination, alert routes, and five-minute dead-man
      requirement without recording secret values.
- [ ] Force and privacy-review one event from the browser, API, monitor, and
      every deployed worker family on that exact release.
- [ ] Complete dead-man silence/recovery, paused-lane alert/recovery, and
      `monitor:background_jobs` delivery on the same revision.
- [ ] Record private evidence and obtain written operator approval.

The 2026-07-28 drill record remains useful historical evidence but was
invalidated when production advanced. It is archived at
[`archive/acceptance/GATE0_3_OBSERVABILITY_ACCEPTANCE_INVALIDATED_2026-08-05.md`](archive/acceptance/GATE0_3_OBSERVABILITY_ACCEPTANCE_INVALIDATED_2026-08-05.md)
and must not be used to sign off the current candidate.

### 0.4 Email

Operator worksheet:
[`acceptance/GATE0_4_OUTLOOK_ACCEPTANCE.md`](acceptance/GATE0_4_OUTLOOK_ACCEPTANCE.md).

- [ ] Reconfirm the effective production mail profile and public SPF, DKIM,
      DMARC, and MX records on the frozen exact release.
- [ ] Receive invitation, verification, password-recovery, owner/workspace
      notification, and responder messages at a cold Outlook account.
- [ ] Record Inbox/Junk placement and redacted authentication results for all
      five rows in the private packet.
- [ ] Reconfirm truthful, non-enumerating delivery-failure copy and clean up
      disposable accounts and tokens.
- [ ] Obtain written operator approval.

The 2026-07-28 invitation reached Outlook Junk with passing authentication, but
the matrix was incomplete and later production advances invalidated it. That
partial record is archived at
[`archive/acceptance/GATE0_4_OUTLOOK_ACCEPTANCE_INVALIDATED_2026-08-05.md`](archive/acceptance/GATE0_4_OUTLOOK_ACCEPTANCE_INVALIDATED_2026-08-05.md).

### 0.5 Billing

Operator worksheet:
[`acceptance/GATE0_5_STRIPE_ACCEPTANCE.md`](acceptance/GATE0_5_STRIPE_ACCEPTANCE.md).

- [ ] Save and validate the production Stripe live-mode profile in
      **Admin > Billing**.
- [ ] Complete subscribe, allowance grant, cancellation, failed payment/dunning,
      Support billing `last_invoice_id`, OPS-7 webhook replay (no duplicate
      allowance), recovery-after-dunning entitlements restore, and plan-gate
      acceptance with dated Stripe references (worksheet
      [`GATE0_5_STRIPE_ACCEPTANCE.md`](acceptance/GATE0_5_STRIPE_ACCEPTANCE.md)).
- [ ] If Gate 0.6 runs in the same acceptance window, require the **same**
      exact production SHA on both worksheets.
- [ ] Keep paid checkout unavailable until the live loop passes.

Stripe sandbox checkout, webhook delivery, allowance grant, portal access,
cancellation, downgrade, and disposable-account cleanup passed on 25 July 2026.
This is pre-acceptance only: live-mode configuration, failed-payment/dunning,
OPS-7 replay, recovery-after-dunning, Support `last_invoice_id`, and the
complete live plan gate remain open. Application webhook handling for
`invoice.payment_failed` (support event, `past_due`, plan downgrade, no
allowance grant) is implemented; `past_due` and `unpaid` both clear paid
entitlements. Live-mode operator evidence is still required.

The saved sandbox profile is disabled in production, so its encrypted test
credentials remain available for administrator verification but cannot expose
customer checkout or the billing portal. Production customer flows now also
fail closed unless the effective Stripe key is live; the bootstrap-only
test-mode override remains false outside a time-bounded operator acceptance run.

2026-07-28 exact-candidate preflight (does **not** close §0.5): Admin Billing
reports a database profile with stored key and webhook secret, `key_mode=test`,
`enabled=false`, and `checkout_available=false`. No live customer flow was
enabled or exercised.

### 0.6 Production journeys and integrations

Operator worksheet:
[`acceptance/GATE0_6_JOURNEY_NOTEBOOKLM_ACCEPTANCE.md`](acceptance/GATE0_6_JOURNEY_NOTEBOOKLM_ACCEPTANCE.md).

- [ ] Complete one funded or BYOK paid-provider journey on the release
      candidate: Evidence or NotebookLM → Create → candidates → Research →
      Draft → Refine → white paper/artifacts → filing pack.
- [ ] Complete NotebookLM A6 steps 4-5: disconnect the owner's live profile,
      generate from the immutable snapshot, and verify exact provenance.
- [ ] Complete NotebookLM A7-A8 with an independently connected Google account,
      sharing, revocation, and retained snapshot evidence.
- [ ] For any cohort offered DXC sign-in, complete real Microsoft Entra/DXC
      Conditional Access, sign-in, sign-out, linking, and audit acceptance.
- [ ] Before advertising Repository Mining, configure and validate credentials
      for `github.com` and `github.dxc.com`, then run one tenant-isolated private
      repository mining journey on each advertised host.
- [x] Run and record the weekly authenticated desktop/mobile acceptance batch
      against the current release candidate. The 2026-07-24 read-only run on
      `ec05e7f1` covered all 12 canonical surfaces at 1440 x 900 and
      390 x 844 with zero route-identity failures, page alerts, horizontal
      overflow, or captured browser warnings/errors. Mobile Idea Library
      navigation and representative settled-state visuals also passed.

2026-07-28 exact-candidate preflight (does **not** close §0.6): the
NotebookLM CLI is available and the owner's encrypted per-user profile reports
`authenticated=true`, `refreshable=true`, and `status=ok`. The destructive
A6.4 disconnect/snapshot drill, independent-account A7-A8 work, and the funded
end-to-end journey remain open.

### 0.7 UX consistency (invite confidence)

Does not block Gate 0 operator exit by itself, but should be queued for
invite-cohort confidence. Evidence backlog:
[`BETA_TODO.md` UX/UI consistency backlog](BETA_TODO.md#uxui-consistency-backlog-2026-07-26-audit).

- [x] **UX-1** Unify signed-in page column alignment: Admin `mx-auto` /
      `max-w-*` centering vs Create/Ideas/Settings full-bleed `w-full` (the
      Admin left-indent mismatch). Done: `cursor/ux-align`.
- [x] **UX-2** Unify TopBar, verification banner, and `AppShell` main
      horizontal padding at `sm+` breakpoints. Done: `cursor/ux-align`.
- [x] **UX-3** Unify `AdminPageHeader` with shared `PageHeader` (eyebrow,
      title-block, description tone). Done: `cursor/ux-align`.
- [x] **UX-4** Ideas breadcrumb reflects the active view (Intake / Sources /
      Ideas / …), not a stuck "Idea library" label. Done: `cursor/ux-ideas`.
- [x] **UX-5** One header contract across Ideas views. Done: `cursor/ux-ideas`.
- [x] **UX-6** Remove nested `<main>` / double-padding on error surfaces. Done: `cursor/ux-chrome`.
- [x] **UX-7** Quiet PublicShell on legal/404 (no charcoal marketing hero). Done: `cursor/ux-chrome`.
- [x] **UX-8** Normalize control heights across Ideas / Admin / Patents. Done: `cursor/ux-chrome`.
- [x] **UX-9** Create run page uses PageHeader; Files avoids double title. Done: `cursor/ux-chrome`.
- [x] **UX-10** Auth vs app brand-mark unify. Done: `cursor/ux-chrome`.
- [x] **UX-11** Admin overview reduces "Admin" repetition (crumb/eyebrow/h1). Done: `cursor/ux-chrome`.
- [x] **UX-12 engineering — focused counsel handoffs.** PR #1648 released the
      project-first workspace, immediate package state, readiness-led patent
      defaults and server guards, in-app package inspection, and review-first
      ZIP navigation. Current scope and proof:
      [`FILING-1 to FILING-3`](../design/north-star-ui/SURFACE-TRACKER.md#filing-handoff-workspace--filing-1-to-filing-3).
- [ ] **UX-12 acceptance.** Complete one representative large-project handoff
      with ready and incomplete patents at desktop and 390px without navigation
      help; inspect the package, download it, and send it to counsel.
- [x] **UX-13 engineering — targeted artifact corrections.** PR #1648 released
      one versioned request/proposal/apply/discard/rollback contract, targeted
      white-paper figure changes, and review-before-apply for specification
      prose, claims, and AI-generated drawings. Current scope and proof:
      [`REV-1 to REV-3`](../design/north-star-ui/SURFACE-TRACKER.md#targeted-artifact-corrections--rev-1-to-rev-3).
- [ ] **UX-13 acceptance.** Complete the representative
      glasses-to-hat and patent-artifact corrections without changing unrelated
      content. Formal-sheet review-before-replace is implemented; complete the
      remaining [`REV-3A`](../design/north-star-ui/SURFACE-TRACKER.md#rev-3a--formal-drawing-review-before-replace)
      real-workflow acceptance, including Apply, Restore, Discard and filing-PDF
      checks, before closing this item. The surface tracker owns the current
      behavior and acceptance evidence.

### Gate 0 exit

- [ ] Every non-conditional Gate 0 item in §§0.1–0.6 is complete with dated
      evidence. §0.7 UX consistency is invite-confidence backlog and does
      not block Gate 0 exit.
- [ ] Backup P0 residual (`BETA_TODO` 4B deliberate-failure drill and 4C
      unattended restore) is complete, or explicitly waived with written
      operator risk acceptance.
- [ ] No P0/P1 incident, privacy, uncontrolled-spend, or filing-integrity
      defect remains open.
- [ ] The operator explicitly approves circulating invite links.

## Gate A: public front door

Detailed contracts and tests are in
[`PUBLIC_BETA_SCALE_PLAN.md`](PUBLIC_BETA_SCALE_PLAN.md#phase-a--public-front-door).

### A0 Decisions

- [ ] Choose the first public mode: `waitlist` or `open` with bot protection.
- [ ] Choose the CAPTCHA/bot-signal provider and privacy terms.
- [ ] Define waitlist retention, expiry, and invitation policy.

Operator-ready recommendation and activation controls:
[`Public beta registration decision`](decisions/PUBLIC_BETA_REGISTRATION.md).

### A1 Abuse-controlled registration

- [x] Implement database-backed `invite_only`, `waitlist`, and `open` modes;
      default production to `invite_only`.
- [x] Require verification before paid AI, export, collaboration, or filing.
- [x] Add bot protection, IP/email limits, case-insensitive deduplication, and
      bounded waitlist retention.
- [x] Pass backend and browser tests for all modes and production recovery copy.
      Evidence:
      [`Gate A1 abuse-controlled registration, 2026-07-25`](BETA_TODO.md#gate-a1-abuse-controlled-registration-2026-07-25).

### A2 Redis-backed distributed rate limits

- [x] Move auth, registration, waitlist, AI, upload, and write-path limits to
      Redis with a documented namespace and TTLs.
- [x] Prove two API workers share counters.
- [x] Fail closed on Redis outage for auth, AI, upload, and write paths.
- [x] Expose enough status to diagnose limits without exposing sensitive data.
      Evidence: [`Gate A2 distributed rate limits, 2026-07-24`](BETA_TODO.md#gate-a2-distributed-rate-limits-2026-07-24).

### A3 Expensive work is job-only

- [x] Commit the route matrix classifying expensive routes as `sync-allowed`,
      `job-only`, or removed.
- [x] Ensure Create, Research, Refine, Handoff, exports, and image generation do
      not hold API requests for multi-minute work.
- [x] Pass concurrency and negative-route tests without API-worker exhaustion.
      Evidence: [`Gate A3 expensive work is job-only, 2026-07-24`](BETA_TODO.md#gate-a3-expensive-work-is-job-only-2026-07-24).

### A4 Zero-optional-key first run

- [x] Prove a disposable funded user can complete the first run without BYOK
      at the current exact production SHA, then verify complete disposable
      account and associated-data deletion.
      [Evidence](archive/acceptance/GATE_A4_ACCEPTANCE_2026-07-27.md).
- [ ] Prove an unfunded BYOK-only user is blocked before spend with clear
      recovery actions at the same exact SHA, collect provider-side no-call
      evidence, and verify complete disposable-account deletion.
      The application-side block and cleanup passed; only the independent
      provider trace remains open.
- [x] Cover both journeys in browser and backend tests.
      Pre-acceptance evidence and remaining proof:
      [`Gate A4 zero-optional-key first-run pre-acceptance, 2026-07-24`](BETA_TODO.md#gate-a4-zero-optional-key-first-run-pre-acceptance-2026-07-24)
      and
      [`Gate A4 production acceptance, 2026-07-27`](archive/acceptance/GATE_A4_ACCEPTANCE_2026-07-27.md).

### A5 Vocabulary and comprehension

- [x] Enforce the canonical nouns across first-run, empty, error, and recovery
      states.
- [x] Pass the glossary/static guard and focused Playwright comprehension smoke.
      Evidence: [`Gate A5 vocabulary and comprehension, 2026-07-24`](BETA_TODO.md#gate-a5-vocabulary-and-comprehension-2026-07-24).

### Gate A exit

- [ ] Gate 0 and A1-A4 are accepted on one exact production SHA.
- [ ] Registration-mode rollback to `invite_only` is tested.
- [ ] The operator explicitly approves enabling waitlist/open registration.

## Gate B: paid self-serve beta

### B0 Decisions

- [x] Approve an ADR for the organisation/billing root and ownership migration.
      The accepted design adds a separate Organization billing and seat root,
      keeps canonical patent workspace ownership user-scoped, and assigns
      billing context at the Portfolio boundary:
      [`Organization billing and workspace ownership`](decisions/ORGANIZATION_BILLING_AND_OWNERSHIP.md).
- [x] Decide whether synchronous export routes are removed or retained as
      administrator-only break-glass operations.
      The accepted policy retains legacy synchronous filing renderers only for
      administrator recovery; normal users must use durable build jobs.

### B1 Cost preflight

- [x] Show estimated dollars, duration, and funding source before expensive
      work starts.
- [x] Keep the same recovery actions across exhausted wallet and quota states.
- [x] Pass funded, BYOK, and exhausted-state contract/browser tests.

Accepted on 25 July 2026:

- Implementation: [PR #1409](https://github.com/jxwalker/patent-studio/pull/1409),
  merged as `87b0bd7cdb31c3cb0e18c266d8a185134b79aa07`.
- Required gate:
  [CI run 30143704592](https://github.com/jxwalker/patent-studio/actions/runs/30143704592)
  passed on the exact merged SHA.
- Production smoke passed at `87b0bd7c`: Alembic `107 (head)`, backend,
  frontend, every dedicated worker lane, and the worker monitor healthy.
- Production Create review showed `$3.00`, `Personal API keys`, `About 1-2 min`,
  calls, and tokens before Start. White-paper review showed `$2.58`,
  `Personal API keys`, `About 15-30 min`, queue-wait disclosure, calls, tokens,
  and per-model cost before launch.
- Automated evidence covered funded platform allowance, personal-key funding,
  exhausted wallet, daily caps, stable recovery actions, durable white-paper
  preflight enforcement, and Jobs estimate rendering. No paid production job
  was launched for this acceptance.

### B2 Per-user AI access kill switch

- [x] Add audited pause/unpause controls that prevent enqueue and provider spend.
- [x] Prove worker refresh and recovery timing.

Accepted on 25 July 2026:
[implementation, CI, deploy, and production evidence](BETA_TODO.md#b2-per-user-ai-access-kill-switch-2026-07-25).

### B3 Organisation billing

- [ ] Add the approved organisation/workspace billing entity and migration.
- [ ] Attach Stripe subscriptions and entitlements to that entity.
- [ ] Prove two-user allowance sharing, seat revocation, cancellation, dunning,
      and tenant isolation.

Implementation, test, and production evidence is tracked in the
[Gate B3 organization billing acceptance worksheet](acceptance/GATE_B3_ORGANIZATION_BILLING_ACCEPTANCE.md).
The checklist remains open until the exact merged `main` SHA passes its
required gate, is deployed, and completes the dated production acceptance.

### B4 Durable artifact storage

- [ ] Move generated artifacts to production object storage with server-side
      encryption and signed tenant-scoped downloads.
- [ ] Pass CI round-trip, traversal, cross-tenant, backup, and restore tests.

The S3-compatible implementation and CI contracts shipped in
[PR #1415](https://github.com/jxwalker/patent-studio/pull/1415). Engineering
prep (production boot warning when backend is still local, Admin read-only
status/validate, worksheet) is tracked in
[`acceptance/GATE_B4_OBJECT_STORAGE_ACCEPTANCE.md`](acceptance/GATE_B4_OBJECT_STORAGE_ACCEPTANCE.md).
Production still uses local storage and has no object-store bucket or
credentials configured, so neither B4 item is accepted until operators complete
that worksheet on an exact production SHA.

### B5 Billing support

- [x] Make billing support links include only safe opaque account context.
- [x] Let administrators inspect subscription and entitlement state without
      requiring the Stripe dashboard for normal support.

Accepted 26 July 2026 on production SHA
`ff21e1fc526baffe281cc578a81a05217f21bc66`: [PR #1429](https://github.com/jxwalker/patent-studio/pull/1429)
added stored opaque support references, sanitized Stripe event history, and
administrator entitlement lookup; [PR #1430](https://github.com/jxwalker/patent-studio/pull/1430)
added the safe billing Support mail. Exact-main
[CI run 30179907796](https://github.com/jxwalker/patent-studio/actions/runs/30179907796)
passed, guarded deployment reached Alembic `110`, production smoke passed, and
live browser acceptance confirmed that the Support mail contains plan,
`PS-...` reference, and last-invoice state without `cus_` or `sub_` identifiers.

### Gate B exit

- [ ] Gate 0, Gate A, and B1-B5 are accepted on one exact production SHA.
- [ ] Subscription, entitlement, support, and rollback evidence is recorded.
- [ ] The operator explicitly approves paid self-serve availability.

## Gate C: advertised scale

### C0 Target

- [x] Set and record the initial advertised-scale acceptance target: 25
      concurrent Create preflight users, 10 concurrent generation-start users,
      and 20 authenticated read users targeting 20 aggregate requests per
      second for five minutes. The committed scenario, spend boundary, and
      abort rules are documented in
      [`operations/LOAD_GATE.md`](operations/LOAD_GATE.md).

### C1 Load gate

- [x] Commit a reproducible load scenario, thresholds, and abort rules.
- [ ] Execute it in a production-like environment and record one green run at
      the target.

Implementation and measured evidence are tracked in the
[Gate C1 load acceptance worksheet](acceptance/GATE_C1_LOAD_ACCEPTANCE.md).
The repository harness does not close C1 until its exact merged revision passes
the required gate and a protected, operator-approved run records a green
`result.json`.

### C2 Capacity model

- [ ] Document and test independent API and worker-family scaling.
- [ ] Set production concurrency/autoscale values from measured results.
- [ ] Prove deploy drain works for the resulting topology.

Repository pre-acceptance is tracked in
[`GATE_C2_CAPACITY_ACCEPTANCE.md`](acceptance/GATE_C2_CAPACITY_ACCEPTANCE.md).
It keeps all three items open until a green C1 result, validated production
profile, and live drain record exist on one exact deployed SHA.

### C3 Metrics and SLOs

- [ ] Publish queue, job-stall, API, provider, spend, and storage metrics.
- [ ] Define SLOs and alert thresholds; force one alert and recovery.
- [ ] Include SLO health in the weekly acceptance run.

Engineering and production acceptance are tracked in
[`GATE_C3_METRICS_SLO_ACCEPTANCE.md`](acceptance/GATE_C3_METRICS_SLO_ACCEPTANCE.md).
Keep these release boxes open until its exact-SHA evidence table records the
protected production scrape, operator notification/recovery, and weekly
baseline artifact.

### C4 Horizontal correctness

- [ ] Prove multiple API hosts share Redis limits.
- [ ] Prove cookie authentication works without sticky sessions.

Engineering pre-acceptance is tracked in
[`GATE_C4_HORIZONTAL_ACCEPTANCE.md`](acceptance/GATE_C4_HORIZONTAL_ACCEPTANCE.md).
The CI contract launches two independent Uvicorn processes and proves both
shared Redis enforcement and cross-process cookie authentication. Gate C4
remains open until the production-like proxy drill, failure/recovery evidence,
exact-SHA gate, and operator approval are recorded.

### Gate C exit

- [ ] C1-C4 pass at the advertised target with platform spend ceilings active.
- [ ] Capacity, alert, incident, and rollback runbooks are current.
- [ ] The operator approves the advertised concurrency claim.

## Gate D: post-launch hardening

### D1 Module boundaries

- [ ] Split high-risk backend and frontend god modules in bounded,
      behavior-preserving PRs.

Incremental evidence recorded 29 July 2026 on production SHA
`6dcb98e5c32942450236dcdc7613a7c9ee4b5df3`: ten bounded extraction PRs
reduced the white-paper, export, generation, and frontend API modules while
preserving OpenAPI, tenant, route, and exported-symbol contracts. Exact-main
[CI run 30432272525](https://github.com/jxwalker/patent-studio/actions/runs/30432272525)
and guarded production smoke passed. Gate D1 remains open; this dated record
does not describe all subsequent model extractions. The model-registration
slice and its release evidence are tracked in
[`GATE_D1_MODEL_REGISTRATION.md`](acceptance/GATE_D1_MODEL_REGISTRATION.md).
See
[`GATE_D1_INCREMENTAL_EVIDENCE_2026-07-29.md`](archive/acceptance/GATE_D1_INCREMENTAL_EVIDENCE_2026-07-29.md).

### D2 Frontend critical-path unit tests

- [x] Add required frontend unit tests for money, authentication, and
      administrator save/test behavior.

Accepted 26 July 2026 on production SHA
`ad3b4dfbe9dd85940c13f7bb3fafa0df6eb95dfb`:
[PR #1432](https://github.com/jxwalker/patent-studio/pull/1432) added the
required Vitest gate and 34 unit tests covering money and funding display,
authentication session transitions, and administrator Stripe save/test
behavior. Exact-main
[CI run 30182121079](https://github.com/jxwalker/patent-studio/actions/runs/30182121079)
passed, including the frontend unit, typecheck, lint, build, and browser E2E
steps. Guarded deployment reached Alembic `110`; production smoke confirmed
the exact SHA and healthy backend, frontend, database, Redis, and all ten
worker services.

### D3 Glossary enforcement

- [x] Complete glossary enforcement across remaining tracked surfaces.

Accepted 28 July 2026 on production SHA
`afe1198b735437d6e5b9417fb079186fa31f2e0c`: the required glossary guard,
frontend typecheck/lint/build/E2E, a signed-in production route check,
exact-main CI, serialized deployment, and production smoke passed.
See
[`GATE_D3_GLOSSARY_ACCEPTANCE_2026-07-28.md`](archive/acceptance/GATE_D3_GLOSSARY_ACCEPTANCE_2026-07-28.md).

### D4 Microsoft/DXC SSO

- [ ] Complete Microsoft/DXC SSO acceptance before offering it to a DXC cohort
      if it was not required under Gate 0.

## Release-candidate sign-off

Complete this block for every release-level change:

- [ ] Candidate exact `main` SHA:
- [ ] `CI Required Gate` URL:
- [ ] Production exact SHA:
- [ ] Alembic head:
- [ ] Service and worker health evidence:
- [ ] Acceptance evidence links:
- [ ] Known residual risks:
- [ ] Rollback point and operator:
- [ ] Release level approved: private invite / public / paid / scale

## Next execution order

Refresh date: 2026-08-05. Active release milestone remains **Gate 0**.

1. **Freeze one candidate and reopen Gate 0 evidence (blocking):** deploy or
   select a green `main` revision, collect a private exact-release packet with
   [`scripts/collect_gate0_release_evidence.sh`](../scripts/collect_gate0_release_evidence.sh),
   and freeze production for the 0.3–0.6 window. Follow
   [`GATE0_OPERATOR_UNBLOCK.md`](acceptance/GATE0_OPERATOR_UNBLOCK.md). Keep
   `invite_only` and `ai_registry_mode=byok`.
2. **Close Gate 0.3–0.6 on that frozen SHA (blocking):**
   [`GATE0_3`](acceptance/GATE0_3_OBSERVABILITY_ACCEPTANCE.md),
   [`GATE0_4`](acceptance/GATE0_4_OUTLOOK_ACCEPTANCE.md),
   [`GATE0_5`](acceptance/GATE0_5_STRIPE_ACCEPTANCE.md),
   [`GATE0_6`](acceptance/GATE0_6_JOURNEY_NOTEBOOKLM_ACCEPTANCE.md). Include the
   A4 provider no-call trace and NotebookLM A6.4–5 / A7–A8 in the same window
   when possible.
3. **Close backup P0 residual before invites (blocking):** `BETA_TODO` 4B
   deliberate failure drill (scratch destination opens `[backup]` issue) and
   4C unattended off-host restore drill. Green-path Backup Health is already
   reporting; do not treat that alone as 4B/4C closure.
4. **Written Gate 0 approval**, then circulate private invites. Refresh
   [`PUBLIC_BETA_STATUS.md`](PUBLIC_BETA_STATUS.md) the same day.
5. **Invite-confidence, non-blocking:** complete UX-12/UX-13 real-workflow
   acceptance, including the implemented REV-3A formal-drawing
   review-before-replace flow. Promote any filing-integrity failure into the
   Gate 0 blocker row.
6. **Public front door (Gate A):** approve A0 waitlist/Turnstile/retention
   decisions; finish A4 provider-trace residual if not closed under 0.6; prove
   rollback to `invite_only`; operator approval to enable waitlist.
7. **Paid self-serve (Gate B):** B1/B2/B5 and B3/B4 engineering are already
   shipped. Remaining work is B3 production acceptance and B4 production
   object-storage cutover + acceptance on one exact SHA.
8. **Advertised scale (Gate C):** C0–C4 engineering is merged. Remaining work
   is one green C1 run, C2 values from that result plus live drain, C3 scrape /
   forced alert / weekly baseline, and C4 two-host proxy drill, then operator
   approval of the advertised concurrency claim.
9. **Post-launch (Gate D):** continue D1 module splits; D4 Microsoft/DXC SSO
   only if a DXC cohort is offered.
