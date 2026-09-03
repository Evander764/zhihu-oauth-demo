import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizationUrl, configuration, cookieValue, escapeHtml, oauthCode, tokenFrom } from '../lib/oauth.js';

test('configuration exposes readiness without secret values', () => {
  const result = configuration({
    ZHIHU_OAUTH_APP_ID: '12345',
    ZHIHU_OAUTH_APP_KEY: 'secret-app-key',
    ZHIHU_ACCESS_SECRET: 'secret-access',
    ZHIHU_OAUTH_REDIRECT_URI: 'https://demo.example.com/api/oauth-callback',
  });
  assert.equal(result.ready, true);
  assert.deepEqual(result.checks, { appId: true, appKey: true, accessSecret: true, redirectUri: true });
});

test('authorization URL carries the documented fields', () => {
  const url = new URL(authorizationUrl('12345', 'https://demo.example.com/api/oauth-callback', 'nonce'));
  assert.equal(url.origin, 'https://openapi.zhihu.com');
  assert.equal(url.searchParams.get('app_id'), '12345');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('state'), 'nonce');
});

test('callback supports current and compatibility code names', () => {
  assert.equal(oauthCode(new URL('https://demo.example.com/cb?authorization_code=current')), 'current');
  assert.equal(oauthCode(new URL('https://demo.example.com/cb?code=legacy')), 'legacy');
});

test('helpers keep tokens server side and output safe', () => {
  assert.equal(cookieValue('a=1; zhihu_oauth_state=hello%20world', 'zhihu_oauth_state'), 'hello world');
  assert.equal(tokenFrom({ data: { access_token: 'token' } }), 'token');
  assert.equal(escapeHtml('<script>'), '&lt;script&gt;');
});
