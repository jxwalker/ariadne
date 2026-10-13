#!/bin/bash
set -euo pipefail
umask 077
PKG=$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
PG_BIN=/usr/lib/postgresql/17/bin
PG_ROOT="$HOME/.local/state/ariadne-master-pg"
PG_DATA="$PG_ROOT/data"
PG_SOCKET="$PG_ROOT/socket"
PG_PORT=55432
PG_DB=ariadne_master
PG_BACKUPS="$HOME/ariadne-backups/master-pg"
export PGHOST="$PG_SOCKET" PGPORT="$PG_PORT" PGUSER=james PGDATABASE="$PG_DB"
export PATH="$PG_BIN:$PATH"
