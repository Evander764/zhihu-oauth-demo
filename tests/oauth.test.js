import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizationUrl, configuration, cookieValue, escapeHtml, oauthCode, tokenFrom } from '../lib/oauth.js';

test('configuration exposes readiness without secret values', () => {
  const result = configuration({
    ZHIHU_OAUTH_APP_ID: '12345',
    ZHIHU_OAUTH_APP_KEY: 'secret-app-key',
    ZHIHU_ACCESS_SECRET: 'secret-access',
    ZHIHU_OAUTH_REDIRECT_URI: 'https://demo.example.com/api/oauth-callback',
    ZHIHU_OAUTH_CALLBACK_REGISTERED: 'true',
  });
  assert.equal(result.ready, true);
  assert.deepEqual(result.checks, { appId: true, appKey: true, accessSecret: true, redirectUri: true });
});

test('a supplied local example is not a valid registered callback', () => {
  for (const uri of ['http://127.0.0.1', 'https://127.0.0.1/auth/callback', 'https://10.0.0.1/auth/callback', 'https://localhost/auth/callback']) {
    assert.equal(configuration({ ZHIHU_OAUTH_REDIRECT_URI: uri }).checks.redirectUri, false);
  }
});

test('configured credentials do not imply a registered public callback', () => {
  const result = configuration({ ZHIHU_OAUTH_APP_ID: '661', ZHIHU_OAUTH_APP_KEY: 'fixture-key',
    ZHIHU_ACCESS_SECRET: 'fixture-access', ZHIHU_OAUTH_REDIRECT_URI: 'https://demo.example.com/auth/callback' });
  assert.equal(result.configured, true);
  assert.equal(result.callbackRegistered, false);
  assert.equal(result.ready, false);
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
