import { COUNTRY_OPTIONS, WID_BASE_URL } from './constants';
import type { WidDataset, WidMeta, WidPercentileBin, WidSeries, WidVariable, YearPoint } from '../types/compare';

function linearRegressionSlope(points: YearPoint[]): number {
  if (points.length < 2) return 0;
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.year, 0);
  const sumY = points.reduce((s, p) => s + p.value, 0);
  const sumXY = points.reduce((s, p) => s + p.year * p.value, 0);
  const sumX2 = points.reduce((s, p) => s + p.year * p.year, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

function extrapolateSeries(points: YearPoint[], targetYear: number): YearPoint[] {
  if (points.length === 0) return points;
  const last = points[points.length - 1];
  if (last.year >= targetYear) return points;
  const slope = linearRegressionSlope(points);
  const result = [...points];
  for (let year = last.year + 1; year <= targetYear; year++) {
    result.push({ year, value: Math.max(0, last.value + slope * (year - last.year)) });
  }
  return result;
}

export function extrapolateWidDataset(dataset: WidDataset, targetYear: number): WidDataset {
  const seriesByVariable: WidDataset['seriesByVariable'] = {};
  for (const key of Object.keys(dataset.seriesByVariable) as WidVariable[]) {
    const series = dataset.seriesByVariable[key];
    if (series) {
      seriesByVariable[key] = { ...series, points: extrapolateSeries(series.points, targetYear) };
    }
  }
  return { ...dataset, seriesByVariable };
}

export const WID_PERCENTILE_BINS: WidPercentileBin[] = [
  { variable: 'ahweal_p0p10_999_j', label: 'P0-P10', from: 0, to: 10 },
  { variable: 'ahweal_p10p20_999_j', label: 'P10-P20', from: 10, to: 20 },
  { variable: 'ahweal_p20p30_999_j', label: 'P20-P30', from: 20, to: 30 },
  { variable: 'ahweal_p30p40_999_j', label: 'P30-P40', from: 30, to: 40 },
  { variable: 'ahweal_p40p50_999_j', label: 'P40-P50', from: 40, to: 50 },
  { variable: 'ahweal_p50p60_999_j', label: 'P50-P60', from: 50, to: 60 },
  { variable: 'ahweal_p60p70_999_j', label: 'P60-P70', from: 60, to: 70 },
  { variable: 'ahweal_p70p80_999_j', label: 'P70-P80', from: 70, to: 80 },
  { variable: 'ahweal_p80p90_999_j', label: 'P80-P90', from: 80, to: 90 },
  { variable: 'ahweal_p90p100_999_j', label: 'P90-P100', from: 90, to: 100 },
];

export const WID_INCOME_PERCENTILE_BINS: WidPercentileBin[] = [
  { variable: 'aptinc_p0p10_999_j', label: 'P0-P10', from: 0, to: 10 },
  { variable: 'aptinc_p10p20_999_j', label: 'P10-P20', from: 10, to: 20 },
  { variable: 'aptinc_p20p30_999_j', label: 'P20-P30', from: 20, to: 30 },
  { variable: 'aptinc_p30p40_999_j', label: 'P30-P40', from: 30, to: 40 },
  { variable: 'aptinc_p40p50_999_j', label: 'P40-P50', from: 40, to: 50 },
  { variable: 'aptinc_p50p60_999_j', label: 'P50-P60', from: 50, to: 60 },
  { variable: 'aptinc_p60p70_999_j', label: 'P60-P70', from: 60, to: 70 },
  { variable: 'aptinc_p70p80_999_j', label: 'P70-P80', from: 70, to: 80 },
  { variable: 'aptinc_p80p90_999_j', label: 'P80-P90', from: 80, to: 90 },
  { variable: 'aptinc_p90p100_999_j', label: 'P90-P100', from: 90, to: 100 },
];

export const WID_REQUIRED_VARIABLES: WidVariable[] = [
  ...WID_PERCENTILE_BINS.map((bin) => bin.variable),
  ...WID_INCOME_PERCENTILE_BINS.map((bin) => bin.variable),
  'aptinc_p0p100_999_j',
  'ahwcud_p0p100_999_i',
  'ahwbol_p0p100_999_i',
  'ahweqi_p0p100_999_i',
];

type WidApiValueRow = { y?: unknown; v?: unknown };
type WidApiNode = {
  meta?: {
    unit?: unknown;
    unit_symbol?: unknown;
    unit_name?: unknown;
  };
  values?: unknown;
};

type WidApiRoot = Partial<Record<WidVariable, unknown>>;

const LANGUAGE_TO_COUNTRY: Record<string, string> = {
  en: 'US',
  pl: 'PL',
  de: 'DE',
  fr: 'FR',
  ja: 'JP',
};

export function getDefaultCountry(): string {
  try {
    const locales = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : ['en-US'];

    for (const locale of locales) {
      const normalized = String(locale || '').trim();
      const region = normalized.split('-')[1]?.toUpperCase();
      if (region && COUNTRY_OPTIONS.includes(region)) {
        return region;
      }

      const language = normalized.split('-')[0]?.toLowerCase();
      const mappedCountry = language ? LANGUAGE_TO_COUNTRY[language] : null;
      if (mappedCountry && COUNTRY_OPTIONS.includes(mappedCountry)) {
        return mappedCountry;
      }
    }

    return 'US';
  } catch {
    return 'US';
  }
}

function makeWealthVariable(from: number, to: number): WidVariable {
  return `ahweal_p${from}p${to}_999_j`;
}

function makeIncomeVariable(from: number, to: number): WidVariable {
  return `aptinc_p${from}p${to}_999_j`;
}

export function buildFineBinVariables(bin: WidPercentileBin): WidVariable[] {
  const variables: WidVariable[] = [];
  for (let percentile = bin.from; percentile < bin.to; percentile += 1) {
    variables.push(makeWealthVariable(percentile, percentile + 1));
  }
  return variables;
}

export function buildFineIncomeBinVariables(bin: WidPercentileBin): WidVariable[] {
  const variables: WidVariable[] = [];
  for (let percentile = bin.from; percentile < bin.to; percentile += 1) {
    variables.push(makeIncomeVariable(percentile, percentile + 1));
  }
  return variables;
}

function getNeighborBinsFromList(
  bin: WidPercentileBin | null,
  binList: WidPercentileBin[],
): { lower: WidPercentileBin | null; upper: WidPercentileBin | null } {
  if (!bin) {
    return { lower: null, upper: null };
  }
  const index = binList.findIndex((entry) => entry.variable === bin.variable);
  if (index < 0) {
    return { lower: null, upper: null };
  }
  return {
    lower: binList[index - 1] ?? null,
    upper: binList[index + 1] ?? null,
  };
}

export function getNeighborBins(bin: WidPercentileBin | null) {
  return getNeighborBinsFromList(bin, WID_PERCENTILE_BINS);
}

export function getNeighborIncomeBins(bin: WidPercentileBin | null) {
  return getNeighborBinsFromList(bin, WID_INCOME_PERCENTILE_BINS);
}

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function parseValues(values: unknown): YearPoint[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((row) => {
      const valueRow = row as WidApiValueRow;
      const year = Number(valueRow.y);
      const value = Number(valueRow.v);
      if (!Number.isFinite(year) || !Number.isFinite(value)) {
        return null;
      }

      return { year, value };
    })
    .filter((row): row is YearPoint => row !== null)
    .sort((a, b) => a.year - b.year);
}

function truncateByYears(points: YearPoint[], years: number): YearPoint[] {
  if (points.length === 0 || years <= 0) {
    return points;
  }

  const maxYear = points[points.length - 1]?.year ?? 0;
  const startYear = maxYear - years + 1;
  return points.filter((point) => point.year >= startYear);
}

function parseMeta(node: WidApiNode | null): WidMeta {
  return {
    unit: asText(node?.meta?.unit),
    unitSymbol: asText(node?.meta?.unit_symbol),
    unitName: asText(node?.meta?.unit_name),
  };
}

function parseVariableSeries(rawVariableNode: unknown, country: string, years: number): Omit<WidSeries, 'variable'> | null {
  if (!Array.isArray(rawVariableNode)) {
    return null;
  }

  const firstContainer = rawVariableNode.find((entry) => entry && typeof entry === 'object') as Record<string, unknown> | undefined;
  if (!firstContainer || !firstContainer[country] || typeof firstContainer[country] !== 'object') {
    return null;
  }

  const countryNode = firstContainer[country] as WidApiNode;
  const points = truncateByYears(parseValues(countryNode.values), years);
  return {
    points,
    meta: parseMeta(countryNode),
  };
}

export function buildWidApiUrl(country: string, variables: WidVariable[]): string {
  const baseYear = Math.min(new Date().getFullYear(), 2024);
  const params = new URLSearchParams({
    countries: country,
    variables: variables.join(','),
    currency: 'cc',
    exchange: 'x',
    base: 'c',
    base_year: String(baseYear),
    decomposition: 'false',
  });
  return `${WID_BASE_URL}?${params.toString()}`;
}

async function fetchWidPayload(country: string, variables: WidVariable[]): Promise<WidApiRoot> {
  const url = buildWidApiUrl(country, variables);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`WID API request failed (${response.status})`);
  }

  return (await response.json()) as WidApiRoot;
}

