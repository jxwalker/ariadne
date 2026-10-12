#!/bin/sh
set -eu
# Execute only through a confirmed rollback mutation plan.
systemctl --user disable --now ariadne-activity.service ariadne-activity-import.timer ariadne-activity-reconcile.timer
tailscale serve --https=443 off
# Original overlay and console/timers were never replaced. Retain DB and backup.
