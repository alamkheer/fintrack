import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { dbService, syncChannel } from '../services/db';
import type { Budget } from '../types/schema';

interface BudgetContextType {
  budgets: Budget[];
  isLoading: boolean;
  addBudget: (data: Omit<Budget, 'id' | 'syncMeta'>) => Promise<Budget>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;
  refreshBudgets: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBudgets = useCallback(async () => {
    const loaded = await dbService.getAll<Budget>('budgets');
    setBudgets(loaded);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshBudgets();

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'DATA_CHANGED' && event.data.store === 'budgets') {
        refreshBudgets();
      }
    };

    syncChannel.addEventListener('message', handleMessage);
    return () => syncChannel.removeEventListener('message', handleMessage);
  }, [refreshBudgets]);

  const addBudget = async (data: Omit<Budget, 'id' | 'syncMeta'>) => {
    const newBudget = await dbService.addBudget(data);
    await refreshBudgets();
    return newBudget;
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    const updated = await dbService.updateBudget(id, updates);
    await refreshBudgets();
    return updated;
  };

  const deleteBudget = async (id: string) => {
    await dbService.softDeleteBudget(id);
    await refreshBudgets();
  };

  return (
    <BudgetContext.Provider value={{ 
      budgets, 
      isLoading, 
      addBudget, 
      updateBudget, 
      deleteBudget, 
      refreshBudgets 
    }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudgets() {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudgets must be used within a BudgetProvider');
  }
  return context;
}
