import { ASSET_KEYS, EXCHANGE_KEYS, PROVIDERS, PROVIDER_BY_ID } from './providers.js';

export const money = (value, digits = 0) => new Intl.NumberFormat('en-GB', {
  style: 'currency', currency: 'GBP', minimumFractionDigits: digits, maximumFractionDigits: digits,
}).format(value || 0);

export const accountValue = (account) => ASSET_KEYS.reduce((sum, key) => sum + Number(account.assets[key] || 0), 0);
const assetTotal = (account, keys) => keys.reduce((sum, key) => sum + Number(account.assets[key] || 0), 0);
const sumAccounts = (accounts) => accounts.reduce((sum, account) => sum + accountValue(account), 0);

export function tiered(value, bands) {
  let remaining = value;
  let previous = 0;
  let fee = 0;
  for (const [limit, rate] of bands) {
    const slice = Math.max(0, Math.min(remaining, limit - previous));
    fee += slice * rate;
    remaining -= slice;
    previous = limit;
    if (remaining <= 0) break;
  }
  return fee;
}

export function isCompatible(provider, account) {
  if (!provider.accounts.includes(account.type)) return false;
  return ASSET_KEYS.every((key) => Number(account.assets[key] || 0) === 0 || provider.assets.includes(key));
}

function perAccount(accounts, calculator) {
  return accounts.reduce((sum, account) => sum + calculator(account), 0);
}

function calculatePerson(provider, accounts) {
  const total = sumAccounts(accounts);
  const model = provider.model;
  if (model === 'zero') return { fee: 0, plan: 'Standard tariff' };
  if (model === 'fixedIsa42') return { fee: accounts.some((a) => a.type === 'isa') ? 42 : 0, plan: 'ISA tariff' };
  if (model === 'lloydsGroup') return { fee: (accounts.some((a) => a.type === 'isa') ? 36 : 0) + perAccount(accounts.filter((a) => a.type === 'sipp'), (a) => Math.min(accountValue(a) * 0.0025, 198)), plan: 'Standard tariff' };
  if (model === 'scottishWidows') return { fee: perAccount(accounts.filter((a) => a.type === 'sipp'), (a) => Math.min(accountValue(a) * 0.0025, 198)), plan: 'Standard tariff' };
  if (model === 'moneyfarm') return { fee: perAccount(accounts, (a) => Math.min(accountValue(a) * 0.0035, 45)), plan: 'Share Investing' };
  if (model === 'eqi') return { fee: (total <= 50000 ? 59.99 : 131.88) + (accounts.some((a) => a.type === 'sipp') ? 118.8 : 0), plan: total <= 50000 ? 'Up to £50,000' : '£50,000+' };
  if (model === 'dodl') return { fee: perAccount(accounts, (a) => Math.max(12, accountValue(a) * 0.0015)), plan: 'Dodl' };
  if (model === 'chip') {
    const basic = perAccount(accounts, (a) => accountValue(a) * 0.0025 + 12);
    return basic <= 65.05 ? { fee: basic, plan: 'Basic' } : { fee: 65.05, plan: 'Chip X' };
  }
  if (model === 'quilter') return { fee: perAccount(accounts, (a) => accountValue(a) * 0.0025 + 24), plan: 'Quilter Invest' };
  if (model === 'ajBell') return { fee: perAccount(accounts, (a) => tiered(Number(a.assets.funds || 0), [[250000, 0.0025], [500000, 0.001], [Infinity, 0]]) + Math.min(assetTotal(a, EXCHANGE_KEYS) * 0.0025, a.type === 'sipp' ? 120 : 42)), plan: 'AJ Bell' };
  if (model === 'fidelity') {
    const rate = total < 25000 ? null : total < 250000 ? 0.0035 : total < 1000000 ? 0.002 : 0.002;
    if (rate === null) return { fee: 90, plan: 'Under £25,000, no regular savings plan' };
    const fundFee = Math.min(accounts.reduce((sum, a) => sum + Number(a.assets.funds || 0) * rate, 0), 2000);
    const exchangeFee = perAccount(accounts, (a) => Math.min(assetTotal(a, ['etfs', 'investmentTrusts', 'shares']) * rate, 90));
    return { fee: Math.min(fundFee + exchangeFee, 2000), plan: total >= 1000000 ? '£1 million+' : `${rate * 100}% service fee band` };
  }
  if (model === 'vanguard') return total < 32000 ? { fee: 48, plan: 'Under £32,000' } : { fee: Math.min(total * 0.0015, 375), plan: '0.15%, capped at £375' };
  if (model === 'flatPercent025') return { fee: total * 0.0025, plan: '0.25%' };
  if (model === 'charlesStanley') return { fee: Math.max(60, Math.min(total * 0.003, 600)) + (accounts.some((a) => a.type === 'sipp') && total < 30000 ? 120 : 0), plan: 'Standard tariff' };
  if (model === 'santander') return { fee: perAccount(accounts, (a) => tiered(accountValue(a), [[50000, 0.0035], [500000, 0.002], [Infinity, 0.001]])), plan: 'Investment Hub' };
  if (model === 'aviva') return { fee: tiered(total, [[500000, 0.0035], [Infinity, 0]]), plan: 'Standard tariff' };
  if (model === 'bestinvest') return { fee: perAccount(accounts, (a) => Math.max(a.type === 'sipp' ? 120 : 0, tiered(accountValue(a), [[250000, 0.004], [500000, 0.002], [1000000, 0.001], [Infinity, 0]]))), plan: 'Standard tariff' };
  if (model === 'hl') return { fee: perAccount(accounts, (a) => tiered(Number(a.assets.funds || 0), [[250000, 0.0035], [1000000, 0.0025], [2000000, 0.001], [Infinity, 0]]) + Math.min(assetTotal(a, EXCHANGE_KEYS) * 0.0035, 150)), plan: 'Standard tariff' };
  if (model === 'ibkr') return { fee: accounts.some((a) => a.type === 'isa') ? 36 : 0, plan: 'ISA inactivity fee before trading credits' };
  if (model === 'saxo') return { fee: perAccount(accounts, (a) => Number(a.assets.funds || 0) * 0.0005 + tiered(assetTotal(a, EXCHANGE_KEYS), [[1000000, 0.0012], [Infinity, 0.0008]]) + (a.type === 'sipp' ? 469 : 0)), plan: 'Classic custody tariff' };
  if (model === 'ig') return { fee: accounts.some((a) => a.type === 'sipp') ? 210 : 0, plan: 'Standard tariff' };
  throw new Error(`Unknown fee model: ${model}`);
}

