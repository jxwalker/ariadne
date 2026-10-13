# Public beta detailed evidence ledger

Canonical current status and release decisions are tracked in
[`docs/PUBLIC_BETA_CHECKLIST.md`](PUBLIC_BETA_CHECKLIST.md). This file retains
the detailed findings, implementation history, production acceptance evidence,
and unresolved evidence requirements. Do not infer current release status from
the historical baseline paragraphs below.

Resolve the current release from the private exact-SHA packet and the newest
`runtime` row in `design/north-star-ui/RELEASE_LEDGER.csv`. The canonical
go/no-go decision remains in
[`PUBLIC_BETA_CHECKLIST.md`](PUBLIC_BETA_CHECKLIST.md). This file is a detailed
evidence ledger and backlog, not a second release authority.

Historical baseline (retain for evidence traceability):

Historical deployed runtime release (2026-07-25): PR #1421 in main revision `3cb6987e`,
production-accepted at the same revision with Alembic `109`. The latest
north-star visual baseline at that time was PR #1350 at `caebb33f` in
`design/north-star-ui/RELEASE_LEDGER.csv`. Canonical access, versioned
NotebookLM evidence, active-owner invariants, the clarified five-stage journey,
in-place Research and Claim Review findings, administrator-managed Microsoft
Entra sign-in, and the W5 visual-craft and plain-language guardrails are
released. Redis-backed distributed request limits and Gate A1 abuse-controlled
registration are also accepted. A1-A5,
A9, and A10 are historical work-item labels rather than the canonical gate
status. Under the canonical checklist, Gate A1-A3 and A5 are accepted; A4 remains
open only for the independent provider no-call trace. The funded and
unfunded Gate A4 application paths passed at one exact production revision on
2026-07-27. NotebookLM A6 steps 1-3 are accepted, while A6 steps 4-5 and
A7-A8 remain open. Filing-handoff and targeted-correction engineering from
PR #1648 is released; real-workflow acceptance and REV-3A remain in the
surface tracker. Production has zero active ownerless
portfolios, projects, or patents, and the stricter ownership release-gate audit
is green.

A 2026-07-26 full-system audit recorded production tip `328d1644` and added UX-1…UX-11 plus OPS cross-links below; canonical status remains [`PUBLIC_BETA_CHECKLIST.md`](PUBLIC_BETA_CHECKLIST.md).

Private Sentry and dead-man monitoring, Stripe live-mode acceptance, cold
Outlook delivery evidence, and live DXC Conditional Access evidence remain open
under their named items below. Invite-beta allowance acceptance is complete.
Product surfaces for Create funding explanation, first-run coach, Support topic deep
links, durable File-stage export jobs, and written free/beta entitlements ship
in the beta-readiness product-gates release; see
`docs/operations/FREE_TIER_AND_BETA_FUNDING.md`.

Requirements and acceptance contracts for large-scale public beta
(open/waitlist signup, organization billing, Redis rate limits, sync-path
removal, object storage, and load/SLO gates) live in
[`docs/PUBLIC_BETA_SCALE_PLAN.md`](PUBLIC_BETA_SCALE_PLAN.md). Engineering and
operator status remain in the canonical checklist; that requirements document
does not replace the acceptance items below.

Date: 2026-08-05 · Historical sources are retained under `docs/archive/` and
`.planning/archive/`; current status is always taken from
`PUBLIC_BETA_CHECKLIST.md`. The dated operator snapshot and prioritized
public-beta todo live in [`PUBLIC_BETA_STATUS.md`](PUBLIC_BETA_STATUS.md).

## Historical release truth, 2026-07-25

