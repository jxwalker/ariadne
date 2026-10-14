"""Outbound, explicitly bound adapter. Never ingest harness event bodies.
Operational reports are deliberate structured records, not extracted chat content.
"""
import argparse
import fcntl
import re
import hashlib
import hmac
import json
import os
import pathlib
import stat
import subprocess
import time
import urllib.parse
import urllib.request
import urllib.error
import uuid
from agent_spool import enqueue, flush
from activity_sender import persist

EVENTS = {'SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse',
          'Stop', 'SubagentStop', 'SessionEnd', 'Interrupt', 'SubagentStart',
          'PreCompact', 'PostCompact', 'PostToolUseFailure', 'PermissionRequest', 'Notification'}
FIELDS = {
    'claim': {'leaseSeconds'}, 'renew': {'leaseSeconds'}, 'release': set(),
    'resume': {'branch', 'revision'}, 'receipt': {'assignmentId', 'state'},
    'update': {'patch'}, 'start': set(), 'done': set(), 'handover': {'handover'},
    'retainedEvidence': {'evidence'}, 'review': {'evidence'}, 'evaluate': {'evidence'},
}

def protected_json(path):
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd) as stream:
        info = os.fstat(stream.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_uid != os.geteuid() or info.st_mode & 0o077:
            raise ValueError('protected file required')
        return json.load(stream)


def request(config, command, packet=False):
    """Exact method/route/bytes signed; redirects never forward auth headers."""
    if not config['origin'].startswith('https://'):
        raise ValueError('HTTPS required')
    method = 'GET' if packet else 'POST'
    route = '/api/agent/v1/commands'
    raw = json.dumps(command, sort_keys=True, separators=(',', ':')).encode()
    if packet:
        route = '/api/agent/v1/work/' + urllib.parse.quote(command['target'], safe=':') + '?' + urllib.parse.urlencode({k: command[k] for k in ('repository', 'nativeKind', 'nativeId')})
        raw = b''
    ts, nonce, cap = str(int(time.time())), str(uuid.uuid4()), config['capabilityId']
    signed = (ts+'\n'+nonce+'\n'+cap+'\n'+method+'\n'+route+'\n').encode()+raw
    signature = hmac.new(config['secret'].encode(), signed, hashlib.sha256).hexdigest()
    headers = {'Content-Type': 'application/json', 'X-Ariadne-Capability': cap,
               'X-Ariadne-Timestamp': ts, 'X-Ariadne-Nonce': nonce, 'X-Ariadne-Signature': signature}
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *args, **kwargs): return None
    opener = urllib.request.build_opener(NoRedirect())
    req = urllib.request.Request(config['origin'].rstrip('/')+route, data=None if packet else raw, headers=headers, method=method)
    try:
        response = opener.open(req, timeout=5)
    except urllib.error.HTTPError as error:
        if error.code not in (400, 403, 409):
            error.close()
            raise
        response = error
    with response:
        body = response.read(65537)
        if len(body) > 65536: raise ValueError('response too large')
        result=json.loads(body)
        if not isinstance(result,dict) or type(result.get('ok')) is not bool:
            if response.code==400:return {'ok':False,'error':'transport validation rejected','transportStatus':400,'localOnly':True}
            raise ValueError('authoritative receipt unavailable')
        return result


