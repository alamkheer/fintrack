---
name: analytics-charts
description: Skill for implementing analytics and chart components using the project's data layer and Digital Parchment design tokens.
---

# Analytics & Charts Skill

This skill provides instructions for building analytics views and chart components. Read this before implementing any data visualisation.

## Chart Library

Use **Recharts** or **Chart.js** — lightweight libraries compatible with Tailwind CSS.

## Design Rules (Digital Parchment)

### Bar Charts
- **Solid fill** — no gradients on data series.
- **2px high-contrast stroke**: `stroke-[--color-on-surface]` — "printed ledger" aesthetic.
- Colour series order: `brand` → `brand-secondary` → `brand-tertiary` → `info` → `success`.

### Area Charts
- Gradients permitted **only** on area chart backgrounds at ≤ 15% opacity.

### Line Charts
- Use point markers at inflection points.
- Grid lines: subtle, using `--color-outline` at 30% opacity.

### Pie/Donut Charts
- Category breakdown using the same colour series.
- Legend with icon + name + percentage.

### General
- **No** generic shadows on chart containers — use tonal surface contrast.
- All monetary values on axes use `font-mono tabular-nums` (Space Grotesk).
- Axis labels use Inter at 12px.

## Analytics Views (from SRS §4.4)

### Required Charts

| Chart | Type | Data Source | Description |
| --- | --- | --- | --- |
| Budget Progress | Bar/Radial | `budgets` + `expenses` | Spent vs. Limit per active budget |
| Category Breakdown | Pie/Donut | `expenses` | Spending by category for date range |
| Spending Trend | Line | `expenses` | Daily/weekly/monthly totals, 12-month rolling |
| Income vs. Expense | Summary Card | `expenses` | Net cashflow for selected period |
| Wallet Balance History | Area | `expenses` + `wallets` | Reconstructed from transaction history |

### Period Selector
- Presets: This Month, Last Month, Last 3 Months, This Year, All Time.
- Custom: date-range picker (start + end date).
- Selected period persists in URL query params.

### All Analytics Filters
- Date range
- Wallet
- Category
- Budget

## Performance Rules

1. All analytics are computed **client-side** from IndexedDB queries — no server round-trip.
2. Use **index-based cursor iteration** — never full-table scans.
3. Date ranges > 12 months → move computation to a **Web Worker**.
4. Cache computed results in memory for the current session; invalidate on data write.

## Data Computation Pattern

```typescript
// Example: Monthly spending trend
async function getMonthlySpendingTrend(
  startDate: string,
  endDate: string,
  walletId?: string,
  categoryId?: string,
): Promise<{ month: string; total: number }[]> {
  let expenses = await getActiveExpenses();
  
  // Apply filters
  if (walletId) expenses = expenses.filter(e => e.walletId === walletId);
  if (categoryId) expenses = expenses.filter(e => e.categoryId === categoryId);
  
  expenses = expenses.filter(e =>
    e.type === 'expense' &&
    e.date >= startDate &&
    e.date <= endDate
  );
  
  // Group by month
  const grouped = new Map<string, number>();
  for (const e of expenses) {
    const month = e.date.slice(0, 7); // YYYY-MM
    const current = grouped.get(month) ?? 0;
    grouped.set(month, current + Math.round(e.amount * 100));
  }
  
  return Array.from(grouped.entries())
    .map(([month, totalCents]) => ({ month, total: totalCents / 100 }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
```
