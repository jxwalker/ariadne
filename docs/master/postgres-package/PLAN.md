# Prepared native PostgreSQL ledger package

Assignment ARIADNE-MASTER-PILOT-20261013-P01; observed 2026-10-13; NOT EXECUTED.
Source plan: [../postgres-plan.md](../postgres-plan.md). Source runner contract:
`src/mutationExecute.ts` / `src/mutationReadiness.ts` at
`03dd67778ce5ef7b37089b79957b13526d70c829`. Local predecessor helper/package
hashes: [../evidence/local-inputs.json](../evidence/local-inputs.json), commit N/A.

Scope is a new user-owned PostgreSQL 17 cluster, private Unix peer administration,
127.0.0.1:55432 SCRAM application authentication, least-privilege locked role,
daily custom dump and socket-only isolated restore. Existing showcase PG16,
SQLite, deployed scripts/configuration and all application services are excluded.
No migration or app connection is included.

Preconditions: approved server-binary installation (absent on observed host), no
automatically created default cluster, free 55432/55433, adequate disk, fixed
package hashes, operator-owned approved deployment decision and non-secret auth
evidence in the package-local vault. No password is supplied by this package.

Future workflow, only in a newly authorized run:

1. Record James's actual deployment approval in `~/ariadne-run/master-pg/vault`
   through the canonical approval workflow; do not impersonate him. Copy only
   non-secret reviewed authorization evidence into that vault.
2. Supply APPROVAL_ID and AUTH_EVIDENCE, then `bash audited.sh plan`. Review the
   generated readiness scope and exact commands and record its actual plan ID.
3. `bash audited.sh dry-run <generated-plan-id>`; inspect audit and dry-run
   artifacts. Missing native server tools make today's package ineligible.
4. `bash audited.sh execute <generated-plan-id> <same-generated-plan-id>` invokes
   the target-specific mutation executor; it enforces audit, approval, passed dry
   run and exact confirmation. The live-command environment marker only prevents
   accidental direct invocation; it is not the approval mechanism.
5. Post-verification must pass binding/auth checks, role restrictions, package
   unit activity and verified dump/restore evidence. Ariadne health is observed.
6. Credential provisioning and later ledger/app cutover need separate plans.

Rollback itself uses a separately generated/approved exact confirmed readiness
plan whose live command runs `rollback.sh` with its invocation marker. It takes
a fresh backup while the cluster is reachable, stops package-owned units and
retains all data. Partial installation with no unit must be inspected and given
a tailored recovery plan; never delete a directory because apply failed.

Daily restore checks do not prove nonempty master-state recovery until Phase 1
creates that state. Backup files omit globals and credentials; grants/roles must
be reconstructed from reviewed setup. Restore-as-owner is suitable for isolated
verification, not a production grant/owner migration. Retention, failure alerting,
off-host encrypted copy and better-than-daily RPO are cutover prerequisites.
Only static checks were run in Phase 0; do not run this package now.

Historical provisioning package only; the FIX ONLY / FREEZE assignment does not
invoke it. A fresh isolated package needs `prepare.sh <exact-reviewed-head>` to
record every script/helper/unit/plan input and HEAD_SHA. No manifest regeneration
is allowed after an approval or plan exists. Approval action must be exactly
`Master PostgreSQL provision: <head>; manifest <source-manifest-sha256>`, recorded
separately by the operator in the package-local canonical vault. Other deployment
approvals cannot authorize provisioning. Dry-run, live and post-verification plan
commands embed the literal reviewed manifest digest and verify it plus every
package input before any script is invoked. Never run this provisioning flow over
an existing native cluster; its dry-run rejects that state.
