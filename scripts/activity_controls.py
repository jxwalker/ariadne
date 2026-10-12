"""Read-only control evidence projection. Never copy records or expose raw output/config."""
import hashlib
import json
import pathlib
import re
import time
from collections import Counter

from activity_server import stamp
from activity_insights import source_name, product

MAX_FILES = 1000
MAX_BYTES = 1024 * 1024
MAX_ROWS = 200
MAX_DETAILS = 100
THRESHOLDS = {'approvals': 30*86400, 'plans': 86400, 'audit': 86400,
              'dryRuns': 86400, 'executions': 86400, 'readiness': 86400,
              'cutover': 86400, 'sources': 7200, 'webhooks': 86400,
              'reconciliation': 7200, 'receipts': 7200}
FILES = {'approvals': ('approvals', True), 'plans': ('mutation-readiness', True),
         'audit': ('mutation-readiness-audit.json', False),
         'dryRuns': ('mutation-dry-runs', True), 'executions': ('mutation-executions', True),
         'readiness': ('live-adapter-readiness.json', False),
         'cutover': ('live-adapter-cutover-audit.json', False)}
TITLES = {'approvals': 'Approvals', 'plans': 'Mutation-readiness plans',
          'audit': 'Mutation-readiness audit', 'dryRuns': 'Dry runs',
          'executions': 'Executions and post-verification', 'readiness': 'Live-adapter readiness',
          'cutover': 'Live-adapter cutover'}
PASS = {'approved', 'passed', 'ready', 'ready_for_adapter', 'ready_for_cutover', 'ready_for_bounded_review', 'success'}
# Closed records (decided rejected/expired, or plans whose approval was) are history, not pending failures.
CLOSED = {'rejected', 'expired', 'approval_rejected', 'retired'}
FAIL = {'requested', 'rejected', 'expired', 'approval_required', 'approval_rejected', 'blocked',
        'failed', 'timed_out', 'post_verify_failed', 'post_verify_skipped', 'error', 'revoked'}
# Conservative whole-field redaction: commands with credential references are not displayed either.
SENSITIVE = re.compile(r'(?i)(?:[a-z0-9_]*(?:secret|password|passwd|token|credential|api[_-]?key|authorization|bearer|private[_ -]?key)[a-z0-9_]*|gh[pousr]_[a-z0-9]+|github_pat_|sk-[a-z0-9]|xox[baprs]-|AKIA[A-Z0-9]{12}|AIza|-----BEGIN|\bkey\b|[a-z0-9_]+key\b|eyJ[a-z0-9_-]+\.[a-z0-9_-]+\.|https?://[^\s/@]+:[^\s/@]+@|[a-z0-9+/=]{40,}|[a-f0-9]{32,}|\b[A-Z][A-Z0-9_]*\s*=)')
FIELDS = {'id', 'project', 'target', 'scope', 'action', 'risk', 'status', 'planId',
          'requestedAt', 'decidedAt', 'generatedAt', 'startedAt', 'finishedAt',
          'requestedBy', 'decisionBy', 'reason', 'decisionNotes', 'approvalRef', 'approvalStatus', 'auditRef', 'dryRunRef',
          'readinessRef', 'approvalReviewAuditRef', 'mutationReadinessAuditRef',
          'operatorEvidenceAuditRef', 'rollback', 'requiredGates', 'blockers', 'warnings',
          'command', 'dryRunCommand', 'proposedLiveCommand', 'liveCommand',
          'postVerificationCommand', 'executeCommand', 'exitCode', 'liveExitCode',
          'postVerificationExitCode', 'durationMs', 'bufferExceeded', 'liveBufferExceeded',
          'postVerificationBufferExceeded', 'mutationAllowed', 'execute', 'summary', 'checks', 'targets',
          'gates', 'label', 'detail', 'latestReadyPlanId', 'latestAcceptedApprovalReviewId',
          'planCount', 'passedPlanCount', 'passedDryRunCount', 'passedExecutionCount',
          'approvalReviewCount', 'acceptedApprovalReviewCount', 'plans', 'ready', 'blocked',
          'approvalRequired', 'approvalRejected', 'missingEvidence', 'unsafeDryRuns',
          'executablePlans', 'passedPlans', 'passedDryRuns', 'passedExecutions',
          'acceptedApprovalReviews', 'passedGates', 'blockedGates', 'advisoryGates'}
