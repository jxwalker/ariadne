#!/usr/bin/env python3
import fcntl,importlib.util,json,os,pathlib,subprocess
root=pathlib.Path.home()/'workspaces/ariadne'
lock=open(root/'.agent-refresh.lock','a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
p=root/'scripts/agent_telemetry.py';spec=importlib.util.spec_from_file_location('collector',p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
data=m.collect(pathlib.Path.home(),'codex-dev')
dir=root/'vault/projects/scorpion-labs/integrations/agents';dir.mkdir(parents=True,exist_ok=True)
temp=dir/'codex-dev.tmp';temp.write_text(json.dumps(data));temp.replace(dir/'codex-dev.json')
subprocess.run(['docker','run','--rm','-u',f'{os.getuid()}:{os.getgid()}','-e','HOME=/tmp','-v',f'{root}:/app','-w','/app','node:22-bookworm','node','dist/src/ariadne.js','console-html','--project','scorpion-labs','--refresh-data'],check=True,timeout=25)
