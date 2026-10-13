# Phase 1 pilot ledger, dashboard and operator responses

James authorized review and conditional merge/deployment of the ledger and dashboard
in this Codex chat on 13 October 2026, and requested an easy way to act on Needs you.
Preparation and execution are separate. A separately recorded approval must bind the
reviewed Git head and immutable package-manifest digest. The wrapper cannot approve
itself; the canonical runner also binds the complete approval record and rejects
changed records. Record the direct human instruction verbatim and identify Codex as
the transcribing adapter. This is existing task authorization, not a new human signature.
Merge is separately gated on the exact current head, actual checks and review findings.

Expected deployed commit: 2039065d8d9a70983d3470db05adc0db94afea6d

Prepare a fresh package from the exact reviewed Git revision. Copy physical installed
dependencies, compile the staged canonical runner, validate internal dependency links,
run isolated PostgreSQL contract tests and read-only service/role/API checks. Bind
all staged bytes, imports, scripts, HEAD_SHA, this plan and protected operator-actions
configuration into the manifest. Never regenerate a manifest for an existing plan.
Independent system sha256sum verifies the literal manifest digest and each input before
any package script in dry-run, live execution and post-verification.

Scope: migrate the existing local PostgreSQL 17 ledger; preserve data; add the bounded
james-to-ariadne_master Unix peer map; retain database ownership with james and grant
only connection and function access to the application role. Import three real sourced
draft pilot roadmaps through the command API, preserving raw snapshots, explicit aliases,
source limitations and zero inferred acceptance. Install seven application files:
activity_server.py, master_dashboard.py, operating_dashboard.html, activity_decisions.py,
activity_operating.py, operating_dashboard.js and activity_sender.py. Set the exact
source deployment marker and restart only ariadne-activity.

The protected operatorActions namespace binds James's existing tailnet login and the
two existing Macs' IPv4/IPv6 addresses. No VM/cloud observation identity gains general
ledger writes. Responses are audited decisions through master.command, with exact
signed question versions, CSRF, origin checks and concurrency protection. A response
updates a known aliased master decision, or creates a new explicit decision. It is
available only to the original signed source/repository/run on its next report. Delivery
is distinct from agent acknowledgement and execution. The suggested text comes from
the existing agent report; no new provider or model call is introduced.

No external action executes through a response button. No new listener, public query
endpoint, agent credential, tailnet/ACL/firewall change, system package installation,
model routing change or repository roadmap overwrite is included. Phase 1 remains
operator-only; general agent writes belong to Phase 2.

Use an isolated evidence folder and vault via ARIADNE_MASTER_EVIDENCE, and a fresh
checkout via ARIADNE_MASTER_REPO. Never overwrite another agent's vault or package.
Back up the existing application scripts, marker, server configuration, peer files and
ledger dump before apply. Run mutation-readiness, audit, dry-run and confirmed execution
through the canonical staged ariadne runner. Exact --confirm-plan matching is required.
ARIADNE_MASTER_DEPLOY is only an accident guard. Transactional migrations and exact
command IDs allow retry of the same immutable package after assessed partial failure;
retain the original pre-apply backup. A different package requires a new approved plan.

Rollback needs a separately audited confirmed plan. Back up the current ledger again,
restore the seven previous files (remove newly introduced ones), deployment marker and
only the prior operatorActions configuration namespace, then restart activity. Preserve
ledger schema/data/journal, database grants/ownership, peer map, PostgreSQL service and
backup timer. Never restore an old dump over production as application rollback. Dumps
using --no-owner --no-acl do not prove access restoration; data recovery must separately
restore and verify those privileges and peer configuration.

Post-verification checks exact bytes/marker, operator configuration, role restrictions,
private roadmap/work/API views, all three sourced draft products, no inferred acceptance,
existing operating/ingestion paths and unchanged listeners. Browser verification checks
actual Mac access, hierarchy and response controls. Draft baselines are reviewable
roadmaps, not adopted scope or accepted delivery. Off-host backup remains a separately
deferred operator decision, not an invented destination in this package.
