import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { dbService, syncChannel } from '../services/db';
import type { Expense, RecurringTemplate } from '../types/schema';

interface ExpenseContextType {
  expenses: Expense[];
  recurringTemplates: RecurringTemplate[];
  isLoading: boolean;
  addExpense: (data: Omit<Expense, 'id' | 'syncMeta'>) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  refreshExpenses: () => Promise<void>;
  loadExpensesByWallet: (walletId: string) => Promise<Expense[]>;
  
  // Recurring
  refreshTemplates: () => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<RecurringTemplate>) => Promise<RecurringTemplate>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTemplates = useCallback(async () => {
    const loaded = await dbService.getAll<RecurringTemplate>('recurringTemplates');
    setRecurringTemplates(loaded);
  }, []);

  const refreshExpenses = useCallback(async () => {
    const loaded = await dbService.getAll<Expense>('expenses');
    // Sort by date (newest first)
    loaded.sort((a, b) => {
      const db = new Date(b.date).getTime() - new Date(a.date).getTime();
      return db !== 0 ? db : (b.time && a.time ? b.time.localeCompare(a.time) : 0);
    });
    setExpenses(loaded);
    setIsLoading(false);
  }, []);

  const processRecurring = useCallback(async (templates: RecurringTemplate[]) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    for (const template of templates) {
      if (!template.isActive || template.nextDueDate > todayStr) continue;

      try {
        // 1. Create the expense
        await dbService.addExpense({
          ...template.templateData,
          date: template.nextDueDate,
          time: now.toISOString().split('T')[1].substr(0, 5),
          recurringId: template.id,
          smartEntrySource: 'smart'
        } as any);

        // 2. Schedule next occurrence
        const next = new Date(template.nextDueDate);
        if (template.frequency === 'weekly') next.setDate(next.getDate() + 7);
        else if (template.frequency === 'biweekly') next.setDate(next.getDate() + 14);
        else if (template.frequency === 'monthly') next.setMonth(next.getMonth() + 1);
        else if (template.frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);

        await dbService.updateRecurringTemplate(template.id, {
          nextDueDate: next.toISOString().split('T')[0]
        });
      } catch (err) {
        console.error('Failed to process recurring template:', template.id, err);
      }
    }
    
    // Refresh both after processing
    await refreshExpenses();
    await refreshTemplates();
  }, [refreshExpenses, refreshTemplates]);

  useEffect(() => {
    const init = async () => {
      await refreshExpenses();
      const templates = await dbService.getAll<RecurringTemplate>('recurringTemplates');
      setRecurringTemplates(templates);
      await processRecurring(templates);
    };
    
    init();

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'DATA_CHANGED') {
        if (event.data.store === 'expenses') refreshExpenses();
        if (event.data.store === 'recurringTemplates') refreshTemplates();
      }
    };

    syncChannel.addEventListener('message', handleMessage);
    return () => syncChannel.removeEventListener('message', handleMessage);
  }, [refreshExpenses, refreshTemplates, processRecurring]);

  const addExpense = async (data: Omit<Expense, 'id' | 'syncMeta'>) => {
    const newExpense = await dbService.addExpense(data);
    await refreshExpenses();
    return newExpense;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const updated = await dbService.updateExpense(id, updates);
    await refreshExpenses();
    return updated;
  };

  const deleteExpense = async (id: string) => {
    await dbService.softDeleteExpense(id);
    await refreshExpenses();
  };
  
  const loadExpensesByWallet = async (walletId: string) => {
    return await dbService.getExpensesByWallet(walletId);
  };

  const deleteTemplate = async (id: string) => {
    await dbService.softDeleteRecurringTemplate(id);
    await refreshTemplates();
  };

  const updateTemplate = async (id: string, updates: Partial<RecurringTemplate>) => {
    const updated = await dbService.updateRecurringTemplate(id, updates);
    await refreshTemplates();
    return updated;
  };

  return (
    <ExpenseContext.Provider value={{ 
      expenses, 
      recurringTemplates,
      isLoading, 
      addExpense, 
      updateExpense, 
      deleteExpense, 
      refreshExpenses,
      loadExpensesByWallet,
      refreshTemplates,
      deleteTemplate,
      updateTemplate
    }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}
