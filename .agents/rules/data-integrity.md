---
name: data-integrity
description: Rules for ensuring data integrity, safe IndexedDB operations, and correct monetary arithmetic throughout the application.
---

# Data Integrity Rules

## Monetary Arithmetic

1. **Integer Cents Only** — All monetary arithmetic MUST use integer pence/cents internally. Never perform arithmetic directly on floating-point currency values.

   ```typescript
   // ✅ Correct
   const amountCents = Math.round(parseFloat(input) * 100);
   const display = (amountCents / 100).toLocaleString('en-GB', {
     style: 'currency',
     currency: 'GBP',
   });

   // ❌ Wrong — floating-point drift
   const total = 0.1 + 0.2; // 0.30000000000000004
   ```

2. **All currency display** must go through `src/utils/currency.ts` — no inline `toLocaleString` calls in components.

## SyncMeta — Every Record, Every Time

Every record in every IndexedDB store MUST include a valid `SyncMeta` envelope:

```typescript
interface SyncMeta {
  isDirty: boolean;         // true on create/update
  createdAt: string;        // ISO 8601 UTC
  updatedAt: string;        // ISO 8601 UTC
  deletedAt: string | null; // null = active record
  clientId: string;         // UUID from appSettings
  version: number;          // Increment on every write
}
```

### Write Rules
- On **create**: `isDirty = true`, `version = 1`, `createdAt = updatedAt = now()`.
- On **update**: `isDirty = true`, `version++`, `updatedAt = now()`.
- On **delete**: Never hard-delete — set `deletedAt = now()`, `isDirty = true`, `version++`.

## Soft Deletes

1. **No hard deletes** except via an explicit user-triggered "Purge deleted records" action.
2. All queries MUST filter `WHERE syncMeta.deletedAt IS NULL` by default.
3. Deleted records are still visible in a "Trash" view.

## Date Handling

1. **Storage**: ISO 8601 (`YYYY-MM-DD` for dates, `YYYY-MM-DDTHH:MM:SSZ` for timestamps).
2. **SyncMeta timestamps**: Always UTC.
3. **User-facing dates**: Respect `appSettings.dateFormat` and browser locale.
4. **Budget boundaries**: Use `appSettings.budgetStartDay` (e.g., month runs 15th → 14th if set to 15).
5. **Leap years**: February 29th entries in non-leap years → treat as 28th.

## Wallet Balance Computation

- `currentBalance` is **always recomputed** from: `initialBalance + SUM(income) - SUM(expenses)`.
- It is stored as a cache but NEVER used as the source of truth — recalculate on every expense write.
- This prevents balance drift from partial writes or crashed transactions.

## Foreign Key Integrity

| Scenario | Required Handling |
| --- | --- |
| Expense → deleted category | Show `[Deleted Category]` + warning icon |
| Expense → deleted wallet | Show `[Archived Wallet]`; exclude from Net Worth |
| Transfer → deleted destination | Show warning in transaction list |
| Budget period overlap | Allow but flag in UI — no automatic deduplication |

## Data Export / Import

- **Export**: Include `schemaVersion` header. Support JSON (lossless) and CSV (expenses only).
- **Import Merge**: Upsert by `id`; higher `syncMeta.version` wins; ties → imported record wins.
- **Import Replace**: Wipe all data → requires explicit confirmation dialog.
- **Validation**: Reject incompatible `schemaVersion` with clear error. No partial writes on malformed JSON.
