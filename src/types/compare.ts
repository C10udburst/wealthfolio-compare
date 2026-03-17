import type { IncomeSummary } from '@wealthfolio/addon-sdk';

export type ViewTab = 'wealth' | 'income' | 'real-nominal' | 'percentile-history';

export type TimeSpanOption = {
  label: '1Y' | '3Y' | '5Y' | '10Y';
  years: number;
};

export type AccountOption = {
  id: string;
  label: string;
};

export type DatePoint = {
  date: string;
  year: number;
  value: number;
};

export type YearPoint = {
  year: number;
  value: number;
};

export type WidVariable =
  | `ahweal_p${number}p${number}_999_j`
  | `aptinc_p${number}p${number}_999_j`
  | `ahwcud_p${number}p${number}_999_i`
  | `ahwbol_p${number}p${number}_999_i`
  | `ahweqi_p${number}p${number}_999_i`
  | `ahwcud_p${number}p${number}_999_j`
  | `ahwbol_p${number}p${number}_999_j`
  | `ahweqi_p${number}p${number}_999_j`;

export type WidPercentileBin = {
  variable: WidVariable;
  label: string;
  from: number;
  to: number;
};

export type WidMeta = {
  unit: string | null;
  unitSymbol: string | null;
  unitName: string | null;
};

export type WidSeries = {
  variable: WidVariable;
  points: YearPoint[];
  meta: WidMeta;
};

export type WidDataset = {
  country: string;
  requestedVariables: WidVariable[];
  seriesByVariable: Partial<Record<WidVariable, WidSeries>>;
};

export type StatusEntry = {
  id: string;
  found: boolean;
  url: string;
};

export type WealthChartRow = {
  year: number;
  portfolio: number | null;
  benchmarkPercentile: number | null;
  lowerBenchmarkPercentile: number | null;
  upperBenchmarkPercentile: number | null;
  countryAverage: number | null;
};

export type IncomeChartRow = {
  year: number;
  portfolioIncome: number | null;
  incomeBenchmarkPercentile: number | null;
  lowerIncomeBenchmarkPercentile: number | null;
  upperIncomeBenchmarkPercentile: number | null;
  countryAverage: number | null;
};

export type RealNominalRow = {
  year: number;
  deposits: number | null;
  bondsLoans: number | null;
  equities: number | null;
};

export type GrowthRow = {
  year: number;
  portfolioGrowth: number | null;
  benchmarkGrowth: number | null;
  lowerBenchmarkGrowth: number | null;
  upperBenchmarkGrowth: number | null;
};

export type PercentileHistoryRow = {
  year: number;
  percentile: number | null;
};

export type ComparisonAnalysis = {
  benchmarkBin: WidPercentileBin | null;
  benchmarkWealthLatest: number | null;
  averageWealthLatest: number | null;
  benchmarkGapValue: number | null;
  benchmarkGapPercent: number | null;
  countryAverageIncomeLatest: number | null;
};

export type CompareDataState = {
  loading: boolean;
  error: string | null;
  baseCurrency: string;
  accountOptions: AccountOption[];
  portfolioPoints: DatePoint[];
  incomeSummary: IncomeSummary[];
  widDataset: WidDataset | null;
  statusEntries: StatusEntry[];
};
