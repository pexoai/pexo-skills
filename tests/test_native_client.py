"""Exercise the installed shell client against HTTP fixtures, without cloud credentials."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
CLIENT = ROOT / 'skills/pexo-agent/scripts'
AT = '2026-11-16T00:00:00Z'
EXECUTION = {'executionId': 'execution', 'projectId': 'project', 'status': 'completed'}


def message(text, role='assistant', **extra):
    return {'kind': 'message', 'status': 'completed', 'executionId': 'execution',
            'payload': {'role': role, 'message': {'content': [{'type': 'text', 'text': text}], **extra}}}


def tool(name, data, assets=(), **extra):
    return {'kind': 'tool', 'status': 'completed', 'executionId': 'execution',
            'payload': {'call': {'name': name}, 'result': {
                'structuredContent': data, 'content': [
                    {'type': 'resource_link', 'uri': 'asset://' + asset} for asset in assets], **extra}}}


class ClientTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.dir = Path(self.tmp.name)
        self.fixture = self.dir / 'responses.json'
        self.requests = self.dir / 'requests.jsonl'
        self.routes = {}
        curl = self.dir / 'curl'
        curl.write_text('''#!/usr/bin/env python3
import sys, os, json
from pathlib import Path
from urllib.parse import urlsplit
args=sys.argv[1:]
def value(flag, default=None): return args[args.index(flag)+1] if flag in args else default
url=urlsplit(args[-1]); path=url.path+('?' + url.query if url.query else '')
method=value('-X','GET'); body=value('-d')
with open(os.environ['TEST_REQUESTS'],'a') as f:
 f.write(json.dumps({'method':method,'path':path,'body':json.loads(body) if body else None})+'\\n')
routes=json.loads(Path(os.environ['TEST_RESPONSES']).read_text())
response=routes.get(method+' '+path, {'status':404,'body':{'error':'unexpected fixture request '+path}})
body=json.dumps(response.get('body',{}))
if value('-o'): Path(value('-o')).write_text(body)
else: print(body)
if value('-w'): print(response.get('status',200),end='')
sys.exit(response.get('exit',0))
''')
        curl.chmod(0o755)
        self.env = {**os.environ, 'PATH': str(self.dir) + os.pathsep + os.environ['PATH'],
                    'PEXO_CONFIG': '/dev/null', 'PEXO_BASE_URL': 'https://test2.pexo.ai',
                    'PEXO_API_KEY': 'sk-fixture-only', 'TEST_RESPONSES': str(self.fixture),
                    'TEST_REQUESTS': str(self.requests)}

    def response(self, path, body, method='GET', status=200, **extra):
        self.routes[method + ' ' + path] = {'status': status, 'body': body, **extra}

    def state(self, items, status='completed', **extra):
        self.response('/api/biz/projects/project', {'code': 200, 'data': {'projectId': 'project', 'executionStatus': 'WRONG_LEGACY_STATUS'}})
        self.response('/api/chat?projectId=project', {'revision': 1, 'items': items,
                      'execution': {**EXECUTION, 'status': status}, **extra})

    def run_client(self, command, *args, ok=True):
        self.fixture.write_text(json.dumps(self.routes))
        result = subprocess.run(['bash', str(CLIENT / command), *args], env=self.env, text=True, capture_output=True)
        if ok:
            self.assertEqual(result.returncode, 0, result.stderr)
            return json.loads(result.stdout)
        self.assertNotEqual(result.returncode, 0)
        return result

    def calls(self):
        return [json.loads(line) for line in self.requests.read_text().splitlines()] if self.requests.exists() else []

    def test_native_admission_preserves_words_assets_choice_and_identity(self):
        self.response('/api/chat', EXECUTION, 'POST', 202)
        text = 'Use <original-image>a_reference</original-image> exactly as uploaded.'
        result = self.run_client('pexo-chat.sh', 'project', text, '--choice', 'a_chosen', '--request-id', 'retry-me')
        self.assertEqual(result['executionId'], 'execution')
        body = self.calls()[0]['body']
        self.assertEqual(body['requestId'], 'retry-me')
        self.assertEqual(body['message']['messageId'], 'retry-me')
        self.assertEqual(body['message']['content'], [
            {'type': 'text', 'text': text}, {'type': 'asset', 'assetId': 'a_chosen'},
            {'type': 'asset', 'assetId': 'a_reference'}])
        self.assertEqual(body['message']['billingPolicy'], 'always')
        self.assertNotIn('native_inputs', body)

    def test_uncertain_admission_exposes_identity_without_automatic_retry(self):
        self.response('/api/chat', {}, 'POST', 200, exit=18)
        result = self.run_client('pexo-chat.sh', 'project', 'hello', '--request-id', 'retry-me', ok=False)
        self.assertIn('retry-me', result.stderr)
        self.assertEqual(len(self.calls()), 1)

    def test_old_server_and_http_failures_are_not_success(self):
        for status, body in [(400, {'error': 'Invalid Agent request'}), (200, {'old': 'shape'})]:
            self.response('/api/chat', body, 'POST', status)
            self.run_client('pexo-chat.sh', 'project', 'hello', ok=False)

    def test_completed_text_is_respond_not_forever_wait(self):
        self.state([message('Hello')])
        result = self.run_client('pexo-project-get.sh', 'project')
        self.assertEqual(result['nextAction'], 'RESPOND')
        self.assertEqual(result['recentMessages'][0]['text'], 'Hello')
        self.assertNotIn('executionStatus', result)

    def test_generated_files_stay_internal_until_explicitly_shown(self):
        self.state([tool('mcp__media-orchestrator__get_job', {'status': 'succeeded'}, ['internal']),
                    tool('show_files', {'type': 'attachments'}, ['image', 'audio']),
                    tool('show_files', {'type': 'attachments', 'mode': 'select'}, ['z', 'a', 'z'])])
        result = self.run_client('pexo-project-get.sh', 'project')
        self.assertEqual([m['event'] for m in result['recentMessages']], ['attachment', 'choices'])
        self.assertNotIn('internal', json.dumps(result))
        self.assertEqual(result['recentMessages'][1]['assetIds'], ['z', 'a'])

    def test_failed_display_and_non_deliverable_publication_do_not_deliver(self):
        self.state([tool('show_files', {'type': 'attachments'}, ['bad'], isError=True),
                    tool('publish_file', {'assetId': 'intermediate', 'mediaType': 'video', 'purpose': 'asset'})])
        result = self.run_client('pexo-project-get.sh', 'project')
        self.assertEqual(result['nextAction'], 'RESPOND')
        self.assertEqual(result['recentMessages'], [])

    def test_final_video_delivery(self):
        self.state([tool('publish_file', {'assetId': 'film', 'mediaType': 'video', 'purpose': 'deliverable'})])
        result = self.run_client('pexo-project-get.sh', 'project')
        self.assertEqual(result['nextAction'], 'DELIVER')
        self.assertEqual(result['recentMessages'][0]['assetId'], 'film')

    def test_cursor_pagination_preserves_the_user_turn_across_continuations(self):
        self.state([message('finished')], nextBefore=42)
        self.response('/api/chat?projectId=project&before=42', {
            'items': [message('start', 'user'), message('approved', 'user', purpose='media_confirmation')],
            'nextHistoryCursor': 'still-older'})
        result = self.run_client('pexo-project-get.sh', 'project')
        self.assertEqual([m['text'] for m in result['recentMessages']], ['start', 'finished'])
        self.assertEqual(len(self.calls()), 3)

    def test_full_history_reads_all_native_pages(self):
        self.state([message('new', 'user')], nextHistoryCursor='older')
        self.response('/api/chat?projectId=project&historyCursor=older', {'items': [message('old')]})
        result = self.run_client('pexo-project-get.sh', 'project', '--full-history')
        self.assertEqual([m['text'] for m in result['recentMessages']], ['old', 'new'])

    def test_history_crosses_native_and_legacy_page_boundary(self):
        self.state([message('new', 'user')], nextBefore=20)
        self.response('/api/chat?projectId=project&before=20', {
            'items': [message('old')], 'historicalMessages': [{'messageId': 'legacy-new'}],
            'nextHistoryCursor': 'older/1'})
        self.response('/api/chat?projectId=project&historyCursor=older%2F1', {
            'items': [], 'historicalMessages': [{'messageId': 'legacy-old'}]})
        result = self.run_client('pexo-project-get.sh', 'project', '--full-history')
        self.assertEqual([m['text'] for m in result['recentMessages']], ['old', 'new'])
        self.assertEqual([m['messageId'] for m in result['historicalMessages']], ['legacy-old', 'legacy-new'])

    def test_approval_requires_explicit_flag_before_network(self):
        self.run_client('pexo-billing-confirm.sh', 'project', 'execution', 'quote', ok=False)
        self.assertEqual(self.calls(), [])

    def test_failure_never_requests_automatic_reconnect(self):
        self.state([], status='recovery_required')
        result = self.run_client('pexo-project-get.sh', 'project')
        self.assertEqual(result['nextAction'], 'FAILED')
        self.assertFalse(any(c['method'] == 'POST' for c in self.calls()))

    def quote(self, **extra):
        return {'executionId': 'execution', 'status': 'pending', 'quoteId': 'quote',
                'estimatedCredits': 10, 'availableCredits': 20, 'sufficient': True, **extra}

    def test_pending_media_returns_exact_quote_without_approving(self):
        self.state([tool('mcp__media-orchestrator__video_generate', {'status': 'awaiting_confirmation'})])
        self.response('/api/biz/projects/project/executions/execution/media-confirmation', {'data': self.quote(), 'code': 200})
        result = self.run_client('pexo-project-get.sh', 'project')
        self.assertEqual(result['nextAction'], 'CONFIRM')
        self.assertEqual(result['confirmation']['quoteId'], 'quote')
        self.assertFalse(any(c['method'] == 'POST' for c in self.calls()))

    def test_confirmation_permission_failure_is_not_hidden(self):
        self.state([tool('mcp__media-orchestrator__video_generate', {'status': 'awaiting_confirmation'})])
        self.response('/api/biz/projects/project/executions/execution/media-confirmation', {'error': 'INVALID_TOKEN'}, status=401)
        result = self.run_client('pexo-project-get.sh', 'project', ok=False)
        self.assertIn('401', result.stderr)

    def test_only_exact_affordable_pending_quote_can_be_approved(self):
        path = '/api/biz/projects/project/executions/execution/media-confirmation'
        for quote in [self.quote(quoteId='changed'), self.quote(status='approved'), self.quote(sufficient=False)]:
            self.response(path, quote)
            self.run_client('pexo-billing-confirm.sh', 'project', 'execution', 'quote', '--user-approved', ok=False)
        self.assertFalse(any(c['method'] == 'POST' for c in self.calls()))
        self.response(path, self.quote())
        self.response(path, self.quote(status='approved'), 'POST')
        self.run_client('pexo-billing-confirm.sh', 'project', 'execution', 'quote', '--user-approved')
        self.assertEqual(self.calls()[-1]['body'], {'quoteId': 'quote', 'approve': True})

    def test_decline_is_possible_when_credits_are_insufficient(self):
        path = '/api/biz/projects/project/executions/execution/media-confirmation'
        self.response(path, self.quote(sufficient=False))
        self.response(path, self.quote(status='declined'), 'POST')
        self.run_client('pexo-billing-confirm.sh', 'project', 'execution', 'quote', '--decline')
        self.assertEqual(self.calls()[-1]['body'], {'quoteId': 'quote', 'approve': False})

    def test_untrusted_api_origin_is_rejected_before_http(self):
        self.env['PEXO_BASE_URL'] = 'https://example.com'
        self.run_client('pexo-chat.sh', 'project', 'hello', ok=False)
        self.assertEqual(self.calls(), [])


if __name__ == '__main__':
    unittest.main()