PR [#1421](https://github.com/jxwalker/patent-studio/pull/1421) merged as
`3cb6987ef6895a716da463b1945e305cc3573acb`. Exact-main
[CI run 30170071954](https://github.com/jxwalker/patent-studio/actions/runs/30170071954)
passed `CI Required Gate`, and the serialized deploy advanced production to
the same SHA at Alembic `109`. Production health and the subsequent scheduled
uptime checks are green.

The controlled Stripe sandbox acceptance used a disposable account. Test-mode
checkout completed, webhook deliveries returned HTTP 200, the subscription
became `pro` and `active`, the included allowance was granted, portal and
cancellation paths completed, the account returned to the free/cancelled
state, and the disposable account was closed. PR #1421 fixed the current
Stripe API subscription-item billing-period shape exposed by that run. This
does not close Gate 0 billing: the production live-mode profile,
failed-payment/dunning, and the complete live plan-gate acceptance remain
open.

PR [#1415](https://github.com/jxwalker/patent-studio/pull/1415) shipped the
S3-compatible artifact-storage implementation as
`51db52d518b31f6183031461a05b66931a59ecfd`; its required
[CI gate](https://github.com/jxwalker/patent-studio/actions/runs/30154803170)
passed storage round-trip, traversal, tenant-bound signed-download, migration,
backup, restore, and schema contracts. A read-only production audit on
25 July found `ARTIFACT_STORAGE_BACKEND=local` with no bucket, endpoint, or
credentials configured. Gate B4 eng-prep (boot warning, Admin status/validate,
[`GATE_B4_OBJECT_STORAGE_ACCEPTANCE.md`](acceptance/GATE_B4_OBJECT_STORAGE_ACCEPTANCE.md))
has landed; cutover remains OPEN for operator-provided object storage, dry-run
and applied legacy migration, backup verification, and exact-SHA production
acceptance.

## Gate 0 release candidate snapshot, 2026-07-24

PR #1387 merged into `ec05e7f11df21d44eed01abbe349bb8fb49f15d1`.
[Exact-main CI run 30092129837](https://github.com/jxwalker/patent-studio/actions/runs/30092129837)
passed `CI Required Gate`, including the full Postgres suite, schema and
administrator gates, real backend browser contract, frontend typecheck, lint,
production build, and browser smoke. The serialized worker-draining deploy put
the same SHA in production. Alembic reports `105 (head)`, all 14 configured
Compose services are running, `/health` reports healthy application and
database state, and all nine Celery worker lanes returned `pong`.

The previous production SHA `50e8365ea52bc04ce1593363480379de6f271375`
was the rollback point for that candidate. Current releases use the UAT-first
promotion path in `docs/operations/UAT_RELEASES.md`; direct production Compose
or Git commands are not accepted.

## Gate 0 exact-candidate preflight, 2026-07-28

The serialized worker-draining deploy advanced production to exact `main`
revision `7b541e5303e2de1d778cc10a3e3e3157788a5d58`. Exact-main
[CI run 30348671632](https://github.com/jxwalker/patent-studio/actions/runs/30348671632)
passed `CI Required Gate`. The private release collector verified the same
production and CI revision, Alembic `115 (head)`, all 14 Compose services, all
10 worker services (nine Celery lanes plus the monitor), invite-only
registration, healthy database and Redis rate limiting, and a passing
production smoke. The private JSON packet SHA-256 is
`d7bf482ef37784f1e4e397e29c2a45bb9e3678f83fea9cc27a82e92429344191`;
the packet itself remains outside Git.

The non-secret Gate 0.3-0.6 preflight found:

- Observability is unconfigured in both the database/environment profile and
  the frontend build; no Sentry DSN or dead-man heartbeat is present.
- The database SMTP profile is configured, enabled, password-backed, and
  previously tested successfully. SPF, DKIM, DMARC, and DreamHost MX records
  resolve, while the cold Outlook matrix remains open.
- The stored Stripe profile remains safely disabled and test-mode, with
  checkout unavailable. Live-mode dunning acceptance remains open.
- The NotebookLM CLI is available and the owner's encrypted profile currently
  authenticates and can refresh. A6.4-5, A7-A8, and the exact-SHA funded
  lifecycle journey remain open.

This preflight does not close any Gate 0.3-0.6 checkbox and does not authorize
invite circulation.

### Gate 0.3 follow-up on the same day (supersedes observability bullets above)

Later on 2026-07-28, production advanced through browser-DSN deploy and
observability configuration. Accepted drill packet:
`.acceptance/gate0-release/20260728T125148Z` at SHA
`06772900c662186f58435c1b81a6d4c10904afb7`. Admin observability is
`enabled=true`, `source=database` (backend/worker DSN and Healthchecks
heartbeat configured; secrets not recorded here). Forced-event (§6),
paused-lane (§7), and dead-man silence (§3a) drills passed on that SHA.
§3a silence drill ran under an interim period 2 / grace 10 (**12-minute**)
window; Healthchecks grace was later tightened to **3 minutes** the same day,
so the observed configuration then had period + grace = **5 minutes**.
Operator privacy scrub of §6 event IDs and resolve of §7 artwork
`missing_consumer` issues confirmed 2026-07-28. Later production advances
invalidated this packet before sign-off, so the complete living worksheet must
be rerun on the next frozen candidate. Historical detail:
[`archive/acceptance/GATE0_3_OBSERVABILITY_ACCEPTANCE_INVALIDATED_2026-08-05.md`](archive/acceptance/GATE0_3_OBSERVABILITY_ACCEPTANCE_INVALIDATED_2026-08-05.md)
and item **5** below.

## Gate A1 abuse-controlled registration, 2026-07-25

PR [#1404](https://github.com/jxwalker/patent-studio/pull/1404) adds
database-backed `invite_only`, `waitlist`, and `open` registration modes,
administrator controls under **Admin > Authentication > Registration**,
Turnstile or hCaptcha bot verification, disposable-domain policy, Redis-backed
IP and email limits, case-insensitive waitlist deduplication, bounded retention,
and mode-specific public registration copy. Public accounts remain unverified
and receive no implicit beta grant; the existing verification policy continues
to gate paid AI, export, collaboration, filing, and destructive work. Invite
consumption is row-locked, and a concurrent PostgreSQL contract proves one
untargeted invitation can create exactly one account.

CodeRabbit approved the final security review. PR CI
[run 30135209028](https://github.com/jxwalker/patent-studio/actions/runs/30135209028)
and exact-main
[run 30135880054](https://github.com/jxwalker/patent-studio/actions/runs/30135880054)
passed the full backend suite, Postgres schema and distributed-rate-limit
contracts, real browser account lifecycle, frontend typecheck, lint,
production build, and browser smoke. The serialized worker-draining deploy
advanced production to exact revision
`75df9a1443ba0017bfe43682555e724e9686a6c7`. Production reports Alembic
`106 (head)`, healthy application, database, and Redis limiter state, and all
nine Celery workers responding. `/api/auth/registration-status` reports
`mode=invite_only` and `public_mode_ready=true`; the public `/register` route
shows invitation-required recovery, a beta-access contact action, and sign-in,
product, security, and data-handling links. Production remains invite-only.
The immediate rollback point is
`d9f7c37aaab5a633bfe26e86078af34ed33c767a`.

The A0 choices for the first public mode, bot provider/privacy terms, and
waitlist retention and invitation policy remain operator decisions. This
implementation acceptance does not authorize enabling waitlist or open
registration.

## Gate A2 distributed rate limits, 2026-07-24

PR [#1390](https://github.com/jxwalker/patent-studio/pull/1390) moved the
general, AI, authentication, registration, waitlist, generation, upload, and
other write-path request limits from per-process memory to atomic Redis sliding
windows. The deployment uses the dedicated
`patent-studio:rate-limit:v1` namespace, HMAC-digested caller identifiers, and
documented 61-second and 3,601-second key lifetimes. Redis topology remains
bootstrap configuration; administrators manage only the enabled state and
numeric allowances.

The required exact-main
[CI run 30097224250](https://github.com/jxwalker/patent-studio/actions/runs/30097224250)
passed the full backend, Postgres schema, frontend build and browser, and real
backend browser gates. Its distributed-rate-limit lane launched two independent
Uvicorn processes against one disposable Redis instance, consumed the login
allowance through the first process, and observed the shared 429 through the
second. Focused contracts also prove atomic all-or-none windows and TTLs,
hashed caller keys, write fail-closed before route execution, read-only
fail-open, and non-secret health and response diagnostics.

The serialized worker-draining deploy advanced production to exact revision
`f6f096b1090b3de955af9d95130395c3d535ec0b`. Production reported Alembic
`105 (head)`, all 14 Compose services running, and all nine Celery lanes
responding to ping. Public `/health` reported the Redis limiter enabled and
healthy. A harmless malformed-login request returned HTTP 422 after applying
the `auth_login,general` scopes and exposed only
`X-RateLimit-Backend: redis`, `X-RateLimit-Status: applied`, and
`X-RateLimit-Scope`; no production allowance was deliberately exhausted.
Recent backend logs contained no limiter errors, exceptions, or tracebacks.
The operating contract and verification commands are in
[`docs/operations/RATE_LIMITING.md`](operations/RATE_LIMITING.md).

## Gate A3 expensive work is job-only, 2026-07-24

PR [#1392](https://github.com/jxwalker/patent-studio/pull/1392) added a
machine-readable route matrix for expensive API work and generated
[`docs/operations/EXPENSIVE_ROUTE_POLICY.md`](operations/EXPENSIVE_ROUTE_POLICY.md)
from it. Create, Research, Refine, drawings, filing/export, deliverable,
Repository Mining, and prototype-build routes are explicitly classified as
`job-only`, `sync-allowed`, or removed. Normal users cannot call retained
legacy synchronous generation and export routes; the structured rejection
names the durable replacement, while administrator-only break-glass paths
remain available for recovery.

Intentional synchronous work has a 20-60 second server-work budget. Document,
white-paper, drawing, research-paper, and adjacent-artifact renderers use a
dedicated four-worker capacity-bounded pool rather than the API event-loop or
unbounded shared executor. A cancelled request retains its capacity slot until
the underlying thread exits, and saturation returns a retryable 503 instead of
accumulating abandoned work. The policy generator fails closed on duplicate
routes, invalid budgets, and malformed removed-route metadata. Citation import
count and field sizes are bounded.

Automated acceptance includes an AST drift guard for direct and dispatched
expensive calls, route-existence and break-glass checks, real deadline and
downstream-timeout behavior, bounded-pool cancellation, ordinary-user
review-route rejection, and a ten-request filing-export concurrency test that
created ten durable jobs without invoking the package renderer. The focused
final review packet passed 31 tests. PR
[CI run 30105926555](https://github.com/jxwalker/patent-studio/actions/runs/30105926555)
and exact-main
[CI run 30107121996](https://github.com/jxwalker/patent-studio/actions/runs/30107121996)
both passed `CI Required Gate`, including the full backend suite, Postgres
schema and integration gates, frontend typecheck/lint/build/browser smoke,
static guards, and real backend browser contract. CodeRabbit approved the
review after its actionable findings were addressed.

The serialized worker-draining deploy advanced production to exact revision
`f722d6a26702fbedfacb611f8a36ca9ceca71a11`. The first guarded attempt safely
restored every worker after detecting that the migrated host had lost its
repository-specific SSH command binding; the existing read-only deploy key was
rebound and verified before retrying. Production smoke then passed at
`f722d6a2`: Alembic `105 (head)`, all 14 Compose services running with
`unless-stopped`, two production API workers, no source bind mount, and valid
proxy/security-header configuration. Public `/health` reported healthy
application, database, and Redis limiter state, and all nine Celery worker
lanes returned `pong`. The previous production revision `f6f096b1` is the
rollback point for this release.

## Gate A4 zero-optional-key first-run pre-acceptance, 2026-07-24

PR [#1396](https://github.com/jxwalker/patent-studio/pull/1396) corrected the
managed-platform first-run preflight so it can price the complete workload
before applying aggregate wallet limits, classifies an unaffordable workload
as `insufficient_credits`, returns direct personal-key and included-credit
recovery paths, and persists no generation run or background job when funding
is insufficient. Focused backend coverage proves funded and unfunded managed
key resolution, HTTP error shape, recovery actions, and the no-persistence
contract. Browser coverage proves the blocked first-run explanation, both
recovery links, disabled launch control, and absence of a create request.

PR CI and exact-main
[CI run 30116552337](https://github.com/jxwalker/patent-studio/actions/runs/30116552337)
passed `CI Required Gate`, including the full backend and Postgres suites,
schema and tenant gates, frontend typecheck, lint, production build and browser
smoke, static guards, and the real backend browser contract. The serialized
worker-draining deploy advanced production to exact revision
`05b5de969b67718984f1ee91e91f554e6ece7481`; `/health`, Alembic `105 (head)`,
all 14 Compose services, and all configured worker lanes were healthy.

Controlled production pre-acceptance then used two fresh targeted-invite
accounts and restored the original runtime settings after both paths. The
funded user had no personal API keys, received the configured initial
allowance, and started a guided one-candidate first run using the platform
credential. It reached `awaiting_review`, produced one candidate, recorded one
platform-billed AI call with 516 input and 311 output tokens, and debited
`$0.031065`, below the approved `$5` cap. The run was deleted and the account
was deactivated through application APIs. Complete account and associated-data
deletion was not verified, so this run is not final disposable-account
acceptance evidence.

The unfunded user had a zero wallet and no personal keys. Preflight returned
`can_run=false`, `billing_source=platform`, and `limiting_cap=wallet`, with
recovery links to `/settings/ai` and `/support?topic=credits`. Launch returned
HTTP 402 with `code=insufficient_credits`. Read-only database counts remained
zero before and after for generation runs, background jobs, AI audit rows, and
user API keys. This proves that the rejected request created no durable local
work; no provider-side usage record or verifiable no-call trace was collected,
so it does not independently prove zero external-provider spend. The account
was deactivated through the administrator API, but complete account deletion
was not verified.

PR [#1397](https://github.com/jxwalker/patent-studio/pull/1397) then removed
the obsolete Bash-only NotebookLM operator command from user-facing API and UI
surfaces. Disconnected users now receive one direct self-service connection
route, the live-URL fallback remains hidden until authenticated, and a failed
live source can be removed without losing selected Evidence. Create renders one
source failure, labels funding as unresolved until sources are valid, and
offers both **Connect NotebookLM** and **Continue without notebook** recovery.
Focused backend and browser coverage, TypeScript, lint, production build, full
backend and Postgres suites, schema and tenant gates, the real backend browser
contract, CodeRabbit's no-findings review, PR CI, and exact-main
[CI run 30119255638](https://github.com/jxwalker/patent-studio/actions/runs/30119255638)
passed. The serialized deploy advanced production to
`e2142b76b74afb2212fe45f3b1a93fe13afa0724`; internal and public health were
green, Alembic remained `105 (head)`, and all nine worker lanes responded.
Authenticated API acceptance for the reported disconnected user returned
`connect_command=null`, `connect_self_serve=true`, and the Settings or Evidence
recovery guidance.

At that point, Gate A4 remained open because the two production journeys above ran at
`05b5de969b67718984f1ee91e91f554e6ece7481`, not the current exact production
revision `75df9a1443ba0017bfe43682555e724e9686a6c7`. Final acceptance must rerun
both paths at one current exact SHA, collect a provider-side no-call trace for
the rejected path, and verify deletion of each disposable account and its
associated data with before-and-after evidence. The 2026-07-27 record below
supersedes that application-path gap.

## Gate A4 exact-SHA application acceptance, 2026-07-27

The guarded production harness repeated both zero-optional-key journeys at
exact production revision
`f0c2fa1b8360e6ff2212f014213aa1a003f5d709`, whose post-merge
[CI run 30233199394](https://github.com/jxwalker/patent-studio/actions/runs/30233199394)
passed. Production smoke, Alembic `110 (head)`, and all ten worker services
were healthy.

The funded disposable account produced one candidate through one platform
call, using 540 input and 263 output tokens at an estimated `$0.027825`, below
the guarded `$5` ceiling. The unfunded BYOK-only account was rejected with HTTP
402, `can_run=false`, `billing_source=platform`, and `limiting_cap=wallet`; its
durable run delta, job delta, and application-recorded provider-call count were
all zero. Cleanup recorded nine successful results and zero failures, removed
the dedicated acceptance administrator, and deleted its local credential file.

The private application and cleanup evidence hashes are recorded in
[`GATE_A4_ACCEPTANCE_2026-07-27.md`](archive/acceptance/GATE_A4_ACCEPTANCE_2026-07-27.md).
Gate A4 remains open only for an independent Anthropic provider usage report
covering the rejected request window. Production must not advance before that
trace and the remaining Gate 0 drills are collected, or the acceptance window
must be rerun.

## Gate A5 vocabulary and comprehension, 2026-07-24

PR [#1400](https://github.com/jxwalker/patent-studio/pull/1400) applies the
canonical glossary at the remaining first-run boundaries. Create names the
post-research output **Candidates**; idea-generation jobs use the **Ideas**
domain label; patent-scoped empty states say **Evidence** rather than reusable
**Sources**; and the Idea Library starts with direct idea capture while
repository review and idea combination remain secondary discovery paths. A
required product-language guard checks those glossary consumers and rejects
ambiguous dual-use noun combinations. Focused Playwright coverage exercises
all three named acceptance boundaries.

Authenticated production acceptance found one residual mismatch after that
release: the direct Idea Library composer still said **Add candidates**.
PR [#1401](https://github.com/jxwalker/patent-studio/pull/1401) changed that
surface to glossary-backed **Add ideas**, added the exact direct-capture
guidance to the language guard, and extended the Idea Library browser journey
to reject the old heading. CodeRabbit approved the three-file repair with no
actionable comments. PR CI
[run 30125574715](https://github.com/jxwalker/patent-studio/actions/runs/30125574715)
and exact-main
[run 30126852763](https://github.com/jxwalker/patent-studio/actions/runs/30126852763)
passed the complete backend, Postgres schema, real browser contract, frontend
typecheck, lint, production build, product-language guard, and browser smoke
packet.

The serialized worker-draining deploy advanced production to exact revision
`d9f7c37aaab5a633bfe26e86078af34ed33c767a`. Public health reported healthy
application, database, and Redis limiter state; Alembic remained `105 (head)`;
and all nine Celery workers responded on their intended queues. Authenticated
read-only acceptance then confirmed the Idea Library rendered **Add ideas**,
the direct idea guidance, and the no-ideas recovery state. Create rendered
**Your idea → Research → Candidates**, and the patent source workspace kept
**Sources** and patent-scoped **Evidence** distinct. The Idea Library had no
horizontal overflow at the default desktop viewport or 390 by 844 pixels, and
the browser reported no warnings or errors. Gate A5 is accepted.

## B2 per-user AI access kill switch, 2026-07-25

PR [#1411](https://github.com/jxwalker/patent-studio/pull/1411) adds an
administrator-controlled, per-user AI pause without disabling login or access
to existing work. Migration `108` persists pause state, actor, timestamp, and
reason. Admin Users can pause or resume access, Settings shows the current
state, and the API returns a stable `ai_access_paused` 403 contract. New
generation, PRD, pitch, drawing, and provider-key test work is rejected before
enqueue. Provider retry loops refresh the user state before each attempt,
including structured repair, white-paper, artwork review, patent review,
research, and deliverable paths. Durable jobs classify this state separately
from quota, provider, and general failures.

The complete automated packet covered the admin and user contracts, audit
reason redaction, paused preflight, no-run and no-job enqueue rejection,
existing reader access, all application retry boundaries, SDK retry disabling,
durable job classification, tenant-matrix freshness, Admin Users, Settings
Plan, and Create browser states. The exact merged main revision was
`590072cf279dc555c10a82548944f15daae848fc`; exact-main
[CI run 30148535414](https://github.com/jxwalker/patent-studio/actions/runs/30148535414)
passed the backend static, schema, full Postgres, real browser contract,
frontend build and browser, and required-gate jobs.

The serialized deploy verified that exact green SHA, drained and restarted
every Celery lane, advanced production to `590072cf`, and applied Alembic
`108 (head)`. The backend, frontend, worker monitor, and ten worker services
were running after deployment.

The production acceptance drill used a disposable administrator account and
started no provider call. While the account was paused, login, the owned patent
reader, and a filing DOCX download all returned successfully. Create preflight
returned `can_run=false` and `daily_quota_status.can_start=false`; direct
generation enqueue returned 403 with code `ai_access_paused`; generation-run
and background-job counts did not change. Resume was visible on the next user
and preflight refresh. Two audit rows recorded the administrator actor, user
subject, state transition, and non-secret reason. The disposable account and
its seeded sample were then closed through the account API and its credentials
were rejected.

Ranking rule: irreversible harm > uncontrolled cost > legal exposure > reliability > conversion > polish.
Each item lists acceptance evidence in the style of the north-star gates. Sizes: XS <½d · S ½–1d · M 2–4d · L ~1wk.
Historical deployed runtime baseline (2026-07-25): PR #1411, `Per-user AI access kill switch`,
merged and deployed in main revision `590072cf`. It includes PR #1409's B1
cost preflight, PR #1404's public registration foundation, PR #1401's Idea
Library vocabulary boundary, and PR #1400's product-language boundary pass.
PR #1397's NotebookLM connection recovery is included with PR #1390's
Redis-backed rate limits, PR #1387's browser observability acceptance control,
PR #1385's truthful email-failure copy, PR #1383's platform AI spend ceiling,
the historical north-star visual baseline from PR #1350, and the clarified five-stage
journey. Production reports Alembic `108`, a healthy backend, database, and
Redis rate limiter, nine responsive Celery worker lanes, and the worker
monitor.
North-star visual release lineage is recorded in
`design/north-star-ui/RELEASE_LEDGER.csv`.

The 2026-07-10 adversarial review is the detailed finding record. This file is
the detailed evidence ledger. A finding is complete only after
its named tests, CI gate, production deploy, and runtime/operator evidence pass.

## P0 — Public signup stays off until every P0 gate is done

- [x] **1. Cross-tenant access audit + negative e2e** (L; released in PR #1134 at `9f320305`)
  Build a router×endpoint×scope-check matrix for all ~35 routers (artifacts, documents, export, jobs, drawings, sources, generation, deliverables, comments, revisions, SSE streams). Fix gaps.
  Evidence: matrix committed; new `e2e/tenant-isolation.spec.ts` — two users, asserts 403/404 for every object type read/write/download/stream across accounts; added to the live gate.
  Release follow-up: Tenant Isolation Matrix in PR #1003 at `85fbbcad` adds a generated `docs/security/tenant_access_matrix.csv`, a review guide, and a freshness test so route drift fails until every new API endpoint receives an explicit tenant-isolation classification.
  Release follow-up: Route-family coverage PRs #1004, #1005, #1007, #1008, #1009, #1010, #1011, #1012, #1013, #1014, #1016, #1017, #1018, #1019, #1021, #1022, #1024, #1025, #1027, #1028, #1030, #1031, #1032, #1033, #1034, and #1035 added negative tests across download, artifact, white-paper, prior-art, project-export, final-download, claims, specification, claim-analysis, revision, portfolio, hierarchy, prior-art reference, source, NotebookLM, generation, drawing, job, project, research, review-session, idea, comment, and contributor routes.
  Release evidence: the refreshed inventory contains 315 routes, with 303 `covered` and 12 explicitly `not-tenant-scoped`; zero rows remain blank or `needs-test`. The final tranche added two-user isolation tests for counsel, deliverables, drawing generation, prior-art report, and generation draft-recovery routes; it also removed global PII enumeration from `/api/users/search`. The matrix-derived 84-test tenant gate, backend/static/frontend CI, safe worker-draining deploy, all worker lanes, Alembic head, and public production smoke passed at `9f320305`.

- [x] **2. AI spend enforcement on by default** (M; accepted at production baseline `b734395d`)
  Enforced free-tier defaults for `DAILY_AI_QUOTA`, `DAILY_AI_TOKEN_QUOTA`, `DAILY_AI_SPEND_LIMIT_USD`; confirm every registered AI workload consumes a quota reservation before provider spend; quota-exhausted state becomes a designed UI surface, not a raw 429. BYOK calls are quota-accounted but do not deduct platform credits.
  Evidence: prod env values documented; backend test per AI path proving quota reservation + block; one north-star slice for the exhausted state.
  Branch follow-up: AI Quota Exhausted Estimate Notice makes blocked workload estimates render a shared warning `Notice` with explicit daily quota title and next step copy in claim estimate workbenches, instead of burying quota exhaustion as generic budget-warning text.
  Branch follow-up: Default AI Spend Limits changes the app defaults from unlimited to 25 calls, 250k tokens, and $5 estimated spend per user per UTC day, documents production verification, and adds a default-enforcement regression test. The remaining acceptance work is the per-module debit/block audit across every AI workload.
  Branch follow-up: AI Workload Estimate Coverage adds pre-flight estimates for every registered AI function and tests that every registered workload blocks under an exhausted spend cap. The remaining acceptance work is the production call-path debit audit proving every AI provider call records credit usage.
  Branch follow-up: Review Loop Usage Audit makes `patent_review` and `patent_revise` provider calls write `AIGenerationLog` rows with user attribution and token counts, including failure rows, so iterative review spend is visible to quota/spend accounting. The remaining acceptance work is the same provider-call debit audit across the rest of the registered AI workloads.
  Branch follow-up: AI Usage Audit Coverage adds a registry-wide audit-owner guardrail proving all 25 registered AI functions have a production `AIGenerationLog` owner, plus an image-call debit regression proving zero-token `gpt-image-2` artwork rows still produce priced credit estimates. The remaining acceptance work is live/path-level debit proof for tenant-isolated production scenarios.
  Review reconciliation: choose and enforce the public-beta funding model (BYOK or deliberately managed keys), route Google search through the registry/accounting path, set a nonzero generation-run cap, and re-check quota/spend before every provider call inside iterative review, generation, white-paper, and drawing loops.
  Release evidence: PR #1139 at `08f02364` serializes each user's provider calls across workers, re-checks daily quota and commits a quota-counted audit reservation immediately before every registered product provider call, holds the lease until that reservation is finalized, defaults generation runs to a nonzero spend cap, accounts for administrator-only host-funded Google searches, and gives generation, review, white-paper, artwork, and research jobs explicit quota-exhausted outcomes. A failed audit finalization leaves the reservation counted rather than reopening provider spend. Shared HTTP handlers normalize missing-key, quota, credit, and capability failures. Required CI and bot review passed; the worker-draining deploy restarted all seven Celery lanes; Alembic head and public smoke passed. Production reports `AI_REGISTRY_MODE=enforce`, `BYOK_ENFORCED=true`, both administrator exemptions disabled, the existing `$6.50` generation-run cap preserved, and a 900-second bounded lease wait across backend and every worker. Live production audit rows after release prove tenant-attributed BYOK reservations finalized with actual Claude models and input/output tokens across claim risk, claim expansion, and patent revision calls. A no-mutation operator probe against the same 42-call live usage set a one-off 42-call cap, returned `can_start=false`, raised `AIQuotaExceeded` before provider spend, and left the user's audit-row count unchanged at 1,897. BYOK calls consume the quota reservation rather than platform credits by design.

- [x] **3. Production secrets, runtime & edge hardening** (M; accepted through PR #1142 at `4a6153d1`)
  App refuses to boot in prod with default `JWT_SECRET`; cookie flags (Secure/SameSite) and CORS verified for the public domain; login rate limit confirmed; `repo_ingestion.py` constrained (scheme/host allowlist, clone size cap, isolated worker lane).
  Evidence: boot-guard test; hardening checklist in `docs/operations/`; SSRF/oversize-clone backend tests; production smoke at `d056b62a` with `worker-repo-ingestion` running.
  Branch follow-up: Production JWT Secret Guard adds `APP_ENV=production` propagation for deploy/compose, rejects placeholder or short `JWT_SECRET` values at backend/worker boot in production mode, and records the operator check in `docs/operations/PRODUCTION_HARDENING.md`.
  Branch follow-up: Repository Ingestion Hardening canonicalizes GitHub URLs before clone, rejects embedded credentials, custom ports, query strings, fragments, and host-confusion URLs, and routes clone-size enforcement through `REPO_INGESTION_MAX_CLONE_SIZE_MB`.
  Branch follow-up: Auth Cookie and CORS Hardening forces secure auth cookies in production, rejects wildcard or non-HTTPS credentialed CORS origins at production boot, applies a named `/api/auth/login` hourly rate limit, and records the operator verification commands in `docs/operations/PRODUCTION_HARDENING.md`.
  Branch follow-up: Repository Ingestion Worker Lane keeps the existing import dialog SSE contract but moves clone/filter/store work into a dedicated `repo_ingestion` Celery queue and `worker-repo-ingestion` service with conservative one-at-a-time autoscale.
  Review reconciliation: the previous secret, cookie, CORS, login-limit, and repository-ingestion work remains valid, but the gate is reopened until production drops `uvicorn --reload` and source bind mounts, uses restart policies and a production worker model, trusts forwarded addresses only from the known proxy, and emits HSTS, CSP, frame, and content-type headers at the edge. Evidence must inspect the effective production Compose configuration and public response headers.
  Release evidence: PR #1141 at `12fe151b` makes the base Compose topology production-safe, moves source mounts to the development override, starts two Uvicorn workers without reload using restricted proxy trust, removes raw forwarded-header trust from the rate limiter, applies restart and log-rotation defaults, and emits security headers from FastAPI and Next.js. PR #1142 at `4a6153d1` corrected the SSH smoke probe and preserved Alembic diagnostics. Required CI, Gemini and CodeRabbit review, worker-draining deploy, all seven Celery pings, zero `/app` source bind mounts across backend/workers, Alembic head, restricted `FORWARDED_ALLOW_IPS`, CSP, HSTS, frame and content-type headers, restart policies, and exact-revision public smoke passed.

- [x] **4. Backups + timed restore drill** (S–M; accepted in PR #1143 at `b734395d`)
  Nightly Postgres + artifact-storage backups with off-host copy; one rehearsed restore.
  Evidence: `docs/operations/BACKUP_RESTORE.md` runbook with the drill's actual timings and commands; cron/systemd unit in repo.
  Branch follow-up: Backup Restore Runbook adds production backup and restore-verification scripts plus systemd timer templates for nightly Postgres and artifact-volume backups with required off-host copy. The remaining acceptance work is running the first timed restore drill against a real production backup and recording the timings in the runbook.
  Review reconciliation: the backup command must derive or verify the database target from the effective production DSN, not assume the Compose-local `db` service. A successful drill must prove nonempty Patent Studio schema/data restoration.
  Release evidence: PR #1143 at `b734395d` reads `DATABASE_URL_SYNC` from the running backend, records the non-secret external target and source counts, validates the dump, archives the artifact volume without runtime package downloads, uses a dedicated restricted rsync identity, and compares restored schema/archive counts while proving nonempty patent and user data. The installed root-owned systemd timer is enabled and active with its next run scheduled for 2026-07-11 02:24:23 UTC. The deployed service completed in 17 seconds, copied 184 MB off-host to Beast, passed local and remote checksums, and restored 44 tables, 155 patents, 2 users, and 866 artifact entries into disposable volumes in 17 seconds. Exact-revision production smoke passed at `b734395d`.
  Regression and reopening 2026-07-31: the off-host copy named in the release evidence above went to Beast (`192.168.1.197`). Beast was decommissioned, but `/etc/patent-studio/backup.env` on `patents` kept pointing at it, and `backup_prod.sh` set `backup_complete=1` only *after* replication. `set -e` plus the `EXIT` trap therefore deleted a complete, checksummed backup every time the copy failed. The production journal for `patent-studio-backup.service` shows `rsync ... code 255` followed by `Failed to start` on 2026-07-24, 07-25, 07-26, 07-27, and 07-28 02:22, and `/var/backups/patent-studio` holds no directory between `20260721T022725Z` and `20260728T012812Z`: six consecutive nights built a valid backup and destroyed it. Nothing alerted; the only signal was journal output nobody read. The destination was corrected to the Dell R740 during the 2026-07-28 drill and the four runs since have logged `Backup complete`. PR #1599 marks the local backup usable before replication is attempted, so the same failure now exits non-zero and keeps the backup. The accepted evidence above is stale on two counts: it names a host that no longer exists, and the drill it records was manual. Re-acceptance is tracked in 4B-4G.
  Data-value note 2026-07-31: the six destroyed backups and the five surviving pre-2026-07-22 backups covered pre-beta throwaway test data, so the loss cost nothing. That is why this is recorded as a beta-readiness defect rather than an incident. The same defect against real user data would have been unrecoverable.

- [x] **4A. Outbound URL/SSRF boundary** (M; released in PR #1137 at `7afee270`)
  `url_intel.fetch_og_card` now permits only HTTP(S), rejects credentials and private/loopback/link-local/reserved destinations, validates every resolved address and redirect hop, and pins each connection to the validated address while preserving Host and TLS SNI. Response reads are streamed and bounded.
  Evidence: unit tests cover IPv4, IPv6, mapped IPv6, mixed DNS resolution, redirects, credentialed URLs, metadata/localhost targets, malformed character sets, and successful public HTTPS cards. Capture and Synthesis API tests prove private seed URLs produce no internal metadata. Bot review, required CI, safe worker-draining deploy, all worker lanes, Alembic head, and public production smoke passed at `7afee270`.

- [ ] **4B. Prove the backup monitor actually reports** (S)
  PR #1599 adds a per-run `backup-status.json`, `scripts/check_backup_health.py`, and a daily `backup-health.yml` workflow that opens and closes one `[backup]` issue.
  Why P0: this is the control that turns a silent six-night loss into a day-one alarm. Item 4's regression note shows detection, not the backup itself, was the thing that failed for six nights.
  Evidence required: one nightly run on a production revision containing #1599 writes `/var/backups/patent-studio/backup-status.json` with `outcome=success` and a fresh `last_offhost_copy_at`; the next scheduled `Backup Health` run exits 0 and closes any open `[backup]` issue; and one deliberately failed replication against a scratch destination — never the real backup directory — opens it.
  Configuration finding 2026-07-31: the workflow reads `vars.PROD_DEPLOY_HOST` and the `PROD_DEPLOY_SSH_KEY` / `PROD_SSH_KNOWN_HOSTS` secrets, which exist only on the `production` GitHub environment, not at repository scope. The job did not declare `environment: production`, so all three resolved to empty and the credential step would have failed on every run. #1599 now declares it, reusing exactly the values `promote-production.yml` already uses; no new credential was created.
  First real run 2026-07-31, after #1599 merged at `78091b71`: [run 30651520087](https://github.com/jxwalker/patent-studio/actions/runs/30651520087) resolved the environment-scoped variable and both secrets, authenticated to production, and ran a command there — so the workflow plumbing is proven end to end. It then reported `python3: can't open file '/opt/patent-studio/scripts/check_backup_health.py'`, failed, and opened issue #1607 with that evidence. This was an accurate red while production still lacked #1599.
  Green-path progress 2026-08-05: after #1599 reached production, scheduled `Backup Health` has exited success on consecutive daily runs through 2026-08-05. The latest inspected run is [30981740672](https://github.com/jxwalker/patent-studio/actions/runs/30981740672) with `CHECK_OUTCOME=success` and the unhealthy-fail step skipped. That closes the happy-path half of 4B (fresh status + scheduled green report).
  Failure-path harness 2026-08-05: `Backup Health` gained two dispatch-only inputs, both off by default so a scheduled run always reads the real backups. `failure_drill` points the checker at a scratch directory; `induce_failed_replication` first runs a real backup into that directory against a `.invalid` destination that cannot resolve, reproducing the July 2026 failure — a complete local backup whose replication fails — without being able to reach any real host. The workflow refuses to drill inside `BACKUP_DIR`, removes the scratch directory on every exit path, marks the resulting issue as a drill that did not inspect the real backups, and fails the job if a drill reports healthy, because a drill that opened no issue proved nothing. The incident is opened by the real reconciliation step rather than a copy of it, so the drill exercises the actual reporting path. Contract tests are in `backend/tests/test_backup_health_monitor.py`; operator instructions are in [`operations/BACKUP_RESTORE.md`](operations/BACKUP_RESTORE.md#proving-the-monitor-reports).
  Remaining: the operator dispatches the drill once, confirms a `[backup]` issue opens, and confirms the next scheduled green run closes it. Opening and closing that issue is the evidence; the harness alone is not.

- [ ] **4C. A backup nobody has restored is not yet known to be a backup** (M)
  No automated restore has ever run. `docs/operations/BACKUP_RESTORE.md` records only supervised manual drills: two on 2026-07-10, the Dell R740 replacement-host drill on 2026-07-28, and an isolated drill from the off-host copy on 2026-07-31. Every one needed a human to start it and to read the result.
  Why P0: restore is the only property that makes a backup worth taking, and it is the highest-consequence untested path the moment real user data exists. That untested paths rot here is not theoretical — the 2026-07-31 drill surfaced a real `pg_isready`-during-initdb race in `restore_verify.sh`, fixed in #1599, which had been latent in a script the release evidence for item 4 already treated as proven.
  What would have to be true for a drill to count: scheduled at least monthly and unattended; restores the newest **off-host** copy rather than the local one, on a host that is neither production nor the backup destination; verifies `SHA256SUMS` before restoring instead of trusting that the copy arrived; asserts nonempty schema, patent, user, and artifact counts against the backup's own `manifest.txt` rather than accepting `pg_restore` exit 0; records wall-clock duration so a recovery-time objective can be stated from measurement; destroys its scratch volumes afterwards; and fails into the same `[backup]` issue channel as 4B. A drill whose failure depends on a human noticing does not count.
  Harness built 2026-08-05: `scripts/restore_drill.sh` and the monthly `Backup Restore Drill` workflow satisfy every property above. The drill lists the destination, pulls the newest stamp, and restores it on CI capacity, which is neither production nor the destination. `restore_verify.sh` now **requires** `SHA256SUMS` instead of skipping verification when the file is absent, which had meant the least trustworthy copy — a truncated or partially replicated one — would restore and be reported as verified. Its SEC-6 hardening discovers every restored base-table `*_storage_key` (including no-`id` tables) plus the live drawing-revision JSON locators, pins lookup to the manifest's effective local root and one unambiguous S3 layout, requires each non-null binding to resolve to a regular non-symlinked restored file, and records the resolved binding types; a count-preserving renamed, missing, symlinked, or layout-colliding object therefore fails. Measured pull and restore durations are written to a retained JSON drill record. The destination is only ever read: no rsync option that could write or delete there is used, so read-only access is sufficient and a drill cannot damage the backups it checks. Failures open a `[backup]` issue and a green run closes it. Executed coverage in `backend/tests/test_restore_drill.py` runs the script against a stubbed transport and proves newest-stamp selection, read-only access, scratch cleanup, and loud failure on an unconfigured destination, an empty destination, and a tampered copy; `backend/tests/test_backup_restore_scripts.py` also builds a real PostgreSQL dump and artifact archive, runs the production verifier, checks its retained report, then preserves counts while renaming a JSON-bound object and proves the restore fails on that exact binding. See [`operations/BACKUP_RESTORE.md`](operations/BACKUP_RESTORE.md#unattended-restore-drill).
  Remaining: the operator sets `BACKUP_OFFHOST_SOURCE` plus the read-only credential on the `production` environment, and one scheduled run then has to pass. Until a real run is green against the real destination, this is a harness rather than evidence.

## P1 — Before invite links circulate

- [ ] **4D. Decommissioning a host and updating operator config must be one action** (S)
  The six lost nights were caused by operator configuration, not by code: `BACKUP_REMOTE_RSYNC_DEST` in `/etc/patent-studio/backup.env` still named Beast weeks after Beast was retired. That file is private operator config and is deliberately not in the repository, so **no CI check can ever catch this class of drift** — the repository cannot see the value that was wrong.
  Why P1: #1599 removes the destructive consequence, so a stale destination now degrades to a loud failure plus a retained backup rather than silent loss. What remains is preventing the failure at all, which is a process control and belongs before invite links circulate rather than before any signup.
  What would close it: a written host-decommissioning checklist that treats "grep every host for references to the retired address" as a required step, covering at minimum `/etc/patent-studio/backup.env`, systemd units, `authorized_keys` restrictions, and known-hosts material; plus one operator pass confirming no reference to `192.168.1.197` or the Beast name survives anywhere. `AGENTS.md` already states Beast is decommissioned, which is necessary but was demonstrably not sufficient.
  Verified 2026-07-31: `/etc/patent-studio/backup.env` on `patents` contains no reference to `192.168.1.197` or Beast, and its destination authenticates over the real restricted `rrsync` transport.
  Checklist written 2026-08-05: [`operations/BACKUP_RESTORE.md` Decommissioning a host](operations/BACKUP_RESTORE.md#decommissioning-a-host) requires searching every remaining host for both the retired hostname and its IP address, and covers the backup env file, systemd units and drop-ins, `authorized_keys` restrictions on peers, `known_hosts` material, and off-repository operator config. It requires re-pointing and proving write access rather than only deleting the stale value, requires the replacement host's backup key to keep its `command=` and `from=` restrictions and proves they bind, and proves the replacement in the terms of the retired host's job so a CI runner retirement cannot be signed off with backup-only evidence. The monthly drill record now has a row for the confirming search.
  Remaining: the one-time operator pass across hosts, recorded in that drill row. No current workflow reads these values, so closing this needs the operator rather than the repository. A privileged workflow that attests permissions and freshness on every operator config file would turn this class of drift into a CI-visible failure; that is the standing control 9M describes and it does not exist yet.

- [ ] **4E. The nightly backup has no dead-man alarm** (S)
  The 4B check runs once a day and reaches production over SSH, so it detects a stopped timer or a stale backup. It cannot tell "production is gone" apart from "the scheduled workflow did not run", and it reports at most daily.
  Evidence 2026-07-31: `OBSERVABILITY_HEARTBEAT_URL` exists as a real seam but is consumed only by `backend/app/worker_lane_monitor.py`. `scripts/backup_prod.sh`, `scripts/check_backup_health.py`, and both systemd units ping no heartbeat at all. Healthchecks is already provisioned and drilled for the worker-lane monitor (item 5, 2026-07-28, period 2 plus grace 3), so the account and the pattern exist and only the backup is unwired.
  Why P1 rather than P0: 4B already converts a broken backup into an issue within 24 hours, so this shortens the detection window rather than creating detection where there was none.
  Split of work: the code change is a single success ping at the end of `backup_prod.sh`. Provisioning the check itself is an operator decision and cannot be done from the repository.
  Code half done 2026-08-05: `scripts/backup_prod.sh` now pings `BACKUP_HEARTBEAT_URL` after a wholly successful run, including the off-host copy. The ping is its own check rather than the worker-lane monitor's, so neither job can mask the other; it never changes the backup's exit status; it must be https because the URL is a capability token; a malformed URL or non-positive timeout stops the run at startup rather than leaving the check silently unpinged; and it is deliberately not forwarded over SSH, where it would appear in the remote process table. `ops/systemd/patent-studio-backup.env.example` and the dead-man section of [`operations/BACKUP_RESTORE.md`](operations/BACKUP_RESTORE.md#dead-man-heartbeat) carry the operator instructions. Executed coverage in `backend/tests/test_backup_restore_scripts.py` pings a real local HTTP server, proves a refused connection leaves the exit status untouched without echoing the endpoint, and proves an unset URL is silent.
  Remaining: the operator provisions the Healthchecks check and sets the URL, and a promotion carries this script to production, after which one nightly run must satisfy the check.

- [ ] **4F. Decide what backups may contain at public beta** (M; the user's decision, not an engineering one)
  Today's backups hold pre-beta throwaway data, so their contents carry no obligation. At public beta the same nightly job will copy real users' inventions and personal data to a second host on the first night, and that copy cannot be retroactively withdrawn.
  What the product already promises, and must keep true: `/privacy` states "Production backups are normally retained for 14 days, so deleted data may persist in protected backups until that cycle expires." `/security` states "Production database, artifact, and backup access is restricted operationally" and says plainly that patent and source content is **not** protected with application-level field encryption. Cross-link: item 6 Legal/trust accuracy.
  Decisions identified by the 2026-07-31 audit: (1) the retention period for the off-host copy, which the audit found unbounded and therefore inconsistent with the published 14-day cycle — see 4G; (2) whether backups must be encrypted at rest, given the audit found plain destination files protected by filesystem permissions and a write-only `rrsync` restriction, with no encryption of the dump itself; (3) who may read the backup destination, and whether that access is auditable; (4) whether an account-closure or erasure request has to reach backups, and if not, what the documented answer to a data subject is; (5) whether the destination host's location and operator satisfy the applicable UK/EU obligation. Reconfirm the live configuration before deciding; this ledger does not prove it is unchanged.
  Why P1: it must be settled before invite links circulate, because the first real user's data lands in a backup that night. It is P1 rather than P0 only because the outcome is a decision plus documentation, and the engineering follow-on is small once the answers exist.

- [ ] **5. Error tracking + alerting** (M) — Sentry on frontend, backend, and every Celery lane; queue-depth/stalled-job alerts; external uptime check.
  Evidence: a forced test exception visible in Sentry from each tier; alert fires on a paused worker lane.
  Branch follow-up: PR #1145 at `84f425ab` adds privacy-scrubbed Sentry initialization for FastAPI, every Celery process, Next.js server/edge/browser runtimes, and a global frontend recovery boundary. A dedicated `worker-monitor` checks all queue families, warning/critical queue depth, missing consumers, and stale durable-job heartbeats without inheriting provider keys; planned deploy drains stop the monitor before cancelling consumers. Required CI, deploy, public smoke, and all seven Celery worker pings passed. The remaining acceptance work is private production DSN configuration, Sentry alert workflows, a dead-man heartbeat, forced events from each tier, and the supervised paused-lane alert/recovery drill in `docs/operations/OBSERVABILITY.md`.
  Production audit 2026-07-12: backend and browser Sentry DSNs and the dead-man heartbeat URL remain unconfigured. The release is configured as production and carries the deployed revision, but no Sentry-event or dead-man acceptance can be claimed until those private settings and alert workflows exist.
  Admin configuration follow-up: migration `078` adds a first-class **Admin > Observability** profile for backend/worker Sentry, trace sampling, lane thresholds, stalled-job detection, and the dead-man heartbeat. Secrets are encrypted and write-only; a saved database profile is authoritative even when disabled; backend requests, Celery jobs, and the monitor reload it at runtime. Browser Sentry remains an explicit build-time deployment setting. The beta gate remains open until the production profile, browser DSN, alert workflows, dead-man heartbeat, forced events, and supervised paused-lane drill are accepted.
  Responder-lane follow-up: PR #1245 adds `worker-responder` to the production observability acceptance loop and disaster-recovery stop/start procedures, and adds regression guards that keep the monitor alias and operational worker inventory aligned. The external acceptance gates above remain unchanged.
  Generation-heartbeat follow-up: PR #1246 refreshes a running Create journey's durable parent job during long, silent child stages, without changing stage progress or reviving paused, cancelled, failed, or completed work. The cadence is database-backed under **Admin > Platform**, with environment fallback. This prevents healthy white-paper and other long stages from producing false stalled-job alerts; the external acceptance gates above remain unchanged.
  External-route acceptance 2026-07-15: PR #1299 at `0f7c54ab` adds a GitHub-hosted five-minute monitor that probes the public `/health` route from outside production and Proxmox, requires healthy application and database state, retries three times, opens one GitHub incident issue, and closes it on recovery. Required CI passed, the non-secret public-origin repository variable is configured, and [workflow-dispatch run 29421088109](https://github.com/jxwalker/patent-studio/actions/runs/29421088109) passed in eight seconds without opening an incident. Item 5 remains open for the private Sentry, dead-man, forced-event, and paused-lane acceptance evidence.
  Production configuration audit 2026-07-21: no database Observability profile exists and the production frontend image has no browser Sentry DSN. Backend/worker Sentry, the dead-man heartbeat, browser telemetry, forced-event evidence, and the supervised paused-lane drill therefore remain unaccepted; no test event was emitted during the read-only audit.
  Browser acceptance follow-up 2026-07-24: PR #1387 adds a privacy-scrubbed browser test event, explicit `sent` / `unconfigured` / `flush timeout` / `failed` states, event IDs for browser, backend, and worker tests, and truthful recovery copy in **Admin > Observability**. Focused Playwright coverage and the exact-main CI gate passed, and production was smoke-tested at `ec05e7f1`. The production configuration remains intentionally reported as unconfigured, so this item stays open until the private DSNs, alert workflows, forced events, heartbeat, and paused-lane drill are accepted.
  Operator worksheet 2026-07-26: `docs/acceptance/GATE0_3_OBSERVABILITY_ACCEPTANCE.md`. Public preflight against `https://patents.scorpion-labs.com` passed `/health`, registration `invite_only`, and `scripts/check_external_uptime.sh`; recent GitHub uptime runs were green. The deployed frontend client bundle still has an empty browser `dsn`, and SSH from the cloud agent to `james@100.88.8.121` remains blocked, so private DSN configuration, Admin forced-event drills, dead-man, and paused-lane acceptance still require an operator host.
  Production evidence 2026-07-28 (SHA `06772900`, packet `20260728T125148Z`): Admin observability profile enabled (`source=database`); backend/worker Sentry DSN and Healthchecks heartbeat configured (encrypted; not recorded); browser DSN set in deploy `.env` and rebuilt; `worker_inspect_timeout_seconds=25`. §6 forced-event clean pass (Admin Ready, 10/10) with event IDs recorded; **operator privacy scrub confirmed OK** the same day (all forced-event / acceptance event IDs resolved or scrubbed; no confidential content / PII). §7 paused-lane `artwork` missing_consumer alerted and recovered (Sentry emails 13:58:25 BST); intentional artwork issues resolved in Sentry. §3a dead-man silence drilled (Healthchecks DOWN 14:14:42 / UP 14:19:19 +0100 under then-grace 10 / ~12-minute window); the later observed Healthchecks setting was period 2 + grace **3** = **5-minute** detection. This packet was invalidated by later production advances; rerun the living Gate 0.3 worksheet in full. Earlier same-day audits that reported DSNs UNSET / `dsn:""` / `last_test_success=False` at `86a0de5b` are historical only.
- [x] **6. Legal/trust accuracy** (M; accepted 2026-07-11 on production revision `0180cc56`) — trust pages match reality (subprocessors: Anthropic/Perplexity/Google; retention; encryption posture); explicit confidentiality stance on invention disclosures; `ai-output-review-notice` confirmed rendering at export/counsel handoff; beta banner; account/data deletion path (GDPR — UK/EU users).
  Evidence: page-by-page review note; deletion endpoint + e2e; banner in north-star smoke screenshots.
  Release evidence: Legal Trust Accuracy names conditional subprocessors and the actual retention/encryption posture, makes the private-beta and confidentiality boundaries explicit, reuses the AI review notice at patent export and counsel handoff, and adds self-service closure that revokes private credentials and pseudonymizes the account without destroying shared work. Required CI and deploy had already passed. A dated Playwright acceptance against production revision `0180cc56` reviewed `/terms`, `/privacy`, and `/security`; confirmed the private-beta, no-legal-advice, confidentiality, subprocessor, 14-day backup-retention, no-training, encryption, and closure statements; rendered `ai-output-review-notice` on patent export and filing handoff; invited and registered a disposable user through the real APIs; signed in through the real UI; closed the account through Settings; and proved the old credentials returned 401. Both production journeys passed and the temporary acceptance harness was removed after use.
- [ ] **7. Billing live-mode loop** (S) — subscribe → allowance granted → cancel → failed payment/dunning → plan gates (project caps, filing-export guard) verified in live mode; free tier defined in writing.
  Evidence: dated walkthrough note with Stripe dashboard refs.
  Product surface 2026-07-12: PR #1213 at `a5bb7ccf` adds `/admin/billing`, which stores the Stripe secret, webhook secret, Pro/Firm price IDs, plan allowances, checkout/portal URLs, enabled state, and connection-test result in the database with encrypted write-only secrets and environment fallback. Required CI, migration `077`, serialized deploy, route acceptance, and secret non-readback passed. The W3 follow-up replaces the fixed Pro/Firm and runtime-JSON plan controls with one database-backed subscription-plan catalog managed under Admin Billing. That catalog drives project capacity, AI quotas and run caps, credits, filing/counsel entitlements, Stripe checkout choices, and Admin Users assignment. Production has no saved billing profile, so the live-mode walkthrough remains an external Stripe setup and acceptance gate.
  Production configuration audit 2026-07-21: production still has no saved Billing profile. No Stripe call or billing mutation was made; checkout, allowance, cancellation, dunning, and plan-gate evidence remain open.
  Eng + worksheet 2026-07-26: webhook handling for `invoice.payment_failed` records a sanitized billing event, applies `past_due`, downgrades paid Stripe plans to free, and never grants allowance; `customer.subscription.updated` with `past_due` is covered by the same downgrade path. Operator packet: `docs/acceptance/GATE0_5_STRIPE_ACCEPTANCE.md`. Live-mode Admin profile and production dunning evidence remain open.
  Worksheet hardening 2026-07-26: `GATE0_5_STRIPE_ACCEPTANCE.md` now requires OPS-7 webhook replay (no duplicate allowance), recovery after dunning (restore `active` entitlements per product rules), explicit `past_due` vs `unpaid` note, Support `/support?topic=billing` `last_invoice_id` check, and the same tip SHA as Gate 0.6 when both run in one window. Live drills remain OPEN.
- [x] **7A. Administrator AI control plane** (M; accepted through PR #1221 at `6fa7f183`)
  Provide one first-class **Admin > AI providers** surface for platform provider credentials, global and scoped workload defaults, credential policy, token/retry tuning, provider backpressure, and user BYOK metadata. Personal keys and personal model overrides remain under **Settings > AI**. Search may select Perplexity as its web-search lane, but must use the one canonical platform credential instead of storing another key.
  Evidence: encrypted write-only secret persistence; environment fallback provenance; admin permission tests; provider connection tests; model-card capability routing; scoped-default and personal-override separation; migration of the existing search Perplexity credential; browser coverage for credentials, defaults, policy, and BYOK inventory; clean schema drift; required CI; deploy; and authenticated production acceptance.
  Bootstrap boundary: database URLs, JWT and encryption secrets, CORS/cookie trust, Redis/Celery topology, worker autoscale, and public browser build values remain private infrastructure configuration. Runtime AI policy and credentials are database-backed with environment fallback.
  Configuration expansion 2026-07-12: the canonical ownership ledger is `docs/operations/CONFIGURATION_BOUNDARY.md`. Google sign-in joins the first-class Admin area at `/admin/authentication`, with an encrypted write-only database profile, environment fallback, invite-only behavior, and a validation action. Infrastructure bootstrap remains deliberately separate.
  Configuration cleanup 2026-07-12: production's effective BYOK policy was persisted as the Admin-managed `ai_registry_mode=byok` database override before the duplicate `BYOK_ENFORCED` environment bridge was removed. Every remaining process setting is now machine-classified as Admin/database managed or infrastructure bootstrap.
  Release evidence: PRs #1211, #1219, #1220, and #1221 establish the first-class Admin workspace, consolidated platform AI controls, database-backed Google authentication, and the final configuration-ownership guard. Platform and personal credentials remain separate, secrets are encrypted and write-only, database overrides refresh in API and worker processes, and the ownership test rejects any unclassified future setting. Focused configuration tests, the 492-test static packet, the 101-test schema/Admin packet, required PR and exact-main CI, Gemini review with no findings, serialized worker-draining deploy, Alembic `080`, all 13 services, runtime `ai_registry_mode=byok`, and public production smoke passed at `6fa7f183`.

- [x] **7B. Administrator configuration completeness and navigation** (L; accepted through PR #1230 at `5202bea3`)
  Keep infrastructure bootstrap separate, as defined in `docs/operations/CONFIGURATION_BOUNDARY.md`. Audit every other shared runtime control and ensure it is stored in PostgreSQL, encrypted when secret, resolved dynamically by API and worker processes, and managed through one first-class Admin destination. Remove any remaining non-bootstrap environment-only control or undocumented duplicate configuration path.
  Make Admin a coherent workspace in the left navigation for administrators. Use one consistent section menu and interaction contract across Users, Authentication, AI providers, Email delivery, Responder, Search, Spend, Billing, Observability, and Platform: truthful source provenance, status, save, validate/test, disabled, unavailable, and recovery states; no secret readback; no mixed clickable and passive controls that look alike; responsive layouts without overflow.
  Work order: complete the ownership audit; close database/runtime gaps; normalize Admin information architecture and shared components; then run permission, secret non-readback, environment-fallback, disabled-profile, decryption-failure, runtime-refresh, migration, browser, and production acceptance gates. Do not move database credentials, JWT/encryption keys, Redis/Celery topology, trusted-proxy/cookie policy, deployment coordinates, or build-time browser values into the application database.
  Acceptance evidence: an updated ownership matrix with no unclassified non-bootstrap setting; focused backend and browser coverage for every Admin route; clean Alembic and schema-drift checks; desktop and mobile route walkthroughs; exact-main CI; serialized deploy; authenticated production acceptance; and release-ledger reconciliation.
  First accepted slice 2026-07-13: PR #1223 at `b0f7b9be` preserves Google OAuth environment-fallback validation success and failure across Admin reloads without creating a database credential override. The audit record stores only a non-secret profile fingerprint and validation metadata; profile changes invalidate stale state; malformed audit JSON fails safely. Bot feedback was addressed, required PR and exact-main CI passed, the serialized deploy and production smoke passed with Alembic `080` and all 13 services, and authenticated 390 px acceptance proved the validation timestamp survived reload without overflow. The effective application database retained zero `google_oauth_config` rows, the audit shape contained no credential material, and the public Google provider remained enabled.
  Release evidence 2026-07-13: PR #1225 made Admin a first-class, route-backed workspace with one page identity and responsive navigation contract. PR #1228 persisted non-secret environment-profile validation state for Authentication, Email, Search, Billing, and Observability without creating credential rows or storing secrets. PR #1230 added one shared configuration-state and action contract across Authentication, Email, Responder, Search, Billing, Observability, AI, Spend, and Platform, including truthful database/environment/unconfigured provenance, last validation, disabled and unavailable states, recovery instructions, guarded initial-load failures, and race-safe Save/Test actions. Required PR CI run `29238373595` and exact-main run `29239195688` passed the Admin control-plane, migration/schema, real account lifecycle, static, production build, and 195-test browser gates. The serialized worker-draining deploy released `5202bea3` with Alembic `080` and all 13 services. Authenticated production acceptance covered all six service configuration routes at 1728 px and 390 x 844 px with no horizontal overflow, clipped actions, or browser errors, while preserving write-only secret fields. Authentication truthfully showed an untested environment fallback; Email and Responder showed tested database profiles; Search and Billing showed unconfigured recovery states; Observability showed disabled with no active source. External service acceptance remains separately tracked under Billing, Observability, cold-mail delivery, and responder message-flow items.
- [ ] **8. Email deliverability** (S) — production provider; SPF/DKIM/DMARC on sending domain; verification/reset/invite tested to cold Gmail + Outlook.
  Evidence: headers of received test mails recorded.
  Review reconciliation: until SMTP is verified, UI copy must not claim an email was sent. Registration, login, and recovery email matching must be case-insensitive.
  Operator path: `docs/operations/EMAIL_DELIVERY.md` records the last verified DreamHost/Cloudflare snapshot, safe setup order, cold Gmail/Outlook evidence matrix, responder acceptance, sensitive-action recovery, DMARC progression, and rollback. Recheck the effective profile and DNS before acceptance.
  Domain audit 2026-07-13: `scorpion-labs.com` uses Cloudflare nameservers and DreamHost MX. Cloudflare `1.1.1.1` and Google `8.8.8.8` now return exactly one SPF record, `v=spf1 mx include:netblocks.dreamhost.com include:relay.mailchannels.net -all`, plus the DreamHost DKIM key and the `p=none` DMARC record. A fresh Gmail delivery test, invitation, verification, and password-recovery message each reported `spf=pass`, `dkim=pass`, and `dmarc=pass`. PR #1240's production headers were also accepted: the controlled test received on 2026-07-13 included an RFC Date and a unique Message-ID. Those four transactional messages landed in spam, but the later responder acceptance reply reached Gmail Inbox with `spf=pass`, `dkim=pass`, and `dmarc=pass`, proving authenticated inbox delivery for that path. The disposable account completed the real password reset and verification journeys, then the same guarded archive action changed from a truthful 403 verification requirement to 200 after verification. All Outlook journeys and broader transactional inbox-placement acceptance remain open; the disposable account is now deactivated.
  Owner-notification acceptance 2026-07-14: the administrator test action delivered `Patent Studio workspace notification test` to the signed-in administrator's Gmail Inbox. Raw headers reported SPF, DKIM with selector `dreamhost`, and DMARC all passing over TLS 1.3. Audit row `1197` records only `recipient=signed_in_admin` and `test_success=true`; no recipient address was persisted. The production notification policy remains disabled for transfer, archive, restore, and permanent deletion. Outlook acceptance remains open, so item 8 is not complete.
  Outlook acceptance checkpoint 2026-07-15: the approved disposable Outlook acceptance account is still at Microsoft's interactive `Press and hold` human-verification step, while the separate Outlook page is signed out. No production message was sent and no delivery claim is made. Complete that Microsoft verification and sign-in before running the controlled cold-Outlook delivery matrix.
  Operator worksheet 2026-07-26: `docs/acceptance/GATE0_4_OUTLOOK_ACCEPTANCE.md` (exact-SHA preflight + Outlook matrix fill-in).
  Truthful failure-copy acceptance 2026-07-24: PR #1385 makes password-recovery responses identical for known and unknown accounts and says a reset link arrives only when the account exists and delivery succeeds. Focused backend tests cover delivery returning false and raising an SMTP exception without leaking account existence; frontend browser coverage verifies the conditional recovery and verification copy. PR CI and exact-main run `30087976892` passed. The serialized deploy released `50e8365e` with all 14 compose services running. A public request for a valid-format unknown address returned HTTP 200 with the neutral conditional message, and `/forgot-password` stated that Patent Studio would attempt delivery rather than claiming it had sent mail. This closes the truthful-copy requirement, while the cold Outlook matrix keeps item 8 open.
  Gate 0.4 Cursor drive 2026-07-28: refreshed non-secret preflight on production tip `06772900` (Alembic `115`, `invite_only`, private packet `20260728T125148Z`, CI run `30359383644`). Database DreamHost SMTP remains enabled/password-backed with last test success; env `SMTP_*` unset; public SPF/DKIM/DMARC/MX OK. Worksheet tables prepared for operator fill-in. No cold Outlook messages were sent; Microsoft mailbox unlock and the five-row Outlook matrix remain operator-only. Item 8 stays open.
  Cold Outlook Invitation 2026-07-28: disposable Outlook received the invitation in **Junk** (~16:47:25Z; Date `2026-07-28 16:47:19Z`) on production tip `4fbac2f2`. Authentication-Results `spf=pass` / `dkim=pass` / `dmarc=pass` (`header.from=scorpion-labs.com`); From `Patent Studio <patents@scorpion-labs.com>`; partial Message-ID `<178525723963.…@scorpion-labs.com>`; `X-MS-Exchange-Organization-SCL: 5`; relay DreamHost → MailChannels → Outlook. Mailbox address not committed. Later production advances invalidated this partial row for the current Gate 0.4 window; rerun all five rows on the next frozen candidate. Item 8 stays open.

- [x] **8A. Honest signup funnel** (S; accepted in PR #1146 at `75a62b56`)
  Decide invite-only versus public trial. In invite-only mode, `/register` without a valid invite must show a request-access state and public CTAs must not advertise self-service creation. In public mode, open registration must be an explicit configuration with abuse controls.
  Evidence: browser tests from `/trial`, `/login`, direct `/register`, valid invite, invalid invite, and Google OAuth entry; matching production copy.
  Release evidence: PR #1146 makes the current backend policy explicit on `/trial`, `/login`, and direct `/register`; validates invitation links before exposing account fields; provides a configured support request path for missing or invalid invitations; makes email-scoped invitations immutable; and normalizes registration, password login, invitations, duplicate prevention, and password recovery email matching case-insensitively. Migration `067` adds a unique lower-email index after a production preflight proved zero case-colliding accounts. Focused isolated-Postgres tests, schema drift, frontend typecheck, lint, production build, 139 browser-smoke tests, required CI, bot review, worker-draining deploy, Alembic head, public smoke, live browser acceptance, and all seven worker pings passed at `75a62b56`.

- [x] **8B. Admin email delivery configuration** (M; production profile configured and tested 2026-07-13)
  Provide an administrator-only surface for configuring the production email provider, sender identity, reply-to address, and delivery settings used by verification, invitation, password-reset, and support responses. Secrets remain write-only and server-side; the UI shows configured/tested state without reading credentials back.
  Evidence: encrypted or external secret persistence; permission tests; provider connection and test-email actions; truthful configured, unavailable, and delivery-failed states; verification and recovery flows consume the selected configuration; cold Gmail and Outlook delivery evidence remains part of item 8.
  Release follow-up: PR #1173 at `98987903` adds an administrator-managed SMTP profile, encrypted write-only credentials, sender and reply-to identity, explicit STARTTLS/TLS selection, enabled state, environment fallback, and a test action fixed to the signed-in administrator. Verification, invitation, and password-recovery callers resolve the same profile, while unconfigured delivery now reports failure instead of treating console logging as a send. Clean-Postgres migration, schema-drift, permission, secret non-readback, delivery-state, TypeScript, lint, browser, bot-review, required PR CI, exact-main CI, worker-draining deploy, Alembic `069`, all worker lanes, and public smoke passed. The configuration-surface acceptance is now satisfied by the enabled and successfully tested production profile; cold Gmail/Outlook evidence remains under item 8.
  Production acceptance 2026-07-13: one database delivery profile exists, is enabled, and records a successful connection test. The encrypted password remains write-only. SPF, DKIM, and DMARC resolve publicly; cold Gmail and Outlook message evidence remains tracked by item 8 rather than this configuration-surface item.

- [x] **8C. Admin responder configuration** (M; accepted 2026-07-13 on production revision `05b5aa7f`)
  Add an administrator-only **Responder** section under email administration. Keep it separate from the shared outbound SMTP transport: the responder owns its inbound mailbox or provider connection, monitored address and folder, notification recipients, permitted sender/domain policy, signature, and reply mode. Default to `draft_only`; enabling automatic replies must be an explicit administrator action after inbound and outbound tests pass. Reuse the configured email-delivery profile for outbound mail rather than duplicating SMTP credentials.
  Guardrails: inbound credentials and OAuth refresh tokens are encrypted and write-only; no browser response exposes secrets; polling/webhook health, last successful receipt, last response, and actionable error state are visible; duplicate messages are idempotent; loops and auto-replies are prevented; every generated draft, approval, send, failure, and configuration change is audited. A disabled or unhealthy responder must never claim that a request was received or answered.
  Evidence: admin permission and tenant-boundary tests; encrypted secret non-readback tests; receive, draft, approve/send, duplicate-message, loop-prevention, and failure-state backend tests; browser coverage for unconfigured, draft-only, tested, active, and unhealthy states; a production test message proves receipt and a manually approved response before automatic mode can be enabled.
  Release follow-up: PR #1191 at `b8c1d54c` adds the administrator-only **Email > Responder** configuration and read-only IMAP connection-test surface. Inbound credentials are encrypted and write-only; configuration and test outcomes are audited; host, TLS mode, monitored address, folder, notifications, sender/domain policy, signature, and intended reply mode are persisted; outbound delivery reuses the shared SMTP profile. The API reports `runtime_available: false`, saves the responder disabled, and the UI states that polling, drafting, and sending are not active. Permission, secret non-readback, validation, mailbox quoting, clean-Postgres migration/schema, TypeScript, lint, build, browser, bot-review, required PR CI, exact-main CI, worker-draining deploy, Alembic `072`, all seven worker lanes, public health, and authenticated production acceptance passed. Item 8C remains open until the durable receive/draft/approve/send runtime, idempotency and loop prevention, active/unhealthy browser states, and real message evidence are complete.
  Runtime release follow-up: PR #1195 at `30480978` adds the durable receive, AI-draft, review, approval, notification, and send runtime on its own `responder` Celery lane. UIDVALIDITY-aware IMAP source identifiers and a durable message ledger prevent duplicate processing; bulk, list, junk, automatic-response, responder-owned sender, and sender/domain policy checks prevent loops; safe SMTP threading headers reject injection; credentials remain encrypted and write-only; configuration, receipt, rejection, drafting, editing, approval, sending, failure, and runtime transitions are audited. Automatic mode remains gated behind successful inbound and outbound tests and explicit activation, while draft-only remains the default. The canonical admin surface at `/admin/responder` exposes truthful stopped, queued, active, paused, unhealthy, and empty-inbox states plus runtime controls and draft review without returning secrets. Clean-Postgres migration through Alembic `073`, schema drift, focused and broader backend suites, frontend typecheck, lint, production build, responder browser coverage, required PR CI, exact-main CI, worker-draining deploy, dedicated worker registration and queue subscription, beat heartbeats, public smoke, and authenticated production acceptance passed. Item 8C remains open only for proving receipt of a production test message and manually approving and delivering its response before automatic mode is enabled.
  Production acceptance 2026-07-13: one responder profile remains enabled in `draft_only` mode on durable runtime job 187. The controlled Gmail message with reference `PS-RESPONDER-20260713-1529` was received once and produced one reviewable AI draft. An administrator approved it manually; responder job 195 succeeded and one threaded reply reached Gmail Inbox. The raw received message reports `spf=pass`, `dkim=pass` with the DreamHost selector, `dmarc=pass`, a valid RFC Date, a unique Message-ID, correct In-Reply-To and References, `Auto-Submitted: auto-replied`, `X-Auto-Response-Suppress: All`, and TLS delivery. A forced mailbox poll completed without error and left two total responder message rows but exactly one row for the acceptance reference, proving duplicate suppression. Automatic mode remains disabled by design.
- [x] **9. First-run journey / create-menu decomposition** (L, released through PR #868 at `e3ba2207`) — split `create-menu.tsx` into manual blank creation plus full-page generation routes; first-run now takes the user's own corpus into one guided patent and a visible draft, not a preloaded demonstration topic or a full-auto portfolio run.
  Evidence: structural slices released in PRs #860, #862, #864, #866, #867, and #868. The first-run browser contract requires user-supplied notes, documents, Sources, NotebookLM material, or a repository before continuing, preserves the one-patent default, and proves the generated Draft handoff. The release chain is tracked in `design/north-star-ui/RELEASE_LEDGER.csv`. Acceptance remains pending until a real first-run workflow confirms the shipped handoff.

- [x] **9A. Graceful no-key and quota-exhausted journey** (M; accepted in PR #1150 at `0a40ba54`)
  Normalize missing-key/model/provider/quota errors into actionable 503/429 responses and shared Notices linking to Settings -> AI. Preflight the primary generation launcher before creating paid work.
  Evidence: backend contract tests for every AI route family plus browser journeys for no key, invalid key, exhausted calls/tokens/spend, and successful recovery after configuration.
  Release evidence: PR #1150 adds a non-mutating generation preflight that resolves every planned AI workload and rejects missing, invalid, or previously failed provider keys before a run row or Celery task is created. It returns structured 503/429 recovery contracts for provider readiness and call, token, spend, and per-run limits; validates portfolio/project/patent scope consistency; preserves readable API details; and makes overlapping frontend checks monotonic, so stale responses cannot overwrite current readiness. The launcher shows actionable Settings or Usage links, supports explicit recheck, and disables launch while readiness is blocked or being retried. Focused clean-Postgres backend tests, frontend typecheck, lint, production build, 145 browser-smoke tests, required CI run `29137837250`, CodeRabbit app approval, CodeRabbit CLI `No findings`, worker-draining deploy, Alembic head, all seven worker lanes, and public production smoke passed at `0a40ba54`. Authenticated production acceptance used the sample filing-ready plan without creating a run: the preflight estimated `$13.165`, reported only `$7.50` remaining, linked to AI usage, offered `Check again`, and kept `Start background job` disabled.

- [x] **9B. Durable local editing and load truth** (M; accepted in PR #1152 at `d5e3f5e6`)
  Dashboard and run-monitor load failures must render retryable errors rather than empty-account states. Specification and drawing editors must flush pending debounced saves on navigation/unmount or block navigation while dirty; failed drawing saves must remain retryable.
  Evidence: browser tests for failed loads with existing data, client navigation inside each debounce window, hard unload guard, failed save, retry, and persisted reload.
  Release evidence: PR #1152 preserves the distinction between failed loads and genuinely empty project/run data, makes specification saves durable across client navigation and hard unload, flushes drawing changes before navigation, and keeps failed drawing payloads available for explicit retry. Frontend typecheck, lint with zero errors, production build, 147 browser-smoke tests, four clean-Postgres backend checks, and required CI passed. The worker-draining production deploy advanced the runtime to `d5e3f5e6`; Alembic `067` remained at head, backend, frontend, monitor, and all seven Celery lanes started with zero restarts, seven worker pings returned, and the public login redirect plus security headers passed.

- [x] **9C. Domain-row job reconciliation** (M; accepted in PR #1153 at `b2391c63`)
  Reconcile orphaned research, white-paper, idea, and counsel domain rows from durable background-job truth after worker restart/deploy.
  Evidence: restart tests for queued/running/succeeded/failed/cancelled jobs and production drill proving no domain row remains falsely pending or generating.
  Release evidence: PR #1153 makes durable background-job state authoritative for research, white-paper, idea-generation, and counsel-package domain rows; reconciles direct controls, API startup, and worker startup while preserving the newest attempt; refreshes counsel status messages; and adds the latest-subject index in migration `068`. Required backend, Postgres, frontend, CodeRabbit app, and authenticated CodeRabbit CLI checks passed. The worker-draining deploy advanced production to `b2391c63`; a research worker repaired two stale domain rows on startup, a rollback-only audit then reported `domain_rows_out_of_sync=0`, Alembic reported `068 (head)`, all seven Celery lanes ponged, every service remained running with zero restarts, and the public login redirect plus security headers passed.

- [x] **9D. Filing and drawing read-path integrity** (M; accepted in PR #1154 at `2adac10a`)
  Preserve claims-text fallback in DOCX, retain statutory dependent-claim preambles, and serve stored/cached formal drawing files without synchronously rendering the complete figure set per image request.
  Evidence: DOCX semantic regression tests, dependent-claim round trip, drawing-file cache/read tests, and concurrent latency smoke.
  Release evidence: PR #1154 falls back to specification claims text when structured rows are absent, preserves authored dependent-claim statutory subjects while updating parent numbers, rejects generic formal rows without a stored artifact, and serves stored formal files without rerendering. Required backend, Postgres, frontend, CodeRabbit CLI, and app review passed. The worker-draining deploy advanced production to `2adac10a`; Alembic remained `068 (head)`, all seven workers ponged, a stored formal SVG returned 200 with 9,463 bytes in 65 ms, the deployed 3D-printer dependent-claim formatter passed, and production contains 11 real specification-only claim fallback candidates.

- [x] **9E. Light-theme accessibility and crash recovery** (M; accepted in PR #1156 at `3fff5e08`)
  Move the verification banner and remaining raw 200/300/400 palette status text to semantic design tokens, neutralize unintended OS-dark `dark:` variants, and add route-level/top-level React error boundaries.
  Evidence: contrast guard, light and OS-dark screenshots, verification CTA E2E, and forced render-error recovery test.
  Release evidence: PR #1156 replaces raw status palettes across the remaining light-theme surfaces with semantic design tokens, neutralizes unintended OS-dark variants, adds a recoverable app-route error boundary, and adds a static contrast guard plus focused browser coverage. TypeScript, lint with zero errors, the production build, focused light/OS-dark and forced-render-error Playwright tests, backend static and Postgres schema gates, CodeRabbit review, and the required CI gate passed. The worker-draining deploy advanced production to `3fff5e08`; the live login shell rendered the intended off-white surface with readable foregrounds, Next.js reported `16.2.10`, Alembic remained `068 (head)`, all seven Celery lanes ponged, and the public route returned the expected login redirect.

- [x] **9F. Frontend dependency security update** (S-M; accepted in PR #1157 at `cd1980c0`)
  Upgrade the direct Next.js dependency to a non-vulnerable stable release and resolve the high-severity `fast-uri`, `hono`, and `linkify-it` transitive advisories without weakening the lockfile or forcing incompatible major upgrades.
  Evidence: `npm audit --omit=dev` reports zero high/critical vulnerabilities; frontend typecheck, lint, production build, and browser smoke pass; dependency behavior is reviewed for Excalidraw and Mermaid surfaces.
  Release evidence: PR #1157 updates the locked frontend dependency graph, including Next.js `16.2.10`, Excalidraw, Mermaid, Sentry, Tiptap, SWR, and related packages, while retaining a deterministic lockfile and explicit production-audit command. `npm audit --omit=dev --audit-level=high` reported zero high or critical findings; the remaining moderate advisories are upstream in Excalidraw's Nano ID chain and Next.js's PostCSS chain and require incompatible forced downgrades. TypeScript, lint with zero errors, production build, browser smoke, backend static and Postgres schema gates, CodeRabbit review, and the required CI gate passed. The production deploy at `cd1980c0` reported Next.js `16.2.10`, Alembic `068 (head)`, all seven Celery lanes, and the expected public login redirect; the subsequent 9E deploy preserved that dependency baseline.

- [x] **9G. Provider-binding execution integrity** (M, accepted 2026-07-11)
  Every workload advertised as provider-configurable must execute through the provider selected by its resolved model binding. A Gemini, Perplexity Agent, OpenAI, xAI, or Moonshot binding must never be sent through the Anthropic SDK.
  Evidence: provider-dispatch contract tests for idea generation, patent section drafting, and numeral suggestion; a static guard rejects direct `AsyncAnthropic` construction in those modules; one authenticated non-Claude production smoke records the requested and actual provider/model in the AI audit log.
  Branch follow-up: Provider Binding Execution routes idea generation, section drafting, and numeral suggestion through the shared structured-completion layer; parses the Perplexity Agent output-message array; takes optional idea/numeral output budgets from configuration and otherwise uses the selected model card; makes each completed structured-output response a quota-reserved, usage-audited attempt with no hidden JSON repair retry; records the provider-reported model separately from the requested binding; and requires Claude, Gemini, Perplexity Agent, OpenAI, xAI, Moonshot, and numeral-binding dispatch coverage in CI.
  Production evidence: provider-routing PR #1164 passed required CI and was present in production revision `d55a5bc0`. An authenticated user-scoped `idea_generator` smoke used a temporary `gemini / gemini-2.5-flash` binding against disposable patent `209`. Durable job `185` succeeded with one generated option and retained binding metadata showing `resolution_source=user_override`, requested provider `gemini`, requested model `gemini-2.5-flash`, and no substitution. AI audit row `1957` finalized successfully with actual model `gemini-2.5-flash`, 256 input tokens, 636 output tokens, and BYOK billing. The temporary binding was removed and the disposable patent was archived after verification.

- [x] **9H. Lightweight white-paper generation status** (S, accepted 2026-07-11)
  Poll a tenant-scoped status contract for live white-paper generation instead of re-downloading section bodies, base64 artwork, diagrams, scenes, and references every three seconds. Preserve pause, cancel, resume, retry, token/call progress, errors, and terminal full-detail refreshes.
  Branch follow-up: backend query-shape and response coverage prove the status route selects only lightweight white-paper/job columns and excludes heavy sentinels and generated payload fields; tenant-isolation coverage returns 404 to an unshared user. Focused Playwright coverage observes two completed timer polls, proves delayed pre-action responses cannot overwrite pause/resume/cancel state, and confirms terminal full detail refreshes exactly once. Focused backend tests, tenant-matrix freshness, frontend typecheck, lint, production build, Playwright, Python static/compile checks, workflow lint, and diff whitespace check pass.
  Production evidence: the status implementation from PR #1165 was present in production revision `d55a5bc0`. A synthetic running white-paper record on archived disposable patent `209` carried 601,316 bytes of sections and diagram payload. Its tenant-authenticated status response returned the complete progress, tokens, errors, controls, queue, binding, provider-call, and heartbeat contract in 694 bytes. A real Chromium session on the production Refine route observed three lightweight status requests over 10.5 seconds at intervals of at least 2.5 seconds and exactly one full-detail request. The synthetic job and white-paper rows were deleted and patent `209` was re-archived after verification.

- [ ] **9I. Explicit ownership, administrator workspace isolation, and NotebookLM evidence portability** (L)
  Make every portfolio, project, and patent private by default with one canonical workspace owner; retain `created_by` only as provenance; keep inventors and legal applicant/assignee identities separate; and move all cross-tenant administrator access out of ordinary patent routes into a dedicated, reasoned, audited **Admin > Customer workspaces** flow. Keep NotebookLM credentials personal, support selected versioned evidence snapshots for collaborators, and add NotebookLM plus typed source/AI preflight to guided Create. The current authorities and archived implementation-plan provenance are indexed by [`docs/OWNERSHIP_PRIVACY_AND_NOTEBOOKLM_EVIDENCE_PLAN.md`](OWNERSHIP_PRIVACY_AND_NOTEBOOKLM_EVIDENCE_PLAN.md).
  Evidence: additive ownership migration and production reconciliation; normal administrator APIs tenant-scoped; dedicated administrator access audit proof; refreshed 351-route tenant matrix; NotebookLM credential-isolation and snapshot-version tests; guided Create regressions for the brief-only 123-token and missing-AI-key failure modes; full CI; serialized deploy; and production acceptance journeys A1-A10 at one exact revision.
  Released foundation 2026-07-13: PR #1255 froze the two-user privacy baseline, added the privacy-safe ownership proposal audit, separated workspace owner/creator/collaborator/inventor/applicant identities, and refreshed route evidence. PR #1256 added migration `082`, nullable indexed canonical owner columns, deterministic backfill, and dual-write gates across API, import, promotion, generation, and default-container creation paths. PR #1259 added migration `083` and resolved 17 of 18 ownerless non-default parent containers from unanimous descendant ownership. The production audit at revision `1a1be6cc` reported 164/164 patents, 18/19 projects, and 16/18 portfolios with canonical owners; the default project and portfolio are intentional exceptions, while one non-default portfolio remains unresolved before cutover.
  Released administrator slice 2026-07-13: PR #1260 added **Admin > Customer workspaces**, dedicated reasoned search and read-only patent inspection APIs, correlation IDs, append-only `access` audits, canonical owner/creator/hierarchy/collaborator/artifact/job context, permission and secret-isolation tests, mobile browser coverage, and migration `084`. Required PR and exact-main CI, serialized worker-draining deploy, Alembic `084`, all 13 services, public smoke, authenticated production search/inspection, and direct audit-row verification passed at `1a1be6cc`. PR #1263 then removed the ordinary administrator ownership bypass, and PR #1266 added explicit audited ownership-transfer controls. PR #1267 adds reversible, reasoned, audited archive/restore controls for portfolios, projects, and patents, including effective archive visibility through parent scopes. The inspection banner now keeps the owner, reason, optional ticket/context, and correlation ID visible while reviewing customer work. Owner notifications, a separately designed recent-auth permanent-deletion path, the remaining ownerless portfolio decision, and A1-A10 acceptance remain open.
  Released canonical-kernel and evidence slice 2026-07-14: PR #1263 removed the ordinary administrator and creator fallbacks from the access kernel, normalized legacy owner grants, added audited ownership transfer, and made selected NotebookLM sources and notes immutable hashed versioned Evidence. Guided Create now validates real selected sources, persists exact snapshot references, distinguishes connector and AI-binding failures, and bounds and bulk-authorizes source selections. The final PR head `07ff9e12` passed all eight checks, including the 107-test tenant audit, Postgres schema drift, frontend/browser contracts, the required gate, and CodeRabbit review. The serialized worker-draining deploy advanced production to `2f864d6c`, Alembic `086`; all 13 services and eight Celery workers were healthy with zero active tasks. Authenticated acceptance confirmed abandoned Create run `18` renders a worker-stop failure and `Retry from white paper`, not a live timer, without starting a paid retry.
  Ownership gate history: the operator made the explicit portfolio `9` decision and the audited transfer to canonical owner subject `user 2` executed on production on 2026-07-14 (audit row `1108`); the privacy-safe audit then reported `unexplained_ownerless_total: 0`, zero legacy owner grants, and zero orphan owner-grant rows, with the historical shared Default hierarchy still excepted. Migration `090` closed that final exception on 2026-07-15 and validated all active-owner constraints. A1-A5, A9, and A10 acceptance are recorded; only A6 steps 4-5 and A7-A8 remain open (see the acceptance lines below), so item 9I must not be marked complete until they are recorded.
  Implementation follow-up 2026-07-14: migration `087` prevents any new or reactivated active ownerless portfolio, project, or patent while deliberately leaving intentional legacy exceptions untouched. Restore endpoints fail with an actionable ownership conflict, new default containers are always per-user, destination project authorization is enforced, and patents created manually, by import, promotion, or generation inherit the destination project's canonical owner. A stacked eligibility guard serializes administrator role/deactivation changes with ownership transfer and account closure, and refuses to make a user inactive or counsel while they own active workspaces. With portfolio `9` resolved, the remaining implementation work is final non-null validation and release evidence for these guards.
  Released hardening follow-up 2026-07-14: PR #1270 added recent-auth permanent deletion for archived administrator-managed scopes, two-phase managed-file quarantine, active-work blockers, preserved audit/usage ledgers, complete terminal-job cleanup, and owner-eligibility guards shared by administrator role changes and account closure. PR #1271 made manual inventory fallback a durable, inventory-pass-bound consent checkpoint that full-auto, Guided, advanced, refine, and Wave 1 continuation paths cannot bypass. Required PR and exact-main CI passed, including the real backend browser contract, Postgres schema/tenant suite, frontend production build and browser smoke, static guards, CodeRabbit, and the required gate. The serialized deploy drained every worker lane, advanced production to `37582515` at Alembic `087`, restarted all 13 services, and passed public smoke. Authenticated production inspection proved Create run `18` now reports the worker-stop failure and `Retry from white paper` while preserving completed work. No paid retry or destructive production deletion was performed.
  Released ownership-notification follow-up 2026-07-14: PR #1274 retired the historical owner collaborator role from runtime, APIs, invitations, and current database state; made any active scope owned by an inactive account fail the privacy-safe ownership audit; and added durable configurable owner notifications that resolve the active recipient at delivery time without storing email addresses. PR CI run `29329002187` and exact-main run `29329801684` passed. The serialized deploy advanced production to `b61f9681` at Alembic `089`, all worker lanes and public smoke passed, and the controlled Gmail test above proved the delivery path. The stricter production audit now reports three active scopes under one deactivated disposable owner, so `passes_release_gate=false` until the operator explicitly transfers or archives those records. No production workspace was mutated during this audit.
  Production trace 2026-07-14: before the audited transfer, both projects under portfolio `9` were owned by canonical owner subject `user 2`; all ten substantive patents came from that user's completed generation run `5` and retained the same owner and creator. The sole conflicting descendant was archived patent `207`, `NORTH-STAR ACCEPTANCE CLAIM REVIEW - SAFE TO ARCHIVE`, created by the local administrator as a dated acceptance fixture and archived three minutes later. That evidence supported the operator's subsequent transfer decision recorded above. A newly invited, unverified external account then saw zero patents, projects, portfolios, files, and jobs; title search returned no match; and direct requests for patent `195`, project `7`, and portfolio `9` returned tenant-safe `404` — the A1 isolation preflight, since superseded by the full A1 run below.
  Acceptance 2026-07-14: A1-A4, A9, and A10 were executed against production `2f864d6c` with three disposable accounts (Owner A / Collaborator B / Site Admin) — 39/39 API-executable checks passed (private-by-default isolation, viewer/editor/revocation sharing, canonical transfer with full-chain access loss, audited administrator separation with reversible archive/restore, guided-Create typed preflight block, and export legal-identity boundary), all disposable data was hard-deleted, and the ownership release-gate audit re-verified green afterward. A5-A8 (private-live / shared-snapshot / external-shared NotebookLM) require a connected Google/NotebookLM profile and are covered by the archived manual operator checklist [`docs/archive/acceptance/A5_A8_NOTEBOOKLM_CHECKLIST.md`](archive/acceptance/A5_A8_NOTEBOOKLM_CHECKLIST.md); item 9I stays open until they are executed and recorded. Full detail is retained in [`MVP-RELEASE-EVIDENCE.md`](../.planning/archive/reference/mvp-milestones/MVP-RELEASE-EVIDENCE.md).
  Automated A5-A8 evidence follow-up 2026-07-14: focused Postgres tests cover per-user NotebookLM route isolation, collaborator and administrator denial for private live notebooks, immutable versioned snapshot import/deduplication, viewer grant and revocation, generation from an imported snapshot after connector loss, per-user external-share verification and revocation without snapshot deletion, untrusted-source fencing, real corpus counts, and inventory grounding in source text. This closes the automated contract gap only; item 9I and A5-A8 production acceptance remain open until the independent Google accounts and browser checklist are completed.
  Production A5/A6 acceptance follow-up 2026-07-14: PR #1279 exposed project sharing and patent File / Access controls, passed PR CI run `29343678723`, exact-main CI run `29344754486`, and CodeRabbit approval, then deployed through the serialized worker-draining path at `cb79db66`. A5 passed against non-confidential NotebookLM fixture `10d61a8e-ca36-40cc-b20a-aa644d43ecee`: Owner A queried the Frost-Lark source; viewer grant `164` let Collaborator B reach patent `234`, but the live notebook remained `Owner-only live source` with no delegated profile or query control; reasoned administrator inspection audit `1206` / correlation `e5afe3da-e58e-4adc-becf-b9ce62038650` exposed no NotebookLM control. A6 steps 1-3 passed: source rows `12-14` are version-1, 64-character hashed snapshots and Collaborator B could read their exact content. A6 steps 4-5, A7, and A8 remain open because they require intentionally disconnecting the owner's live profile, a paid/provenanced generation run, and an independently connected Google account. Item 9I remains open.
  Disconnect-control follow-up 2026-07-14: PR #1281 added a first-class per-user NotebookLM connection card in Settings and `DELETE /api/notebooklm/auth`. Credential profiles are transactionally staged, removal is audited without secrets, another user's profile is untouched, and imported Evidence snapshots remain readable and generation-ready. The route is included in the tenant-access matrix; focused backend and Settings browser tests, bot review, all required CI, serialized deployment, public smoke, and an unauthenticated `401` route probe passed at `f6624cf8`. This releases the control needed for A6 step 4 but does not claim A6 steps 4-5: production acceptance still requires intentionally disconnecting the owner's live profile and running paid generation with exact snapshot-version provenance. A7 and A8 also remain open.
  Ownership-closure follow-up 2026-07-15: PR #1294 added migration `090`, reconciled the historical shared Default hierarchy without guessing ownership, moved foreign archived patents into private archived holding scopes, validated `ck_portfolios_active_owner`, `ck_projects_active_owner`, and `ck_patent_projects_active_owner`, and added the production-shaped migration regression to CI. The serialized deploy advanced production to `090 (head)` at revision `c1a3df17`; all active ownerless counts are zero and the release-gate audit is green. This closes the remaining implementation work described in the migration and ownership paragraphs above. Item 9I remains open only for A6 steps 4-5 and A7-A8 production acceptance.

- [ ] **9J. Lifecycle clarity and default journey** (M)
  Keep Create as the single global entry action and Ideate, Research, Draft,
  Refine, and File as the five patent stages. Clarify the generated-material
  handoff, make Research one evidence/reference/findings loop, make Refine open
  on the current finding or artifact, and preserve project/back-navigation
  context. Do not change the stage derivation model. Plan and acceptance tests:
  [`BETA_UX_IMPLEMENTATION_2026-07-20.md`](archive/ux/BETA_UX_IMPLEMENTATION_2026-07-20.md#tranche-6-lifecycle-language-and-default-journey).
  J1 was released in PR #1330 at `28746df9`: Ideate defaults to Ideas,
  Research to Search, Refine to Claim review, and prepared improvement work
  opens the explicit Draft review route. J2 was released in PR #1331 at
  `0ded9727`:
  Claim Review now keeps the selected claim and its findings together, exposes
  durable apply, dismiss-with-reason, targeted rerun, and affected-claim
  actions, shows the latest support, eligibility, and language reports, and
  moves job detail behind one Background activity disclosure. J3 was released
  in PR #1332 at `9197d8c7`: Search is a single task-led intake surface, each Reference
  opens its source and affected claim, generated claim language is previewed
  before an exact apply with a restore point, dismissals persist a reason, and
  rechecks use durable Research jobs. Remaining 9J work is the complete
  production acceptance journey. J4 was released in PR #1343 at `94d68bec` and
  converges generated
  run links on `/create/:runId`, generated-file navigation on `/files`, source
  language on Intake, Sources, Evidence, and References, and persisted legacy
  project names through migration `100`. At that release production was at
  Alembic `102`, so the remaining gate became the complete paid production
  acceptance journey described above, not implementation, merge, migration, or
  deployment.

- [x] **9K. Invite-beta inference allowance** (M)
  Grant each eligible invited user one idempotent, administrator-configured
  platform credit allowance through the existing credit ledger. Preserve daily,
  per-run, wallet, and platform-global spend enforcement; keep BYOK usage
  accounted but not platform-debited; show funding source and recovery before
  work starts. Plan and acceptance tests:
  [`BETA_UX_IMPLEMENTATION_2026-07-20.md`](archive/ux/BETA_UX_IMPLEMENTATION_2026-07-20.md#tranche-7-invite-beta-inference-allowance).
  Implementation follow-up: the invite grant is now a database-configured,
  one-time credit-ledger entry with a stable unique idempotency key. Password
  and Google invite redemption grant atomically; concurrent and replayed
  callbacks cannot grant twice. Create preflight, Jobs, and Settings > Plan
  identify personal-key versus included-credit funding and give the same three
  recovery actions. Admin > Billing owns plan identity, limits, credits,
  entitlements, and Stripe prices; Admin > Spend limits owns platform safety
  ceilings and the beta-grant policy; Admin > Users owns plan assignment,
  one-off grants, and grant history. Fresh-Postgres migration,
  auth, quota, schema, tenant-matrix, TypeScript, lint, and 54 focused browser
  journeys are covered. Acceptance required the disabled-by-default production
  policy to be configured and a bounded account to prove one grant, one
  matching debit, and operational allowance exhaustion without extra spend.
  Operational exhaustion means the remaining balance cannot fund the next
  priced workload and the provider is not called; it does not require reducing
  the wallet to exactly zero.
  Production configuration audit 2026-07-21: no `beta_initial_grant_*` runtime
  overrides exist and the credit ledger contains zero initial beta grants. The
  read-only audit did not enable the policy, create an account, or spend credits.
  Production acceptance 2026-07-24: PR #1383 added the missing
  platform-wide ceiling control to **Admin > Spend limits**, with focused
  Playwright coverage, TypeScript, lint, production build, PR CI, exact-main
  CI, serialized deployment, and authenticated production acceptance at
  `ec999a6d`. Final production policy uses `ai_registry_mode=byok` with managed
  platform keys enabled, a verified environment-backed Claude credential,
  targeted invitations, beta plan assignment, a versioned five-credit initial
  grant, a `$5.00` platform daily ceiling, `$5.00` per-user daily spend limit,
  `$5.00` per-run generation cap, 25 daily calls, 250,000 daily tokens, and
  both administrator exemptions disabled.

  Disposable user `27` received one idempotent `5.000000` grant and one
  matching platform-billed `invention_inventory` debit of `0.047340` credits
  against successful Claude audit row `2341`. Repeated sign-ins retained one
  `beta_initial_grant:user:27` ledger row. A second bounded account, user `28`,
  used temporary policy version `3` with `3.020000` credits, produced one
  successful platform-billed Claude call and a `0.048315` debit linked to audit
  row `2342`, then rejected the next call before provider spend with
  `2.971685 available, 3.000000 required`. Its call and token counters remained
  at one call and 1,193 tokens after the blocked retry, satisfying the defined
  operational-exhaustion criterion without claiming a zero balance. The normal
  five-credit targeted policy was restored as version `4`.

  A separate global-ceiling drill temporarily set the platform limit to
  `$0.090000` while measured daily platform spend was `$0.095655`. User `27`
  still had enough wallet credit, but the next candidate-regeneration request
  was rejected before provider spend with the platform-ceiling message. Its
  usage remained one call and 1,180 tokens. The platform ceiling was restored
  to `$5.000000`; final measured spend was `$0.095655`, leaving `$4.904345`.
  The production Credits and Billing support topics were reviewed and expose
  included-credit, personal-key, plan, recovery, and support routes.

- [ ] **9L. Multi-identity authentication and Microsoft/DXC SSO** (L)
  Generalize external identities before adding Microsoft Entra OIDC. Preserve
  invite-only access by default, validate and allowlist Entra tenants, keep DXC
  as a tenant policy rather than a new protocol, and keep application sign-in
  separate from AI API credentials and billing. Plan and acceptance tests:
  [`BETA_UX_IMPLEMENTATION_2026-07-20.md`](archive/ux/BETA_UX_IMPLEMENTATION_2026-07-20.md#tranche-8-authentication-and-enterprise-sso).
  I1 released in PR #1334 at `f011aacd`: migration `098` adds `user_identities`, keyed
  by provider, issuer, and stable subject, with one primary identity per user
  and deterministic backfill of valid legacy Google links. Google callbacks
  read the identity table first, dual-write authentication metadata, and refuse to replace
  the legacy subject merely because an email matches. Additional identity
  sign-in/linking remains disabled until the read cutover. Account closure
  removes linked identities while retaining a system identity-link audit event.
  A real isolated-schema migration test, fresh-Postgres upgrade, downgrade and
  re-upgrade, schema drift, OAuth invitation/replay, account closure, admin
  authentication, authorization, verification, tenant-matrix, and import guards
  passed locally and in CI. The serialized production deployment reached
  `f011aacd` at Alembic `098`; reconciliation reported two identity rows, two
  valid legacy Google projections, and zero non-primary, orphaned, or projection-
  mismatch rows.
  I2 release evidence: PR #1335 merged at `09186919`; migration `099` adds
  encrypted database-managed Microsoft Entra configuration with environment fallback, single-tenant or
  allowlisted-tenant policy, optional tenant/domain-scoped JIT provisioning,
  and non-admin default roles only. The OIDC authorization-code flow uses PKCE,
  state, nonce, tenant-specific discovery and signing keys, strict issuer,
  tenant, audience, signature, and lifetime checks, and `openid profile email`
  without Graph access. Invited users can sign in; matching email alone cannot
  link an existing account; a recent signed-in session can explicitly add a
  Microsoft identity without replacing an existing Google primary. Admin,
  login, and Security surfaces expose provider status, configuration, callback
  recovery, and connected identities without returning secrets or stable
  subjects. The fresh migration round-trip and schema drift guard, focused
  69-test authentication packet, Python static checks, TypeScript, lint, production
  build, and focused 12-test browser packet passed locally. PR CI run
  `29801947158` and exact-main run `29802583621` passed the required gate,
  including the complete Postgres, tenant-isolation, auth/provider, frontend,
  and real browser-contract packets. The serialized deploy advanced production
  to `09186919` at Alembic `099`, restarted every worker lane, and passed public
  login and internal health checks. The public provider contract reports Google
  enabled and Microsoft disabled because no production Microsoft profile exists.
  Item 9L remains open only for administrator configuration and a real DXC
  identity plus Conditional Access, sign-in/sign-out, and audit acceptance.

- [ ] **9M. CI host credentials live in operator env files that nothing scans or attests** (S)
  The shared CI autoscaler authenticates to GitHub with a fine-grained PAT held in plaintext as `GH_TOKEN` in `/etc/dell-ci-autoscaler/common.env` on VM 114 (`patent-studio-ci-vm114`). That file is private operator config, deliberately outside the repository, exactly like `/etc/patent-studio/backup.env` in 4D. The credential is not weakly held — it is `0600 root:root`, which is the state `docs/operations/ci-runners-handoff.md` already specifies — but nothing anywhere proves that, and no check would notice if it stopped being true.
  Audit 2026-07-31: file mode was already correct and the token appears nowhere in the repository or in any of 3,036 commits of history, verified by digest comparison rather than by eye. Three further plaintext copies of the same token were found on the host, two in `/opt/autoscaler-rollback-*` and one in an operator's shell history; the rollback directory was world-traversable at `0755` and is now `0700`. The token carries `administration=write` and the autoscaler serves ten repository configs, so its blast radius is the whole Dell CI fleet, not this repo alone.
  Why file mode is not the control that matters: patent-studio CI jobs run on a persistent runner on that same host as `github-runner`. Until 2026-07-31 that account held `NOPASSWD: ALL` sudo, so any workflow step could `sudo cat` the fleet PAT; that grant was removed the same day (the decision is recorded in `/etc/sudoers.d/github-runner` on VM 114 — no rules, deliberately — but has not yet been mirrored into a repo runbook). The remaining privilege boundary is still real: `github-runner` is in the `docker` group (root-equivalent on a host Docker daemon) and burst runners launch `--privileged`. A workflow that reaches a self-hosted runner can still reach host storage through Docker even without sudo.
  Detection, corrected 2026-08-05: when this was written there was no `gitleaks`, `trufflehog`, `detect-secrets`, or pre-commit equivalent in CI, so a committed credential produced no alert from any source. That gap is closed for the repository itself: `scripts/ci/secret_scan.sh` runs gitleaks over the whole working tree as the required `Secret Scan` lane on every run, including documentation-only commits. GitHub secret scanning and push protection remain disabled on this private repository, which needs a paid licence and stays deferred. What no scanner can reach is the off-repository operator config this item is actually about — `/etc/dell-ci-autoscaler/common.env` is invisible to CI by design — so "the token is not in history" is still a measurement taken once by hand rather than a property anything maintains.
  Why P1 rather than P0: no public-beta user can reach VM 114 or open a same-repo pull request, so this does not gate public signup on user-facing risk. It belongs before invite links circulate because that is when outside counsel and additional collaborators come into contact with the project, and because this credential can administer the repositories that deploy production, which makes it a supply-chain path rather than a local inconvenience.
  What would have to be true before public beta: CI credentials are scoped to the smallest permission that mints runner registration tokens and are set to expire rather than live indefinitely (rotation runbook landed as #1612; the live token still needs rotating); a check asserts ownership and mode on every operator env file on every CI host and fails loudly instead of relying on someone remembering; a CI-side secret scanner catches committed credentials (GitHub Secret Protection needs a paid licence and is deferred); the `docker` group / `--privileged` path on the CI host is either removed or accepted with a documented residual risk, and the sudoers decision on VM 114 is mirrored into a repo runbook so a rebuild cannot quietly restore `NOPASSWD: ALL`; and the rotation procedure has been rehearsed once, because rotating this token stops all burst CI capacity if it is done wrongly.
  Host privilege boundary mirrored into the repository 2026-08-05: [`operations/ci-runners-handoff.md`](operations/ci-runners-handoff.md#host-privilege-boundary-on-vm-114) now records that `github-runner` deliberately holds no sudo rules, that the autoscaler env file is `0600 root:root` and only an operator can verify it, and that the `docker` group plus `--privileged` burst runners remain an accepted residual risk while the repository is private and fork pull requests stay on GitHub-hosted runners. It also gives the post-rebuild command to re-check the first two, so a reimaged VM cannot quietly restore `NOPASSWD: ALL`.
  Remaining: rotating the live token, rehearsing that rotation once, and a standing attestation of permissions and freshness on every off-repository operator config file. In-repository secret scanning is already covered by the required `Secret Scan` lane, as corrected in the detection paragraph above.
  Recurring theme, not a second incident: this is the same defect class as 4D. In both cases a real credential or destination lives in operator-only configuration that no test, CI job, or deploy gate can see, and in both cases the repository is structurally unable to validate it. 4D's stale value destroyed six consecutive nightly backups in silence; this one has caused no harm yet and was found only because someone went looking. The shared lesson is that "operator config nothing validates" is a category needing a standing control — permission and freshness attestation for every off-repo config file — rather than a series of one-off findings. Cross-links: item 3 production secrets, item 4D operator config drift.

## P2 — First weeks of beta, in parallel with users

- [ ] **4G. Off-host backup retention is unmanaged** (XS as scoped below; the accepted answer is larger)
  `BACKUP_RETENTION_DAYS=14`, and the `BACKUP_MIN_RETAINED=7` floor added in #1599, prune only `/var/backups/patent-studio` on production. Nothing prunes the destination.
  Evidence 2026-07-31: `dellr740:/srv/backups/patent-studio` holds four backups totalling 1.1 GB, and no cron entry or systemd timer on that host references `/srv/backups`. The filesystem has 193 GB free against roughly 300 MB per night, so at today's size this is about 1.8 years of headroom.
  Why P2 in the 2026-07-31 audit: on those numbers it was a capacity item with a long fuse, not a data-loss item. Two things would raise it: real user data making each night larger than 300 MB, and the published retention statement in 4F describing a 14-day cycle that the audit found only on the production-host copy. Reconfirm capacity and retention before relying on that dated priority.
  Answered with an encrypted off-machine layer 2026-08-05, larger than the original XS scope: rather than teaching the rsync destination to prune, `scripts/restic_backup.sh`, `scripts/restic_restore.sh` and `scripts/restic_retention.sh` add Restic backups to a dedicated Synology share, with 14 daily / 8 weekly / 12 monthly retention, `restic check` before any destructive maintenance, and no pruning on a schedule. This also answers 4F's encryption-at-rest question for the new layer, since Restic encrypts client-side. Repository audit, secret conventions, honest limits, and the LAN deployment handoff are in [`operations/OFFSITE_BACKUPS.md`](operations/OFFSITE_BACKUPS.md). Contract tests are in `backend/tests/test_restic_offsite_backup.py`, with the Restic binary stubbed.
  Remaining: everything requiring the LAN. Nothing has run against the real NAS, so this is implemented, not deployed. The handoff covers the Synology share and least-privilege account, the SFTP key, the 1Password item, `restic init`, a first snapshot, a proven restore, and the timers. Note the honest limits recorded there: the DS223j provides off-machine separation, not verified redundancy or immutability, and the unencrypted on-host rsync copy still exists until operators retire it.

- [x] **10. Export unification + completion notices** (S, released in PR #823 at `6fa60c8b`) — Home adopts the queued pattern; queued DOCX exports show an immediate notice with Jobs and Files follow-through. CI passed, CodeRabbit approved, the frontend-only production deploy preserved the live worker job, and production smoke passed at short revision `6fa60c8`.
- [x] **11. Glossary pass** (S, released in PR #822 at `80a004b9`) — `lib/glossary.ts`; fixed the dual "Evidence" collision by making the global durable-source route Source Library, kept patent-scoped Evidence distinct, aligned Filing copy to patent-set wording, and added the `/files` redirect into the canonical Files surface. Branch-tested, CI-passed, deployed, and production-smoked at short revision `80a004b`.
- [x] **12. Runs consolidation** (M, released in PR #825 at `06aa04f1`, release state recorded in PR #826 at `4835bdca`) — `/generate/[runId]` is reachable from Jobs; paid-for generation runs have an explicit `Open run` path and remain re-findable after navigation. Focused backend/API, frontend typecheck/lint, Jobs E2E, generation-run controls E2E, CI, deploy, and production smoke passed at short revision `06aa04f`.
- [x] **13. Support + feedback loop** (S, released in PR #835 at `e558bb24`) — answered support address, in-app feedback affordance, lightweight status page, and recovery links to Jobs, Files, and Settings. Focused support route, sidebar, typecheck, lint, north-star smoke, CI Required Gate, deploy, live health, route, container, and content smoke passed.
- [x] **14. Load sanity pass** (S, harness released in PR #837 at `3b534e29`, accepted 2026-07-10 against production `2441b827`) - bounded Locust runs used two real active identities at two users per second for 30 seconds. The read-only pass completed 402 requests with zero failures; the mutation pass completed 411 requests with zero failures, including two durable generation creates/starts, eight status polls, and complete cancel/delete cleanup. The token-pool harness preserves per-user rate limits, writes no credentials to reports, and the temporary target project produced zero patents before deletion.
- [x] **15. Notice/header unification sweep** (S, accepted in PR #1184 at `4a959d56`) - Filing + Documents onto `PageHeader`; one `<Notice>` replacing the 25 bespoke banners. Files were released in PR #828, Filing in PR #829, Jobs in PR #830, Filing Waves in PR #831, Documents ledger states in PR #833, Patents Index queued-export/error notices in PR #842, Draft claim-expansion job/error notices in PR #844, Draft specification view humanize job/error notices in PR #846, editable Draft specification editor humanize job/error notices in PR #848, Draft claims risk-scoring job/error notices in PR #850, Refine Build PRD job/error notices in PR #852, Refine Claim Review action-failure notices in PR #856, Refine work-area active tab clarity in PR #858, NotebookLM Research notice unification in PR #891, first-run Generation launcher feedback cleanup in PR #894, feature-flagged Import route header/error cleanup in PR #896, Settings Provider Key Feedback in PR #898, Intake / Source Library feedback in PR #900, Filing Package Error Feedback in PR #903, Admin Users / Action Feedback in PR #904, Admin Users / Directory Load Feedback in PR #947, Project Workspace / Load Feedback in PR #949, Generation Run Monitor Feedback in PR #951, Auth Gateway Notice Feedback in PR #953, Manual Create Feedback in PR #955, Patent Reader Load Feedback in PR #958, Billing Action Feedback in PR #907, Settings Account Feedback in PR #909, Settings AI Usage Feedback in PR #911, Research Import Failure Feedback in PR #914, Quick Capture Failure Feedback in PR #916, White Paper Generator Failure Feedback in PR #918, Drawing Workspace Feedback in PR #920, Discussion Feedback in PR #922, Prior-Art Report Feedback in PR #924, Patent Evidence Source Feedback in PR #927, Draft Generator Feedback in PR #931, Research Search / Support-map Feedback in PR #933, Draft Claims Job-status Feedback in PR #935, Files Research/Review Preview Feedback in PR #937, Settings Model Routing Feedback in PR #939, Settings Model Routing Row Feedback in PR #941, Files Feed Failure Notice in PR #943, and Revision Safety Feedback in PR #945. The Documents file ledger now moves loading, empty, and no-match states onto `Notice`; the Patents ledger, Draft claim-expansion panel, Draft specification view, Draft specification editor, Draft claims risk-scoring feedback, Draft Claims background-job status feedback, Files research/review preview detail failures, Files partial-feed failure feedback, artifact and document preview restore-safety checkpoint feedback, Draft Generator terminal feedback, Refine Build PRD feedback, Refine Claim Review action failures, NotebookLM Research success/error feedback, Discussion load, create, and reply failures, prior-art References and report feedback, Patent Evidence source feedback, Generation launcher source/auth/create failure feedback, Generation Run Monitor load/action/run-error feedback, Auth Gateway login/register/recovery/verification feedback, manual create project-list and submit failures, Patent Reader load failures, Import route parse/commit failures, Settings AI invalid-key, unverified-key, decryption, billing action, account identity, formal-name warning, password-change, usage load, empty usage, audited-call failure, model-routing load feedback, and model-routing row update feedback, Research import failure feedback, Research search and support-map load failure feedback, Quick Capture save failures, White Paper estimate and generation failures, Drawing workspace job and action failures, Intake / Source Library load, move-action, and source-action failures, filing package readiness/history/selection/start feedback, and admin user action, directory-load, and Project Workspace load failures now use `Notice` for queue/update/error feedback while preserving Jobs/Files/Evidence, provider-key behavior, billing upgrade behavior, source taxonomy, filing package controls, reader behavior, and user-management behavior. Selected work-area tabs no longer look like dead action links.
  Release follow-up: Patent Reader Load Feedback in PR #958 moves full reader load failures onto shared `Notice` with retry coverage.
  Release follow-up: Jobs / Live Status Stalled Notice in PR #960 moves stalled heartbeat warnings onto shared `Notice` alert feedback while preserving queued/running job state display.
  Release follow-up: Draft / Revision History Feedback in PR #962 moves section, claim, and full-patent revision history success/error feedback onto shared `Notice` rendering.
  Release follow-up: Patent Intake Feedback in PR #965 moves patent-scoped Attached Intake load failures and promotion success feedback onto shared `Notice` rendering.
  Release follow-up: Home / Project Action Feedback in PR #967 moves Home project-board action errors and queued DOCX success feedback onto shared `Notice` rendering while preserving Jobs and Files follow-through links.
  Release follow-up: Global Paste Feedback in PR #969 moves app-wide paste capture prompt, success, and failure feedback onto shared `Notice` rendering while preserving native editable paste behavior and Intake capture.
  Release follow-up: Home / Dead Create Project Dialog Removal in PR #972 at `1bb0f0ce` removes an unreachable legacy project-creation dialog so the Home `New patent` dialog remains the single manual blank patent/project creation surface.
  Release follow-up: Drawing Canvas Error Feedback in PR #975 moves drawing canvas load/setup failures onto shared `Notice` rendering while preserving Back to Draft / Back to Projects recovery.
  Release follow-up: White Paper Preview Feedback in PR #977 moves white-paper partial output, recoverable illustration warnings, export/action updates, and Files preview load failures onto shared `Notice` rendering while preserving generation, export, humanize, and artifact-open behavior.
  Release follow-up: Reference Numeral Feedback in PR #1043 moves reference numeral panel load/duplicate states and suggestion apply/error states onto shared `Notice` rendering while preserving drawing canvas, numeral CRUD, AI suggestion, and export behavior.
  Release follow-up: Draft / Inventor Editor Feedback in PR #1046 moves inventor save/search failures onto shared `Notice` alert rendering while preserving ordered free-form inventors, user search, reader inventor output, and filing readiness behavior.
  Release follow-up: Refine / Draft Improvement Feedback in PR #1047 moves failed review runs, prepared-run start errors, and snapshot-applied confirmations onto shared `Notice` rendering while preserving review sessions, snapshots, apply/retry actions, and revision history behavior.
  Release follow-up: Patent Workspace Load Feedback in PR #1048 at `9940e6c6` moves top-level patent workspace load/not-found failures onto shared `Notice` alert rendering while preserving the Back to Projects recovery path.
  Release follow-up: Generation Origin Recovery Feedback in PR #1050 at `44611186` moves failed-run patent shell recovery messaging onto shared `Notice` rendering while preserving Open run, Resume drafting, recovery-run creation, and Jobs follow-through behavior.
  Release follow-up: White Paper Versions Feedback in PR #1051 moves saved-white-paper ledger, detail, rename, and delete errors onto shared `Notice` rendering while preserving version history, preview, generation, and artifact actions.
  Release follow-up: Patent Export Panel Feedback in PR #1052 at `e8450452` moves patent File-stage export errors onto shared `Notice` alerts while preserving DOCX, drawings PDF, filing ZIP, filing preview, stale-export badges, and upgrade gating behavior.
  Release follow-up: Dead Patent Workspace Surface Removal in PR #1055 at `a9d64ff2` deletes unused Move dialog and Scratchpad editor components so retired project-move and scratchpad vocabulary cannot reappear while preserving live project-board move controls and the Draft section taxonomy.
  Release follow-up: Prior-Art Reference Suggestion Feedback in PR #1056 at `648fb6d2` moves per-reference AI suggestion failures onto shared `Notice` alert rendering while preserving reference cards, inventor comments, citations, module navigation, and prior-art report exports.
  Release follow-up: Artifact Upload Zone Feedback in PR #1057 moves Files & Artifacts upload validation failures onto shared `Notice` alert rendering while preserving drag/drop, browse upload, artifact rows, repository import, and preview behavior.
  Release follow-up: Drawing Upload Feedback in PR #1059 at `c25c96eb` moves Draft drawing upload failures onto shared `Notice` alert rendering while preserving the upload input, formal drawing generation, drawing cards, and existing drawing action notices.
  Release follow-up: Patent Archive Dialog Feedback in PR #1060 moves archive-confirmation failures onto shared `Notice` alert rendering while preserving the destructive confirmation dialog, archive action, and post-archive navigation behavior.
  Release follow-up: Idea Option Generation Feedback in PR #1061 at `e33b6bf7` moves Ideate option-generation queue failures onto shared `Notice` alert rendering while preserving source selection, option count, queued-job success feedback, and Jobs follow-through.
  Release follow-up: Draft Claims Import Feedback in PR #1062 moves claim load and import-from-spec failures onto shared `Notice` alert rendering while preserving empty-claims import, claim editing, background claim jobs, revision history, and risk scoring behavior.
  Release follow-up: Research Reference Extraction Feedback in PR #1063 moves failed Research-run reference extraction onto shared `Notice` alert rendering while preserving Research runs, References handoff, prior-art report navigation, and draft-improvement seeding.
  Release follow-up: Patent Intake NotebookLM Feedback in PR #1064 moves patent-scoped NotebookLM create/sync/unlink feedback onto shared `Notice` rendering while preserving Attached Intake, Evidence promotion, and NotebookLM workspace linking behavior.
  Release follow-up: Dead Patent Outputs Panel Removal in PR #1065 deletes the unused patent outputs panel so retired generated-file and draft-drawing UI cannot conflict with the current File stage, Files ledger, Export panel, or drawing preview surfaces.
  Release follow-up: Research Run Failure Feedback in PR #1066 moves failed Research-run cards onto shared `Notice` alert rendering while preserving Research run intake, chart badges, citations, cancel controls, and References handoff actions.
  Release follow-up: Artifact Context Limit Feedback in PR #1067 moves Refine draft-improvement context-limit blocking feedback onto shared `Notice` alert rendering while preserving artifact selection, token accounting, and disabled-run protection.
  Release follow-up: Repository Import Feedback in PR #1069 moves repository-ingestion request and stream failures onto shared `Notice` alert rendering while preserving the Files & Artifacts upload zone, repository exclusion controls, ingestion progress, success summary, and retry/close actions.
  Acceptance closure: PR #1184 removes the unused legacy `ErrorBanner`, replaces the remaining raw red/green status utilities with semantic status tokens, and extends the required UI guard to reject the retired component, raw status colors including Tailwind `950` shades, and route regressions from shared `PageHeader`. The guard parses TSX to resolve aliased imports and rendered identifiers. TypeScript, lint with zero errors, the 36-view desktop/tablet/mobile north-star screenshot smoke, all required PR and exact-main CI gates, Gemini and CodeRabbit feedback, the worker-draining deploy, Alembic `071`, all seven Celery pings, and public smoke passed. Authenticated read-only production acceptance covered Files, Filing, Filing Waves, prior-art report, white-paper, reader, and repository-import surfaces at desktop and mobile widths with no login fallback, horizontal overflow, console errors, or page errors.
- [x] **15A. W4 top-level page-header consistency** (S, released in PR #1348 at `16c9debb`) — make Create, Projects, Idea library, Patents, and Filing use one shared top-level header contract. Today Projects and Idea library use the designed display treatment with a short brass dash and uppercase introductory annotation, while Create has a bespoke header and Patents/Filing use plain lowercase introductions without the dash.
  Acceptance: every named route renders exactly one shared `PageHeader` with consistent title typography, uppercase dashed introductory copy, spacing, and action alignment; bespoke top-level header markup is removed; wording remains route-specific and concise; desktop and 390 px mobile screenshots show matching hierarchy, no clipped copy, and no horizontal overflow; focused browser coverage asserts one `h1`, the expected introduction, and stable action placement on all five routes.
  Release evidence: PR #1348 removed the bespoke top-level title blocks and put all five routes on the shared `PageHeader` contract, with one route-owned title, concise introduction, and aligned actions at desktop and mobile widths. PR #1349 refreshed the frontend lockfile required by the production dependency gate. Exact-main CI run `29863380882` passed, then the serialized worker-draining deploy advanced production to `e75a6344`; `/health`, Alembic `102 (head)`, and all 14 Compose services were healthy.

- [x] **15B. W5 visual craft and plain-language guardrails** (M, released in PR #1350 at `caebb33f`) — apply the supplied design-review craft pass without changing routes, lifecycle stages, product taxonomy, or feature scope. Replace mechanism language with user outcomes, standardize on a curated Lucide icon set without generic sparkle/emoji markers, remove component-level raw palette scales in favor of design tokens, and keep live status beside the project, patent, or artifact it describes while Jobs remains the detailed ledger.
  Acceptance: rendered application copy does not expose `durable`, `entrypoint`, `mining`, `synthesis`, `generation run`, `theater`, `background work`, or `run configuration`; no rendered surface uses sparkle or decorative emoji iconography; component and library code uses semantic tokens rather than raw Tailwind color scales; project-scoped patent creation is visible with its state and direct progress route before any patent is drafted; existing inline active-job status remains visible on Create, patent, white-paper, research-paper, drawing, and idea work areas; TypeScript, lint, production build, the visual/copy guard, focused backend coverage, and the complete browser smoke pass; production release still requires green PR and exact-main gates plus the serialized deploy and route smoke.
  Release evidence: PR #1350 removes mechanism-heavy rendered copy, replaces generic sparkle iconography with task-specific Lucide icons, converts component-level raw palette utilities to semantic tokens, keeps active work visible beside its project or artifact, and extends the required static guard across application, component, and library code. Focused backend repository-review coverage, TypeScript, lint with zero errors, production build, the visual/copy guard, and the complete 239-test browser smoke passed. CodeRabbit approved the corrected source-scope, mode-aware copy, project-progress, and guard behavior. PR CI run `29869428355` and exact-main run `29870460928` passed the required gate. The serialized worker-draining deploy advanced production to `caebb33f` at Alembic `102`; all 14 Compose services were running, and health, login, product, and data-handling routes returned 200.

- [x] **16. J3 candidate checkpoint** (L, released in PR #870 at `4f841b22`) — accept/reject/defer candidate review inside the generation run before drafting fan-out; pull forward if the beta pitch leads with portfolio-from-gaps.
  Evidence: PR #870 added the `/generate/:runId` candidate checkpoint, backend PATCH guard, row-lock protection against drafting races, focused backend tests, and focused Playwright coverage. CI Required Gate and CodeRabbit passed, then production deploy and smoke passed at `4f841b22` with all worker lane services running. Acceptance remains pending until a real generation run confirms reject/defer before resume and only accepted candidates draft.

## P3 — Deferrable / hygiene

- [x] **17. Release-ledger consolidation (N1)** (S, released in PR #883 at `ed57b148`) — one append-only machine-readable ledger; CI consistency check; halves evidence-commit overhead. `design/north-star-ui/RELEASE_LEDGER.csv` is now the release lineage source, and `scripts/validate_north_star_release_ledger.py` validates ledger shape plus current baseline pointers across the north-star docs.
- [ ] **18. Weekly batch acceptance session** (recurring, 30 min) — walk north-star smoke screenshots; flip released→accepted in bulk; file defects. Completed 2026-07-14 on production revision `2f864d6c`: authenticated route checks covered Ideas, Projects, Patents, Create, Files, Jobs, an owned 19-patent project, patent Evidence, Platform, Spend limits, Email delivery, and Responder at 1440 x 900 px and 390 x 844 px. All 12 routes rendered without horizontal overflow, page alerts, browser-console warnings, or browser-console errors. Settled-state contact sheets and full-page mobile inspection confirmed the long project patent ledger, loaded Files library, and patent Evidence workspace remained readable without clipping or overlap. The previously used project `4` now returns the tenant-safe project-not-found state through the ordinary administrator workspace after the canonical access cutover, so the accepted project route was changed to owner-accessible project `7`; this is expected isolation behavior rather than a regression. External Sentry, Stripe, and the cold Outlook delivery matrix remain open. The recurring item stays open for the next weekly cycle.
  Automation follow-up 2026-07-21: `scripts/run_weekly_production_acceptance.sh` and `frontend/e2e/weekly-production-acceptance.spec.ts` make the same route set repeatable, exact-revision guarded, read-only, and evidence-producing. The journey now explicitly proves the Idea library is visible in the desktop and mobile Workspace rail, requires a verified administrator with an owned project/patent pair, and rejects route error notices, browser errors, and horizontal overflow at both viewports. Private screenshots are owner-only and git-ignored. This implementation does not close the recurring item; the next authenticated production run and dated evidence record remain required.
  Pre-release acceptance 2026-07-24: the authenticated, read-only production batch ran against rollback revision `50e8365e` using owner-accessible project `7` and patent `139`. Create, Idea Library, Projects, Patents, Files, Jobs, the project workspace, patent Evidence, Platform, Spend limits, Email delivery, and Responder all rendered at 1440 x 900 px and 390 x 844 px with their expected route identity, zero page alerts, zero horizontal overflow, and zero captured browser-console errors or warnings. The desktop Workspace rail exposed the Idea Library link on every surface; the mobile sidebar exposed the same `/ideas` destination and navigated successfully. Twenty-five private screenshots and the machine-readable run context are stored under the git-ignored `.acceptance/weekly/20260724T113443Z/` directory. This is useful pre-release evidence but does not close the Gate 0 acceptance run for candidate `ec05e7f1`; rerun the batch on that revision before sign-off.
  Release-candidate acceptance 2026-07-24: the authenticated, read-only production batch was repeated against deployed candidate `ec05e7f1` with the same owner-accessible project `7` and patent `139`. All 12 canonical surfaces reached their expected route identity at both 1440 x 900 px and 390 x 844 px, with zero page alerts, zero horizontal overflow, and zero captured browser-console warnings or errors. The desktop rail exposed Idea Library throughout; the mobile sidebar exposed `/ideas` and navigated successfully. Settled-state screenshots of the project workspace, Files library, and Spend limits were visually inspected without clipping, overlap, or loading placeholders. Twenty-five private screenshots and the machine-readable context are stored under `.acceptance/weekly/20260724T123621Z/`. This satisfies the Gate 0 weekly batch for `ec05e7f1`; the recurring item remains open for the next scheduled cycle.
- [x] **19. e2e suite lists generated from tags** (S, released as release-gate/control-plane work in PR #1040 at `c77aad7d`) — `@smoke` / `@live-gate`; kill the hand-maintained dual lists in `e2e/README.md`.

- [x] **19A. Real backend and live-contract CI gate** (M, accepted in PR #1177)
  Run the tenant, auth, spend, job, export, and provider-contract backend suites against Postgres in CI, plus a non-mocked frontend-to-backend live gate. Fully mocked browser smoke remains useful but cannot be the only required integration signal.
  Evidence: required GitHub checks execute the selected DB-backed suites and `@live-gate`; deliberate API schema drift fails the gate.
  Evidence: PR #1040 added tag-derived suite ownership through `frontend/scripts/e2e-suite.mjs`, wires `npm run e2e` and `scripts/run_mvp_e2e.sh` to `@smoke` and `@live-gate`, and adds `npm run e2e:check` so the README generated suite list cannot drift. CI Required Gate, frontend typecheck + E2E, backend static, backend schema, CodeRabbit Review, and CodeRabbit app review all passed.
  Release evidence: PR #1177 adds an isolated-Postgres `live-contract` job to the required gate, expands the Postgres backend contract group across auth, durable jobs, and provider dispatch, and runs the non-intercepted account lifecycle through real FastAPI and Next.js services. Local clean-Postgres proof passed through Alembic `069`, login/schema checks, invite/register, UI login, closure, and deleted-credential rejection. CI run `29162598167` then passed the real browser contract on `patent-studio-stable` in 2m21s, 62 deterministic backend auth/job/provider contracts, frontend typecheck/lint/build/browser smoke, the existing schema and tenant suites, CodeRabbit CLI review, and `CI Required Gate`. The contract asserts the login and `/api/auth/me` response shape so incompatible API schema drift fails the required lane.

- [x] **19B. CodeRabbit CLI authentication gate** (XS; accepted in PR #1148 at `7ee6fc95`)
  Pass the configured `CODERABBIT_API_KEY` explicitly to the non-interactive CodeRabbit CLI invocation so the nominally successful non-blocking job actually runs a review instead of exiting at authentication.
  Evidence: CI log shows a completed CLI review without exposing the secret; missing-secret behavior remains an explicit safe skip.
  Release evidence: PR #1148 authenticates the CLI through a disposable HOME/XDG profile, unsets the key before the long-running review, keeps heartbeat command logging secret-free, explicitly skips when the repository secret is absent, and removes authentication state on exit. Static tests guard the workflow wiring, direct executable contract, explicit key authentication, cleanup, missing-secret path, and output redaction. CI run `29135423014` completed CodeRabbit CLI `0.6.5` authentication and a three-file review with `No findings`, while backend static, Postgres schema and tenant gates, frontend typecheck/lint/build/139-test browser smoke, and the required gate all passed. The app review's rate-limit notice remains independent of the now-working CLI gate.
- [x] **20. `lib/artifact-links.ts` helper** (XS, released in PR #839 at `ca5fa5f4`) - single owner for the `?artifact=&project=&q=#generated-artifacts` deep-link contract. Home, Projects, Patents, Filing, Support, patent outputs, Files filter/search state, `/files` alias compatibility, CI, deploy, and production health passed. PR #871 extended the Files artifact ledger with specific open-action labels for papers, reports, PRDs, research, reviews, packages, drawings, and source files, then deployed and production-smoked at `bdc6e162`. PR #873 extended the same Files ledger with specific download-action labels for papers, reports, PRDs, research, reviews, packages, drawings, and source files, then deployed and production-smoked at `52619209`. PR #876 extended the Refine PRD artifact ledger with specific Inspect PRD, Copy PRD, Open PRD, and Download PRD action labels, then deployed and production-smoked at `c0a2ce4b`. PR #878 extended the Refine White Paper artifact ledger with specific Open paper and Delete paper action labels, then deployed and production-smoked at `8525a58a`. PR #880 clarified Refine Claim Review action language around Run full claim review, targeted review actions, and claim review jobs, then deployed and production-smoked at `2ea8f95b`.
- [x] **21. Component line budget + `patent-workspace.tsx` decomposition** (M, released through PR #887 at `d793d53d`) — ~400-line budget as an implementation standard; workspace file split before it becomes the agent merge-conflict hotspot. PR #884 reduced `patent-workspace.tsx` to 392 lines and extracted route helpers, identity, stage chrome, stage panels, and workbenches. PR #887 split the extracted stage-panel owner into focused Ideate, Research, Draft, Refine, and File component owners. Local frontend typecheck, lint, build, diff whitespace, and focused patent workspace Playwright route/workbench smoke passed across the release chain; CI Required Gate passed; production deploy and smoke passed at `d793d53d`.
- [x] **22. J1 pre-patent Ideas space · J2 Loop object** (XL, post-beta; accepted through PR #1200 at `791a1f78`) — differentiated journey objects, not beta gates.
  J1 release evidence: PR #1200 makes Ideas a first-class pre-patent workspace with global or project-scoped candidates. Users can capture candidates directly or generate them from selected durable Sources, compare and merge candidates, then promote one into a chosen project. Promotion preserves source provenance as patent Evidence, seeds specification and structured claims, and can hand off missing-section drafting to a durable job. Intake and Sources now live inside `/ideas`, with legacy route redirects retained. Clean Alembic `001 -> 076` and `076 -> 075 -> 076`, focused backend journey tests, 93 tenant-negative tests, schema drift, TypeScript, lint, production build, 169 browser-smoke tests, the real-backend browser contract, bot review, required PR CI, exact-main CI, and worker-draining deployment passed. Production runs `791a1f78` at Alembic `076`; backend, frontend, monitor, and all eight Celery lanes are running. Authenticated acceptance confirmed project scopes, the Ideas/Intake/Sources navigation, the legacy Intake redirect, the existing Responder admin surface, and zero browser errors.
  J2 release evidence: PR #1188 at `d2004eab` makes Improvement Loops first-class durable objects in Refine. Saved loops expose ordered iterations with review findings, revised specification sections and claims, score movement, token/cost usage when reported, apply controls, and reversible snapshots in one responsive record. Local hiding remains explicitly non-destructive and cannot resolve readiness. Focused and full frontend browser coverage, typecheck, lint, build, backend static/schema/tenant contracts, CodeRabbit review, required PR CI, exact-main CI, worker-draining deploy, Alembic `071`, all seven worker lanes, and public health passed. Authenticated production acceptance on patent 195 confirmed the loop selector, three ordered iteration records, in-place revision and findings detail, deterministic timestamps, no desktop or 390 px horizontal overflow, and no browser errors.

- [x] **23. Contributor privilege ceiling** (S; accepted in PR #1159 at `180bf4ec`)
  Editors may grant viewer/editor access but cannot mint or transfer `owner`, demote owners, or otherwise escalate contributor privilege without an existing owner/admin action.
  Evidence: two-user role-transition matrix covering portfolio, project, and patent scopes.
  Release evidence: PR #1159 centralizes contributor mutation authorization on the effective scope role; permits editors to manage viewer/editor grants while reserving owner grants, owner-row changes, and last-owner transitions for owners or administrators; and serializes owner-row checks. Nineteen focused clean-Postgres role-transition tests plus tenant-route coverage, required backend, Postgres, frontend, CodeRabbit CLI, and app review all passed. The worker-draining deploy advanced production to `180bf4ec`; Alembic remained `068 (head)`, backend, frontend, monitor, and all seven Celery lanes started, seven worker pings returned, and the public login redirect passed.

- [x] **24. Sensitive-action email verification policy** (S; released in PR #1168 at `0d0da132`; production recovery and cleanup accepted 2026-07-13)
  Define and enforce which paid, export, collaboration, filing-pack, and destructive actions require a verified email while keeping verification recovery usable.
  Evidence: backend authorization matrix and browser recovery journey for unverified and newly verified accounts.
  Release evidence: PR #1168 enforces verification after tenant authorization across paid AI, export/download, collaboration, filing, and destructive actions; preserves inline previews and account closure; limits the break-glass exemption to the configured administrator; makes SMTP failure cleanup and Google OAuth verification truthful; and adds recovery UI, policy documentation, CI gates, and browser coverage. Required CI, Gemini review, worker-draining deploy, Alembic `068`, all worker lanes, and exact-revision production smoke passed at `0d0da132`. Production recovery acceptance on 2026-07-13 used a disposable invited account and a real Gmail-delivered verification link: an archived-patent action returned the documented 403 verification recovery message while unverified and returned 200 after verification. The administrator then deactivated the disposable account through Admin while preserving its contributor and audit records, closing the remaining cleanup action.

## UX/UI consistency backlog, 2026-07-26 audit

Full-system UX/UI + security/resilience/ops audit. Admin left-indent root
cause: `adminPageContainer` uses `mx-auto max-w-{2xl|5xl|7xl}` while Create /
Ideas / Settings use full-bleed `w-full` under shared AppShell gutters.
Secondary: TopBar `px-4` vs main `sm:p-6`. Polish-ready A–G already shipped;
these items are the next product-chrome debt.

Canonical checkboxes: [`PUBLIC_BETA_CHECKLIST.md` §0.7](PUBLIC_BETA_CHECKLIST.md).

- [x] **UX-1** Unify signed-in page column (Admin centering vs app `w-full`). Done: `cursor/ux-align`.
- [x] **UX-2** Unify TopBar / verification banner / main horizontal padding. Done: `cursor/ux-align`.
- [x] **UX-3** Unify AdminPageHeader vs PageHeader dialect. Done: `cursor/ux-align`.
- [x] **UX-4** Ideas breadcrumb matches active view h1. Done: `cursor/ux-ideas`.
- [x] **UX-5** One Ideas header contract across views. Done: `cursor/ux-ideas`.
- [x] **UX-6** Nested `<main>` / error double-pad cleanup. Done: `cursor/ux-chrome`.
- [x] **UX-7** Quiet PublicShell on legal/404. Done: `cursor/ux-chrome`.
- [x] **UX-8** Control height normalization (h-8 vs h-9/h-10). Done: `cursor/ux-chrome`.
- [x] **UX-9** Create run PageHeader; Files single title. Done: `cursor/ux-chrome`.
- [x] **UX-10** Auth vs app brand-mark unify. Done: `cursor/ux-chrome`.
- [x] **UX-11** Admin overview "Admin" repetition trim. Done: `cursor/ux-chrome`.

Suggested engineering slices: **UX-align** (UX-1–3), **UX-ideas** (UX-4–5), **UX-chrome** (UX-6–11 via `cursor/ux-chrome`).

## UX simplification backlog, 2026-08-03 review

Complete the remaining public-beta journey cleanup without adding a dashboard,
assistant surface, feature advertising, or explanatory copy. `/create` remains
the signed-in front door and internal route slugs remain stable.

- [x] **UX-S1 URL-backed Projects state** — keep `q`, `view=recent|all`, and
  `page` in the URL so Back/Forward restores the same project result set. Search
  must stay server-backed and must not expand every matching project. Returning
  from a project restores useful focus and scroll context.
- [x] **UX-S2 Permission-aware project controls** — an authoritative
  capability controls rename, archive, move, and export actions. Viewers do not
  see mutation controls that the API will reject; editors, owners, and admins
  retain their legitimate actions. Backend and browser tests cover both sides.
- [x] **UX-S3 Consistent Create entry choices** — `Start new idea` and
  `Import patent draft` are peer choice boxes on `/create`, with equal visual
  hierarchy, concise copy, keyboard focus, and responsive behavior. Neither is
  presented as an advanced or secondary workflow.
- [x] **UX-S4 Handoff and Filing terminology** — use `Handoff` for the patent
  lifecycle stage and keep its internal `/file` URL stable. The later Filing
  workspace consolidation placed project handoffs, counsel Review queue,
  official exports, filing waves, and filing status under the global `Filing`
  destination; the shared glossary and navigation now describe that shipped
  model.
- [x] **UX-S5 Human project naming** — newly created project names use the
  working title without `Create:` or `— generated patents` wrappers. Existing
  records, identifiers, permissions, and deep links remain unchanged.
- [x] **UX-S6 One project Work section** — project detail groups patent work,
  project outputs, and file destinations into one compact `Work` section with
  exact artifact links and clear return paths. Sources and People remain
  separate, and empty descriptive placeholders do not compete with actions.

The checkboxes record completed implementation. Release evidence additionally
requires focused red-green tests for each item, frontend
typecheck/lint/build, backend and schema gates where applicable, the complete
browser registry, review approval, exact merged-main CI, UAT smoke approval,
guarded production promotion, and an authenticated production journey at
desktop and compact widths.

## Security / resilience / operator backlog cross-links, 2026-07-26

These map the audit OPS IDs onto existing Gate items. Do not treat this as a
second status board — flip the Gate checkboxes in PUBLIC_BETA_CHECKLIST when
evidence lands.

| Audit ID | Maps to | Status at audit |
|---|---|---|
| OPS-1 | Gate 0.3 Sentry + dead-man | OPEN — the July drill packet was invalidated by later production advances; rerun the living worksheet on the next frozen candidate |
| OPS-2 | Keep `ai_registry_mode=byok` / no provider fallback for users | Standing constraint |
| OPS-3 | Gate 0.5 Stripe live + dunning; eng: `invoice.payment_failed` | Eng shipped; live ops OPEN (`GATE0_5_STRIPE_ACCEPTANCE.md`) |
| OPS-4 | Gate 0.4 Outlook cold matrix | OPEN (`GATE0_4_OUTLOOK_ACCEPTANCE.md`) |
| OPS-5 | Gate 0.6 journey + NotebookLM A6.4–5 / A7–A8 | OPEN (`GATE0_6_JOURNEY_NOTEBOOKLM_ACCEPTANCE.md`) |
| OPS-6 | Gate B4 prod object storage cutover | OPEN (eng-prep shipped; prod still local — cutover + `GATE_B4_OBJECT_STORAGE_ACCEPTANCE.md`) |
| OPS-7 | Subscription credit grant idempotency under webhook replay | Eng shipped; production replay drill tracked in `GATE0_5_STRIPE_ACCEPTANCE.md` §5 (**OPEN**) |
| OPS-8 | Platform daily ceiling concurrent overshoot race | Eng implemented in PR #1449: atomic cross-user reservation, fail-closed pricing, and concurrent Postgres regression coverage |
| OPS-9 | Env ceiling default 0 if Admin override cleared | Eng guard shipped (Admin 422 + boot error log in prod); confirm prod ceiling still nonzero |
| OPS-10 | DMARC `p=none`; Microsoft/DXC CA acceptance | OPEN |
| OPS-11 | Weekly acceptance cadence; federated `email_verified` trust | OPEN (P3) |

## Suggested sequencing

Week 1: items 1–4A (1 is the critical path; 2–4A parallelise). Week 2: 5–8, start 9. Week 3: finish 9, then 10–12; open signups only after P0 items 1–4A and P1 items 5–8 are evidenced. 13–16 run during beta; 17–19 whenever process friction bites.
