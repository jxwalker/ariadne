#!/usr/bin/env python3
"""Private outbound telemetry bridge. No hooks, agent controls or credential copying."""
import datetime as dt,fcntl,importlib.util,json,pathlib,subprocess,sys,hashlib,shlex
config_path=pathlib.Path(sys.argv[1]);config=json.loads(config_path.read_text())
lock=open(config_path.with_suffix('.lock'),'a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
script=pathlib.Path(__file__).with_name('agent_telemetry.py')
spec=importlib.util.spec_from_file_location('collector',script);collector=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector)
now=dt.datetime.now(dt.timezone.utc).isoformat()
snapshots=[collector.collect(pathlib.Path.home(),config['host'],config.get('workspaceMappings',{}))]
for remote in config.get('remoteHosts',[]):
 cache=config_path.parent/(remote['host'].lower()+'.last.json')
 try:
  if not remote.get('sshTarget'):raise RuntimeError('authentication_required')
  # Fixed installer-owned collector path; never execute an agent's commands.
  command=shlex.quote(remote.get('python','python3'))+' '+shlex.quote(remote['collectorPath'])+' --host '+shlex.quote(remote['host'])
  result=subprocess.run(['ssh','-T','-o','BatchMode=yes','-o','ConnectTimeout=5','-o','RemoteCommand=none']+(['-J',remote['jumpHost']] if remote.get('jumpHost') else [])+[remote['sshTarget'],command],capture_output=True,text=True,timeout=18,check=True)
  snapshot=json.loads(result.stdout)
  if snapshot.get('schemaVersion')!=1 or snapshot.get('host')!=remote['host']:raise ValueError('invalid snapshot')
  cache.write_text(json.dumps(snapshot));snapshots.append(snapshot)
 except (OSError,ValueError,subprocess.SubprocessError,RuntimeError):
  previous=json.loads(cache.read_text()) if cache.exists() else {'schemaVersion':1,'host':remote['host'],'collectedAt':now,'sessions':[],'sources':[{'agent':a,'status':('unavailable' if remote.get('sshTarget') else 'authentication_required'),'method':('SSH connection or authentication unavailable' if remote.get('sshTarget') else 'No SSH login configured')} for a in ['Claude','Codex']]}
  previous['status']='unreachable';snapshots.append(previous)
# One fixed receiver path under the private VM vault; validated JSON is written atomically.
receive='''import json,pathlib,sys,hashlib
root=pathlib.Path("/home/james/workspaces/ariadne/vault/projects/scorpion-labs/integrations/agents")
root.mkdir(parents=True,exist_ok=True)
for data in json.load(sys.stdin):
 if data.get("schemaVersion")!=1 or data.get("host") not in ("JW-MBP","M5","claude-dev"):raise ValueError("unexpected source")
 name=hashlib.sha256(data["host"].encode()).hexdigest()[:16]+".json"
 p=root/name;t=p.with_suffix(".tmp");t.write_text(json.dumps(data));t.replace(p)
'''
import shlex
result=subprocess.run(['ssh','-T','-o','BatchMode=yes','-o','ConnectTimeout=5','-o','RemoteCommand=none',config['destination'],'python3 -c '+shlex.quote(receive)],input=json.dumps(snapshots),text=True,capture_output=True,timeout=20)
if result.returncode:print('Telemetry delivery unavailable; existing snapshots will become stale.',file=sys.stderr);sys.exit(1)
print('Private telemetry delivered: '+', '.join(s['host'] for s in snapshots))
