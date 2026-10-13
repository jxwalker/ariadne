"""Operator responses to signed agent questions, persisted through master.command.

Serve supplies the existing operator identity to the loopback-only private listener.
No observation credential gains ledger-write access. Same-uid host processes remain
inside the existing trusted-host boundary; this does not authenticate human presence.
"""
import hashlib
import hmac
import ipaddress
import json
import secrets
import threading
import time
import uuid
from datetime import datetime, timezone

from master_dashboard import snapshot


def kernel_peer_uid(connection):
    """Authenticate the local TCP peer from Linux kernel ownership, never headers.
    Root-owned Serve/admin processes are the existing trusted proxy boundary.
    Missing provenance fails closed; the deployed backend is IPv4 loopback on Linux.
    """
    import socket,pathlib
    try:
        if connection.family!=socket.AF_INET:return None
        def address(value):
            return socket.inet_aton(value[0])[::-1].hex().upper()+':'+format(value[1],'04X')
        local,remote=address(connection.getpeername()),address(connection.getsockname())
        for line in pathlib.Path('/proc/net/tcp').read_text().splitlines()[1:]:
            fields=line.split()
            if fields[1]==local and fields[2]==remote and fields[3]=='01':return int(fields[7])
    except (OSError,ValueError,IndexError,AttributeError):pass
    return None


def scoped_replies(event):
    from master_dashboard import PSQL
    import os,pathlib,subprocess
    values=','.join("'"+event[k].replace("'","''")+"'" for k in ('sourceId','repository','runId'))
    p=subprocess.run([PSQL,'-XqAt','-v','ON_ERROR_STOP=1','-h',str(pathlib.Path.home()/'.local/state/ariadne-master-pg/socket'),'-p','55432','-U','ariadne_master','-d','ariadne_master'],input='SELECT master.operator_replies('+values+');',text=True,capture_output=True,timeout=5,env={'PATH':os.defpath,'HOME':str(pathlib.Path.home()),'PGPASSFILE':'/dev/null'})
    if p.returncode:raise RuntimeError('Reply ledger unavailable')
    return json.loads(p.stdout)


def resolved_decisions():
    from master_dashboard import PSQL
    import os,pathlib,subprocess
    p=subprocess.run([PSQL,'-XqAt','-v','ON_ERROR_STOP=1','-h',str(pathlib.Path.home()/'.local/state/ariadne-master-pg/socket'),'-p','55432','-U','ariadne_master','-d','ariadne_master'],input='SELECT master.operator_resolved();',text=True,capture_output=True,timeout=5,env={'PATH':os.defpath,'HOME':str(pathlib.Path.home()),'PGPASSFILE':'/dev/null'})
    if p.returncode:raise RuntimeError('Decision ledger unavailable')
    return json.loads(p.stdout)


def decision_id(source, repository, request):
    key = json.dumps([source, repository, request], separators=(',', ':'))
    return 'decision:operator:' + hashlib.sha256(key.encode()).hexdigest()[:48]


def responses(data):
    required = {'sourceId', 'repository', 'runId', 'requestId', 'requestRevision',
                'resolution', 'resolvedBy', 'resolvedAt', 'commandId'}
    return [n for n in data.get('nodes', []) if n.get('kind') == 'decision'
            and n.get('body', {}).get('origin') == 'operator-dashboard'
            and n['body'].get('state') == 'resolved' and required <= n['body'].keys()]


def hide_answered(data, ledger):
    data = dict(data)
    answered = {(n['body']['sourceId'], n['body']['repository'], n['body']['requestId']) for n in responses(ledger)}
    resolved = {n['id'] for n in ledger.get('nodes',[]) if n.get('kind')=='decision' and n.get('body',{}).get('state')=='resolved'}
    resolved_aliases = {(a['source'],a['alias']) for a in ledger.get('aliases',[]) if a['node_id'] in resolved}
    data['needsYou'] = [a for a in data['needsYou'] if
                        (a.get('sourceId'),a.get('repo'),a.get('requestId')) not in answered
                        and (str(a.get('sourceId'))+'/'+str(a.get('repo')),a.get('requestId')) not in resolved_aliases]
    return data


def save_command(command):
    # The SQL function is the canonical command API; never write ledger tables.
    from master_dashboard import PSQL
    import os
    import pathlib
    import subprocess
    payload = json.dumps(command).replace("'", "''")
    process = subprocess.run(
        [PSQL, '-XqAt', '-v', 'ON_ERROR_STOP=1', '-h',
         str(pathlib.Path.home() / '.local/state/ariadne-master-pg/socket'),
         '-p', '55432', '-U', 'ariadne_master', '-d', 'ariadne_master'],
        input="SELECT master.command('james', '%s'::jsonb);" % payload,
        text=True, capture_output=True, timeout=15,
        env={'PATH': os.defpath, 'HOME': str(pathlib.Path.home()), 'PGPASSFILE': '/dev/null'})
    if process.returncode:
        raise RuntimeError('Operator ledger unavailable')
    return json.loads(process.stdout)


