# Project Reference: Data Schema

This is a quick-reference for the IndexedDB schema defined in the SRS (§2). For full details, see `docs/srs.md`.

## SyncMeta (applied to ALL records)

```typescript
interface SyncMeta {
  isDirty: boolean;
  createdAt: string;        // ISO 8601 UTC
  updatedAt: string;        // ISO 8601 UTC
  deletedAt: string | null; // null = active
  clientId: string;         // UUID
  version: number;          // Increment on each write
}
```

## categories

| Field      | Type                                     | Constraints            |
| ---------- | ---------------------------------------- | ---------------------- |
| `id`       | `string` (UUID)                          | PK                     |
| `name`     | `string`                                 | unique, max 50 chars   |
| `icon`     | `string`                                 | emoji or icon key      |
| `color`    | `string`                                 | hex format             |
| `type`     | `'expense' \| 'income' \| 'transfer'`    |                        |
| `isSystem` | `boolean`                                | default false          |
| `parentId` | `string \| null`                         | FK → categories.id     |

## wallets

| Field            | Type                                                              | Constraints          |
| ---------------- | ----------------------------------------------------------------- | -------------------- |
| `id`             | `string` (UUID)                                                   | PK                   |
| `name`           | `string`                                                          | unique, max 60 chars |
| `type`           | `'cash' \| 'bank' \| 'credit' \| 'investment' \| 'savings' \| 'ewallet'` |                      |
| `currency`       | `string`                                                          | ISO 4217, default GBP |
| `initialBalance` | `number`                                                          | min 0                |
| `currentBalance` | `number`                                                          | computed cache       |
| `color`          | `string`                                                          | hex                  |
| `icon`           | `string`                                                          |                      |
| `cardLastFour`   | `string \| null`                                                  | max 4 digits         |
| `isArchived`     | `boolean`                                                         | default false        |
| `displayOrder`   | `number`                                                          |                      |

## budgets

| Field            | Type                                                  | Constraints        |
| ---------------- | ----------------------------------------------------- | ------------------ |
| `id`             | `string` (UUID)                                       | PK                 |
| `name`           | `string`                                              | max 80 chars       |
| `categoryId`     | `string \| null`                                      | FK → categories.id |
| `walletId`       | `string \| null`                                      | FK → wallets.id    |
| `periodType`     | `'monthly' \| 'yearly' \| 'custom' \| 'event'`       |                    |
| `startDate`      | `string`                                              | ISO 8601           |
| `endDate`        | `string \| null`                                      |                    |
| `limitAmount`    | `number`                                              | positive           |
| `currency`       | `string`                                              | ISO 4217           |
| `rollover`       | `boolean`                                             | default false      |
| `rolloverAmount` | `number`                                              | default 0          |
| `alertThreshold` | `number`                                              | 0–1, default 0.8   |
| `status`         | `'active' \| 'paused' \| 'completed' \| 'archived'`  |                    |
| `budgetType`     | `'expense' \| 'sinking_fund' \| 'event'`              |                    |
| `targetAmount`   | `number \| null`                                      | for sinking funds  |
| `notes`          | `string`                                              | max 500 chars      |

## expenses (highest-volume store)

| Field              | Type                                        | Constraints           |
| ------------------ | ------------------------------------------- | --------------------- |
| `id`               | `string` (UUID)                             | PK                    |
| `type`             | `'expense' \| 'income' \| 'transfer'`       |                       |
| `amount`           | `number`                                    | positive              |
| `currency`         | `string`                                    | ISO 4217              |
| `date`             | `string`                                    | ISO 8601 date         |
| `time`             | `string \| null`                            | HH:MM                 |
| `description`      | `string`                                    | max 200 chars         |
| `notes`            | `string`                                    | max 1000 chars        |
| `categoryId`       | `string`                                    | FK → categories.id    |
| `walletId`         | `string`                                    | FK → wallets.id       |
| `toWalletId`       | `string \| null`                            | transfers only        |
| `budgetId`         | `string \| null`                            | FK → budgets.id       |
| `tags`             | `string[]`                                  | max 10, each max 30   |
| `isRecurring`      | `boolean`                                   | default false         |
| `recurringId`      | `string \| null`                            |                       |
| `attachmentRef`    | `string \| null`                            |                       |
| `smartEntrySource` | `'manual' \| 'smart' \| 'import' \| null`   |                       |

## recurringTemplates

| Field          | Type                                                      | Constraints |
| -------------- | --------------------------------------------------------- | ----------- |
| `id`           | `string` (UUID)                                           | PK          |
| `name`         | `string`                                                  | max 80 chars |
| `frequency`    | `'daily' \| 'weekly' \| 'biweekly' \| 'monthly' \| 'yearly'` |           |
| `dayOfMonth`   | `number \| null`                                          | 1–31        |
| `dayOfWeek`    | `number \| null`                                          | 0–6         |
| `templateData` | `Partial<Expense>`                                        |             |
| `nextDueDate`  | `string`                                                  | ISO 8601    |
| `isActive`     | `boolean`                                                 | default true |

## appSettings (singleton key-value)

| Key                   | Type              | Default      |
| --------------------- | ----------------- | ------------ |
| `defaultCurrency`     | `string`          | `'GBP'`      |
| `defaultWalletId`     | `string \| null`  | `null`       |
| `theme`               | `'dark' \| 'light' \| 'system'` | `'light'` |
| `dateFormat`          | `string`          | `'DD/MM/YYYY'` |
| `firstDayOfWeek`      | `number`          | `1` (Monday) |
| `budgetStartDay`      | `number`          | `1`          |
| `clientId`            | `string`          | UUID at install |
| `lastSyncAt`          | `string \| null`  | `null`       |
| `smartEntryHistory`   | `string[]`        | `[]`         |
