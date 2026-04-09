import { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { useCategories } from '../../../contexts/CategoryContext';
import { useToast } from '../../../contexts/ToastContext';
import type { Category, CategoryType } from '../../../types/schema';

interface CategoryFormProps {
  initialData?: Category | null;
  initialType?: CategoryType;
  onClose: () => void;
  onSuccess?: (category: Category) => void;
}

const COMMON_ICONS = ['🛒', '🚍', '🏠', '💰', '🍔', '🎉', '✈️', '🎮', '👕', '🐶', '🎓', '🏥', '⛽', '📦', '📤', '📥'];
const COMMON_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#7a7581'];

export function CategoryForm({ initialData, initialType, onClose, onSuccess }: CategoryFormProps) {
  const { addCategory, updateCategory, categories } = useCategories();
  const { toast } = useToast();
  
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<CategoryType>(initialData?.type || initialType || 'expense');
  const [icon, setIcon] = useState(initialData?.icon || '🛒');
  const [color, setColor] = useState(initialData?.color || '#3b82f6');
  const [parentId, setParentId] = useState(initialData?.parentId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If initialData changes (e.g. reused modal), reset form
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setIcon(initialData.icon);
      setColor(initialData.color);
      setParentId(initialData.parentId || '');
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (initialData) {
        if (initialData.isSystem) {
          toast({ type: 'error', title: 'System categories cannot be edited.' });
          return;
        }
        const updated = await updateCategory(initialData.id, { name, type, icon, color, parentId: parentId || null });
        toast({ type: 'success', title: 'Category updated successfully' });
        onSuccess?.(updated);
      } else {
        const created = await addCategory({ name, type, icon, color, isSystem: false, parentId: parentId || null });
        toast({ type: 'success', title: 'Category created successfully' });
        onSuccess?.(created);
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
        label="Category Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Coffee"
        required
        disabled={initialData?.isSystem || isSubmitting}
      />

      <Select
        label="Type"
        value={type}
        onChange={(e) => setType(e.target.value as CategoryType)}
        disabled={initialData && initialData.type !== undefined || isSubmitting}
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
        <option value="transfer">Transfer</option>
      </Select>

      <Select
        label="Parent Category (Optional)"
        value={parentId}
        onChange={(e) => setParentId(e.target.value)}
        disabled={isSubmitting}
      >
        <option value="">None (Top Level)</option>
        {categories
          .filter(c => c.type === type && c.id !== initialData?.id && !c.parentId)
          .map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))
        }
      </Select>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-on-surface-variant">Icon</label>
        <div className="grid grid-cols-8 gap-2">
          {COMMON_ICONS.map((i) => (
            <button
              key={i}
              type="button"
              disabled={initialData?.isSystem || isSubmitting}
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
        <div className="grid grid-cols-6 gap-3">
          {COMMON_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={initialData?.isSystem || isSubmitting}
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
        <Button 
          type="button" 
          variant="secondary" 
          className="flex-1" 
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1"
          disabled={!name.trim() || initialData?.isSystem || isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Category'}
        </Button>
      </div>
    </form>
  );
}
