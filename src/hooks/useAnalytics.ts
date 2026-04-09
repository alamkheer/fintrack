import { useMemo } from 'react';
import { useExpenses } from '../contexts/ExpenseContext';
import { useCategories } from '../contexts/CategoryContext';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export function useAnalytics(dateRange: DateRange) {
  const { expenses } = useExpenses();
  const { categories } = useCategories();

  // Filter expenses strictly within the date bounds
  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (e.date < dateRange.startDate || e.date > dateRange.endDate) return false;
      return true;
    });
  }, [expenses, dateRange]);

  // CATEGORY PIE CHART LOGIC
  const categoryBreakdown = useMemo(() => {
    const expenseMap = new Map<string, number>();
    
    filtered.forEach(e => {
      if (e.type !== 'expense') return;
      const current = expenseMap.get(e.categoryId) ?? 0;
      expenseMap.set(e.categoryId, current + e.amount);
    });

    return Array.from(expenseMap.entries())
      .map(([catId, amountCents]) => {
        const cat = categories.find(c => c.id === catId);
        return {
          name: cat?.name || 'Uncategorized',
          value: amountCents, // internal Recharts property
          color: cat?.color || '#94a3b8',
          icon: cat?.icon || '📄'
        };
      })
      .sort((a, b) => b.value - a.value); // sort largest to smallest
  }, [filtered, categories]);

  // SPENDING TREND LINE CHART LOGIC
  const spendingTrend = useMemo(() => {
    const dailyMap = new Map<string, { expense: number, income: number }>();
    
    // Initialize map with empty days to ensure straight line renders
    let curr = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    while (curr <= end) {
      dailyMap.set(curr.toISOString().split('T')[0], { expense: 0, income: 0 });
      curr.setDate(curr.getDate() + 1);
    }

    filtered.forEach(e => {
      const dayData = dailyMap.get(e.date);
      if (!dayData) return;
      
      if (e.type === 'expense') dayData.expense += e.amount;
      if (e.type === 'income') dayData.income += e.amount;
    });

    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      expense: data.expense,
      income: data.income
    }));
  }, [filtered, dateRange]);

  // OVERVIEW ACCOUNTS
  const overview = useMemo(() => {
    let rawIncome = 0;
    let rawExpense = 0;
    filtered.forEach(e => {
      if (e.type === 'income') rawIncome += e.amount;
      if (e.type === 'expense') rawExpense += e.amount;
    });
    return {
      incomeCents: rawIncome,
      expenseCents: rawExpense,
      netCents: rawIncome - rawExpense
    };
  }, [filtered]);

  return {
    categoryBreakdown,
    spendingTrend,
    overview
  };
}
