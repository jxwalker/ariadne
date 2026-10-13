#!/usr/bin/env python3
"""Read-only Claude/Codex telemetry. Exports bounded task metadata, never transcripts/tool arguments."""
import argparse, datetime as dt, json, pathlib, re, socket, sqlite3, subprocess, time
ALLOWED={'ariadne','patent-studio','openscorpion','apcg-platform','apcg-ui','apcg-engine','apcg-verifier','gad-demo','apcg','agent-ops','tech-demos'}
FRESH_SECONDS=180

def stamp(value):
    try: return dt.datetime.fromisoformat(str(value).replace('Z','+00:00')).timestamp()
    except (ValueError,TypeError): return 0

def clean(value,limit=240):
    value=re.sub(r'<[^>]*>',' ',str(value or ''))
    value=re.sub(r'\b(?:sk-[A-Za-z0-9_-]+|gh[pousr]_[A-Za-z0-9_]+)\b','[redacted]',value)
    value=re.sub(r'(?i)(api[_ -]?key|token|password|secret)\s*[:=]\s*\S+',r'\1=[redacted]',value)
    return ' '.join(value.split())[:limit]

def task_label(value):
    if '## My request:' in value: value=value.rsplit('## My request:',1)[1]
    value=re.sub(r'<(?:in-app-browser-context|environment_context|send_user_message_question_reply)[\s\S]*?</(?:in-app-browser-context|environment_context|send_user_message_question_reply)>','',value)
    lines=[line.strip() for line in value.splitlines() if line.strip() and not line.lstrip().startswith(('<','[','{'))]
    return clean(lines[0]) if lines else ''

def tail_records(file):
    with file.open('rb') as stream:
        size=file.stat().st_size
        start=max(0,size-2*1024*1024);stream.seek(start)
        if start:stream.readline()
        lines=stream.read().decode('utf-8','replace').splitlines()
    for line in lines:
        try:
            record=json.loads(line)
            if isinstance(record,dict):yield record
        except (ValueError,UnicodeError):continue

def workspace(cwd,origin='',mappings=None):
    for root,repo in (mappings or {}).items():
        if cwd==root:return {'repository':repo,'branch':None,'changedFiles':[]}
    try:
        def git(*args):return subprocess.check_output(['git','-C',cwd,*args],stderr=subprocess.DEVNULL,text=True,timeout=3).strip()
        origin=origin or git('remote','get-url','origin')
        match=re.search(r'(?:github\.com[:/])jxwalker/([^/\s]+?)(?:\.git)?$',origin)
        if not match or match.group(1) not in ALLOWED:return None
        branch=git('rev-parse','--abbrev-ref','HEAD')
        # Filenames only. No contents, diff, commands, environment or credentials.
        changed=git('status','--porcelain','--untracked-files=normal').splitlines()
        return {'repository':'jxwalker/'+match.group(1),'branch':clean(branch,100),'changedFiles':[clean(line[3:],160) for line in changed[:12]]}
    except (OSError,subprocess.SubprocessError):
        match=re.search(r'github\.com[:/]jxwalker/([^/\s]+?)(?:\.git)?$',origin)
        if match and match.group(1) in ALLOWED:return {'repository':'jxwalker/'+match.group(1),'branch':None,'changedFiles':[]}
        return None

def codex_session(row,records,host,now,mappings):
    scope=workspace(row.get('cwd',''),row.get('git_origin_url','') or '',mappings)
    if not scope:return None
    active=None;status='unknown';last=0;event='';tool='';update='';label=clean(row.get('name') or '',240)
    for record in records:
        timestamp=stamp(record.get('timestamp'));kind=record.get('type');p=record.get('payload',{})
        if not isinstance(p,dict):continue
        # Only lifecycle and event timestamps survive export.
        if timestamp>last:last=timestamp
        if kind=='event_msg':
            typ=p.get('type')
            if typ=='task_started':active=p.get('turn_id');status='working';event=typ
            elif typ in ('task_complete','turn_aborted') and (active is None or p.get('turn_id')==active):
                status='idle' if typ=='task_complete' else 'interrupted';active=None;event=typ
        if kind=='response_item':
            if p.get('type') in ('function_call','custom_tool_call'):tool=clean(p.get('name'),80)
            if p.get('type')=='message' and p.get('role')=='assistant' and (p.get('phase') or p.get('channel'))=='commentary':
                text=' '.join(c.get('text','') for c in p.get('content',[]) if isinstance(c,dict)).split('```',1)[0]
                update=clean(re.sub(r'https?://\S+','[link]',text),240) or update
            if p.get('type')=='message' and p.get('role')=='user':
                text='\n'.join(c.get('text','') for c in p.get('content',[]) if isinstance(c,dict))
                candidate=task_label(text)
                if candidate and not row.get("name"):label=candidate
    if not last or now-last>7*86400:return None
    if status=='working' and now-last>FRESH_SECONDS:status='stale'
    return dict(id=row['id'],agent='Codex',host=host,task=label or 'Codex repository session',status=status,lastEventAt=dt.datetime.fromtimestamp(last,dt.timezone.utc).isoformat(),event=event or 'No lifecycle marker in bounded log window',lastTool=tool,source=pathlib.Path(row['rollout_path']).name,update=update,**scope)

