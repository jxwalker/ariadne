import copy
import json
import threading
import time
import unittest
import uuid
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
                if any(n['id'] == command['target'] for n in self.nodes):
                    return {'ok': False, 'error': 'identity already exists'}
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
        self.assertEqual(len(self.nodes), 2)

    def test_expired_session_does_not_record(self):
        token = self.headers['X-Ariadne-CSRF']
        self.actions.sessions[token] = ('operator@example', time.time() - 1)
        with self.assertRaises(PermissionError): self.actions.answer(self.headers, '127.0.0.1', self.body)
        self.assertEqual(self.nodes, [])

    def test_credentials_do_not_enter_reply_transport(self):
        with self.assertRaises(ValueError):
            self.actions.answer(self.headers, '127.0.0.1', {**self.body, 'resolution': 'Use Bearer confidential-value'})
        self.assertEqual(self.nodes, [])
