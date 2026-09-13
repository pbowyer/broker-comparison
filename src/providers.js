export const ASSET_KEYS = ['funds', 'etfs', 'investmentTrusts', 'shares', 'bonds'];
export const EXCHANGE_KEYS = ['etfs', 'investmentTrusts', 'shares', 'bonds'];

const monevator = 'https://monevator.com/compare-uk-cheapest-online-brokers/';

const provider = (id, name, table, accounts, assets, model, options = {}) => ({
  id,
  name,
  table,
  accounts,
  assets,
  model,
  sourceStatus: options.sourceStatus || 'monevator-fallback',
  sourceUrl: options.sourceUrl || monevator,
  checked: options.checked || '2026-09-13',
  restriction: options.restriction || '',
  note: options.note || '',
});

export const PROVIDERS = [
  provider('investengine', 'InvestEngine', 'flat', ['isa', 'sipp'], ['etfs'], 'zero', {
    sourceStatus: 'official-verified', sourceUrl: 'https://investengine.com/costs/', restriction: 'ETF portfolios only.', note: 'DIY ISA and SIPP platform fees are £0. ETF costs and market spreads still apply.'
  }),
  provider('prosper', 'Prosper', 'flat', ['isa', 'sipp'], ['funds', 'etfs'], 'zero', {
    restriction: 'Restricted fund and ETF list. SIPP drawdown is unavailable.'
  }),
  provider('lightyear', 'Lightyear', 'flat', ['isa'], ['etfs', 'shares'], 'zero', {
    sourceStatus: 'official-verified', sourceUrl: 'https://lightyear.com/en-gb/pricing', restriction: 'Investment range differs from a full-service broker; no SIPP.'
  }),
  provider('freetrade', 'Freetrade', 'flat', ['isa', 'sipp'], ASSET_KEYS, 'zero', {
    sourceStatus: 'official-verified', sourceUrl: 'https://freetrade.io/invest-for-less', restriction: 'No SIPP drawdown. The mutual fund range is restricted.', note: 'The Basic plan has no account, custody, or dealing fee. Other charges can apply.'
  }),
  provider('barclays-direct', 'Barclays Direct Investing', 'flat', ['isa'], ASSET_KEYS, 'zero', {
    restriction: 'SIPP closed to new customers.', note: 'Monevator fallback: no annual ISA platform fee.'
  }),
  provider('interactive-investor', 'Interactive Investor', 'flat', ['isa', 'sipp'], ASSET_KEYS, 'interactiveInvestor', {
    sourceStatus: 'official-verified', sourceUrl: 'https://www.ii.co.uk/our-charges', note: 'The calculator applies the £100,000 per-person limits when choosing Core or Plus and when including eligible ii Family accounts.'
  }),
  provider('lloyds', 'Lloyds Bank Share Dealing', 'flat', ['isa', 'sipp'], ASSET_KEYS, 'lloydsGroup', {
    sourceStatus: 'official-verified', sourceUrl: 'https://www.lloydsbank.com/investing/ways-to-invest/share-dealing-services/charges.html', note: '£36 ISA fee plus 0.25% SIPP fee capped at £198.'
  }),
  provider('halifax', 'Halifax / Bank of Scotland Share Dealing', 'flat', ['isa', 'sipp'], ASSET_KEYS, 'lloydsGroup', {
    sourceStatus: 'official-verified', sourceUrl: 'https://www.halifax.co.uk/investing/start-investing/share-dealing-services/charges.html', note: '£36 ISA fee plus 0.25% SIPP fee capped at £198.'
  }),
  provider('scottish-widows', 'Scottish Widows Share Dealing', 'flat', ['isa', 'sipp'], ASSET_KEYS, 'scottishWidows', {
    note: 'Monevator fallback: £0 ISA fee plus 0.25% SIPP fee capped at £198.'
  }),
  provider('revolut', 'Revolut', 'flat', ['isa'], ['etfs', 'shares'], 'zero', {
    restriction: 'No SIPP. Investment range and included trades depend on plan.', note: 'Monevator lists the Standard plan at £0.'
  }),
  provider('hsbc-invest-direct', 'HSBC InvestDirect', 'flat', ['isa'], ['etfs', 'investmentTrusts', 'shares', 'bonds'], 'fixedIsa42', {
    restriction: 'No funds and no SIPP.'
  }),
  provider('moneyfarm-share', 'Moneyfarm Share Investing', 'flat', ['isa'], ASSET_KEYS, 'moneyfarm', {
    note: 'Monevator fallback: ISA fee is 0.35%, capped at £45.'
  }),
  provider('eqi', 'EQi', 'flat', ['isa', 'sipp'], ASSET_KEYS, 'eqi', {
    restriction: 'SIPP drawdown adds a separate fee, excluded from this platform-fee comparison.', note: 'Fee is based on all accounts held by one person, with a SIPP supplement.'
  }),
  provider('dodl', 'Dodl by AJ Bell', 'percentage', ['isa', 'sipp'], ['funds', 'etfs', 'investmentTrusts', 'shares'], 'dodl', {
    restriction: 'Restricted investment list. No SIPP drawdown.'
  }),
  provider('chip', 'Chip', 'percentage', ['isa'], ['etfs'], 'chip', {
    restriction: 'Restricted investment list; no funds or SIPP.', note: 'Chooses the cheaper of Basic and Chip X from the Monevator tariff.'
  }),
  provider('quilter-invest', 'Quilter Invest', 'percentage', ['isa'], ['etfs'], 'quilter', {
    restriction: 'Restricted investment list; no funds or SIPP. Monevator comments indicate the service may not be taking new customers.'
  }),
  provider('aj-bell', 'AJ Bell', 'percentage', ['isa', 'sipp'], ASSET_KEYS, 'ajBell', {
    sourceStatus: 'official-verified', sourceUrl: 'https://www.ajbell.co.uk/sipp-product', note: 'Fund tiers and exchange-traded asset caps are calculated separately for each account.'
  }),
  provider('fidelity', 'Fidelity', 'percentage', ['isa', 'sipp'], ['funds', 'etfs', 'investmentTrusts', 'shares'], 'fidelity', {
    sourceStatus: 'official-verified', sourceUrl: 'https://www.fidelity.co.uk/services/charges-fees', restriction: 'Bonds are excluded because the official retail tariff does not clearly include them in the £90 exchange-traded cap.', note: 'The service-fee band uses all accounts in one person’s name; each ISA and SIPP exchange-traded portion is capped at £90.'
  }),
  provider('vanguard', 'Vanguard Investor', 'percentage', ['isa', 'sipp'], ['funds', 'etfs'], 'vanguard', {
    sourceStatus: 'official-verified', sourceUrl: 'https://www.vanguardinvestor.co.uk/what-we-offer/fees-explained', restriction: 'Vanguard funds and ETFs only.', note: 'One account fee across a person’s Vanguard accounts.'
  }),
  provider('hsbc-gic', 'HSBC Global Investment Centre', 'percentage', ['isa'], ['funds'], 'flatPercent025', {
    restriction: 'Funds only, with a restricted non-HSBC index fund range. No SIPP.'
  }),
  provider('charles-stanley', 'Charles Stanley Direct', 'percentage', ['isa', 'sipp'], ASSET_KEYS, 'charlesStanley', {
    note: 'Monevator fallback. SIPP adds £120 when all accounts with the provider are below £30,000.'
  }),
  provider('santander', 'Santander Investment Hub', 'percentage', ['isa', 'sipp'], ['funds'], 'santander', {
    restriction: 'Funds only.', note: 'Tiered fee is calculated per account.'
  }),
  provider('aviva', 'Aviva', 'percentage', ['isa', 'sipp'], ASSET_KEYS, 'aviva', {
    note: 'Monevator fallback: tiered fee applies to the sum of one person’s accounts.'
  }),
  provider('bestinvest', 'Bestinvest', 'percentage', ['isa', 'sipp'], ASSET_KEYS, 'bestinvest', {
    note: 'Monevator fallback: tiered per account; SIPP minimum £120.'
  }),
  provider('hargreaves-lansdown', 'Hargreaves Lansdown', 'percentage', ['isa', 'sipp'], ASSET_KEYS, 'hl', {
    sourceStatus: 'official-verified', sourceUrl: 'https://www.hl.co.uk/pensions/sipp/charges-and-interest-rates', note: 'Fund tiers and the £150 exchange-traded cap apply separately to each account.'
  }),
  provider('interactive-brokers', 'Interactive Brokers', 'trading', ['isa'], ['etfs', 'investmentTrusts', 'shares', 'bonds'], 'ibkr', {
    restriction: 'The £36 annual ISA inactivity fee can be offset by trading commissions. SIPP fees vary by administrator and cannot be calculated from the table.'
  }),
  provider('trading-212', 'Trading 212', 'trading', ['isa', 'sipp'], ['etfs', 'investmentTrusts', 'shares'], 'zero', {
    restriction: 'No funds. SIPP drawdown is unavailable.'
  }),
  provider('saxo', 'Saxo', 'trading', ['isa', 'sipp'], ASSET_KEYS, 'saxo', {
    restriction: 'SIPP adds £469 a year; drawdown costs are excluded.', note: 'Monevator fallback.'
  }),
  provider('ig', 'IG', 'trading', ['isa', 'sipp'], ['etfs', 'investmentTrusts', 'shares', 'bonds'], 'ig', {
    restriction: 'No funds. SIPP entry, drawdown and UFPLS charges are excluded.', note: 'Monevator fallback: £0 ISA, £210 SIPP.'
  }),
  provider('robinhood', 'Robinhood', 'trading', ['isa'], ['shares'], 'zero', {
    restriction: 'US shares only; no SIPP. Monevator notes that FSCS protection does not apply to stocks.'
  }),
];

export const PROVIDER_BY_ID = Object.fromEntries(PROVIDERS.map((item) => [item.id, item]));
