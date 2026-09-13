import { accountValue } from './fee-engine.js';

export function restrictionProviders(result) {
  const alternatives = result.alternatives?.length ? result.alternatives : [result];
  return [...new Map(
    alternatives.flatMap((alternative) => alternative.breakdown)
      .filter((item) => item.provider.restriction).map((item) => [item.provider.id, item.provider])
  ).values()];
}

export function comparisonPresentation(comparison, people) {
  const active = people.filter((person) => person.active);
  const accounts = active.flatMap((person) => person.accounts).filter((account) => accountValue(account) > 0);

  if (active.length !== 1) {
    return {
      title: 'Three ways to arrange these accounts',
      description: 'Same holdings, different provider arrangements. Open a calculation to inspect its tariffs and restrictions.',
      strategies: comparison.strategies,
    };
  }

  const together = comparison.strategies.find((strategy) => strategy.id === 'person');
  if (accounts.length === 1) {
    return {
      title: 'Lowest platform fee for this account',
      description: 'Compare the leading compatible provider below, or open the full provider ranking.',
      strategies: [{ ...together, title: 'This account', description: 'The lowest recurring platform fee among compatible providers.' }],
    };
  }

  const flexible = comparison.strategies.find((strategy) => strategy.id === 'flexible');
  return {
    title: 'Two ways to arrange these accounts',
    description: 'Keep every account with one provider, or place each whole account separately.',
    strategies: [
      { ...together, title: 'Keep accounts together', description: 'Every account uses the same provider.' },
      flexible,
    ],
  };
}
