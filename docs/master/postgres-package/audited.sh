#!/bin/bash
# PREPARED ONLY. Do not run any stage in Phase 0.
set -euo pipefail
source "$(dirname "$0")/common.sh"
REPO=/home/james/workspaces/ariadne-master
VAULT="$PKG/vault"
STAGE=${1:?prepare|plan|dry-run|execute}
cd "$REPO"
[[ $(git branch --show-current) == jxw/master-ledger ]]
case "$STAGE" in
prepare)
  [[ ! -e "$PKG/source-hashes.txt" ]] || { echo 'Use a fresh reviewed package; never replace a planned manifest' >&2; exit 1; }
  sha256sum "$PKG"/*.sh "$PKG"/*.service "$PKG"/*.timer > "$PKG/source-hashes.txt"
  ;;
plan)
  DIGEST=$(/usr/bin/sha256sum "$PKG/source-hashes.txt" | cut -d ' ' -f1)
  [[ "$DIGEST" =~ ^[a-f0-9]{64}$ ]]
  : "${APPROVAL_ID:?separately approved deployment approval in package-local vault}"
  python3 - "$VAULT" "$APPROVAL_ID" "$DIGEST" <<'PYAPPROVAL'
import json,pathlib,sys
vault=pathlib.Path(sys.argv[1]).resolve();ident=sys.argv[2]
import re
assert re.fullmatch(r'approval-[A-Za-z0-9T:.-]+',ident),'Canonical approval ID required'
p=vault/'projects/ariadne/control/approvals'/(ident+'.json')
assert p.resolve()==p,'Canonical approval path required'
a=json.loads(p.read_text())
assert a.get('id')==ident and a.get('project')=='ariadne' and a.get('target')=='deployment'
assert a.get('status')=='approved' and a.get('decisionBy') in {'James','james','jxwalker'} and a.get('decidedAt')
assert a.get('action')=='Master PostgreSQL provisioning; manifest '+sys.argv[3],'Exact PostgreSQL package approval required'
PYAPPROVAL
  CHECK_COMMAND="printf '%s\\n' '$DIGEST  $PKG/source-hashes.txt' | /usr/bin/sha256sum --check --status && /usr/bin/sha256sum --check --status '$PKG/source-hashes.txt'"
  # Approval must have been separately recorded by the authenticated operator.
  : "${APPROVAL_ID:?separately approved deployment approval in package-local vault}"
  : "${AUTH_EVIDENCE:?vault-relative non-secret authorization evidence}"
  npm run -s ariadne -- mutation-readiness --vault "$VAULT" --project ariadne \
    --target deployment --risk high --scope 'ARIADNE-MASTER-PILOT-20261013-P01: new isolated native PG17 ledger 127.0.0.1:55432 only; no app cutover or existing container changes' \
    --approval "$APPROVAL_ID" --auth-evidence "$AUTH_EVIDENCE" \
    --dry-run "$CHECK_COMMAND && bash $PKG/dryrun.sh" --live-command "$CHECK_COMMAND && env ARIADNE_CONFIRMED_PLAN=master-pg-provision bash $PKG/apply.sh" \
    --post-verify "$CHECK_COMMAND && bash $PKG/verify.sh" --rollback "Separately audited rollback: env ARIADNE_CONFIRMED_PLAN=master-pg-rollback bash $PKG/rollback.sh" \
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
