# Phase 1 review disposition (FIX ONLY / FREEZE)

Reviewed local Claude reports: PR 170 at 4354b3a5cda34e902dcec5e76bf2b8e90a7d852b;
PR 171 at 2f79544d51ce82b2b66422d9a5bfce8d42c3559a. Reviewed all available
Codex, CodeRabbit and Copilot pull-request comments/reviews, including the Codex
findings through ba544077a34431cfc124a7a3f2550cc80f1bce86. Raw API responses are
preserved in ~/ariadne-run/master-p1/review-evidence.

Fixed in the stacked 171 result: cancelled/deferred imported scope exclusions;
evidence/waiver/expired-waiver progress; waiver detail and expiry; actor/via chain;
bot transcription labelling and source pointer; unverified mentioned PR labels;
blocker resolution and uniform UTC timestamps; inferred dependency provenance;
operator-only cancellation; demotion after unresolved dependency edits; operator
resolution of decisions/external gaps; bounded API and work queues; hierarchy
adjacency/cache; apply retry with preserved initial backup and deduplicated peer
map; reusable verification; expected deployment marker in plan; actual loopback
HTTP route with isolated real PG, desktop/mobile click-through, operations views,
CSP and paginated API browser evidence in CI. HTTP regression tests cover headers,
filters and unavailable-ledger response. The install package now captures its
listener baseline before installation.

Earlier stacked fixes retained and checked: all-criterion/product scope checks,
split incoming dependency rewiring, acceptance-evidence associations, immutable
accepted records, external creation guard, candidate validation, inherited split
evidence, immutable staged runner/dependencies, and plan-bound manifest digest.

Declined/deferred findings:

* Distinct same-uid security isolation: phase 1 is explicitly operator-only with
  no agent credentials. All processes under uid james are operator-equivalent;
  attribution cannot change that. Phase 2 adds agent identities. No credentials
  or infrastructure changes are made by this assignment.
* Rejected-ID replay, non-atomic batches and attested evidence: intentional
  contracts, now documented. The CLI executes batches sequentially. A corrected
  rejected command needs a new ID; evidence remains an operator attestation.
* Down migration/full data rollback: intentionally outside application rollback.
  Ledger, peer map, ownership/grants and backups are retained. Recovery of ACLs,
  ownership and peer configurations requires a separate approved recovery plan.
* Hardcoded PG17 transport: this bounded deployment targets the approved existing
  PG17 instance; tests discover available PG binaries. General version routing is
  deferred rather than changing infrastructure or model/runner routing.
* Interrupted/unknown telemetry, wait/harness and operational linkage: Operations
  retains operational telemetry; master does not infer explicit work associations.
  Explicit cross-view IDs and telemetry fields remain a limitation of this slice.
* Imported DEC-001/2/3 resolutions: source assertions, not independently signed
  acts. They do not approve baselines; no live decision import runs in FIX ONLY.
* PR 170 standalone transport: the provisioning package intentionally provisions
  only; the stacked phase 1 deployment grants and maps function access. Deploy the
  final stacked package only. PR 170 is left unchanged and open.

CodeRabbit initially reported a quota limit on 170 and in-progress review on 171;
Copilot reported quota exhaustion. These are unavailable review results, not clean
reviews. Final external review/CI status is recorded in FREEZE.md.


CodeRabbit review of ba544077 (delivered after the first fix push): also fixed
readiness retry failure propagation, full three-file application rollback with
bounded readiness retry, exact returned approval path (no newest-file race), and
positive application connectivity before permission-denial probes. The shared
retry helper has isolated success/exhaustion tests; no mutation script is run.
Declined raw snapshot formatting edits (4261783161): snapshots are hash-verified
raw evidence and must remain byte-preserved. The quota contradiction
(4261783151) is recorded in import and exclusion, not edited into raw captures.
Baseline hierarchy finding 4261783185 is stale: product() returns the baseline as
its second value and imported phases reference that baseline. Real HTTP
click-through coverage traverses the selected baseline to phases and work.
CI caught an ambiguous Needs you heading in the new browser check; its selector
now explicitly targets the level-2 section heading.


