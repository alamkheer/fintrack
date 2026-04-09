import { useState } from 'react';
import type { Budget, BudgetPeriodType } from '../../../types/schema';
import { useBudgets } from '../../../contexts/BudgetContext';
import { useCategories } from '../../../contexts/CategoryContext';
import { useWallets } from '../../../contexts/WalletContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useToast } from '../../../contexts/ToastContext';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Button } from '../../ui/Button';
import { parseCurrencyInput, formatCurrency } from '../../../utils/currency';

interface BudgetFormProps {
  initialData?: Budget | null;
  onClose: () => void;
}

export function BudgetForm({ initialData, onClose }: BudgetFormProps) {
  const { addBudget, updateBudget, deleteBudget } = useBudgets();
  const { categories } = useCategories();
  const { activeWallets } = useWallets();
  const { settings } = useSettings();
  const { toast } = useToast();

  const isEdit = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState(initialData?.name || '');
  const [limitAmountStr, setLimitAmountStr] = useState(
    initialData ? formatCurrency(initialData.limitAmount, initialData.currency).replace(/[^0-9.,]/g, '') : ''
  );
  const [periodType, setPeriodType] = useState<BudgetPeriodType>(initialData?.periodType || 'monthly');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [walletId, setWalletId] = useState(initialData?.walletId || '');
  
  // Basic date parsing to string YY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  const startDate = initialData?.startDate || today;
  const notes = initialData?.notes || '';

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !limitAmountStr) return;

    setIsSubmitting(true);
    try {
      const limitCents = parseCurrencyInput(limitAmountStr);
      const payload: Omit<Budget, 'id' | 'syncMeta'> = {
        name: name.trim(),
        categoryId: categoryId || null,
        walletId: walletId || null,
        periodType,
        startDate,
        endDate: null,
        limitAmount: limitCents,
        currency: initialData?.currency || settings.defaultCurrency || 'GBP',
        rollover: initialData?.rollover || false,
        rolloverAmount: initialData?.rolloverAmount || 0,
        alertThreshold: initialData?.alertThreshold || 0.8,
        status: initialData?.status || 'active',
        budgetType: initialData?.budgetType || 'expense',
        targetAmount: initialData?.targetAmount || null,
        notes: notes.trim(),
      };

      if (isEdit) {
        await updateBudget(initialData.id, payload);
        toast({ type: 'success', title: 'Budget updated' });
      } else {
        await addBudget(payload);
        toast({ type: 'success', title: 'Budget created' });
      }
      onClose();
    } catch (error) {
      toast({ type: 'error', title: 'Failed to save budget', message: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !window.confirm('Archive this budget?')) return;
    try {
      // Assuming soft delete for budgets
      await deleteBudget(initialData.id);
      toast({ type: 'success', title: 'Budget archived' });
      onClose();
    } catch (error) {
      toast({ type: 'error', title: 'Failed to archive', message: (error as Error).message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input 
        label="Budget Name"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g. Monthly Groceries"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input 
          label="Limit Amount"
          type="text"
          inputMode="decimal"
          value={limitAmountStr}
          onChange={e => setLimitAmountStr(e.target.value)}
          placeholder="0.00"
          required
        />
        <Select
          label="Period"
          value={periodType}
          onChange={e => setPeriodType(e.target.value as BudgetPeriodType)}
          required
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="custom">Custom</option>
          <option value="event">One-off Event</option>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Category (Optional)"
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
        >
          <option value="">Any Category</option>
          {expenseCategories.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </Select>

        <Select
          label="Wallet (Optional)"
          value={walletId}
          onChange={e => setWalletId(e.target.value)}
        >
          <option value="">Any Account</option>
          {activeWallets.map(w => (
            <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
          ))}
        </Select>
      </div>

      <div className="pt-4 flex gap-3">
        {isEdit && (
          <Button type="button" variant="ghost" onClick={handleDelete} className="text-error" disabled={isSubmitting}>
            Archive
          </Button>
        )}
        <div className="flex-1 flex gap-3 ml-auto">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={!name.trim() || !limitAmountStr || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Budget'}
          </Button>
        </div>
      </div>
    </form>
  );
}
