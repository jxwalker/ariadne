#!/usr/bin/env python3
"""Read-only host measurements; no processes, environment, prompts or credentials."""
import argparse,json,os,pathlib,platform,re,shutil,socket,subprocess,time

def command(args,timeout=6):
    try:return subprocess.run(args,capture_output=True,text=True,timeout=timeout,check=True).stdout
    except (OSError,subprocess.SubprocessError):return ''

def collect(host=None,kind='machine'):
    out={'host':host or socket.gethostname(),'kind':kind,'at':time.time(),'status':'available','platform':platform.system(),'cores':os.cpu_count(),'cpuPercent':None,'memoryPercent':None,'memoryAvailableBytes':None,'swapUsedBytes':None,'pressure':{},'temperatures':[],'fans':[],'services':[]}
    disk=shutil.disk_usage('/');out.update(diskUsedBytes=disk.used,diskTotalBytes=disk.total,diskPercent=100*disk.used/disk.total)
    if platform.system()=='Linux':
        def cpu():return [int(x) for x in pathlib.Path('/proc/stat').read_text().splitlines()[0].split()[1:9]]
        a=cpu();time.sleep(.25);b=cpu();total=sum(b)-sum(a);idle=(b[3]+b[4])-(a[3]+a[4]);out['cpuPercent']=100*(1-idle/total) if total else None
        mem={k:int(v.split()[0])*1024 for k,v in (s.split(':',1) for s in pathlib.Path('/proc/meminfo').read_text().splitlines())}
        out.update(memoryPercent=100*(1-mem['MemAvailable']/mem['MemTotal']),memoryAvailableBytes=mem['MemAvailable'],memoryTotalBytes=mem['MemTotal'],swapUsedBytes=mem['SwapTotal']-mem['SwapFree'])
        out['load']=os.getloadavg()
        for name in ['cpu','memory','io']:
            p=pathlib.Path('/proc/pressure')/name
            if p.exists():
                for line in p.read_text().splitlines():
                    pieces=line.split();values=dict(x.split('=') for x in pieces[1:]);out['pressure'][name+'_'+pieces[0]]=float(values['avg10'])
        if host=='codex-dev':
            for service in ['ariadne-activity.service','ariadne-ingest-proxy.service','ariadne-ingest-tunnel.service']:
                state=command(['systemctl','--user','is-active',service]).strip();out['services'].append({'name':service,'state':state or 'unknown'})
        if kind=='physical':
            sensors=command(['ipmitool','sensor'],timeout=10)
            for line in sensors.splitlines():
                cols=[v.strip() for v in line.split('|')]
                if len(cols)<4:continue
                try:value=float(cols[1])
                except ValueError:continue
                if cols[2]=='degrees C':out['temperatures'].append({'name':cols[0],'celsius':value,'status':cols[3]})
                elif cols[2]=='RPM':out['fans'].append({'name':cols[0],'rpm':value,'status':cols[3]})
            if shutil.which('pvesh'):
                try:
                    raw=json.loads(command(['pvesh','get','/cluster/resources','--type','vm','--output-format','json'],timeout=10))
                    out['vms']=[{k:r.get(k) for k in ['vmid','name','status','cpu','maxcpu','mem','maxmem','disk','maxdisk','node','uptime']} for r in raw]
                except (ValueError,TypeError):out['vms']=[]
    elif platform.system()=='Darwin':
        cpu=command(['top','-l','2','-s','1','-n','0']);lines=re.findall(r'CPU usage:.*?([\d.]+)% idle',cpu)
        if lines:out['cpuPercent']=100-float(lines[-1])
        total=command(['sysctl','-n','hw.memsize']).strip()
        if total.isdigit():out['memoryTotalBytes']=int(total)
        pressure=command(['memory_pressure','-Q']);match=re.search(r'free percentage:\s*(\d+)%',pressure)
        if match:out['pressure']['macFreePercent']=int(match[1])
        # Do not manufacture Linux MemAvailable or a Mac RAM pressure percent from vm_stat page categories.
        swap=command(['sysctl','-n','vm.swapusage']);m=re.search(r'used\s*=\s*([\d.]+)([MG])',swap)
        if m:out['swapUsedBytes']=float(m[1])*(1024**2 if m[2]=='M' else 1024**3)
    return out

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--host');p.add_argument('--kind',choices=['machine','vm','mac','physical'],default='machine');a=p.parse_args();print(json.dumps(collect(a.host,a.kind)))
