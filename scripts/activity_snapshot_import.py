#!/usr/bin/env python3
"""Migrate already-scoped read-only snapshots with explicit host/session correlation.
Does not parse raw logs or claim hook support. Local trusted collector path is operator configured.
"""
import argparse,hashlib,json,pathlib,time
from datetime import datetime,timezone
from activity_server import Store,canonical,validate

def main():
    p=argparse.ArgumentParser();p.add_argument('--config',required=True);a=p.parse_args();c=json.loads(pathlib.Path(a.config).read_text());store=Store(c['database'])
    for file in pathlib.Path(c['snapshotDirectory']).glob('*.json'):
        try:
            snap=json.loads(file.read_text());host=snap['host']; collected=datetime.fromisoformat(snap['collectedAt'].replace('Z','+00:00')).timestamp()
            if snap['status']!='available' or time.time()-collected>90:continue
            source=c.get('snapshotSources',{}).get(host)
            if not source:continue
            with store.connect() as db: db.execute('INSERT OR REPLACE INTO health VALUES(?,?,?,?)',('snapshot:'+source,collected,'connected',str(len(snap.get('sessions',[])))+' recent sessions'))
            for s in snap.get('sessions',[]):
                repo=s['repository'];repo=repo if '/' in repo else 'jxwalker/'+repo
                if repo not in c['githubRepositories']:continue
                # Snapshot source is distinct from hook source. Exact host+session correlation is exposed.
                run=hashlib.sha256((host+'\n'+s['id']).encode()).hexdigest()[:32]
                ident=hashlib.sha256(('metadata-v2\n'+run+'\n'+s['lastEventAt']+'\n'+s['event']).encode()).hexdigest()
                kind={'working':'task.progress','interrupted':'task.interrupted'}.get(s['status'],'session.end')
                with store.connect() as db:
                    old=db.execute('SELECT seq FROM runs WHERE source=? AND run=?',(source,run)).fetchone()
                    exists=db.execute('SELECT 1 FROM events WHERE id=?',(ident,)).fetchone()
                if exists:continue
                e={'schemaVersion':1,'eventId':ident,'sourceId':source,'agent':{'identity':s['agent'],'product':s['agent'],'version':'read-only collector'},'project':'scorpion-labs','repository':repo,'taskId':run,'runId':run,'sessionId':s['id'],'sequence':old['seq']+1 if old else 0,'occurredAt':s['lastEventAt'],'kind':kind,'label':(s['agent']+' repository activity')[:160],'summary':('Read-only observation: '+s['status']+'; last tool: '+s.get('lastTool','unknown'))[:500],'location':{'kind':'machine','name':host}}
                if s.get('branch'):e['branch']=s['branch']
                validate(e);store.accept(e,canonical(e).encode())
        except (ValueError,KeyError,TypeError):continue
    store.process()
if __name__=='__main__':main()
