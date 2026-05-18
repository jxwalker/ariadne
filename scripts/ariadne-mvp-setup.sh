#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="${ARIADNE_PROJECT:-ariadne}"

cd "$ROOT_DIR"

echo "==> Installing Ariadne dependencies"
npm install

echo "==> Installing Playwright Chromium (~100MB, may take several minutes on slower connections)"
npx --yes playwright install chromium

echo "==> Typechecking and testing"
npm run check
npm test

echo "==> Building Ariadne"
npm run build

echo "==> Generating console and guide for project: $PROJECT"
npm run ariadne -- console-html --project "$PROJECT" --refresh-data
npm run ariadne -- guide --project "$PROJECT"

echo
echo "Ariadne MVP setup complete."
echo "Open: $ROOT_DIR/vault/projects/$PROJECT/console/index.html"
echo "Next: npm run ariadne -- guide --project $PROJECT"
