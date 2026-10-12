#!/bin/sh
set -eu
# Run ONLY through confirmed Ariadne mutation plan. No credentials are packaged.
package=${1:?reviewed package directory required}
release="$HOME/.local/lib/ariadne-activity"
config="$HOME/.config/ariadne-activity"
state="$HOME/.local/state/ariadne-activity"
backup="$HOME/ariadne-backups/activity-$(date -u +%Y%m%dT%H%M%SZ)"
umask 077
mkdir -p "$backup" "$release/scripts" "$config" "$state" "$HOME/.config/systemd/user"
printf '%s\n' "$backup" > "$state/last-install-backup"
# Preserve the complete non-git deployed overlay and existing service configurations.
tar -czf "$backup/deployed-overlay.tgz" -C "$HOME/workspaces" ariadne
tar -czf "$backup/user-units.tgz" -C "$HOME/.config/systemd" user
[ ! -f "$config/server.json" ] || cp -a "$config" "$backup/config"
[ ! -f "$release/scripts/activity_server.py" ] || cp -a "$release" "$backup/release"
cp "$package"/scripts/activity_*.py "$release/scripts/"
cp "$package"/deployment/activity/ariadne-activity* "$HOME/.config/systemd/user/"
[ -f "$config/server.json" ] || cp "$package/deployment/activity/server.example.json" "$config/server.json"
# Credentials and snapshot scopes are generated on host, never printed.
python3 - "$config" <<'PY'
import json,pathlib,secrets,sys
p=pathlib.Path(sys.argv[1]); c=json.loads((p/'server.json').read_text()); sources=json.loads((p/'sources.json').read_text()) if (p/'sources.json').exists() else {}
for f in pathlib.Path(c['snapshotDirectory']).glob('*.json'):
    snap=json.loads(f.read_text()); host=snap['host']; ident=c['snapshotSources'].get(host) or 'snapshot-'+secrets.token_hex(8)
    c['snapshotSources'][host]=ident
    sources.setdefault(ident, {'secret':secrets.token_hex(32),'projects':['scorpion-labs'],'repositories':c['githubRepositories'],'provenance':'read-only local snapshot','correlationHost':host})
sources.setdefault('cloud-controlled-test',{'secret':secrets.token_hex(32),'projects':['ariadne'],'repositories':['jxwalker/ariadne']})
sources.setdefault('grok-hosted-pending',{'secret':secrets.token_hex(32),'projects':['scorpion-labs'],'repositories':c['githubRepositories']})
(p/'sources.json').write_text(json.dumps(sources))
(p/'sources.json').chmod(0o600);(p/'server.json').write_text(json.dumps(c,indent=2));(p/'server.json').chmod(0o600)
PY
systemctl --user daemon-reload
systemctl --user enable --now ariadne-activity.service ariadne-activity-import.timer ariadne-activity-reconcile.timer
# Approved private tailnet HTTPS only. Never Funnel, never public DNS.
sudo -n tailscale serve --bg --https=443 http://127.0.0.1:18095
printf '%s\n' "$backup" > "$state/last-install-backup"
