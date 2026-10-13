#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/common.sh"
stage
[[ ! -e "$PKG/stage/node_modules" && ! -L "$PKG/stage/node_modules" ]]
cp -a "$REPO/node_modules" "$PKG/stage/node_modules"
"$PKG/stage/node_modules/.bin/tsc" -p "$PKG/stage/tsconfig.json"
# Read-only live checks. No migration, imports, units, credentials or service restart.
EXPECTED_DEPLOYED_COMMIT=$(sed -n 's/^Expected deployed commit: //p' "$PKG/PLAN.md")
[[ "$EXPECTED_DEPLOYED_COMMIT" =~ ^[a-f0-9]{40}$ ]]
[[ $(cat "$LIVE/DEPLOYED_COMMIT") == "$EXPECTED_DEPLOYED_COMMIT" ]]
[[ $(id -un) == james ]]
[[ $(psql -XAt -c "SELECT rolname||':'||rolsuper||':'||rolcreatedb||':'||(rolpassword IS NULL) FROM pg_authid WHERE rolname='ariadne_master'") == 'ariadne_master:false:false:true' ]]
[[ $(psql -XAt -c "SELECT count(*) FROM pg_namespace WHERE nspname='master'") == 0 ]]
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
sha256sum "$PKG/check-approval.py" "$PKG"/*.sh "$PKG/HEAD_SHA" "$PKG/PLAN.md" "$PKG/import-commands.json" "$PKG/dependency-links.json" >> "$PKG/source-hashes.txt"
sha256sum "$PKG/source-hashes.txt"
printf '%s\n' 'PASS: bounded stage, roles, isolated contracts and existing operations; no live mutation.'
