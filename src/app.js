import { accountValue, compareStrategies, money } from './fee-engine.js';
import { createPortfolioStorage } from './persistence.js';
import { comparisonPresentation, restrictionProviders } from './presentation.js';
import { createInitialState, normaliseSavedState } from './state.js';

const emptyAssets = () => ({ funds: 0, etfs: 0, investmentTrusts: 0, shares: 0, bonds: 0 });
let sequence = 10;
const nextId = (prefix) => prefix + '-' + sequence++;

const state = createInitialState();
const portfolioStorage = createPortfolioStorage({ localStorage, indexedDB, crypto });
let persistenceEnabled = portfolioStorage.isEnabled();
let saveTimer;
let saveRevision = 0;

const peopleRoot = document.querySelector('#people');
const resultsRoot = document.querySelector('#results');
const rankingsRoot = document.querySelector('#rankings');
const providerFilters = document.querySelector('#provider-filters');
const status = document.querySelector('#status');
const rememberPortfolio = document.querySelector('#remember-portfolio');
const clearPortfolioButton = document.querySelector('#clear-portfolio');
const clearRestoredPortfolio = document.querySelector('#clear-restored-portfolio');
const restoreNotice = document.querySelector('#restore-notice');
const storageHint = document.querySelector('#storage-hint');

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

function personValue(person) {
  return person.accounts.reduce((sum, account) => sum + accountValue(account), 0);
}

function accountName(type) {
  return type === 'isa' ? 'Stocks and Shares ISA' : 'SIPP';
}

function assetSummary(account) {
  const labels = { funds: 'funds', etfs: 'ETFs', investmentTrusts: 'investment trusts', shares: 'shares', bonds: 'bonds and gilts' };
  const entries = Object.entries(account.assets).filter(([, value]) => Number(value) > 0);
  return entries.length
    ? entries.map(([key, value]) => money(value) + ' ' + labels[key]).join(' · ')
    : 'No holdings entered';
}

function renderHeader() {
  const active = state.people.filter((person) => person.active);
  const accounts = active.flatMap((person) => person.accounts).filter((account) => accountValue(account) > 0);
  const total = accounts.reduce((sum, account) => sum + accountValue(account), 0);
  const peopleLabel = active.length === 1 ? 'person' : 'people';
  const accountsLabel = accounts.length === 1 ? 'account' : 'accounts';
  document.querySelector('#household-summary').textContent = active.length + ' ' + peopleLabel + ' · ' + accounts.length + ' ' + accountsLabel + ' · ' + money(total) + ' total';
  document.querySelector('#household-label').textContent = active.length ? active.map((person) => person.name).join(' & ') : 'No active people';
}

function syncProviderFilters() {
  providerFilters.querySelectorAll('[data-action="provider-table"]').forEach((input) => {
    input.checked = state.filters.tables.includes(input.value);
  });
  providerFilters.querySelector('[data-action="zero-fee"]').checked = state.filters.includeZeroFee;
}

function syncStorageControls() {
  rememberPortfolio.checked = persistenceEnabled;
  clearPortfolioButton.disabled = state.people.length === 0 && !portfolioStorage.hasSavedPortfolio();
}

function savedState() {
  return { filters: state.filters, people: state.people };
}

async function savePortfolio() {
  if (!persistenceEnabled) return;
  const revision = ++saveRevision;
  const snapshot = structuredClone(savedState());
  try {
    if (state.people.length) await portfolioStorage.save(snapshot, () => persistenceEnabled && revision === saveRevision);
    else await portfolioStorage.clear();
    storageHint.textContent = 'Encrypted on this device. Anyone using this browser profile can restore it.';
    syncStorageControls();
  } catch {
    storageHint.textContent = 'Saving is unavailable in this browser.';
  }
}

function queuePortfolioSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(savePortfolio, 250);
}

function fieldTemplate(account, personId, key, label) {
  return '<label class="money-field">' +
    '<span>' + label + '</span>' +
    '<span class="money-input"><span aria-hidden="true">£</span>' +
    '<input type="number" min="0" step="1000" inputmode="decimal" value="' + Number(account.assets[key] || 0) + '" data-action="asset" data-person="' + personId + '" data-account="' + account.id + '" data-asset="' + key + '">' +
    '</span></label>';
}

