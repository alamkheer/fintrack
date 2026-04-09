import { useState } from 'react';
import { useCategories } from '../../../contexts/CategoryContext';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Modal } from '../../ui/Modal';
import { EmptyState } from '../../ui/EmptyState';
import { CategoryForm } from './CategoryForm';
import type { Category } from '../../../types/schema';

export function CategoryList() {
  const { categories, isLoading, deleteCategory } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return <div className="text-center p-8 text-on-surface-variant">Loading categories...</div>;
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        title="No Categories Found"
        description="Start by creating an expense or income category to track your finances."
        action={
          <Button onClick={() => { setSelectedCategory(null); setIsModalOpen(true); }}>
            Create Category
          </Button>
        }
      />
    );
  }

  // Group by type
  const expenses = categories.filter(c => c.type === 'expense');
  const incomes = categories.filter(c => c.type === 'income');
  const transfers = categories.filter(c => c.type === 'transfer');

  const handleEdit = (c: Category) => {
    setSelectedCategory(c);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const Group = ({ title, items }: { title: string; items: Category[] }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-8">
        <h3 className="text-lg font-bold font-display text-on-surface mb-4">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(cat => (
            <Card key={cat.id} className="p-4 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  {cat.icon}
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">{cat.name}</h4>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {cat.isSystem && <Badge size="sm">System</Badge>}
                    {cat.parentId && (
                      <Badge variant="neutral" size="sm">
                        Sub of {categories.find(c => c.id === cat.parentId)?.name || 'Unknown'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!cat.isSystem && (
                  <>
                    <button 
                      onClick={() => handleEdit(cat)}
                      className="p-1.5 text-on-surface-variant hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete '${cat.name}'?`)) {
                          deleteCategory(cat.id);
                        }
                      }}
                      className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-on-surface">Categories</h1>
          <p className="mt-2 text-on-surface-variant">Manage your transaction classifications</p>
        </div>
        <Button onClick={handleCreate} className="hidden sm:flex">
          ➕ New Category
        </Button>
      </div>

      <Group title="Expenses" items={expenses} />
      <Group title="Incomes" items={incomes} />
      <Group title="Transfers" items={transfers} />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={selectedCategory ? "Edit Category" : "New Category"}
      >
        <CategoryForm initialData={selectedCategory} onClose={() => setIsModalOpen(false)} />
      </Modal>

      {/* Mobile FAB override if needed, but App typically adds standard FABs. Here we add one for categories */}
      <Button 
        onClick={handleCreate}
        className="sm:hidden fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-xl z-50 text-2xl p-0!"
      >
        ➕
      </Button>
    </div>
  );
}
