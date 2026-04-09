import { openDB, type IDBPDatabase } from 'idb';
import { upgradeV1 } from './migrations/v1';
import { generateUUID } from '../../utils/uuid';
import type { 
  Category, 
  Wallet, 
  Budget, 
  Expense, 
  RecurringTemplate, 
  AppSettings,
  SyncMeta
} from '../../types/schema';

const DB_NAME = 'fintrack_db';
const DB_VERSION = 1;

export interface FinTrackDBSchema extends IDBPDatabase {
  categories: {
    key: string;
    value: Category;
    indexes: {
      name: string;
      'syncMeta.isDirty': boolean;
      'syncMeta.deletedAt': string | null;
    };
  };
  wallets: {
    key: string;
    value: Wallet;
    indexes: {
      name: string;
      type: string;
      isArchived: boolean;
      'syncMeta.isDirty': boolean;
      'syncMeta.deletedAt': string | null;
    };
  };
  budgets: {
    key: string;
    value: Budget;
    indexes: {
      categoryId: string | null;
      walletId: string | null;
      periodType: string;
      status: string;
      startDate_endDate: [string, string | null];
      'syncMeta.isDirty': boolean;
      'syncMeta.deletedAt': string | null;
    };
  };
  expenses: {
    key: string;
    value: Expense;
    indexes: {
      walletId: string;
      categoryId: string;
      budgetId: string | null;
      date: string;
      type: string;
      wallet_date: [string, string];
      category_date: [string, string];
      'syncMeta.isDirty': boolean;
      'syncMeta.deletedAt': string | null;
    };
  };
  recurringTemplates: {
    key: string;
    value: RecurringTemplate;
    indexes: {
      isActive: boolean;
      'syncMeta.isDirty': boolean;
      'syncMeta.deletedAt': string | null;
    };
  };
  appSettings: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, _transaction) {
        if (oldVersion < 1) {
          upgradeV1(db);
        }
      },
    });
  }
  return dbPromise;
}

// Helpers
export async function getClientId(): Promise<string> {
  const db = await initDB();
  let clientId = await db.get('appSettings', 'clientId');
  if (!clientId) {
    clientId = generateUUID();
    await db.put('appSettings', clientId, 'clientId');
  }
  return clientId;
}

export async function buildSyncMeta(): Promise<SyncMeta> {
  const clientId = await getClientId();
  const now = new Date().toISOString();
  return {
    isDirty: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    clientId,
    version: 1,
  };
}

export async function updateSyncMeta(existingMeta: SyncMeta): Promise<SyncMeta> {
  const now = new Date().toISOString();
  return {
    ...existingMeta,
    isDirty: true,
    updatedAt: now,
    version: existingMeta.version + 1,
  };
}

export async function softDeleteSyncMeta(existingMeta: SyncMeta): Promise<SyncMeta> {
  const now = new Date().toISOString();
  return {
    ...existingMeta,
    isDirty: true,
    updatedAt: now,
    deletedAt: now,
    version: existingMeta.version + 1,
  };
}

export const syncChannel = new BroadcastChannel('fintrack_sync');

export function notifySync(store: string, id?: string) {
  const data = { type: 'DATA_CHANGED', store, id };
  syncChannel.postMessage(data);
  // Manually dispatch to self so listeners in the same tab also get it
  syncChannel.dispatchEvent(new MessageEvent('message', { data }));
}

