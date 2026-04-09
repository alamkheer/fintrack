---
name: new-feature
description: Workflow for implementing a new feature end-to-end. Triggers via /new-feature command.
---

# New Feature Implementation Workflow

Use this workflow when adding a new feature to the personal finance tracker.

## Step 1: Requirement Mapping

1. Identify the relevant **FR-** codes from `docs/srs.md` (e.g., FR-BUD-01, FR-EXP-03).
2. List all affected:
   - IndexedDB stores (§2 of SRS)
   - React Contexts
   - Pages / routes
   - Components

## Step 2: Schema & Types

1. Add or update TypeScript types in `src/types/schema.ts`.
2. If a new IndexedDB store is needed, create a migration file in `src/services/db/migrations/`.
3. Update the `DatabaseService` in `src/services/db/index.ts` with typed CRUD methods.
4. Ensure `SyncMeta` is included on every new record type.

## Step 3: Service Layer

1. Implement data access methods in `src/services/db/`.
2. Follow the write-through pattern:
   ```typescript
   async function addRecord(data: NewRecord): Promise<Record> {
     const record = { ...data, id: crypto.randomUUID(), syncMeta: buildSyncMeta() };
     await db.add('storeName', record);
     dispatch({ type: 'RECORD_ADDED', payload: record });
     return record;
   }
   ```
3. All queries filter `syncMeta.deletedAt === null` by default.

## Step 4: Context & State

1. Create or update the relevant Context provider in `src/contexts/`.
2. Define reducer actions for CRUD operations.
3. Load initial data from IndexedDB on mount.

## Step 5: UI Components

1. Build components following the Digital Parchment design system (see `.agents/skills/digital-parchment/SKILL.md`).
2. Read the design reference at `.agents/skills/digital-parchment/design-reference.md`.
3. Ensure adherence to `.agents/rules/ui-ux-standards.md` (accessibility, keyboard nav, responsive).
4. Apply the tri-font hierarchy: Plus Jakarta Sans → Inter → Space Grotesk.

## Step 6: Routing

1. Add the page component to React Router v7 configuration in `App.tsx`.
2. Use route-level code splitting with `lazy()`.

## Step 7: Verification

1. Verify the feature works in all responsive breakpoints (mobile, tablet, desktop).
2. Test keyboard navigation and screen reader accessibility.
3. Verify IndexedDB writes are correct (use browser DevTools → Application → IndexedDB).
4. Check dark mode rendering.
5. Ensure no console errors or TypeScript warnings.