REDACTED = '[redacted sensitive material]'


def text(value, secrets=()):
    if not isinstance(value, str): return None
    if SENSITIVE.search(value) or any(s and s in value for s in secrets): return REDACTED
    return value[:1000]


def sanitize(value, secrets=(), depth=0):
    """Allowlist both nested keys and value types; unknown fields never reach the browser."""
    if depth > 6: return '[detail limit]'
    if isinstance(value, dict):
        return {key: sanitize(item, secrets, depth+1) for key,item in value.items() if key in FIELDS}
    if isinstance(value, list): return [sanitize(item,secrets,depth+1) for item in value[:50]]
    if isinstance(value, str): return text(value,secrets)
    if value is None or isinstance(value, bool) or type(value) is int: return value
    return None


def evidence_time(record):
    for key in ['finishedAt', 'decidedAt', 'generatedAt', 'requestedAt', 'startedAt']:
        try: return stamp(record.get(key))
        except (ValueError, TypeError, OverflowError): pass
    return None


def grade(state, at, threshold, clock):
    if state in CLOSED: return 'closed'
    if at is None: return 'missing'
    if clock-at > threshold: return 'stale'
    return 'pass' if state in PASS else 'fail' if state in FAIL else 'missing'


def load(directories, secrets):
    records={key: {} for key in FILES}; coverage=[]; warnings=[]; count=0; truncated=False
    if not isinstance(directories, list) or len(directories)>8:
        return records,[],['Control evidence configuration must list at most 8 absolute directories.'],False
    for index,directory in enumerate(directories):
        origin=f'Evidence directory {index+1}'
        if not isinstance(directory,str) or not pathlib.Path(directory).is_absolute():
            coverage.append({'origin':origin,'state':'invalid'});continue
        root=pathlib.Path(directory)
        if root.is_symlink():coverage.append({'origin':origin,'state':'invalid'});continue
        if not root.is_dir():coverage.append({'origin':origin,'state':'missing'});continue
        coverage.append({'origin':origin,'state':'read-only'})
        for category,(name,multiple) in FILES.items():
            folder=root/name
            if folder.is_symlink():warnings.append(f'{origin}: symlinked {category} evidence skipped.');continue
            try: paths=sorted(folder.glob('*.json')) if multiple else [folder]
            except OSError: warnings.append(f'{origin}: {category} evidence unreadable.');continue
            for path in paths:
                if not path.is_file() or path.is_symlink():continue
                count+=1
                if count>MAX_FILES:truncated=True;break
                try:
                    with path.open('rb') as file: raw=file.read(MAX_BYTES+1)
                    if len(raw)>MAX_BYTES:raise ValueError('record too large')
                    data=json.loads(raw)
                    if not isinstance(data,dict) or data.get('schemaVersion')!=1 or type(data.get('schemaVersion')) is not int:raise ValueError('invalid record')
                    at=evidence_time(data);key=data.get('id') or data.get('project') or origin
                    if not isinstance(key,str) or not isinstance(data.get('status'),str) or (data.get('planId') is not None and not isinstance(data['planId'],str)):raise ValueError('invalid identity/status')
                    clean=sanitize(data,secrets)
                    clean.update({'id':clean.get('id') or text(key+':'+category,secrets),'origin':origin,'at':at})
                    if category=='executions':
                        code=data.get('postVerificationExitCode')
                        clean['postVerify']='passed' if code==0 and not data.get('postVerificationBufferExceeded') else 'failed' if code is not None else 'skipped' if data.get('status')=='post_verify_skipped' else 'missing'
                    previous=records[category].get(key)
                    # Highest evidence timestamp wins across vaults; configured first directory wins ties.
                    if previous is None or (at or 0)>(previous['at'] or 0): records[category][key]=clean
                except (OSError, ValueError, TypeError, RecursionError):
                    warnings.append(f'{origin}: unreadable or invalid {category} record (record {count}).')
            if truncated:break
        if truncated:break
    return records,coverage,warnings[:50],truncated


