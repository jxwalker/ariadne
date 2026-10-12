#!/usr/bin/env python3
"""Online private daily backup. No automatic evidence deletion."""
import argparse,json,pathlib,sqlite3
from datetime import datetime,timezone
from activity_server import Store

def main():
    p=argparse.ArgumentParser();p.add_argument('--config',required=True);a=p.parse_args();c=json.loads(pathlib.Path(a.config).read_text());root=pathlib.Path(c['database']).parent/'backups';root.mkdir(mode=0o700,exist_ok=True)
    target=root/('activity-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'.db');Store(c['database']).backup(str(target))
    db=sqlite3.connect(target)
    try:
        if db.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise RuntimeError('backup integrity check failed')
    finally:db.close()
if __name__=='__main__':main()
