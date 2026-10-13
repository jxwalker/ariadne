#!/bin/bash
# The approved plan independently verifies the manifest digest and every artifact before this runs.
set -euo pipefail
source "$(dirname "$0")/common.sh"
[[ $(git -C "$REPO" rev-parse HEAD) == "$HEAD_SHA" ]]
EXPECTED_DEPLOYED_COMMIT=$(sed -n 's/^Expected deployed commit: //p' "$PKG/PLAN.md")
[[ "$EXPECTED_DEPLOYED_COMMIT" =~ ^[a-f0-9]{40}$ ]]
CURRENT_MARKER=$(cat "$LIVE/DEPLOYED_COMMIT")
NAMESPACE=$(psql -XAt -c "SELECT count(*) FROM pg_namespace WHERE nspname='master'")
MIGRATION_SHA=$(sha256sum "$PKG/stage/migrations/master/001-ledger.sql" | cut -d ' ' -f1)
SOURCE_SHA=''
if [[ "$NAMESPACE" != 0 ]]; then
 SOURCE_SHA=$(psql -XAt -c "SELECT CASE WHEN count(*)=1 AND max(version)=1 THEN max(source_sha) ELSE '' END FROM master.migrations")
fi
STATE=$(python3 "$PKG/check-state.py" "$PKG" "$HOME/ariadne-backups" "$CURRENT_MARKER" "$EXPECTED_DEPLOYED_COMMIT" "$HEAD_SHA" "$NAMESPACE" "$SOURCE_SHA" "$MIGRATION_SHA")
python3 -m unittest discover -s "$PKG/stage/scripts" -p 'test_master*.py'
if [[ "$STATE" == initial ]]; then
 for endpoint in / /api/operating /api/runs /api/sources /api/controls; do curl -fsS -o /dev/null "http://127.0.0.1:18095$endpoint"; done
else
 printf '%s\n' 'Exact backed-up partial state: service may be unready; replay this approved package, then verify readiness.'
fi
printf '%s\n' 'PASS: exact plan-bound immutable artifact and isolated ledger contracts; no live mutation.'
