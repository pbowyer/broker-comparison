import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateArrangement, compareStrategies, isCompatible, tiered } from '../src/fee-engine.js';
import { PROVIDER_BY_ID } from '../src/providers.js';

const assets = (values = {}) => ({ funds: 0, etfs: 0, investmentTrusts: 0, shares: 0, bonds: 0, ...values });
const account = (id, type, values) => ({ id, type, assets: assets(values) });
const person = (id, accounts) => ({ id, name: id, active: true, accounts });
const exampleHousehold = [
  person('alex', [
    account('alex-isa', 'isa', { funds: 400000, etfs: 250000 }),
    account('alex-sipp', 'sipp', { funds: 200000, etfs: 150000, shares: 50000 }),
  ]),
  person('sam', [
    account('sam-isa', 'isa', { funds: 75000, etfs: 75000 }),
    account('sam-sipp', 'sipp', { funds: 150000, etfs: 100000 }),
  ]),
];

test('calculates marginal fee tiers', () => {
  assert.equal(tiered(300000, [[250000, 0.0025], [500000, 0.001], [Infinity, 0]]), 675);
});

test('AJ Bell separates fund tiers and exchange-traded cap', () => {
  const alex = person('alex', [account('isa', 'isa', { funds: 300000, etfs: 100000 })]);
  const result = calculateArrangement({ isa: 'aj-bell' }, [alex]);
  assert.equal(result.fee, 717);
});

test('Hargreaves Lansdown applies its exchange cap per account', () => {
  const alex = person('alex', [
    account('isa', 'isa', { etfs: 100000 }),
    account('sipp', 'sipp', { shares: 100000 }),
  ]);
  const result = calculateArrangement({ isa: 'hargreaves-lansdown', sipp: 'hargreaves-lansdown' }, [alex]);
  assert.equal(result.fee, 300);
});

test('Vanguard aggregates a person’s ISA and SIPP for one cap', () => {
  const alex = person('alex', [
    account('isa', 'isa', { funds: 200000 }),
    account('sipp', 'sipp', { etfs: 200000 }),
  ]);
  const result = calculateArrangement({ isa: 'vanguard', sipp: 'vanguard' }, [alex]);
  assert.equal(result.fee, 375);
});

test('Interactive Investor family pricing covers an eligible second person', () => {
  const alex = person('alex', [account('alex-isa', 'isa', { funds: 250000 })]);
  const sam = person('sam', [account('sam-isa', 'isa', { funds: 75000 })]);
  const result = calculateArrangement({ 'alex-isa': 'interactive-investor', 'sam-isa': 'interactive-investor' }, [alex, sam]);
  assert.equal(result.fee, 179.88);
});

test('Interactive Investor selects Plus above the Core limit', () => {
  const alex = person('alex', [account('alex-isa', 'isa', { funds: 100001 })]);
  const result = calculateArrangement({ 'alex-isa': 'interactive-investor' }, [alex]);

  assert.equal(result.fee, 179.88);
  assert.equal(result.breakdown[0].plan, 'Plus');
});

test('Interactive Investor family pricing leaves holdings above the member limit on separate plans', () => {
  const people = [
    person('p1', [account('a1', 'isa', { funds: 250000 })]),
    person('p2', [account('a2', 'isa', { funds: 150000 })]),
    person('p3', [account('a3', 'isa', { funds: 75000 })]),
  ];
  const result = calculateArrangement({ a1: 'interactive-investor', a2: 'interactive-investor', a3: 'interactive-investor' }, people);
  assert.equal(result.fee, 359.76);
  assert.equal(result.breakdown[0].plan, 'Plus with ii Family');
});

test('asset compatibility excludes unsupported funds', () => {
  assert.equal(isCompatible(PROVIDER_BY_ID.investengine, account('isa', 'isa', { funds: 1000 })), false);
  assert.equal(isCompatible(PROVIDER_BY_ID.investengine, account('isa', 'isa', { etfs: 1000 })), true);
  assert.equal(isCompatible(PROVIDER_BY_ID.investengine, account('sipp', 'sipp', { etfs: 1000 })), true);
});

test('returns all three strategies for a household', () => {
  const result = compareStrategies(exampleHousehold);
  assert.equal(result.strategies.length, 3);
  assert.ok(result.strategies.every((strategy) => strategy.result && Number.isFinite(strategy.result.fee)));
});

test('keeps every provider arrangement tied for the lowest fee', () => {
  const result = compareStrategies([
    person('alex', [account('alex-isa', 'isa', { funds: 100000 })]),
  ]);
  for (const strategy of result.strategies) {
    const providerIds = strategy.result.alternatives.map((alternative) => alternative.assignments['alex-isa']);
    assert.ok(strategy.result.alternatives.length > 1);
    assert.ok(strategy.result.alternatives.every((alternative) => alternative.fee === strategy.result.fee));
    assert.ok(providerIds.includes('barclays-direct'));
    assert.equal(new Set(providerIds).size, providerIds.length);
  }
});

test('limits comparisons to selected Monevator tables', () => {
  const result = compareStrategies(
    [person('alex', [account('alex-isa', 'isa', { funds: 100000 })])],
    { tables: ['percentage'], includeZeroFee: true },
  );
  assert.ok(result.rankings.length > 0);
  assert.ok(result.rankings.every((ranking) => ranking.breakdown.every((item) => item.provider.table === 'percentage')));
});

test('can exclude explicit zero-fee providers without excluding paid flat-fee providers', () => {
  const result = compareStrategies(
    [person('alex', [account('alex-isa', 'isa', { funds: 100000 })])],
    { tables: ['flat', 'percentage', 'trading'], includeZeroFee: false },
  );
  assert.ok(result.rankings.every((ranking) => ranking.breakdown.every((item) => item.provider.model !== 'zero')));
  assert.ok(result.rankings.some((ranking) => ranking.breakdown.some((item) => item.provider.id === 'interactive-investor')));
});

test('returns unavailable strategies when every provider table is disabled', () => {
  const result = compareStrategies(
    [person('alex', [account('alex-isa', 'isa', { funds: 100000 })])],
    { tables: [], includeZeroFee: false },
  );
  assert.equal(result.rankings.length, 0);
  assert.ok(result.strategies.every((strategy) => strategy.result === null));
});
