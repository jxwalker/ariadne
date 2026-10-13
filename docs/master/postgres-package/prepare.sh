#!/bin/bash
# Local package artifacts only; no provisioning, service or ledger changes.
set -euo pipefail
source "$(dirname "$0")/common.sh"
REPO=/home/james/workspaces/ariadne-master
HEAD_SHA=${1:?exact reviewed repository head}
[[ "$HEAD_SHA" =~ ^[a-f0-9]{40}$ && $(git -C "$REPO" rev-parse HEAD) == "$HEAD_SHA" ]] || { echo 'Reviewed repository head mismatch' >&2; exit 1; }
[[ ! -e "$PKG/source-hashes.txt" ]]
printf '%s\n' "$HEAD_SHA" > "$PKG/HEAD_SHA"
python3 - "$PKG" <<'PY'
import hashlib,pathlib,sys
root=pathlib.Path(sys.argv[1]).resolve()
files=sorted(p for p in root.iterdir() if p.is_file() and (p.suffix in {'.sh','.py','.service','.timer','.md'} or p.name=='HEAD_SHA'))
assert files and all(not p.is_symlink() for p in files),'package symlinks are not supported'
(root/'source-hashes.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p)+'\n' for p in files))
PY
sha256sum "$PKG/source-hashes.txt"
