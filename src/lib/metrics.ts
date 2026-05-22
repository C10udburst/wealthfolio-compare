import type {
  ComparisonAnalysis,
  GrowthRow,
  IncomeChartRow,
  AssetMixRow,
  InflationAdjustedRow,
  PercentileHistoryRow,
  WidDataset,
  WidPercentileBin,
  WidSeries,
  WealthChartRow,
  YearPoint,
} from '../types/compare';
import { getLatestValue, getLatestValueAdjustedForCurrentYear } from './wid';

export function buildAssetMixData(
  userHoldings: { deposits: number; bondsLoans: number; equities: number },
  medianAssetVars: { deposits: number; bondsLoans: number; equities: number },
): AssetMixRow[] {
  const userTotal = userHoldings.deposits + userHoldings.bondsLoans + userHoldings.equities;
  const medianTotal = medianAssetVars.deposits + medianAssetVars.bondsLoans + medianAssetVars.equities;

  const userMix = {
    deposits: userTotal > 0 ? (userHoldings.deposits / userTotal) * 100 : 0,
    bondsLoans: userTotal > 0 ? (userHoldings.bondsLoans / userTotal) * 100 : 0,
    equities: userTotal > 0 ? (userHoldings.equities / userTotal) * 100 : 0,
  };

  const medianMix = {
    deposits: medianTotal > 0 ? (medianAssetVars.deposits / medianTotal) * 100 : 0,
    bondsLoans: medianTotal > 0 ? (medianAssetVars.bondsLoans / medianTotal) * 100 : 0,
    equities: medianTotal > 0 ? (medianAssetVars.equities / medianTotal) * 100 : 0,
  };

  return [
    {
      subject: 'Currency & Deposits',
      user: userMix.deposits,
      median: medianMix.deposits,
      userValue: userHoldings.deposits,
      medianValue: medianAssetVars.deposits,
      fullMark: 100,
    },
    {
      subject: 'Bonds & Loans',
      user: userMix.bondsLoans,
      median: medianMix.bondsLoans,
      userValue: userHoldings.bondsLoans,
      medianValue: medianAssetVars.bondsLoans,
      fullMark: 100,
    },
    {
      subject: 'Equities',
      user: userMix.equities,
      median: medianMix.equities,
      userValue: userHoldings.equities,
      medianValue: medianAssetVars.equities,
      fullMark: 100,
    },
  ];
}

export function estimatePercentile(amount: number, avgAmount: number | null): number | null {
  if (!Number.isFinite(amount) || !avgAmount || avgAmount <= 0) {
    return null;
  }

  const score = Math.max(0, Math.min(100, (amount / avgAmount) * 50));
  return Number(score.toFixed(1));
}

function mapByYear(points: YearPoint[]): Map<number, number> {
  return new Map(points.map((point) => [point.year, point.value]));
}

