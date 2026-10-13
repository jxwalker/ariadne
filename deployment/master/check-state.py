#!/usr/bin/env python3
"""Read-only validation of initial or exact-package partial deployment state."""
import pathlib,sys

def validate(package,backup_root,marker,expected,head,namespace,source_sha,digest):
    if namespace==0:
        if marker!=expected:raise ValueError('Unexpected initial deployment marker')
        return 'initial'
    if namespace!=1 or source_sha!=digest:raise ValueError('Unrecognized migration; reconcile separately')
    if marker not in {expected,head}:raise ValueError('Unexpected partial deployment marker')
    package=pathlib.Path(package);root=pathlib.Path(backup_root).resolve()
    p=package/'last-backup'
    if not p.is_file():raise ValueError('Only the same immutable package may resume its assessed partial apply')
    backup=pathlib.Path(p.read_text().strip()).resolve()
    if not backup.is_relative_to(root) or not backup.name.startswith('master-p1-pre-'):raise ValueError('Invalid backup boundary')
    if not (backup/'scripts').is_dir() or not (backup/'ledger-before.dump').is_file():raise ValueError('Missing pre-apply backup')
    if (backup/'DEPLOYED_COMMIT').read_text().strip()!=expected:raise ValueError('Backup marker does not match baseline')
    return 'partial'
if __name__=='__main__':
    print(validate(sys.argv[1],sys.argv[2],sys.argv[3],sys.argv[4],sys.argv[5],int(sys.argv[6]),sys.argv[7],sys.argv[8]))
