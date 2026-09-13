import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, normaliseSavedState } from '../src/state.js';

test('a new visitor starts without household data', () => {
  const state = createInitialState();

  assert.deepEqual(state.people, []);
});

test('saved state is reduced to supported portfolio fields', () => {
  const state = normaliseSavedState({
    filters: { tables: ['flat', 'unknown'], includeZeroFee: false },
    people: [{ id: 1, name: 'Alex', active: true, ignored: 'value', accounts: [{ id: 2, type: 'other', assets: { funds: 10, shares: -5 }, ignored: 'value' }] }],
  });

  assert.deepEqual(state.filters, { tables: ['flat'], includeZeroFee: false });
  assert.deepEqual(state.people[0], {
    id: '1',
    name: 'Alex',
    active: true,
    accounts: [{ id: '2', type: 'isa', assets: { funds: 10, etfs: 0, investmentTrusts: 0, shares: 0, bonds: 0 } }],
  });
});
