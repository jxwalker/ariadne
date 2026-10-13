#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/common.sh"
[[ $(cat "$LIVE/DEPLOYED_COMMIT") == "$HEAD_SHA" ]]
for f in activity_server.py master_dashboard.py operating_dashboard.html activity_decisions.py activity_operating.py operating_dashboard.js activity_sender.py; do cmp "$LIVE/scripts/$f" "$PKG/stage/scripts/$f"; done
for unit in ariadne-activity ariadne-master-pg ariadne-ingest-proxy ariadne-ingest-tunnel; do systemctl --user is-active "$unit"; done
for endpoint in /readyz / /api/operating /api/runs /api/sources /api/controls /roadmaps /work /api/master; do
 status=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:18095$endpoint")
 [[ $status == 200 ]];printf '%s %s\n' "$endpoint" "$status"
done
[[ $(curl -s -o /dev/null -w '%{http_code}' https://codex-dev.tail7b3a3b.ts.net/roadmaps) == 200 ]]
[[ $(psql -XAt -c "SELECT count(*) FROM master.products") == 3 ]]
[[ $(psql -XAt -c "SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL") == 0 ]]
[[ $(psql -XAt -c "SELECT count(*) FROM pg_authid WHERE rolname='ariadne_master' AND NOT rolsuper AND NOT rolcreatedb AND rolpassword IS NULL") == 1 ]]
[[ $(psql -XAt -c "SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname='ariadne_master'") == james ]]
psql -XAt -U ariadne_master -c "SELECT jsonb_array_length(master.snapshot()->'nodes');"
if psql -X -U ariadne_master -c 'CREATE SCHEMA should_not_be_allowed;' >/dev/null 2>&1; then echo 'schema permission boundary failed';exit 1;fi
if psql -X -U ariadne_master -c 'DELETE FROM master.journal;' >/dev/null 2>&1; then echo 'permission boundary failed';exit 1;fi
ss -H -ltn > "$PKG/listeners.after"
python3 - "$PKG" <<'PY'
import pathlib,sys
p=pathlib.Path(sys.argv[1]);before={x.split()[3] for x in (p/'listeners.before').read_text().splitlines()};after={x.split()[3] for x in (p/'listeners.after').read_text().splitlines()}
assert not after-before,'unexpected new listener'
PY
printf '%s\n' 'PASS: private views, operator peer map, permissions, draft import, operations and unchanged listeners.'
