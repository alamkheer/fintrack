# Software Requirements Specification (SRS)
## Personal Finance Tracker — Local-First Web Application
**Version:** 1.1.0 | **Status:** Draft | **Stack:** React 19 + Tailwind CSS v4 + IndexedDB

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Data Schema Design](#2-data-schema-design)
3. [Local-First Strategy](#3-local-first-strategy)
4. [Feature Decomposition](#4-feature-decomposition)
5. [UI/UX Specifications](#5-uiux-specifications)
6. [Edge Cases & Constraints](#6-edge-cases--constraints)
7. [Non-Functional Requirements](#7-non-functional-requirements)

---

## 1. System Overview

### 1.1 Purpose
A 100% client-side personal finance tracker targeting long-term solo use. All data resides in the browser's IndexedDB with zero external dependencies for core functionality. The architecture is forward-compatible with a one-click cloud sync layer via an upsert-based synchronisation protocol.

### 1.2 Design Principles
- **Local-First:** Data is always available offline. The network is an enhancement, never a requirement.
- **Manual Entry as a Feature:** Fast, keyboard-driven data entry is a first-class citizen.
- **Long-Term Portability:** All data must be exportable and importable in open formats (JSON/CSV).
- **Future-Proof Schema:** Every record carries metadata (`syncMeta`) enabling future cloud sync without schema migration.

### 1.3 Technology Constraints
| Concern | Technology |
|---|---|
| UI Framework | React 19 (Hooks, Context API, Server Actions disabled — client-only) |
| Styling | Tailwind CSS v4 (CSS-first config, no `tailwind.config.js`) |
| Client Storage | IndexedDB (via `idb` wrapper library) |
| State Management | React Context + `useReducer` (React 19 `use()` hook where applicable) |
| Routing | React Router v7 |
| Build Tool | Vite 6+ (with `@tailwindcss/vite` plugin) |

> **React 19 Notes:** The app targets React 19 stable. Key implications:
> - Use the new `use()` hook for consuming Context and resolving Promises inside render.
> - `useFormStatus` and `useOptimistic` are available for form UX and optimistic expense updates.
> - `ref` is now a regular prop (no `forwardRef` wrapper needed).
> - React Compiler (`@vitejs/plugin-react`) is enabled; avoid manual `useMemo`/`useCallback` unless the compiler's output is demonstrably insufficient.
> - `ReactDOM.createRoot` API unchanged; hydration APIs not relevant (client-only app).

> **Tailwind CSS v4 Notes:** v4 replaces `tailwind.config.js` with a CSS-first configuration file.
> - All theme tokens are defined in a root CSS file using `@theme { }` blocks.
> - The `@tailwindcss/vite` Vite plugin replaces the PostCSS pipeline.
> - `JIT` mode is the only mode — no distinction needed.
> - The `dark:` variant is configured via `@variant dark (.dark &);` in the theme file.
> - Arbitrary values (e.g., `bg-[#8655f6]`) remain supported.

---

## 2. Data Schema Design

### 2.1 IndexedDB Database Definition
```
Database Name: fintrack_db
Database Version: 1
```

All object stores use the `syncMeta` pattern — a nested object appended to every record to support future synchronisation without altering the primary schema.

```typescript
// Universal SyncMeta — appended to EVERY record
interface SyncMeta {
  isDirty: boolean;         // true = modified since last sync
  createdAt: string;        // ISO 8601 UTC
  updatedAt: string;        // ISO 8601 UTC
  deletedAt: string | null; // Soft-delete timestamp (null = active)
  clientId: string;         // UUID of the originating browser session
  version: number;          // Optimistic concurrency counter (increment on each write)
}
```

---

### 2.2 Object Store: `categories`

**Key Path:** `id` (auto-increment) | **Indexes:** `name` (unique)

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `string` (UUID) | PK, required | Stable identifier (UUID v4) |
| `name` | `string` | required, unique, max 50 chars | Display name (e.g., "Groceries") |
| `icon` | `string` | required | Emoji or icon key |
| `color` | `string` | required, hex format | Tailwind-compatible hex color |
| `type` | `enum` | `'expense' \| 'income' \| 'transfer'` | Category type |
| `isSystem` | `boolean` | default `false` | `true` = seeded default, undeletable |
| `parentId` | `string \| null` | FK → `categories.id` | For subcategory support |
| `syncMeta` | `SyncMeta` | required | Sync envelope |

**Indexes:**
- `name` — unique, for duplicate prevention
- `syncMeta.isDirty` — for batching sync operations
- `syncMeta.deletedAt` — for filtering soft-deleted records

---

### 2.3 Object Store: `wallets`

**Key Path:** `id` | **Indexes:** `name`, `type`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `string` (UUID) | PK, required | Stable identifier |
| `name` | `string` | required, unique, max 60 chars | Display name (e.g., "Monzo Current") |
| `type` | `enum` | `'cash' \| 'bank' \| 'credit' \| 'investment' \| 'savings' \| 'ewallet'` | Wallet type |
| `currency` | `string` | ISO 4217, default `'GBP'` | 3-letter currency code |
| `initialBalance` | `number` | required, min 0 | Balance at wallet creation |
| `currentBalance` | `number` | computed, stored as cache | Recomputed from transactions |
| `color` | `string` | required, hex format | Card display colour |
| `icon` | `string` | required | Emoji or icon key |
| `cardLastFour` | `string \| null` | max 4 digits, nullable | For display on card UI |
| `isArchived` | `boolean` | default `false` | Hidden from active views |
| `displayOrder` | `number` | integer | Gallery sort order |
| `syncMeta` | `SyncMeta` | required | Sync envelope |

**Indexes:**
- `type` — for filtering by wallet type
- `isArchived` — for excluding archived wallets in main view
- `syncMeta.isDirty` — for sync batching

---

### 2.4 Object Store: `budgets`

**Key Path:** `id` | **Indexes:** `period`, `categoryId`, `status`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `string` (UUID) | PK, required | Stable identifier |
| `name` | `string` | required, max 80 chars | Budget name (e.g., "Q1 Groceries") |
| `categoryId` | `string \| null` | FK → `categories.id`, nullable | `null` = global/all-category budget |
| `walletId` | `string \| null` | FK → `wallets.id`, nullable | `null` = applies to all wallets |
| `periodType` | `enum` | `'monthly' \| 'yearly' \| 'custom' \| 'event'` | Budget period type |
| `startDate` | `string` | ISO 8601 date | Inclusive start |
| `endDate` | `string \| null` | ISO 8601 date, nullable | `null` for rolling monthly |
| `limitAmount` | `number` | required, positive float | Spending cap |
| `currency` | `string` | ISO 4217 | Inherited from wallet or default |
| `rollover` | `boolean` | default `false` | Carry unspent amount to next period |
| `rolloverAmount` | `number` | default `0` | Computed carry-forward |
| `alertThreshold` | `number` | 0–1, default `0.8` | Fraction of limit that triggers UI warning |
| `status` | `enum` | `'active' \| 'paused' \| 'completed' \| 'archived'` | Lifecycle state |
| `budgetType` | `enum` | `'expense' \| 'sinking_fund' \| 'event'` | Determines contribution logic |
| `targetAmount` | `number \| null` | nullable | For sinking funds: savings goal |
| `notes` | `string` | max 500 chars | Free-text notes |
| `syncMeta` | `SyncMeta` | required | Sync envelope |

**Indexes:**
- `categoryId` — for filtering expenses by budget category
- `periodType` — for period-specific analytics views
- `status` — for active/paused/archived filtering
- `startDate, endDate` — compound index for date-range queries
- `syncMeta.isDirty` — for sync batching

---

### 2.5 Object Store: `expenses`

**Key Path:** `id` | **Indexes:** `walletId`, `categoryId`, `budgetId`, `date`, `type`

> This is the highest-volume store. Write performance and query flexibility are critical.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `string` (UUID) | PK, required | Stable identifier |
| `type` | `enum` | `'expense' \| 'income' \| 'transfer'` | Transaction type |
| `amount` | `number` | required, positive float | Absolute value (sign from `type`) |
| `currency` | `string` | ISO 4217 | Transaction currency |
| `date` | `string` | ISO 8601 date | User-entered transaction date |
| `time` | `string \| null` | `HH:MM`, nullable | Optional time for same-day ordering |
| `description` | `string` | required, max 200 chars | Transaction description |
| `notes` | `string` | max 1000 chars | Extended notes |
| `categoryId` | `string` | FK → `categories.id`, required | Primary category |
| `walletId` | `string` | FK → `wallets.id`, required | Source wallet |
| `toWalletId` | `string \| null` | FK → `wallets.id`, nullable | Destination wallet (transfers only) |
| `budgetId` | `string \| null` | FK → `budgets.id`, nullable | Associated budget (manual or auto-matched) |
| `tags` | `string[]` | max 10 tags, each max 30 chars | User-defined tags |
| `isRecurring` | `boolean` | default `false` | Flag for recurring entries |
| `recurringId` | `string \| null` | FK → `recurringTemplates.id` | Links to template if auto-generated |
| `attachmentRef` | `string \| null` | Base64 key or IndexedDB ref | Receipt image reference |
| `smartEntrySource` | `enum \| null` | `'manual' \| 'smart' \| 'import'` | Entry method tracking |
| `syncMeta` | `SyncMeta` | required | Sync envelope |

**Indexes:**
- `walletId` — for wallet-specific transaction history
- `categoryId` — for category analytics
- `budgetId` — for budget spend calculation
- `date` — for date-range queries (most common analytics axis)
- `type` — for income/expense/transfer filtering
- `[walletId, date]` — compound index for wallet + period queries
- `[categoryId, date]` — compound index for category + period analytics
- `syncMeta.isDirty` — for sync batching
- `syncMeta.deletedAt` — for soft-delete filtering

---

### 2.6 Object Store: `recurringTemplates`

**Key Path:** `id`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `string` (UUID) | PK, required | Stable identifier |
| `name` | `string` | required, max 80 chars | Template name |
| `frequency` | `enum` | `'daily' \| 'weekly' \| 'biweekly' \| 'monthly' \| 'yearly'` | Recurrence interval |
| `dayOfMonth` | `number \| null` | 1–31 | For monthly recurrence |
| `dayOfWeek` | `number \| null` | 0–6 | For weekly recurrence |
| `templateData` | `Partial<Expense>` | required | Pre-filled expense fields |
| `nextDueDate` | `string` | ISO 8601 date | Computed next occurrence |
| `isActive` | `boolean` | default `true` | Pauses reminder without deleting |
| `syncMeta` | `SyncMeta` | required | Sync envelope |

---

### 2.7 Object Store: `appSettings`

**Key Path:** `key` (string singleton store)

| Key | Value Type | Default | Description |
|---|---|---|---|
| `defaultCurrency` | `string` | `'GBP'` | App-wide default currency |
| `defaultWalletId` | `string \| null` | `null` | Pre-selected wallet on entry form |
| `theme` | `enum` | `'dark' \| 'light' \| 'system'` | UI theme preference |
| `dateFormat` | `string` | `'DD/MM/YYYY'` | User-preferred date format |
| `firstDayOfWeek` | `number` | `1` (Monday) | 0=Sunday, 1=Monday |
| `budgetStartDay` | `number` | `1` | Monthly budget cycle start day |
| `clientId` | `string` | UUID generated at install | Unique browser identity for sync |
| `lastSyncAt` | `string \| null` | `null` | ISO 8601 timestamp of last successful sync |
| `smartEntryHistory` | `string[]` | `[]` | Last 50 descriptions for autocomplete |

---

## 3. Local-First Strategy

### 3.1 Data Persistence

- All writes go directly to IndexedDB via a typed `db.ts` service layer. React state is never the source of truth — IndexedDB is.
- On app init, data is loaded from IndexedDB into a React Context. Subsequent writes update both IndexedDB and Context atomically (write-through pattern).
- A `DatabaseService` singleton wraps the `idb` library, exposing typed CRUD methods. All methods return `Promise` and handle errors gracefully.

```typescript
// Conceptual write pattern
async function addExpense(expense: NewExpense): Promise<Expense> {
  const record: Expense = {
    ...expense,
    id: crypto.randomUUID(),
    syncMeta: buildSyncMeta(), // isDirty: true, createdAt: now, version: 1
  };
  await db.add('expenses', record);
  dispatch({ type: 'EXPENSE_ADDED', payload: record });
  return record;
}
```

### 3.2 Dirty Flags for Future Cloud Sync

Every write sets `syncMeta.isDirty = true` and increments `syncMeta.version`. A future sync engine will:
1. Query all stores with `syncMeta.isDirty === true`.
2. POST a batch payload to a sync endpoint.
3. On 200 OK, set `isDirty = false` and record `lastSyncAt`.
4. Use `syncMeta.version` for optimistic concurrency (last-write-wins or server-adjudicated conflict resolution).

**Conflict Resolution Strategy (future):** Client version is sent alongside each record. Server returns a `409 Conflict` if the server version is ahead. The client displays a diff UI and lets the user choose which version to keep.

### 3.3 Soft Deletes

No records are hard-deleted from IndexedDB unless the user explicitly triggers a "Purge deleted records" action. Deletions set `syncMeta.deletedAt = new Date().toISOString()`. All queries filter `WHERE syncMeta.deletedAt IS NULL` by default.

### 3.4 Data Export

**Functional Requirements:**
- User can export ALL data or a filtered subset (by date range, wallet, category).
- Export formats: **JSON** (complete, lossless) and **CSV** (expenses only, for spreadsheet compatibility).
- JSON export includes schema version header for future import compatibility checking.
- Export is triggered from a Settings page with a single button click.
- File is downloaded directly to the browser's default download folder (no server upload).

**JSON Export Schema:**
```json
{
  "exportMeta": {
    "appVersion": "1.0.0",
    "schemaVersion": 1,
    "exportedAt": "2025-01-01T00:00:00Z",
    "clientId": "uuid-of-source-client"
  },
  "data": {
    "categories": [...],
    "wallets": [...],
    "budgets": [...],
    "expenses": [...],
    "recurringTemplates": [...]
  }
}
```

**CSV Export Columns (Expenses):**
`id, date, time, type, amount, currency, description, category, wallet, tags, notes, budgetName, createdAt`

### 3.5 Data Import

**Functional Requirements:**
- User can import a previously exported JSON file.
- Import modes:
  - **Merge:** Upsert by `id`. Records with matching IDs are updated only if the imported `syncMeta.version` is higher.
  - **Replace:** Wipe all user data and replace with imported data. Requires confirmation dialog.
- Import validates the `schemaVersion` field and rejects incompatible versions with a clear error message.
- Import shows a summary: records added, updated, skipped, and errors.
- CSV import: supported for `expenses` only. Maps columns to schema fields; unmapped required fields prompt the user.

### 3.6 Storage Quota Management

- On startup, the app calls `navigator.storage.estimate()` and stores the result.
- A `StorageService` computes approximate IndexedDB usage by tracking record counts and average record sizes.
- A storage usage indicator is displayed in Settings (e.g., "IndexedDB: ~4.2 MB used").
- If usage exceeds 80% of `quota`, a persistent banner warns the user and links to the Export and Purge tools.

---

## 4. Feature Decomposition

### 4.1 Budget Management

#### 4.1.1 Functional Requirements
- FR-BUD-01: User can create a budget with period type: `monthly`, `yearly`, or `custom` (arbitrary date range).
- FR-BUD-02: User can create an `event` budget (e.g., "Christmas 2025") with a fixed start/end date.
- FR-BUD-03: User can create a `sinking_fund` budget with a target amount and target date; the app computes the required monthly contribution.
- FR-BUD-04: User can associate a budget with one category or leave it global (all categories).
- FR-BUD-05: User can associate a budget with one wallet or leave it wallet-agnostic.
- FR-BUD-06: User can set an alert threshold (default 80%) — a warning colour is applied when crossed.
- FR-BUD-07: User can enable `rollover` — unspent budget amount is carried forward to the next period.
- FR-BUD-08: User can pause, archive, or delete (soft) a budget.
- FR-BUD-09: System resets monthly/yearly budgets automatically when the new period starts (computed, not stored — current spend is recalculated from expenses).
- FR-BUD-10: User can add free-text notes to a budget.

#### 4.1.2 User Flow: Create Monthly Budget
```
Settings / Budgets → [+ New Budget]
  → Select Period Type: Monthly
  → Enter Name, Limit Amount, Currency
  → Select Category (optional)
  → Select Wallet (optional)
  → Set Alert Threshold (slider, default 80%)
  → Toggle Rollover on/off
  → [Save] → Budget card appears in Budget list
```

#### 4.1.3 Sinking Fund Calculation
```
Monthly Contribution = (targetAmount - currentSaved) / monthsRemaining
```
This is displayed in real-time as the user fills in the target amount and target date.

---

### 4.2 Expense Tracking

#### 4.2.1 Functional Requirements
- FR-EXP-01: User can add an expense, income, or transfer via a manual entry form.
- FR-EXP-02: The entry form supports keyboard-first navigation (Tab through fields, Enter to submit).
- FR-EXP-03: Date field defaults to today; user can back-date or future-date entries.
- FR-EXP-04: Amount field accepts decimal input; locale-aware formatting is applied on blur.
- FR-EXP-05: User can add tags (comma-separated or chip-based) to any transaction.
- FR-EXP-06: User can add a note (rich text not required; plain text sufficient).
- FR-EXP-07: User can edit any past expense. Edit creates a new `updatedAt` timestamp and bumps `version`.
- FR-EXP-08: User can soft-delete an expense (moves to Trash; restores wallet balance).
- FR-EXP-09: Transfer entries create two linked expense records: one debit on source wallet, one credit on destination wallet. Both reference a shared `transferGroupId`.
- FR-EXP-10: User can duplicate an existing expense with a single action.
- FR-EXP-11: Wallet `currentBalance` is recomputed on every expense write (not stored as a running total to avoid drift; computed as `initialBalance + SUM(income) - SUM(expenses)` within the wallet).

#### 4.2.2 User Flow: Add Expense
```
[+ Expense] FAB (any screen) or keyboard shortcut [N]
  → Entry Drawer/Modal opens
  → Fields (in Tab order):
      1. Type toggle (Expense / Income / Transfer) [default: Expense]
      2. Amount [number, autofocus]
      3. Date [date picker, default: today]
      4. Category [searchable dropdown]
      5. Wallet [dropdown, default: defaultWalletId setting]
      6. Description [text, smart autocomplete from history]
      7. Budget [optional, auto-matched or manual select]
      8. Tags [chip input]
      9. Notes [textarea, collapsible]
  → [Save — Enter] or [Cancel — Esc]
  → Toast: "Expense saved. [Undo]" (5s window)
```

#### 4.2.3 Smart Entry
- FR-SMART-01: The `description` field queries `smartEntryHistory` (last 50 unique descriptions) and presents matching suggestions as the user types.
- FR-SMART-02: When a suggestion is selected, the system auto-fills: `categoryId`, `walletId`, and `amount` from the most recent matching transaction.
- FR-SMART-03: Auto-filled fields are visually highlighted; user can override any field.
- FR-SMART-04: After save, the description is prepended to `smartEntryHistory` (deduped, max 50).

---

### 4.3 Wallet View

#### 4.3.1 Functional Requirements
- FR-WAL-01: Wallets are displayed as a scrollable gallery of card-style tiles.
- FR-WAL-02: Each card displays: wallet name, type icon, current balance, currency, card colour, and last-four digits (if set).
- FR-WAL-03: User can reorder cards via drag-and-drop (updates `displayOrder`).
- FR-WAL-04: Tapping/clicking a wallet card opens a detail view showing recent transactions filtered to that wallet.
- FR-WAL-05: User can add, edit, or archive wallets. Archived wallets are hidden from the gallery (accessible via a toggle).
- FR-WAL-06: A "Net Worth" summary card is displayed at the top of the gallery, summing all non-archived wallet balances.
- FR-WAL-07: Balance display supports positive (green) and negative (red) colouring for credit wallets.

#### 4.3.2 Wallet Card UI Spec
```
┌──────────────────────────────────┐
│ [Icon]  Monzo Current    [•••]   │  ← context menu
│                                  │
│         £ 1,245.80               │  ← large, prominent balance
│                                  │
│  BANK              •••• 4242     │  ← type label + last four
└──────────────────────────────────┘
```
Background: user-selected colour (full card). Text: white (contrast-checked, min 4.5:1 ratio).

---

### 4.4 Analytics

#### 4.4.1 Functional Requirements
- FR-ANA-01: "Spent vs. Limit" bar or radial chart per active budget, rendered for the current period.
- FR-ANA-02: Category breakdown: pie/donut chart of spending by category for a selectable date range.
- FR-ANA-03: Spending trend: line chart of daily/weekly/monthly totals over a rolling 12-month window.
- FR-ANA-04: Income vs. Expense summary card for the selected period (net cashflow).
- FR-ANA-05: Wallet balance history: area chart reconstructed from transaction history.
- FR-ANA-06: All analytics are computed client-side from IndexedDB queries; no server round-trip.
- FR-ANA-07: User can filter all analytics by: date range, wallet, category, budget.
- FR-ANA-08: Charts are rendered using a lightweight library compatible with Tailwind (e.g., Recharts or Chart.js).

#### 4.4.2 Period Selector
- Presets: This Month, Last Month, Last 3 Months, This Year, All Time.
- Custom: date-range picker (start + end date).
- Selected period persists in URL query params for shareability (local use) and browser back-button support.

---

### 4.5 Event-Based Budgeting

#### 4.5.1 Functional Requirements
- FR-EVT-01: User creates an event budget with a name, fixed date range, and spending limit.
- FR-EVT-02: Event budgets appear in a dedicated "Events" section with a countdown to the event end date.
- FR-EVT-03: Expenses can be manually tagged to an event budget.
- FR-EVT-04: When an event ends, it auto-transitions to `completed` status and is moved to an archive view.
- FR-EVT-05: Analytics for completed events are preserved for historical review.

---

## 5. UI/UX Specifications

### 5.1 Design System

> All design tokens are defined in `/src/styles/theme.css` using Tailwind v4's `@theme { }` block. No `tailwind.config.js` exists. The file is imported once in `main.tsx`.

#### 5.1.1 Colour Tokens (Tailwind v4 `@theme` block)

```css
/* /src/styles/theme.css */
@import "tailwindcss";

@variant dark (.dark &);

@theme {
  /* ── Brand ── */
  --color-brand:           #8655f6; /* Primary Violet — buttons, CTAs, interactive */
  --color-brand-secondary: #806bb4; /* Secondary — chips, secondary actions */
  --color-brand-tertiary:  #af6400; /* Tertiary Amber — badges, highlights */
  --color-neutral:         #7a7581; /* Neutral base — non-chromatic surfaces */

  /* ── Surface Hierarchy (Light) ── */
  --color-background:               #FAF9F8; /* Warm neutral base */
  --color-surface:                  #FAF9F8;
  --color-surface-bright:           #FFFFFF;
  --color-surface-container:        #FAF9F8;
  --color-surface-container-high:   #E7E0ED;
  --color-surface-container-highest:#D6D3D1;
  --color-surface-container-low:    #F5F5F4;
  --color-surface-container-lowest: #FFFFFF;

  /* ── On-Surface (Text / Icon) ── */
  --color-on-surface:         #292524; /* Primary text — never pure #000 */
  --color-on-surface-variant: #494455; /* Secondary / caption text */

  /* ── Structural ── */
  --color-outline: #D6D3D1; /* Ghost borders only — see "No-Line" rule */

  /* ── Semantic ── */
  --color-error:   #F43F5E;
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-info:    #0284c7;

  /* ── Signature Textures (Pastel Voids) ── */
  --color-void-blue:  #BAE6FD; /* Soft focal accent — use at 10–20% opacity */
  --color-void-amber: #FDE68A; /* Warm focal accent — use at 10–20% opacity */

  /* ── Dark Mode Overrides (applied under .dark) ── */
  /* Dark surfaces invert the hierarchy — deepest = darkest */
  --color-background-dark:               #0f0e11;
  --color-surface-dark:                  #0f0e11;
  --color-surface-bright-dark:           #1c1b21;
  --color-surface-container-dark:        #151419;
  --color-surface-container-high-dark:   #26242e;
  --color-surface-container-highest-dark:#312f3b;
  --color-surface-container-low-dark:    #13121a;
  --color-surface-container-lowest-dark: #0a090e;
  --color-on-surface-dark:               #e8e1f4;
  --color-on-surface-variant-dark:       #a99cbd;
  --color-outline-dark:                  #3d3a47;
}
```

**Surface Layering Principle ("No-Line" Rule):**
- Visual separation is achieved exclusively through tonal surface shifts, never 1px borders.
- A `surface-container-lowest` card (`#FFFFFF`) atop a `surface` background (`#FAF9F8`) self-defines its boundary without a border.
- Explicit borders are **prohibited** for layout sectioning.
- A `ghost border` (`border border-[--color-outline]/30`) is the only permitted exception — for secondary interactive elements such as ghost buttons or inactive input rings.
- Charts use solid bars with a 2px high-contrast outline for a "printed ledger" aesthetic.

**Pastel Void Usage:**
- Large, soft-edged decorative blocks using `bg-[--color-void-blue]/15` or `bg-[--color-void-amber]/15` applied to category hero areas, empty-state illustrations, or dashboard focal zones.
- Never use Pastel Voids as a text container background without verifying contrast.

#### 5.1.2 Typography

Three fonts define the editorial rhythm. Load via Google Fonts or a self-hosted variable font:

```html
<!-- index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Inter:wght@400;500&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
```

```css
/* /src/styles/theme.css — within @theme */
--font-display: 'Plus Jakarta Sans', sans-serif; /* Titles, key metrics */
--font-body:    'Inter', sans-serif;              /* Body text, descriptions */
--font-mono:    'Space Grotesk', sans-serif;      /* All currency, timestamps */
```

**Typography Scale:**

| Token | Size | Font | Weight | Class Equivalent | Usage |
|---|---|---|---|---|---|
| XL Display | 1.875rem / 30px | Plus Jakarta Sans | 700 | `text-[1.875rem] font-bold font-display` | Primary balances, hero numbers |
| Title Large | 1.25rem / 20px | Plus Jakarta Sans | 600 | `text-xl font-semibold font-display` | Section headers, page titles |
| Body Standard | 0.875rem / 14px | Inter | 400 | `text-sm font-body` | Default reading text, list items |
| Label | 0.75rem / 12px | Inter | 500 | `text-xs font-medium font-body` | Form labels, badge text |
| Micro Label | 10px | Inter | 500 | `text-[10px] font-medium tracking-[0.05em] uppercase font-body` | Metadata, timestamps secondary |
| Currency / Metric | any | Space Grotesk | 500–700 | `font-mono tabular-nums` | All monetary values, dates |

> **Enforcement Rule:** Every rendered monetary value (amounts, balances, totals) **must** use `font-mono` (`Space Grotesk`) with `tabular-nums`. This is non-negotiable — mixed-width digits in financial figures are a usability defect.

#### 5.1.3 Elevation & Depth ("Atmospheric Stacking")

Depth is communicated through tonal contrast between surface layers, not structural drop shadows.

| Layer | Surface Token | Hex | Use Case |
|---|---|---|---|
| Top / Floating | `surface-bright` | `#FFFFFF` | Cards, FAB, primary containers |
| Mid / Default | `surface-container-low` | `#F5F5F4` | Page backgrounds, sidebar |
| Deep / Inactive | `surface-container-highest` | `#D6D3D1` | Inactive tabs, deep nesting |

**Shadow Rules:**
- **Resting cards:** No shadow. Tonal contrast defines the card edge.
- **Floating elements (modals, sticky headers, popovers):** Ambient only — `shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)]`.
- **Glassmorphism (nav bar, "Ready to Assign" banners):** `bg-white/20 backdrop-blur-[12px]` — 20% white overlay + 12px blur.

#### 5.1.4 Component Specifications

**Buttons:**

| Variant | Background | Text | Border | Radius | Hover |
|---|---|---|---|---|---|
| Primary | `bg-[--color-brand]` `#8655f6` | `text-white` | none | `rounded-lg` (8px) | `hover:bg-[#7040e0]` (10% darken) |
| Secondary | `bg-[--color-brand-secondary]` `#806bb4` | `text-white` | none | `rounded-lg` | `hover:bg-[#6d5a9a]` |
| Ghost | `bg-transparent` | `text-[--color-brand]` | `border border-[--color-brand]/30` | `rounded-lg` | `hover:bg-[--color-surface-container-low]` |
| Destructive | `bg-[--color-error]` | `text-white` | none | `rounded-lg` | `hover:bg-[#e02d4a]` |

**Cards / Envelopes:**
- Border radius: `rounded-2xl` (16px / 1rem) — creates deliberate contrast against the tighter `rounded-lg` (8px) of buttons.
- Background: `bg-[--color-surface-bright]` (`#FFFFFF`).
- No border by default. Ghost border (`border border-[--color-outline]/30`) permitted only when the card sits on a same-luminance surface.
- Padding: `p-5` (20px) standard; `p-4` (16px) for compact list cards.

**Interactive List Rows (Forecast / Transaction Rows):**
- Transition: `transition-all duration-200 ease-in-out` on all interactive rows.
- Hover state: reveal a hidden action button (e.g., "Edit", "Pay Now") via `opacity-0 group-hover:opacity-100` and shift background to `hover:bg-[--color-surface-container-low]`.
- Implementation pattern: wrap row in `<div class="group relative">` and position the action button absolutely.

**Charts (Analytics):**
- Bar charts: solid fill, 2px high-contrast stroke (`stroke-[--color-on-surface]`) — "printed ledger" aesthetic.
- No gradients on data series. Gradients permitted only on area chart backgrounds at ≤ 15% opacity.
- Colour series pulled from brand + semantic tokens in order: `brand`, `brand-secondary`, `brand-tertiary`, `info`, `success`.

#### 5.1.5 Dark Mode

- Dark mode is fully supported. The **system default is light mode**; dark mode is toggled via user preference.
- Implemented via Tailwind v4's `@variant dark (.dark &)` — root `<html>` receives `class="dark"` when active.
- If `appSettings.theme === 'system'`, attach a `window.matchMedia('(prefers-color-scheme: dark)')` listener and update the class dynamically.
- All dark surface tokens are defined in the `@theme` block (see §5.1.1) with `-dark` suffixes and applied via a JS token-swap utility at runtime:

```typescript
// /src/utils/theme.ts
export function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', isDark);
}
```

---

### 5.2 Layout & Responsive Breakpoints

| Breakpoint | Tailwind Prefix | Layout |
|---|---|---|
| Mobile (< 640px) | (default) | Single-column, bottom tab nav |
| Tablet (640–1023px) | `sm:` | Two-column grid where applicable |
| Desktop (≥ 1024px) | `lg:` | Persistent side nav + content area |

**Navigation:**
- Mobile: Fixed bottom tab bar with 5 items (Dashboard, Wallets, + (FAB), Budgets, Analytics).
- Desktop: Collapsible left sidebar (240px expanded / 72px icon-only collapsed).

**Content Max Width:** `max-w-5xl mx-auto` — prevents over-stretching on ultra-wide screens.

---

### 5.3 Manual Entry Form — Efficiency Specifications

#### 5.3.1 Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `N` | Open new expense entry (when not in an input) |
| `I` | Toggle entry type to Income |
| `E` | Toggle entry type to Expense |
| `T` | Toggle entry type to Transfer |
| `Enter` | Submit form (when form is valid) |
| `Esc` | Cancel / close drawer |
| `Tab` | Advance to next field |
| `Shift+Tab` | Return to previous field |
| `Ctrl+Z` | Undo last saved entry (within 5-second window) |

#### 5.3.2 Form Validation Rules
| Field | Rule | Error Message |
|---|---|---|
| Amount | Required, positive number, max 10 digits | "Enter a valid amount" |
| Date | Required, not more than 10 years in past | "Date out of acceptable range" |
| Category | Required | "Select a category" |
| Wallet | Required | "Select a wallet" |
| Description | Required, max 200 chars | "Description required (max 200 chars)" |
| Tags | Max 10 tags, each max 30 chars | "Max 10 tags, 30 chars each" |
| Transfer — To Wallet | Must differ from source wallet | "Source and destination wallets must differ" |

- Validation runs on field blur (not on every keystroke).
- On submit, all invalid fields are highlighted simultaneously with `border-[--color-error]` and error messages rendered below each field via `text-[--color-error] text-xs mt-1`.
- The first invalid field receives focus automatically.

#### 5.3.3 Amount Field
- Type: `<input type="text" inputMode="decimal">` — avoids browser-native number spinners.
- Accepts: `1234`, `1234.56`, `.50`, `1,234.56` (comma stripped on parse).
- On blur: formatted to `locale.toLocaleString()` with 2 decimal places.
- On focus: raw numeric value restored for editing.

#### 5.3.4 Category Selector
- Rendered as a searchable combobox (filter-as-you-type).
- Shows icon + name per option.
- Grouped by type (`Expense`, `Income`).
- Keyboard: Arrow keys to navigate, Enter to select, Esc to close.

---

### 5.4 Entry Drawer Component
- Slides up from the bottom on mobile (`translate-y-full → translate-y-0`, `transition-transform duration-300`).
- Opens as a right-side panel on desktop (`w-96`, fixed right), background `bg-[--color-surface-bright]`.
- Backdrop: `bg-[--color-on-surface]/50 backdrop-blur-sm` (warm dark tint, not pure black).
- Scroll-locked: `document.body.style.overflow = 'hidden'` while open.
- ARIA: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="entry-form-title"`. Focus trapped within the drawer.

---

### 5.5 Accessibility Requirements
- All interactive elements meet WCAG 2.1 AA contrast ratios (minimum 4.5:1 for text).
- All form inputs have associated `<label>` elements (either visible or `sr-only`).
- All icon-only buttons have `aria-label` attributes.
- Focus ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand] focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-surface]`.
- Colour is never used as the **only** means of conveying information (use icons + text alongside colour).
- The Wallet card gallery is navigable via keyboard (arrow keys when in grid mode).

---

### 5.6 Toast / Notification System
- Position: Bottom-right on desktop, bottom-center on mobile.
- Duration: 4 seconds (auto-dismiss). Extended to 8 seconds for actionable toasts (e.g., "Undo").
- Types: `success` (`--color-success` green), `error` (`--color-error` rose), `warning` (`--color-warning` amber), `info` (`--color-info` sky).
- Max 3 toasts visible simultaneously; older toasts are dismissed FIFO.
- Animated: `opacity-0 translate-y-2 → opacity-100 translate-y-0`.

---

## 6. Edge Cases & Constraints

### 6.1 Browser Storage Limits

| Scenario | Handling |
|---|---|
| `navigator.storage.estimate()` returns `quota < 50MB` | Warn user on first launch; suggest enabling persistent storage |
| Persistent storage not granted | Display persistent banner; all functionality remains intact but data may be evicted by browser under memory pressure |
| Write to IndexedDB fails with `QuotaExceededError` | Catch error at service layer; surface a blocking modal: "Storage full. Export your data and clear old records." |
| User clears browser data | On next launch, app detects empty DB and runs first-launch setup; shows import prompt |
| IndexedDB unavailable (e.g., private browsing in some browsers) | App detects on init; displays a warning that data will not persist; read-only in-memory mode |

**Persistent Storage Request:**
```javascript
if (navigator.storage && navigator.storage.persist) {
  const isPersisted = await navigator.storage.persist();
  // Store result in appSettings; prompt user if false
}
```

### 6.2 Concurrency & Multiple Tabs

- Multiple browser tabs accessing the same IndexedDB may cause read-write conflicts.
- Mitigation: Use the `BroadcastChannel` API to notify other tabs of writes. Other tabs re-fetch affected data on receiving the broadcast.
- A "stale data" banner is shown to non-active tabs prompting a refresh.

### 6.3 Data Integrity

| Scenario | Handling |
|---|---|
| Expense references a deleted category | Category field shows "[Deleted Category]" with a warning icon; expense remains intact |
| Expense references a deleted wallet | Wallet field shows "[Archived Wallet]"; balance is excluded from Net Worth |
| Transfer with deleted destination wallet | Transfer records are orphaned; shown with a warning in transaction list |
| Budget period overlap | System allows overlapping budgets but flags them in the UI; no automatic deduplication |
| Import file with schema version mismatch | Import blocked with: "This file was exported from an incompatible version. Please update the app." |
| Duplicate `id` on import (Merge mode) | Resolve by `syncMeta.version` — higher version wins; tie = imported record wins |

### 6.4 Currency & Arithmetic

- All monetary arithmetic uses integer cents internally to avoid floating-point errors.
  ```typescript
  // Store amounts as integer pence/cents
  const amountCents = Math.round(parseFloat(input) * 100);
  // Display
  const display = (amountCents / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
  ```
- Multi-currency wallets display balances in their native currency. Net Worth converts to a user-selected base currency using manually entered exchange rates (no live FX feed).

### 6.5 Date Handling

- All dates stored in ISO 8601 format (`YYYY-MM-DD` for dates, `YYYY-MM-DDTHH:MM:SSZ` for timestamps).
- All UTC timestamps used for `syncMeta` fields.
- User-facing dates respect `appSettings.dateFormat` and browser locale.
- Budget boundary calculations use the `budgetStartDay` setting (e.g., budget month runs 15th→14th if set to 15).
- Leap year handling: February entries on the 29th in non-leap years are treated as the 28th.

### 6.6 Large Dataset Performance

- IndexedDB queries for analytics use index-based cursor iteration, not full-table scans.
- Analytics computations for date ranges exceeding 12 months are moved to a Web Worker to avoid blocking the main thread.
- Pagination applied to all list views (expenses, transactions): 50 records per page, infinite-scroll loading.
- The `smartEntryHistory` is capped at 50 entries to prevent unbounded growth.

---

## 7. Non-Functional Requirements

### 7.1 Performance
- Initial app load (cold): < 2 seconds on a mid-range device with a warm cache.
- Entry form open-to-ready: < 200ms.
- IndexedDB write latency: < 50ms per single record.
- Analytics render (12-month dataset, < 10k records): < 500ms.

### 7.2 Reliability
- The app must be fully functional offline. All features work without a network connection.
- Data must survive browser restarts (enforced by IndexedDB persistence).
- No data mutation occurs without explicit user action (no auto-cleanup, no auto-archiving without user consent).

### 7.3 Security
- No data leaves the device unless the user initiates an Export.
- No external analytics, telemetry, or tracking scripts.
- Import files are validated against the schema before any write; malformed JSON is rejected without partial writes.
- Content Security Policy header (if served via a local server or PWA): `default-src 'self'`.

### 7.4 Maintainability
- All IndexedDB interactions encapsulated in `/src/services/db/` — zero direct `indexedDB` calls in components.
- All schema types defined in `/src/types/schema.ts` — single source of truth.
- Database version migrations handled in `/src/services/db/migrations/` — one file per version.
- All monetary formatting centralized in `/src/utils/currency.ts`.

### 7.5 Progressive Web App (PWA)
- The app ships as a PWA with a `manifest.json` and Service Worker.
- Service Worker caches all app shell assets for offline use.
- "Add to Home Screen" prompt is triggered after the user logs their 3rd expense (engagement threshold).
- App icon, splash screen, and theme colour defined in manifest for native-feel installation.
