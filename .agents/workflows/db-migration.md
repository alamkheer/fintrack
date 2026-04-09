---
name: db-migration
description: Workflow for creating or modifying an IndexedDB store/schema. Triggers via /db-migration command.
---

# Database Migration Workflow

Use this workflow when the IndexedDB schema needs to change (new store, new index, field changes).

## Step 1: Update Schema Types

1. Open `src/types/schema.ts`.
2. Add or modify the TypeScript interface for the affected record type.
3. Ensure `SyncMeta` is included on the interface.
4. Define all field constraints as comments or JSDoc.

## Step 2: Create Migration File

1. Create a new file in `src/services/db/migrations/` named `v{N}.ts` where N = next DB version.
2. The migration MUST handle upgrading from v{N-1}:

```typescript
// src/services/db/migrations/v2.ts
import type { IDBPDatabase } from 'idb';

export function upgradeV2(db: IDBPDatabase) {
  // Create new store
  const store = db.createObjectStore('newStore', { keyPath: 'id' });
  
  // Add indexes
  store.createIndex('name', 'name', { unique: true });
  store.createIndex('syncMeta.isDirty', 'syncMeta.isDirty');
  store.createIndex('syncMeta.deletedAt', 'syncMeta.deletedAt');
}
```

## Step 3: Update DatabaseService

1. Open `src/services/db/index.ts`.
2. Bump the database version number.
3. Add the migration call to the upgrade handler.
4. Add typed CRUD methods for the new/modified store.

## Step 4: Add Required Indexes

Every store MUST have at minimum:
- `syncMeta.isDirty` — for sync batching
- `syncMeta.deletedAt` — for soft-delete filtering

Additional indexes per the SRS (§2.2–2.7).

## Step 5: Seed Data (if applicable)

If the store requires default data (e.g., system categories with `isSystem: true`), add a seeding function that runs after the upgrade.

## Step 6: Update Context

Create or update the corresponding Context provider to load data from the new store on app init.

## Step 7: Verification

1. Clear IndexedDB in DevTools and reload — verify clean migration.
2. Test with existing data — verify upgrade-in-place works.
3. Confirm all indexes are created correctly in DevTools → Application → IndexedDB.