Codex re-review at a7647432781d915bffe232385ca359c7d59c7db5: fixed
4261884186 (unsupported/duplicate required evidence kinds) and 4261884197
(unrelated waiver criteria). Policy kinds must be supported, unique strings;
waiver lists must match exactly the work's criterion IDs. Real PG tests reject
malformed kinds, extra/duplicate/null waiver IDs and retain a valid override.

Claude 170 finding 14: dependency IDs are now captured in command journal before/after state, including incoming split rewiring; a real-PG regression checks the old and new edge sets.


Codex re-review at a3442b1fd973d0226896f6474f0f6b266c36c01c: fixed
4261991135 by removing all automated approval decisions. The wrapper accepts
only a separately recorded approved operator record bound to exact head/manifest;
bot transcription can create only a pending request. Fixed 4261991147 by requiring
product/policy/decision/external root nodes to have no parent. Isolated approval
validation tests and real-PG root-parent regression tests cover both changes.
The earlier exact-return-path fix is superseded by the explicit supplied approval.


Codex re-review at bddcdea9fc80ef5f72a0f1022ce9b93e48864151: fixed
4262084788. API accepted/evidence/acceptanceEvidence/history filters now follow
split ancestry, as the HTML view does. Inherited evidence is restricted to child
criterion IDs; regression coverage includes nested splits and sibling exclusion.


Codex re-review at 01a9d15be6c6a01c31c44da434f6b4d3235bba9f: fixed
4262178331 by requiring canonical vault approvals and blocking missing/nonapproved
current records at mutation-readiness audit. Fixed 4262178349 by advancing owner
generation and demoting on reassignment; evidence is generation-bound. Fixed
4262178364 by validating refs as arrays of objects on create/update. Regression
tests cover approval disappearance/status changes, locations, generation changes,
stale evidence and malformed refs. No live mutation executes during testing.

The expanded owner-generation test exposed unordered snapshot arrays during dump/restore equality checks. Snapshot collections are now ordered by stable keys, also making API pagination deterministic. The existing real-PG restart/restore regression verifies it.


Codex re-review at ac51e1d55a376e2e129c3234cacef5970dad2106: fixed
4262316978 (decision options must be arrays) and 4262316995 (work source must be
an object). Rendering also tolerates malformed legacy source/options/reference/
waiver/age/lineage metadata, preserving raw records in the API/journal. Work
creation rejects internally managed acceptance, generation, lineage and blocker
fields, and criteria require string IDs/text. Regression tests exercise malformed
payloads and ensure legacy metadata cannot take the portfolio down.

Fresh CodeRabbit review at ac51e1d55a376e2e129c3234cacef5970dad2106: fixed 4262380597. Malformed /work pagination now returns 400 rather than 503, with real-handler HTTP tests for invalid limit/offset.


Codex re-review at f645bee941cd121f9d156c12bd4c94236b2e93d2: fixed
4262470463. Expired/invalid waivers now block dependencies and every advancing
transition/acceptance; history stays immutable. The snapshot/API and work card
mark inactive waivers. Infinite expiry is rejected. A real-PG regression waits
for actual expiry, proves downstream rejection, and checks history is unchanged.


## Combined operator-response release

Codex independently reviewed both stacked PRs and the latest c0f6b2a findings.
The combined candidate preserves their ancestry and fixes changed approval records by
binding their complete JSON digest into readiness plans; the audit rechecks it before
dry-run and execution. Old plans without this binding must be regenerated. The historical
PostgreSQL provisioning wrapper now requires a separately approved exact package manifest
and embeds independent byte checks into every executable command. Work pagination keeps
the active state filter. These changes do not provision a second cluster or weaken gates.

Operator responses use the existing signed agent recommendation, an authenticated James
session on his existing Macs, CSRF/origin and exact question-version checks. Replies update
known explicit master decision aliases and persist through master.command; unknown questions
create audited decision records. Only the originating source/repository/run receives the
answer on its next signed report. Available delivery is not proof of acknowledgement or
execution. No model-provider connection or general agent ledger credential is added.

The real PostgreSQL suite tests durable response provenance, exact alias resolution,
idempotency, source isolation and cache overlay in addition to the ledger contracts.
Private HTTP tests cover unauthorized actors, stale versions, conflicting/double submissions
and public-ingest denial. The three roadmap imports remain proposed and source claims remain
unverified until their scope and acceptance evidence are approved.
