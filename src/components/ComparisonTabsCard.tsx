import { Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@wealthfolio/ui';
import { CartesianGrid, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, XAxis, YAxis } from '@wealthfolio/ui/chart';
import type { ChartConfig } from '@wealthfolio/ui/chart';
import type { AssetMixMode, AssetMixRow, InflationAdjustedRow, IncomeChartRow, PercentileHistoryRow, ViewTab, WealthChartRow } from '../types/compare';

type Props = {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  loading: boolean;
  selectedCountry: string;
  baseCurrency: string;
  assetMixMode: AssetMixMode;
  onAssetMixModeChange: (mode: AssetMixMode) => void;
  benchmarkLabel: string;
  lowerBenchmarkLabel: string;
  upperBenchmarkLabel: string;
  incomePercentileLabel: string;
  incomeBenchmarkLabel: string;
  lowerIncomeBenchmarkLabel: string;
  upperIncomeBenchmarkLabel: string;
  wealthChartData: WealthChartRow[];
  incomeChartData: IncomeChartRow[];
  assetMixData: AssetMixRow[];
  percentileHistoryData: PercentileHistoryRow[];
  inflationAdjustedData: InflationAdjustedRow[];
};

export function ComparisonTabsCard({
  activeTab,
  onTabChange,
  loading,
  selectedCountry,
  baseCurrency,
  assetMixMode,
  onAssetMixModeChange,
  benchmarkLabel,
  lowerBenchmarkLabel,
  upperBenchmarkLabel,
  incomePercentileLabel,
  incomeBenchmarkLabel,
  lowerIncomeBenchmarkLabel,
  upperIncomeBenchmarkLabel,
  wealthChartData,
  incomeChartData,
  assetMixData,
  percentileHistoryData,
  inflationAdjustedData,
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
    user: { label: 'Your Asset Mix', color: '#2a9d8f' },
    userValue: { label: 'Your Asset Mix', color: '#2a9d8f' },
    median: { label: `Wealth Bin (${benchmarkLabel})`, color: '#264653' },
    medianValue: { label: `Wealth Bin (${benchmarkLabel})`, color: '#264653' },
    portfolioGrowth: { label: 'Portfolio Growth', color: '#264653' },
    percentile: { label: 'Historical Percentile', color: '#264653' },
    nominalWealth: { label: 'Nominal Wealth', color: '#e76f51' },
    inflationAdjustedWealth: { label: 'Inflation-Adjusted Wealth (2024 dollars)', color: '#2a9d8f' },
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
            <TabsTrigger value="asset-mix">Asset Mix</TabsTrigger>
            <TabsTrigger value="percentile-history">Percentile History</TabsTrigger>
            <TabsTrigger value="inflation-adjusted">Real Wealth</TabsTrigger>
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

          <TabsContent value="asset-mix" className="mt-4">
            <div className="flex items-center justify-end space-x-2 mb-4 px-4">
              <Label htmlFor="asset-mix-mode" className="text-sm">Currency values</Label>
              <Switch
                id="asset-mix-mode"
                checked={assetMixMode === 'currency'}
                onCheckedChange={(checked) => onAssetMixModeChange(checked ? 'currency' : 'percentage')}
              />
            </div>
            <ChartContainer className="h-[360px] w-full" config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={assetMixData}>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name, item) => {
                          const row = item.payload as AssetMixRow;
                          const isUser = item.dataKey === 'user' || item.dataKey === 'userValue';
                          const currencyValue = isUser ? row.userValue : row.medianValue;

                          const formattedValue = (assetMixMode === 'currency' && currencyValue !== undefined)
                            ? new Intl.NumberFormat(undefined, {
                                style: 'currency',
                                currency: baseCurrency,
                                maximumFractionDigits: 0,
                              }).format(currencyValue)
                            : `${Number(value).toFixed(1)}%`;

                          return (
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                                style={
                                  {
                                    "--color-bg": isUser ? "var(--color-user)" : "var(--color-median)",
                                  } as React.CSSProperties
                                }
                              />
                              <span className="font-medium text-foreground">{name}:</span>
                              <span className="font-mono font-medium text-foreground">{formattedValue}</span>
                            </div>
                          );
                        }}
                      />
                    }
                  />
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <Radar
                    id="user"
                    name="Your Asset Mix"
                    dataKey={assetMixMode === 'currency' ? 'userValue' : 'user'}
                    stroke="var(--color-user)"
                    fill="var(--color-user)"
                    fillOpacity={0.6}
                  />
                  <Radar
                    id="median"
                    name={`Wealth Bin (${benchmarkLabel})`}
                    dataKey={assetMixMode === 'currency' ? 'medianValue' : 'median'}
                    stroke="var(--color-median)"
                    fill="var(--color-median)"
                    fillOpacity={0.6}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </RadarChart>
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

          <TabsContent value="inflation-adjusted" className="mt-4">
            <ChartContainer className="h-[360px] w-full" config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={inflationAdjustedData}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="nominalWealth" stroke="var(--color-nominalWealth)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="inflationAdjustedWealth" stroke="var(--color-inflationAdjustedWealth)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
