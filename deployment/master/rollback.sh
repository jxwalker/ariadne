#!/bin/bash
# Application rollback only. Requires its own audited confirmed execution.
set -euo pipefail
source "$(dirname "$0")/common.sh"
[[ ${ARIADNE_MASTER_ROLLBACK:-} == confirmed ]]
B=$(cat "$PKG/last-backup")
[[ "$B" == "$HOME/ariadne-backups/master-p1-pre-"* && -d "$B/scripts" ]]
# Snapshot current durable state; NEVER downgrade, delete or restore ledger data.
pg_dump -Fc --no-owner --no-acl -f "$B/ledger-at-rollback.dump"
for f in activity_server.py operating_dashboard.html; do install -m 644 "$B/scripts/$f" "$LIVE/scripts/$f.new";mv "$LIVE/scripts/$f.new" "$LIVE/scripts/$f";done
cp "$B/DEPLOYED_COMMIT" "$LIVE/DEPLOYED_COMMIT"
systemctl --user restart ariadne-activity.service
curl -fsS -o /dev/null http://127.0.0.1:18095/readyz
printf '%s\n' 'Application rolled back; ledger schema, accepted state, peer operator access, backups and daily timer retained.'
