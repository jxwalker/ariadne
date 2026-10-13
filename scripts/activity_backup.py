#!/usr/bin/env python3
"""Private online backup, isolated restore verification and explicit retention."""
import argparse
import hashlib
import json
import os
import pathlib
import sqlite3
import subprocess
import tempfile
import time
from datetime import datetime,timezone

TABLES=('events','runs','webhooks')

def readonly(path):
    return sqlite3.connect(pathlib.Path(path).resolve().as_uri()+'?mode=ro',uri=True)

def counts(path):
    with readonly(path) as db:
        if db.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise RuntimeError('backup integrity check failed')
        return {t:db.execute(f'SELECT count(*) FROM {t}').fetchone()[0] for t in TABLES}

def crypt(source,target,key,decrypt=False):
    key=pathlib.Path(key)
    if key.is_symlink() or key.stat().st_mode & 0o777 != 0o600:raise ValueError('encryption key must be mode 600')
    if not key.read_bytes().strip():raise ValueError('empty encryption key')
    subprocess.run(['openssl','enc','-aes-256-cbc','-pbkdf2','-salt']+(['-d'] if decrypt else [])+['-pass','file:'+str(key),'-in',str(source),'-out',str(target)],check=True,capture_output=True)
    target.chmod(0o600)

def checksum(path):
    with path.open('rb') as file:return hashlib.file_digest(file,'sha256').hexdigest()

def backup_files(root):
    return sorted([p for p in root.glob('activity-*') if p.is_file() and not p.is_symlink() and (p.name.endswith('.db') or p.name.endswith('.db.enc'))],reverse=True)

def backup(config):
    root=pathlib.Path(config['database']).parent/'backups';root.mkdir(mode=0o700,exist_ok=True)
    settings=config.get('backup',{});key=settings.get('encryptionKeyFile')
    target=root/('activity-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')+'.db'+('.enc' if key else ''))
    with tempfile.TemporaryDirectory(prefix='.backup-',dir=root) as folder:
        private=pathlib.Path(folder)/'backup.db'
        with readonly(config['database']) as source,sqlite3.connect(private) as out:source.backup(out)
        private.chmod(0o600);expected=counts(private)
        payload=pathlib.Path(folder)/'payload.enc' if key else private
        if key:crypt(private,payload,key)
        meta={'counts':expected,'sha256':checksum(payload),'createdAt':time.time()}
        manifest=pathlib.Path(folder)/'manifest.json';manifest.write_text(json.dumps(meta));manifest.chmod(0o600)
        # A final backup name is visible only after encryption/checksum/manifest complete.
        os.replace(manifest,str(target)+'.json');os.replace(payload,target)
    # Hook receives only the final encrypted/plain backup path, never key contents.
    # No hook is executed unless operator explicitly configures an argv array.
    hook=settings.get('offsiteCommand')
    if hook:
        if not isinstance(hook,list) or not all(isinstance(x,str) for x in hook):raise ValueError('offsiteCommand must be argv array')
        try:subprocess.run(hook+[str(target)],check=True,capture_output=True,timeout=300)
        except (subprocess.SubprocessError,OSError):raise RuntimeError('offsite hook failed; completed local backup retained') from None
    return target

def restore_test(config):
    root=pathlib.Path(config['database']).parent/'backups';files=backup_files(root)
    if not files:raise ValueError('no backups')
    target=files[0];manifest=json.loads(pathlib.Path(str(target)+'.json').read_text())
    if checksum(target)!=manifest['sha256']:raise ValueError('backup checksum mismatch')
    with tempfile.TemporaryDirectory(prefix='.restore-',dir=root) as folder:
        private=pathlib.Path(folder)/'restored.db'
        if target.name.endswith('.enc'):crypt(target,private,config['backup']['encryptionKeyFile'],True)
        else:
            import shutil
            shutil.copyfile(target,private);private.chmod(0o600)
        actual=counts(private)
        if actual!=manifest['counts']:raise ValueError('restored counts mismatch')
    result={'backup':target.name,'verifiedAt':time.time(),'integrity':'ok','counts':actual,'countsMatch':True}
    path=root/'verification.json';path.write_text(json.dumps(result));path.chmod(0o600)
    return result

