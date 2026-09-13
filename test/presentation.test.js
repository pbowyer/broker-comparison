import test from 'node:test';
import assert from 'node:assert/strict';
import { comparisonPresentation, restrictionProviders } from '../src/presentation.js';
import { PROVIDER_BY_ID } from '../src/providers.js';

const account = (id, value) => ({ id, type: 'isa', assets: { funds: value, etfs: 0, investmentTrusts: 0, shares: 0, bonds: 0 } });
const strategy = (id) => ({ id, title: id, description: id, result: { fee: 0 } });
const comparison = { strategies: ['household', 'person', 'flexible'].map(strategy) };

test('one person with multiple accounts sees two distinct arrangements', () => {
  const view = comparisonPresentation(comparison, [{ id: 'p1', active: true, accounts: [account('a1', 1000), account('a2', 2000)] }]);
  assert.equal(view.title, 'Two ways to arrange these accounts');
  assert.deepEqual(view.strategies.map((item) => item.id), ['person', 'flexible']);
  assert.equal(view.strategies[0].title, 'Keep accounts together');
});

test('one person with one account sees one result', () => {
  const view = comparisonPresentation(comparison, [{ id: 'p1', active: true, accounts: [account('a1', 1000)] }]);
  assert.equal(view.title, 'Lowest platform fee for this account');
  assert.deepEqual(view.strategies.map((item) => item.id), ['person']);
});

test('multiple people retain the three household arrangements', () => {
  const people = [
    { id: 'p1', active: true, accounts: [account('a1', 1000)] },
    { id: 'p2', active: true, accounts: [account('a2', 1000)] },
  ];
  const view = comparisonPresentation(comparison, people);
  assert.deepEqual(view.strategies.map((item) => item.id), ['household', 'person', 'flexible']);
});

test('calculated Interactive Investor limits are not shown as moving warnings', () => {
  const provider = PROVIDER_BY_ID['interactive-investor'];
  const result = { breakdown: [{ provider }] };

  assert.deepEqual(restrictionProviders(result), []);
});
