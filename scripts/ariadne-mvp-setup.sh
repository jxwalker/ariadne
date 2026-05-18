#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="${ARIADNE_PROJECT:-ariadne}"

cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Ariadne setup needs Node.js 22 or newer. Install Node, then rerun npm run setup:mvp." >&2
  exit 1
fi

NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
if [[ "$NODE_MAJOR" -lt 22 ]]; then
  echo "Ariadne setup needs Node.js 22 or newer. Current version: $(node --version)." >&2
  exit 1
fi

echo "==> Installing Ariadne dependencies"
npm install

echo "==> Installing Playwright Chromium (~100MB, may take several minutes on slower connections)"
npx --yes playwright install chromium

echo "==> Typechecking and testing"
npm run check
npm test

echo "==> Building Ariadne"
npm run build

echo "==> Refreshing MVP control plane for project: $PROJECT"
npm run ariadne -- roadmap-control-refresh --project "$PROJECT"

echo "==> Verifying and screenshotting the Ariadne console"
npm run ariadne -- console-visual-checks --project "$PROJECT"
npm run ariadne -- console-browser-checks --project "$PROJECT"

echo "==> Printing next operator handoff"
npm run ariadne -- operator-next --project "$PROJECT"

echo
echo "Ariadne MVP setup complete."
echo "Open: $ROOT_DIR/vault/projects/$PROJECT/console/index.html"
echo "Open command: open \"$ROOT_DIR/vault/projects/$PROJECT/console/index.html\""
echo "Next: npm run ariadne -- operator-next --project $PROJECT"
echo "Docs: $ROOT_DIR/docs/user-guide.md"
