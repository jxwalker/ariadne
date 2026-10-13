#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/common.sh"
[[ ${ARIADNE_MASTER_DEPLOY:-} == confirmed ]]
# Dry-run stage is immutable and exact-head checks are repeated before mutation.
[[ $(git -C "$REPO" rev-parse HEAD) == "$HEAD_SHA" ]]
sha256sum -c "$PKG/source-hashes.txt"
[[ $(psql -XAt -c "SELECT count(*) FROM pg_namespace WHERE nspname='master'") == 0 ]]
B="$HOME/ariadne-backups/master-p1-pre-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$B"
pg_dump -Fc --no-owner --no-acl -f "$B/ledger-before.dump"
cp -a "$LIVE/scripts" "$B/scripts"
cp -a "$LIVE/DEPLOYED_COMMIT" "$B/DEPLOYED_COMMIT"
cp -a "$PGROOT/data/pg_hba.conf" "$PGROOT/data/pg_ident.conf" "$B/"
printf '%s\n' "$B" > "$PKG/last-backup"
psql -X -v ON_ERROR_STOP=1 -f "$PKG/stage/migrations/master/001-ledger.sql"
psql -X -v ON_ERROR_STOP=1 <<'SQL'
REVOKE ALL ON SCHEMA master FROM ariadne_master;
GRANT USAGE ON SCHEMA master TO ariadne_master;
GRANT EXECUTE ON FUNCTION master.command(text,jsonb),master.snapshot() TO ariadne_master;
SQL
# Existing role only; peer map is limited to this one OS user and database.
python3 - "$PGROOT/data" <<'PY'
import pathlib,sys
root=pathlib.Path(sys.argv[1]);hba=root/'pg_hba.conf';ident=root/'pg_ident.conf'
ident.write_text(ident.read_text()+'\nariadne_master james ariadne_master\n')
hba.write_text('local ariadne_master ariadne_master peer map=ariadne_master\n'+hba.read_text())
PY
pg_ctl -D "$PGROOT/data" reload
# Canonical runner delegates to the same SQL command API used in contracts.
cd "$REPO"
npm run -s ariadne -- ledger-command --project ariadne --file "$PKG/import-commands.json" > "$PKG/import-results.json"
python3 - "$PKG/import-results.json" <<'PY'
import json,pathlib,sys
# npm -s emits only the runner JSON.
r=json.loads(pathlib.Path(sys.argv[1]).read_text());assert all(x['ok'] for x in r)
print('PASS: imported',len(r),'commands; all sourced drafts')
PY
for f in activity_server.py master_dashboard.py operating_dashboard.html; do
 install -m 644 "$PKG/stage/scripts/$f" "$LIVE/scripts/$f.new"
 mv "$LIVE/scripts/$f.new" "$LIVE/scripts/$f"
done
printf '%s\n' "$HEAD_SHA" > "$LIVE/DEPLOYED_COMMIT.new"
mv "$LIVE/DEPLOYED_COMMIT.new" "$LIVE/DEPLOYED_COMMIT"
systemctl --user restart ariadne-activity.service

for attempt in $(seq 1 20); do curl -fsS -o /dev/null http://127.0.0.1:18095/readyz && break; sleep 1; done
