import type { IDBPDatabase } from 'idb';

export function upgradeV1(db: IDBPDatabase) {
  // Categories store
  const categories = db.createObjectStore('categories', { keyPath: 'id' });
  categories.createIndex('name', 'name', { unique: true });
  categories.createIndex('syncMeta.isDirty', 'syncMeta.isDirty');
  categories.createIndex('syncMeta.deletedAt', 'syncMeta.deletedAt');

  // Wallets store
  const wallets = db.createObjectStore('wallets', { keyPath: 'id' });
  wallets.createIndex('name', 'name', { unique: true });
  wallets.createIndex('type', 'type');
  wallets.createIndex('isArchived', 'isArchived');
  wallets.createIndex('syncMeta.isDirty', 'syncMeta.isDirty');
  wallets.createIndex('syncMeta.deletedAt', 'syncMeta.deletedAt');

  // Budgets store
  const budgets = db.createObjectStore('budgets', { keyPath: 'id' });
  budgets.createIndex('categoryId', 'categoryId');
  budgets.createIndex('walletId', 'walletId');
  budgets.createIndex('periodType', 'periodType');
  budgets.createIndex('status', 'status');
  budgets.createIndex('startDate_endDate', ['startDate', 'endDate']);
  budgets.createIndex('syncMeta.isDirty', 'syncMeta.isDirty');
  budgets.createIndex('syncMeta.deletedAt', 'syncMeta.deletedAt');

  // Expenses store
  const expenses = db.createObjectStore('expenses', { keyPath: 'id' });
  expenses.createIndex('walletId', 'walletId');
  expenses.createIndex('categoryId', 'categoryId');
  expenses.createIndex('budgetId', 'budgetId');
  expenses.createIndex('date', 'date');
  expenses.createIndex('type', 'type');
  expenses.createIndex('wallet_date', ['walletId', 'date']);
  expenses.createIndex('category_date', ['categoryId', 'date']);
  expenses.createIndex('syncMeta.isDirty', 'syncMeta.isDirty');
  expenses.createIndex('syncMeta.deletedAt', 'syncMeta.deletedAt');

  // Recurring templates store
  const templates = db.createObjectStore('recurringTemplates', { keyPath: 'id' });
  templates.createIndex('isActive', 'isActive');
  templates.createIndex('syncMeta.isDirty', 'syncMeta.isDirty');
  templates.createIndex('syncMeta.deletedAt', 'syncMeta.deletedAt');

  // App settings singleton store
  db.createObjectStore('appSettings');
}
