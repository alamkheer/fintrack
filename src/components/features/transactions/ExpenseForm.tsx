import { useState, useEffect, useRef } from 'react';
import { useExpenses } from '../../../contexts/ExpenseContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useCategories } from '../../../contexts/CategoryContext';
import { useWallets } from '../../../contexts/WalletContext';
import { useToast } from '../../../contexts/ToastContext';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { CategoryForm } from '../categories/CategoryForm';
import { parseCurrencyInput } from '../../../utils/currency';
import { dbService } from '../../../services/db';
import type { Expense, ExpenseType } from '../../../types/schema';

interface ExpenseFormProps {
  initialData?: Expense | null;
  onClose: () => void;
}

export function ExpenseForm({ initialData, onClose }: ExpenseFormProps) {
  const { addExpense, updateExpense, expenses } = useExpenses();
  const { settings, updateSetting } = useSettings();
  const { categories } = useCategories();
  const { activeWallets } = useWallets();
  const { toast } = useToast();

  const isEdit = !!initialData;
  const history = settings.smartEntryHistory || [];

  const [type, setType] = useState<ExpenseType>(initialData?.type || 'expense');
  const [amountStr, setAmountStr] = useState(initialData ? String(initialData.amount / 100) : '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [walletId, setWalletId] = useState(initialData?.walletId || settings.defaultWalletId || '');
  const [toWalletId, setToWalletId] = useState(initialData?.toWalletId || '');
  const [description, setDescription] = useState(initialData?.description || '');
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly' | 'yearly'>('monthly');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);

  // Autofocus amount on mount (unless editing)
  useEffect(() => {
    if (!isEdit && amountRef.current) {
      amountRef.current.focus();
    }
  }, [isEdit]);

  // Set default category if not set
  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      const defaultCat = categories.find(c => c.type === type);
      if (defaultCat) setCategoryId(defaultCat.id);
    }
  }, [type, categoryId, categories]);

  // Set default wallet if not set
  useEffect(() => {
    if (!walletId && activeWallets.length > 0) {
      setWalletId(activeWallets[0].id);
    }
  }, [walletId, activeWallets]);

  // Smart Autocomplete Logic
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDescription(val);
    
    if (val.length >= 2) {
      const lower = val.toLowerCase();
      const matches = history.filter(desc => desc.toLowerCase().includes(lower) && desc !== val);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (sug: string) => {
    setDescription(sug);
    setShowSuggestions(false);
    
    // Find most recent match to auto-fill
    const recentMatch = expenses.find(e => e.description.toLowerCase() === sug.toLowerCase());
    if (recentMatch) {
      setType(recentMatch.type);
      setCategoryId(recentMatch.categoryId);
      setWalletId(recentMatch.walletId);
      if (recentMatch.toWalletId) setToWalletId(recentMatch.toWalletId);
      setAmountStr(String(recentMatch.amount / 100)); // Option to auto-fill amount too
      setIsAutoFilled(true);
      
      // Flash indicator
      setTimeout(() => setIsAutoFilled(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const amountCents = parseCurrencyInput(amountStr);
    if (!amountCents || amountCents <= 0) {
      toast({ type: 'error', title: 'Invalid amount' });
      return;
    }

    if (type === 'transfer' && walletId === toWalletId) {
      toast({ type: 'error', title: 'Transfer must be to a different wallet' });
      return;
    }

    if (!categoryId) {
      toast({ type: 'error', title: 'Please select a category' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type,
        amount: amountCents,
        currency: settings.defaultCurrency || 'GBP',
        date,
        time: initialData?.time || new Date().toISOString().split('T')[1].substr(0, 5),
        description: description.trim() || 'Untitled',
        notes: initialData?.notes || '',
        categoryId,
        walletId,
        toWalletId: type === 'transfer' ? toWalletId : null,
        budgetId: initialData?.budgetId || null,
        tags: initialData?.tags || [],
        isRecurring,
        recurringId: initialData?.recurringId || null,
        attachmentRef: initialData?.attachmentRef || null,
        smartEntrySource: isAutoFilled ? 'smart' as const : 'manual' as const,
      };

      if (isEdit) {
        await updateExpense(initialData.id, payload);
        toast({ type: 'success', title: 'Transaction updated' });
      } else {
        await addExpense(payload);
        
        // If recurring is checked, create the template
        if (isRecurring) {
          const nextDate = new Date(date);
          if (frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
          else if (frequency === 'biweekly') nextDate.setDate(nextDate.getDate() + 14);
          else if (frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
          else if (frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

          await dbService.addRecurringTemplate({
            name: payload.description,
            frequency: frequency,
            dayOfMonth: new Date(date).getDate(),
            dayOfWeek: new Date(date).getDay(),
            templateData: { ...payload, isRecurring: true },
            nextDueDate: nextDate.toISOString().split('T')[0],
            isActive: true
          });
        }

        // Update Smart History
        const newDesc = payload.description;
        const deduped = history.filter(d => d.toLowerCase() !== newDesc.toLowerCase());
        await updateSetting('smartEntryHistory', [newDesc, ...deduped].slice(0, 50));
        
        toast({ 
          type: 'success', 
          title: 'Transaction saved', 
          message: isRecurring ? `Recurring ${frequency} payment scheduled.` : 'Recorded successfully.'
        });
      }
      onClose();
    } catch (err) {
      toast({ type: 'error', title: 'Error saving', message: (err as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Type Toggle */}
      <div className="flex bg-surface-container-high p-1 rounded-xl">
        {(['expense', 'income', 'transfer'] as ExpenseType[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => { setType(t); setCategoryId(''); }}
            className={`flex-1 py-2 text-sm font-bold capitalize rounded-lg transition-all ${
              type === t 
              ? 'bg-surface-bright text-brand shadow-sm scale-100' 
              : 'text-on-surface-variant hover:text-on-surface scale-95 hover:scale-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Auto-fill indicator */}
      <div className={`transition-all duration-500 overflow-hidden ${isAutoFilled ? 'h-6 opacity-100' : 'h-0 opacity-0'}`}>
        <p className="text-brand text-xs font-bold text-center">✨ Auto-filled from history</p>
      </div>

      {/* Amount Group */}
      <div className={`transition-colors duration-[2s] rounded-2xl p-4 -mx-4 ${isAutoFilled ? 'bg-brand/10' : ''}`}>
        <div className="relative">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-mono text-on-surface-variant font-bold">
            {settings.defaultCurrency === 'GBP' ? '£' : '$'}
          </span>
          <input
            ref={amountRef}
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amountStr}
            onChange={e => setAmountStr(e.target.value)}
            onBlur={() => {
              if (amountStr) {
                const parsed = parseCurrencyInput(amountStr);
                setAmountStr(String(parsed / 100));
              }
            }}
            onFocus={() => {
              if (amountStr === '0' || amountStr === '0.00') setAmountStr('');
            }}
            className="w-full bg-surface-container-lowest text-on-surface font-mono text-4xl font-bold py-6 pl-14 pr-6 rounded-[24px] focus:outline-none ring-2 ring-transparent focus:ring-brand shadow-sm transition-all text-right"
            required
          />
        </div>
      </div>

      {/* Description */}
      <div className="relative z-20">
        <Input
          label="Description"
          placeholder="What was this for?"
          value={description}
          onChange={handleDescriptionChange}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => { if(suggestions.length) setShowSuggestions(true); }}
          required
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full mt-1 bg-surface-container shadow-xl rounded-xl border border-outline/10 overflow-hidden max-h-48 overflow-y-auto">
            {suggestions.map((sug, i) => (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSuggestionSelect(sug); }}
                  className="w-full text-left px-4 py-3 text-on-surface hover:bg-brand/10 hover:text-brand font-body transition-colors"
                >
                  {sug}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <Select
            label="Category"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            required
          >
            <option value="" disabled>Select category</option>
            {filteredCategories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </Select>
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="absolute right-0 top-0 text-[10px] font-bold text-brand hover:underline px-1 py-0.5"
            title="Create Custom Category"
          >
            + Quick Add
          </button>
        </div>

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
      </div>

      <div className={`grid ${type === 'transfer' ? 'grid-cols-2 gap-4' : 'grid-cols-1'}`}>
        <Select
          label={type === 'transfer' ? "From Wallet" : "Wallet"}
          value={walletId}
          onChange={e => setWalletId(e.target.value)}
          required
        >
          <option value="" disabled>Select wallet</option>
          {activeWallets.map(w => (
            <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
          ))}
        </Select>

        {type === 'transfer' && (
          <Select
            label="To Wallet"
            value={toWalletId}
            onChange={e => setToWalletId(e.target.value)}
            required
          >
            <option value="" disabled>Select destination</option>
            {activeWallets.map(w => (
              <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
            ))}
          </Select>
        )}
      </div>

      {/* Recurring Segment */}
      <div className="bg-surface-container-low p-4 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔁</span>
            <div>
              <p className="text-sm font-bold text-on-surface">Repeat Transaction</p>
              <p className="text-xs text-on-surface-variant">Schedule for the future</p>
            </div>
          </div>
          <input 
            type="checkbox" 
            checked={isRecurring} 
            onChange={e => setIsRecurring(e.target.checked)}
            className="w-6 h-6 accent-brand rounded"
          />
        </div>

        {isRecurring && (
          <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Select
              label="Frequency"
              value={frequency}
              onChange={e => setFrequency(e.target.value as any)}
            >
              <option value="weekly">Every Week</option>
              <option value="biweekly">Every 2 Weeks</option>
              <option value="monthly">Every Month</option>
              <option value="yearly">Every Year</option>
            </Select>
          </div>
        )}
      </div>

      <div className="pt-2">
        <Button fullWidth type="submit" size="lg" disabled={isSubmitting}>
          {isEdit ? 'Save Changes' : isRecurring ? `Schedule Recurring ${type}` : `Record ${type}`}
        </Button>
      </div>

      <Modal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)}
        title="Quick Add Category"
      >
        <CategoryForm 
          onClose={() => setIsCategoryModalOpen(false)} 
          initialType={type}
          onSuccess={(newCat) => {
            setCategoryId(newCat.id);
            setIsCategoryModalOpen(false);
          }}
        />
      </Modal>
    </form>
  );
}
