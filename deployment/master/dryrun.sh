#!/bin/bash
# The approved plan independently verifies the manifest digest and every artifact before this runs.
set -euo pipefail
source "$(dirname "$0")/common.sh"
[[ $(git -C "$REPO" rev-parse HEAD) == "$HEAD_SHA" ]]
EXPECTED_DEPLOYED_COMMIT=$(sed -n 's/^Expected deployed commit: //p' "$PKG/PLAN.md")
[[ "$EXPECTED_DEPLOYED_COMMIT" =~ ^[a-f0-9]{40}$ ]]
[[ $(cat "$LIVE/DEPLOYED_COMMIT") == "$EXPECTED_DEPLOYED_COMMIT" ]]
[[ $(psql -XAt -c "SELECT count(*) FROM pg_namespace WHERE nspname='master'") == 0 ]]
python3 -m unittest discover -s "$PKG/stage/scripts" -p 'test_master*.py'
for endpoint in / /api/operating /api/runs /api/sources /api/controls; do curl -fsS -o /dev/null "http://127.0.0.1:18095$endpoint"; done
printf '%s\n' 'PASS: exact plan-bound immutable artifact and isolated ledger contracts; no live mutation.'
