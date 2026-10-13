#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/common.sh"
DUMP=${1:?custom-format dump path required}
[[ -f "$DUMP" && ! -L "$DUMP" ]]
[[ $(realpath "$DUMP") == "$PG_BACKUPS/"* ]]
TEST_ROOT=$(mktemp -d "$PG_BACKUPS/restore-XXXXXX")
mkdir "$TEST_ROOT/socket"
cleanup() {
  pg_ctl -D "$TEST_ROOT/data" -m fast -w stop >/dev/null 2>&1 || true
  # Retain isolated restore evidence; manual retention policy is a later decision.
}
trap cleanup EXIT
initdb -D "$TEST_ROOT/data" --username=james --auth-local=peer --auth-host=reject --encoding=UTF8 --locale=C >/dev/null
pg_ctl -D "$TEST_ROOT/data" -l "$TEST_ROOT/server.log" -o "-h '' -k $TEST_ROOT/socket -p 55433" -w start >/dev/null
export PGHOST="$TEST_ROOT/socket" PGPORT=55433
psql -X -v ON_ERROR_STOP=1 -d postgres -c 'CREATE DATABASE ariadne_master TEMPLATE template0' >/dev/null
pg_restore --exit-on-error --no-owner --no-acl -d ariadne_master "$DUMP"
# Compare normalized schema from this exact dump, not a changing live database.
pg_restore --schema-only --no-owner --no-acl -f "$TEST_ROOT/expected.sql" "$DUMP"
pg_dump --schema-only --no-owner --no-acl -f "$TEST_ROOT/actual.sql"
python3 - "$TEST_ROOT" <<'PY'
import pathlib,sys
root=pathlib.Path(sys.argv[1])
def normalized(name):
 return '\n'.join(x for x in (root/name).read_text().splitlines() if x.strip() and not x.startswith(('--','\\restrict','\\unrestrict')))
assert normalized('expected.sql') == normalized('actual.sql'), 'restored schema differs'
PY
psql -X -v ON_ERROR_STOP=1 -At -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2" > "$TEST_ROOT/tables.txt"
printf '%s\n' 'PASS: full dump restored into isolated socket-only cluster; schema matches; no production connection.'
