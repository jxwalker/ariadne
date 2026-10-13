# Master pilot Phase 0 evidence packet

Assignment `ARIADNE-MASTER-PILOT-20261013-P01`; observation date **2026-10-13**; Phase 0 only. Read [baseline](baseline.md), [inventory](inventory.md), [charter](charter.md), [reconciliation](reconciliation.md), [PostgreSQL plan](postgres-plan.md), and [decision packet](decision-packet.md).

Every evidence reference inherits this observation date. Repository observations name their exact source commit, not the later documentation commit. GitHub API responses retain candidate/merge SHAs where supplied; an issue itself has no commit SHA and is anchored to the separately observed repository main. Local configuration, database, service observations, external documentation and handoffs have **commit SHA: N/A (not Git-versioned)**; SHA-256 or raw command evidence identifies them instead. Never substitute the deployment marker for the installed file's source identity.

Raw, bounded evidence precedes conclusions: [import manifest](evidence/imports.json) supplies import ID, immutable URL, source commit, blob SHA, content SHA-256 and snapshot; [Done register](evidence/done-claims.json) classifies every completion assertion in the selected snapshots. [Planning path inventories](evidence/) also list historical sources not substantively imported. This is an inventory of selected governing sources, not an assertion that every archived task or private acceptance packet was reviewed. Imported plans remain sourced drafts; no baseline or acceptance decision is created here.

Only `docs/master/` changes are committed. The reviewed package is also staged at `~/ariadne-run/master-pg/`; the required final summary is at `~/ariadne-run/master-p0/SUMMARY.md`. No live package stage is executed, no services/configuration/deployment is changed, and no PR is opened or merged.

Phase 1: every process running as uid `james` is operator-equivalent, including
Ariadne Bot and coding harnesses. Actor/via attribution does not isolate those
processes. No agent credentials are provisioned; phase 2 adds distinct identities.