function accountTemplate(account, personId) {
  return '<details class="account" data-person="' + personId + '" data-account="' + account.id + '">' +
    '<summary><span><strong>' + accountName(account.type) + '</strong><small>' + escapeHtml(assetSummary(account)) + '</small></span><span class="account-total">' + money(accountValue(account)) + '</span></summary>' +
    '<div class="account-editor">' +
      '<div class="account-toolbar">' +
        '<label>Account type<select data-action="account-type" data-person="' + personId + '" data-account="' + account.id + '">' +
          '<option value="isa"' + (account.type === 'isa' ? ' selected' : '') + '>Stocks and Shares ISA</option>' +
          '<option value="sipp"' + (account.type === 'sipp' ? ' selected' : '') + '>SIPP</option>' +
        '</select></label>' +
        '<button class="danger-link" type="button" data-action="delete-account" data-person="' + personId + '" data-account="' + account.id + '">Delete account</button>' +
      '</div>' +
      '<div class="asset-fields">' +
        fieldTemplate(account, personId, 'funds', 'Funds') +
        fieldTemplate(account, personId, 'etfs', 'ETFs') +
        fieldTemplate(account, personId, 'investmentTrusts', 'Investment trusts') +
        fieldTemplate(account, personId, 'shares', 'Individual shares') +
        fieldTemplate(account, personId, 'bonds', 'Bonds and gilts') +
      '</div>' +
    '</div>' +
  '</details>';
}

function personTemplate(person) {
  return '<article class="person ' + (person.active ? '' : 'person-inactive') + '">' +
    '<header class="person-heading">' +
      '<label class="switch">' +
        '<input type="checkbox" data-action="toggle-person" data-person="' + person.id + '"' + (person.active ? ' checked' : '') + '>' +
        '<span class="switch-track" aria-hidden="true"></span>' +
        '<span class="visually-hidden">Include ' + escapeHtml(person.name) + ' in comparison</span>' +
      '</label>' +
      '<label class="person-name"><span class="visually-hidden">Person name</span><input value="' + escapeHtml(person.name) + '" data-action="person-name" data-person="' + person.id + '" maxlength="40"></label>' +
      '<strong class="person-total">' + money(personValue(person)) + '</strong>' +
      '<button class="icon-button" type="button" data-action="delete-person" data-person="' + person.id + '" aria-label="Delete ' + escapeHtml(person.name) + '">×</button>' +
    '</header>' +
    (person.accounts.length ? '<div class="account-list-head"><span>Account and holdings</span><span>Value</span></div>' : '') +
    '<div class="accounts">' + person.accounts.map((account) => accountTemplate(account, person.id)).join('') + '</div>' +
    '<button class="text-button add-account" type="button" data-action="add-account" data-person="' + person.id + '">Add account</button>' +
  '</article>';
}

function renderPeople() {
  peopleRoot.innerHTML = state.people.map(personTemplate).join('');
}

function findAccount(personId, accountId) {
  const person = state.people.find((item) => item.id === personId);
  return { person, account: person && person.accounts.find((item) => item.id === accountId) };
}

function assignmentLabel(accountId) {
  for (const person of state.people) {
    const account = person.accounts.find((item) => item.id === accountId);
    if (account) return person.name + ' ' + accountName(account.type).replace('Stocks and Shares ', '');
  }
  return 'Account';
}

function providerList(result) {
  return result.breakdown.map((item) =>
    '<li><strong>' + escapeHtml(item.provider.name) + '</strong>' +
    '<span>' + item.accounts.map(assignmentLabel).map(escapeHtml).join(', ') + '</span>' +
    '<span>' + money(item.fee, 2) + ' · ' + escapeHtml(item.plan) + '</span></li>'
  ).join('');
}

function providerForAccount(result, accountId) {
  return result.breakdown.find((item) => item.accounts.includes(accountId))?.provider;
}

function accountForId(accountId) {
  for (const person of state.people) {
    const account = person.accounts.find((item) => item.id === accountId);
    if (account) return account;
  }
  return null;
}

