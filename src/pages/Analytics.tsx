import { useState, lazy, Suspense } from 'react';
import { PeriodSelector, getDatesForPreset, type PresetPeriod } from '../components/features/analytics/PeriodSelector';

const CategoryPieChart = lazy(() => import('../components/features/analytics/CategoryPieChart').then(m => ({ default: m.CategoryPieChart })));
const SpendingTrendChart = lazy(() => import('../components/features/analytics/SpendingTrendChart').then(m => ({ default: m.SpendingTrendChart })));

import { useAnalytics, type DateRange } from '../hooks/useAnalytics';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency } from '../utils/currency';
import { Card } from '../components/ui/Card';

export default function Analytics() {
  const [preset, setPreset] = useState<PresetPeriod>('current-date');
  const dateRange: DateRange = getDatesForPreset(preset);

  const { categoryBreakdown, spendingTrend, overview } = useAnalytics(dateRange);
  const { settings } = useSettings();
  const currency = settings.defaultCurrency || 'GBP';

  return (
    <div className="max-w-7xl mx-auto py-4 md:py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-on-surface">Analytics</h1>
        <p className="mt-2 text-on-surface-variant">Breakdowns and Cashflow Trends</p>
      </div>

      <PeriodSelector period={preset} onChange={setPreset} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 flex flex-col justify-center">
          <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Total Income</span>
          <span className="text-3xl font-mono font-bold text-success">{formatCurrency(overview.incomeCents, currency)}</span>
        </Card>
        <Card className="p-5 flex flex-col justify-center">
          <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Total Expenses</span>
          <span className="text-3xl font-mono font-bold text-error">{formatCurrency(overview.expenseCents, currency)}</span>
        </Card>
        <Card className="p-5 flex flex-col justify-center">
          <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Net Cashflow</span>
          <span className="text-3xl font-mono font-bold">{formatCurrency(overview.netCents, currency)}</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Suspense fallback={<Card className="p-6 h-[400px] animate-pulse bg-surface-container" />}>
          <CategoryPieChart data={categoryBreakdown} currency={currency} />
        </Suspense>
        <Suspense fallback={<Card className="p-6 h-[400px] animate-pulse bg-surface-container" />}>
          <SpendingTrendChart data={spendingTrend} currency={currency} />
        </Suspense>
      </div>
    </div>
  );
}