export async function fetchWidDataset(country: string, years: number, additionalVariables: WidVariable[] = []): Promise<WidDataset> {
  const requestedVariables = [...new Set([...WID_REQUIRED_VARIABLES, ...additionalVariables])];
  const rawData = await fetchWidPayload(country, requestedVariables);
  const seriesByVariable: WidDataset['seriesByVariable'] = {};

  for (const variable of requestedVariables) {
    const parsed = parseVariableSeries(rawData[variable], country, years);
    if (parsed) {
      seriesByVariable[variable] = {
        variable,
        points: parsed.points,
        meta: parsed.meta,
      };
    }
  }

  return {
    country,
    requestedVariables,
    seriesByVariable,
  };
}

export function getLatestValue(points: YearPoint[]): number | null {
  if (points.length === 0) {
    return null;
  }
  return points[points.length - 1]?.value ?? null;
}

function locateBinInList(
  bins: WidPercentileBin[],
  dataset: WidDataset,
  value: number,
): WidPercentileBin | null {
  const binValues = bins
    .map((bin) => {
      const latest = getLatestValue(dataset.seriesByVariable[bin.variable]?.points ?? []);
      return { bin, value: latest };
    })
    .filter((entry): entry is { bin: WidPercentileBin; value: number } => entry.value !== null && Number.isFinite(entry.value));

  if (binValues.length === 0) {
    return null;
  }

  let left = 0;
  let right = binValues.length - 1;
  let candidate = binValues[0].bin;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const current = binValues[mid];

    if (value >= current.value) {
      candidate = current.bin;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return candidate;
}

export function locateWealthPercentileBinByValue(dataset: WidDataset | null, wealthValue: number | null): WidPercentileBin | null {
  if (!dataset || wealthValue === null || !Number.isFinite(wealthValue)) {
    return null;
  }
  return locateBinInList(WID_PERCENTILE_BINS, dataset, wealthValue);
}

export function locateIncomePercentileBinByValue(dataset: WidDataset | null, incomeValue: number | null): WidPercentileBin | null {
  if (!dataset || incomeValue === null || !Number.isFinite(incomeValue)) {
    return null;
  }
  return locateBinInList(WID_INCOME_PERCENTILE_BINS, dataset, incomeValue);
}

export function locateFineWealthBinByValue(
  dataset: WidDataset | null,
  coarseBin: WidPercentileBin | null,
  value: number | null,
): WidPercentileBin | null {
  if (!dataset || !coarseBin || value === null || !Number.isFinite(value)) {
    return null;
  }
  const fineBins: WidPercentileBin[] = [];
  for (let p = coarseBin.from; p < coarseBin.to; p++) {
    fineBins.push({ variable: makeWealthVariable(p, p + 1), label: `P${p}-P${p + 1}`, from: p, to: p + 1 });
  }
  return locateBinInList(fineBins, dataset, value);
}

export function locateFineIncomeBinByValue(
  dataset: WidDataset | null,
  coarseBin: WidPercentileBin | null,
  value: number | null,
): WidPercentileBin | null {
  if (!dataset || !coarseBin || value === null || !Number.isFinite(value)) {
    return null;
  }
  const fineBins: WidPercentileBin[] = [];
  for (let p = coarseBin.from; p < coarseBin.to; p++) {
    fineBins.push({ variable: makeIncomeVariable(p, p + 1), label: `P${p}-P${p + 1}`, from: p, to: p + 1 });
  }

  // Try exact lookup from fetched fine-grain data first.
  const exact = locateBinInList(fineBins, dataset, value);
  if (exact) return exact;

  // WID often lacks 1-unit income bins, so fall back to linear interpolation
  // within the coarse bin using the neighbouring coarse bin averages as bounds.
  const { lower: prevCoarseBin, upper: nextCoarseBin } = getNeighborBinsFromList(coarseBin, WID_INCOME_PERCENTILE_BINS);
  const prevValue = prevCoarseBin ? getLatestValue(dataset.seriesByVariable[prevCoarseBin.variable]?.points ?? []) : null;
  const nextValue = nextCoarseBin ? getLatestValue(dataset.seriesByVariable[nextCoarseBin.variable]?.points ?? []) : null;
  const currValue = getLatestValue(dataset.seriesByVariable[coarseBin.variable]?.points ?? []);

  let lowerBound: number | null;
  let upperBound: number | null;
  if (prevValue !== null && nextValue !== null) {
    lowerBound = prevValue;
    upperBound = nextValue;
  } else if (prevValue !== null && currValue !== null) {
    lowerBound = prevValue;
    upperBound = currValue + (currValue - prevValue);
  } else if (nextValue !== null && currValue !== null) {
    lowerBound = currValue - (nextValue - currValue);
    upperBound = nextValue;
  } else {
    lowerBound = null;
    upperBound = null;
  }

  if (lowerBound === null || upperBound === null || upperBound <= lowerBound) {
    return null;
  }

  const t = Math.max(0, Math.min(1, (value - lowerBound) / (upperBound - lowerBound)));
  const binWidth = coarseBin.to - coarseBin.from;
  const estimatedFrom = Math.max(coarseBin.from, Math.min(coarseBin.to - 1, coarseBin.from + Math.floor(t * binWidth)));
  return {
    variable: makeIncomeVariable(estimatedFrom, estimatedFrom + 1),
    label: `P${estimatedFrom}-P${estimatedFrom + 1}`,
    from: estimatedFrom,
    to: estimatedFrom + 1,
  };
}
