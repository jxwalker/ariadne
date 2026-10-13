# North-star UI surface tracker

**Status:** Living surface inventory
**Owner:** Product design and frontend engineering

This file owns current surface status and acceptance follow-ups. Runtime
lineage is in [`RELEASE_LEDGER.csv`](RELEASE_LEDGER.csv); use its newest
`runtime` row rather than duplicating a current PR or SHA. Beta release state is
owned by [`docs/PUBLIC_BETA_CHECKLIST.md`](../../docs/PUBLIC_BETA_CHECKLIST.md).
Historical packets are preserved in
[`design/archive/north-star-ui-2026-08-05/SURFACE-TRACKER.md`](../archive/north-star-ui-2026-08-05/SURFACE-TRACKER.md).

## Status contract

| Status | Evidence required |
|---|---|
| `planned` | Outcome, route/owner, and acceptance proof identified |
| `designed` | Launch packet, tests, visual target, and rollback complete |
| `branch-tested` | Implementation exists with focused local proof |
| `implemented` | Merged to `main` |
| `tested` | Exact-head CI and required visual evidence pass |
| `released` | Exact-main CI, UAT approval, production promotion, and smoke pass |
| `accepted` | A representative real workflow is confirmed without support |

Status is evidence, not intent. A released surface with a failed acceptance
stays `released` and gets a named defect row.

## Current surface inventory

| Surface | Canonical route family | Primary object | Status |
|---|---|---|---|
| Create | `/create`, `/create/:runId` | invention journey or saved run | accepted |
| Projects | `/projects` | project collection | released |
| Project workspace | `/projects/:id` | selected project and its patents | accepted |
| Patents | `/patents` | patent collection | accepted |
| Invention | `/inventions/:id` | the invention: status, next step, work products, Disclosure & Sources, People | accepted (CLR-8 PR 2–3) |
| Patent application steps | `/inventions/:id/patent/:step[/:view]` | prior-art · claims · specification · drawings · review · ready, hosting today's stage panels | accepted (CLR-8 PR 2–3) |
| Ready to hand off | `/inventions/:id/patent/ready` | the handoff step: readiness, counsel package, filing | accepted (CLR-8 PR 3) |
| Reader | `/inventions/:id/reader` | the full patent beside its steps | accepted (CLR-8 PR 3) |
| Patent shell (legacy) | `/patents/:id/*` | redirects through the CLR-8 alias table (`lib/invention-routes.ts`) | redirected (CLR-8 PR 3) |
| Sources (legacy) | `/patents/:id/ideate/*` | redirects to `/inventions/:id#sources` | redirected (CLR-8 PR 3) |
| Prior art (legacy) | `/patents/:id/research/*` | redirects to `/inventions/:id/patent/prior-art/*` | redirected (CLR-8 PR 3) |
| Draft (legacy) | `/patents/:id/draft/*` | redirects to `/inventions/:id/patent/{specification,claims,drawings}` | redirected (CLR-8 PR 3) |
| Review (legacy) | `/patents/:id/refine/*` | redirects to `/inventions/:id/patent/review` and the work products | redirected (CLR-8 PR 3) |
| Ready to hand off (legacy) | `/patents/:id/file/*` | redirects to `/inventions/:id/patent/ready` and `#people` | redirected (CLR-8 PR 3) |
| Work | `/files` | generated artifacts and source files | accepted |
| Filing | `/filing`, `/filing/waves` | project package or official export | released |
| Activity | `/files?view=jobs` (`/jobs` redirects) | durable background job | branch-tested |
| Intake and Evidence | `/intake`, patent Evidence views | reusable source or pinned evidence | accepted |
| Settings and Admin | `/settings/*`, `/admin/*` | account, service, or tenant configuration | accepted |
| Help and recovery | `/help` (`/support` redirects), not-found surfaces | recovery action | accepted |
| Invention page (CLR-8) | `/inventions/:id`, `/inventions/:id/patent/*`, `/inventions/:id/<kind>` | invention, its work products, one status and next step | accepted (PR 1–3; deletions in PR 4) |
| Home (CLR-12) | `/projects` (Needs me above the inventions list; `/` redirects here) | what needs the signed-in person | branch-tested |
| Library (CLR-19) | `/library` (`/files` redirects) | work products grouped by invention | planned |
| Document door (CLR-9/16) | `/create` | disclosure → faithful patent draft | branch-tested |

