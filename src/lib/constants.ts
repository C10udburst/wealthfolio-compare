import type { TimeSpanOption } from '../types/compare';

export const WID_BASE_URL = 'https://d3t2nddjdn2vht.cloudfront.net/prod/kl-cl-conversion';

export const COUNTRY_OPTIONS = ['US', 'PL', 'DE', 'FR', 'GB', 'CA', 'AU', 'JP'];

export const TIME_SPANS: TimeSpanOption[] = [
  { label: '1Y', years: 1 },
  { label: '5Y', years: 5 },
  { label: '10Y', years: 10 },
];
