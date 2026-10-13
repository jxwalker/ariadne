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
