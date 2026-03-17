import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@wealthfolio/ui';
import { formatCurrency } from '../lib/format';

type Props = {
  selectedCountry: string;
  baseCurrency: string;
  /** Fine wealth bin label, e.g. "P52-P53" */
  fineWealthBinLabel: string;
  /** Fine income bin label, e.g. "P45-P46" */
  fineIncomeBinLabel: string;
  /** Wealth label actually used for income API lookup, fine preferred (e.g. "P52-P53"), coarse fallback */
  wealthBracketLabelForIncomeCard: string;
  /** Income label actually used for wealth API lookup, fine preferred (e.g. "P45-P46"), coarse fallback */
  incomeBracketLabelForWealthCard: string;
  /** Latest WID income value at the user's wealth percentile position */
  incomeAtWealthPercentile: number | null;
  /** Latest WID wealth value at the user's income percentile position */
  wealthAtIncomePercentile: number | null;
  /** User's actual annual income (household-adjusted) */
  userIncome: number | null;
  /** User's actual portfolio value (household-adjusted) */
  userWealth: number | null;
};

function DiffLine({ diff, currency }: { diff: number | null; currency: string }) {
  if (diff === null || !Number.isFinite(diff)) {
    return null;
  }
  const isPositive = diff >= 0;
  const colorClass = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400';
  const prefix = isPositive ? '+' : '';
  return (
    <span className={`text-sm font-medium ${colorClass}`}>
      {prefix}
      {formatCurrency(diff, currency)} vs yours
    </span>
  );
}

export function SummaryCards({
  selectedCountry,
  baseCurrency,
  fineWealthBinLabel,
  fineIncomeBinLabel,
  wealthBracketLabelForIncomeCard,
  incomeBracketLabelForWealthCard,
  incomeAtWealthPercentile,
  wealthAtIncomePercentile,
  userIncome,
  userWealth,
}: Props) {
  const incomeDiff =
    userIncome !== null && incomeAtWealthPercentile !== null ? userIncome - incomeAtWealthPercentile : null;
  const wealthDiff =
    userWealth !== null && wealthAtIncomePercentile !== null ? userWealth - wealthAtIncomePercentile : null;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Closest Wealth Bracket ({selectedCountry})</CardDescription>
          <CardTitle>{fineWealthBinLabel}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          1-percentile-unit resolution via fine WID wealth bins.
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Closest Income Bracket ({selectedCountry})</CardDescription>
          <CardTitle>{fineIncomeBinLabel}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          1-percentile-unit resolution via fine WID income bins.
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Income at your wealth percentile</CardDescription>
          <CardTitle>{formatCurrency(incomeAtWealthPercentile, baseCurrency)}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground flex flex-col gap-1">
          <DiffLine diff={incomeDiff} currency={baseCurrency} />
          <span>WID income series for {wealthBracketLabelForIncomeCard} wealth position (fine, with coarse fallback).</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Wealth at your income percentile</CardDescription>
          <CardTitle>{formatCurrency(wealthAtIncomePercentile, baseCurrency)}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground flex flex-col gap-1">
          <DiffLine diff={wealthDiff} currency={baseCurrency} />
          <span>WID wealth series for {incomeBracketLabelForWealthCard} income position (fine, with coarse fallback).</span>
        </CardContent>
      </Card>
    </div>
  );
}