function interactiveInvestorHousehold(personGroups) {
  const values = personGroups.map(({ accounts }) => sumAccounts(accounts));
  if (values.length === 1) return values[0] <= 100000 ? { fee: 71.88, plan: 'Core' } : { fee: 179.88, plan: 'Plus' };
  const separate = values.reduce((sum, value) => sum + (value <= 100000 ? 71.88 : 179.88), 0);
  let family = Infinity;
  for (let primary = 0; primary < values.length; primary += 1) {
    const otherValues = values.filter((_, index) => index !== primary);
    const familyMembers = otherValues.filter((value) => value <= 100000);
    const separatelyCharged = otherValues.filter((value) => value > 100000);
    const uncoveredMembers = Math.max(0, familyMembers.length - 5);
    const candidate = 179.88 + separatelyCharged.length * 179.88 + uncoveredMembers * 71.88;
    family = Math.min(family, candidate);
  }
  return family < separate ? { fee: family, plan: 'Plus with ii Family' } : { fee: separate, plan: 'Separate cheapest eligible plans' };
}

export function calculateArrangement(assignments, people) {
  const byProvider = new Map();
  for (const [accountId, providerId] of Object.entries(assignments)) {
    const person = people.find((item) => item.accounts.some((account) => account.id === accountId));
    const account = person?.accounts.find((item) => item.id === accountId);
    if (!account) continue;
    if (!byProvider.has(providerId)) byProvider.set(providerId, new Map());
    const byPerson = byProvider.get(providerId);
    if (!byPerson.has(person.id)) byPerson.set(person.id, []);
    byPerson.get(person.id).push(account);
  }

  let fee = 0;
  const breakdown = [];
  for (const [providerId, personMap] of byProvider.entries()) {
    const provider = PROVIDER_BY_ID[providerId];
    const groups = [...personMap.entries()].map(([personId, accounts]) => ({ personId, accounts }));
    const result = provider.model === 'interactiveInvestor'
      ? interactiveInvestorHousehold(groups)
      : groups.reduce((aggregate, group) => {
        const part = calculatePerson(provider, group.accounts);
        return { fee: aggregate.fee + part.fee, plan: aggregate.plan || part.plan };
      }, { fee: 0, plan: '' });
    fee += result.fee;
    breakdown.push({ provider, fee: result.fee, plan: result.plan, accounts: groups.flatMap((group) => group.accounts.map((account) => account.id)) });
  }
  return { fee, breakdown, assignments };
}

function activePeople(people) {
  return people.filter((person) => person.active && person.accounts.some((account) => accountValue(account) > 0));
}

export function calculateCurrentArrangement(people) {
  const active = activePeople(people);
  const accounts = active.flatMap((person) => person.accounts.filter((account) => accountValue(account) > 0));
  const missingAccountIds = accounts
    .filter((account) => !PROVIDER_BY_ID[account.currentProviderId])
    .map((account) => account.id);
  if (!accounts.length || missingAccountIds.length) return { result: null, missingAccountIds };
  const assignments = Object.fromEntries(accounts.map((account) => [account.id, account.currentProviderId]));
  return { result: calculateArrangement(assignments, active), missingAccountIds: [] };
}

function assignmentFor(accounts, providerId) {
  return Object.fromEntries(accounts.map((account) => [account.id, providerId]));
}

const sameFee = (left, right) => Math.abs(left - right) < 0.005;

function assignmentKey(assignments) {
  return Object.entries(assignments).sort(([left], [right]) => left.localeCompare(right))
    .map(([accountId, providerId]) => `${accountId}:${providerId}`).join('|');
}

