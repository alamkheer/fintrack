# Project Reference: Feature Requirements Registry

A quick-reference mapping of all SRS Functional Requirement codes to their domains and status. For full details, see `docs/srs.md`.

## Budget Management (§4.1)

| Code       | Requirement                                               | Priority |
| ---------- | --------------------------------------------------------- | -------- |
| FR-BUD-01  | Create budget with period: monthly / yearly / custom      | P0       |
| FR-BUD-02  | Create event budget with fixed date range                 | P1       |
| FR-BUD-03  | Sinking fund with target amount + monthly contribution    | P1       |
| FR-BUD-04  | Associate budget with one category (or all)               | P0       |
| FR-BUD-05  | Associate budget with one wallet (or all)                 | P0       |
| FR-BUD-06  | Alert threshold (default 80%) with warning colour         | P0       |
| FR-BUD-07  | Rollover: carry unspent amount to next period             | P1       |
| FR-BUD-08  | Pause, archive, or soft-delete a budget                   | P0       |
| FR-BUD-09  | Auto-reset monthly/yearly periods (computed from expenses) | P0      |
| FR-BUD-10  | Free-text notes on budgets                                | P2       |

## Expense Tracking (§4.2)

| Code       | Requirement                                               | Priority |
| ---------- | --------------------------------------------------------- | -------- |
| FR-EXP-01  | Add expense / income / transfer via manual form           | P0       |
| FR-EXP-02  | Keyboard-first navigation (Tab, Enter)                    | P0       |
| FR-EXP-03  | Date defaults to today; supports back/future-dating       | P0       |
| FR-EXP-04  | Amount: decimal input, locale-aware formatting on blur    | P0       |
| FR-EXP-05  | Tag support (comma-separated or chip-based)               | P1       |
| FR-EXP-06  | Notes field (plain text)                                  | P1       |
| FR-EXP-07  | Edit past expense; bumps version + updatedAt              | P0       |
| FR-EXP-08  | Soft-delete expense → restores wallet balance             | P0       |
| FR-EXP-09  | Transfer: two linked records (debit + credit)             | P0       |
| FR-EXP-10  | Duplicate an existing expense                             | P2       |
| FR-EXP-11  | Wallet balance recomputed on every write                  | P0       |

## Smart Entry (§4.2.3)

| Code        | Requirement                                              | Priority |
| ----------- | -------------------------------------------------------- | -------- |
| FR-SMART-01 | Description autocomplete from last 50 entries            | P1       |
| FR-SMART-02 | Auto-fill category, wallet, amount from match            | P1       |
| FR-SMART-03 | Auto-filled fields visually highlighted; user can override | P1     |
| FR-SMART-04 | Update history after save (deduped, max 50)              | P1       |

## Wallet View (§4.3)

| Code       | Requirement                                               | Priority |
| ---------- | --------------------------------------------------------- | -------- |
| FR-WAL-01  | Scrollable gallery of card-style wallet tiles             | P0       |
| FR-WAL-02  | Card shows: name, type icon, balance, currency, colour, last-four | P0 |
| FR-WAL-03  | Drag-and-drop reordering (updates displayOrder)           | P2       |
| FR-WAL-04  | Tap/click → detail view with filtered transactions        | P0       |
| FR-WAL-05  | Add, edit, archive wallets; toggle archived visibility    | P0       |
| FR-WAL-06  | Net Worth summary card at top of gallery                  | P0       |
| FR-WAL-07  | Positive (green) / negative (red) balance colouring       | P0       |

## Analytics (§4.4)

| Code       | Requirement                                               | Priority |
| ---------- | --------------------------------------------------------- | -------- |
| FR-ANA-01  | Spent vs. Limit bar/radial chart per active budget        | P0       |
| FR-ANA-02  | Category breakdown: pie/donut chart                       | P0       |
| FR-ANA-03  | Spending trend: line chart (12-month rolling)             | P1       |
| FR-ANA-04  | Income vs. Expense summary card                           | P0       |
| FR-ANA-05  | Wallet balance history: area chart                        | P1       |
| FR-ANA-06  | All analytics computed client-side                        | P0       |
| FR-ANA-07  | Filter by: date range, wallet, category, budget           | P0       |
| FR-ANA-08  | Lightweight chart library (Recharts/Chart.js)             | P0       |

## Event-Based Budgeting (§4.5)

| Code       | Requirement                                               | Priority |
| ---------- | --------------------------------------------------------- | -------- |
| FR-EVT-01  | Event budget with name, fixed date range, spending limit  | P1       |
| FR-EVT-02  | Dedicated "Events" section with countdown                 | P1       |
| FR-EVT-03  | Manual expense tagging to event budget                    | P1       |
| FR-EVT-04  | Auto-transition to `completed` on event end               | P1       |
| FR-EVT-05  | Historical analytics for completed events                 | P2       |
