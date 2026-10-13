#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/common.sh"
mkdir -p "$PG_BACKUPS"
# Avoid overlapping timer/operator restore tests on the isolated test port.
exec 9>"$PG_ROOT/backup.lock"
flock -n 9 || { echo "Backup already running" >&2; exit 1; }
B=$(mktemp -d "$PG_BACKUPS/dump-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX")
# Retain partial/failed dumps with no success marker. Never auto-delete a backup.
pg_dump -Fc --no-owner --no-acl -f "$B/ledger.dump"
pg_restore --list "$B/ledger.dump" > "$B/archive-list.txt"
sha256sum "$B/ledger.dump" > "$B/SHA256SUMS"
bash "$PKG/restore-test.sh" "$B/ledger.dump" > "$B/restore-test.log" 2>&1
touch "$B/VERIFIED"
printf '%s\n' "$B" > "$PKG/last-backup.tmp"
mv "$PKG/last-backup.tmp" "$PKG/last-backup"
printf '%s\n' "$B"
