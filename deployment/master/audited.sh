#!/bin/bash
# Transcript the recorded authorization; never claim a newly obtained James decision.
set -euo pipefail
source "$(dirname "$0")/common.sh"
VAULT="$EVIDENCE/vault"
cd "$REPO"
run() { npm run -s ariadne -- "$@" --vault "$VAULT" --project ariadne; }
# Preparation is read-only to live systems. Bind the manifest digest into the immutable plan text.
DIGEST=$(/usr/bin/sha256sum "$PKG/source-hashes.txt" | cut -d ' ' -f1)
[[ "$DIGEST" =~ ^[a-f0-9]{64}$ ]]
CHECK_COMMAND="printf '%s\\n' '$DIGEST  $PKG/source-hashes.txt' | /usr/bin/sha256sum --check --status && /usr/bin/sha256sum --check --status '$PKG/source-hashes.txt'"
case ${1:?plan|audit|dry-run|execute} in
plan)
 APPROVAL=${2:?Supply a separately recorded operator-approved JSON record for this exact head and manifest}
 python3 "$PKG/check-approval.py" "$APPROVAL" "$HEAD_SHA" "$DIGEST" "$VAULT"
 run mutation-readiness --target deployment --risk high --scope "ARIADNE-MASTER-PILOT-20261013-P01: exact reviewed head $HEAD_SHA; migrate existing ledger, harden DB ownership, local peer map, sourced draft imports, operator responses restricted to James's existing Macs, signed own-source replies, seven reviewed activity files + marker; restart only activity; no new listener or agent ledger credentials" --approval "$APPROVAL" --auth-evidence "$APPROVAL" --dry-run "$CHECK_COMMAND && bash $PKG/dryrun.sh" --live-command "$CHECK_COMMAND && env ARIADNE_MASTER_DEPLOY=confirmed bash $PKG/apply.sh" --post-verify "$CHECK_COMMAND && bash $PKG/verify.sh" --rollback "Separately audited: env ARIADNE_MASTER_ROLLBACK=confirmed bash $PKG/rollback.sh" --notes 'Externally supplied authorization; this wrapper cannot approve a deployment. Reviewed scope and recovery are in deployment/master/PLAN.md.'

 ;;
audit) run mutation-readiness-audit ;;
dry-run) run mutation-dry-run --plan "${2:?exact plan id}" --timeout-ms 300000 ;;
execute)
 PLAN=${2:?exact plan id};CONFIRM=${3:?exact --confirm-plan value};[[ "$PLAN" == "$CONFIRM" ]]
 run deployment-mutation-execute --plan "$PLAN" --confirm-plan "$CONFIRM" --timeout-ms 300000
 ;;
*) exit 2 ;;
esac
