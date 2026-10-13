#!/usr/bin/env python3
"""Compile reviewed immutable source snapshots to idempotent sourced-draft commands.
Does not access another checkout or database. Emit with --output; execute through ariadne ledger-command.
"""
import argparse, hashlib, json, pathlib, re
ROOT=pathlib.Path(__file__).resolve().parents[1]
MASTER=ROOT/'docs/master'

def compile_import():
    commands=[]; revisions={}; scope={}; manifest=json.loads((MASTER/'evidence/imports.json').read_text())
    sources={x['snapshot']:x for x in manifest}
    pr_facts=json.loads((MASTER/'evidence/referenced-prs.json').read_text())
    dependency_commands=[]
    def command(op,target,**kw):
        c=dict(op=op,target=target,expectedRevision=revisions.get(target,0),reason='Sourced draft import; outcome Done claims remain unverified',**kw)
        c['commandId']='P1-'+hashlib.sha256(json.dumps(c,sort_keys=True).encode()).hexdigest()[:48]
        commands.append(c);revisions[target]=revisions.get(target,0)+1
    def node(id,kind,title,parent=None,**body):
        command('create',id,kind=kind,**({'parent':parent} if parent else {}),body=dict(title=title,**body))
    def source(path):
        key='evidence/'+path
        meta=sources[key]; content=(MASTER/key).read_bytes()
        if hashlib.sha256(content).hexdigest()!=meta['sha256']:raise ValueError('source hash mismatch: '+key)
        return content.decode(),meta
    node('policy:source-draft:v1','policy','Sourced outcome acceptance: exact candidate CI, runtime and review',requiredKinds=['ci','runtime','review'],maxAgeSeconds=86400)
    node('policy:documentation:v1','policy','Documentation review at exact revision',requiredKinds=['document','review'],maxAgeSeconds=86400)
    def work(id,title,milestone,baseline,goal,status,meta,criteria=None,**body):
        criterion=id+':outcome'
        cs=criteria or [{'id':criterion,'text':goal}]
        node(id,'work',title,milestone,goal=goal,owner='unassigned',policy='policy:source-draft:v1',criteria=cs,state='proposed',source=meta,sourceStatus=status,verification='unverified',nextAction='Freeze candidate and obtain policy evidence; reconcile source assertion',requirements=[goal],refs=[],**body)
        numbers={int(n) for n in re.findall(r'#(\d+)',title+' '+goal+' '+status)}
        commands[-1]['body']['refs']=[{'kind':'github_pr','source':'Phase 0 GitHub snapshot; observation only','observed_at':fact['observed_at'],**fact['data']} for fact in pr_facts if fact.get('repo')==meta.get('repository') and fact.get('data',{}).get('number') in numbers]
        explicit=re.search(r'(?:WAIT|Follows|After)\s+((?:CRAFT|PROS|CREATE|HELP|LM|SEC|BRIEF|CLR)-[A-Z0-9-]+(?:[^.;]*))',goal)
        if explicit:
            ids=re.findall(r'\b(?:CRAFT|PROS|CREATE|HELP|LM|SEC|BRIEF|CLR)-[A-Z0-9-]+\b',explicit[1])
            dependency_commands.append((id,['work:patent:'+x for x in ids if 'work:patent:'+x!=id]))
        command_alias=commands[-1];command_alias['aliases']=[{'source':meta.get('repository','assignment'),'alias':body.get('sourceAlias',id)}]
        command_alias['commandId']='P1-'+hashlib.sha256(json.dumps({k:v for k,v in command_alias.items() if k!='commandId'},sort_keys=True).encode()).hexdigest()[:48]
        scope[baseline].extend({'workId':id,'criterionId':x['id']} for x in cs)
    def product(slug,title):
        p='product:'+slug;b='baseline:'+slug+':v1'
        node(p,'product',title,repository='jxwalker/'+slug)
        node(b,'baseline','Imported sourced draft v1',p,version=1,state='proposed',acceptedScope='No baseline approval inferred',scopeDiff={'reason':'Initial imported scope; requires James approval'})
        scope[b]=[];return p,b
    _,pat=product('patent-studio','Patent Studio')
    text,meta=source('patent-studio/docs/PUBLIC_BETA_CHECKLIST.md')
    # Preserve the actual native Gate hierarchy and checklist lines, including checked assertions.
    gates={}
    for gate in ['0','A','B','C','D']:
        phase='phase:patent:gate-'+gate;milestone='milestone:patent:gate-'+gate
        node(phase,'phase','Gate '+gate,pat,source=meta)
        node(milestone,'milestone', 'Frozen Gate 0 release/restore readiness' if gate=='0' else 'Gate '+gate+' exit',phase,owner='unassigned',source=meta,pilotPriority=gate=='0')
        gates[gate]=milestone
    current='0';i=0
    checklist_lines=[]
    for line in text.splitlines():
        if line.startswith('      ') and checklist_lines and checklist_lines[-1].startswith('- ['):
            checklist_lines[-1]+=' '+line.strip()
        else:checklist_lines.append(line)
    for line in checklist_lines:
        heading=re.match(r'^#{2,4}\s+Gate\s+([0ABCD])\b',line,re.I)
        if heading:current=heading[1].upper()
        check=re.match(r'^- \[([ xX])\] (.+)',line)
        if check:
            i+=1;title=check[2]
            work('work:patent:release:'+str(i),title[:160],gates[current],pat,title,'Done assertion — unverified' if check[1].lower()=='x' else 'Open',meta,sourceAlias='release-checklist:'+str(i))
    # Owning backlog rows, rather than copied program indices, supply identity and CoS.
    for name in ['backlog','create-backlog','pros-backlog','last-mile-backlog','sec-backlog','brief-backlog','craft-backlog','clr-backlog']:
        txt,m=source('patent-studio/docs/delivery/'+name+'.md')
        phase='phase:patent:'+name;milestone='milestone:patent:'+name
        node(phase,'phase',name.replace('-backlog','').title()+' delivery program',pat,source=m)
        node(milestone,'milestone','Backlog outcomes',phase,owner='unassigned',source=m)
        seen=set()
        for line in txt.splitlines():
            cells=[c.strip() for c in line.strip().strip('|').split('|')]
            if not line.startswith('|') or len(cells)<4:continue
            match=re.search(r'\b(?:HELP|CREATE|PROS|LM|SEC|BRIEF|CRAFT|CLR)-[A-Z0-9-]+\b',cells[0])
            if not match or match[0] in seen:continue
            alias=match[0];seen.add(alias)
            status=next((c for c in cells[1:] if re.match(r'^(Done|Agreed|Proposed|Cancelled|Canceled|In.progress|Blocked)',c,re.I)),'Unknown')
            goal=cells[-1];title=next((c for c in cells[1:-1] if len(c)>35),alias)
            work('work:patent:'+alias,title[:160],milestone,pat,goal,status+' — unverified' if re.search('done',status,re.I) else status,m,sourceAlias=alias)
    _,osc=product('openscorpion','OpenScorpion')
    txt,m=source('openscorpion/docs/ROADMAP.md'); phases=[]
    for line in txt.splitlines():
        match=re.match(r'^\| (P\d+) — (.*?) \| (.*?) \| (.*) \|$',line)
        if not match:continue
        alias,title,status,goal=match.groups();phase='phase:openscorpion:'+alias;milestone='milestone:openscorpion:'+alias
        node(phase,'phase',alias+' — '+title,osc,source=m)
        node(milestone,'milestone',alias+' exit',phase,owner='unassigned',source=m,pilotPriority=alias=='P3')
        work('work:openscorpion:'+alias,title,milestone,osc,goal,status+' — outcome unverified',m,sourceAlias=alias)
        phases.append(alias)
    avx=txt.split('### CPU Baseline: AVX Required (ONNX Runtime)',1)[1].split('## Demo Readiness',1)[0]
    work('work:openscorpion:AVX','CPU baseline: remove unconditional ONNX/AVX startup failure','milestone:openscorpion:P3',osc,avx,'Guarded; #824 closed unmerged; not fixed',m,sourceAlias='AVX')
    command('dependencies','work:openscorpion:AVX',dependencies=['work:openscorpion:P3'])
    work('work:openscorpion:quota','Tenant cache quota fairness — deferred separate scope','milestone:openscorpion:P9',osc,'Per-tenant cache quotas must be enforced; isolation does not establish fairness','Conflicting VALIDATED assertion; outcome unverified',m,sourceAlias='UI30-09',scopeDisposition='Deferred by DEC-002 A')
    _,ari=product('ariadne','Ariadne')
    txt,m=source('ariadne/docs/roadmap.md')
    headings=list(re.finditer(r'^## Milestone (\d+): (.+)$',txt,re.M))
    for index,match in enumerate(headings):
        number,title=match.groups();goal=txt[match.end():headings[index+1].start() if index+1<len(headings) else len(txt)].strip()
        phase='phase:ariadne:M'+number;milestone='milestone:ariadne:M'+number
        node(phase,'phase',title,ari,source=m);node(milestone,'milestone','Milestone '+number+': '+title,phase,source=m,owner='unassigned')
        work('work:ariadne:M'+number,title,milestone,ari,goal,'Implemented assertions and Next work — acceptance unverified',m,sourceAlias='M'+number)
    # Actual current operating-roadmap queues, retained alongside the original native milestones.
    txt,m=source('ariadne/docs/activity-roadmap.md')
    node('phase:ariadne:operations','phase','Activity and orchestration',ari,source=m)
    node('milestone:ariadne:operations','milestone','Operating roadmap remaining outcomes','phase:ariadne:operations',source=m,owner='unassigned')
    for index,line in enumerate(txt.splitlines()):
        cells=[c.strip() for c in line.strip().strip('|').split('|')]
        if line.startswith('|') and len(cells)==4 and cells[0] not in ('Item','---') and not cells[0].startswith('-'):
            work('work:ariadne:ops:'+str(index),cells[0],'milestone:ariadne:operations',ari,cells[2],'Proposed sourced queue',m,sourceAlias='activity-roadmap:'+str(index))
    assignment='ARIADNE-MASTER-PILOT-20261013-P01'
    for phase_no in [0,1]:
        phase='phase:ariadne:master-p'+str(phase_no);milestone='milestone:ariadne:master-p'+str(phase_no)
        node(phase,'phase','Master pilot phase '+str(phase_no),ari)
        node(milestone,'milestone',assignment+' phase '+str(phase_no),phase,owner='Ariadne Bot')
        meta={'repository':'jxwalker/ariadne','path':'assignment brief','observed_at':'2026-10-13','source':'James assignment 2026-10-13'}
        work(assignment if phase_no==1 else assignment+':P0','Authoritative ledger and private dashboard' if phase_no else 'Sourced baseline and PostgreSQL preparation',milestone,ari,'Meet assignment phase '+str(phase_no)+' evidence requirements','Active implementation' if phase_no else 'Documentation collected; acceptance unverified',meta,sourceAlias=assignment+':P'+str(phase_no))
        commands[-1]['body']['owner']='agent:ariadne-bot'
        commands[-1]['commandId']='P1-'+hashlib.sha256(json.dumps({k:v for k,v in commands[-1].items() if k!='commandId'},sort_keys=True).encode()).hexdigest()[:48]
    for id,title in [('external:eval-factory','Eval Factory candidate-bound results / missing Create golden'),('external:apcg','APCG candidate proof coverage')]:
        node(id,'external',title,state='unresolved',owner='external; unassigned',nextAction='Obtain candidate-bound independent evidence; no external execution authorized')
    command('dependencies','work:openscorpion:P8',dependencies=['work:openscorpion:P7'])
    for target,deps in dependency_commands:
        if deps:command('dependencies',target,dependencies=deps)
    command('dependencies','work:openscorpion:P9',dependencies=['external:eval-factory','work:openscorpion:P8'])
    command('dependencies','work:ariadne:M7',dependencies=['external:eval-factory'])
    if 'work:patent:CREATE-1' in revisions:command('dependencies','work:patent:CREATE-1',dependencies=['external:eval-factory'])
    decisions=[('DEC-001','Patent Studio first pilot milestone',['A: frozen Gate 0 release/restore readiness','B: continued feature acceptance'],'A'),('DEC-002','OpenScorpion next scope',['A: P3/AVX first; quota fairness deferred','B: P8 full-day dogfood first','C: quota fairness first'],'A'),('DEC-003','Pilot portfolio',['A: three products; APCG/Factory dependencies and gaps','B: expand portfolio'],'A'),('DEC-005','Off-site backup',['Approve separately bounded destination/access','Keep local daily dump pending decision'],None),('DEC-006','Agent ledger credentials',['Provision separately scoped agent capabilities','Keep operator-only writes'],None)]
    for id,title,options,resolution in decisions:
        node(id,'decision',title,options=options,state='resolved' if resolution else 'open',resolution=resolution,source='James 2026-10-13 17:04 BST' if resolution else 'Phase 1 update 2026-10-13 17:28 BST')
    for baseline,entries in scope.items():command('scope',baseline,scope=entries,scopeDiff={'added':len(entries),'approved':False,'reason':'Imported draft; decisions select priorities without approving complete baseline'})
    for meta in manifest:
        if meta['repository'] not in ['jxwalker/patent-studio','jxwalker/openscorpion','jxwalker/ariadne']:continue
        # Verify every preserved raw snapshot before recording its provenance.
        snapshot=MASTER/meta['snapshot']
        if hashlib.sha256(snapshot.read_bytes()).hexdigest()!=meta['sha256']:raise ValueError('hash mismatch '+str(snapshot))
        product_id='product:'+meta['repository'].split('/')[1]
        command('import',product_id,provenance={**meta,'reconciliation_reason':'Preserved Phase 0 source; owning rows imported as proposed, Done never establishes acceptance'})
    return commands
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);args=parser.parse_args()
    result=compile_import();pathlib.Path(args.output).write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'commands':len(result),'workItems':sum(c.get('kind')=='work' for c in result),'output':args.output}))
