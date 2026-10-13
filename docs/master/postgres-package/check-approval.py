#!/usr/bin/env python3
"""Read-only validation of a separately recorded exact-package operator approval.
Phase 1 uid james remains operator-equivalent; this is not signature authentication.
"""
import json, pathlib, re, sys

def validate(record,head,digest,operation='master'):
    prefixes={'master':'Master phase 1 exact-head deployment','postgres-provision':'Master PostgreSQL provision'}
    if operation not in prefixes:raise ValueError('Unsupported approval operation')
    expected=f'{prefixes[operation]}: {head}; manifest {digest}'
    if (record.get('status')!='approved' or record.get('project')!='ariadne'
        or record.get('target')!='deployment' or record.get('decisionBy') not in {'James','james','jxwalker'}
        or not record.get('decidedAt') or record.get('action')!=expected):
        raise ValueError('Separate operator-approved record for this exact head and manifest required')

def validate_canonical_path(record,file,vault):
    ident=record.get('id','')
    if not isinstance(ident,str) or not re.fullmatch(r'approval-[A-Za-z0-9T:.-]+',ident):raise ValueError('Invalid approval ID')
    canonical=pathlib.Path(vault).resolve()/'projects/ariadne/control/approvals'/(ident+'.json')
    if pathlib.Path(file).resolve()!=canonical:raise ValueError('Approval must reside at its canonical package-vault path')

if __name__=='__main__':
    record=json.loads(pathlib.Path(sys.argv[1]).read_text())
    validate(record,sys.argv[2],sys.argv[3],sys.argv[5] if len(sys.argv)>5 else 'master')
    validate_canonical_path(record,sys.argv[1],sys.argv[4])