class StaleDecision(ValueError):
    pass


class OperatorActions:
    def __init__(self, app, read=snapshot, write=save_command):
        self.app, self.read, self.write = app, read, write
        self.sessions = {}
        self.reply_cache = {}
        self.reply_generation = 0
        self.lock = threading.Lock()

    def identity(self, headers, client):
        config = self.app.config.get('operatorActions', {})
        if self.app.config.get('disableQueries') or self.app.config.get('ingestOnly') or not config.get('enabled'):
            raise PermissionError('Operator actions unavailable')
        if not isinstance(client,dict) or client.get('proxyUid')!=0:
            raise PermissionError('Authenticated local proxy required')
        if not ipaddress.ip_address(client['ip']).is_loopback:
            raise PermissionError('Trusted local proxy required')
        login = headers.get('Tailscale-User-Login', '').strip().lower()
        if not login or login not in {s.lower() for s in config.get('allowedLogins', [])}:
            raise PermissionError('Operator identity required')
        # Serve sets/appends the genuine tailnet peer; never use a caller's first hop.
        try:
            peer = str(ipaddress.ip_address(headers.get('X-Forwarded-For', '').split(',')[-1].strip()))
        except ValueError:
            raise PermissionError('Operator device required') from None
        if peer not in config.get('allowedClientIPs', []):
            raise PermissionError('Operator device required')
        return login

    def session(self, headers, client):
        try:
            login = self.identity(headers, client)
        except PermissionError:
            return {'canRespond': False}
        (resolved_decisions() if self.read is snapshot else self.read())  # Fail closed if the ledger is unavailable.
        token, now = secrets.token_urlsafe(32), time.time()
        with self.lock:
            self.sessions = {k: v for k, v in self.sessions.items() if v[1] > now}
            if len(self.sessions) >= 256:
                self.sessions.pop(next(iter(self.sessions)))
            self.sessions[token] = (login, now + 600)
        return {'canRespond': True, 'csrfToken': token, 'actor': 'James',
                'expiresAt': now + 600, 'effect': 'Record a response; no external fix is executed.'}

    def answer(self, headers, client, body):
        login = self.identity(headers, client)
        config = self.app.config['operatorActions']
        if headers.get('Origin') != config.get('origin') or not config.get('origin'):
            raise PermissionError('Same-origin response required')
        if headers.get('Sec-Fetch-Site', 'same-origin') != 'same-origin':
            raise PermissionError('Same-origin response required')
        token = headers.get('X-Ariadne-CSRF', '')
        with self.lock:
            valid = self.sessions.get(token)
        if not valid or valid[1] <= time.time() or not hmac.compare_digest(valid[0], login):
            raise PermissionError('Refresh your operator session')
        fields = {'sourceId', 'repo', 'requestId', 'requestRevision', 'commandId', 'resolution'}
        if not isinstance(body, dict) or set(body) != fields:
            raise ValueError('A specific question and response are required')
        if not all(isinstance(v, str) for v in body.values()):
            raise ValueError('Invalid response')
        uuid.UUID(body['commandId'])
        reply = body['resolution'].strip()
        if not 1 <= len(reply) <= 300:
            raise ValueError('Response must be 1 to 300 characters')
        from activity_operating import DECISION_CREDENTIAL
        if DECISION_CREDENTIAL.search(reply) or any(s.get('secret') and s['secret'] in reply
                                                  for s in self.app.sources().values()):
            raise ValueError('Credentials must stay outside decision responses')
        ledger = self.read()
        namespace = body['sourceId'] + '/' + body['repo']
        alias = next((a for a in ledger.get('aliases', []) if
                      a['source'] == namespace and a['alias'] == body['requestId']), None)
        target = alias['node_id'] if alias else decision_id(body['sourceId'], body['repo'], body['requestId'])
        node = next((n for n in ledger.get('nodes', []) if n['id'] == target), None)
        if node and node['kind'] != 'decision':
            raise StaleDecision('The question mapping is not a decision. Ask the operator to inspect it.')
        prior = next((n['body'] for n in responses(ledger) if n['id'] == target), None)
        if prior and prior['requestRevision'] == body['requestRevision']:
            if prior.get('commandId') == body['commandId'] and prior['resolution'] == reply:
                return {'recorded': True, 'duplicate': True, 'decisionId': target}
            raise StaleDecision('This question already has an operator response. Refresh to inspect it.')
        if node and node['body'].get('state')=='resolved':
            raise StaleDecision('The master decision is already resolved. A new question needs a new request ID.')
        from activity_operating import operating
        current = operating(self.app.store, self.app.sources(), self.app.config,
                            {'repo': [body['repo']]})['needsYou']
        request = next((a for a in current if a.get('kind') == 'explicit-decision'
                        and a.get('sourceId') == body['sourceId']
                        and a.get('requestId') == body['requestId']), None)
        if not request or request.get('requestRevision') != body['requestRevision']:
            raise StaleDecision('The question changed or was resolved. Refresh before responding.')
        value = {'title': 'Response: ' + request['title'], 'state': 'resolved',
                 'origin': 'operator-dashboard', 'sourceId': body['sourceId'],
                 'repository': body['repo'], 'runId': request['runId'],
                 'requestId': body['requestId'], 'requestRevision': body['requestRevision'],
                 'question': request['reason'], 'options': request.get('options', []),
                 'source': 'Authenticated operator response to '+request.get('source', 'the signed source'),
                 'suggestedResponse': request.get('recommendation'),
                 'suggestedBy': request.get('source'), 'resolution': reply,
                 'resolvedBy': 'James', 'identityProvider': 'tailscale-serve',
                 'identityHash': hashlib.sha256(login.encode()).hexdigest(),
                 'resolvedAt': datetime.now(timezone.utc).isoformat(),
                 'commandId': body['commandId']}
        command = {'commandId': 'operator-' + body['commandId'], 'target': target,
                   'expectedRevision': node['revision'] if node else 0,
                   'reason': 'Authenticated operator response to an exact signed question',
                   'via': 'operator-dashboard/tailscale-serve'}
        if node:
            value['title'] = node['body'].get('title', value['title'])
            command.update(op='resolve', resolution=reply, response=value)
        else:
            command.update(op='create', kind='decision', body=value,
                           aliases=[{'source': namespace, 'alias': body['requestId']}])
        result = self.write(command)
        if not result.get('ok'):
            raise StaleDecision('Response was not recorded: ' + result.get('error', 'conflict'))
        with self.lock:
            self.reply_generation += 1
            self.reply_cache.clear()
        return {'recorded': True, 'duplicate': False, 'decisionId': target,
                'delivery': 'Available to the requesting source on its next signed report.'}

    def replies(self, event):
        if self.read is snapshot:
            key=tuple(event[k] for k in ('sourceId','repository','runId'))
            for attempt in range(3):
                now=time.monotonic()
                with self.lock:
                    cached=self.reply_cache.get(key)
                    if cached and now-cached[0]<2:return cached[1]
                    generation=self.reply_generation
                result=scoped_replies(event)
                with self.lock:
                    if generation!=self.reply_generation:continue
                    self.cache_replies_locked(key,now,result)
                    return result
            # Bound retries under concurrent operator activity. This rare final
            # query serializes cache publication with answer acknowledgement.
            with self.lock:
                now=time.monotonic()
                result=scoped_replies(event)
                self.cache_replies_locked(key,now,result)
                return result
        # Injected readers support isolated contract fixtures; production never snapshots on ingest.
        result = []
        for node in responses(self.read()):
            b = node['body']
            if (b['sourceId'], b['repository'], b['runId']) == (
                    event['sourceId'], event['repository'], event['runId']):
                result.append({k: b[k] for k in ('sourceId', 'repository', 'runId', 'requestId', 'requestRevision', 'resolution',
                                                'resolvedBy', 'resolvedAt', 'commandId')})
        def resolution_order(reply):
            try:
                at=datetime.fromisoformat(reply['resolvedAt'].replace('Z','+00:00'))
                return (at.replace(tzinfo=timezone.utc) if at.tzinfo is None else at, reply['commandId'])
            except (ValueError,TypeError,AttributeError):
                return (datetime.min.replace(tzinfo=timezone.utc),reply['commandId'])
        return sorted(result,key=resolution_order)[-50:]

    def cache_replies_locked(self,key,observed,result):
        """Caller holds self.lock; the write generation has been checked."""
        now=time.monotonic()
        self.reply_cache={k:v for k,v in self.reply_cache.items() if now-v[0]<2}
        if len(self.reply_cache)>=256:self.reply_cache.pop(next(iter(self.reply_cache)))
        self.reply_cache[key]=(observed,result)


_lock = threading.Lock()
def controller(app):
    with _lock:
        if not hasattr(app, '_operator_actions'):
            app._operator_actions = OperatorActions(app)
        return app._operator_actions
