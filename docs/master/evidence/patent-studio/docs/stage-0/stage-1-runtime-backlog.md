# PS-0-19 Stage 1 Runtime work-package backlog

This is the Stage 1 Runtime and Trust **work-package inventory** derived from
Stage 0 findings (PS-0-10, PS-0-11, PS-0-12, PS-0-13, PS-0-17). It is not a
product roadmap and not a second todo list. Product work stays under
[`../delivery/`](../delivery/).

The YAML package list remains the authoritative inventory of claimable
packages. Snapshot SHAs below record the Stage 0 evidence base used when the
backlog was written. They are not the current `main` tip.

## Implementation status (refresh)

**As of:** 2026-09-01 (verified against GitHub; trust git if this drifts)

`implementation_status` is **`in_progress`**. Saying `not_started` is false:
Runtime implementation landed on `main` overnight 31 Aug to 1 Sep 2026
(jxwalker and follow-ons). This section records landed vs still-open leftovers
only. It does not invent new packages or replace open PR file lists.

### Landed on `main` (non-exhaustive)

Resolve merge commits from GitHub. Representative landed work:

| Package / theme | Merged PR(s) |
| --- | --- |
| RT-S1-001 fail-closed durable queue (+ related in-process refuse) | [#2150](https://github.com/jxwalker/patent-studio/pull/2150), [#2156](https://github.com/jxwalker/patent-studio/pull/2156) |
| RT-S1-011 credential decrypt fail-closed | [#2150](https://github.com/jxwalker/patent-studio/pull/2150) |
| RT-S1-002 delivery ownership fencing | [#2164](https://github.com/jxwalker/patent-studio/pull/2164), [#2165](https://github.com/jxwalker/patent-studio/pull/2165) |
| RT-S1-004 worker-loss redelivery | [#2167](https://github.com/jxwalker/patent-studio/pull/2167) |
| RT-S1-010 runtime-setting convergence | [#2211](https://github.com/jxwalker/patent-studio/pull/2211) |
| RT-S1-014 Alembic serialize | [#2153](https://github.com/jxwalker/patent-studio/pull/2153) |
| RT-S1-015 backups record schema revision | [#2155](https://github.com/jxwalker/patent-studio/pull/2155) |
| RT-S1-018 encryption-key escrow recovery | [#2214](https://github.com/jxwalker/patent-studio/pull/2214) |
| RT-S1-019 deletion cleanup persistence | [#2157](https://github.com/jxwalker/patent-studio/pull/2157) |
| RT-S1-021 rate-limit Redis outage policy | [#2224](https://github.com/jxwalker/patent-studio/pull/2224) |
| RT-S1-022 stored-file capability containment | [#2218](https://github.com/jxwalker/patent-studio/pull/2218) |
| Session end (token_version / migration 149) | [#2152](https://github.com/jxwalker/patent-studio/pull/2152) |
| Orphaned AI credit reservation sweep | [#2163](https://github.com/jxwalker/patent-studio/pull/2163) |
| Blocking backend type gate | [#2154](https://github.com/jxwalker/patent-studio/pull/2154) |
| Impact packets beyond one shard share | [#2182](https://github.com/jxwalker/patent-studio/pull/2182) |
| Public-beta status snapshot refresh | [#2168](https://github.com/jxwalker/patent-studio/pull/2168) |

Individual package YAML rows below may still omit a per-package `status`
field. Prefer GitHub merge state over an absent field.

### The #1905 freeze is discharged (2026-09-02)

After PR #1905 merged, six paths carried a standing "do not touch" across this
backlog: `backend/app/access.py`, `backend/app/counsel/**`,
`backend/app/generation/**`, `backend/app/routers/generation.py`,
`frontend/lib/api.ts`, and Alembic 146. Nothing enforced it — no CI job, no
CODEOWNERS rule — but it appeared as 26 `#1905 paths` fences here, in the
`deny_for_this_backlog_pr` guardrail, and in `threat-model.md`.

The freeze was scoped to Stage 0 characterisation, and that work has merged, so
it is released. Its two consequences are settled with it:

- RT-S1-012 and RT-S1-013 were blocked on nothing else and are now claimable.
- RT-S1-001's `external_blocker` offered "release the freeze **or** ratify a
  non-frozen adapter boundary". The second already happened: both former frozen
  callers (`counsel/background.py`, `generation/background.py`) import and call
  `app.job_queue.enqueue_task`, so no caller bypasses the common boundary.

These paths keep no standing prohibition. They are a 100-file authorization
boundary, so change them with a behaviour-level test and review — not because a
fence here forbids it.

### Stage 1 leftovers (do not close from docs)

This section used to carry a table of "still-open" Stage 1 pull requests,
refreshed by hand. It was wrong every time anyone read it. The table this
change removes named twelve pull requests as open; within days all but one of
them had merged or been closed. Trimming it back to the survivors was tried
first, and that shorter list went stale inside a day as well — which is the
point: a hand-maintained list of open pull requests cannot stay right, because
the state it describes changes without anyone touching this file. The document
decays while sitting still. So the table is removed rather than refreshed
again.

Ask GitHub instead:

```bash
gh pr list --state open --search "RT-S1"   # Stage 1 Runtime leftovers
gh pr list --state open                    # everything, any agent prefix
scripts/agents/list_open_pr_files.sh       # exact files each one changes
```

Open PRs are authoritative for exact file lists; the open-PR file scan is the
collision check. `claude/*`, `jxw/*` and `cursor/*` branches all land here, so
do not assume a package is unclaimed because this document does not name it —
and do not close a leftover from a documentation refresh.

A package owner must still fetch fresh `main`, repeat the open-PR collision
check, preserve its file fence, and record a behaviour-level RED before
changing production code. The helper-missing RED commits in PS-0-17 prove test
ordering only; they are not substitutes for the behavioural RED required here.

```yaml
schema_version: 1
backlog_id: "PS-0-19"
issue: 2065
snapshot_date: "2026-08-30"
backlog_base_sha: "9b493b1f7f067b237190f5d0222db3e59b4d229a"
scope: "Stage 1 Runtime and Trust packages derived from Stage 0 evidence"
implementation_status: "in_progress"
status_refreshed_date: "2026-09-02"

source_findings:
  ps_0_10:
    title: "Job-submit and silent local fallback characterisation"
    pr: 2025
    state: "merged"
    source_head_sha: "5cd3d8af384fe660f506c6f36097736b13cc3bd2"
    landed_main_sha: "9a8b9805e9cb6a27e1ef45e36dd07ef8793af88a"
    evidence_paths: ["backend/tests/test_job_queue_fallback_characterisation.py"]
  ps_0_11:
    title: "Workflow-mode persistence characterisation"
    pr: 2043
    state: "merged"
    source_head_sha: "37b63dacde7885180a1082afc0894ae3bd191953"
    landed_main_sha: "9b493b1f7f067b237190f5d0222db3e59b4d229a"
    evidence_paths: ["backend/tests/test_workflow_mode_persistence.py"]
  ps_0_12:
    title: "Threat model and failure-mode inventory"
    pr: 2049
    state: "merged"
    inventoried_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41"
    source_head_sha: "1c2a16731e87055679d00964a8bbb35517146c3b"
    landed_main_sha: "d0204fb0d48add3de84373a65a6228ff7cf124a6"
    evidence_paths: ["docs/stage-0/threat-model.md"]
  ps_0_13:
    title: "Queue, worker, migration, and restore reliability baseline"
    pr: 2051
    state: "merged"
    inventoried_sha: "d0204fb0d48add3de84373a65a6228ff7cf124a6"
    source_head_sha: "f1cec4c8a11c721c6eaf210186851f67b85952e8"
    landed_main_sha: "cf62021620f9d28c187c5968f17ab41cbd744753"
    evidence_paths: ["docs/stage-0/reliability-baseline.md", "backend/tests/test_stage0_reliability_baseline.py"]
  ps_0_17:
    title: "Real test-DB runtime characterisation drill"
    pr: 2058
    state: "merged"
    inventoried_sha: "007e34d1eda9ed768e084eed23e5378e84157ea2"
    source_head_sha: "3a5f6b16190b77dd34d99ce96a648461728a26b3"
    landed_main_sha: "48e48504e72c871d2aa309c9c0f12e8fb8fba2e1"
    first_green_evidence_sha: "1f65a52f796d0c5044a6d23187811beca9e60662"
    evidence_paths: ["docs/stage-0/runtime-characterisation-drill.md", "backend/tests/test_runtime_characterisation_drill.py"]

guardrails:
  tests_first: "Every implementation package starts with a behaviour-level failing acceptance test against current code."
  one_package_per_pr: true
  production_mutation_in_backlog_pr: false
  reverify_open_source_prs: []
  deny_for_this_backlog_pr:
    - "backend/tests/test_runtime_characterisation_drill.py"
    - "docs/stage-0/runtime-characterisation-drill.md"
    - "frontend Autopilot labels"
    - "live records and release environments"

packages:
  - id: "RT-S1-001"
    title: "Fail-closed durable queue submission"
    priority: "P0"
    hypothesis: >-
      When Celery is configured, refusing a request whose broker submission fails and marking its durable job honestly prevents accepted work from silently moving into an API-process fallback.
    tests_first: ["RED executable caller inventory proves whether every production enqueue reaches the typed fail-closed boundary", "RED helper test: send_task failure schedules no fallback and raises a typed submission error", "RED route matrix: every persisted job becomes failed/queue_unavailable and every response is retryable", "Regression: successful Celery submission returns its task ID without local fallback", "Regression: explicit development-only inprocess mode runs only when deliberately configured outside production"]
    in_scope: ["executable production-caller inventory and coverage gate", "typed enqueue failure", "durable job state", "caller response contract", "queue outage telemetry"]
    out_of_scope: ["worker redelivery", "provider idempotency", "frontend redesign", "partial production enforcement"]
    file_fence: {allow: ["backend/app/job_queue.py", "backend/app/background_jobs.py", "new enqueue-caller coverage test", "backend/tests/test_job_queue_*.py", "production enqueue callers"], deny: ["#2058 files"]}
    risk: {severity: "high", failure: "A partial rollout can leave callers treating a rejected enqueue as accepted", rollout: "do not enable a partial production flag; land one enforced boundary and complete caller coverage atomically, with explicit development inprocess as the only escape hatch"}
    acceptance: ["An executable gate enumerates every production enqueue caller and reports no uncovered path", "No Celery exception anywhere in production schedules BackgroundTasks, asyncio work, or another in-process fallback", "The durable row and API response say the queue rejected the work", "No provider/object side effect occurs before durable enqueue succeeds", "Every production enqueue caller reaches app.job_queue.enqueue_task; counsel/background.py and generation/background.py already do"]
    evidence: [{source: "PS-0-10/#2025", finding_sha: "5cd3d8af384fe660f506c6f36097736b13cc3bd2", findings: ["silent-fastapi-fallback", "silent-asyncio-fallback"]}, {source: "PS-0-17/#2058", finding_sha: "007e34d1eda9ed768e084eed23e5378e84157ea2", pr_head_sha: "3a5f6b16190b77dd34d99ce96a648461728a26b3", findings: ["queue-outage-persists-inprocess-success"]}]
    depends_on: []

  - id: "RT-S1-002"
    title: "Fence background-job updates by delivery ownership"
    priority: "P0"
    hypothesis: >-
      A durable attempt/delivery token compared on every worker-owned update prevents a stale or replacement delivery from overwriting the current attempt using only the job ID.
    tests_first: ["RED real-DB race: delivery B replaces task_id and delivery A can still commit", "RED terminal/control race: stale delivery cannot override pause, cancel, or a newer attempt", "Regression: operator control routes remain authoritative"]
    in_scope: ["attempt identity", "compare-and-set worker updates", "worker-start metadata", "migration/backfill for active jobs"]
    out_of_scope: ["business idempotency for external effects", "global reject-on-worker-loss switch"]
    file_fence: {allow: ["backend/app/background_jobs.py", "backend/app/models.py", "new Alembic migration from current head", "backend/tests/test_*job*.py"], deny: ["Alembic 146", "#2058 files"]}
    risk: {severity: "high", failure: "Incorrect fencing can strand legitimate retries or permit stale completion", rollout: "dual-read old rows, require token only for newly claimed attempts, then backfill/expire old active rows"}
    acceptance: ["A stale delivery update returns false and changes no durable/domain state", "The current delivery can progress and complete", "Pause/cancel/terminal states still win races"]
    evidence: [{source: "PS-0-17/#2058", finding_sha: "007e34d1eda9ed768e084eed23e5378e84157ea2", pr_head_sha: "3a5f6b16190b77dd34d99ce96a648461728a26b3", findings: ["generic-update-not-owner-guarded"]}]
    depends_on: []

  - id: "RT-S1-003"
    title: "Make external effects idempotent by task family"
    priority: "P0"
    hypothesis: >-
      Durable idempotency keys and commit markers around provider calls, object writes, billing, and notifications make at-least-once delivery safe enough to redeliver after worker loss.
    tests_first: ["RED kill-point tests at provider-call, object-write, and DB-commit boundaries", "RED duplicate-delivery tests compare cost, objects, and audit rows", "Regression matrix covers every queue task with an external effect"]
    in_scope: ["task-family inventory", "effect keys", "commit/reconciliation markers", "orphan and cost checks"]
    out_of_scope: ["changing Celery rejection before family gates pass"]
    file_fence: {allow: ["backend/app/workers/**", "backend/app/object_storage.py", "billing/provider ledgers", "backend/tests/test_*worker*.py"], deny: ["#2058 files"]}
    risk: {severity: "critical", failure: "A false idempotency claim can duplicate spend or produce conflicting legal artifacts", rollout: "ship one task family per PR and keep global rejection disabled until the coverage ledger is complete"}
    acceptance: ["Each effectful task has a named durable idempotency boundary", "Duplicate delivery yields one authoritative output and one billable effect", "Kill-point evidence is retained per family"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", pr_head_sha: "1c2a16731e87055679d00964a8bbb35517146c3b", findings: ["JQ-2"]}, {source: "PS-0-13/#2051", finding_sha: "d0204fb0d48add3de84373a65a6228ff7cf124a6", findings: ["Celery delivery", "Worker timeout"]}]
    depends_on: ["RT-S1-002"]

  - id: "RT-S1-004"
    title: "Enable explicit worker-loss rejection"
    priority: "P0"
    hypothesis: >-
      Setting the effective global worker-loss rejection policy only after ownership and effect idempotency are proven converts a lost child process into controlled redelivery rather than an abandoned or duplicative job.
    tests_first: ["RED cold-process config expects task_reject_on_worker_lost=true", "RED real Celery drill kills the child after claim and observes one fenced redelivery", "Regression: task-specific overrides cannot silently disable the policy"]
    in_scope: ["global Celery setting", "effective-config assertion", "worker-kill integration drill", "runbook signal"]
    out_of_scope: ["task-family idempotency implementation", "whole-host failure recovery"]
    file_fence: {allow: ["backend/app/workers/celery_app.py", "backend/tests/test_stage0_reliability_baseline.py successor tests", "worker drill tests", "runtime runbook"], deny: ["#2058 files"]}
    risk: {severity: "high", failure: "Early enablement can amplify duplicate external effects", rollout: "block merge on RT-S1-002/003 evidence and canary selected queues before all lanes"}
    acceptance: ["Cold and deployed effective config report true", "Killed child delivery is reclaimed once", "Duplicate/stale completion is fenced and observable"]
    evidence: [{source: "PS-0-13/#2051", finding_sha: "d0204fb0d48add3de84373a65a6228ff7cf124a6", pr_head_sha: "f1cec4c8a11c721c6eaf210186851f67b85952e8", findings: ["task_reject_on_worker_lost=None"]}, {source: "PS-0-17/#2058", finding_sha: "007e34d1eda9ed768e084eed23e5378e84157ea2", pr_head_sha: "3a5f6b16190b77dd34d99ce96a648461728a26b3", findings: ["worker-loss-not-globally-rejected"]}]
    depends_on: ["RT-S1-002", "RT-S1-003"]

  - id: "RT-S1-005"
    title: "Bound cooperative pause, cancel, and timeout effects"
    priority: "P1"
    hypothesis: >-
      Declared interruption checkpoints and bounded provider operations make pause/cancel/timeout state honest without promising instantaneous interruption.
    tests_first: ["RED task-family timing tests request cancel during provider work", "RED hard-timeout test inventories partial DB/object/provider effects", "Regression: completed and terminal jobs remain immutable"]
    in_scope: ["checkpoint contract", "bounded provider timeout", "partial-effect cleanup", "honest job detail"]
    out_of_scope: ["provider-side cancellation where unsupported", "instantaneous UI promise"]
    file_fence: {allow: ["backend/app/background_jobs.py", "worker families", "backend/tests/test_*control*.py", "runtime docs"], deny: ["frontend Autopilot labels"]}
    risk: {severity: "high", failure: "Cancellation can be reported before spend or writes actually stop", rollout: "add measurements before changing user-visible state semantics"}
    acceptance: ["Every effectful family declares maximum cancellation latency", "Timeout/cancel leaves a reconciled terminal state", "In-flight provider effects are recorded rather than hidden"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["JQ-3", "JQ-7"]}, {source: "PS-0-13/#2051", finding_sha: "d0204fb0d48add3de84373a65a6228ff7cf124a6", findings: ["Worker timeout"]}]
    depends_on: ["RT-S1-002"]

  - id: "RT-S1-006"
    title: "Serialize worker-start reconciliation without Redis fail-open races"
    priority: "P1"
    hypothesis: >-
      A database-backed ownership lock or provably idempotent reconciliation keeps a Redis outage during fleet restart from launching competing repairs.
    tests_first: ["RED concurrent worker-ready test makes Redis lock fail for multiple workers", "RED real-DB repair race asserts one authoritative transition", "Regression: one worker still repairs after a normal restart"]
    in_scope: ["reconciliation ownership", "transactional idempotency", "metrics for skipped/claimed repair"]
    out_of_scope: ["general Redis replacement", "scheduler ownership"]
    file_fence: {allow: ["backend/app/workers/celery_app.py", "backend/app/domain_job_reconciliation.py", "backend/tests/test_domain_job_reconciliation.py"]}
    risk: {severity: "medium", failure: "A lock that fails closed can suppress all repair; fail-open can duplicate it", rollout: "prove lease expiry and recovery from owner death"}
    acceptance: ["At most one reconciler mutates a row per restart window", "Owner loss permits bounded takeover", "Redis outage is visible and does not multiply repair"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["JQ-4"]}, {source: "PS-0-13/#2051", finding_sha: "d0204fb0d48add3de84373a65a6228ff7cf124a6", findings: ["Worker restart"]}]
    depends_on: []

  - id: "RT-S1-007"
    title: "Give periodic scheduling a distributed singleton contract"
    priority: "P1"
    hypothesis: >-
      Scheduler ownership independent of responder replica count prevents duplicate dispatch when an operator or recovery event starts a second beat instance.
    tests_first: ["RED two-scheduler integration test observes duplicate due work", "RED owner-loss test proves bounded takeover", "Regression: normal responder processing is independent of scheduler ownership"]
    in_scope: ["beat ownership lease", "duplicate-dispatch idempotency", "lane health signal"]
    out_of_scope: ["redesigning responder business logic", "changing all schedules"]
    file_fence: {allow: ["backend/app/workers/celery_app.py", "docker-compose.yml", "scheduler tests", "operations docs"]}
    risk: {severity: "medium", failure: "Bad ownership can stop schedules or dispatch twice", rollout: "shadow ownership metrics before enforcing singleton"}
    acceptance: ["Two instances dispatch each due key once", "Lease owner death is recoverable", "Deployment no longer relies only on replica count one"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["JQ-8"]}, {source: "PS-0-13/#2051", finding_sha: "d0204fb0d48add3de84373a65a6228ff7cf124a6", findings: ["Scheduler"]}]
    depends_on: ["RT-S1-003"]

  - id: "RT-S1-008"
    title: "Revalidate authority and entitlement at worker execution"
    priority: "P0"
    hypothesis: >-
      Reloading creator, tenant role, account state, and entitlement immediately before side effects stops revoked queued work from generating or storing an export.
    tests_first: ["RED enqueue-then-revoke race still creates the filing export", "RED entitlement/account disable races", "Regression: stored-file redemption remains independently authorized"]
    in_scope: ["filing-export worker recheck", "failed/revoked job state", "no-side-effect assertion"]
    out_of_scope:
      - "changing the canonical authorization kernel"
      - "revoking already downloaded bytes"
    file_fence: {allow: ["backend/app/routers/export.py", "backend/tests/test_*export*.py", "job authorization helpers outside access.py"], deny: ["backend/app/access.py"]}
    risk: {severity: "critical", failure: "A check at enqueue time can be stale by execution time", rollout: "land per worker family; filing export first"}
    acceptance: ["Revocation before execution creates no output row or object", "Job detail names the rejected authority boundary without leaking tenant data", "Authorized work still completes"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", pr_head_sha: "1c2a16731e87055679d00964a8bbb35517146c3b", findings: ["JQ-5", "revoked-editor-attacker-story"]}]
    depends_on: ["RT-S1-002"]

  - id: "RT-S1-009"
    title: "Complete the tenant-route and job-family authorization matrix"
    priority: "P1"
    hypothesis: >-
      Executable two-user negative tests for every tenant route and job family catch missing canonical authority or monotone source/provenance checks that code review alone cannot prove complete.
    tests_first: ["Generate RED matrix entries for unclassified tenant routes and job kinds", "Swap tenant/ancestor/source/job IDs across detail, control, retry, and stream routes", "Assert response status and bounded body do not become an existence oracle"]
    in_scope: ["tenant route inventory", "job family registry", "canonical and provenance authority", "404/403 response invariance"]
    out_of_scope: ["rewriting access.py", "ordinary product navigation"]
    file_fence: {allow: ["backend/app/routers/jobs.py", "backend/tests/test_tenant_access_*.py", "backend/tests/test_*job*authorization*.py", "docs/security/tenant_access_matrix.csv", "one separately validated route per follow-up PR"], deny: ["backend/app/access.py"]}
    risk: {severity: "critical", failure: "One omitted family can expose another tenant's metadata or controls", rollout: "tests may land before fixes; split each validated gap into its own PR"}
    acceptance: ["Every tenant route and registered job kind has a named authority source", "Cross-tenant reads/mutations/streams are negative-tested", "Unknown routes and families fail closed or fail the coverage gate"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["AT-3", "AT-4", "AT-5"]}]
    depends_on: []

  - id: "RT-S1-010"
    title: "Measure and bound runtime-setting and emergency-stop convergence"
    priority: "P1"
    hypothesis: >-
      Versioned refresh age, component acknowledgements, and critical-setting policy make stale cached controls detectable and bound the time an AI pause or revocation can be ignored.
    tests_first: ["RED multi-process test makes refresh fail and observes stale control use", "RED in-flight provider attempt measures pause latency", "Regression: noncritical refresh outage preserves declared availability"]
    in_scope: ["settings version/age", "API and worker convergence", "critical versus noncritical policy", "AI pause evidence"]
    out_of_scope: ["instant provider cancellation", "all configuration moving into PostgreSQL"]
    file_fence: {allow: ["backend/app/runtime_settings.py", "backend/app/main.py", "backend/app/workers/async_runner.py", "backend/app/ai/access.py", "runtime tests"]}
    risk: {severity: "high", failure: "Fail-closed all settings can take down reads; fail-open critical settings extends spend/egress", rollout: "classify settings before enforcement and expose refresh-age first"}
    acceptance: ["Every process exposes applied settings version and age", "Critical revocation has a tested maximum convergence time", "Refresh failure produces an actionable health signal"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["JQ-7", "SR-2", "runtime-emergency-setting-story"]}]
    depends_on: []

  - id: "RT-S1-011"
    title: "Fail closed and identify platform credential source on decrypt errors"
    priority: "P0"
    hypothesis: >-
      Treating database-key decryption failure as an incident instead of silently switching to an environment credential prevents hidden account/provider-context changes.
    tests_first: ["RED corrupt ciphertext currently falls through to environment key", "RED wrong ENCRYPTION_KEY path", "Regression: explicit absent-database-key policy can use a documented environment fallback"]
    in_scope: ["credential-source state", "decrypt-error classification", "safe alerting", "provider attempt refusal"]
    out_of_scope: ["key rotation", "printing secret material", "removing all environment credentials"]
    file_fence: {allow: ["backend/app/ai/platform_keys.py", "backend/tests/test_*platform*key*.py", "configuration docs"]}
    risk: {severity: "high", failure: "Over-broad failure can block all AI; silent fallback can use the wrong funded account", rollout: "distinguish not-configured from corrupt/undecryptable before enforcement"}
    acceptance: ["Decrypt failure never selects another credential source", "Logs/metrics name source and error class without key content", "Documented environment-only configuration still works"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["SR-2a"]}]
    depends_on: []

  - id: "RT-S1-012"
    title: "Introduce one canonical durable workflow-mode field"
    priority: "P1"
    hypothesis: >-
      A validated canonical mode field with explicit legacy translation removes ambiguity between full_auto and auto_gates while preserving existing resumed runs.
    tests_first: ["RED migration fixtures for autopilot/copilot/guided and malformed legacy combinations", "RED fresh-session API persistence test uses the canonical field", "Regression: legacy rows and unrelated config keys survive"]
    in_scope: ["canonical enum/column", "legacy read/backfill", "serialization contract", "new migration after current head"]
    out_of_scope: ["changing mode meaning", "deleting legacy fields in the first rollout"]
    file_fence: {allow: ["backend/app/models.py", "new workflow-mode service", "new Alembic migration", "backend/tests/test_workflow_mode_persistence.py successor tests", "backend/app/routers/generation.py", "backend/app/generation/**"], deny: ["Alembic 146"]}
    risk: {severity: "high", failure: "Bad translation can resume a run with the wrong review policy", rollout: "dual-read/write, compare derived and canonical modes, then cut over"}
    acceptance: ["Every persisted run resolves to exactly one valid mode", "Malformed combinations fail safely and are reportable", "Old and new rows resume with unchanged checkpoints"]
    evidence: [{source: "PS-0-11/#2043", finding_sha: "37b63dacde7885180a1082afc0894ae3bd191953", findings: ["distributed-full_auto-auto_gates-representation"]}]
    depends_on: []

  - id: "RT-S1-013"
    title: "Make workflow-mode changes durable, ordered, and auditable"
    priority: "P1"
    hypothesis: >-
      An append-only change ledger with actor, timestamp, previous/new mode, and concurrency version prevents the current ten-entry config cap and last-write-wins races from erasing decision history.
    tests_first: ["RED eleven changes prove the oldest entry disappears", "RED concurrent switches prove one silently overwrites ordering", "Regression: API response and fresh-session state agree"]
    in_scope: ["append-only ledger", "optimistic concurrency", "actor/time/reason", "bounded read projection"]
    out_of_scope: ["retaining unlimited data without policy", "UI timeline redesign"]
    file_fence: {allow: ["backend/app/models.py", "new workflow-mode ledger module", "new Alembic migration", "backend/tests/test_workflow_mode_persistence.py successor tests", "backend/app/routers/generation.py"], deny: ["Alembic 146"]}
    risk: {severity: "medium", failure: "Audit order can diverge from effective mode under concurrent writes", rollout: "write ledger and legacy projection in one transaction"}
    acceptance: ["No accepted change vanishes at entry eleven", "Concurrent updates return a conflict or deterministic order", "Effective mode is reproducible from durable evidence"]
    evidence: [{source: "PS-0-11/#2043", finding_sha: "37b63dacde7885180a1082afc0894ae3bd191953", findings: ["mode_changes-latest-ten-only", "no-canonical-mode-column"]}]
    depends_on: ["RT-S1-012"]

  - id: "RT-S1-014"
    title: "Serialize Alembic upgrade ownership across API and worker lanes"
    priority: "P0"
    hypothesis: >-
      A single migration leader or PostgreSQL advisory lock prevents concurrent container entrypoints from applying the same upgrade while preserving fail-fast startup.
    tests_first: ["RED launch parallel entrypoints against one disposable database", "RED owner-death/timeout takeover", "Regression: migration failure blocks dependent process startup"]
    in_scope: ["migration lock/leader", "timeout and diagnostics", "API/worker entrypoint ordering", "monitor exception documentation"]
    out_of_scope: ["down migrations", "editing historical migrations", "automatic destructive rollback"]
    file_fence: {allow: ["backend/docker-entrypoint.sh", "new migration-lock helper", "docker-compose.yml", "entrypoint integration tests", "release docs"], deny: ["backend/alembic/versions/**"]}
    risk: {severity: "high", failure: "A stuck lock can prevent the fleet starting; no lock can race DDL", rollout: "bounded advisory lock with owner diagnostics and explicit timeout"}
    acceptance: ["Parallel starts execute upgrade once", "No API/worker starts before success", "Owner loss produces bounded recovery or a loud stop"]
    evidence: [{source: "PS-0-13/#2051", finding_sha: "d0204fb0d48add3de84373a65a6228ff7cf124a6", findings: ["Container start"]}, {source: "PS-0-17/#2058", finding_sha: "007e34d1eda9ed768e084eed23e5378e84157ea2", findings: ["single-head-match-does-not-prove-concurrent-start"]}]
    depends_on: []

  - id: "RT-S1-015"
    title: "Require and verify Alembic revision in directory backups"
    priority: "P0"
    hypothesis: >-
      Recording the live database revision and rejecting absent, malformed, or mismatched revisions before application use prevents a checksummed but schema-unbound directory restore from being called compatible.
    tests_first: ["RED current manifest without Alembic reaches Docker/full restore", "RED backup cannot read current revision", "RED restored alembic_version differs from manifest or checked-out compatibility policy"]
    in_scope: ["backup manifest field", "preflight validation", "post-restore DB comparison", "report evidence"]
    out_of_scope: ["automatic downgrade", "silently migrating an incompatible restore", "production restore in the implementation PR"]
    file_fence: {allow: ["scripts/backup_prod.sh", "scripts/restore_verify.sh", "backend/tests/test_backup_restore_scripts.py", "backend/tests/test_restore_drill.py", "recovery docs"], deny: ["#2058 files"]}
    risk: {severity: "high", failure: "An over-strict equality rule can reject a safely forward-migratable backup; a weak rule accepts incompatible schema", rollout: "define compatibility policy explicitly and report recorded/restored/source revisions separately"}
    acceptance: ["New directory manifests contain a validated revision", "Missing/malformed revision fails before Docker volumes are created", "Restore report records and compares manifest, restored DB, and application-compatible head"]
    evidence: [{source: "PS-0-13/#2051", finding_sha: "d0204fb0d48add3de84373a65a6228ff7cf124a6", pr_head_sha: "f1cec4c8a11c721c6eaf210186851f67b85952e8", findings: ["Directory restore"]}, {source: "PS-0-17/#2058", finding_sha: "007e34d1eda9ed768e084eed23e5378e84157ea2", pr_head_sha: "3a5f6b16190b77dd34d99ce96a648461728a26b3", findings: ["revisionless-full-restore-passed"]}]
    depends_on: []

  - id: "RT-S1-016"
    title: "Automate Restic restore schema compatibility"
    priority: "P1"
    hypothesis: >-
      Machine comparison of recorded, restored, and application-compatible revisions removes the current operator-only schema decision from Restic recovery.
    tests_first: ["RED missing/unknown manifest revision", "RED restored DB revision conflicts with manifest", "RED newer-than-application and safely older cases"]
    in_scope: ["Restic manifest validation", "restored DB query", "explicit compatibility policy", "machine-readable report"]
    out_of_scope: ["automatic down migration", "directory restore path"]
    file_fence: {allow: ["scripts/restic_backup.sh", "scripts/restic_restore.sh", "Restic script tests", "recovery docs"], deny: ["backend/alembic/versions/**"]}
    risk: {severity: "high", failure: "Manual comparison can be skipped; automatic equality can block valid forward recovery", rollout: "test policy across representative historical heads"}
    acceptance: ["Restore refuses unknown/incompatible schema", "Report states all three revisions and decision", "Forward migration requires an explicit tested path"]
    evidence: [{source: "PS-0-13/#2051", finding_sha: "d0204fb0d48add3de84373a65a6228ff7cf124a6", findings: ["Restic restore"]}]
    depends_on: []

  - id: "RT-S1-017"
    title: "Add post-restore application and evidence-integrity smoke"
    priority: "P1"
    hypothesis: >-
      Starting the exact compatible application against restored DB/objects and verifying evidence chains proves more than counts and storage-key binding alone.
    tests_first: ["RED restored fixture with valid counts but broken evidence/package semantics", "RED exact application cannot boot/read representative artifacts", "Regression: NotebookLM sessions remain excluded"]
    in_scope: ["authenticated read smoke", "evidence-chain/package verification", "non-empty artifact fixture", "restore report"]
    out_of_scope: ["live production data in CI", "provider calls", "legal correctness of patent content"]
    file_fence: {allow: ["scripts/restore_verify.sh", "scripts/verify_restore_bindings.py", "restore drill tests/fixtures", "recovery docs"], deny: ["#2058 files"]}
    risk: {severity: "high", failure: "A synthetic empty archive can pass while real artifacts or evidence semantics are unrecoverable", rollout: "use sanitized representative fixtures and no external providers"}
    acceptance: ["At least one non-empty artifact and evidence chain is restored/read", "Exact application boot and authenticated read pass", "Failure is retained in a machine-readable report"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["DR-9", "EX-5"]}, {source: "PS-0-17/#2058", finding_sha: "007e34d1eda9ed768e084eed23e5378e84157ea2", findings: ["empty-artifact-archive-not-production-proof"]}]
    depends_on: ["RT-S1-030"]

  - id: "RT-S1-018"
    title: "Prove encryption-key escrow recovery without exposing the key"
    priority: "P0"
    hypothesis: >-
      A separately controlled key-escrow drill that decrypts canary ciphertext after restore proves encrypted configuration recovery without placing ENCRYPTION_KEY in backups or logs.
    tests_first: ["RED restore with no/wrong key cannot decrypt canary", "RED drill detects key mismatch without printing secrets", "Regression: backup still excludes key and NotebookLM sessions"]
    in_scope: ["escrow ownership", "canary decrypt", "rotation/loss runbook evidence", "access audit"]
    out_of_scope: ["rotating production ENCRYPTION_KEY", "copying key into backup", "real provider calls"]
    file_fence: {allow: ["scripts/*restore*", "key-escrow drill script/tests", "docs/operations/BACKUP_RESTORE.md", "configuration docs"], deny: ["secret values", "live environment mutation"]}
    risk: {severity: "critical", failure: "Lost key or unsafe drill can make all encrypted settings unusable or disclose the master capability", rollout: "canary-only, two-person access, redacted evidence"}
    acceptance: ["Correct escrowed key decrypts canary after restore", "Wrong/missing key fails loudly", "No key material enters repository, report, or backup"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["DR-8", "SR-1"]}, {source: "PS-0-13/#2051", finding_sha: "d0204fb0d48add3de84373a65a6228ff7cf124a6", findings: ["Secret recovery"]}]
    depends_on: []

  - id: "RT-S1-019"
    title: "Persist and retry post-commit permanent-deletion cleanup"
    priority: "P0"
    hypothesis: >-
      A durable cleanup ledger created in the same transaction as DB deletion keeps orphaned sensitive objects discoverable and retryable after process/log failure.
    tests_first: ["RED object deletion fails after DB commit and only file_cleanup_pending/log remains", "RED process dies before cleanup", "Regression: unsafe paths and protected evidence still fail closed"]
    in_scope: ["durable cleanup item", "retry/reconciliation", "correlation and completion receipt", "operator visibility"]
    out_of_scope: ["weakening RESTRICT constraints", "automatic legal-hold decisions", "backup pruning"]
    file_fence: {allow: ["backend/app/admin_workspace_deletion.py", "backend/app/routers/admin_workspaces.py", "backend/app/models.py", "new migration", "backend/tests/test_admin_workspaces.py"], deny: ["Alembic 146"]}
    risk: {severity: "high", failure: "DB record can be gone while primary bytes persist with no durable retry", rollout: "write ledger before deletion commit; make retries idempotent"}
    acceptance: ["Every pending object has a durable cleanup record", "Process restart resumes cleanup", "Completion/failure is auditable without exposing object contents"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["DR-4", "DR-5"]}]
    depends_on: ["RT-S1-001"]

  - id: "RT-S1-020"
    title: "Reconcile superseded and unbound object-storage orphans"
    priority: "P1"
    hypothesis: >-
      A safe DB-to-object inventory with quarantine and idempotent deletion bounds storage drift from failed replacement cleanup without deleting evidence or current bytes.
    tests_first: ["RED replacement commit succeeds and old-object delete fails", "RED inventory distinguishes current, protected, pending, and orphan objects", "RED symlink/prefix/backend ambiguity fails closed"]
    in_scope: ["orphan inventory", "quarantine/retention window", "metrics", "durable reconciliation"]
    out_of_scope: ["immediate irreversible deletion", "backup snapshot pruning", "Evidence Ledger custody deletion"]
    file_fence: {allow: ["backend/app/object_storage.py", "new reconciliation module/task", "object-storage tests", "operations docs"]}
    risk: {severity: "high", failure: "False orphan classification can destroy authoritative evidence", rollout: "report-only inventory, then quarantine, then separately authorized deletion"}
    acceptance: ["Current/protected objects are never candidates", "Known failed cleanup becomes measurable", "Deletion requires elapsed quarantine and repeat proof"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["EX-4", "DR-5"]}]
    depends_on: ["RT-S1-019"]

  - id: "RT-S1-021"
    title: "Prove and monitor the Redis rate-limit outage policy"
    priority: "P2"
    hypothesis: >-
      Failure-injection and health signals make the intentional read-fail-open/write-fail-closed policy measurable and prevent an unnoticed Redis outage from becoming unbounded read load.
    tests_first: ["RED load test with limiter Redis unavailable", "Assert mutating requests fail and reads carry the diagnostic header", "Regression: paid work cannot bypass the write boundary"]
    in_scope: ["outage tests", "alert threshold", "read-load guard", "diagnostic consistency"]
    out_of_scope: ["changing the policy without capacity evidence", "replacing Redis"]
    file_fence: {allow: ["backend/app/ratelimit.py", "backend/app/observability*.py", "rate-limit tests", "operations docs"]}
    risk: {severity: "medium", failure: "Reads can exhaust capacity while all writes are unavailable", rollout: "instrument before tuning fail-open limits"}
    acceptance: ["Outage behaviour is deterministic and alerted", "Reads remain bounded by a documented emergency limit", "Mutations and paid work remain fail closed"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["JQ-6"]}]
    depends_on: []

  - id: "RT-S1-022"
    title: "Contain stored-file capabilities, unsafe downloads, and log leakage"
    priority: "P1"
    hypothesis: >-
      Preserving audience/current-record authorization while eliminating or redacting query tokens, forcing unsafe content to a safe download boundary, and testing canary content prevents bearer capabilities or invention content leaking beyond their intended path.
    tests_first: ["RED canary token/content through error paths and inspect captured logs", "RED edge/access-log query handling", "Regression: user/key swaps and revoked links remain rejected", "Regression: unsafe MIME/content-disposition matrix remains attachment-only and sandboxed"]
    in_scope: ["token audience/current-record binding", "token transport/redaction", "MIME and disposition boundary", "structured logging policy", "canary tests", "support telemetry"]
    out_of_scope: ["claiming provider-side retention controls", "frontend/lib/api.ts"]
    file_fence: {allow: ["backend/app/routers/stored_files.py", "backend/app/observability.py", "logging tests", "edge configuration/runbooks"], deny: ["frontend/lib/api.ts"]}
    risk: {severity: "high", failure: "Bearer capability or confidential content can persist outside application retention", rollout: "redaction first; transport change only with explicit frontend owner"}
    acceptance: ["User/key swaps, access removal, record replacement, and expiry reject redemption", "Unsafe or ambiguous formats cannot execute inline", "Canary tokens/content are absent from every captured log and tests use synthetic data only"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["EX-1", "EX-1a", "EX-2", "SR-3"]}]
    depends_on: []

  - id: "RT-S1-023"
    title: "Reduce worker process credentials and mounts by lane"
    priority: "P1"
    hypothesis: >-
      Effective per-lane DB roles, secret sets, provider credentials, and filesystem mounts reduce the blast radius of one compromised worker compared with the shared backend image/capability set.
    tests_first: ["Inventory effective Compose secrets, mounts, DB grants, and outbound providers per lane", "RED least-privilege tests attempt an unrelated lane capability", "Regression: each lane completes its owned workloads"]
    in_scope: ["effective Compose", "DB roles", "mounts", "secret injection", "network/provider egress"]
    out_of_scope: ["application authorization rewrite", "claiming logical queues are security isolation"]
    file_fence: {allow: ["docker-compose*.yml", "deployment secret templates", "worker capability tests", "operations docs"], deny: ["secret values"]}
    risk: {severity: "critical", failure: "A broad process compromise can cross tenants and credential domains", rollout: "inventory, deny tests, then one lane at a time with rollback"}
    acceptance: ["Each lane has an explicit capability manifest", "Unowned DB/secret/mount/provider access is denied", "NotebookLM profiles remain per-user and only where required"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["SR-1", "SR-4", "compromised-worker-story"]}]
    depends_on: []

  - id: "RT-S1-024"
    title: "Add server-side session revocation and security-event invalidation"
    priority: "P1"
    hypothesis: >-
      A session version or revocation record checked on authenticated requests makes logout/password reset/account security events invalidate copied JWTs before their 24-hour expiry.
    tests_first: ["RED copied token remains valid after logout and password change", "RED concurrent sessions exercise selective/global revocation", "Regression: inactive accounts remain rejected"]
    in_scope: ["session identifier/version", "logout/password-reset invalidation", "bounded lookup/cache", "audit"]
    out_of_scope: ["changing canonical tenant authorization", "browser redesign"]
    file_fence: {allow: ["backend/app/auth.py", "backend/app/auth_cookies.py", "backend/app/routers/auth.py", "backend/app/models.py", "new migration", "auth tests"], deny: ["backend/app/access.py", "Alembic 146"]}
    risk: {severity: "high", failure: "Stolen tokens remain usable; an unsafe cache can extend or over-revoke sessions", rollout: "dual-accept legacy tokens for a bounded window or force explicit global logout"}
    acceptance: ["Revoked token fails on the next authenticated request within the declared bound", "Password/security events invalidate intended sessions", "No tenant existence information leaks"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["AT-1", "stolen-session-story"]}]
    depends_on: []

  - id: "RT-S1-025"
    title: "Continuously attest effective runtime and release conformance"
    priority: "P1"
    hypothesis: >-
      Machine-readable comparison of source expectations with effective edge, Compose, DB head, exact SHA, storage, lane, and release-marker state closes the gap between repository controls and live truth.
    tests_first: ["RED fixture drifts cookie/proxy/storage/worker/release state from expected", "RED PR-green but non-main/non-UAT SHA", "Regression: exact approved SHA and effective config produce a signed/redacted report"]
    in_scope: ["read-only conformance report", "edge cookie/proxy checks", "effective Compose/lane state", "main/UAT/prod SHA and DB head"]
    out_of_scope: ["automatic promotion", "secret values", "mutating live records"]
    file_fence: {allow: ["read-only health/audit scripts", "deployment contract tests", "docs/operations/**"], deny: ["promotion invocation", "live data mutation"]}
    risk: {severity: "high", failure: "Source or green PR evidence can be mistaken for deployed state", rollout: "read-only and redacted; separate UAT and production attestations"}
    acceptance: ["Report names exact source/deployed/approved SHA and DB head", "Effective cookie/proxy/storage/lane drift fails the attestation", "No deployment occurs as part of the check"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["AT-2", "DR-7", "SR-5", "open-deployment-facts"]}]
    depends_on: []

  - id: "RT-S1-026"
    title: "Turn backup retention, RPO, and RTO into measured policy"
    priority: "P1"
    hypothesis: >-
      Scheduled off-host restore evidence and effective retention inventory make recoverability and deletion persistence measurable instead of inferred from a green backup job.
    tests_first: ["RED stale/missing off-host copy", "RED retention floor or forgotten Restic snapshot violates policy", "RED restore report exceeds RPO/RTO or lacks non-empty artifact evidence"]
    in_scope: ["off-host freshness", "retention inventory", "measured RPO/RTO", "alert and drill evidence"]
    out_of_scope: ["deleting production backups in tests", "claiming provider/external-copy deletion"]
    file_fence: {allow: ["scripts/backup*", "scripts/restic*", "restore workflows/tests", "docs/operations/BACKUP_RESTORE.md"], deny: ["production deletion"]}
    risk: {severity: "high", failure: "Primary loss can be unrecoverable or deleted data can remain longer than represented", rollout: "read-only inventory and isolated restores before retention enforcement"}
    acceptance: ["Latest off-host restore has exact timestamp, RPO, RTO, and outcome", "Effective directory/Restic retention matches declared policy", "Failures alert without pruning data"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["DR-7", "DR-9"]}, {source: "PS-0-17/#2058", finding_sha: "007e34d1eda9ed768e084eed23e5378e84157ea2", findings: ["synthetic-restore-not-live-RPO-RTO-proof"]}]
    depends_on: ["RT-S1-015", "RT-S1-017", "RT-S1-018"]

  - id: "RT-S1-027"
    title: "Implement an explicit legal-hold and protected-deletion resolver"
    priority: "P1"
    hypothesis: >-
      A matter-wide hold decision evaluated before archive, permanent deletion, object cleanup, and retention changes prevents database constraints being misrepresented as a complete legal-hold control.
    tests_first: ["RED held matter reaches current archive/permanent-delete paths", "RED worker/object/retention cleanup under hold", "Regression: non-held deletion still respects existing confirmation and RESTRICT constraints"]
    in_scope: ["hold state and authority", "pre-delete resolver", "all identified deletion and retention paths including counsel cleanup", "historical custody and shared storage references", "audit and release policy"]
    out_of_scope: ["legal advice", "bypassing Evidence Ledger constraints", "retroactive provider deletion promise"]
    file_fence: {allow: ["legal-hold model/service", "identified backend destructive callers including counsel and generation", "shared object and legacy storage cleanup", "backup retention and build-worker guards", "new migration", "preservation tests and operating instructions"], deny: ["Alembic 146", "protected live records", "unrelated product changes"]}
    risk: {severity: "critical", failure: "Missing gate can delete protected material; over-broad hold can make legitimate deletion impossible", rollout: "default deny for ambiguous held scope and require audited authority"}
    acceptance: ["All primary deletion/cleanup paths consult one resolver", "Held content is not removed or pruned", "Override requires named authority, reason, and immutable audit"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["DR-3", "DR-4", "DR-6"]}]
    depends_on: ["RT-S1-019"]

  - id: "RT-S1-028"
    title: "Separate byte-integrity facts from legal or evidentiary meaning"
    priority: "P1"
    hypothesis: >-
      Backend-specific digest semantics and explicit proposed/verified/rejected states prevent S3 ETags, AI confidence, or generic integrity checks being represented as original-byte or legal verification.
    tests_first: ["RED local SHA-256 and S3 ETag are consumed as one generic integrity claim", "RED proposal/verification wording through reader/export/handoff fixtures", "Regression: Evidence Ledger content hashes and status remain distinct"]
    in_scope: ["typed digest metadata", "API semantics", "artifact contract tests", "cross-lane wording acceptance fixtures"]
    out_of_scope: ["legal conclusions", "editing counsel/generation/frontend API paths in this package"]
    file_fence: {allow: ["backend/app/object_storage.py", "artifact schemas/tests", "security contract fixtures", "documentation"]}
    risk: {severity: "high", failure: "Correct bytes can still be described as legally verified, misleading filing decisions", rollout: "add explicit fields before deprecating ambiguous storage_etag uses"}
    acceptance: ["Every digest field names algorithm/source/meaning", "No ETag or AI score is labelled legal verification", "Reader/export/handoff tests preserve proposal status"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["EX-3", "EX-5", "EX-6"]}]
    depends_on: []

  - id: "RT-S1-029"
    title: "Issue a resource-by-resource deletion and retention receipt"
    priority: "P1"
    hypothesis: >-
      An explicit receipt distinguishing archive, pseudonymization, primary deletion, shared retention, backup expiry, and external-provider state prevents users and operators treating Delete as immediate erasure.
    tests_first: ["RED archive and account-close fixtures enumerate what remains", "RED cleanup/backup/provider unknown state cannot be reported deleted", "Regression: shared evidence and billing retention remain accurately stated"]
    in_scope: ["machine-readable receipt", "primary/object cleanup status", "backup retention state", "external-copy unknown/not-applicable state"]
    out_of_scope: ["promising provider deletion without evidence", "legal advice", "frontend redesign"]
    file_fence: {allow: ["backend/app/routers/auth.py", "backend/app/routers/projects.py", "backend/app/user_lifecycle.py", "deletion receipt service/tests", "retention docs"], deny: ["live records"]}
    risk: {severity: "high", failure: "Users can receive a false erasure impression while bytes or shared records remain", rollout: "add receipt without weakening existing retention; expose unknowns explicitly"}
    acceptance: ["Receipt names every resource class and current state", "Pending cleanup/backup expiry is not called deleted", "External-provider and legal-retention uncertainty remains explicit"]
    evidence: [{source: "PS-0-12/#2049", finding_sha: "1edf9b979dbe8e22f09a916c5b8e3f29f1974f41", findings: ["DR-1", "DR-2", "DR-7", "deletion-retention-attacker-story"]}]
    depends_on: ["RT-S1-019", "RT-S1-026", "RT-S1-027"]

  - id: "RT-S1-030"
    title: "Run a guarded forward migration after a compatible restore"
    priority: "P0"
    hypothesis: >-
      Classifying an older restored revision as forward-compatible, then running the exact application's Alembic upgrade through the same serialized migration owner as fleet startup, prevents both unsafe app boot and an implicit container-start migration from being mistaken for recovery proof.
    tests_first: ["RED older ancestor restore reaches application boot without an owned upgrade", "RED concurrent API/worker startup races the restore upgrade", "RED newer, divergent, multi-head, missing, malformed, or unknown revision is migrated or booted", "RED migration failure still marks the restore ready", "Regression: guarded ancestor upgrade reaches head once and a minimal application schema smoke passes"]
    in_scope: ["ancestor/compatibility decision from restore reports", "exact application-SHA Alembic invocation", "RT-S1-014 migration owner and lock reuse", "post-upgrade head verification", "minimal application schema smoke", "machine-readable restore evidence"]
    out_of_scope: ["down migration", "guessing compatibility", "editing historical migrations", "production restore in the implementation PR", "deep artifact/evidence smoke owned by RT-S1-017"]
    file_fence: {allow: ["scripts/restore_verify.sh", "scripts/restic_restore.sh", "RT-S1-014 migration-lock helper", "restore/migration integration tests", "recovery docs"], deny: ["backend/alembic/versions/**", "#2058 files"]}
    risk: {severity: "critical", failure: "A false compatibility decision or unowned upgrade can corrupt the restore or let incompatible code read it", rollout: "isolated disposable restore only; require exact SHA, bounded migration ownership, retained pre-upgrade snapshot, and fail-closed report before any application process starts"}
    acceptance: ["Restore compatibility is classified before mutation and only a recorded single-head ancestor revision may enter the forward-migration path", "The exact application SHA executes alembic upgrade head exactly once through RT-S1-014 ownership before API or workers start", "The restored database reports the exact expected head and a minimal application schema smoke passes", "Newer, divergent, multi-head, missing, malformed, and unknown revisions fail closed without migration or application boot", "Migration or smoke failure leaves the restore not ready and is retained in the report"]
    evidence: [{source: "PS-0-13/#2051", finding_sha: "d0204fb0d48add3de84373a65a6228ff7cf124a6", findings: ["Container start", "Directory restore", "Restic restore"]}, {source: "PS-0-17/#2058", finding_sha: "007e34d1eda9ed768e084eed23e5378e84157ea2", pr_head_sha: "3a5f6b16190b77dd34d99ce96a648461728a26b3", findings: ["revisionless-full-restore-passed", "single-head-match-does-not-prove-concurrent-start"]}]
    depends_on: ["RT-S1-014", "RT-S1-015", "RT-S1-016"]

coverage:
  ps_0_10: {"queue-success-and-silent-fallback": ["RT-S1-001"]}
  ps_0_11: {"distributed-mode-representation": ["RT-S1-012"], "ten-entry-history-cap": ["RT-S1-013"]}
  ps_0_12:
    AT-1: ["RT-S1-024"]
    AT-2: ["RT-S1-025"]
    AT-3: ["RT-S1-009"]
    AT-4: ["RT-S1-009"]
    AT-5: ["RT-S1-009"]
    JQ-1: ["RT-S1-001"]
    JQ-2: ["RT-S1-002", "RT-S1-003", "RT-S1-004"]
    JQ-3: ["RT-S1-005"]
    JQ-4: ["RT-S1-006"]
    JQ-5: ["RT-S1-008"]
    JQ-6: ["RT-S1-021"]
    JQ-7: ["RT-S1-005", "RT-S1-010"]
    JQ-8: ["RT-S1-007"]
    EX-1: ["RT-S1-022", "RT-S1-024"]
    EX-1a: ["RT-S1-022"]
    EX-2: ["RT-S1-022"]
    EX-3: ["RT-S1-028"]
    EX-4: ["RT-S1-020"]
    EX-5: ["RT-S1-017", "RT-S1-028"]
    EX-6: ["RT-S1-028"]
    DR-1: ["RT-S1-029"]
    DR-2: ["RT-S1-029"]
    DR-3: ["RT-S1-027"]
    DR-4: ["RT-S1-019", "RT-S1-027"]
    DR-5: ["RT-S1-019", "RT-S1-020"]
    DR-6: ["RT-S1-027"]
    DR-7: ["RT-S1-025", "RT-S1-026", "RT-S1-029"]
    DR-8: ["RT-S1-018"]
    DR-9: ["RT-S1-017", "RT-S1-026", "RT-S1-030"]
    SR-1: ["RT-S1-018", "RT-S1-023"]
    SR-2: ["RT-S1-010"]
    SR-2a: ["RT-S1-011"]
    SR-3: ["RT-S1-022"]
    SR-4: ["RT-S1-023"]
    SR-5: ["RT-S1-025"]
  ps_0_13:
    "Celery submit": ["RT-S1-001"]
    "Celery delivery": ["RT-S1-002", "RT-S1-003", "RT-S1-004"]
    "Worker timeout": ["RT-S1-003", "RT-S1-005"]
    "Worker restart": ["RT-S1-006"]
    "Scheduler": ["RT-S1-007"]
    "Container start": ["RT-S1-014", "RT-S1-030"]
    "Directory restore": ["RT-S1-015", "RT-S1-030", "RT-S1-017"]
    "Restic restore": ["RT-S1-016", "RT-S1-030", "RT-S1-017"]
    "Secret recovery": ["RT-S1-018"]
  ps_0_17:
    "queue outage": ["RT-S1-001"]
    "worker loss and ownership": ["RT-S1-002", "RT-S1-003", "RT-S1-004"]
    "revisionless directory restore": ["RT-S1-015", "RT-S1-030", "RT-S1-017"]
    "migration facts not concurrent-start proof": ["RT-S1-014", "RT-S1-030"]
```

## RT-S1-016 Restic recovery evidence task and test plan

[#3009](https://github.com/jxwalker/patent-studio/pull/3009) follows the merged
Restic parity implementation [#2428](https://github.com/jxwalker/patent-studio/pull/2428),
which superseded #2185. Revision classification and scratch forward migration
existed, but the Restic driver lacked a durable machine-readable outcome and
deferred production ancestor migration to a later backend start. Deployed startup
verifies the head with `MIGRATE_ON_BOOT=0`, rather than owning that upgrade.
The follow-up adds atomic outcome evidence and rejects that unsupported live
path before database mutation. Source-string tests and directory-restore
evidence alone do not establish the Restic contract.

Requirements: report the manifest, restored and application-compatible revisions,
the actual outcome/stage, forward-migration decision and attributable application
version. Both success and failure must replace prior evidence atomically, with
unknown measurements labelled unknown. Reject incompatible/malformed revisions
and unsupported production ancestor recovery before database mutation. Retain
the existing explicit scratch-forward migration, authorization boundary, session
exclusions and secret-free evidence. Do not add a live recovery orchestrator or
claim a restart will migrate a deployed backend.

Implementation plan: reproduce the real CLI's outcomes with isolated rejecting
transport doubles; reuse the existing atomic report publisher without altering
directory restore; add fail-closed preflight and truthful outcome wiring to the
Restic driver; align its operator instructions and relevant tests in the same PR.
Source changes stay within this package's Restic/test/recovery-doc fence.
The backup writer also reads the single recorded database revision directly,
without truncating display output or hiding a failed query. Backup and restore
count queries retain their exit status rather than accepting partial output
after failure.

### Test Plan

- Whole-driver RED for a successful scratch run with no report, a failed run
  retaining an earlier success, and production ancestor acceptance before its
  missing forward-migration stage. Preserve failing-before evidence.
- Success, failure and early-exit reports; all three schema revisions; exact
  application attribution; unwritable report destination and stale-report safety.
- Missing, malformed, unknown, divergent and multiple revisions; restored DB
  mismatch; authorized scratch ancestor success and failed forward migration.
- Unsupported production ancestry rejects before Docker/database mutation;
  equal-head behavior stays explicit about incomplete application/file recovery.
- Session-table exclusions remain enforced; no real repository, network,
  Docker daemon, provider or production data is used by simulated CLI tests.
- Whole-backup CLI controls reject multiple revisions and a failed revision
  command before publication; both restore paths reject failed count queries
  even when their partial output happens to match the manifest.
- Existing restore regression checks, shell/type/lint checks and independent
  exact-head CI/review remain separate. Real encrypted-backup and application
  recovery acceptance require an isolated actual transport drill; simulations
  do not close offsite deployment, RPO/RTO or public-beta recovery gates.

Verification (17 September 2026): the initial three CLI failures were reproduced
before the first driver change. Expanded controls reproduced ambiguous manifest
acceptance, incorrect migration-state reporting, failed Git status interpreted
as clean, truncated backup revisions, and failed query output treated as success.
All 45 new simulated CLI cases now pass; shell syntax and both test files' Ruff
checks pass. The existing real-database inventory/report check also passed from
a Docker-visible isolated checkout. Exact-head review/CI and real encrypted
transport acceptance remain separate pending evidence on #3009. No offsite
deployment, production recovery or public-beta gate is closed by these results.

Scratch cleanup also proves ownership: a failed container creation never
removes the requested name, and a successful creation is cleaned by the returned
container ID. The whole-driver negative and positive controls cover both paths.
Independent review's default-report argument failure and hidden-untracked-file
findings were reproduced before correction. Default output now resolves even
on argument failures (including a parsed CLI target), help leaves prior evidence
alone, and both provenance checks explicitly include all untracked files.

A later pipeline review concern was not reproduced in the current drivers:
their normalization pipes run outside the container shell, under Bash
`pipefail`. The transport tests now execute the exact container `sh -ec`
argument with a rejecting synthetic `psql`, covering failed revision queries
on both restore paths as well as backup/count queries. Moving the four
normalization pipes inside that shell in a temporary mutation control made
all four corresponding checks fail; restoring the unchanged drivers passed.
No runtime change was needed for this concern. These are shell-contract
controls, not real PostgreSQL or encrypted-transport acceptance.

## RT-S1-012/013 integration task and test plan

The standalone translation and ledger helpers in #2348/#2350 did not add
durable database history or integrate the generation API. Before this
integration, the real API accepted eleven changes but retained only ten.
[#3007](https://github.com/jxwalker/patent-studio/pull/3007) owns the integration;
neither the helper PRs nor the closed issue #2349 establishes package completion.

The implementation must store the canonical mode and ordered version, retain
legacy fields during rollout, and use the validated mode for creation and
resume/gate decisions without changing existing gate subsets or checkpoints.
An append-only history records actor, time, reason, previous/new mode and
version in the same transaction as the effective mode. Existing request
callers remain compatible; an optional expected version rejects stale writers,
while requests without it still serialize on the run lock. Read pagination is
bounded, not history storage. History follows the generation run's existing
retention/deletion lifecycle. Do not fabricate events or timestamps missing
from legacy history, or silently convert malformed legacy policies.

Verification: a real-API eleven-change RED before integration; canonical and
legacy creation/migration fixtures; fresh-session reads and history pagination;
simultaneous and stale-version writers; actor/time/reason and replay agreement;
cross-tenant and terminal-run rejection; fail-closed malformed/mismatched mode
state before worker effects; unchanged review checkpoints and supported gate
subsets; migration upgrade/downgrade/schema guards; surrounding generation and
frontend control regressions. Exact-head review/CI and authenticated UAT remain
separate release gates. No production or paid-provider operation is authorized
by this plan.

Implementation evidence in #3007: migration 184 backfills valid legacy policies
without rewriting configuration or inventing earlier decisions; invalid rows
remain reportable and fail closed. New runs persist a canonical baseline.
The mode API writes its immutable ordered history and compatibility projection
in one transaction, with bounded cursor reads. Individual decision rows cannot
be rewritten or deleted; the parent run's existing deletion policy controls
their retention. Creation, shared start/drawing-rerun/claim producer locks,
Jobs resume, draft recovery, worker stage boundaries, and gate evaluation
validate canonical/legacy agreement. Invalid Jobs resumes return a conflict
before dispatch and preserve the original run, stages and durable job state;
invalid draft recovery is unavailable before model binding. Cancel/delete
remain available through their existing authorization paths.

The regression files are `test_workflow_mode_persistence.py` (real HTTP,
eleven changes, concurrency, rollback, ownership/current target authority,
terminal runs and page bounds), `test_workflow_mode_execution.py` (creation,
gate subsets, fail-closed start/rerun/worker, paused/failed Jobs resume with
valid controls, and both draft-recovery entry points), and `test_workflow_mode_migration.py`
(actual legacy backfill, immutable database rows, parent retention, downgrade
and re-upgrade). Local checks passed against a fresh migrated database;
release completion must still be established by the PR's exact-head review/CI
and authenticated UAT evidence. These checks do not close other Runtime packages.

## Recommended claim order

Several early packages already landed on `main` (see Implementation status
above). Before claiming, re-check GitHub so you do not re-open finished work.

For remaining packages, prefer RT-S1-008, RT-S1-016, and RT-S1-030 where still
open, then deeper recovery proof (RT-S1-017 / RT-S1-026). RT-S1-003
(effect idempotency / staged results) and RT-S1-024 follow-on revocation remain
open via leftover PRs. RT-S1-012 and RT-S1-013 are no longer blocked: the
#1905 freeze is discharged, so a claimant may change `routers/generation.py` and
`generation/**` under ordinary review. Recovery proof should converge through RT-S1-017 and RT-S1-026 rather than
treating a successful script exit as production evidence.

No package in this document is authority to edit its future file fence, mutate
a live record, merge a PR, promote a release, or file with the USPTO.