export const dbService = {
  // AppSettings
  async getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K] | undefined> {
    const db = await initDB();
    return db.get('appSettings', key) as Promise<AppSettings[K] | undefined>;
  },
  async setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
    const db = await initDB();
    await db.put('appSettings', value, key);
    notifySync('appSettings', key as string);
  },
  async getAllSettings(): Promise<Partial<AppSettings>> {
    const db = await initDB();
    const tx = db.transaction('appSettings', 'readonly');
    const store = tx.objectStore('appSettings');
    const keys = await store.getAllKeys();
    const values = await store.getAll();
    const result: Partial<AppSettings> = {};
    keys.forEach((key, i) => {
      // @ts-ignore
      result[key as keyof AppSettings] = values[i];
    });
    return result;
  },

  // Generic Operations
  async getAll<T extends { syncMeta: SyncMeta }>(storeName: 'categories' | 'wallets' | 'budgets' | 'expenses' | 'recurringTemplates'): Promise<T[]> {
    const db = await initDB();
    const all = await db.getAll(storeName);
    return all.filter((item: T) => item.syncMeta.deletedAt === null);
  },

  async get<T extends { syncMeta: SyncMeta }>(storeName: 'categories' | 'wallets' | 'budgets' | 'expenses' | 'recurringTemplates', id: string): Promise<T | undefined> {
    const db = await initDB();
    const item = await db.get(storeName, id);
    if (item && item.syncMeta.deletedAt === null) {
      return item as T;
    }
    return undefined;
  },

  // Categories
  async addCategory(data: Omit<Category, 'id' | 'syncMeta'>): Promise<Category> {
    const db = await initDB();
    const record: Category = {
      ...data,
      id: generateUUID(),
      syncMeta: await buildSyncMeta(),
    };
    await db.put('categories', record);
    notifySync('categories', record.id);
    return record;
  },
  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const db = await initDB();
    const existing = await db.get('categories', id);
    if (!existing) throw new Error('Category not found');
    const record: Category = {
      ...existing,
      ...updates,
      syncMeta: await updateSyncMeta(existing.syncMeta),
    };
    await db.put('categories', record);
    notifySync('categories', id);
    return record;
  },
  async softDeleteCategory(id: string): Promise<void> {
    const db = await initDB();
    const existing = await db.get('categories', id);
    if (!existing || existing.isSystem) return; // Cannot delete system categories
    const record: Category = {
      ...existing,
      syncMeta: await softDeleteSyncMeta(existing.syncMeta),
    };
    await db.put('categories', record);
    notifySync('categories', id);
  },

  // Wallets
  async addWallet(data: Omit<Wallet, 'id' | 'syncMeta' | 'currentBalance'>): Promise<Wallet> {
    const db = await initDB();
    const record: Wallet = {
      ...data,
      id: generateUUID(),
      currentBalance: data.initialBalance,
      syncMeta: await buildSyncMeta(),
    };
    await db.put('wallets', record);
    notifySync('wallets', record.id);
    return record;
  },
  async updateWallet(id: string, updates: Partial<Wallet>): Promise<Wallet> {
    const db = await initDB();
    const existing = await db.get('wallets', id);
    if (!existing) throw new Error('Wallet not found');
    const record: Wallet = {
      ...existing,
      ...updates,
      syncMeta: await updateSyncMeta(existing.syncMeta),
    };
    await db.put('wallets', record);
    notifySync('wallets', id);
    return record;
  },
  async archiveWallet(id: string, isArchived: boolean = true): Promise<void> {
    await this.updateWallet(id, { isArchived });
  },
  async recomputeWalletBalance(id: string): Promise<void> {
    const db = await initDB();
    const wallet = await db.get('wallets', id);
    if (!wallet) return;

    const allExpenses = await db.getAllFromIndex('expenses', 'walletId', id);
    const activeExpenses = allExpenses.filter(e => e.syncMeta.deletedAt === null);

    const incomeCents = activeExpenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + Math.round(e.amount * 100), 0);

    const expenseCents = activeExpenses
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + Math.round(e.amount * 100), 0);

    const currentBalance = wallet.initialBalance + (incomeCents - expenseCents) / 100;
    
    await this.updateWallet(id, { currentBalance });
  },

  // Expenses
  async getExpensesByWallet(walletId: string): Promise<Expense[]> {
    const db = await initDB();
    const results = await db.getAllFromIndex('expenses', 'walletId', walletId);
    return results.filter(e => e.syncMeta.deletedAt === null);
  },
  async addExpense(data: Omit<Expense, 'id' | 'syncMeta'>): Promise<Expense> {
    const db = await initDB();
    const record: Expense = {
      ...data,
      id: generateUUID(),
      syncMeta: await buildSyncMeta(),
    };
    await db.put('expenses', record);
    notifySync('expenses', record.id);
    
    await this.recomputeWalletBalance(record.walletId);
    if (record.toWalletId) {
      await this.recomputeWalletBalance(record.toWalletId);
    }
    
    return record;
  },
  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    const db = await initDB();
    const existing = await db.get('expenses', id);
    if (!existing) throw new Error('Expense not found');
    const record: Expense = {
      ...existing,
      ...updates,
      syncMeta: await updateSyncMeta(existing.syncMeta),
    };
    await db.put('expenses', record);
    notifySync('expenses', id);
    
    await this.recomputeWalletBalance(existing.walletId);
    if (updates.walletId && updates.walletId !== existing.walletId) {
      await this.recomputeWalletBalance(updates.walletId);
    }
    if (existing.toWalletId) await this.recomputeWalletBalance(existing.toWalletId);
    if (updates.toWalletId && updates.toWalletId !== existing.toWalletId) {
      await this.recomputeWalletBalance(updates.toWalletId);
    }
    
    return record;
  },
  async softDeleteExpense(id: string): Promise<void> {
    const db = await initDB();
    const existing = await db.get('expenses', id);
    if (!existing) return;
    const record: Expense = {
      ...existing,
      syncMeta: await softDeleteSyncMeta(existing.syncMeta),
    };
    await db.put('expenses', record);
    notifySync('expenses', id);

    await this.recomputeWalletBalance(existing.walletId);
    if (existing.toWalletId) {
      await this.recomputeWalletBalance(existing.toWalletId);
    }
  },

  // Budgets
  async addBudget(data: Omit<Budget, 'id' | 'syncMeta'>): Promise<Budget> {
    const db = await initDB();
    const record: Budget = {
      ...data,
      id: generateUUID(),
      syncMeta: await buildSyncMeta(),
    };
    await db.put('budgets', record);
    notifySync('budgets', record.id);
    return record;
  },
  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    const db = await initDB();
    const existing = await db.get('budgets', id);
    if (!existing) throw new Error('Budget not found');
    const record: Budget = {
      ...existing,
      ...updates,
      syncMeta: await updateSyncMeta(existing.syncMeta),
    };
    await db.put('budgets', record);
    notifySync('budgets', id);
    return record;
  },
  async softDeleteBudget(id: string): Promise<void> {
    const db = await initDB();
    const existing = await db.get('budgets', id);
    if (!existing) return;
    const record: Budget = {
      ...existing,
      syncMeta: await softDeleteSyncMeta(existing.syncMeta),
    };
    await db.put('budgets', record);
    notifySync('budgets', id);
  },
  
  // Recurring Templates
  async addRecurringTemplate(data: Omit<RecurringTemplate, 'id' | 'syncMeta'>): Promise<RecurringTemplate> {
    const db = await initDB();
    const record: RecurringTemplate = {
      ...data,
      id: generateUUID(),
      syncMeta: await buildSyncMeta(),
    };
    await db.put('recurringTemplates', record);
    notifySync('recurringTemplates', record.id);
    return record;
  },
  async updateRecurringTemplate(id: string, updates: Partial<RecurringTemplate>): Promise<RecurringTemplate> {
    const db = await initDB();
    const existing = await db.get('recurringTemplates', id);
    if (!existing) throw new Error('Template not found');
    const record: RecurringTemplate = {
      ...existing,
      ...updates,
      syncMeta: await updateSyncMeta(existing.syncMeta),
    };
    await db.put('recurringTemplates', record);
    notifySync('recurringTemplates', id);
    return record;
  },
  async softDeleteRecurringTemplate(id: string): Promise<void> {
    const db = await initDB();
    const existing = await db.get('recurringTemplates', id);
    if (!existing) return;
    const record: RecurringTemplate = {
      ...existing,
      syncMeta: await softDeleteSyncMeta(existing.syncMeta),
    };
    await db.put('recurringTemplates', record);
    notifySync('recurringTemplates', id);
  }
};