def rotation_candidates(config,at=None):
    at=time.time() if at is None else at;settings=config.get('backup',{});root=pathlib.Path(config['database']).parent/'backups';files=backup_files(root)
    daily=settings.get('keepDaily');weekly=settings.get('keepWeekly');days=config.get('retention',{}).get('backupsDays')
    if daily is None and weekly is None and days is None:return []
    keep=set(files[:1]);daily_groups=set();weekly_groups=set()
    for path in files:
        stamp=path.name[9:].split('.')[0]
        date=datetime.strptime(stamp,'%Y%m%dT%H%M%SZ' if len(stamp)==16 else '%Y%m%dT%H%M%S%fZ').replace(tzinfo=timezone.utc)
        day=date.date();week=date.isocalendar()[:2]
        if daily is not None and day not in daily_groups and len(daily_groups)<daily:keep.add(path);daily_groups.add(day)
        if weekly is not None and week not in weekly_groups and len(weekly_groups)<weekly:keep.add(path);weekly_groups.add(week)
        if days is not None and at-date.timestamp()<=days*86400:keep.add(path)
    return [p for p in files if p not in keep]

def retention_report(config,at=None):
    at=time.time() if at is None else at;settings=config.get('retention',{});tables={}
    with readonly(config['database']) as db:
        for table in ['observation_history','observations','events','runs','webhooks']:
            number=db.execute(f'SELECT count(*) FROM {table}').fetchone()[0]
            try:size=db.execute('SELECT coalesce(sum(pgsize),0) FROM dbstat WHERE name=?',(table,)).fetchone()[0]
            except sqlite3.Error:size=None
            tables[table]={'rows':number,'bytes':size}
        oldest,newest=db.execute('SELECT min(observed),max(observed) FROM observation_history').fetchone()
        history_days=settings.get('observationHistoryDays');remove=db.execute('SELECT count(*) FROM observation_history WHERE observed<?',(at-history_days*86400,)).fetchone()[0] if history_days is not None else 0
        recent=db.execute('SELECT count(*),coalesce(sum(length(CAST(body AS BLOB))),0) FROM observation_history WHERE observed>=?',(at-86400,)).fetchone()
    return {'measuredAt':at,'tables':tables,'historySpanSeconds':newest-oldest if oldest is not None else None,'historyLast24h':{'rows':recent[0],'bodyBytes':recent[1]},'wouldRemove':{'observation_history':remove,'events':0,'backups':[p.name for p in rotation_candidates(config,at)]},'eventsPolicy':'keep-all until dedupe tombstones exist'}

def apply_retention(config):
    # A verified snapshot must complete before any configured deletion; production callers require an audited plan.
    backup(config);restore_test(config)
    days=config.get('retention',{}).get('observationHistoryDays')
    if days is not None:
        with sqlite3.connect(config['database']) as db:db.execute('DELETE FROM observation_history WHERE observed<?',(time.time()-days*86400,))
    for path in rotation_candidates(config):
        path.unlink();pathlib.Path(str(path)+'.json').unlink(missing_ok=True)
    # No VACUUM and no event deletion. SQLite free pages are reused.

def validate_config(config):
    for section,keys in [('backup',['keepDaily','keepWeekly']),('retention',['observationHistoryDays','eventsDays','backupsDays'])]:
        for key in keys:
            value=config.get(section,{}).get(key)
            if value is not None and (type(value) is not int or value<0):raise ValueError('retention counts/days must be nonnegative integers or null')

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--config',required=True)
    modes=parser.add_mutually_exclusive_group()
    for option in ['restore-test','retention-report','apply-retention']:modes.add_argument('--'+option,action='store_true')
    args=parser.parse_args();config=json.loads(pathlib.Path(args.config).read_text());validate_config(config)
    if args.retention_report:print(json.dumps(retention_report(config),sort_keys=True))
    elif args.restore_test:print(json.dumps(restore_test(config)))
    elif args.apply_retention:apply_retention(config)
    else:backup(config)
if __name__=='__main__':main()
