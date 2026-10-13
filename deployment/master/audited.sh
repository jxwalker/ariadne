#!/bin/bash
# Transcript the recorded authorization; never claim a newly obtained James decision.
set -euo pipefail
source "$(dirname "$0")/common.sh"
VAULT="$EVIDENCE/vault"
NOTES='James 2026-10-13 16:29 BST "PostgreSQL is the recommended ledger; use the existing VM unless evidence requires another arrangement. Prepare and execute necessary changes through the existing bounded, authorized deployment path."'
cd "$REPO"
run() { npm run -s ariadne -- "$@" --vault "$VAULT" --project ariadne; }
# Preparation is read-only to live systems. Bind the manifest digest into the immutable plan text.
DIGEST=$(/usr/bin/sha256sum "$PKG/source-hashes.txt" | cut -d ' ' -f1)
[[ "$DIGEST" =~ ^[a-f0-9]{64}$ ]]
CHECK_COMMAND="printf '%s\\n' '$DIGEST  $PKG/source-hashes.txt' | /usr/bin/sha256sum --check --status && /usr/bin/sha256sum --check --status '$PKG/source-hashes.txt'"
case ${1:?plan|audit|dry-run|execute} in
plan)
 run approval-request --by 'Ariadne Bot (authorization transcription)' --target deployment --action 'Master phase 1 exact-head reversible ledger/dashboard deployment' --risk high --reason "$NOTES; scoped peer auth and live-script permission reaffirmed in James 17:28 BST assignment update" --rollback "Separately audited: env ARIADNE_MASTER_ROLLBACK=confirmed bash $PKG/rollback.sh" --evidence "$EVIDENCE/AUTHORIZATION2.md"
 APPROVAL=$(python3 - "$VAULT" <<'PY'
import pathlib,sys
p=pathlib.Path(sys.argv[1])/'projects/ariadne/control/approvals'
print(max(p.glob('*.json'),key=lambda x:x.stat().st_mtime))
PY
)
 run approval-decision --approval "$APPROVAL" --status approved --by 'James (recorded assignment approval; transcribed)' --notes "$NOTES"
 run mutation-readiness --target deployment --risk high --scope "ARIADNE-MASTER-PILOT-20261013-P01: exact reviewed head $HEAD_SHA; migrate existing ledger, harden DB ownership, local peer map, sourced draft imports, three activity view files + marker; restart only activity; no new access/listener" --approval "$APPROVAL" --auth-evidence "$EVIDENCE/AUTHORIZATION2.md" --dry-run "$CHECK_COMMAND && bash $PKG/dryrun.sh" --live-command "$CHECK_COMMAND && env ARIADNE_MASTER_DEPLOY=confirmed bash $PKG/apply.sh" --post-verify "$CHECK_COMMAND && bash $PKG/verify.sh" --rollback "Separately audited: env ARIADNE_MASTER_ROLLBACK=confirmed bash $PKG/rollback.sh" --notes "$NOTES; all deployment scope/backup/rollback details in reviewed deployment/master/PLAN.md"
 ;;
audit) run mutation-readiness-audit ;;
dry-run) run mutation-dry-run --plan "${2:?exact plan id}" --timeout-ms 300000 ;;
execute)
 PLAN=${2:?exact plan id};CONFIRM=${3:?exact --confirm-plan value};[[ "$PLAN" == "$CONFIRM" ]]
 run deployment-mutation-execute --plan "$PLAN" --confirm-plan "$CONFIRM" --timeout-ms 300000
 ;;
*) exit 2 ;;
esac
