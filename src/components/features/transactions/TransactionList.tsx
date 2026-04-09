import { useExpenses } from '../../../contexts/ExpenseContext';
import { useCategories } from '../../../contexts/CategoryContext';
import { useWallets } from '../../../contexts/WalletContext';
import { useEntry } from '../../../contexts/EntryContext';
import { formatCurrency } from '../../../utils/currency';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';

export function TransactionList() {
  const { expenses, isLoading } = useExpenses();
  const { categories } = useCategories();
  const { activeWallets } = useWallets();
  const { openEntry } = useEntry();

  if (isLoading) {
    return <div className="p-8 text-center text-on-surface-variant">Loading transactions...</div>;
  }

  if (expenses.length === 0) {
    return (
      <EmptyState
        title="No Transactions"
        description="Your activity will appear here once you start tracking."
      />
    );
  }

  // Sort by date/time desc
  const sorted = [...expenses].sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.time}`).getTime();
    const timeB = new Date(`${b.date}T${b.time}`).getTime();
    return timeB - timeA;
  });

  return (
    <div className="space-y-4">
      {sorted.map(expense => {
        const cat = categories.find(c => c.id === expense.categoryId);
        const wallet = activeWallets.find(w => w.id === expense.walletId);
        
        let amountStr = formatCurrency(expense.amount, expense.currency);
        let amountColor = 'text-on-surface';
        
        if (expense.type === 'expense') {
          amountStr = `- ${amountStr}`;
        } else if (expense.type === 'income') {
          amountStr = `+ ${amountStr}`;
          amountColor = 'text-success';
        } else if (expense.type === 'transfer') {
          amountColor = 'text-info';
        }

        return (
          <Card 
            key={expense.id} 
            className="flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors cursor-pointer group"
            onClick={() => openEntry(expense)}
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm"
                style={{ 
                  backgroundColor: cat ? `${cat.color}20` : 'transparent', 
                  color: cat?.color || 'inherit' 
                }}
              >
                {cat?.icon || '📄'}
              </div>
              <div>
                <h4 className="font-bold text-on-surface group-hover:text-brand transition-colors">{expense.description}</h4>
                <div className="flex items-center text-xs text-on-surface-variant mt-0.5 font-medium gap-2">
                  <span>{cat?.name || 'Uncategorized'}</span>
                  <span>•</span>
                  <span>{wallet?.name || 'Unknown Wallet'}</span>
                  <span>•</span>
                  <span className="opacity-70">{new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>
                </div>
              </div>
            </div>
            
            <div className={`font-mono font-bold text-lg ${amountColor}`}>
              {amountStr}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
