# Broker costs

A static, browser-only calculator for comparing recurring UK platform fees across Stocks and Shares ISAs and SIPPs.

## Run it

Requires Node.js 20 or later. Run npm start, then open http://localhost:4173.

## Check it

Run npm test and npm run check.

## Publish to Cloudflare Workers

Run `npm install`, authenticate with `npx wrangler login`, then run `npm run deploy`.

The build copies only the public browser files into `dist/`. Wrangler publishes that directory as a Workers Static Assets project named `broker-comparison`. Change `name` in `wrangler.jsonc` before the first deployment if you want a different `workers.dev` hostname.

## Data

- data/monevator-broker-tables.json and its CSV counterpart are complete snapshots of the three comparison tables extracted on 13 September 2026.
- src/providers.js is the normalized, calculation-ready dataset.
- DISCREPANCIES.md records differences or unresolved ambiguities found against official tariffs.
- scripts/extract_monevator.rb regenerates the raw snapshots from saved page HTML.

The app calculates platform fees only. It deliberately excludes dealing, regular investing, FX, spreads, investment product charges, cash interest, transfers, exits, drawdown, and UFPLS costs.

Accounts remain whole. Each provider declares supported account and asset types. The engine then applies the provider’s actual charging basis where verified: per account, combined for one person, or household pricing such as Interactive Investor Family.

The comparison can include or exclude each Monevator table independently. A separate switch removes explicit £0 platform-fee providers while retaining paid providers from the same table.

The flexible strategy uses a bounded search of up to 5,000 partial arrangements per account. This avoids locking the browser on unusually large household models. Review a large or unusual result against the detailed provider tariffs before acting.
