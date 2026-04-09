import { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { useWallets } from '../../../contexts/WalletContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useToast } from '../../../contexts/ToastContext';
import { parseCurrencyInput } from '../../../utils/currency';
import type { Wallet, WalletType } from '../../../types/schema';

interface WalletFormProps {
  initialData?: Wallet | null;
  onClose: () => void;
}

const WALLET_ICONS = ['💳', '🏦', '💵', '💰', '📱', '📈', '🐷', '💼', '💎', '🚀'];
const WALLET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#6366f1', '#f43f5e', '#84cc16'];

export function WalletForm({ initialData, onClose }: WalletFormProps) {
  const { addWallet, updateWallet } = useWallets();
  const { settings } = useSettings();
  const { toast } = useToast();
  
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<WalletType>(initialData?.type || 'bank');
  // Initialize balance only when creating; edit shouldn't change initialBalance directly this way
  const [initialBalanceStr, setInitialBalanceStr] = useState(initialData ? String(initialData.initialBalance / 100) : '');
  const [currency, setCurrency] = useState(initialData?.currency || settings.defaultCurrency || 'GBP');
  const [icon, setIcon] = useState(initialData?.icon || '🏦');
  const [color, setColor] = useState(initialData?.color || '#3b82f6');
  const [cardLastFour, setCardLastFour] = useState(initialData?.cardLastFour || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setCurrency(initialData.currency);
      setIcon(initialData.icon);
      setColor(initialData.color);
      setCardLastFour(initialData.cardLastFour || '');
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (initialData) {
        await updateWallet(initialData.id, { 
          name, 
          type, 
          currency, 
          icon, 
          color, 
          cardLastFour: cardLastFour.trim() || null 
        });
        toast({ type: 'success', title: 'Wallet updated' });
      } else {
        const initialBalanceCents = parseCurrencyInput(initialBalanceStr);
        await addWallet({ 
          name, 
          type, 
          currency, 
          initialBalance: initialBalanceCents, 
          icon, 
          color, 
          cardLastFour: cardLastFour.trim() || null,
          isArchived: false,
          displayOrder: Date.now() // Simple ordering for new
        });
        toast({ type: 'success', title: 'Wallet created' });
      }
      onClose();
    } catch (error) {
      toast({ type: 'error', title: 'Failed to save', message: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Wallet Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Main Checking"
        required
        disabled={isSubmitting}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Wallet Type"
          value={type}
          onChange={(e) => setType(e.target.value as WalletType)}
          disabled={isSubmitting}
        >
          <option value="bank">Bank Account</option>
          <option value="cash">Cash</option>
          <option value="credit">Credit Card</option>
          <option value="ewallet">E-Wallet</option>
          <option value="savings">Savings</option>
          <option value="investment">Investment</option>
        </Select>

        <Select
          label="Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          disabled={isSubmitting || !!initialData}
        >
          <option value="GBP">GBP (£)</option>
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="INR">INR (₹)</option>
        </Select>
      </div>

      {!initialData && (
        <Input
          label="Initial Balance"
          type="number"
          step="0.01"
          value={initialBalanceStr}
          onChange={(e) => setInitialBalanceStr(e.target.value)}
          placeholder="0.00"
          disabled={isSubmitting}
        />
      )}

      {(type === 'credit' || type === 'bank') && (
        <Input
          label="Card Last 4 Digits (Optional)"
          value={cardLastFour}
          onChange={(e) => setCardLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="1234"
          disabled={isSubmitting}
        />
      )}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-on-surface-variant">Icon</label>
        <div className="grid grid-cols-5 gap-2">
          {WALLET_ICONS.map((i) => (
            <button
              key={i}
              type="button"
              disabled={isSubmitting}
              onClick={() => setIcon(i)}
              className={`text-2xl p-2 rounded-xl transition-transform hover:scale-110 flex items-center justify-center ${icon === i ? 'bg-surface-container-highest ring-2 ring-brand/50' : 'bg-surface-container-high'}`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-on-surface-variant">Color</label>
        <div className="flex flex-wrap gap-3">
          {WALLET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={isSubmitting}
              onClick={() => setColor(c)}
              className={`w-10 h-10 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${color === c ? 'ring-2 ring-offset-2 ring-brand/50' : ''}`}
              style={{ backgroundColor: c }}
            >
              {color === c && (
                <svg className="w-5 h-5 text-white mix-blend-difference" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 flex gap-3">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={!name.trim() || isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Wallet'}
        </Button>
      </div>
    </form>
  );
}
