import type { AccountValuation } from '@wealthfolio/addon-sdk';
import type { DatePoint, YearPoint } from '../types/compare';

export function toYearlyPortfolioPoints(valuations: AccountValuation[]): DatePoint[] {
  const byDate = new Map<string, number>();

  for (const row of valuations) {
    const current = byDate.get(row.valuationDate) ?? 0;
    byDate.set(row.valuationDate, current + row.totalValue);
  }

  return [...byDate.entries()]
    .map(([date, value]) => ({
      date,
      year: Number(date.slice(0, 4)),
      value,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function toYearlyLast(points: DatePoint[]): YearPoint[] {
  const byYear = new Map<number, number>();
  for (const point of points) {
    byYear.set(point.year, point.value);
  }

  return [...byYear.entries()]
    .map(([year, value]) => ({ year, value }))
    .sort((a, b) => a.year - b.year);
}
