#!/bin/bash
# Application rollback only. Requires its own audited confirmed execution.
set -euo pipefail
source "$(dirname "$0")/common.sh"
[[ ${ARIADNE_MASTER_ROLLBACK:-} == confirmed ]]
B=$(cat "$PKG/last-backup")
[[ "$B" == "$HOME/ariadne-backups/master-p1-pre-"* && -d "$B/scripts" ]]
# Snapshot current durable state; NEVER downgrade, delete or restore ledger data.
pg_dump -Fc --no-owner --no-acl -f "$B/ledger-at-rollback.dump"
for f in activity_server.py master_dashboard.py operating_dashboard.html activity_decisions.py activity_operating.py operating_dashboard.js activity_sender.py; do
 if [[ -f "$B/scripts/$f" ]]; then
  install -m 644 "$B/scripts/$f" "$LIVE/scripts/$f.new";mv "$LIVE/scripts/$f.new" "$LIVE/scripts/$f"
 else rm -f "$LIVE/scripts/$f"; fi
done
python3 - "$B/server.json" "$HOME/.config/ariadne-activity/server.json" <<'PYCONFIG'
import json,pathlib,sys
old=json.loads(pathlib.Path(sys.argv[1]).read_text());path=pathlib.Path(sys.argv[2]);current=json.loads(path.read_text())
if 'operatorActions' in old:current['operatorActions']=old['operatorActions']
else:current.pop('operatorActions',None)
tmp=path.with_suffix('.json.new');tmp.write_text(json.dumps(current,indent=2)+'\n');tmp.chmod(0o600);tmp.replace(path)
PYCONFIG
cp "$B/DEPLOYED_COMMIT" "$LIVE/DEPLOYED_COMMIT"
systemctl --user restart ariadne-activity.service
wait_ready
printf '%s\n' 'Application rolled back; ledger schema, accepted state, peer operator access, backups and daily timer retained.'
