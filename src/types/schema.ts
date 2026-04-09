export interface SyncMeta {
  isDirty: boolean;
  createdAt: string;        // ISO 8601 UTC
  updatedAt: string;        // ISO 8601 UTC
  deletedAt: string | null; // null = active
  clientId: string;         // UUID
  version: number;          // Increment on each write
}

export type CategoryType = 'expense' | 'income' | 'transfer';

export interface Category {
  id: string; // UUID
  name: string; // unique, max 50 chars
  icon: string; // emoji or icon key
  color: string; // hex format
  type: CategoryType;
  isSystem: boolean; // default false
  parentId: string | null; // FK to categories.id
  syncMeta: SyncMeta;
}

export type WalletType = 'cash' | 'bank' | 'credit' | 'investment' | 'savings' | 'ewallet';

export interface Wallet {
  id: string; // UUID
  name: string; // unique, max 60 chars
  type: WalletType;
  currency: string; // ISO 4217, default GBP
  initialBalance: number; // min 0
  currentBalance: number; // computed cache
  color: string; // hex format
  icon: string; // emoji or icon key
  cardLastFour: string | null; // max 4 digits
  isArchived: boolean; // default false
  displayOrder: number;
  syncMeta: SyncMeta;
}

export type BudgetPeriodType = 'monthly' | 'yearly' | 'custom' | 'event';
export type BudgetStatus = 'active' | 'paused' | 'completed' | 'archived';
export type BudgetType = 'expense' | 'sinking_fund' | 'event';

export interface Budget {
  id: string; // UUID
  name: string; // max 80 chars
  categoryId: string | null; // FK to categories.id
  walletId: string | null; // FK to wallets.id
  periodType: BudgetPeriodType;
  startDate: string; // ISO 8601 date
  endDate: string | null;
  limitAmount: number; // positive float
  currency: string; // ISO 4217
  rollover: boolean; // default false
  rolloverAmount: number; // default 0
  alertThreshold: number; // 0-1, default 0.8
  status: BudgetStatus;
  budgetType: BudgetType;
  targetAmount: number | null; // for sinking funds
  notes: string; // max 500 chars
  syncMeta: SyncMeta;
}

export type ExpenseType = 'expense' | 'income' | 'transfer';
export type SmartEntrySource = 'manual' | 'smart' | 'import' | null;

export interface Expense {
  id: string; // UUID
  type: ExpenseType;
  amount: number; // positive float, internally manipulated as cents
  currency: string; // ISO 4217
  date: string; // ISO 8601 date
  time: string | null; // HH:MM
  description: string; // max 200 chars
  notes: string; // max 1000 chars
  categoryId: string; // FK to categories.id
  walletId: string; // FK to wallets.id
  toWalletId: string | null; // destination for transfers
  budgetId: string | null; // FK to budgets.id
  tags: string[]; // max 10 tags, 30 chars each
  isRecurring: boolean; // default false
  recurringId: string | null; // FK to recurringTemplates.id
  attachmentRef: string | null; // Base64 key or IndexedDB ref
  smartEntrySource: SmartEntrySource;
  syncMeta: SyncMeta;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface RecurringTemplate {
  id: string; // UUID
  name: string; // max 80 chars
  frequency: RecurringFrequency;
  dayOfMonth: number | null; // 1-31
  dayOfWeek: number | null; // 0-6
  templateData: Partial<Expense>;
  nextDueDate: string; // ISO 8601 date
  isActive: boolean; // default true
  syncMeta: SyncMeta;
}

export type ThemePreference = 'dark' | 'light' | 'system';

export interface AppSettings {
  defaultCurrency: string; // default GBP
  defaultWalletId: string | null; // default null
  theme: ThemePreference; // default light
  dateFormat: string; // default DD/MM/YYYY
  firstDayOfWeek: number; // default 1 (Monday)
  budgetStartDay: number; // default 1
  clientId: string; // UUID at install
  lastSyncAt: string | null; // default null
  smartEntryHistory: string[]; // default []
}
