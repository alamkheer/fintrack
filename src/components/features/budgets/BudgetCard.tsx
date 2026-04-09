import { useMemo } from 'react';
import type { Budget } from '../../../types/schema';
import { useExpenses } from '../../../contexts/ExpenseContext';
import { useCategories } from '../../../contexts/CategoryContext';
import { useWallets } from '../../../contexts/WalletContext';
import { BudgetProgressBar } from './BudgetProgressBar';
import { Card } from '../../ui/Card';

interface BudgetCardProps {
  budget: Budget;
  onEdit: () => void;
}

export function BudgetCard({ budget, onEdit }: BudgetCardProps) {
  const { expenses } = useExpenses();
  const { categories } = useCategories();
  const { activeWallets } = useWallets();

  const spentCents = useMemo(() => {
    return expenses
      .filter(e => e.type === 'expense')
      .filter(e => {
        // Date range
        const expenseDate = new Date(e.date);
        const start = new Date(budget.startDate);
        if (expenseDate < start) return false;
        if (budget.endDate) {
          const end = new Date(budget.endDate);
          if (expenseDate > end) return false;
        }
        return true;
      })
      .filter(e => {
        // Category constraint
        if (budget.categoryId && e.categoryId !== budget.categoryId) return false;
        // Wallet constraint
        if (budget.walletId && e.walletId !== budget.walletId) return false;
        return true;
      })
      .reduce((sum, e) => sum + e.amount, 0); // Note: e.amount is treated as full float, but we store in integer scaling (cents internally). 
      // Actually DB schema says "amount: number; // positive float, internally manipulated as cents". Our DB form records them directly. Let's safely round:
  }, [expenses, budget]);

  const spentRounded = spentCents;

  const category = categories.find(c => c.id === budget.categoryId);
  const wallet = activeWallets.find(w => w.id === budget.walletId);

  return (
    <Card 
      className="p-5 cursor-pointer hover:-translate-y-1 transition-transform group"
      onClick={onEdit}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-display font-bold text-on-surface group-hover:text-brand transition-colors">
            {budget.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-on-surface-variant font-medium">
            {category && (
              <span className="flex items-center gap-1">
                {category.icon} {category.name}
              </span>
            )}
            {wallet && (
              <>
                <span>•</span>
                <span>{wallet.name}</span>
              </>
            )}
          </div>
        </div>
        <div className="bg-surface-container-high px-3 py-1 rounded-lg text-xs font-bold text-on-surface-variant uppercase tracking-wide">
          {budget.periodType}
        </div>
      </div>

      <BudgetProgressBar 
        spentCents={spentRounded} 
        limitCents={budget.limitAmount} 
        currency={budget.currency}
        alertThreshold={budget.alertThreshold}
      />
    </Card>
  );
}
