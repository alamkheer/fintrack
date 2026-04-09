import { createContext, useContext, useState, type ReactNode } from 'react';
import { Drawer } from '../components/ui/Drawer';
import { ExpenseForm } from '../components/features/transactions/ExpenseForm';
import type { Expense } from '../types/schema';

interface EntryContextType {
  openEntry: (expenseToEdit?: Expense) => void;
  closeEntry: () => void;
  openHelp: () => void;
  closeHelp: () => void;
}

const EntryContext = createContext<EntryContextType | undefined>(undefined);

export function EntryProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const openEntry = (expense?: Expense) => {
    setEditingExpense(expense || null);
    setIsOpen(true);
  };

  const closeEntry = () => {
    setIsOpen(false);
    setTimeout(() => setEditingExpense(null), 300);
  };

  const openHelp = () => setIsHelpOpen(true);
  const closeHelp = () => setIsHelpOpen(false);

  return (
    <EntryContext.Provider value={{ openEntry, closeEntry, openHelp, closeHelp }}>
      {children}

      {/* Transaction Entry Drawer */}
      <Drawer
        isOpen={isOpen}
        onClose={closeEntry}
        title={editingExpense ? "Edit Transaction" : "New Transaction"}
        side="bottom"
      >
        <ExpenseForm initialData={editingExpense} onClose={closeEntry} />
      </Drawer>

      {/* Keyboard Shortcuts Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-high/60 backdrop-blur-md animate-in fade-in duration-300">
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={closeHelp}
          />
          <div className="relative w-full max-w-lg bg-surface-bright rounded-3xl shadow-2xl border border-outline/10 p-8 animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-display font-bold text-on-surface mb-6 flex items-center gap-3">
              <span>⌨️</span> Keyboard Shortcuts
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              {[
                { keys: ['Shift', 'D'], desc: 'Dashboard' },
                { keys: ['Shift', 'A'], desc: 'Analytics' },
                { keys: ['Shift', 'W'], desc: 'Wallets' },
                { keys: ['Shift', 'B'], desc: 'Budgets' },
                { keys: ['Shift', 'E'], desc: 'Add Entry' },
                { keys: ['Shift', 'S'], desc: 'Settings' },
                { keys: ['Esc'], desc: 'Close All' },
                { keys: ['?'], desc: 'Toggle Help' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between pb-2 border-b border-outline/5">
                  <span className="text-sm text-on-surface-variant">{s.desc}</span>
                  <div className="flex gap-1">
                    {s.keys.map(k => (
                      <kbd key={k} className="px-2 py-1 rounded bg-surface-container text-[10px] font-mono font-bold border border-outline/20">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={closeHelp}
              className="mt-8 w-full py-3 bg-surface-container-high hover:bg-surface-container-lowest text-on-surface font-bold rounded-xl transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </EntryContext.Provider>
  );
}

export function useEntry() {
  const context = useContext(EntryContext);
  if (context === undefined) {
    throw new Error('useEntry must be used within an EntryProvider');
  }
  return context;
}
