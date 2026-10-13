#!/usr/bin/env python3
"""Read-only validation of a separately recorded exact-package operator approval.
Phase 1 uid james remains operator-equivalent; this is not signature authentication.
"""
import json, pathlib, sys

def validate(record,head,digest):
    expected=f'Master phase 1 exact-head deployment: {head}; manifest {digest}'
    if (record.get('status')!='approved' or record.get('project')!='ariadne'
        or record.get('target')!='deployment' or record.get('decisionBy') not in {'James','james','jxwalker'}
        or not record.get('decidedAt') or record.get('action')!=expected):
        raise ValueError('Separate operator-approved record for this exact head and manifest required')

if __name__=='__main__':
    validate(json.loads(pathlib.Path(sys.argv[1]).read_text()),sys.argv[2],sys.argv[3])
