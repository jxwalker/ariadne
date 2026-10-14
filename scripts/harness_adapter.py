"""Outbound, explicitly bound adapter. Never ingest harness event bodies.
Operational reports are deliberate structured records, not extracted chat content.
"""
import argparse
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
        route = '/api/agent/v1/work/' + urllib.parse.quote(command['target'], safe='') + '?' + urllib.parse.urlencode({k: command[k] for k in ('repository', 'nativeKind', 'nativeId')})
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
        if error.code not in (400, 401, 403, 409):
            error.close()
            raise
        response = error
    with response:
        body = response.read(65537)
        if len(body) > 65536: raise ValueError('response too large')
        return json.loads(body)


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
        if op == 'handover':
            hand = fields.get('handover')
            allowed = {'branch', 'revision', 'changedPaths', 'checks', 'evidenceRefs', 'remainingWork', 'blockers', 'nextAction', 'localWork'}
            if not isinstance(hand, dict) or set(hand)!=allowed: raise ValueError('complete handover required')
            if not all(isinstance(hand[k], list) and all(isinstance(v,str) and len(v)<=500 for v in hand[k]) for k in allowed-{'branch','revision','nextAction'}): raise ValueError('bounded handover references required')
        if op in {'retainedEvidence','review','evaluate'}:
            evidence = fields.get('evidence')
            if not isinstance(evidence, dict) or set(evidence)-{'uri','sha256','summary','kind','candidate','synthetic','status'}: raise ValueError('evidence references required')
        payload = {**self.binding, 'op': 'transition' if op in {'done','start'} else op,
                   'idempotencyKey': key, 'expectedRevision': expected_revision, 'generation': generation,
                   'reason': 'deliberate adapter report', **fields}
        if op in {'done','start'}: payload['state']='verification' if op=='done' else 'active'
        if self.config.get('secret') and self.config['secret'] in json.dumps(payload): raise ValueError('credential in payload')
        return enqueue(self.directory, payload)

    def replay(self):
        flush(self.config, lambda config, command: self.transport(config, command))
        rejected = []
        for path in sorted(self.directory.glob('*.json')):
            receipt = path.with_name(path.name+'.receipt')
            if receipt.exists(): rejected.append(json.loads(receipt.read_text()))
        return rejected # includes current state; never rebase or replace generation

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
    report=sub.add_parser('report');report.add_argument('--record', required=True)
    if harness in {'codex','claude'}:
        wrap=sub.add_parser('exec');wrap.add_argument('arguments', nargs=argparse.REMAINDER)
    args=parser.parse_args()
    try:
        config=protected_json(args.config)
        if config.get('harness') != harness: raise ValueError('harness mismatch')
        # Credential is read only for an outbound action, never for hook payloads.
        if args.action!='hook' and args.action!='exec': config['secret']=protected_json(config['credentialFile'])['secret']
        adapter=Adapter(config)
        if args.action=='hook': adapter.lifecycle(args.event) # stdin deliberately untouched
        elif args.action=='poll': adapter.poll(); print('Ariadne work packet saved locally')
        elif args.action=='replay': print('Ariadne reconciliation required' if adapter.replay() else 'Ariadne replay complete or offline; inspect local receipts')
        elif args.action=='report':
            record=protected_json(args.record)
            adapter.command(**record); print('Ariadne command queued')
        elif args.action=='exec':
            adapter.lifecycle('SessionStart')
            try: code=subprocess.call((['codex','exec'] if harness=='codex' else ['claude'])+args.arguments) # inherit streams; never inspect them
            finally: adapter.lifecycle('SessionEnd')
            return code
        return 0
    except Exception:
        print('Ariadne adapter unavailable; inspect binding/configuration/receipts', file=__import__('sys').stderr)
        return 1
