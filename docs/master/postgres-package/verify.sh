#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/common.sh"
systemctl --user is-active ariadne-master-pg.service ariadne-master-pg-backup.timer
[[ $(psql -X -At -c 'SHOW listen_addresses') == 127.0.0.1 ]]
[[ $(psql -X -At -c 'SHOW port') == 55432 ]]
[[ $(psql -X -At -c 'SHOW password_encryption') == scram-sha-256 ]]
psql -X -v ON_ERROR_STOP=1 -c "SELECT type,database,user_name,address,auth_method,error FROM pg_hba_file_rules ORDER BY rule_number"
[[ $(psql -X -At -c "SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL") == 0 ]]
[[ $(psql -X -At -c "SELECT count(*) FROM pg_roles WHERE rolname='ariadne_master' AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication") == 1 ]]
[[ $(psql -X -At -c "SELECT count(*) FROM pg_authid WHERE rolname='ariadne_master' AND rolpassword IS NULL") == 1 ]]
B=$(cat "$PKG/last-backup")
[[ $(realpath "$B") == "$PG_BACKUPS/"* && -f "$B/VERIFIED" ]]
sha256sum --check "$B/SHA256SUMS"
grep -q '^PASS:' "$B/restore-test.log"
ss -ltn '( sport = :55432 )'
# Existing Ariadne health is observed, never restarted by this package.
systemctl --user is-active ariadne-activity.service ariadne-console.service
printf '%s\n' 'PASS: provisioned ledger, least-privilege locked TCP role, verified dump+restore; no application cutover.'
