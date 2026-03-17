import { useEffect, useState } from 'react';
import type { AddonContext } from '@wealthfolio/addon-sdk';
import { toYearlyLast, toYearlyPortfolioPoints } from '../lib/portfolio';
import {
  buildFineBinVariables,
  buildFineIncomeBinVariables,
  extrapolateWidDataset,
  fetchWidDataset,
  locateIncomePercentileBinByValue,
  locateWealthPercentileBinByValue,
} from '../lib/wid';
import type { AccountOption, CompareDataState, StatusEntry, WidVariable } from '../types/compare';

export const TOTAL_ACCOUNT_ID = 'TOTAL';

const TOTAL_ACCOUNT_OPTION: AccountOption = {
  id: TOTAL_ACCOUNT_ID,
  label: 'Total (all accounts)',
};

function toApiDate(date: Date): string {
  // Wealthfolio history endpoint expects YYYY-MM-DD dates.
  return date.toISOString().slice(0, 10);
}

const INITIAL_STATE: CompareDataState = {
  loading: true,
  error: null,
  baseCurrency: 'USD',
  accountOptions: [TOTAL_ACCOUNT_OPTION],
  portfolioPoints: [],
  incomeSummary: [],
  widDataset: null,
  statusEntries: [],
};

export function useCompareData(
  ctx: AddonContext,
  selectedCountry: string,
  years: number,
  selectedAccountId: string,
  householdSize: number,
): CompareDataState {
  const [state, setState] = useState<CompareDataState>(INITIAL_STATE);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        if (mounted) {
          setState((current) => ({ ...current, loading: true, error: null }));
        }

        const today = new Date();
        const start = new Date(today);
        start.setFullYear(today.getFullYear() - years);
        const startDate = toApiDate(start);
        const endDate = toApiDate(today);

        const accounts = await ctx.api.accounts.getAll();
        const accountOptions: AccountOption[] = [
          TOTAL_ACCOUNT_OPTION,
          ...accounts.map((account) => ({
            id: account.id,
            label: account.name,
          })),
        ];

        if (mounted) {
          setState((current) => ({ ...current, accountOptions }));
        }

        const [settings, valuations] = await Promise.all([
          ctx.api.settings.get(),
          ctx.api.portfolio.getHistoricalValuations(selectedAccountId, startDate, endDate),
        ]);

        const yearlyPortfolio = toYearlyLast(toYearlyPortfolioPoints(valuations));
        const latestPortfolioValue = yearlyPortfolio.at(-1)?.value ?? null;
        const prevPortfolioValue = yearlyPortfolio.length >= 2 ? yearlyPortfolio[yearlyPortfolio.length - 2]?.value ?? null : null;
        const householdAdjustedLatest =
          latestPortfolioValue !== null ? latestPortfolioValue / Math.max(1, Math.floor(householdSize)) : null;

        // Income = year-over-year portfolio change, household-adjusted
        const computedIncome =
          latestPortfolioValue !== null && prevPortfolioValue !== null
            ? (latestPortfolioValue - prevPortfolioValue) / Math.max(1, Math.floor(householdSize))
            : null;

        const targetYear = new Date().getFullYear();
        const rawInitialDataset = await fetchWidDataset(selectedCountry, years);
        const initialDataset = extrapolateWidDataset(rawInitialDataset, targetYear);

        const wealthCoarseBin = locateWealthPercentileBinByValue(initialDataset, householdAdjustedLatest);
        const incomeCoarseBin = locateIncomePercentileBinByValue(initialDataset, computedIncome);

        const bracketAssetVars: WidVariable[] = wealthCoarseBin ? [
          `ahwcud_p${wealthCoarseBin.from}p${wealthCoarseBin.to}_999_i`,
          `ahwbol_p${wealthCoarseBin.from}p${wealthCoarseBin.to}_999_i`,
          `ahweqi_p${wealthCoarseBin.from}p${wealthCoarseBin.to}_999_i`,
          `ahwcud_p${wealthCoarseBin.from}p${wealthCoarseBin.to}_999_j`,
          `ahwbol_p${wealthCoarseBin.from}p${wealthCoarseBin.to}_999_j`,
          `ahweqi_p${wealthCoarseBin.from}p${wealthCoarseBin.to}_999_j`,
        ] as WidVariable[] : [];

        // Fine wealth bins for user's wealth bracket (to pinpoint wealth percentile within 1 unit)
        // Fine income bins for user's income bracket (to pinpoint income percentile within 1 unit)
        // Cross: income fine bins spanning the wealth bracket range (to look up income at wealth percentile)
        // Cross: wealth fine bins spanning the income bracket range (to look up wealth at income percentile)
        const fineVariables: WidVariable[] = [
          ...(wealthCoarseBin ? buildFineBinVariables(wealthCoarseBin) : []),
          ...(incomeCoarseBin ? buildFineIncomeBinVariables(incomeCoarseBin) : []),
          ...(wealthCoarseBin ? buildFineIncomeBinVariables(wealthCoarseBin) : []),
          ...(incomeCoarseBin ? buildFineBinVariables(incomeCoarseBin) : []),
          ...bracketAssetVars,
        ];
        const uniqueFineVars = [...new Set(fineVariables)];

        const rawFinalDataset =
          uniqueFineVars.length > 0
            ? await fetchWidDataset(selectedCountry, years, uniqueFineVars)
            : rawInitialDataset;
        const widDataset = extrapolateWidDataset(rawFinalDataset, targetYear);

        if (!mounted) {
          return;
        }

        const statusEntries: StatusEntry[] = [];

        setState({
          loading: false,
          error: null,
          baseCurrency: settings.baseCurrency || 'USD',
          accountOptions,
          portfolioPoints: toYearlyPortfolioPoints(valuations),
          incomeSummary: [],
          widDataset,
          statusEntries,
        });
      } catch (loadErr) {
        const message = loadErr instanceof Error ? loadErr.message : 'Failed to load comparison data';
        ctx.api.logger.error(`wealthfolio-compare load failed: ${message}`);

        if (mounted) {
          setState((current) => ({ ...current, loading: false, error: message }));
        }
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, [ctx, selectedCountry, years, selectedAccountId, householdSize]);

  return state;
}