def claude_session(file,records,host,now,mappings):
    cwd='';branch='';sid=file.stem;last=0;status='unknown';event='';label='';tool=''
    for record in records:
        timestamp=stamp(record.get('timestamp'))
        if timestamp>last:last=timestamp
        cwd=record.get('cwd') or cwd;branch=record.get('gitBranch') or branch;sid=record.get('sessionId') or sid
        typ=record.get('type');msg=record.get('message',{})
        if typ=='ai-title':label=clean(record.get('aiTitle')) or label
        if typ=='user' and isinstance(msg,dict):
            content=msg.get('content','')
            if isinstance(content,str):
                label=task_label(content) or label;status='working';event='user_message'
            elif isinstance(content,list) and any(c.get('type')=='tool_result' for c in content if isinstance(c,dict)):
                status='working';event='tool_result'
        if typ=='assistant' and isinstance(msg,dict):
            for c in msg.get('content',[]) if isinstance(msg.get('content'),list) else []:
                if isinstance(c,dict) and c.get('type')=='tool_use':tool=clean(c.get('name'),80);status='working';event='tool_use'
            if msg.get('stop_reason')=='end_turn':status='idle';event='end_turn'
        if typ=='system' and record.get('subtype')=='stop_hook_summary' and not record.get('preventedContinuation'):
            status='idle';event='stop_hook_summary'
        if typ=='system' and record.get('subtype')=='api_error':status='error';event='api_error'
    if not last or now-last>7*86400:return None
    scope=workspace(cwd,mappings=mappings)
    if not scope:return None
    if status=='working' and now-last>FRESH_SECONDS:status='stale'
    return dict(id=sid,agent='Claude',host=host,task=label or 'Claude repository session',status=status,lastEventAt=dt.datetime.fromtimestamp(last,dt.timezone.utc).isoformat(),event=event or 'Transcript metadata',lastTool=tool,source=file.name,**scope)

def collect(home,host,mappings=None,now=None):
    now=now or time.time();sessions=[];sources=[]
    db=home/'.codex/state_5.sqlite'
    if db.exists():
        try:
            connection=sqlite3.connect(f'file:{db}?mode=ro',uri=True);connection.row_factory=sqlite3.Row
            rows=connection.execute('SELECT * FROM threads WHERE archived=0 ORDER BY updated_at DESC LIMIT 80').fetchall()
            for raw in rows:
                row=dict(raw);file=pathlib.Path(row['rollout_path'])
                if file.exists() and file.stat().st_mtime>now-7*86400:
                    session=codex_session(row,tail_records(file),host,now,mappings)
                    if session:sessions.append(session)
            connection.close();sources.append({'agent':'Codex','status':'available','method':'read-only SQLite and lifecycle events'})
        except (sqlite3.Error,OSError) as error:sources.append({'agent':'Codex','status':'error','method':type(error).__name__})
    else:sources.append({'agent':'Codex','status':'not_installed','method':'No local session registry'})
    projects=home/'.claude/projects'
    if projects.exists():
        files=sorted(projects.glob('*/*.jsonl'),key=lambda p:p.stat().st_mtime,reverse=True)
        for file in files[:80]:
            if file.stat().st_mtime<now-7*86400:continue
            try:
                session=claude_session(file,tail_records(file),host,now,mappings)
                if session:sessions.append(session)
            except OSError:continue
        sources.append({'agent':'Claude','status':'available','method':'read-only session lifecycle and tool names'})
    else:sources.append({'agent':'Claude','status':'not_installed','method':'No local session store'})
    sessions.sort(key=lambda s:s['lastEventAt'],reverse=True)
    result={'schemaVersion':1,'host':host,'collectedAt':dt.datetime.fromtimestamp(now,dt.timezone.utc).isoformat(),'status':'available','sources':sources,'sessions':sessions[:30]}
    try:
        from activity_machine_probe import collect as machine_collect
        result['machine']=machine_collect(host,'mac' if __import__('platform').system()=='Darwin' else 'vm')
    except (ImportError,OSError,ValueError,KeyError,IndexError,ZeroDivisionError):pass
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--host',default=socket.gethostname());parser.add_argument('--config');args=parser.parse_args()
    config=json.loads(pathlib.Path(args.config).read_text()) if args.config else {}
    print(json.dumps(collect(pathlib.Path.home(),args.host,config.get('workspaceMappings',{}))))
