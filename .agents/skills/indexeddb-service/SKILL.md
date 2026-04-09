---
name: indexeddb-service
description: Skill for implementing IndexedDB service layer operations using the idb wrapper, following the project's local-first data patterns.
---

# IndexedDB Service Layer Skill

This skill provides instructions for implementing and extending the IndexedDB service layer in this local-first application. Read this before writing any data access code.

## Core Architecture

The application uses a **DatabaseService singleton** that wraps the `idb` library. All IndexedDB interactions are encapsulated in `src/services/db/`. **No component may call IndexedDB directly.**

### Database Definition

```
Database Name: fintrack_db
Database Version: (incremented per migration)
```

### Object Stores

| Store               | Key Path | FK Relations                                 |
| ------------------- | -------- | -------------------------------------------- |
| `categories`        | `id`     | `parentId` → self                            |
| `wallets`           | `id`     | —                                            |
| `budgets`           | `id`     | `categoryId` → categories, `walletId` → wallets |
| `expenses`          | `id`     | `walletId`, `toWalletId` → wallets; `categoryId` → categories; `budgetId` → budgets; `recurringId` → recurringTemplates |
| `recurringTemplates`| `id`     | templateData contains expense fields         |
| `appSettings`       | `key`    | singleton key-value store                    |

## Write-Through Pattern

Every write operation follows this exact pattern:

```typescript
async function addExpense(expense: NewExpense): Promise<Expense> {
  const record: Expense = {
    ...expense,
    id: crypto.randomUUID(),
    syncMeta: {
      isDirty: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      clientId: await getClientId(),
      version: 1,
    },
  };
  
  // 1. Write to IndexedDB FIRST
  await db.add('expenses', record);
  
  // 2. THEN update React state
  dispatch({ type: 'EXPENSE_ADDED', payload: record });
  
  // 3. Recompute wallet balance
  await recomputeWalletBalance(record.walletId);
  
  return record;
}
```

## Update Pattern

```typescript
async function updateExpense(id: string, changes: Partial<Expense>): Promise<Expense> {
  const existing = await db.get('expenses', id);
  if (!existing) throw new Error(`Expense ${id} not found`);
  
  const updated: Expense = {
    ...existing,
    ...changes,
    syncMeta: {
      ...existing.syncMeta,
      isDirty: true,
      updatedAt: new Date().toISOString(),
      version: existing.syncMeta.version + 1,
    },
  };
  
  await db.put('expenses', updated);
  dispatch({ type: 'EXPENSE_UPDATED', payload: updated });
  return updated;
}
```

## Soft Delete Pattern

```typescript
async function deleteExpense(id: string): Promise<void> {
  const existing = await db.get('expenses', id);
  if (!existing) return;
  
  const deleted: Expense = {
    ...existing,
    syncMeta: {
      ...existing.syncMeta,
      isDirty: true,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: existing.syncMeta.version + 1,
    },
  };
  
  await db.put('expenses', deleted);
  dispatch({ type: 'EXPENSE_DELETED', payload: id });
  await recomputeWalletBalance(existing.walletId);
}
```

## Query Pattern — Always Filter Soft Deletes

```typescript
async function getActiveExpenses(): Promise<Expense[]> {
  const all = await db.getAll('expenses');
  return all.filter(e => e.syncMeta.deletedAt === null);
}

// For index-based queries (preferred for performance):
async function getExpensesByWallet(walletId: string): Promise<Expense[]> {
  const results = await db.getAllFromIndex('expenses', 'walletId', walletId);
  return results.filter(e => e.syncMeta.deletedAt === null);
}
```

## Wallet Balance Recomputation

```typescript
async function recomputeWalletBalance(walletId: string): Promise<void> {
  const wallet = await db.get('wallets', walletId);
  if (!wallet) return;

  const expenses = await getExpensesByWallet(walletId);
  const activeExpenses = expenses.filter(e => e.syncMeta.deletedAt === null);

  const incomeCents = activeExpenses
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + Math.round(e.amount * 100), 0);

  const expenseCents = activeExpenses
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + Math.round(e.amount * 100), 0);

  const currentBalance = wallet.initialBalance + (incomeCents - expenseCents) / 100;

  await db.put('wallets', { ...wallet, currentBalance });
  dispatch({ type: 'WALLET_BALANCE_UPDATED', payload: { walletId, currentBalance } });
}
```

## Multi-Tab Synchronisation

Use the `BroadcastChannel` API to notify other browser tabs of data changes:

```typescript
const channel = new BroadcastChannel('fintrack_sync');

// After every write:
channel.postMessage({ type: 'DATA_CHANGED', store: 'expenses', id: record.id });

// In the app's init:
channel.onmessage = (event) => {
  // Re-fetch affected data from IndexedDB
  refreshContext(event.data.store);
};
```

## Storage Quota Monitoring

```typescript
async function checkStorageQuota(): Promise<{ usage: number; quota: number }> {
  const estimate = await navigator.storage.estimate();
  return {
    usage: estimate.usage ?? 0,
    quota: estimate.quota ?? 0,
  };
}
```

If usage exceeds 80% of quota, display a persistent warning banner.
