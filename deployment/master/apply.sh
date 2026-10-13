#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/common.sh"
[[ ${ARIADNE_MASTER_DEPLOY:-} == confirmed ]]
# Dry-run stage is immutable and exact-head checks are repeated before mutation.
[[ $(git -C "$REPO" rev-parse HEAD) == "$HEAD_SHA" ]]
sha256sum -c "$PKG/source-hashes.txt" > "$PKG/hash-verification.log"
python3 - "$PKG/dependency-links.json" <<'PYLINK'
import json,pathlib,sys
for name,target in json.loads(pathlib.Path(sys.argv[1]).read_text()).items():
 p=pathlib.Path(name);assert p.is_symlink() and str(p.readlink())==target,'dependency symlink changed'
PYLINK

if [[ -f "$PKG/last-backup" ]]; then B=$(cat "$PKG/last-backup"); else
B="$HOME/ariadne-backups/master-p1-pre-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$B"
pg_dump -Fc --no-owner --no-acl -f "$B/ledger-before.dump"
cp -a "$LIVE/scripts" "$B/scripts"
cp -a "$LIVE/DEPLOYED_COMMIT" "$B/DEPLOYED_COMMIT"
cp -a "$PGROOT/data/pg_hba.conf" "$PGROOT/data/pg_ident.conf" "$B/"
printf '%s\n' "$B" > "$PKG/last-backup"
fi
if [[ $(psql -XAt -c "SELECT count(*) FROM pg_namespace WHERE nspname='master'") == 0 ]]; then
 psql -X -v ON_ERROR_STOP=1 -f "$PKG/stage/migrations/master/001-ledger.sql"
else
 [[ $(psql -XAt -c "SELECT count(*) FROM master.migrations WHERE version=1") == 1 ]]
fi
psql -X -v ON_ERROR_STOP=1 <<'SQL'
ALTER DATABASE ariadne_master OWNER TO james;
REVOKE ALL ON DATABASE ariadne_master FROM PUBLIC, ariadne_master;
GRANT CONNECT ON DATABASE ariadne_master TO ariadne_master;
REVOKE ALL ON SCHEMA public FROM PUBLIC, ariadne_master;
REVOKE ALL ON SCHEMA master FROM ariadne_master;
GRANT USAGE ON SCHEMA master TO ariadne_master;
GRANT EXECUTE ON FUNCTION master.command(text,jsonb),master.snapshot() TO ariadne_master;
SQL
# Existing role only; peer map is limited to this one OS user and database.
python3 - "$PGROOT/data" <<'PY'
import pathlib,sys
root=pathlib.Path(sys.argv[1]);hba=root/'pg_hba.conf';ident=root/'pg_ident.conf'
mapping='ariadne_master james ariadne_master'
rule='local ariadne_master ariadne_master peer map=ariadne_master'
if mapping not in ident.read_text().splitlines():ident.write_text(ident.read_text()+'\n'+mapping+'\n')
if rule not in hba.read_text().splitlines():hba.write_text(rule+'\n'+hba.read_text())
PY
pg_ctl -D "$PGROOT/data" reload
# Canonical runner delegates to the same SQL command API used in contracts.
cd "$PKG/stage"
env -u NODE_OPTIONS -u NODE_PATH ARIADNE_LEDGER_VIA=ariadne-bot/codex node dist/src/ariadne.js ledger-command --project ariadne --file "$PKG/import-commands.json" > "$PKG/import-results.json"
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

wait_ready