function tiedArrangements(result) {
  const alternatives = result.alternatives || [result];
  if (alternatives.length === 1) return '<ul class="providers">' + providerList(result) + '</ul>';
  const label = alternatives.length + ' cheapest provider combinations found';
  const items = alternatives.map((alternative) =>
    '<li>' + Object.keys(alternative.assignments).map((accountId) => {
      const provider = providerForAccount(alternative, accountId);
      return '<span><small>' + escapeHtml(assignmentLabel(accountId)) + '</small><strong>' + escapeHtml(provider?.name || 'Unknown provider') + '</strong></span>';
    }).join('') + '</li>'
  ).join('');
  return '<div class="tie-summary">' + escapeHtml(label) + '</div>' +
    '<details class="tied-arrangements"><summary>Compare all ' + alternatives.length + '</summary><ol>' + items + '</ol></details>';
}

function restrictions(result) {
  const unique = restrictionProviders(result);
  if (!unique.length) return '';
  return '<div class="restriction"><strong>Check before moving</strong>' +
    unique.map((provider) => '<p><b>' + escapeHtml(provider.name) + ':</b> ' + escapeHtml(provider.restriction) + '</p>').join('') +
    '</div>';
}

function strategyTemplate(strategy, total) {
  if (!strategy.result) {
    return '<article class="strategy unavailable"><h3>' + escapeHtml(strategy.title) + '</h3><p>' + escapeHtml(strategy.description) + '</p><strong>No compatible provider</strong><p>No provider in the dataset can hold every active account and asset category.</p></article>';
  }
  const percentage = total ? strategy.result.fee / total * 100 : 0;
  const difference = strategy.difference < 0.005
    ? 'Lowest-cost arrangement'
    : money(strategy.difference, 2) + ' more than lowest';
  const rows = strategy.result.breakdown.map((item) =>
    '<div class="calculation-row"><span>' + escapeHtml(item.provider.name) +
      '<small>' + item.accounts.map(assignmentLabel).map(escapeHtml).join(', ') + '</small>' +
      '<small>' + escapeHtml(item.plan) + '</small></span><strong>' + money(item.fee, 2) + '</strong></div>' +
      (item.provider.note ? '<p class="rule-note">' + escapeHtml(item.provider.note) + '</p>' : '') +
      '<a class="source-link" href="' + item.provider.sourceUrl + '" target="_blank" rel="noreferrer">View ' +
      (item.provider.sourceStatus === 'official-verified' ? 'official tariff' : 'Monevator source') + '</a>'
  ).join('');
  const sourceLabel = strategy.result.breakdown.every((item) => item.provider.sourceStatus === 'official-verified')
    ? 'Official tariffs verified where shown.'
    : 'Includes Monevator fallback data.';
  const calculationLabel = strategy.result.alternatives?.length > 1 ? 'Show one calculation' : 'Show calculation';
  return '<article class="strategy">' +
    '<header><h3>' + escapeHtml(strategy.title) + '</h3><p>' + escapeHtml(strategy.description) + '</p></header>' +
    '<div class="fee-label">Estimated annual fee</div>' +
    '<div class="fee"><strong>' + money(strategy.result.fee, 2) + '</strong><span>' + percentage.toFixed(3) + '% of assets</span></div>' +
    '<div class="difference">' + difference + '</div>' +
    tiedArrangements(strategy.result) +
    restrictions(strategy.result) +
    '<details class="calculation"><summary>' + calculationLabel + '</summary>' + rows + '<p class="source-note">' + sourceLabel + '</p></details>' +
  '</article>';
}

function assignmentSummary(strategy) {
  if (!strategy?.result) return '';
  const result = strategy.result;
  const alternatives = result.alternatives?.length || 1;
  const rows = Object.keys(result.assignments).map((accountId) => {
    const account = accountForId(accountId);
    const provider = providerForAccount(result, accountId);
    return '<div class="assignment-row" role="row">' +
      '<span role="cell"><strong>' + escapeHtml(assignmentLabel(accountId)) + '</strong><small>' + escapeHtml(assetSummary(account)) + '</small></span>' +
      '<span role="cell">' + money(accountValue(account)) + '</span>' +
      '<span role="cell"><strong>' + escapeHtml(provider?.name || 'Unknown provider') + '</strong></span>' +
    '</div>';
  }).join('');
  const note = alternatives > 1
    ? 'Showing one of ' + alternatives + ' arrangements at this fee. Compare the alternatives above.'
    : 'The lowest-fee provider placement calculated for these accounts.';
  return '<section class="assignment-summary" aria-labelledby="assignment-title">' +
    '<header><h3 id="assignment-title">Account placement</h3><p>' + escapeHtml(note) + '</p></header>' +
    '<div class="assignment-table" role="table" aria-label="One lowest-fee account placement">' +
      '<div class="assignment-head" role="row"><span role="columnheader">Account</span><span role="columnheader">Value</span><span role="columnheader">Provider</span></div>' + rows +
    '</div></section>';
}

