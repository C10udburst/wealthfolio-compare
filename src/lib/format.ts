export function formatCurrency(value: number | null, currency: string): string {
  if (value === null || !Number.isFinite(value)) {
    return 'N/A';
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return 'N/A';
  }
  return `${value.toFixed(1)}%`;
}
