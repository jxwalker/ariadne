#!/bin/bash
set -euo pipefail
PREPARED_PACKAGE=$(cd -- "$(dirname "$0")" && pwd -P)
PREPARED_REPO=${ARIADNE_MASTER_REPO:-/home/james/workspaces/ariadne-master}
PREPARED_HEAD=${1:?Supply the exact reviewed repository head}
[[ "$PREPARED_HEAD" =~ ^[a-f0-9]{40}$ && $(git -C "$PREPARED_REPO" rev-parse HEAD) == "$PREPARED_HEAD" ]] || { echo 'Reviewed repository head mismatch' >&2; exit 1; }
[[ ! -e "$PREPARED_PACKAGE/source-hashes.txt" ]] || { echo 'Use a fresh package; never replace a planned manifest' >&2; exit 1; }
[[ ! -e "$PREPARED_PACKAGE/stage" && ! -L "$PREPARED_PACKAGE/stage" ]] || { echo 'Use a fresh package after any partial preparation' >&2; exit 1; }
printf '%s\n' "$PREPARED_HEAD" > "$PREPARED_PACKAGE/HEAD_SHA"
source "$(dirname "$0")/common.sh"
stage
OPERATOR_CONFIG=${ARIADNE_OPERATOR_CONFIG:?Supply the reviewed operator identity and Mac allowlist file}
python3 - "$OPERATOR_CONFIG" <<'PYOPERATOR'
import ipaddress,json,pathlib,sys
c=json.loads(pathlib.Path(sys.argv[1]).read_text())
assert set(c)=={'enabled','origin','allowedLogins','allowedClientIPs'} and c['enabled'] is True
assert c['origin']=='https://codex-dev.tail7b3a3b.ts.net'
assert isinstance(c['allowedLogins'],list) and len(c['allowedLogins'])==1 and c['allowedLogins'][0]
assert isinstance(c['allowedClientIPs'],list) and c['allowedClientIPs']
assert set(c['allowedClientIPs']) <= {'100.70.60.22','fd7a:115c:a1e0::ed32:3c16','100.74.85.107','fd7a:115c:a1e0::432:556b'}
for address in c['allowedClientIPs']:ipaddress.ip_address(address)
PYOPERATOR
install -m 600 "$OPERATOR_CONFIG" "$PKG/operator-actions.json"
[[ ! -e "$PKG/stage/node_modules" && ! -L "$PKG/stage/node_modules" ]]
cp -a "$REPO/node_modules" "$PKG/stage/node_modules"
"$PKG/stage/node_modules/.bin/tsc" -p "$PKG/stage/tsconfig.json"
# Read-only live checks. No migration, imports, units, credentials or service restart.
EXPECTED_DEPLOYED_COMMIT=$(sed -n 's/^Expected deployed commit: //p' "$PKG/PLAN.md")
[[ "$EXPECTED_DEPLOYED_COMMIT" =~ ^[a-f0-9]{40}$ ]]
[[ $(cat "$LIVE/DEPLOYED_COMMIT") == "$EXPECTED_DEPLOYED_COMMIT" ]]
[[ $(id -un) == james ]]
[[ $(psql -XAt -c "SELECT rolname||':'||rolsuper||':'||rolcreatedb||':'||(rolpassword IS NULL) FROM pg_authid WHERE rolname='ariadne_master'") == 'ariadne_master:false:false:true' ]]
MIGRATION_SHA=$(sha256sum "$PKG/stage/migrations/master/001-ledger.sql" | cut -d ' ' -f1)
if [[ $(psql -XAt -c "SELECT count(*) FROM pg_namespace WHERE nspname='master'") != 0 ]]; then
 [[ $(psql -XAt -c "SELECT count(*) FROM master.migrations WHERE version=1 AND source_sha='$MIGRATION_SHA'") == 1 ]] || { echo 'Unrecognized existing migration; separately reconcile before preparing' >&2; exit 1; }
fi
python3 "$PKG/stage/scripts/master_import.py" --output "$PKG/import-commands.json"
python3 -m py_compile "$PKG/stage/scripts/master_dashboard.py" "$PKG/stage/scripts/activity_server.py"
python3 -m unittest discover -s "$PKG/stage/scripts" -p 'test_master*.py'
for endpoint in / /api/operating /api/runs /api/sources /api/controls; do curl -fsS -o /dev/null "http://127.0.0.1:18095$endpoint"; done
ss -H -ltn > "$PKG/listeners.before"
python3 - "$PKG/stage/node_modules" "$PKG/dependency-links.json" <<'PYLINK'
import json,pathlib,sys
root=pathlib.Path(sys.argv[1]);links={}
for p in root.rglob('*'):
 if p.is_symlink():
  assert p.resolve().is_relative_to(root.resolve()),'external dependency symlink'
  links[str(p)]=str(p.readlink())
pathlib.Path(sys.argv[2]).write_text(json.dumps(links,sort_keys=True))
PYLINK
find "$PKG/stage" -type f -print0 | sort -z | xargs -0 sha256sum > "$PKG/source-hashes.txt"
sha256sum "$PKG"/*.py "$PKG"/*.sh "$PKG/HEAD_SHA" "$PKG/PLAN.md" "$PKG/import-commands.json" "$PKG/dependency-links.json" "$PKG/operator-actions.json" >> "$PKG/source-hashes.txt"

sha256sum "$PKG/source-hashes.txt"
printf '%s\n' 'PASS: bounded stage, roles, isolated contracts and existing operations; no live mutation.'
