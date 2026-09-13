import test from 'node:test';
import assert from 'node:assert/strict';
import { decryptPortfolio, encryptPortfolio } from '../src/persistence.js';

test('portfolio encryption round-trips without exposing entered values', async () => {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const portfolio = { people: [{ name: 'Private name', accounts: [{ value: 123456 }] }] };
  const payload = await encryptPortfolio(portfolio, key);

  assert.equal(JSON.stringify(payload).includes('Private name'), false);
  assert.equal(JSON.stringify(payload).includes('123456'), false);
  assert.deepEqual(await decryptPortfolio(payload, key), portfolio);
});

test('portfolio encryption rejects altered ciphertext', async () => {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const payload = await encryptPortfolio({ people: [] }, key);
  payload.ciphertext = payload.ciphertext.slice(0, -2) + 'AA';

  await assert.rejects(decryptPortfolio(payload, key));
});