class Adapter:
    def __init__(self, config, transport=request):
        self.config, self.transport = config, transport
        binding = config.get('binding', {})
        if set(binding) != {'target', 'repository', 'nativeKind', 'nativeId'} or not all(isinstance(v, str) and v for v in binding.values()):
            raise ValueError('explicit binding required')
        if config.get('credentialKind') != 'agent-command':
            raise ValueError('command capability required; observation credentials denied')
        self.binding = binding
        self.directory = pathlib.Path(config['spool'])
        self.directory.mkdir(parents=True, exist_ok=True, mode=0o700)
        metadata=self.directory.lstat()
        if not stat.S_ISDIR(metadata.st_mode) or metadata.st_uid!=os.geteuid() or metadata.st_mode & 0o077:
            raise ValueError('private spool directory required')
        identity={'binding':binding,'capabilityId':config['capabilityId'],'harness':config.get('harness')}
        with open(self.directory/'.enqueue-lock','a') as lock:
            fcntl.flock(lock,fcntl.LOCK_EX)
            marker=self.directory/'.identity'
            if marker.exists():
                if protected_json(marker)!=identity:raise ValueError('spool identity mismatch')
            else:
                if list(self.directory.glob('*.json')):raise ValueError('unidentified pending spool')
                persist(marker,identity)

    def poll(self):
        result = self.transport(self.config, self.binding, packet=True)
        persist(self.directory/'.packet', result)
        return result

    def command(self, op, key, expected_revision, generation, **fields):
        if op not in FIELDS or set(fields)-FIELDS[op]: raise ValueError('operation or fields denied')
        if not isinstance(key, str) or not key or not all(type(v) is int and v >= 0 for v in (expected_revision, generation)):
            raise ValueError('key, expected revision and generation required')
        if op == 'update':
            patch = fields.get('patch')
            if not isinstance(patch, dict) or not patch or set(patch)-{'nextAction', 'blocker'}:
                raise ValueError('operational patch required')
            if any(not isinstance(v, str) or len(v)>500 for v in patch.values()): raise ValueError('bounded operational text required')
        def text(value):return isinstance(value,str) and len(value)<=500
        def revision_value(value):return isinstance(value,str) and re.fullmatch('[a-f0-9]{40}',value)
        if op in {'claim','renew'} and 'leaseSeconds' in fields:
            if type(fields['leaseSeconds']) is not int or not 1<=fields['leaseSeconds']<=3600:raise ValueError('bounded lease required')
        if op=='receipt':
            if not text(fields.get('assignmentId')) or not fields.get('assignmentId') or fields.get('state') not in {'received','acknowledged','started'}:raise ValueError('assignment receipt required')
        if op=='resume':
            if not text(fields.get('branch')) or not fields.get('branch') or not revision_value(fields.get('revision')):raise ValueError('environment references required')
        if op == 'handover':
            hand = fields.get('handover')
            allowed = {'branch', 'revision', 'changedPaths', 'checks', 'evidenceRefs', 'remainingWork', 'blockers', 'nextAction', 'localWork'}
            if not isinstance(hand, dict) or set(hand)!=allowed: raise ValueError('complete handover required')
            if not text(hand['branch']) or not hand['branch'] or not revision_value(hand['revision']) or not text(hand['nextAction']) or len(json.dumps(hand))>16000:raise ValueError('bounded handover required')
            if not all(isinstance(hand[k], list) and all(isinstance(v,str) and len(v)<=500 for v in hand[k]) for k in allowed-{'branch','revision','nextAction'}): raise ValueError('bounded handover references required')
        if op in {'retainedEvidence','review','evaluate'}:
            evidence = fields.get('evidence')
            if not isinstance(evidence, dict) or set(evidence)-{'uri','sha256','summary','kind','candidate','synthetic','status'}: raise ValueError('evidence references required')
            if len(json.dumps(evidence))>4000 or any(not (type(v) is bool if k=='synthetic' else text(v)) for k,v in evidence.items()):raise ValueError('bounded evidence references required')
        payload = {**self.binding, 'op': 'transition' if op in {'done','start'} else op,
                   'idempotencyKey': key, 'expectedRevision': expected_revision, 'generation': generation,
                   'reason': 'deliberate adapter report', **fields}
        if op in {'done','start'}: payload['state']='verification' if op=='done' else 'active'
        secret=self.config.get('secret')
        def contains_secret(value):
            if isinstance(value,str):return secret in value
            if isinstance(value,dict):return any(contains_secret(k) or contains_secret(v) for k,v in value.items())
            if isinstance(value,list):return any(contains_secret(v) for v in value)
            return False
        if isinstance(secret,str) and secret and contains_secret(payload):raise ValueError('credential in payload')
        return enqueue(self.directory, payload)

    def replay(self):
        flush(self.config, lambda config, command: self.transport(config, command))
        rejected = []
        for path in sorted(self.directory.glob('*.json')):
            receipt = path.with_name(path.name+'.receipt')
            try:result=json.loads(receipt.read_text())
            except FileNotFoundError:continue # concurrent successful completion
            if not result.get('ok'):rejected.append(result)
        return rejected # includes current state; never rebase or replace generation

    def archive_rejection(self, key):
        """Explicit reconciliation only; preserve command and rejection before removing."""
        digest=hashlib.sha256(key.encode()).hexdigest()
        with open(self.directory/'.flush-lock','a') as flushing, open(self.directory/'.enqueue-lock','a') as enqueue_lock:
            fcntl.flock(flushing,fcntl.LOCK_EX|fcntl.LOCK_NB)
            fcntl.flock(enqueue_lock,fcntl.LOCK_EX)
            matches=list(self.directory.glob('*-'+digest+'.json'))
            if len(matches)!=1:raise ValueError('rejected key unavailable')
            path=matches[0];receipt=path.with_name(path.name+'.receipt')
            command=protected_json(path);result=protected_json(receipt)
            if command.get('idempotencyKey')!=key or result.get('ok') or 'ok' not in result:raise ValueError('authoritative rejection required')
            archive=self.directory/'.reconciled';archive.mkdir(mode=0o700,exist_ok=True)
            metadata=archive.lstat()
            if not stat.S_ISDIR(metadata.st_mode) or metadata.st_uid!=os.geteuid() or metadata.st_mode & 0o077:raise ValueError('private archive required')
            for original,value in [(path,command),(receipt,result)]:
                saved=archive/original.name
                if saved.exists() and protected_json(saved)!=value:raise ValueError('archive conflict')
                persist(saved,value)
            path.unlink();receipt.unlink()
            fd=os.open(self.directory,os.O_RDONLY)
            try:os.fsync(fd)
            finally:os.close(fd)

    def lifecycle(self, event):
        if event not in EVENTS: raise ValueError('unsupported lifecycle event')
        # Fixed-size local presence, no network, no renewal or substantive progress.
        persist(self.directory/'.lifecycle', {'event': event, 'at': time.time(), 'binding': self.binding})


