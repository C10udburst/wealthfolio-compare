import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@wealthfolio/ui';
import { COUNTRY_OPTIONS, TIME_SPANS } from '../lib/constants';
import type { AccountOption, TimeSpanOption } from '../types/compare';

type Props = {
  selectedCountry: string;
  selectedAccountId: string;
  accountOptions: AccountOption[];
  householdSize: number;
  timeSpan: TimeSpanOption;
  onCountryChange: (country: string) => void;
  onAccountChange: (accountId: string) => void;
  onHouseholdSizeChange: (size: number) => void;
  onTimeSpanChange: (timeSpan: TimeSpanOption) => void;
};

export function CompareControlsCard({
  selectedCountry,
  selectedAccountId,
  accountOptions,
  householdSize,
  timeSpan,
  onCountryChange,
  onAccountChange,
  onHouseholdSizeChange,
  onTimeSpanChange,
}: Props) {
  const countryInputListId = 'compare-country-options';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Controls</CardTitle>
        <CardDescription>Account, country, household size, and analysis timespan</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Account</p>
          <Select value={selectedAccountId} onValueChange={onAccountChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accountOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Country</p>
          <Input
            list={countryInputListId}
            value={selectedCountry}
            placeholder="Pick or type a country code"
            onChange={(event) => onCountryChange(event.target.value.toUpperCase())}
            onBlur={(event) => {
              const normalized = event.target.value.trim().toUpperCase();
              onCountryChange(normalized || COUNTRY_OPTIONS[0]);
            }}
          />
          <datalist id={countryInputListId}>
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Household size (equal split)</p>
          <Input
            type="number"
            min={1}
            step={1}
            value={householdSize}
            onChange={(event) => {
              const next = Number(event.target.value);
              onHouseholdSizeChange(Number.isFinite(next) && next > 0 ? Math.floor(next) : 1);
            }}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Timespan</p>
          <div className="flex gap-2 flex-wrap">
            {TIME_SPANS.map((option) => (
              <Button
                key={option.label}
                variant={timeSpan.label === option.label ? 'default' : 'outline'}
                onClick={() => onTimeSpanChange(option)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
