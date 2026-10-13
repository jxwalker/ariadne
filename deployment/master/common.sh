#!/bin/bash
set -euo pipefail
umask 077
PKG=$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
REPO=/home/james/workspaces/ariadne-master
EVIDENCE="$HOME/ariadne-run/master-p1"
LIVE="$HOME/.local/lib/ariadne-activity"
PGROOT="$HOME/.local/state/ariadne-master-pg"
PGBIN=/usr/lib/postgresql/17/bin
export PGHOST="$PGROOT/socket" PGPORT=55432 PGUSER=james PGDATABASE=ariadne_master
export PATH="$PGBIN:$PATH"
HEAD_SHA=$(cat "$PKG/HEAD_SHA")
[[ "$HEAD_SHA" =~ ^[a-f0-9]{40}$ ]]
stage() {
 mkdir -p "$PKG/stage"
 git -C "$REPO" archive "$HEAD_SHA" | tar -x -C "$PKG/stage"
}
# Bounded readiness probe: exhausting retries must return failure.
wait_ready() {
 local attempt
 for attempt in $(seq 1 20); do
  if curl -fsS -o /dev/null http://127.0.0.1:18095/readyz; then return 0; fi
  sleep 1
 done
 return 1
}
