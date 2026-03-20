import React, { useMemo, useState } from 'react';
import type { AddonContext } from '@wealthfolio/addon-sdk';
import { Alert, AlertDescription, AlertTitle, Badge } from '@wealthfolio/ui';
import { CompareControlsCard } from '../components/CompareControlsCard';
import { ComparisonTabsCard } from '../components/ComparisonTabsCard';
import { SummaryCards } from '../components/SummaryCards';
import { useCompareData } from '../hooks/useCompareData';
import { formatPercent } from '../lib/format';
import {
  adjustedSeries,
  buildAnnualIncomeSeries,
  buildAssetsCompositionData,
  buildComparisonAnalysis,
  buildInflationAdjustedWealthData,
  buildPercentileHistoryData,
  buildIncomeChartData,
  buildWealthChartData,
  computeAnnualIncome,
  getSeriesForVariable,
} from '../lib/metrics';
import { toYearlyLast } from '../lib/portfolio';
import { TIME_SPANS } from '../lib/constants';
import { getDefaultCountry, getLatestValue, getNeighborBins, getNeighborIncomeBins, locateFineIncomeBinByValue, locateFineWealthBinByValue, locateIncomePercentileBinByValue, locateWealthPercentileBinByValue } from '../lib/wid';
import { TOTAL_ACCOUNT_ID } from '../hooks/useCompareData';
import type { TimeSpanOption, ViewTab, WidVariable } from '../types/compare';

