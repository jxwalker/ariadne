#!/usr/bin/env python3
"""Read-only validation of initial or exact-package partial deployment state."""
import json,pathlib,sys

def validate(package,backup_root,marker,expected,head,namespace,source_sha,digest):
    package=pathlib.Path(package);root=pathlib.Path(backup_root).resolve()
    p=package/'last-backup'
    if namespace==0:
        if marker!=expected:raise ValueError('Unexpected initial deployment marker')
        state='initial'
        if not p.exists() and not p.is_symlink():return state
    else:
        if namespace!=1 or source_sha!=digest:raise ValueError('Unrecognized migration; reconcile separately')
        if marker not in {expected,head}:raise ValueError('Unexpected partial deployment marker')
        state='partial'
    if not p.is_file():raise ValueError('Only the same immutable package may resume its assessed partial apply')
    backup=pathlib.Path(p.read_text().strip()).resolve()
    if not backup.is_relative_to(root) or not backup.name.startswith('master-p1-pre-'):raise ValueError('Invalid backup boundary')
    try:
        if not (backup/'scripts').is_dir() or not (backup/'ledger-before.dump').read_bytes():raise ValueError('Missing pre-apply backup')
        if (backup/'DEPLOYED_COMMIT').read_text().strip()!=expected:raise ValueError('Backup marker does not match baseline')
        if not isinstance(json.loads((backup/'server.json').read_text()),dict):raise ValueError('Invalid rollback configuration')
        # These files existed before this package. The remaining new modules may
        # be absent: rollback deliberately removes them in that case.
        for name in ['activity_server.py','activity_operating.py','activity_sender.py','operating_dashboard.html','operating_dashboard.js']:
            if not (backup/'scripts'/name).read_bytes():raise ValueError('Missing rollback application file')
        for name in ['master_dashboard.py','activity_decisions.py']:
            path=backup/'scripts'/name
            if path.exists():path.read_bytes()
    except (OSError,UnicodeError,json.JSONDecodeError) as exc:
        raise ValueError('Unreadable pre-apply rollback artifacts') from exc
    return state
if __name__=='__main__':
    print(validate(sys.argv[1],sys.argv[2],sys.argv[3],sys.argv[4],sys.argv[5],int(sys.argv[6]),sys.argv[7],sys.argv[8]))
