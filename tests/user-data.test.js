import test from 'node:test';
import assert from 'node:assert/strict';
import { readUserData } from '../lib/user-data.js';
const headers = { Authorization: 'Bearer fixture-access', 'X-OAuth-Token': 'fixture-user-token' };

test('five interfaces retain the authorized user and request at most one item', async () => {
  const calls = [];
  const results = await readUserData(headers, async (url, options) => {
    const parsed = new URL(url); calls.push(parsed);
    assert.equal(parsed.searchParams.get('Limit'), '1');
    assert.equal(options.headers['X-OAuth-Token'], 'fixture-user-token');
    if (parsed.pathname.endsWith('/favlist_contents')) assert.equal(parsed.searchParams.get('FavlistUrlToken'), '42');
    return { Code: 0, Data: { Items: [{ UrlToken: 42, Title: 'fixture' }] } };
  });
  assert.equal(calls.length, 5);
  assert.ok(results.every(item => item.status === 'success'));
});

test('missing authorization never falls back to the developer identity', async () => {
  let called = false;
  await assert.rejects(() => readUserData({ Authorization: 'Bearer fixture' }, async () => { called = true; }));
  assert.equal(called, false);
});

test('empty favorites skip the dependent request without pretending failure', async () => {
  let calls = 0;
  const results = await readUserData(headers, async () => { calls++; return { Code: 0, Data: { Items: [] } }; });
  assert.equal(calls, 4);
  assert.ok(results.every(item => item.status === 'empty'));
});

test('failed favorites and malformed data remain errors, not empty data', async () => {
  const results = await readUserData(headers, async () => ({ Code: 20001, Data: {} }));
  assert.ok(results.every(item => item.status === 'error'));
  const malformed = await readUserData(headers, async () => ({ Code: 0, Data: {} }));
  assert.ok(malformed.every(item => item.status === 'error'));
});