function renderResults() {
  const comparison = compareStrategies(state.people, state.filters);
  if (!comparison.strategies.length) {
    document.querySelector('#results-title').textContent = 'Compare platform fees';
    document.querySelector('#results-description').textContent = 'Add your accounts and holdings to see compatible provider arrangements.';
    resultsRoot.innerHTML = '<div class="empty-state"><h3>Add a portfolio to compare</h3><p>Include at least one person and enter a value in one of their accounts.</p></div>';
    rankingsRoot.innerHTML = '';
    return;
  }
  const presentation = comparisonPresentation(comparison, state.people);
  document.querySelector('#results-title').textContent = presentation.title;
  document.querySelector('#results-description').textContent = presentation.description;
  const placement = presentation.strategies.find((strategy) => strategy.id === 'flexible') || presentation.strategies[0];
  resultsRoot.innerHTML = '<div class="strategy-grid strategy-grid-' + presentation.strategies.length + '">' + presentation.strategies.map((strategy) => strategyTemplate(strategy, comparison.total)).join('') + '</div>' + assignmentSummary(placement);
  if (!comparison.rankings.length) {
    rankingsRoot.innerHTML = '<p>No single provider can hold every active account and asset category.</p>';
    return;
  }
  rankingsRoot.innerHTML = '<div class="ranking-table" role="table" aria-label="Eligible providers ranked by annual fee">' +
    '<div class="ranking-head" role="row"><span role="columnheader">Provider</span><span role="columnheader">Data</span><span role="columnheader">Annual fee</span></div>' +
    comparison.rankings.map((result, index) => {
      const item = result.breakdown[0];
      const restriction = item.provider.restriction ? ' · ' + escapeHtml(item.provider.restriction) : '';
      const statusLabel = item.provider.sourceStatus === 'official-verified' ? 'Official' : 'Monevator fallback';
      return '<div class="ranking-row" role="row">' +
        '<span role="cell"><b>' + (index + 1) + '. ' + escapeHtml(item.provider.name) + '</b><small>' + escapeHtml(item.plan) + restriction + '</small></span>' +
        '<span role="cell"><a href="' + item.provider.sourceUrl + '" target="_blank" rel="noreferrer">' + statusLabel + '</a></span>' +
        '<strong role="cell">' + money(result.fee, 2) + '</strong>' +
      '</div>';
    }).join('') +
  '</div>';
}

function render() {
  renderHeader();
  renderPeople();
  renderResults();
  syncStorageControls();
}

function announce(message) {
  status.textContent = '';
  requestAnimationFrame(() => { status.textContent = message; });
}

document.querySelector('#add-person').addEventListener('click', () => {
  const number = state.people.length + 1;
  state.people.push({ id: nextId('person'), name: 'Person ' + number, active: true, accounts: [{ id: nextId('account'), type: 'isa', assets: emptyAssets() }] });
  render();
  queuePortfolioSave();
  announce('Person ' + number + ' added');
});

peopleRoot.addEventListener('input', (event) => {
  const target = event.target;
  const action = target.dataset.action;
  if (action === 'asset') {
    const found = findAccount(target.dataset.person, target.dataset.account);
    found.account.assets[target.dataset.asset] = Math.max(0, Number(target.value || 0));
    const wrap = target.closest('.account');
    wrap.querySelector('.account-total').textContent = money(accountValue(found.account));
    wrap.querySelector('summary small').textContent = assetSummary(found.account);
    target.closest('.person').querySelector('.person-total').textContent = money(personValue(found.person));
    renderHeader();
    renderResults();
    queuePortfolioSave();
  }
  if (action === 'person-name') {
    state.people.find((person) => person.id === target.dataset.person).name = target.value || 'Unnamed person';
    renderHeader();
    queuePortfolioSave();
  }
});

