# Project Reference: Edge Cases & Error Handling

Quick-reference for all edge cases and their mandated handling. From SRS §6.

## Browser Storage

| Scenario | Handling |
| --- | --- |
| `navigator.storage.estimate()` returns `quota < 50MB` | Warn user on first launch; suggest enabling persistent storage |
| Persistent storage not granted | Display persistent banner; functionality intact but data may be evicted |
| `QuotaExceededError` on write | Catch at service layer; show blocking modal: "Storage full. Export your data and clear old records." |
| User clears browser data | Detect empty DB on launch → run first-launch setup; show import prompt |
| IndexedDB unavailable (e.g., private browsing) | Detect on init; display warning; fall back to read-only in-memory mode |

### Persistent Storage Request
```javascript
if (navigator.storage && navigator.storage.persist) {
  const isPersisted = await navigator.storage.persist();
  // Store result in appSettings; prompt user if false
}
```

## Multi-Tab Concurrency

- Multiple tabs accessing same IndexedDB can cause read-write conflicts.
- **Mitigation**: Use `BroadcastChannel` API to notify other tabs of writes.
- Other tabs re-fetch affected data on receiving broadcast.
- Show "stale data" banner in non-active tabs prompting refresh.

## Data Integrity

| Scenario | Handling |
| --- | --- |
| Expense → deleted category | Show `[Deleted Category]` with warning icon; expense intact |
| Expense → deleted wallet | Show `[Archived Wallet]`; balance excluded from Net Worth |
| Transfer → deleted destination | Transfer orphaned; show warning in transaction list |
| Budget period overlap | Allow but flag in UI; no automatic deduplication |
| Import schema version mismatch | Block import: "Incompatible version" error |
| Duplicate `id` on import (Merge) | Higher `syncMeta.version` wins; ties → imported record wins |

## Currency & Arithmetic

- **All monetary arithmetic uses integer cents** (avoid floating-point).
- Multi-currency wallets display in native currency.
- Net Worth converts to base currency using **manually entered exchange rates** (no live FX).

## Date Handling

- All stored as ISO 8601.
- SyncMeta timestamps: UTC.
- User-facing dates: respect `appSettings.dateFormat`.
- Budget boundaries: use `appSettings.budgetStartDay`.
- Leap year: Feb 29 in non-leap years → treat as 28th.

## Large Dataset Performance

- IndexedDB queries: use index-based cursors, not full-table scans.
- Analytics > 12 months → Web Worker.
- List views: 50 records/page, infinite scroll.
- `smartEntryHistory`: cap at 50 entries.
