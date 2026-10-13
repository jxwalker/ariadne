# Bounded phase 1 application deployment

Install a CI-green, reviewed PR head without merging. Stage from exact Git revision;
compile and execute the immutable staged canonical runner, verify hashes, real isolated PostgreSQL tests, least-privilege role and existing operations.
Keep all evidence under ~/ariadne-run/master-p1; use its own vault, never ariadne-dev.

Scope: migrate the existing local PG17 ledger; add the approved james-to-ariadne_master
Unix peer map; transfer database ownership to james and grant only connection/function access; execute only reviewed real draft imports through the canonical runner;
install activity_server.py, master_dashboard.py, operating_dashboard.html into existing
activity service; update its deployment marker and restart only ariadne-activity.
No new listener, tailnet/public/ACL/firewall changes, agent credentials, system package
install, external system writes, repository plan overwrite, or PR merge.

Before execution back up the complete existing scripts, marker, peer configurations and
ledger dump. Apply is invoked only by deployment-mutation-execute with exact --confirm-plan;
ARIADNE_MASTER_DEPLOY is an accident guard, not authorization. Plan, audit, dry-run, confirmed
execute and post-verification use the canonical runner. Approval records quote verbatim:

James 2026-10-13 16:29 BST "PostgreSQL is the recommended ledger; use the existing VM unless evidence requires another arrangement. Prepare and execute necessary changes through the existing bounded, authorized deployment path."

The 17:28 BST assignment update explicitly permits this new audited live-script package
and operator peer auth after CI green and valid review findings addressed. Leave PRs open.

Application rollback requires a new audited confirmed plan. It restores backed-up scripts
and deployment marker, takes another ledger backup and restarts activity. It retains all
ledger state, acceptance history, peer operator access, PostgreSQL service and daily local
dump timer. Never run a data downgrade or restore over production as application rollback.
Partial apply must be assessed from its audit: migration transaction is atomic; imports
are idempotent. The dry-run intentionally requires no master schema for first deployment.
A failed first cutover does not authorize silently rerunning a different deployment plan.

Post-verification: bytes/marker, role restrictions, private views and existing operations,
three sourced draft products, no inferred acceptance, unchanged listening addresses.
Separate final verification records actual service restart persistence, nonempty isolated
backup restore and a signed test-classified ingestion receipt. Browser proof may be reported
blocked if no installed browser has its libraries; do not install host packages for it.
