#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$ROOT_DIR"
if [[ ! -x "$ROOT_DIR/scripts/ariadne-mvp-setup.sh" ]]; then
  echo "Error: scripts/ariadne-mvp-setup.sh is missing or not executable." >&2
  exit 1
fi

exec "$ROOT_DIR/scripts/ariadne-mvp-setup.sh"
