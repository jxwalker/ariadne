#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/common.sh"
: "${ARIADNE_CONFIRMED_PLAN:?Use package audited.sh execute after approval, audit and dry run}"
bash "$PKG/dryrun.sh"
mkdir -p "$PG_DATA" "$PG_SOCKET" "$PG_BACKUPS"
chmod 700 "$PG_ROOT" "$PG_DATA" "$PG_SOCKET" "$PG_BACKUPS"
# No password file or environment credential; owner uses Unix peer authentication.
initdb -D "$PG_DATA" --username=james --auth-local=peer --auth-host=scram-sha-256 --encoding=UTF8 --locale=C
cat >> "$PG_DATA/postgresql.conf" <<CONF
listen_addresses = '127.0.0.1'
port = 55432
unix_socket_directories = '$PG_SOCKET'
unix_socket_permissions = 0700
password_encryption = 'scram-sha-256'
logging_collector = off
CONF
cat > "$PG_DATA/pg_hba.conf" <<'HBA'
local all james peer
host ariadne_master ariadne_master 127.0.0.1/32 scram-sha-256
local all all reject
host all all 0.0.0.0/0 reject
host all all ::0/0 reject
HBA
mkdir -p "$HOME/.config/systemd/user"
install -m 600 "$PKG/ariadne-master-pg.service" "$HOME/.config/systemd/user/"
install -m 600 "$PKG/ariadne-master-pg-backup.service" "$HOME/.config/systemd/user/"
install -m 600 "$PKG/ariadne-master-pg-backup.timer" "$HOME/.config/systemd/user/"
systemctl --user daemon-reload
systemctl --user enable --now ariadne-master-pg.service
for attempt in {1..30}; do
  if pg_isready -q -d postgres; then break; fi
  sleep 1
done
pg_isready -q -d postgres
psql -X -v ON_ERROR_STOP=1 -d postgres <<'SQL'
CREATE ROLE ariadne_master LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE DATABASE ariadne_master OWNER ariadne_master;
REVOKE ALL ON DATABASE ariadne_master FROM PUBLIC;
SQL
# LOGIN has no password yet: TCP application access remains fail-closed.
bash "$PKG/backup.sh"
systemctl --user enable --now ariadne-master-pg-backup.timer
printf '%s\n' 'Provisioned only; no activity migration, app connection, or app-role password configured.'