def main(harness):
    parser=argparse.ArgumentParser(description='Explicitly bound '+harness+' work adapter')
    parser.add_argument('--config', required=True)
    sub=parser.add_subparsers(dest='action', required=True)
    hook=sub.add_parser('hook');hook.add_argument('event', choices=sorted(EVENTS))
    sub.add_parser('poll');sub.add_parser('replay')
    reconcile=sub.add_parser('archive-rejection');reconcile.add_argument('--key',required=True)
    report=sub.add_parser('report');report.add_argument('--record', required=True)
    if harness in {'codex','claude'}:
        sub.add_parser('exec',add_help=False) # child owns all options, including --help
    args,passthrough=parser.parse_known_args()
    if args.action=='exec':
        args.arguments=passthrough[1:] if passthrough[:1]==['--'] else passthrough
    elif passthrough:parser.error('unsupported adapter arguments')
    try:
        config=protected_json(args.config)
        if config.get('harness') != harness: raise ValueError('harness mismatch')
        # Credential is read only for an outbound action, never for hook payloads.
        if args.action not in {'hook','exec','archive-rejection'}: config['secret']=protected_json(config['credentialFile'])['secret']
        adapter=Adapter(config)
        if args.action=='hook': adapter.lifecycle(args.event) # stdin deliberately untouched
        elif args.action=='poll': adapter.poll(); print('Ariadne work packet saved locally')
        elif args.action=='replay':
            rejected=adapter.replay()
            if rejected:
                current=rejected[0].get('current') or {}
                print(json.dumps({'status':'reconciliation_required','current':{k:current.get(k) for k in ('revision','generation','state')}}))
                return 2
            print('Ariadne commands pending transport' if list(adapter.directory.glob('*.json')) else 'Ariadne replay complete')
        elif args.action=='archive-rejection':
            adapter.archive_rejection(args.key);print('Ariadne rejection archived; reconcile explicitly before reporting')
        elif args.action=='report':
            record=protected_json(args.record)
            adapter.command(**record); print('Ariadne command queued')
        elif args.action=='exec':
            try:adapter.lifecycle('SessionStart')
            except Exception:print('Ariadne session-start presence unavailable',file=__import__('sys').stderr)
            try: code=subprocess.call((['codex','exec'] if harness=='codex' else ['claude'])+args.arguments) # inherit streams; never inspect them
            finally:
                try:adapter.lifecycle('SessionEnd')
                except Exception:print('Ariadne session-end presence unavailable',file=__import__('sys').stderr)
            return code if code>=0 else 128-code
        return 0
    except Exception:
        print('Ariadne adapter unavailable; inspect binding/configuration/receipts', file=__import__('sys').stderr)
        return 1
