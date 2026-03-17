# Wealthfolio Compare Addon - Model Handoff Notes

Date: 2026-03-16
Workspace: wealthfolio-compare

## User Direction (Latest)
- Do not add extra chart libraries.
- Use Wealthfolio UI chart components.
- Prefer direct WID simulator JSON files, e.g. https://wid.world/simulatorapp/jsongenerated/ahweal_QE-PPP.json.
- Current request: write all gathered data (found + missing) for next model.

## Project State (Codebase)
- Addon source is still starter template in src/addon.tsx (no dashboard implemented yet).
- Dependencies already include:
  - @wealthfolio/addon-sdk
  - @wealthfolio/ui
  - react, react-dom
- No successful code implementation has been applied yet for the requested dashboard.

## Wealthfolio UI Findings
- @wealthfolio/ui is installed and exports chart APIs.
- Relevant exports:
  - From @wealthfolio/ui main export: chart primitives are exported (components/ui/chart).
  - From @wealthfolio/ui/chart export: recharts exports + ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent.
- Conclusion:
  - No extra chart dependency is needed in this addon.
  - Implementation should use @wealthfolio/ui and/or @wealthfolio/ui/chart only.

## Addon SDK Findings (Data Access)
- AddonContext includes ctx.api (host API).
- Useful APIs discovered:
  - ctx.api.portfolio.getHistoricalValuations(accountId?, startDate?, endDate?)
  - ctx.api.portfolio.getLatestValuations(accountIds)
  - ctx.api.portfolio.getIncomeSummary()
  - ctx.api.settings.get() for baseCurrency
- Key valuation fields in AccountValuation:
  - valuationDate
  - totalValue
  - baseCurrency
  - totalValueBaseCurrency-like context available via summaries

## WID Data Source Findings

### 1) Public simulator JSON endpoint (works, no auth)
- Confirmed 200 OK example:
  - https://wid.world/simulatorapp/jsongenerated/ahweal_QE-PPP.json
- Observed structure sample:
  - top-level keys like ahweal_p0p1_992_j
  - each key contains array entries
  - each entry contains area object (e.g. QE-PPP)
  - area object has:
    - meta: data_quality, imputation, extrapolation, data_points
    - values: array of { y: year, v: value }

### 2) Simulator files confirmed available (HTTP 200)
- thweal_US.json
- thweal_QE-PPP.json
- tptinc_US.json
- tptinc_QE-PPP.json
- ahweal_US.json
- aptinc_US.json

### 3) Files tested and missing (HTTP 404)
- anypric_US.json
- inyixx_US.json
- inyixx_QE-PPP.json
- inyixx_WO-PPP.json
- inyixx_USA.json
- inyixx_QE.json
- inyixx_US-MER.json
- inyixx_US-PPP.json
- inyixx_WO.json
- inyixx_FR.json
- xlceup_US.json
- xlceup_WO-PPP.json
- xlcusp_US.json
- xlcusp_FR.json
- xlcusp_QE-PPP.json
- xlcusp_WO-PPP.json
- xlceup_QE-PPP.json
- xlceup_FR.json
- xlceup_WO-MER.json
- xlceup_WO.json

### 4) WID backend API findings (non-simulator)
- The wid-r-tool repository shows backend base URL:
  - https://rfap9nitz6.execute-api.eu-west-1.amazonaws.com/prod/
- Expected endpoints include:
  - countries-available-variables
  - countries-variables
  - countries-variables-metadata
- Live calls from this environment returned 403 Forbidden.
- Repository code indicates requests require x-api-key header with base64-encoded key.
- Conclusion:
  - Direct backend API likely needs auth key; simulator JSON is the practical no-auth source.

## Requirements Coverage Status (Not Yet Implemented)
- Not yet implemented in code:
  - Country selector + browser default
  - Household size adjustment using equal-split adult logic
  - Timespan toggles (1Y/3Y/5Y/10Y)
  - Wealth % tab (threshold comparisons)
  - Income % tab (threshold comparisons)
  - Real vs Nominal tab
  - Growth (inflation adjusted) tab
  - Summary card metrics (country percentile, world percentile, inflation-adjusted value, inflation loss)
  - Extra visualization(s)

## Important Gap for Next Model
- Inflation and PPP series were requested (nypric, xlceup), but tested simulator JSON filenames for these were not found.
- Next model should do one of these:
  1) Discover actual simulator filenames/paths for inflation + PPP by exploring simulator data index/assets.
  2) If unavailable in simulator JSON, fallback to alternate open WID exports and map to required concepts.
  3) If still unavailable, implement dashboard with clear temporary fallback assumptions and visible warning.

## Suggested Immediate Next Steps
1. Implement WID simulator JSON client for currently confirmed files (thweal/tptinc/ahweal/aptinc).
2. Build dashboard UI in src/addon.tsx using @wealthfolio/ui charts only.
3. Integrate portfolio historical valuations and income summary from ctx.api.
4. Add an explicit data-source status panel that flags missing inflation/PPP series until resolved.
5. Run type-check and fix compile errors.

## Notes About Attempts Made
- A dependency install command for recharts was attempted but canceled by user.
- No dependency changes were completed.
- No destructive git operations were used.

---

## Progress Update (Implemented)

### Code implemented
- `src/addon.tsx` now contains a full dashboard implementation (replacing starter template).
- Uses `@wealthfolio/ui` and `@wealthfolio/ui/chart` only (no extra chart library added).
- Uses `ctx.api.settings.get()`, `ctx.api.portfolio.getHistoricalValuations(...)`, and `ctx.api.portfolio.getIncomeSummary()`.

### Features implemented
- Country selector with browser-locale default (`US` fallback).
- Household size input with equal-split adjustment (portfolio/income values divided by household size).
- Timespan buttons: `1Y`, `3Y`, `5Y`, `10Y`.
- Tabs implemented:
  - Wealth %
  - Income %
  - Real vs Nominal
  - Growth
- Summary cards implemented:
  - Country percentile (estimated)
  - World percentile (estimated)
  - Inflation-adjusted value (temporary fallback)
  - Inflation loss (temporary fallback)
- Data-source status panel implemented:
  - Displays known found files.
  - Displays known missing files.
  - Displays runtime missing fetches for selected country.

### WID simulator integration implemented
- Runtime fetches for:
  - `thweal_{country}` and `thweal_QE-PPP`
  - `tptinc_{country}` and `tptinc_QE-PPP`
  - `ahweal_{country}` and `ahweal_QE-PPP`
  - `aptinc_{country}` and `aptinc_QE-PPP`
- Runtime probe/fallback status checks for missing inflation/PPP-related series:
  - `anypric_{country}`
  - `inyixx_{country}`
  - `xlceup_{country}`
  - `xlcusp_{country}`

### Build/validation
- `pnpm type-check` passes.

## Remaining Gap
- Real inflation-adjusted calculations are still blocked by unavailable simulator JSON filenames/paths for inflation/PPP in tested naming patterns.
- Real vs Nominal and Growth tabs currently use explicit temporary fallback behavior and show warning messaging.

## Suggested Next Steps
1. Discover actual simulator filenames/index for inflation + PPP series (or alternative open WID exports).
2. Replace temporary fallback in real/growth calculations with true deflator/PPP-adjusted transforms.
3. Expand country list beyond `US`/`QE-PPP` once reliable per-country simulator filename mapping is confirmed.
