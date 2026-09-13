import { PROVIDER_BY_ID } from './providers.js';

export function createInitialState() {
  return {
    filters: {
      tables: ['flat', 'percentage', 'trading'],
      includeZeroFee: true,
    },
    people: [],
  };
}

const assetKeys = ['funds', 'etfs', 'investmentTrusts', 'shares', 'bonds'];
const tableKeys = ['flat', 'percentage', 'trading'];

export function normaliseSavedState(saved) {
  if (!saved || !Array.isArray(saved.people)) throw new Error('Invalid saved portfolio');
  const filters = {
    tables: Array.isArray(saved.filters?.tables)
      ? saved.filters.tables.filter((table) => tableKeys.includes(table))
      : [...tableKeys],
    includeZeroFee: saved.filters?.includeZeroFee !== false,
  };
  const people = saved.people.map((person) => ({
    id: String(person.id),
    name: String(person.name || 'Unnamed person').slice(0, 40),
    active: person.active !== false,
    accounts: Array.isArray(person.accounts) ? person.accounts.map((account) => ({
      id: String(account.id),
      type: account.type === 'sipp' ? 'sipp' : 'isa',
      currentProviderId: PROVIDER_BY_ID[account.currentProviderId] ? account.currentProviderId : '',
      assets: Object.fromEntries(assetKeys.map((key) => [key, Math.max(0, Number(account.assets?.[key]) || 0)])),
    })) : [],
  }));
  return { filters, people };
}
