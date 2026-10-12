#!/bin/sh
set -eu
python3 -m unittest discover -s scripts -p 'test_activity.py'
ssh -o BatchMode=yes james@100.84.24.38 'test -d ~/workspaces/ariadne && test ! -e ~/workspaces/ariadne/.git && command -v python3 && systemctl --user is-active ariadne-console.service ariadne-refresh.timer ariadne-agent-refresh.timer && test -e /var/lib/systemd/linger/james'
