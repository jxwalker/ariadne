#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/common.sh"
: "${ARIADNE_CONFIRMED_PLAN:?Rollback must itself be approved through an exact confirmed mutation plan}"
# Guard ownership before stopping anything. Preserve the cluster and accepted data.
[[ -f "$HOME/.config/systemd/user/ariadne-master-pg.service" ]]
cmp "$PKG/ariadne-master-pg.service" "$HOME/.config/systemd/user/ariadne-master-pg.service"
if systemctl --user is-active --quiet ariadne-master-pg.service; then
  bash "$PKG/backup.sh"
fi
systemctl --user disable --now ariadne-master-pg-backup.timer
systemctl --user stop ariadne-master-pg-backup.service
systemctl --user disable --now ariadne-master-pg.service
printf '%s\n' 'Stopped package-owned cluster and timer; data, dumps, units and restore evidence retained. No other service changed.'
