import { Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '@wealthfolio/ui';
import { CartesianGrid, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from '@wealthfolio/ui/chart';
import type { ChartConfig } from '@wealthfolio/ui/chart';
import type { IncomeChartRow, PercentileHistoryRow, RealNominalRow, ViewTab, WealthChartRow } from '../types/compare';

type Props = {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  loading: boolean;
  selectedCountry: string;
  benchmarkLabel: string;
  lowerBenchmarkLabel: string;
  upperBenchmarkLabel: string;
  incomePercentileLabel: string;
  incomeBenchmarkLabel: string;
  lowerIncomeBenchmarkLabel: string;
  upperIncomeBenchmarkLabel: string;
  wealthChartData: WealthChartRow[];
  incomeChartData: IncomeChartRow[];
  realNominalData: RealNominalRow[];
  percentileHistoryData: PercentileHistoryRow[];
};

export function ComparisonTabsCard({
  activeTab,
  onTabChange,
  loading,
  selectedCountry,
  benchmarkLabel,
  lowerBenchmarkLabel,
  upperBenchmarkLabel,
  incomeBenchmarkLabel,
  lowerIncomeBenchmarkLabel,
  upperIncomeBenchmarkLabel,
  wealthChartData,
  incomeChartData,
  realNominalData,
  percentileHistoryData,
}: Props) {
  const chartConfig: ChartConfig = {
    portfolio: { label: 'Portfolio (Adjusted)', color: '#2a9d8f' },
    portfolioIncome: { label: 'Income (Adjusted)', color: '#2a9d8f' },
    incomeBenchmarkPercentile: { label: `Income Bin (${incomeBenchmarkLabel})`, color: '#264653' },
    lowerIncomeBenchmarkPercentile: { label: `Lower Income Bin (${lowerIncomeBenchmarkLabel})`, color: '#8ab17d' },
    upperIncomeBenchmarkPercentile: { label: `Upper Income Bin (${upperIncomeBenchmarkLabel})`, color: '#f4a261' },
    benchmarkPercentile: { label: `Wealth Bin (${benchmarkLabel})`, color: '#264653' },
    lowerBenchmarkPercentile: { label: `Lower Bin (${lowerBenchmarkLabel})`, color: '#8ab17d' },
    upperBenchmarkPercentile: { label: `Upper Bin (${upperBenchmarkLabel})`, color: '#f4a261' },
    countryAverage: { label: `Country Avg (${selectedCountry})`, color: '#e76f51' },
    deposits: { label: 'Currency & Deposits', color: '#264653' },
    bondsLoans: { label: 'Bonds & Loans', color: '#e76f51' },
    equities: { label: 'Equities', color: '#2a9d8f' },
    portfolioGrowth: { label: 'Portfolio Growth', color: '#264653' },
    percentile: { label: 'Historical Percentile', color: '#264653' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparison Views</CardTitle>
        <CardDescription>
          {loading ? 'Loading data...' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as ViewTab)}>
          <TabsList className="h-auto flex flex-wrap gap-1 w-full overflow-visible">
            <TabsTrigger value="wealth">Wealth %</TabsTrigger>
            <TabsTrigger value="income">Income %</TabsTrigger>
            <TabsTrigger value="real-nominal">Asset Mix</TabsTrigger>
            <TabsTrigger value="percentile-history">Percentile History</TabsTrigger>
          </TabsList>

          <TabsContent value="wealth" className="mt-4">
            <ChartContainer className="h-[360px] w-full" config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wealthChartData}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="portfolio" stroke="var(--color-portfolio)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="lowerBenchmarkPercentile" stroke="var(--color-lowerBenchmarkPercentile)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="benchmarkPercentile" stroke="var(--color-benchmarkPercentile)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="upperBenchmarkPercentile" stroke="var(--color-upperBenchmarkPercentile)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="countryAverage" stroke="var(--color-countryAverage)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="income" className="mt-4">
            <ChartContainer className="h-[360px] w-full" config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={incomeChartData}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="portfolioIncome" stroke="var(--color-portfolioIncome)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="lowerIncomeBenchmarkPercentile" stroke="var(--color-lowerIncomeBenchmarkPercentile)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="incomeBenchmarkPercentile" stroke="var(--color-incomeBenchmarkPercentile)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="upperIncomeBenchmarkPercentile" stroke="var(--color-upperIncomeBenchmarkPercentile)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="countryAverage" stroke="var(--color-countryAverage)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="real-nominal" className="mt-4">
            <ChartContainer className="h-[360px] w-full" config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={realNominalData}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="deposits" stroke="var(--color-deposits)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="bondsLoans" stroke="var(--color-bondsLoans)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="equities" stroke="var(--color-equities)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="percentile-history" className="mt-4">
            <ChartContainer className="h-[360px] w-full" config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={percentileHistoryData}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="year" />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="percentile" stroke="var(--color-percentile)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
