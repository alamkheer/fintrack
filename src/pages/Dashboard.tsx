import { lazy, Suspense } from 'react';
import { useWallets } from '../contexts/WalletContext';
import { WalletCard } from '../components/features/wallets/WalletCard';
import { TransactionList } from '../components/features/transactions/TransactionList';
import { useEntry } from '../contexts/EntryContext';
import { formatCurrency } from '../utils/currency';
import { useSettings } from '../contexts/SettingsContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { getDatesForPreset } from '../components/features/analytics/PeriodSelector';

const SpendingTrendChart = lazy(() => import('../components/features/analytics/SpendingTrendChart').then(m => ({ default: m.SpendingTrendChart })));


export default function Dashboard() {
  const { activeWallets } = useWallets();
  const { openEntry } = useEntry();
  const { settings } = useSettings();

  const totalBalance = activeWallets.reduce((acc, w) => acc + w.currentBalance, 0);

  // Defaulting to last 3 days for mini chart
  const { spendingTrend } = useAnalytics(getDatesForPreset('last-3-days'));

  return (
    <div className="space-y-10 py-4 md:py-8">

      {/* Overview Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <p className="text-on-surface-variant font-medium mb-1">Total Net Worth</p>
          <div className="flex items-end gap-6">
            <h1 className="text-5xl font-mono font-bold text-on-surface">
              {formatCurrency(totalBalance, settings.defaultCurrency || 'GBP')}
            </h1>
            <button
              onClick={() => openEntry()}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand text-surface-bright rounded-xl font-bold hover:shadow-lg hover:shadow-brand/20 transition-all mb-1"
            >
              <span>➕</span> Add Transaction
            </button>
          </div>
        </div>

        {/* Mini Trend — Fixed height and variant */}
        <div className="w-full lg:w-96 shrink-0 h-40">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Last 3 Days Cashflow</p>
          <div className="h-32 bg-surface-container-high rounded-2xl overflow-hidden shadow-sm border border-outline/5 p-4">
            <Suspense fallback={<div className="h-full w-full animate-pulse bg-surface-container" />}>
              <SpendingTrendChart 
                variant="mini"
                data={spendingTrend} 
                currency={settings.defaultCurrency || 'GBP'} 
              />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Wallets Quick View */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-on-surface">Your Accounts</h2>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
          {activeWallets.length > 0 ? (
            activeWallets.map(w => (
              <div key={w.id} className="min-w-[280px] sm:min-w-[320px] snap-start shrink-0">
                <WalletCard wallet={w} />
              </div>
            ))
          ) : (
            <p className="text-on-surface-variant italic">No active wallets.</p>
          )}
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-on-surface">Recent Activity</h2>
        </div>
        <TransactionList />
      </section>

    </div>
  );
}
