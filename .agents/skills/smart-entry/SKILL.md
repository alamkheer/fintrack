---
name: smart-entry
description: Skill for implementing the smart expense entry system with autocomplete, auto-fill, and keyboard-first navigation.
---

# Smart Entry Skill

This skill covers the implementation of the intelligent expense entry form — the most user-facing, high-frequency interaction in the application.

## Overview

The entry form is a keyboard-driven, fast-input system for adding expenses, income, and transfers. It supports smart autocomplete from entry history and auto-fills fields based on past patterns.

## Entry Form Field Order (Tab Navigation)

1. **Type toggle** — Expense / Income / Transfer (default: Expense)
2. **Amount** — number, autofocus
3. **Date** — date picker, default: today
4. **Category** — searchable combobox
5. **Wallet** — dropdown, default: `appSettings.defaultWalletId`
6. **Description** — text, smart autocomplete
7. **Budget** — optional, auto-matched or manual select
8. **Tags** — chip input
9. **Notes** — textarea, collapsible

## Smart Autocomplete (FR-SMART-01 to FR-SMART-04)

### How It Works

1. The `description` field queries `appSettings.smartEntryHistory` (last 50 unique descriptions).
2. Matching suggestions appear as user types.
3. When a suggestion is selected → auto-fill: `categoryId`, `walletId`, `amount` from the most recent matching transaction.
4. Auto-filled fields are **visually highlighted** (e.g., subtle brand-coloured background flash).
5. User can override any auto-filled field.
6. After save → prepend description to `smartEntryHistory` (deduped, max 50).

### Implementation

```typescript
// Query smart entry history
function getSuggestions(query: string, history: string[]): string[] {
  const lower = query.toLowerCase();
  return history.filter(desc => desc.toLowerCase().includes(lower));
}

// Auto-fill from most recent matching expense
async function autoFillFromHistory(description: string): Promise<Partial<Expense> | null> {
  const expenses = await getActiveExpenses();
  const match = expenses
    .filter(e => e.description.toLowerCase() === description.toLowerCase())
    .sort((a, b) => b.syncMeta.createdAt.localeCompare(a.syncMeta.createdAt))[0];
  
  if (!match) return null;
  return {
    categoryId: match.categoryId,
    walletId: match.walletId,
    amount: match.amount,
  };
}

// Update history after save
function updateSmartHistory(description: string, history: string[]): string[] {
  const deduped = history.filter(d => d.toLowerCase() !== description.toLowerCase());
  return [description, ...deduped].slice(0, 50);
}
```

## Amount Field

- Input type: `<input type="text" inputMode="decimal">` — no browser spinners.
- Accepts: `1234`, `1234.56`, `.50`, `1,234.56`.
- On blur: format via `toLocaleString()` with 2 decimal places.
- On focus: restore raw numeric value.
- Internal storage: integer cents (`Math.round(parseFloat(input) * 100)`).

## Category Selector

- Rendered as a **searchable combobox** (filter-as-you-type).
- Each option displays: icon + name.
- Grouped by type (`Expense`, `Income`).
- Keyboard: Arrow keys to navigate, Enter to select, Esc to close.

## Transfer Logic

When type = `transfer`:
- Two linked records are created: debit on source wallet, credit on destination wallet.
- Both reference a shared `transferGroupId`.
- Validation: source ≠ destination wallet.

## Undo Support

After save, show a toast: `"Expense saved. [Undo]"` (5-second window).
The Undo action soft-deletes the last saved record and restores the wallet balance.

## Entry Drawer

- **Mobile**: Slides up from bottom.
- **Desktop**: Right-side panel (`w-96`, fixed right).
- Trigger: FAB button or keyboard shortcut `N` (when not in an input).
- Close: `Esc` key or backdrop click.
- ARIA: `role="dialog"`, `aria-modal="true"`, focus trapped.