function cheapestWithAlternatives(candidates) {
  if (!candidates.length) return null;
  const unique = [...new Map(candidates.map((candidate) => [assignmentKey(candidate.assignments), candidate])).values()]
    .sort((left, right) => left.fee - right.fee);
  const cheapest = unique[0];
  return { ...cheapest, alternatives: unique.filter((candidate) => sameFee(candidate.fee, cheapest.fee)) };
}

function combineAssignments(optionGroups, limit = 5000) {
  let combinations = [{}];
  for (const options of optionGroups) {
    combinations = combinations.flatMap((combination) => options.map((option) => ({ ...combination, ...option.assignments })));
    if (combinations.length > limit) combinations = combinations.slice(0, limit);
  }
  return combinations;
}

export function compareStrategies(people, filters = {}) {
  const active = activePeople(people);
  const accounts = active.flatMap((person) => person.accounts.filter((account) => accountValue(account) > 0));
  if (!accounts.length) return { total: 0, strategies: [], rankings: [], current: { result: null, missingAccountIds: [] } };
  const enabledTables = new Set(filters.tables || ['flat', 'percentage', 'trading']);
  const providers = PROVIDERS.filter((provider) => enabledTables.has(provider.table) && (filters.includeZeroFee !== false || provider.model !== 'zero'));

  const householdCandidates = providers.filter((p) => accounts.every((a) => isCompatible(p, a)))
    .map((p) => calculateArrangement(assignmentFor(accounts, p.id), active))
    .sort((a, b) => a.fee - b.fee);

  const individualBest = new Map();
  for (const person of active) {
    const personAccounts = person.accounts.filter((a) => accountValue(a) > 0);
    individualBest.set(person.id, providers.filter((p) => personAccounts.every((a) => isCompatible(p, a)))
      .map((p) => calculateArrangement(assignmentFor(personAccounts, p.id), [person]))
      .sort((a, b) => a.fee - b.fee));
  }
  const allPeopleHaveProvider = active.every((person) => individualBest.get(person.id).length > 0);
  const localBest = new Map(active.map((person) => {
    const candidates = individualBest.get(person.id);
    return [person.id, candidates.filter((candidate) => sameFee(candidate.fee, candidates[0]?.fee))];
  }));
  const perPersonCandidates = allPeopleHaveProvider
    ? combineAssignments(active.map((person) => localBest.get(person.id))).map((assignments) => calculateArrangement(assignments, active))
    : [];
  const ii = providers.find((provider) => provider.id === 'interactive-investor');
  const eligibleForIi = ii ? active.filter((person) => person.accounts.filter((a) => accountValue(a) > 0).every((a) => isCompatible(ii, a))) : [];
  const subsetCount = 2 ** eligibleForIi.length;
  for (let mask = 1; mask < subsetCount; mask += 1) {
    const optionGroups = active.map((person) => {
      const index = eligibleForIi.findIndex((item) => item.id === person.id);
      const useIi = index >= 0 && (mask & (1 << index));
      return useIi
        ? [{ assignments: assignmentFor(person.accounts.filter((a) => accountValue(a) > 0), ii.id) }]
        : localBest.get(person.id);
    });
    for (const assignments of combineAssignments(optionGroups)) {
      perPersonCandidates.push(calculateArrangement(assignments, active));
    }
  }
  const perPerson = cheapestWithAlternatives(perPersonCandidates);

  const candidatesByAccount = accounts.map((account) => providers.filter((p) => isCompatible(p, account)).map((p) => p.id));
  let beam = [{ assignments: {}, fee: 0 }];
  for (let index = 0; index < accounts.length; index += 1) {
    const next = [];
    for (const state of beam) {
      for (const providerId of candidatesByAccount[index]) {
        const assignments = { ...state.assignments, [accounts[index].id]: providerId };
        const result = calculateArrangement(assignments, active);
        next.push({ assignments, fee: result.fee });
      }
    }
    next.sort((a, b) => a.fee - b.fee);
    beam = next.slice(0, 5000);
  }
  const flexible = beam.length && accounts.every((_, index) => candidatesByAccount[index].length)
    ? cheapestWithAlternatives(beam.map((candidate) => calculateArrangement(candidate.assignments, active)))
    : null;
  const strategies = [
    { id: 'household', title: 'One provider for everyone', description: 'Every active account uses the same provider.', result: cheapestWithAlternatives(householdCandidates) },
    { id: 'person', title: 'One provider per person', description: 'Each person keeps all their accounts together.', result: perPerson },
    { id: 'flexible', title: 'Flexible account placement', description: 'Each whole account can use a different provider.', result: flexible },
  ];
  const availableFees = strategies.filter((strategy) => strategy.result).map((strategy) => strategy.result.fee);
  const lowest = availableFees.length ? Math.min(...availableFees) : null;
  for (const strategy of strategies) if (strategy.result) strategy.difference = strategy.result.fee - lowest;
  return { total: sumAccounts(accounts), strategies, rankings: householdCandidates, current: calculateCurrentArrangement(people) };
}
