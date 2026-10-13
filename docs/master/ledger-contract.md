# Phase 1 ledger contract

The canonical runner provides `ariadne ledger-command --project ariadne --file command.json`
and `ariadne ledger-view --project ariadne`. A command includes `commandId`, `op`, `target`,
`expectedRevision`, and `reason`. JSON arrays allow a reviewed import batch; each command
returns its own durable result. Rejected commands are journalled and idempotent too.

`migrations/master/001-ledger.sql` owns the single transition implementation. A transaction
lock serializes graph changes, scope approval and commands; expected revisions reject stale
edits. Successful mutations, immutable command results, audit history and the outbox commit
atomically. Readers do not take the command lock. The outbox is durable; dispatch is future
work, and no remote actions are enabled.

Products, versioned baselines, phases, milestones, work, policies, decisions and external gaps
share globally stable node IDs and typed views. Source aliases have a unique source/alias
mapping. Imported provenance preserves source path/URL, source revision and hash, observation
date and reconciliation reason. Approved baseline scope is immutable. Revisions are new
baselines. Split commands partition original criterion identities exactly, preserve approved
denominators and retain the original item/history. Criterion identities survive split and
baseline revision; acceptance counts criteria rather than tickets. Proposed denominators
are displayed separately and never described as approved commitments.

Commands: `create`, `update`, `dependencies`, `transition`, `scope`, `approve`, `split`,
`evidence`, `accept`, `override`, `resolve`, `renew-waiver`, `import`. Work starts proposed. Ready requires approved
scope and accepted dependencies; unresolved edges remain visible and block readiness.
Active follows ready; verification follows active. Agent completion is an observation,
not acceptance. Acceptance requires candidate-bound, policy-bound, criterion-bound,
non-synthetic passed evidence of every required kind, a content hash, and a non-future
observation within the policy freshness window. Policies and work criteria cannot be edited
through update commands. An explicit James override records reason, risk, waived criteria
and expiry without rewriting evidence. Approval of a product priority does not approve all
its imported backlog scope.

Phase 1 transport is local only. The OS user james maps through Unix peer authentication
to the existing non-superuser `ariadne_master` role. This role has execute permissions on
command/snapshot functions, not direct ledger-table writes. CLI actor identity is derived
from the OS user; roadmap/work views are read-only; authenticated operator responses are audited writes. Existing observation credentials have no
ledger route. No agent login/capability is provisioned. Code tests exercise agent identities
using the isolated cluster owner: agents can update their owned work and advance eligible
lifecycle steps, but cannot accept, override, approve, change scope or evidence. DEC-006
is resolved: Phase 1 is operator-only; agent writes belong to Phase 2. Operator-supplied evidence is an attestation; Phase 1 does not independently
fetch/validate artifact contents or provision an Eval Factory producer credential.

`master_import.py` verifies the Phase 0 snapshot hashes before compiling deterministic
commands. It imports native release gates/backlog rows, OpenScorpion P0–P9 and AVX, Ariadne
milestones and operating queues, and this assignment's separate phase 0/1 milestones.
Source owner unknown remains unassigned; source Done remains unverified. DEC-001/002/003 A
retain James's source `James 2026-10-13 17:04 BST`. Off-site backup remains deferred/open. Agent access is resolved for the pilot:
operator-only writes in Phase 1, with agent writes in Phase 2. No demo fixture is submitted by this importer.

Validation: `python3 -m unittest discover -s scripts -p 'test_master*.py'` uses an isolated
socket-only PostgreSQL cluster. No live ledger or other project checkout is used. CI must
have PostgreSQL server binaries; missing binaries are reported as a skip locally and are
an explicit deployment verification prerequisite.

### Phase 1 same-uid limitation and attribution

Any process running as uid `james` is operator-equivalent, including bots,
adapters and harnesses. Peer authentication is an OS-user boundary; it does not
separate James from agents under that uid. The uid can also use operator database
access. Phase 1 provisions no agent credentials. Phase 2 adds distinct agent
identities and capabilities. `ARIADNE_LEDGER_VIA` records the actual delegation
chain (for example `ariadne-bot/codex`); commands and journal retain actor `james`
and `via`. This is honest attribution, not a security control.

`resolve` is an operator-only command for decision answers and external gap
resolutions, with a required resolution and journalled reason. Inferred imported
dependencies require operator confirmation. Waivers are separately counted from
evidence-backed accepted criteria, and retain reason, risk and expiry. Expired
waivers remain immutable historical records and are explicitly counted as expired;
expiry does not erase history or manufacture evidence.

Rejected command IDs retain their rejection: corrected payloads need new IDs.
Batches run in input order and are not atomic: rejected commands do not undo
successful earlier commands. Evidence hashes, URIs and synthetic flags remain
operator attestations, not independently verified claims. The imported DEC-001/2/3
resolutions preserve source assertions and require operator confirmation.

The paginated `/api/master` defaults to 50 nodes, with `collection`, `id`, `state`,
`offset` and `limit` (maximum 100). Work queues are paginated. The read transport
still assembles a complete local snapshot before filtering; database-side paging
is a future scaling improvement. Master work state does not infer interruption or
harness telemetry: those remain in the Operations views until explicitly linked.

Owner changes advance the work generation and return it to proposed. Evidence is bound to the generation at recording; a supplied stale generation is rejected, and earlier-generation proof cannot advance acceptance. Reference arrays must contain objects.

Expired or invalid waivers retain immutable acceptance history, but do not satisfy dependencies. Readiness, activation, verification and acceptance recheck this dynamically. Waiver expiry must be finite. Phase 1 has no automatic renewal. James may issue an explicit `renew-waiver` command for an expired waiver, with its expected revision, reason, risk and finite future expiry. It changes only current waiver terms and records before/after journal evidence; accepted criteria, candidate and selected evidence remain immutable, and verified progress is not increased. Replacement work/scope remains available when real re-verification is required.

Resolved decision IDs are immutable in the canonical command API. Exact command retries stay idempotent; an amended question or decision must use a new ID and retain its earlier history.

Hierarchy rollups separate current waivers from inactive (expired/invalid) waivers. Governed dry-run evidence is bound to the full readiness plan bytes; editing any field requires fresh reviewed dry-run evidence, and legacy unbound evidence cannot execute.
