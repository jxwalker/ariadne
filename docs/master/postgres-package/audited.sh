#!/bin/bash
# PREPARED ONLY. Do not run any stage in Phase 0.
set -euo pipefail
source "$(dirname "$0")/common.sh"
REPO=/home/james/workspaces/ariadne-master
VAULT="$PKG/vault"
STAGE=${1:?plan|dry-run|execute}
cd "$REPO"
[[ $(git branch --show-current) == jxw/master-ledger ]]
case "$STAGE" in
plan)
  # Approval must have been separately recorded by the authenticated operator.
  : "${APPROVAL_ID:?separately approved deployment approval in package-local vault}"
  : "${AUTH_EVIDENCE:?vault-relative non-secret authorization evidence}"
  npm run -s ariadne -- mutation-readiness --vault "$VAULT" --project ariadne \
    --target deployment --risk high --scope 'ARIADNE-MASTER-PILOT-20261013-P01: new isolated native PG17 ledger 127.0.0.1:55432 only; no app cutover or existing container changes' \
    --approval "$APPROVAL_ID" --auth-evidence "$AUTH_EVIDENCE" \
    --dry-run "bash $PKG/dryrun.sh" --live-command "env ARIADNE_CONFIRMED_PLAN=master-pg-provision bash $PKG/apply.sh" \
    --post-verify "bash $PKG/verify.sh" --rollback "Separately audited rollback: env ARIADNE_CONFIRMED_PLAN=master-pg-rollback bash $PKG/rollback.sh" \
    --notes 'Existing showcase postgres:16-alpine is excluded. Package hashes and placement must be approved; no password or network access configured.'
  ;;
dry-run)
  PLAN=${2:?exact generated mutation-readiness plan ID}
  npm run -s ariadne -- mutation-readiness-audit --vault "$VAULT" --project ariadne
  npm run -s ariadne -- mutation-dry-run --vault "$VAULT" --project ariadne --plan "$PLAN"
  ;;
execute)
  PLAN=${2:?exact generated mutation-readiness plan ID}
  CONFIRM=${3:?exact confirmation of generated plan ID}
  [[ "$PLAN" == "$CONFIRM" ]]
  # Runner rechecks audit + approval + passed dry run before invoking live command.
  npm run -s ariadne -- deployment-mutation-execute --vault "$VAULT" --project ariadne --plan "$PLAN" --confirm-plan "$CONFIRM" --timeout-ms 300000
  ;;
*) echo 'Unknown stage' >&2; exit 2 ;;
esac
