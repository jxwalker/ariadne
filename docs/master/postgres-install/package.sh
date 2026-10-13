#!/bin/bash
# Bounded PG17 server install. No default cluster, no system server.
set -euo pipefail
umask 077
E=/home/james/ariadne-run/master-p1/package
case ${1:?dryrun|apply|verify|rollback} in
dryrun)
  sudo -n true
  test ! -x /usr/lib/postgresql/17/bin/postgres
  test ! -e /usr/sbin/policy-rc.d
  test ! -e /etc/postgresql-common/createcluster.conf
  test ! -d /etc/postgresql/17
  test ! -e /etc/systemd/system/postgresql.service
  apt-get -s --no-install-recommends install postgresql-17
  ;;
apply)
  test "${ARIADNE_CONFIRMED_PLAN:-}" = master-p1-package
  mkdir -p "$E"
  ss -ltnH > "$E/listeners.before"
  bash "$0" dryrun
  # Back up only non-secret files being changed; these paths must be absent.
  printf '%s\n' 'createcluster.conf: absent' 'policy-rc.d: absent' 'postgresql.service override: absent' > "$E/config.before"
  # This temporary policy denies *only* PostgreSQL startup during packaging.
  sudo -n install -d /etc/postgresql-common
  printf '%s\n' 'create_main_cluster = false' | sudo -n tee /etc/postgresql-common/createcluster.conf >/dev/null
  printf '%s\n' '#!/bin/sh' 'case "$1" in postgresql*) exit 101;; *) exit 0;; esac' | sudo -n tee /usr/sbin/policy-rc.d >/dev/null
  sudo -n chmod 755 /usr/sbin/policy-rc.d
  cleanup() { sudo -n rm -f /usr/sbin/policy-rc.d; }
  trap cleanup EXIT
  sudo -n env DEBIAN_FRONTEND=noninteractive apt-get -y --no-install-recommends install postgresql-17
  sudo -n systemctl disable --now postgresql.service
  bash "$0" verify
  ;;
verify)
  test -x /usr/lib/postgresql/17/bin/postgres
  test "$(pg_lsclusters -h | wc -l)" = 0
  test "$(systemctl is-enabled postgresql.service 2>/dev/null || true)" = disabled
  test "$(systemctl is-active postgresql.service 2>/dev/null || true)" = inactive
  ss -ltnH > "$E/listeners.after"
  python3 - "$E" <<'PY'
import pathlib,sys
p=pathlib.Path(sys.argv[1])
def addresses(name): return {line.split()[3] for line in (p/name).read_text().splitlines()}
new=addresses('listeners.after')-addresses('listeners.before')
assert all(a.startswith('127.0.0.1:') for a in new), f'Unexpected new listeners: {new}'
print('PASS: no system cluster; PostgreSQL disabled/inactive; no new non-loopback listener')
PY
  ;;
rollback)
  test "${ARIADNE_CONFIRMED_PLAN:-}" = master-p1-package-rollback
  # Conservative rollback retains installed binaries and any later ledger state.
  # Package removal and deletion of database files are outside this rollback.
  sudo -n systemctl disable --now postgresql.service
  test "$(pg_lsclusters -h | wc -l)" = 0
  test ! -e /usr/sbin/policy-rc.d
  printf '%s\n' 'Rollback: system PostgreSQL disabled; packages retained; user ledger untouched.'
  ;;
*) exit 2;;
esac