Help recovery remains `accepted`. Planned expansion to a searchable help corpus,
grounded Ask Help assistant, and anti-drift CI is tracked only in
[`docs/delivery/HELP-PROGRAM.md`](../../docs/delivery/HELP-PROGRAM.md) and
[`docs/delivery/backlog.md`](../../docs/delivery/backlog.md) — do not demote this
row for that work, and do not duplicate the HELP backlog here.
| Public trust and auth | public routes, `/login`, registration and recovery | access decision and current public claim | accepted |

The route labels and nouns remain authoritative in
`frontend/lib/navigation.ts` and `frontend/lib/glossary.ts`. First-time
navigation and rail-regression work is briefed in
[`docs/delivery/CLR/IA-FIRST-TIME-NAV-BRIEF.md`](../../docs/delivery/CLR/IA-FIRST-TIME-NAV-BRIEF.md);
do not start a second dated UX plan.

## Implementation follow-ups awaiting acceptance

### CLR-4 remaining information panels

**Status:** `implemented` in [#2951](https://github.com/jxwalker/patent-studio/pull/2951);
remaining real-workflow acceptance is open.

The remaining Sources guidance, empty Claims guidance and specification
rewrite-review band use the shared grey panel. Empty Claims has one drafting
action, with import and its error state retained. Claim-review acknowledgements
use the shared status notice without a success icon on merely accepted work.
The explanatory-panel guard has no remaining exceptions on this branch.

Local proof: the six-site source guard failed before migration; duplicate
Claims actions failed at 390px and 1280px before consolidation. The final
production build, full frontend unit suite and 14 targeted browser cases pass,
including read-before-apply locks and the existing empty-Claims signpost.
Desktop/mobile screenshots were inspected. These fixture-backed checks do not
prove authenticated workflow acceptance or deployment.

Authenticated UAT on 2026-09-16 found that the empty Claims page still offered
both `AI Expand Claims` and `Write claims with AI` for the same drafting panel.
The earlier browser assertion counted only the latter label. The scoped
follow-up [#3005](https://github.com/jxwalker/patent-studio/pull/3005) retains
one empty-state entry with an explicit open/close state and preserves the
populated-claims toolbar. Its regression counts both labels at 390px and
1280px, checks open/hide/reopen without generation starts, and retains import
and quota recovery coverage.

The scoped empty-Claims regression passed authenticated UAT on 2026-09-16,
after exact-head CI/review, merged-main checks and guarded UAT deployment.
The [owning release evidence](https://github.com/jxwalker/patent-studio/pull/3005#issuecomment-5704338181)
records the deployed revision and health checks. At both 390px and 1280px,
the signed-in synthetic fixture had one drafting entry, working
open/hide/reopen and matching accessibility state, with screenshots inspected
and no horizontal overflow. Post-check reads confirmed unchanged accepted
specification/drawings, no claims or revisions, the same prior jobs, and zero
claim jobs or provider calls. No generation, import, Apply/Restore/Discard or
production promotion occurred; paid/provider acceptance was not exercised.

Sources triage, specification rewrite decisions and accepted claim-review
acknowledgements still need real-workflow acceptance; neither the source guard
nor this empty-state regression check completes them. Do not promote the
existing surface inventory statuses on this evidence alone.

## Released, awaiting real-workflow acceptance

### Filing handoff workspace — FILING-1 to FILING-3

**Status:** `released` through PR #1648; production smoke passed.
**Acceptance still required:** complete a representative large-project counsel
handoff without navigation help, including an incomplete patent in the project.

Released behavior:

- a project deep link opens the selected project before the project collection;
- the current package state and primary next action are visible immediately;
- readiness is shown per patent, and incomplete patents are unchecked by
  default and rejected server-side when the package contract disallows them;
- package documents can be inspected in-app;
- the ZIP leads with `START_HERE` and review-first material while retaining
  stable numbered folders and download compatibility.

Acceptance proof:

1. Enter Filing from a project containing ready and incomplete patents.
2. Confirm the selected project and current package are the first focus.
3. Confirm defaults include only eligible patents and explain exclusions.
4. Generate or open the package, inspect the important documents, then download
   and send it to counsel.
5. Confirm the same path at 390px and desktop without support.

### Targeted artifact corrections — REV-1 to REV-3

**Status:** `released` through PR #1648; production smoke passed.
**Acceptance still required:** a user corrects a mistaken figure and one patent
artifact, reviews the proposal, applies it, and confirms unrelated content is
unchanged.

Released behavior:

- one versioned request contract covers draft, queue, proposal, apply, discard,
  rollback, provenance, cost confirmation, and stale-source protection;
- white-paper artwork supports exact instructions such as replacing glasses
  with a hat while retaining the rest of the composition;
- specification prose, claims, and AI-generated drawings use the same
  review-before-apply interaction;
- active proposals rehydrate after reload and terminal worker redeliveries do
  not corrupt the completed job state;
- unsupported generic job controls are hidden for correction jobs.

Acceptance proof:

1. Request one figure correction with explicit invariants.
2. Reload while it runs and recover the same request.
3. Compare before/after, apply it, and verify the prior version remains.
4. Repeat for specification, claim, or AI-generated drawing content.
5. Confirm the non-target artifact hash or visible content did not change.

### REV-3A — formal drawing review before replace

**Sheet-preview follow-up ([#2998](https://github.com/jxwalker/patent-studio/pull/2998)):**
live UAT reproduced a broken image when a formal sequence sheet has no editable
scene. The ordinary SVG download intentionally uses neutral MIME, attachment,
nosniff and sandbox CSP; embedding that URL is not a working preview. The
editor and missing-thumbnail fallback use a tenant-checked PNG raster of the
accepted stored sheet, without rewriting the drawing or relaxing SVG download
policy. Unavailable previews offer Retry and Download instead of a broken
image. Regression coverage asserts real browser image decoding at narrow and
wide widths, not merely the presence of an img element.

**Preview acceptance passed, 2026-09-16:**
[exact-release CI, deployed smoke and authenticated browser evidence](https://github.com/jxwalker/patent-studio/pull/2998#issuecomment-5693196501).
The existing no-scene sequence sheet decodes on desktop and at 390px without
horizontal overflow. Accepted files, records and specification are unchanged;
provider usage remains zero. Existing stored thumbnails also display, but
their missing-thumbnail fallback retains fixture coverage rather than a live
acceptance claim. This closes the preview follow-up only; the broader REV-3
decisions and filing-PDF acceptance remain open.

**Status:** `implemented`; awaiting exact-main CI, release and real-workflow
acceptance.

**Evidence:** formal patent sheets on `/patents/:id/draft` exposed an immediate
`Regenerate this drawing` action. The frontend mounted the shared correction
dialog only for `drawing_type=generated`, and the revision adapter rejected
other drawing types. A formal re-render therefore replaced the stored drawing
without a proposal, before/after review, Apply, or Discard step.

Investigating it found the bypass was wider than the dialog gate: the
per-drawing `regenerate` route replaced accepted content in place for
**generated** drawings too, so the correction dialog sat beside a button that
skipped it.

**Target:** route formal drawing regeneration through the versioned correction
contract. Store the proposed render separately, show before/after, require
Apply or Discard, preserve the prior version, and keep unrelated drawings and
specification content unchanged.

**Released behavior:**

- formal drawings are correctable through the same versioned contract as
  specification prose, claims and generated drawings;
- a proposed sheet is rendered from the current specification and staged as its
  own stored object, so the accepted sheet is untouched during review;
- Apply repoints the drawing at the staged sheet rather than rewriting the
  object, which is what keeps the prior sheet restorable — `persist_record_bytes`
  deletes a superseded object once its replacement commits;
- Discard removes the staged sheet through a new discard adapter, so a rejected
  render does not linger in storage;
- discard commits the status change first, then deletes the staged sheet and
  clears its locator in a second commit. A failed delete leaves the locator in
  place; a daily Celery sweep finishes the release so a single storage outage
  cannot leak the object forever;
- the per-drawing immediate regenerate affordance is gone from the drawings
  surface; the reviewed path is the only per-figure path;
- a formal sheet offers **no free-text instruction**. Its content is produced
  programmatically from the specification so that it keeps meeting the USPTO
  drawing standards, and letting someone describe a different drawing would
  invite output that no longer does. The affordance is "Re-render from
  specification", and the copy points at the specification as the place to
  change what the figure shows. Hidden fields never reload or resubmit free
  text from an earlier correction on the same figure;
- a formal re-render is not priced as provider work, because it calls no
  provider. Pricing it as AI work also blocked it for anyone without a
  configured drawing model or spare credits.

**Restore follow-up ([#2993](https://github.com/jxwalker/patent-studio/pull/2993)):**
authenticated UAT reached Apply but found no user-facing Restore action; an
API-only rollback is not the acceptance proof below. The correction dialog now
offers Restore immediately after Apply and recovers the latest applied
correction after reopening, without blocking a new correction. It previews the
preserved version and requires an explicit confirmation. The existing rollback
endpoint still enforces editor access and refuses to overwrite a newer version;
errors do not pretend restoration succeeded. Other in-progress corrections take
priority over historical restore controls. Local regression and responsive
browser evidence belong to the PR; exact-release authenticated acceptance remains
open.

**Acceptance proof:** on a patent with at least two formal sheets, request one
targeted re-render, confirm the accepted file is unchanged before Apply, reload
and recover the proposal, then Apply and restore the prior version. Verify the
second drawing and specification hashes do not change.

### REV-3B — bulk regeneration still replaces without review

**Status:** `implemented`; awaiting exact-main CI, release and real-workflow
acceptance.

**Evidence:** the multi-select `Regenerate` control and the `Replace AI/Formal`
batch action both still called the in-place regenerate / delete-and-recreate
path, which replaced accepted formal and generated drawings with no proposal.
REV-3A removed the per-figure bypass; these two remained.

**Released behavior:**

- **Regenerate selected** opens one review surface with a proposal per eligible
  figure (formal re-render or generated redraw from the specification);
- **Replace AI/Formal** no longer deletes accepted sheets; it opens the same
  reviewed bulk path for every AI/formal figure;
- first-time **Generate Drawings** (empty workspace) still uses the durable
  formal job;
- Apply and Discard are per figure, so unapplied sheets and the specification
  stay unchanged;
- sketches and uploads stay out of the bulk path.

**Acceptance proof:** select several formal sheets, regenerate them, review each
proposal, apply some and discard others, and confirm the unapplied sheets and
the specification are unchanged.

### REV-3C — the figure plan is reviewable and versioned

**Status:** `implemented`; awaiting exact-main CI, release and acceptance.

**Evidence:** `figures_markdown` holds the mermaid figure plan that decides
which figures exist and how each is laid out, and every formal sheet is
rendered from it. It was not in `SECTION_FIELDS`, so it was neither a valid
correction target nor captured in `SpecificationVersion` snapshots, while
`Replace AI/Formal` overwrote it with AI-authored content. Accepted patent
content was being rewritten with no review and no version to return to.

**Released behavior:** a `VERSIONED_FIELDS` list adds the figure plan to version
snapshots and to the correction contract without touching `SECTION_FIELDS`,
which generation uses to ask whether a specification has any content yet.
Correcting the plan is a reviewed specification change. A proposal is refused
when its mermaid no longer parses, and also when it would leave any figure with
nothing to draw — checking only that *some* figure survives would accept a
correction that fixes one and empties another. Figures that were already blank
are exempt, so pre-existing breakage cannot trap the user on the plan they most
need to edit. Snapshots written
before this change carry no key for the plan, and restoring one leaves the
current plan alone instead of erasing it.
AI overwrite of `figures_markdown` on the formal-drawings router and the
generation drawings handler now writes a `pre_figures_markdown_generate`
version first. Sequence and state diagrams count as drawable even though their
parsed node maps are empty. The drawings workspace exposes the shared
correction dialog against the figure plan so that fix is reachable in product.

**Why it matters for drawings:** the renderer is deterministic, so re-rendering
a badly drawn sheet reproduces it exactly. Correcting the plan is the supported
fix, and it keeps the sheet machine-drawn and standards-compliant.

**Acceptance proof:** correct a figure plan, review and apply it, re-render the
affected sheet and confirm it changed; then restore a specification version
taken before this change and confirm the plan survived.

### REV-3D — a wrong sheet needs a way out that is not a silent one

**Status:** `implemented`; awaiting exact-main CI, release and real-workflow
acceptance.

**Evidence:** REV-3C fixes a wrong figure plan, but a genuine renderer defect
leaves the user with no route at all: re-rendering reproduces the same sheet. A
formal sheet is a rendered SVG rather than an Excalidraw scene
(`drawing-card.tsx` treats formal as an image), so it cannot simply be opened
and edited.

**Released behavior:** Drawings exposes **Report renderer defect** on each
formal sheet. The report stores patent, figure, mermaid source, rendered-sheet
storage pointers, and the user's description, and lands in
`/admin/renderer-defects` rather than mail. A substitute PNG or SVG is applied
in place without changing `drawing_type`, is durably marked as a **standards
override**, and raises `drawing_standards_override_pending` on the counsel
readiness gate until an administrator confirms USPTO compliance. Open reports
without a substitute do not block filing. Resolving an applied override without
that confirmation is refused.

**Acceptance proof:** report a defect on a figure and find it, with its mermaid
source, in the administrator surface; substitute a corrected sheet and confirm
the drawing is marked as an override and that the patent's readiness gate
reports it until cleared.

### REV-DRAW-QA — generated sheets must pass 37 CFR 1.84 inspection

**Status:** `verified` for the renderer corpus on 2026-09-28 at main
`bdb319308c026802e8ad062b0bc61e3436e0bec6`; see the dated evidence in
[`FORMAL_DRAWING_QA.md`](../../docs/technical/FORMAL_DRAWING_QA.md). This is not
USPTO filing approval.

**Evidence:** formal sheets could shrink type below 0.32 cm, ignore Mermaid
`flowchart` aliases, and ship obscured labels or crossed connectors. There was
no corpus that rendered every diagram kind and scored it against the office
rules.

**Target / released behavior:** every case in
`backend/tests/fixtures/formal_drawings/corpus.py` is rendered for real and
must pass `backend/app/generation/formal_drawing_inspect.py` (sheet size,
margins, identifying indicia, `n/N`, `FIG.` labels, black-only 0.3 mm lines,
3.2 mm sight type, lead lines, arrows, no interior connector crossings, no
box/label overflow). Loop: `python3 scripts/run_formal_drawing_qa.py --png`.
Plan: [`docs/technical/FORMAL_DRAWING_QA.md`](../../docs/technical/FORMAL_DRAWING_QA.md).

**Acceptance proof:** `pytest tests/test_formal_drawing_uspto_qa.py` is 100%
pass and a PNG review of the corpus shows no obscured text, missing arrows, or
weird routing.

### CLR-28 — two-step sign-in and sessions (Settings Security)

**Status:** `branch-tested` on `cursor/clr-28-webauthn` (stacked on #2592 / #2589).
Does not change the accepted Settings and Admin inventory row.

**Routes:** `/settings/security` (Two-step sign-in + Security keys + Sessions
and devices), `/login` code or security-key step when login returns
`mfa_required`, `/login/mfa` for OAuth step-up, `/login/enroll` when an
organisation requires two-step sign-in and the member has no confirmed factor.
Organisation toggle lives on Settings › Organisation for team owners/admins.

**Target behavior:** Off/On with the date confirmed; Turn on shows a
client-rendered QR, the secret, and a confirm field; recovery codes appear
once with copy/download and an "I have saved these" gate; sessions list marks
This device and can sign out every other session. Security keys can be listed,
added via `navigator.credentials.create`, and removed with password or code
proof. Sign-in offers "Use a security key" when `methods` includes `webauthn`.
Org-enforced enrolment is a full-page interstitial, not a banner.

### CLR-29 — single sign-on per organisation (Settings › Organisation)

**Status:** `branch-tested` on `cursor/clr-29-oidc` (stacked on #2596).
Does not change the accepted Settings and Admin inventory row.

**Routes:** Settings › Organisation gains Identity providers and Domains
panels; `/login` offers “Continue with &lt;name&gt;” after a public lookup and
handles `sso_required` from password or Google/Microsoft.

## Next-work rule

REV-3A, REV-3B, REV-3C, and REV-3D are implemented on `main` and waiting on
exact-main CI, release, and real-workflow acceptance. Do not open a new design
plan for them. Record a passed acceptance here, or add a concise named defect
with route, evidence, target behavior, and acceptance proof. New product work
starts only after those acceptances and completing the launch packet in
[`IMPLEMENTATION-READY-PACK.md`](IMPLEMENTATION-READY-PACK.md).