export function adjustedSeries(points: YearPoint[], householdSize: number): YearPoint[] {
  const adjusted = householdSize > 0 ? householdSize : 1;
  return points.map((point) => ({ year: point.year, value: point.value / adjusted }));
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

/**
 * Returns a per-year income series: each year's value is the portfolio delta
 * year-over-year. For the current partial year, the delta is scaled up by
 * daysInYear / daysElapsedSoFar to annualise it.
 */
export function buildAnnualIncomeSeries(adjustedYearlyPoints: YearPoint[]): YearPoint[] {
  if (adjustedYearlyPoints.length < 2) return [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const result: YearPoint[] = [];
  for (let i = 1; i < adjustedYearlyPoints.length; i++) {
    const cur = adjustedYearlyPoints[i];
    const prev = adjustedYearlyPoints[i - 1];
    let delta = cur.value - prev.value;
    if (cur.year === currentYear) {
      const startOfYear = new Date(currentYear, 0, 1);
      const daysElapsed = Math.max(1, (today.getTime() - startOfYear.getTime()) / 86_400_000);
      const daysInYear = isLeapYear(currentYear) ? 366 : 365;
      delta = delta * (daysInYear / daysElapsed);
    }
    result.push({ year: cur.year, value: delta });
  }
  return result;
}

/** Latest annualised income scalar (for summary cards). */
export function computeAnnualIncome(adjustedYearlyPoints: YearPoint[]): number | null {
  const series = buildAnnualIncomeSeries(adjustedYearlyPoints);
  if (series.length === 0) return null;
  return series[series.length - 1]?.value ?? null;
}

export function buildWealthChartData(
  adjustedPortfolioSeries: YearPoint[],
  wealthBenchmarkSeries: YearPoint[],
  wealthLowerBenchmarkSeries: YearPoint[],
  wealthUpperBenchmarkSeries: YearPoint[],
  wealthAverageSeries: YearPoint[],
): WealthChartRow[] {
  const years = new Set<number>();
  adjustedPortfolioSeries.forEach((row) => years.add(row.year));
  wealthBenchmarkSeries.forEach((row) => years.add(row.year));
  wealthLowerBenchmarkSeries.forEach((row) => years.add(row.year));
  wealthUpperBenchmarkSeries.forEach((row) => years.add(row.year));
  wealthAverageSeries.forEach((row) => years.add(row.year));

  const portfolioByYear = new Map(adjustedPortfolioSeries.map((row) => [row.year, row.value]));
  const benchmarkByYear = mapByYear(wealthBenchmarkSeries);
  const lowerBenchmarkByYear = mapByYear(wealthLowerBenchmarkSeries);
  const upperBenchmarkByYear = mapByYear(wealthUpperBenchmarkSeries);
  const averageByYear = mapByYear(wealthAverageSeries);

  return [...years]
    .sort((a, b) => a - b)
    .map((year) => ({
      year,
      portfolio: portfolioByYear.get(year) ?? null,
      benchmarkPercentile: benchmarkByYear.get(year) ?? null,
      lowerBenchmarkPercentile: lowerBenchmarkByYear.get(year) ?? null,
      upperBenchmarkPercentile: upperBenchmarkByYear.get(year) ?? null,
      countryAverage: averageByYear.get(year) ?? null,
    }));
}

export function buildIncomeChartData(
  annualIncomeSeries: YearPoint[],
  incomeBenchmarkSeries: YearPoint[],
  incomeLowerBenchmarkSeries: YearPoint[],
  incomeUpperBenchmarkSeries: YearPoint[],
  incomeAverageSeries: YearPoint[],
): IncomeChartRow[] {
  const years = new Set<number>();
  annualIncomeSeries.forEach((row) => years.add(row.year));
  incomeBenchmarkSeries.forEach((row) => years.add(row.year));
  incomeLowerBenchmarkSeries.forEach((row) => years.add(row.year));
  incomeUpperBenchmarkSeries.forEach((row) => years.add(row.year));
  incomeAverageSeries.forEach((row) => years.add(row.year));

  const portfolioIncomeByYear = mapByYear(annualIncomeSeries);
  const benchmarkByYear = mapByYear(incomeBenchmarkSeries);
  const lowerByYear = mapByYear(incomeLowerBenchmarkSeries);
  const upperByYear = mapByYear(incomeUpperBenchmarkSeries);
  const averageByYear = mapByYear(incomeAverageSeries);

  return [...years]
    .sort((a, b) => a - b)
    .map((year) => ({
      year,
      portfolioIncome: portfolioIncomeByYear.get(year) ?? null,
      incomeBenchmarkPercentile: benchmarkByYear.get(year) ?? null,
      lowerIncomeBenchmarkPercentile: lowerByYear.get(year) ?? null,
      upperIncomeBenchmarkPercentile: upperByYear.get(year) ?? null,
      countryAverage: averageByYear.get(year) ?? null,
    }));
}

function parsePercentileRange(variable: string): { from: number; to: number } | null {
  const match = /^ahweal_p(\d+)p(\d+)_999_j$/.exec(variable);
  if (!match) {
    return null;
  }

  return {
    from: Number(match[1]),
    to: Number(match[2]),
  };
}

function getValueAtYear(points: YearPoint[], year: number): number | null {
  const found = points.find((point) => point.year === year);
  return found ? found.value : null;
}

function locatePercentileWithinSeries(seriesList: WidSeries[], portfolioValue: number, year: number): number | null {
  const rows = seriesList
    .map((series) => {
      const range = parsePercentileRange(series.variable);
      const value = getValueAtYear(series.points, year);
      if (!range || value === null) {
        return null;
      }

      return { range, value };
    })
    .filter((row): row is { range: { from: number; to: number }; value: number } => row !== null)
    .sort((a, b) => a.range.from - b.range.from);

  if (rows.length === 0) {
    return null;
  }

  let selected = rows[0];
  for (const row of rows) {
    if (portfolioValue >= row.value) {
      selected = row;
    } else {
      break;
    }
  }

  const selectedIndex = rows.findIndex((row) => row.range.from === selected.range.from);
  const next = rows[selectedIndex + 1];
  if (!next || next.value === selected.value) {
    return selected.range.from;
  }

  const ratio = (portfolioValue - selected.value) / (next.value - selected.value);
  const boundedRatio = Math.max(0, Math.min(1, ratio));
  return selected.range.from + boundedRatio * (next.range.from - selected.range.from);
}

export function buildPercentileHistoryData(dataset: WidDataset | null, adjustedPortfolioSeries: YearPoint[]): PercentileHistoryRow[] {
  if (!dataset) {
    return [];
  }

  const allSeries = Object.values(dataset.seriesByVariable).filter((series): series is WidSeries => Boolean(series));
  const fineSeries = allSeries.filter((series) => {
    const range = parsePercentileRange(series.variable);
    return Boolean(range && range.to - range.from === 1);
  });
  const coarseSeries = allSeries.filter((series) => {
    const range = parsePercentileRange(series.variable);
    return Boolean(range && range.to - range.from >= 10);
  });

  return adjustedPortfolioSeries.map((portfolioPoint) => {
    const fromFine = locatePercentileWithinSeries(fineSeries, portfolioPoint.value, portfolioPoint.year);
    const fromCoarse = locatePercentileWithinSeries(coarseSeries, portfolioPoint.value, portfolioPoint.year);
    const percentile = fromFine ?? fromCoarse;

    return {
      year: portfolioPoint.year,
      percentile: percentile === null ? null : Number(percentile.toFixed(1)),
    };
  });
}

export function buildComparisonAnalysis(
  dataset: WidDataset | null,
  benchmarkBin: WidPercentileBin | null,
  latestPortfolioValue: number | null,
): ComparisonAnalysis {
  const benchmarkSeries = benchmarkBin ? dataset?.seriesByVariable[benchmarkBin.variable]?.points ?? [] : [];
  const benchmarkWealthLatest = getLatestValueAdjustedForCurrentYear(benchmarkSeries);
  const averageWealthLatest = getLatestValueAdjustedForCurrentYear(dataset?.seriesByVariable.ahweal_p50p60_999_j?.points ?? []);
  const countryAverageIncomeLatest = getLatestValueAdjustedForCurrentYear(dataset?.seriesByVariable.aptinc_p0p100_999_j?.points ?? []);

  const benchmarkGapValue =
    latestPortfolioValue !== null && benchmarkWealthLatest !== null
      ? latestPortfolioValue - benchmarkWealthLatest
      : null;

  const benchmarkGapPercent =
    benchmarkGapValue !== null && benchmarkWealthLatest !== null && benchmarkWealthLatest !== 0
      ? (benchmarkGapValue / benchmarkWealthLatest) * 100
      : null;

  return {
    benchmarkBin,
    benchmarkWealthLatest,
    averageWealthLatest,
    benchmarkGapValue,
    benchmarkGapPercent,
    countryAverageIncomeLatest,
  };
}

export function getSeriesForVariable(dataset: WidDataset | null, variable: keyof WidDataset['seriesByVariable']): YearPoint[] {
  if (!dataset) {
    return [];
  }
  return dataset.seriesByVariable[variable]?.points ?? [];
}

export function buildInflationAdjustedWealthData(
  adjustedPortfolioSeries: YearPoint[],
  priceIndexSeries: YearPoint[],
): InflationAdjustedRow[] {
  const years = new Set<number>();
  adjustedPortfolioSeries.forEach((row) => years.add(row.year));
  priceIndexSeries.forEach((row) => years.add(row.year));

  const portfolioByYear = mapByYear(adjustedPortfolioSeries);
  const priceIndexByYear = mapByYear(priceIndexSeries);

  return [...years]
    .sort((a, b) => a - b)
    .map((year) => {
      const nominalWealth = portfolioByYear.get(year) ?? null;
      const priceIndex = priceIndexByYear.get(year) ?? null;

      let inflationAdjustedWealth: number | null = null;
      if (nominalWealth !== null && priceIndex !== null && priceIndex > 0) {
        // Adjusting wealth to 2024 dollars (assuming price index of 1.0 = 2024)
        // inflationAdjustedWealth = nominalWealth / priceIndex
        inflationAdjustedWealth = nominalWealth / priceIndex;
      }

      return {
        year,
        nominalWealth,
        inflationAdjustedWealth,
        priceIndex,
      };
    });
}
