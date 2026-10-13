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
`evidence`, `accept`, `override`, `import`. Work starts proposed. Ready requires approved
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
from the OS user; dashboard views are read-only. Existing observation credentials have no
ledger route. No agent login/capability is provisioned. Code tests exercise agent identities
using the isolated cluster owner: agents can update their owned work and advance eligible
lifecycle steps, but cannot accept, override, approve, change scope or evidence. DEC-006
remains open. Operator-supplied evidence is an attestation; Phase 1 does not independently
fetch/validate artifact contents or provision an Eval Factory producer credential.

`master_import.py` verifies the Phase 0 snapshot hashes before compiling deterministic
commands. It imports native release gates/backlog rows, OpenScorpion P0–P9 and AVX, Ariadne
milestones and operating queues, and this assignment's separate phase 0/1 milestones.
Source owner unknown remains unassigned; source Done remains unverified. DEC-001/002/003 A
retain James's source `James 2026-10-13 17:04 BST`. Off-site backup and agent access remain
open. No demo fixture is submitted by this importer.

Validation: `python3 -m unittest discover -s scripts -p 'test_master*.py'` uses an isolated
socket-only PostgreSQL cluster. No live ledger or other project checkout is used. CI must
have PostgreSQL server binaries; missing binaries are reported as a skip locally and are
an explicit deployment verification prerequisite.
