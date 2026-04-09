import { useState } from 'react';
import { useBudgets } from '../../../contexts/BudgetContext';
import { BudgetCard } from './BudgetCard';
import { BudgetForm } from './BudgetForm';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { EmptyState } from '../../ui/EmptyState';
import type { Budget } from '../../../types/schema';

export function BudgetList() {
  const { budgets, isLoading } = useBudgets();
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return <div className="text-center p-8 text-on-surface-variant">Loading budgets...</div>;
  }

  const handleEdit = (b: Budget) => {
    setSelectedBudget(b);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedBudget(null);
    setIsModalOpen(true);
  };

  // Divide active and archived if needed
  const active = budgets.filter(b => b.status === 'active');
  const other = budgets.filter(b => b.status !== 'active');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-on-surface">Budgets</h1>
          <p className="mt-2 text-on-surface-variant">Keep your spending in check</p>
        </div>
        <Button onClick={handleCreate} className="hidden sm:flex">
          ➕ New Budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          title="No Budgets Formed"
          description="A budget helps you actively track your spending vs a set limit."
          action={<Button onClick={handleCreate}>Create Budget</Button>}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {active.map(budget => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={() => handleEdit(budget)}
              />
            ))}
          </div>

          {other.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold font-display text-on-surface mb-6 opacity-70">Past Budgets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-70">
                {other.map(budget => (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    onEdit={() => handleEdit(budget)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedBudget ? "Edit Budget" : "New Budget"}
      >
        <BudgetForm initialData={selectedBudget} onClose={() => setIsModalOpen(false)} />
      </Modal>

      {/* Mobile FAB override */}
      <Button
        onClick={handleCreate}
        className="sm:hidden fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-xl z-50 text-2xl p-0!"
      >
        ➕
      </Button>
    </div>
  );
}
