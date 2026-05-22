import { useEffect, useMemo, useState } from 'react';
import type { AddonContext } from '@wealthfolio/addon-sdk';
import type { Holding } from '@wealthfolio/addon-sdk';
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
  userAssetVars: { deposits: 0, bondsLoans: 0, equities: 0 },
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

        const allAccounts = await ctx.api.accounts.getAll();
        const accountOptions: AccountOption[] = [
          TOTAL_ACCOUNT_OPTION,
          ...allAccounts.map((account) => ({
            id: account.id,
            label: account.name,
          })),
        ];

        if (mounted) {
          setState((current) => ({ ...current, accountOptions }));
        }

        const [settings, valuations, holdings] = await Promise.all([
          ctx.api.settings.get(),
          ctx.api.portfolio.getHistoricalValuations(selectedAccountId, startDate, endDate),
          ctx.api.portfolio.getHoldings(selectedAccountId),
        ]);

        const userAssetVars = { deposits: 0, bondsLoans: 0, equities: 0 };
        const accountMap = new Map(allAccounts.map((a) => [a.id, a]));

        for (const h of holdings) {
          const val = h.marketValue.base;

          // Get category from instrument classifications if available
          const topLevelCategoryObj = (h.instrument as any)?.classifications?.assetClasses?.[0]?.topLevelCategory;
          const categoryId = topLevelCategoryObj?.id;

          if (h.holdingType === 'cash' || !h.instrument || categoryId === 'CASH') {
            userAssetVars.deposits += val;
          } else if (categoryId === 'EQUITY') {
            userAssetVars.equities += val;
          } else if (categoryId === 'FIXED_INCOME') {
            userAssetVars.bondsLoans += val;
          } else {
            // Broad bucket for Commodities, Crypto, etc.
            userAssetVars.equities += val;
          }
        }

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

        const medianWealthBin = initialDataset ? locateWealthPercentileBinByValue(initialDataset, householdAdjustedLatest) : null;
        const incomeCoarseBin = initialDataset ? locateIncomePercentileBinByValue(initialDataset, computedIncome) : null;

        const bracketAssetVars: WidVariable[] = medianWealthBin ? [
          `ahwcud_p${medianWealthBin.from}p${medianWealthBin.to}_999_i`,
          `ahwbol_p${medianWealthBin.from}p${medianWealthBin.to}_999_i`,
          `ahweqi_p${medianWealthBin.from}p${medianWealthBin.to}_999_i`,
          `ahwcud_p${medianWealthBin.from}p${medianWealthBin.to}_999_j`,
          `ahwbol_p${medianWealthBin.from}p${medianWealthBin.to}_999_j`,
          `ahweqi_p${medianWealthBin.from}p${medianWealthBin.to}_999_j`,
        ] as WidVariable[] : [
          'ahwcud_p50p60_999_j',
          'ahwbol_p50p60_999_j',
          'ahweqi_p50p60_999_j',
          'ahwcud_p50p60_999_i',
          'ahwbol_p50p60_999_i',
          'ahweqi_p50p60_999_i',
        ] as WidVariable[];

        // Fine wealth bins for user's wealth bracket (to pinpoint wealth percentile within 1 unit)
        // Fine income bins for user's income bracket (to pinpoint income percentile within 1 unit)
        // Cross: income fine bins spanning the wealth bracket range (to look up income at wealth percentile)
        // Cross: wealth fine bins spanning the income bracket range (to look up wealth at income percentile)
        const fineVariables: WidVariable[] = [
          ...(medianWealthBin ? buildFineBinVariables(medianWealthBin) : []),
          ...(incomeCoarseBin ? buildFineIncomeBinVariables(incomeCoarseBin) : []),
          ...(medianWealthBin ? buildFineIncomeBinVariables(medianWealthBin) : []),
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
          userAssetVars,
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
