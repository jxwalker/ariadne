#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/common.sh"
[[ $(id -un) == james ]]
for bin in postgres initdb pg_ctl pg_dump pg_restore pg_isready psql; do test -x "$PG_BIN/$bin"; done
# Existing container is deliberately outside this package's scope.
docker ps --format '{{.Names}}\t{{.Image}}\t{{.Ports}}'
[[ ! -e "$PG_ROOT" ]] || { echo 'Existing native cluster: reconcile before provisioning' >&2; exit 1; }
[[ ! -e "$HOME/.config/systemd/user/ariadne-master-pg.service" ]]
[[ ! -e "$HOME/.config/systemd/user/ariadne-master-pg-backup.service" ]]
[[ ! -e "$HOME/.config/systemd/user/ariadne-master-pg-backup.timer" ]]
if ss -ltnH '( sport = :55432 or sport = :55433 )' | read -r _; then
  echo 'A selected port is already occupied' >&2; exit 1
fi
df -h "$HOME"
test -d "$HOME/ariadne-backups"
for file in "$PKG"/*.sh; do bash -n "$file"; done
printf '%s\n' 'DRY RUN ONLY: new user-owned PG17 cluster, loopback 55432, peer/scram, daily dump+isolated restore; no changes made.'
