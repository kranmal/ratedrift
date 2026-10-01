import assert from 'node:assert/strict';
import test from 'node:test';

import { activateLicence, revalidateLicence } from '../src/lib/licence.ts';

const reply = (body: unknown) => async () => ({ json: async () => body });
const offline = async () => {
  throw new Error('offline');
};

const good = {
  activated: true,
  error: null,
  license_key: { status: 'active' },
  instance: { id: 'inst-1' },
  meta: { product_id: 42 },
};

test('a blank key is rejected without a network call', async () => {
  let called = false;
  const r = await activateLicence('  ', {}, async () => {
    called = true;
    return { json: async () => ({}) };
  });
  assert.equal(r.ok, false);
  assert.equal(called, false);
});

test('a good key activates and keeps the instance id', async () => {
  const r = await activateLicence(' KEY-1 ', { productId: 42 }, reply(good));
  assert.deepEqual(r, { ok: true, licence: { key: 'KEY-1', instanceId: 'inst-1' } });
});

test('the request is a form POST carrying the key', async () => {
  let seen: { url: string; method: string; body: string } | undefined;
  await activateLicence('KEY-1', {}, async (url, init) => {
    seen = { url, method: init.method, body: init.body };
    return { json: async () => good };
  });
  assert.equal(seen?.url, 'https://api.lemonsqueezy.com/v1/licenses/activate');
  assert.equal(seen?.method, 'POST');
  assert.match(seen?.body ?? '', /license_key=KEY-1/);
});

test('the API error message is surfaced', async () => {
  const r = await activateLicence('K', {}, reply({ activated: false, error: 'license_key not found.' }));
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.message, 'license_key not found.');
});

test('a key for another product is refused', async () => {
  const r = await activateLicence('K', { productId: 7 }, reply(good));
  assert.equal(!r.ok && r.reason, 'wrong-product');
});

test('a disabled or expired key is refused even if activated is true', async () => {
  const r = await activateLicence('K', {}, reply({ ...good, license_key: { status: 'expired' } }));
  assert.equal(r.ok, false);
});

test('a network failure on activation is reported as such', async () => {
  const r = await activateLicence('K', {}, offline);
  assert.equal(!r.ok && r.reason, 'network');
});

test('revalidation: valid, invalid, and offline never locks out', async () => {
  const stored = { key: 'K', instanceId: 'inst-1' };
  const ok = { valid: true, license_key: { status: 'active' }, meta: { product_id: 42 } };
  assert.equal(await revalidateLicence(stored, { productId: 42 }, reply(ok)), 'valid');
  assert.equal(await revalidateLicence(stored, {}, reply({ ...ok, valid: false })), 'invalid');
  assert.equal(await revalidateLicence(stored, {}, reply({ ...ok, license_key: { status: 'disabled' } })), 'invalid');
  assert.equal(await revalidateLicence(stored, { productId: 7 }, reply(ok)), 'invalid');
  assert.equal(await revalidateLicence(stored, {}, offline), 'unknown');
  assert.equal(await revalidateLicence(stored, {}, reply({ error: 'oops' })), 'unknown');
});
