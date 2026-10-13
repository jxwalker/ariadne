import copy
import json
import threading
import time
import unittest
import uuid
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace
from unittest.mock import patch

from activity_decisions import OperatorActions, StaleDecision, hide_answered


class OperatorResponses(unittest.TestCase):
    def setUp(self):
        self.app = SimpleNamespace(config={'operatorActions': {'enabled': True,
            'origin': 'https://dashboard.example', 'allowedLogins': ['operator@example'], 'allowedClientIPs': ['100.64.1.10']},
            'githubRepositories': ['jxwalker/ariadne']}, store=object(), sources=lambda: {})
        self.nodes, self.commands, self.lock = [], [], threading.Lock()
        def write(command):
            with self.lock:
                old=next((n for n in self.nodes if n['id']==command['target']),None)
                if old:
                    if command['op']!='resolve' or old['revision']!=command['expectedRevision']:
                        return {'ok': False, 'error': 'revision conflict'}
                    self.commands.append(copy.deepcopy(command));old['body'].update(command['response']);old['revision']+=1
                    return {'ok':True,'revision':old['revision']}
                self.commands.append(copy.deepcopy(command))
                self.nodes.append({'id': command['target'], 'kind': command['kind'],
                                   'revision': 1, 'body': command['body']})
                return {'ok': True, 'revision': 1}
        self.actions = OperatorActions(self.app, read=lambda: {'nodes': copy.deepcopy(self.nodes)}, write=write)
        self.headers = {'Tailscale-User-Login': 'operator@example', 'Origin': 'https://dashboard.example', 'X-Forwarded-For': '100.64.1.10'}
        self.headers['X-Ariadne-CSRF'] = self.actions.session(self.headers, '127.0.0.1')['csrfToken']
        self.question = {'id': 'card', 'kind': 'explicit-decision', 'title': 'Pilot',
            'reason': 'Choose a work boundary', 'repo': 'jxwalker/ariadne', 'sourceId': 'box-ariadne-bot',
            'runId': 'pilot-run', 'requestId': 'DEC-006', 'requestRevision': 'a' * 64,
            'recommendation': 'Operator only', 'source': 'Ariadne Bot', 'options': ['Operator only', 'Add agents']}
        self.body = {'sourceId': self.question['sourceId'], 'repo': self.question['repo'],
            'requestId': 'DEC-006', 'requestRevision': 'a' * 64,
            'commandId': str(uuid.uuid4()), 'resolution': 'Operator only'}
        self.current = patch('activity_operating.operating', side_effect=lambda *a, **kw: {'needsYou': [self.question]})
        self.current.start(); self.addCleanup(self.current.stop)

    def test_authentication_origin_csrf_and_private_listener(self):
        for header, client in [({}, '127.0.0.1'),
                ({**self.headers, 'Tailscale-User-Login': 'agent@example'}, '127.0.0.1'),
                (self.headers, '192.168.1.9'),
                ({**self.headers, 'X-Forwarded-For': '100.64.1.10, 100.64.9.9'}, '127.0.0.1'),
                ({**self.headers, 'Origin': 'https://evil.example'}, '127.0.0.1'),
                ({**self.headers, 'X-Ariadne-CSRF': 'invalid'}, '127.0.0.1'),
                ({**self.headers, 'Sec-Fetch-Site': 'cross-site'}, '127.0.0.1')]:
            with self.assertRaises(PermissionError): self.actions.answer(header, client, self.body)
        self.app.config['ingestOnly'] = True
        self.assertFalse(self.actions.session(self.headers, '127.0.0.1')['canRespond'])
        with self.assertRaises(PermissionError): self.actions.answer(self.headers, '127.0.0.1', self.body)
        self.assertEqual(self.commands, [])

    def test_exact_question_canonical_command_and_duplicate(self):
        result = self.actions.answer(self.headers, '127.0.0.1', self.body)
        self.assertTrue(result['recorded'])
        self.assertEqual((self.commands[0]['op'], self.commands[0]['kind']), ('create', 'decision'))
        self.assertEqual(self.commands[0]['via'], 'operator-dashboard/tailscale-serve')
        self.assertEqual(self.nodes[0]['body']['resolvedBy'], 'James')
        self.assertEqual(self.nodes[0]['body']['requestRevision'], self.body['requestRevision'])
        self.assertTrue(self.actions.answer(self.headers, '127.0.0.1', self.body)['duplicate'])
        self.assertEqual(len(self.commands), 1)
        with self.assertRaises(StaleDecision):
            self.actions.answer(self.headers, '127.0.0.1', {**self.body, 'resolution': 'Changed answer'})

    def test_changed_resolved_or_foreign_question_rejected(self):
        for change in [{'requestRevision': 'b' * 64}, {'requestId': 'other'}, {'sourceId': 'other'}]:
            with self.assertRaises(StaleDecision): self.actions.answer(self.headers, '127.0.0.1', {**self.body, **change})
        with patch('activity_operating.operating', return_value={'needsYou': []}):
            with self.assertRaises(StaleDecision): self.actions.answer(self.headers, '127.0.0.1', self.body)
        self.assertEqual(self.commands, [])

    def test_payload_cannot_request_other_commands(self):
        for change in [{'op': 'approve'}, {'actor': 'james'}, {'resolution': ''}, {'resolution': 'x' * 301}]:
            with self.assertRaises(ValueError): self.actions.answer(self.headers, '127.0.0.1', {**self.body, **change})
        self.assertEqual(self.commands, [])

    def test_competing_responses_cannot_overwrite(self):
        def respond(text):
            try: return self.actions.answer(self.headers, '127.0.0.1', {**self.body, 'commandId': str(uuid.uuid4()), 'resolution': text})
            except StaleDecision: return {'recorded': False}
        with ThreadPoolExecutor(max_workers=2) as pool: results = list(pool.map(respond, ['Operator only', 'Add agents']))
        self.assertEqual(sum(r['recorded'] for r in results), 1)
        self.assertEqual(len(self.nodes), 1)

    def test_reply_scoped_to_original_source_repository_and_run(self):
        self.actions.answer(self.headers, '127.0.0.1', self.body)
        event = {'sourceId': 'box-ariadne-bot', 'repository': 'jxwalker/ariadne', 'runId': 'pilot-run'}
        self.assertEqual(self.actions.replies(event)[0]['resolution'], 'Operator only')
        for key in event:
            self.assertEqual(self.actions.replies({**event, key: 'other'}), [])

    def test_overlay_preserves_cache_and_updated_question(self):
        self.actions.answer(self.headers, '127.0.0.1', self.body)
        data = {'needsYou': [self.question]}
        self.assertEqual(hide_answered(data, {'nodes': self.nodes})['needsYou'], [])
        self.assertEqual(len(data['needsYou']), 1)
        changed = {**self.question, 'requestRevision': 'b' * 64}
        self.assertEqual(hide_answered({'needsYou': [changed]}, {'nodes': self.nodes})['needsYou'], [changed])
        self.question['requestRevision'] = 'b' * 64
        self.actions.answer(self.headers, '127.0.0.1', {**self.body, 'requestRevision': 'b' * 64, 'commandId': str(uuid.uuid4())})
        self.assertEqual(len(self.nodes), 1)
        self.assertEqual(len(self.commands), 2)

    def test_explicit_alias_updates_the_existing_master_decision(self):
        self.nodes.append({'id':'DEC-006','kind':'decision','revision':1,'body':{'title':'Agent credentials','state':'open'}})
        self.actions.read=lambda:{'nodes':copy.deepcopy(self.nodes),'aliases':[{'source':'box-ariadne-bot/jxwalker/ariadne','alias':'DEC-006','node_id':'DEC-006'}]}
        self.actions.answer(self.headers,'127.0.0.1',self.body)
        self.assertEqual(len(self.nodes),1);self.assertEqual(self.commands[0]['op'],'resolve')
        self.assertEqual(self.nodes[0]['body']['state'],'resolved')
        self.assertEqual(self.nodes[0]['body']['title'],'Agent credentials')

    def test_expired_session_does_not_record(self):
        token = self.headers['X-Ariadne-CSRF']
        self.actions.sessions[token] = ('operator@example', time.time() - 1)
        with self.assertRaises(PermissionError): self.actions.answer(self.headers, '127.0.0.1', self.body)
        self.assertEqual(self.nodes, [])

    def test_credentials_do_not_enter_reply_transport(self):
        with self.assertRaises(ValueError):
            self.actions.answer(self.headers, '127.0.0.1', {**self.body, 'resolution': 'Use Bearer confidential-value'})
        self.assertEqual(self.nodes, [])

    def test_http_response_route_and_ingest_only_denial(self):
        from activity_server import Handler, ThreadingHTTPServer
        self.app._operator_actions = self.actions
        server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        server.app = self.app
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        base = 'http://127.0.0.1:' + str(server.server_port)
        try:
            with urllib.request.urlopen(urllib.request.Request(base+'/api/operator-session', headers=self.headers)) as response:
                session = json.load(response)
            headers = {**self.headers, 'X-Ariadne-CSRF': session['csrfToken'], 'Content-Type': 'application/json'}
            request = urllib.request.Request(base+'/api/operator-response', data=json.dumps(self.body).encode(), headers=headers)
            with urllib.request.urlopen(request) as response:
                self.assertTrue(json.load(response)['recorded'])
            bad = urllib.request.Request(base+'/api/operator-response', data=json.dumps(self.body).encode(), headers={'Content-Type':'application/json','X-Ariadne-Source':'box-ariadne-bot'})
            with self.assertRaises(urllib.error.HTTPError) as denied: urllib.request.urlopen(bad)
            self.assertEqual(denied.exception.code, 401)
            denied.exception.close()
            self.app.config['ingestOnly'] = True
            for request in [urllib.request.Request(base+'/api/operator-session'), request]:
                with self.assertRaises(urllib.error.HTTPError) as denied: urllib.request.urlopen(request)
                self.assertEqual(denied.exception.code, 404)
                denied.exception.close()
            self.assertEqual(len(self.commands), 1)
        finally:
            server.shutdown();server.server_close();thread.join()

    def test_reply_cap_uses_resolution_time_and_preserves_latest(self):
        from datetime import datetime,timedelta,timezone
        base=datetime(2026,10,13,tzinfo=timezone.utc)
        self.nodes=[{'id':str(60-i),'kind':'decision','body':{'origin':'operator-dashboard','state':'resolved',
            'sourceId':'box-ariadne-bot','repository':'jxwalker/ariadne','runId':'pilot-run','requestId':str(i),
            'requestRevision':'a'*64,'resolution':'answer','resolvedBy':'James','resolvedAt':(base+timedelta(minutes=i)).isoformat(),
            'commandId':str(i)}} for i in range(61)]
        self.nodes.sort(key=lambda n:n['id'])
        result=self.actions.replies({'sourceId':'box-ariadne-bot','repository':'jxwalker/ariadne','runId':'pilot-run'})
        self.assertEqual([r['requestId'] for r in result],[str(i) for i in range(11,61)])