export function CompareDashboardPage({ ctx }: { ctx: AddonContext }) {
  const [selectedCountry, setSelectedCountry] = useState<string>(() => localStorage.getItem('wfc_country') ?? getDefaultCountry());
  const [selectedAccountId, setSelectedAccountId] = useState<string>(TOTAL_ACCOUNT_ID);
  const [householdSize, setHouseholdSize] = useState<number>(1);
  const [timeSpan, setTimeSpan] = useState<TimeSpanOption>(TIME_SPANS[2]);
  const [activeTab, setActiveTab] = useState<ViewTab>('wealth');

  const { loading, error, baseCurrency, accountOptions, portfolioPoints, widDataset } = useCompareData(
    ctx,
    selectedCountry,
    timeSpan.years,
    selectedAccountId,
    householdSize,
  );

  const adjustedPortfolioSeries = useMemo(
    () => adjustedSeries(toYearlyLast(portfolioPoints), householdSize),
    [portfolioPoints, householdSize],
  );

  const latestPortfolioValue = adjustedPortfolioSeries.at(-1)?.value ?? null;
  const annualIncomeSeries = useMemo(
    () => buildAnnualIncomeSeries(adjustedPortfolioSeries),
    [adjustedPortfolioSeries],
  );

  const annualIncome = useMemo(
    () => computeAnnualIncome(adjustedPortfolioSeries),
    [adjustedPortfolioSeries],
  );

  const benchmarkBin = useMemo(
    () => locateWealthPercentileBinByValue(widDataset, latestPortfolioValue),
    [widDataset, latestPortfolioValue],
  );

  const incomeBenchmarkBin = useMemo(
    () => locateIncomePercentileBinByValue(widDataset, annualIncome),
    [widDataset, annualIncome],
  );

  const fineWealthBin = useMemo(
    () => locateFineWealthBinByValue(widDataset, benchmarkBin, latestPortfolioValue),
    [widDataset, benchmarkBin, latestPortfolioValue],
  );

  const fineIncomeBin = useMemo(
    () => locateFineIncomeBinByValue(widDataset, incomeBenchmarkBin, annualIncome),
    [widDataset, incomeBenchmarkBin, annualIncome],
  );

  const incomeAtWealthLookup = useMemo(() => {
    if (!widDataset) {
      return { value: null as number | null, label: 'N/A' };
    }

    if (fineWealthBin) {
      const fineVariable = `aptinc_p${fineWealthBin.from}p${fineWealthBin.to}_999_j` as const;
      const fineValue = getLatestValue(widDataset.seriesByVariable[fineVariable]?.points ?? []);
      if (fineValue !== null) {
        return { value: fineValue, label: fineWealthBin.label };
      }
    }

    if (benchmarkBin) {
      const coarseVariable = `aptinc_p${benchmarkBin.from}p${benchmarkBin.to}_999_j` as const;
      const coarseValue = getLatestValue(widDataset.seriesByVariable[coarseVariable]?.points ?? []);
      return { value: coarseValue, label: benchmarkBin.label };
    }

    return { value: null as number | null, label: 'N/A' };
  }, [fineWealthBin, benchmarkBin, widDataset]);

  const incomeAtWealthPercentile = incomeAtWealthLookup.value;

  const wealthAtIncomeLookup = useMemo(() => {
    if (!widDataset) {
      return { value: null as number | null, label: 'N/A' };
    }

    if (fineIncomeBin) {
      const fineVariable = `ahweal_p${fineIncomeBin.from}p${fineIncomeBin.to}_999_j` as const;
      const fineValue = getLatestValue(widDataset.seriesByVariable[fineVariable]?.points ?? []);
      if (fineValue !== null) {
        return { value: fineValue, label: fineIncomeBin.label };
      }
    }

    if (incomeBenchmarkBin) {
      const coarseVariable = `ahweal_p${incomeBenchmarkBin.from}p${incomeBenchmarkBin.to}_999_j` as const;
      const coarseValue = getLatestValue(widDataset.seriesByVariable[coarseVariable]?.points ?? []);
      return { value: coarseValue, label: incomeBenchmarkBin.label };
    }

    return { value: null as number | null, label: 'N/A' };
  }, [fineIncomeBin, incomeBenchmarkBin, widDataset]);

  const wealthAtIncomePercentile = wealthAtIncomeLookup.value;
  const { lower: lowerBin, upper: upperBin } = useMemo(() => getNeighborBins(benchmarkBin), [benchmarkBin]);
  const { lower: lowerIncomeBin, upper: upperIncomeBin } = useMemo(() => getNeighborIncomeBins(incomeBenchmarkBin), [incomeBenchmarkBin]);

  const wealthBenchmarkSeries = getSeriesForVariable(widDataset, benchmarkBin?.variable ?? 'ahweal_p50p60_999_j');
  const lowerBenchmarkSeries = getSeriesForVariable(widDataset, lowerBin?.variable ?? 'ahweal_p40p50_999_j');
  const upperBenchmarkSeries = getSeriesForVariable(widDataset, upperBin?.variable ?? 'ahweal_p60p70_999_j');
  const countryAverageWealthSeries = getSeriesForVariable(widDataset, 'ahweal_p50p60_999_j');
  const countryAverageIncomeSeries = getSeriesForVariable(widDataset, 'aptinc_p0p100_999_j');
  const incomeBenchmarkSeries = getSeriesForVariable(widDataset, incomeBenchmarkBin?.variable ?? 'aptinc_p50p60_999_j');
  const lowerIncomeBenchmarkSeries = getSeriesForVariable(widDataset, lowerIncomeBin?.variable ?? 'aptinc_p40p50_999_j');
  const upperIncomeBenchmarkSeries = getSeriesForVariable(widDataset, upperIncomeBin?.variable ?? 'aptinc_p60p70_999_j');
  function getBracketAssetSeries(prefix: 'ahwcud' | 'ahwbol' | 'ahweqi', bin: typeof benchmarkBin) {
    if (bin) {
      const byJ = getSeriesForVariable(widDataset, `${prefix}_p${bin.from}p${bin.to}_999_j` as WidVariable);
      if (byJ.length > 0) return byJ;
      const byI = getSeriesForVariable(widDataset, `${prefix}_p${bin.from}p${bin.to}_999_i` as WidVariable);
      if (byI.length > 0) return byI;
    }
    return getSeriesForVariable(widDataset, `${prefix}_p0p100_999_i` as WidVariable);
  }

  const depositsSeries = getBracketAssetSeries('ahwcud', benchmarkBin);
  const bondsLoansSeries = getBracketAssetSeries('ahwbol', benchmarkBin);
  const equitiesSeries = getBracketAssetSeries('ahweqi', benchmarkBin);

  const analysis = useMemo(
    () => buildComparisonAnalysis(widDataset, benchmarkBin, latestPortfolioValue),
    [widDataset, benchmarkBin, latestPortfolioValue],
  );

  const wealthChartData = useMemo(
    () =>
      buildWealthChartData(
        adjustedPortfolioSeries,
        wealthBenchmarkSeries,
        lowerBenchmarkSeries,
        upperBenchmarkSeries,
        countryAverageWealthSeries,
      ),
    [adjustedPortfolioSeries, wealthBenchmarkSeries, lowerBenchmarkSeries, upperBenchmarkSeries, countryAverageWealthSeries],
  );

  const incomeChartData = useMemo(
    () => buildIncomeChartData(annualIncomeSeries, incomeBenchmarkSeries, lowerIncomeBenchmarkSeries, upperIncomeBenchmarkSeries, countryAverageIncomeSeries),
    [annualIncomeSeries, incomeBenchmarkSeries, lowerIncomeBenchmarkSeries, upperIncomeBenchmarkSeries, countryAverageIncomeSeries],
  );

  const realNominalData = useMemo(
    () => buildAssetsCompositionData(depositsSeries, bondsLoansSeries, equitiesSeries),
    [depositsSeries, bondsLoansSeries, equitiesSeries],
  );

  const percentileHistoryData = useMemo(
    () => buildPercentileHistoryData(widDataset, adjustedPortfolioSeries),
    [widDataset, adjustedPortfolioSeries],
  );

  const priceIndexSeries = getSeriesForVariable(widDataset, 'inyixx_p0p100_999_i');

  const inflationAdjustedData = useMemo(
    () => buildInflationAdjustedWealthData(adjustedPortfolioSeries, priceIndexSeries),
    [adjustedPortfolioSeries, priceIndexSeries],
  );

  const benchmarkLabel = benchmarkBin?.label ?? 'N/A';
  const lowerBenchmarkLabel = lowerBin?.label ?? 'N/A';
  const upperBenchmarkLabel = upperBin?.label ?? 'N/A';
  const incomeBenchmarkLabel = incomeBenchmarkBin?.label ?? 'N/A';
  const lowerIncomeBenchmarkLabel = lowerIncomeBin?.label ?? 'N/A';
  const upperIncomeBenchmarkLabel = upperIncomeBin?.label ?? 'N/A';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Wealthfolio Compare</h1>
          <p className="text-sm text-muted-foreground">
            Compare your historical household-adjusted portfolio against WID wealth and income API data only.
          </p>
        </div>
        <Badge variant="secondary">Data source: WID kl-cl-conversion API + Wealthfolio API</Badge>
      </div>

      <CompareControlsCard
        selectedCountry={selectedCountry}
        selectedAccountId={selectedAccountId}
        accountOptions={accountOptions}
        householdSize={householdSize}
        timeSpan={timeSpan}
        onCountryChange={(c) => { localStorage.setItem('wfc_country', c); setSelectedCountry(c); }}
        onAccountChange={setSelectedAccountId}
        onHouseholdSizeChange={setHouseholdSize}
        onTimeSpanChange={setTimeSpan}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Load Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <SummaryCards
        selectedCountry={selectedCountry}
        baseCurrency={baseCurrency}
        fineWealthBinLabel={fineWealthBin?.label ?? benchmarkBin?.label ?? 'N/A'}
        fineIncomeBinLabel={fineIncomeBin?.label ?? incomeBenchmarkBin?.label ?? 'N/A'}
        wealthBracketLabelForIncomeCard={incomeAtWealthLookup.label}
        incomeBracketLabelForWealthCard={wealthAtIncomeLookup.label}
        incomeAtWealthPercentile={incomeAtWealthPercentile}
        wealthAtIncomePercentile={wealthAtIncomePercentile}
        userIncome={annualIncome}
        userWealth={latestPortfolioValue}
      />

      <ComparisonTabsCard
        activeTab={activeTab}
        onTabChange={setActiveTab}
        loading={loading}
        selectedCountry={selectedCountry}
        benchmarkLabel={benchmarkLabel}
        lowerBenchmarkLabel={lowerBenchmarkLabel}
        upperBenchmarkLabel={upperBenchmarkLabel}
        incomeBenchmarkLabel={incomeBenchmarkLabel}
        lowerIncomeBenchmarkLabel={lowerIncomeBenchmarkLabel}
        upperIncomeBenchmarkLabel={upperIncomeBenchmarkLabel}
        wealthChartData={wealthChartData}
        incomeChartData={incomeChartData}
        realNominalData={realNominalData}
        percentileHistoryData={percentileHistoryData}
        inflationAdjustedData={inflationAdjustedData}
      />
    </div>
  );
}