def controls(store, registry, directories=(), at=None):
    at=time.time() if at is None else at
    secrets=tuple(v.get('secret') for v in registry.values() if isinstance(v.get('secret'),str))
    loaded,coverage,warnings,truncated=load(list(directories) if isinstance(directories,(list,tuple)) else directories,secrets)
    rows=[];callouts=[]

    def callout(ident,record,message,status):
        callouts.append({'controlId':ident,'recordId':record,'status':status,'message':message})

    def row(ident,title,category,state,last,summary,records):
        rows.append({'id':ident,'title':title,'status':state,'lastEvidence':last,
                     'staleAfterSeconds':THRESHOLDS[category],'summary':summary,
                     'recordCount':len(records),'recordsTruncated':len(records)>MAX_DETAILS,'records':records[:MAX_DETAILS]})
        if state in {'missing','stale'}:
            evidence=next((r for r in records if r.get('controlStatus')==state),records[0] if records else {})
            ref=evidence.get('id',ident);when=evidence.get('at',last)
            age=f'; age {max(0,(at-when)/3600):.1f} hours' if when is not None else '; no timestamp/record'
            callout(ident,ref,f'{title}: {state} evidence (record {ref}{age}; freshness threshold {THRESHOLDS[category]//3600} hours).',state)

    for category in FILES:
        records=sorted(loaded[category].values(),key=lambda r:r['at'] or 0,reverse=True)
        current={}
        for r in records:
            # A successful retry supersedes an earlier failed attempt for the same plan, not the whole target.
            identity=(r.get('planId') or r['id']) if category in {'dryRuns','executions'} else r['id']
            current.setdefault(identity,r)
        for r in records:
            status=r.get('status')
            if category=='plans':
                decided=loaded['approvals'].get(r.get('approvalRef'),{}).get('status')
                if decided in {'rejected','expired'}:status=r['status']='retired';r['approvalStatus']=decided
            if category=='executions' and status=='passed' and (r.get('liveExitCode')!=0 or r.get('liveBufferExceeded') or r.get('postVerify')!='passed'):
                status='failed' if (r.get('liveExitCode') is not None and r.get('liveExitCode')!=0) or r.get('liveBufferExceeded') else 'post_verify_failed' if r.get('postVerify')=='failed' else 'empty'
            if category=='dryRuns' and status=='passed' and r.get('exitCode')!=0:status='failed' if r.get('exitCode') is not None else 'empty'
            r['controlStatus']=grade(status,r['at'],THRESHOLDS[category],at)
            if status in FAIL and r['controlStatus']!='closed':
                historical=current.get(r.get('planId') or r['id']) is not r if category in {'dryRuns','executions'} else False
                extra=f"; later record {current[r.get('planId') or r['id']]['id']} reports {current[r.get('planId') or r['id']].get('status')}" if historical else ''
                context=''
                if category=='executions':context=f"; live exit {r.get('liveExitCode', 'unreported')}; post-verification {r.get('postVerify', 'missing')}"
                if category in {'audit','readiness','cutover'}:
                    checks=r.get('checks',r.get('targets',[]))
                    blocked=sum(c.get('status')=='blocked' for c in checks if isinstance(c,dict))
                    blockers=sum(len(c.get('blockers',[])) for c in checks if isinstance(c,dict) and isinstance(c.get('blockers',[]),list))
                    context=f'; {blocked} shown blocked checks/targets; {blockers} shown blockers'
                callout(category,r['id'],f"{TITLES[category]}: record {r['id']} reports {status}{context}{extra}.",r['controlStatus'])
        grades=[r['controlStatus'] for r in current.values() if r['controlStatus']!='closed']
        status=next((s for s in ['fail','missing','stale'] if s in grades),'pass') if grades else 'pass' if current else 'missing'
        counts=Counter(r.get('status','unreported') for r in records)
        summary='; '.join(f'{number} {state}' for state,number in sorted(counts.items())) or 'No configured evidence records'
        if category in {'dryRuns','executions'} and records:summary+=f'; {len(current)} latest plan results'
        for state,number in Counter(grades).items():
            if state in {'stale','missing'}:summary+=f'; {number} {state} current records'
        row(category,TITLES[category],category,status,records[0]['at'] if records else None,summary,records)

    with store.connect() as db:
        db.execute('BEGIN')  # One consistent read snapshot for all database controls.
        events={r['source']:dict(r) for r in db.execute("SELECT source,count(*) AS events,max(received) AS last,group_concat(DISTINCT json_extract(envelope,'$.agent.product')) AS products FROM events GROUP BY source")}
        tables={r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        # Metadata evidence of a scoped hosted provider source; controlled reports never establish onboarding.
        hosted={r['source'] for r in db.execute("SELECT DISTINCT source FROM events WHERE json_extract(envelope,'$.location.kind')='cloud' AND lower(json_extract(envelope,'$.agent.product')) LIKE '%grok%' AND lower(source) NOT LIKE '%test%' AND lower(source) NOT LIKE '%controlled%' AND lower(json_extract(envelope,'$.runId')) NOT LIKE '%test%' AND lower(json_extract(envelope,'$.runId')) NOT LIKE '%controlled%' AND lower(json_extract(envelope,'$.taskId')) NOT LIKE '%test%' AND lower(json_extract(envelope,'$.taskId')) NOT LIKE '%controlled%' AND lower(json_extract(envelope,'$.label')) NOT LIKE '%controlled%' ")}
        for ident,registration in registry.items():
            safe_id=text(ident,secrets);name=text(source_name(ident,registration),secrets)
            e=events.get(ident,{});last=e.get('last');revoked=bool(registration.get('revoked'))
            if registration.get('correlationHost') and not registration.get('displayName'):
                prefix='Collector' if registration.get('provenance')=='read-only local snapshot' else product(e.get('products') or ident)
                name=text(prefix+' on '+source_name(ident,registration),secrets)
            provider='grok' in ident.lower()
            state='revoked' if revoked else 'provider-pending' if provider and ident not in hosted else 'never-connected' if last is None else 'registered'
            status='fail' if revoked else 'missing' if state in {'provider-pending','never-connected'} else grade('success',last,THRESHOLDS['sources'],at)
            ref='source:'+safe_id if safe_id!=REDACTED else 'source:registered-'+hashlib.sha256(ident.encode()).hexdigest()[:12]
            detail={'id':ref,'name':name,'registered':True,'revoked':revoked,'state':state,
                    'lastAccepted':last,'connectionState':'never-connected' if last is None else 'has-accepted-events','acceptedEvents':e.get('events',0),
                    'hostedEventObserved':ident in hosted if provider else None,
                    'providerState':('hosted-event-observed' if ident in hosted else 'provider-pending') if provider else None}
            row(ref,f'Source · {name}','sources',status,last,f"{state}; "+(detail['providerState']+'; ' if provider else '')+f"{e.get('events',0)} accepted events",[detail])
            if status in {'fail','missing'}:callout(ref,ref,f'Source {name}: {state}; '+(detail['providerState']+'; ' if provider else '')+f'{e.get("events",0)} accepted events (record {ref}).',status)
        if not registry:row('sources','Source registrations','sources','missing',None,'No registered sources',[])

        kinds=[{'kind':text(r['kind'],secrets),'count':r['count'],'last':r['last']} for r in db.execute('SELECT kind,count(*) AS count,max(received) AS last FROM webhooks GROUP BY kind')]
        deliveries=[{'id':text(r['id'],secrets),'kind':text(r['kind'],secrets),'at':r['received'],'processed':bool(r['processed'])} for r in db.execute('SELECT id,kind,received,processed FROM webhooks ORDER BY received DESC LIMIT 100')]
        last=max((k['last'] for k in kinds),default=None);total=sum(k['count'] for k in kinds)
        row('webhooks','GitHub webhook deliveries','webhooks',grade('success',last,THRESHOLDS['webhooks'],at),last,
            f'{total} accepted deliveries; '+', '.join(f"{k['kind']}: {k['count']}" for k in kinds),
            [{'id':'webhook-summary','count':total,'kinds':kinds}]+deliveries)
        health=db.execute("SELECT name,at,status,detail FROM health WHERE name LIKE 'github:%' ORDER BY name LIMIT ?",(MAX_ROWS+1,)).fetchall()
        if len(health)>MAX_ROWS:truncated=True
        for h in health[:MAX_ROWS]:
            repo=text(h['name'][7:],secrets);ref='reconciliation:'+repo
            observed=db.execute('SELECT count(*) FROM observations WHERE repo=?',(h['name'][7:],)).fetchone()[0]
            state=grade(h['status'],h['at'],THRESHOLDS['reconciliation'],at)
            detail={'id':ref,'repo':repo,'at':h['at'],'status':text(h['status'],secrets),'detail':text(h['detail'],secrets),'observations':observed,'historicalRunCount':None}
            row(ref,'Reconciliation · '+repo,'reconciliation',state,h['at'],f"Last run {detail['status']}; {observed} current observations",[detail])
            if state=='fail':callout(ref,ref,f"Reconciliation {repo}: latest health record {ref} reports {detail['status']}.",state)
        if not health:row('reconciliation','GitHub reconciliation','reconciliation','missing',None,'No reconciliation health records',[])
        accepted=db.execute('SELECT count(*),max(received),sum(processed=0) FROM events').fetchone()
        run_count,gaps=db.execute('SELECT count(*),coalesce(sum(gaps),0) FROM runs').fetchone()
        nonce_count=db.execute('SELECT count(*) FROM nonces').fetchone()[0] if 'nonces' in tables else None
        rate_count=db.execute('SELECT coalesce(sum(requests),0) FROM rates').fetchone()[0]
        detail={'id':'sqlite-receipts','acceptedEvents':accepted[0],'runs':run_count,'sequenceGaps':gaps,
                'queueBacklog':accepted[2] or 0,'duplicateReceipts':None,
                'duplicateCoverage':'Retries are deduplicated but counts are not persisted',
                'retainedNonceBindings':nonce_count,'retainedRateRequests':rate_count}
        state=grade('failed' if gaps or accepted[2] else 'success',accepted[1],THRESHOLDS['receipts'],at)
        row('receipts','Run receipts and evidence','receipts',state,accepted[1],
            f'{accepted[0]} accepted events; {run_count} runs; {gaps} recorded sequence gaps; duplicate count unavailable',[detail])
        if gaps:callout('receipts','sqlite-receipts',f'{gaps} sequence gaps across {run_count} projected runs (record sqlite-receipts).',state)
        if accepted[2]:callout('receipts','sqlite-receipts',f'{accepted[2]} accepted events await projection (record sqlite-receipts).',state)
        callout('receipts','sqlite-receipts','Duplicate receipt count is unavailable: retries have no persisted counter (record sqlite-receipts).','missing')
    for item in coverage:
        if item['state']!='read-only':callout('coverage',item['origin'],f"{item['origin']}: {item['state']} configured control directory.",'missing')
    for warning in warnings:callout('coverage','evidence-read',warning,'missing')
    if len(rows)>MAX_ROWS:truncated=True
    return {'schemaVersion':1,'generatedAt':at,'controls':rows[:MAX_ROWS],
            'summary':dict(Counter(r['status'] for r in rows[:MAX_ROWS])),
            'callouts':callouts[:200],'evidenceDirectories':coverage,'warnings':warnings,
            'truncated':truncated,'thresholds':THRESHOLDS,
            'limitations':['Duplicate receipt counts are not persisted.',
                           'Reconciliation health records retain the latest run, not a complete run history.',
                           'Pass describes evidence only; it does not authorize mutation.']}
