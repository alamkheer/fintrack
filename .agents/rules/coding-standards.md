---
name: coding-standards
description: TypeScript and React coding standards, naming conventions, and performance guidelines for the project.
---

# Coding Standards

## TypeScript

1. **Strict mode** — All types must be explicitly defined. Avoid `any`.
2. **Schema types** — All IndexedDB record types MUST be defined in `src/types/schema.ts`. Do not define ad-hoc types for database records in components.
3. **Enums over strings** — Use TypeScript `type` unions for enum-like fields (e.g., `'expense' | 'income' | 'transfer'`). Do not use `enum` keyword — use literal union types for tree-shaking.
4. **UUID generation** — Use `crypto.randomUUID()` for all record IDs.
5. **ISO 8601** — All date/time values stored as ISO 8601 strings, never `Date` objects in storage.

## React Component Patterns

1. **Functional components only** — no class components.
2. **One component per file** — file name matches component name in PascalCase (e.g., `WalletCard.tsx`).
3. **Props interface** — Define a `Props` interface (or `ComponentNameProps`) for every component. Export it if the component is reusable.
4. **Destructure props** in the function signature.
5. **No prop drilling beyond 2 levels** — use Context or composition.
6. **Custom hooks** for any logic shared across 2+ components — place in `src/hooks/`.

## State Management

1. **IndexedDB is the source of truth** — React state (Context) is a cache. Writes go to IndexedDB first, then dispatch to Context.
2. **Write-through pattern**: `await db.add(…) → dispatch({ type: 'ACTION', payload })`.
3. Use React 19's `useOptimistic` for immediate UI feedback during async writes.
4. Contexts should be scoped — avoid a single god-context. Split by domain: `WalletContext`, `ExpenseContext`, `BudgetContext`, etc.

## Naming Conventions

| Entity          | Convention                        | Example               |
| --------------- | --------------------------------- | --------------------- |
| Component files | PascalCase                        | `WalletCard.tsx`      |
| Hook files      | camelCase, `use` prefix           | `useExpenses.ts`      |
| Utility files   | camelCase                         | `currency.ts`         |
| Context files   | PascalCase, `Context` suffix      | `WalletContext.tsx`   |
| Type files      | camelCase                         | `schema.ts`           |
| CSS files       | kebab-case                        | `theme.css`           |
| Constants       | SCREAMING_SNAKE_CASE              | `MAX_TAGS_PER_EXPENSE`|

## Performance Guidelines

1. **Pagination**: All list views (expenses, transactions) — 50 records per page, infinite-scroll.
2. **Web Workers**: Analytics computations for date ranges > 12 months → move to Web Worker.
3. **Index-based queries**: All IndexedDB analytics queries use index-based cursor iteration, never full-table scans.
4. **`smartEntryHistory`**: Capped at 50 entries to prevent unbounded growth.
5. **Lazy loading**: Route-level code splitting via React Router's `lazy()`.

## Performance Targets

| Metric                           | Target     |
| -------------------------------- | ---------- |
| Initial cold load                | < 2 seconds |
| Entry form open-to-ready         | < 200ms    |
| IndexedDB single-record write    | < 50ms     |
| Analytics render (12mo, < 10k records) | < 500ms |

## Security & Privacy

1. **No data leaves the device** unless the user initiates Export.
2. **No external analytics, telemetry, or tracking scripts.**
3. Import files are validated against schema before any write — reject malformed JSON without partial writes.
4. CSP: `default-src 'self'` when served via local server or PWA.
