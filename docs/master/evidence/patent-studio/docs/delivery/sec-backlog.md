# Product Backlog — Security findings (SEC)

Single source of truth for the security review findings, including closure
evidence for resolved items, ordered by severity then blast radius.

Program brief: [`SEC-PROGRAM.md`](SEC-PROGRAM.md)

**Status of this backlog:** Active. Ten findings from the 1 August 2026 review
of revision `6fa0f29b` were initially triaged here against historical `main` at
`715c011f` on 18 August 2026. Current row status and linked closure evidence
supersede that initial snapshot.

**Detail:** write-ups and PoCs stay in the private review output — see
[`SEC-PROGRAM.md` § Where the detail lives](SEC-PROGRAM.md#where-the-detail-lives).
The Finding column gives the slug that indexes them.

| ID | Finding(s) | Severity | Status | Seam | Conditions of Satisfaction (CoS) |
| --- | --- | --- | --- | --- | --- |
| SEC-1 | `direct_patent_grant_parent_scope_artifact_idor`, `generation_preflight_ancestor_ids_as_auth`, `prepatent_ideas_ancestor_scope_list_leak`, `research-paper-parent-source-metadata-leak` | Medium | **Implemented — [PR #1905](https://github.com/jxwalker/patent-studio/pull/1905)** | `backend/app/access.py`, `generation/source_preflight.py`, `research_paper/{context,scope}.py`, `counsel/scope.py`, and guarded routers/workers | `accessible_scope()` returns container-visibility IDs and authorization IDs as **separate named sets**; no route uses the container set as a read predicate; a direct patent grantee with no parent-project grant cannot list parent-scoped ideas, sessions, sources, or artifacts, and cannot pass a parent-scoped source ID into a generation run; regression test per call site; invariant recorded in `docs/security/TENANT_ACCESS_AUDIT.md`. Persisted generation, research-paper, and counsel derivatives and their downstream jobs are revalidated before listing, read, control, download, worker, or provider boundaries; unprovable legacy state is quarantined. |
| SEC-2 | `source-url-stored-xss` | Medium | **Implemented — [PR #1924](https://github.com/jxwalker/patent-studio/pull/1924)** | `backend/app/routers/sources.py`, `frontend/components/patents/{sources-panel,external-reference-link}.tsx`, `frontend/components/capture/intake-evidence-workspace.tsx` | `SourceCreate.url` / `SourceUpdate.url` accept `http`/`https` only and reject `javascript:`, `data:`, `vbscript:` and scheme-relative input at the schema boundary; every render of a stored source URL goes through one shared safe-href helper; a stored active-scheme row from before the fix renders inert rather than as a live link; tests cover schema rejection and the render fallback. |
| SEC-3 | `job_list_created_by_bypass` | Low | **Implemented — [PR #1905](https://github.com/jxwalker/patent-studio/pull/1905)** | `backend/app/routers/jobs.py` (`GET /api/jobs`, `/api/jobs/active`) | The `created_by == user.id` alternative applies **only** to jobs with no `project_id`; a user who loses access to a patent stops seeing that patent's jobs on the next list call; project-bound rows are filtered by current access alone; regression test drives creation, revocation, then list. |
| SEC-4 | `legacy_notebook_sync_cross_user_captures` | Unrated (treat as Medium) | **Implemented — [PR #1928](https://github.com/jxwalker/patent-studio/pull/1928)** | `backend/app/routers/notebooks.py` | The legacy sync capture query applies the `Capture.user_id` ownership boundary the ordinary capture API applies; an editor on a shared patent cannot cause another user's captures to be copied into their own notebook; test proves a second user's capture is excluded. |
| SEC-5 | `suspended_member_wallet_visibility` | Low | **Implemented — [PR #1926](https://github.com/jxwalker/patent-studio/pull/1926)** | `backend/app/routers/usage.py` | Organization-scoped wallet and usage reads require an **active** membership in an **active** organization, not merely the existence of a membership row; `context.selectable` is enforced before any organization aggregate is calculated; suspended memberships, suspended organizations, and unknown contexts receive the same generic `404`; tests drive both suspension boundaries against both organization-scoped usage reads while preserving unscoped personal usage. |
| SEC-6 | `restore_verify_object_binding_gap` | Low | **Implemented — [PR #1932](https://github.com/jxwalker/patent-studio/pull/1932)** | `scripts/backup_prod.sh`, `scripts/restore_verify.sh`, `scripts/verify_restore_bindings.py` | Backup metadata pins the effective local-object root even for mixed-backend rows and selects one S3 snapshot layout; restore inventories every base-table `*_storage_key` plus live drawing-revision JSON locators and resolves them only to regular, non-symlinked files at that exact layout; matching counts cannot hide a renamed, missing, symlinked, or colliding object. Feeds Gate 0 backup residual 4C in [`../BETA_TODO.md`](../BETA_TODO.md). |
| SEC-7 | `counsel_admin_handoff_boundary_bypass` | Medium | **Closed — fixed on `main`** | `backend/app/routers/counsel.py` | No blanket `UserRole.admin` bypass remains in the participant-facing counsel handlers; the one surviving admin reference gates the counsel inbox and still scopes rows to `to_user_id == user.id`. Cross-tenant administration remains the audited `/api/admin/workspaces` path. No further work; row kept so the finding is not re-reported. |
| SEC-8 | `stored_file_capability_and_log_leakage` | High | **Merged in [PR #2218](https://github.com/jxwalker/patent-studio/pull/2218)** | `backend/app/routers/stored_files.py`, `backend/app/observability.py`, UAT nginx stored-file location | Redemption rejects identity/signing-key/expiry swaps, removed access and changed storage keys; only explicitly safe types remain inline; ambiguous or executable media is attachment-only with neutral MIME, `nosniff` and sandbox CSP; synthetic canaries are absent from backend access, edge access/error and Sentry error/transaction records while query-free route/status telemetry remains. |

## Additional current-system findings

| ID | Finding | Severity | Implementation and evidence | Boundary |
| --- | --- | --- | --- | --- |
| SEC-9 | `white_paper_normalizer_cpu_stall` | Medium | Shared bounded-scan repair and regression evidence in [PR #2514](https://github.com/jxwalker/patent-studio/pull/2514); [tests-first record](../stage-0/white-paper-normalizer-cpu.md). Deployment is a separate release gate. | Long editor-supplied whitespace must not cause superlinear synchronous normalization work; preserve prose through generation, editing, reading/export and artwork context. |

## Stage 0 follow-ups

Unless explicitly marked implemented below, these are **Proposed
assessment/contract work**, not validated vulnerability severity assignments
or permission for broad auth changes. Exact source
attribution: [reconciliation](../stage-0/product-quality-reconciliation.md).

```yaml
packages:
  - id: SEC-S0-UNTRUSTED
    status: Partial static assessment recorded; caller-complete inventory and adversarial behavior evidence remain open.
    sources: [Q-S1-010]
    hypothesis: Source text must remain data regardless of whether a caller uses the standard wrapper or a bespoke delimiter.
    tests_first: Inventory callers first; use adversarial synthetic source text for a demonstrated boundary failure before any behavioral repair.
    in_scope: Current wrapper coverage, explicit exceptions and injection-resistant handling across one prompt family at a time.
    out_of_scope: Claiming tags alone solve prompt injection, prompt redesign, broad model swaps and duplicating NotebookLM authority guards.
    file_fence: [backend/app/ai/untrusted_context.py, backend/app/drafting/drawing_map.py, backend/tests/test_untrusted_context.py]
    risk: Treating absence of a helper as proof of exploitability, or treating presence as proof of safety.
    acceptance: Each source-bearing caller is covered or has an owned exception with evidence; generated text cannot confer tool/data authority. Refresh the issue2060 prompt inventory before implementation.
    evidence: Historical Q-S1-010 names wrapper gaps and bespoke delimiters. The 2026-09-06 source-boundary assessment at daeeead3f748ec7ca44b4d9a5890498a0786075f traces wrapper, drawing and review-application controls without establishing unauthorized capability transfer; this is not prompt-injection clearance. See the linked assessment below for exact source pins and remaining evidence.
  - id: SEC-S0-FIXTURE-MODE
    status: Implemented in PR2484; retain regression coverage, do not reopen the corrected parser mismatch.
    sources: [Q-S1-018]
    hypothesis: An operator-selected fixture mode must not accidentally execute a real provider through inconsistent flag parsers.
    tests_first: PR2484 records failing accepted-spelling cases with value1 as a passing control; retain those tests and the complementary off-value cases.
    in_scope: One explicit accepted-value contract at the adapter and handler boundary.
    out_of_scope: New fixtures, live spend, provider defaults and enabling paid tests in CI.
    file_fence: [backend/app/ai/multi.py, backend/tests/test_ai_multi_fixture_mode.py, backend/app/generation/handlers.py]
    risk: Tests or drills unexpectedly spend or transmit source data to a provider.
    acceptance: Accepted values behave consistently across callers; invalid values fail explicitly or are consistently off under an agreed contract; fixture-on makes zero provider calls. Coordinate the active migration before touching these seams.
    evidence: PR2484 merged as a61d9505b89c8e3f66c346dd01acf8bbb7dfb37a; complete_text now agrees with the existing callers on case-insensitive 1/true/yes/on. Invalid and whitespace-padded values remain consistently off. The old only1 observation is historical, not current behavior.
  - id: SEC-S0-PERSONAL-LOGINS
    sources: [S1-P-13]
    hypothesis: Users need an honest explanation of successful sign-in history without leaking other users' events or claiming complete security audit coverage.
    tests_first: Preserve successful-login persistence characterization; test self-only authorization before exposing a new read surface.
    in_scope: Decide and document self-service history versus explicit admin-only access; method/time and empty-state honesty.
    out_of_scope: Adding failed-login recording, inferring location, changing login flows and a second usage meter.
    file_fence: [frontend/e2e/usage-ui-characterisation.spec.ts, frontend/components/settings/usage-tab.tsx, "frontend/app/(app)/admin/users/[id]/page.tsx"]
    risk: Calling partial successful sign-ins a full security log or granting an inventor access to admin APIs.
    acceptance: Either a self-authorized history surface or a clear admin-only explanation is agreed; no invented rows or locations. A self-service API requires an independently reviewed additive auth fence before implementation.
    evidence: Backend login/auth-event baselines and existing admin history are prerequisites, not proof of inventor-facing delivery.
```

The [source-content boundary assessment](../stage-0/source-boundary-assessment.md)
preserves the partial SEC-S0-UNTRUSTED evidence and its limits. No product
behavior changed for that assessment; the full contract remains open.

The fixture-mode implementation is [#2484](https://github.com/jxwalker/patent-studio/pull/2484).
An offline refresh on 2026-09-06 at
`622eaaf384ff0c3f4fa7b02f688a783b2dabafaf` passed the **18 selected accepted-value,
off-value and fixture-PRD cases** in `backend/tests/test_ai_multi_fixture_mode.py`
(six unrelated cases deselected). No model or provider was called. This closes
the already-fixed implementation item only, not the remaining SEC assessments,
live-provider quality evidence or a release gate.

## Sequencing

SEC-1 through SEC-5 are implemented in their linked PRs. SEC-6 is confirmed:
the verifier accepted archive and object counts without resolving restored
database keys. Its narrow repair is implemented in the linked PR.

None of these is a public-beta Gate 0 blocker on its own, and none should be
promoted into [`../PUBLIC_BETA_CHECKLIST.md`](../PUBLIC_BETA_CHECKLIST.md)
without an explicit gate decision — except SEC-6, which is already implied by
the open 4C restore drill.

## PBI History

| Timestamp (UTC) | PBI_ID | Event | Details | User |
| --- | --- | --- | --- | --- |
| 2026-08-18T00:00:00Z | SEC-1…SEC-7 | create_pbi | Ten findings from the 1 Aug review of `6fa0f29b` triaged against `main` at `715c011f`; four collapsed into SEC-1 as one root cause. | claude |
| 2026-08-18T00:00:00Z | SEC-7 | closed | Verified fixed on `main`; no blanket admin bypass remains in participant counsel handlers. | claude |
| 2026-08-23T10:56:01Z | SEC-1 | implementation_complete | [PR #1905](https://github.com/jxwalker/patent-studio/pull/1905) separates authorization from navigation visibility and adds fail-closed provenance revalidation; CI, merge, and release gates remain pending. | jxw |
| 2026-08-23T12:02:28Z | SEC-3 | implementation_complete | [PR #1905](https://github.com/jxwalker/patent-studio/pull/1905) removes the project-bound creator-list bypass and revalidates durable job authority; CI, merge, and release gates remain pending. | jxw |
| 2026-08-25T05:03:44Z | SEC-2 | implementation_complete | [PR #1924](https://github.com/jxwalker/patent-studio/pull/1924) rejects non-HTTP(S) source URLs at both write schemas and centralizes fail-closed legacy rendering; focused API and UI regression gates pass, exact-head CI and release gates remain pending. | jxw |
| 2026-08-25T06:00:43Z | SEC-5 | implementation_complete | [PR #1926](https://github.com/jxwalker/patent-studio/pull/1926) enforces active selectable organization context before organization wallet or usage aggregates and returns one generic not-found response for revoked contexts; exact-head CI, merge, and release gates remain pending. | jxw |
| 2026-08-25T06:49:52Z | SEC-4 | implementation_complete | [PR #1928](https://github.com/jxwalker/patent-studio/pull/1928) applies capture-creator ownership to legacy NotebookLM sync while preserving an editor's own shared-patent captures; focused regression passes, exact-head CI and release gates remain pending. | jxw |
| 2026-08-25T07:54:00Z | SEC-6 | implementation_complete | [PR #1932](https://github.com/jxwalker/patent-studio/pull/1932) confirms the restore drill checked only counts, then inventories base-table and live revision-JSON locators, requires regular non-symlinked restored files, and records resolved binding types; exact-head gates remain pending. | jxw |
| 2026-09-01T04:15:40Z | SEC-8 | implementation_started | [PR #2218](https://github.com/jxwalker/patent-studio/pull/2218) adds tests-first containment for stored-file bearer capabilities, unsafe inline media and application/edge error telemetry; exact-head gates, independent review and merge remain pending. | jxw |