peopleRoot.addEventListener('change', (event) => {
  const target = event.target;
  const action = target.dataset.action;
  if (action === 'toggle-person') {
    state.people.find((person) => person.id === target.dataset.person).active = target.checked;
    render();
    queuePortfolioSave();
    announce((target.checked ? 'Included' : 'Excluded') + ' person from comparison');
  }
  if (action === 'account-type') {
    const found = findAccount(target.dataset.person, target.dataset.account);
    found.account.type = target.value;
    target.closest('.account').querySelector('summary strong').textContent = accountName(found.account.type);
    renderResults();
    queuePortfolioSave();
    announce('Account type changed');
  }
});

peopleRoot.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  const person = state.people.find((item) => item.id === button.dataset.person);
  if (action === 'add-account') {
    const account = { id: nextId('account'), type: 'isa', assets: emptyAssets() };
    person.accounts.push(account);
    render();
    const editor = peopleRoot.querySelector('details[data-account="' + account.id + '"]');
    editor.open = true;
    editor.querySelector('select').focus();
    queuePortfolioSave();
    announce('Account added for ' + person.name);
  }
  if (action === 'delete-account') {
    person.accounts = person.accounts.filter((account) => account.id !== button.dataset.account);
    render();
    queuePortfolioSave();
    announce('Account deleted for ' + person.name);
  }
  if (action === 'delete-person') {
    state.people = state.people.filter((item) => item.id !== person.id);
    render();
    queuePortfolioSave();
    announce(person.name + ' deleted');
  }
});

providerFilters.addEventListener('change', (event) => {
  const target = event.target;
  if (target.dataset.action === 'provider-table') {
    const enabled = new Set(state.filters.tables);
    if (target.checked) enabled.add(target.value);
    else enabled.delete(target.value);
    state.filters.tables = [...enabled];
  }
  if (target.dataset.action === 'zero-fee') state.filters.includeZeroFee = target.checked;
  renderResults();
  queuePortfolioSave();
  announce('Provider filters updated');
});

async function clearPortfolio() {
  clearTimeout(saveTimer);
  saveRevision += 1;
  try {
    await portfolioStorage.clear();
  } catch {
    storageHint.textContent = 'The displayed portfolio was cleared, but browser storage could not be updated.';
  }
  const initial = createInitialState();
  state.people = initial.people;
  state.filters = initial.filters;
  restoreNotice.hidden = true;
  syncProviderFilters();
  render();
  announce('Portfolio and saved data cleared');
}

rememberPortfolio.addEventListener('change', async () => {
  clearTimeout(saveTimer);
  saveRevision += 1;
  persistenceEnabled = rememberPortfolio.checked;
  portfolioStorage.setEnabled(persistenceEnabled);
  restoreNotice.hidden = true;
  if (persistenceEnabled) await savePortfolio();
  else {
    try {
      await portfolioStorage.clear();
      storageHint.textContent = 'Not saved. Values will be lost when this tab closes.';
    } catch {
      storageHint.textContent = 'Saving is off, but browser storage could not be updated.';
    }
  }
  syncStorageControls();
  announce(persistenceEnabled ? 'Portfolio saving turned on' : 'Portfolio saving turned off and saved data removed');
});

clearPortfolioButton.addEventListener('click', clearPortfolio);
clearRestoredPortfolio.addEventListener('click', clearPortfolio);
document.querySelector('#dismiss-restore-notice').addEventListener('click', () => {
  restoreNotice.hidden = true;
  announce('Restore notice dismissed');
});

async function initialize() {
  let restored = false;
  if (!persistenceEnabled) storageHint.textContent = 'Not saved. Values will be lost when this tab closes.';
  if (persistenceEnabled && portfolioStorage.hasSavedPortfolio()) {
    try {
      const saved = normaliseSavedState(await portfolioStorage.load());
      state.people = saved.people;
      state.filters = saved.filters;
      const identifiers = state.people.flatMap((person) => [person.id, ...person.accounts.map((account) => account.id)]);
      sequence = Math.max(sequence, ...identifiers.map((id) => Number(String(id).split('-').at(-1)) + 1).filter(Number.isFinite));
      restored = true;
    } catch {
      try {
        await portfolioStorage.clear();
      } catch {
        storageHint.textContent = 'Saved data could not be restored. Clear this site’s storage in your browser settings.';
      }
      if (!portfolioStorage.hasSavedPortfolio()) storageHint.textContent = 'Saved data could not be restored and was removed.';
    }
  }
  syncProviderFilters();
  render();
  restoreNotice.hidden = !restored;
}

initialize();
