---
name: ui-ux-standards
description: UI/UX standards covering accessibility, responsive layout, keyboard navigation, form validation, and the toast notification system.
---

# UI/UX Standards

## Accessibility (WCAG 2.1 AA)

1. All interactive elements meet **minimum 4.5:1 contrast ratio** for text.
2. All form inputs have associated `<label>` elements (visible or `sr-only`).
3. All icon-only buttons have `aria-label` attributes.
4. **Focus ring**: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand] focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-surface]`.
5. Colour is **never** the sole means of conveying information — always pair with icons + text.
6. Wallet card gallery is keyboard-navigable (arrow keys in grid mode).

## Responsive Layout

| Breakpoint         | Tailwind Prefix | Layout                                    |
| ------------------ | --------------- | ----------------------------------------- |
| Mobile (< 640px)   | (default)       | Single-column, fixed bottom tab nav       |
| Tablet (640–1023px) | `sm:`           | Two-column grid where applicable          |
| Desktop (≥ 1024px) | `lg:`           | Persistent collapsible side nav + content |

- **Mobile nav**: Fixed bottom tab bar — Dashboard, Wallets, + (FAB), Budgets, Analytics.
- **Desktop nav**: Collapsible left sidebar — 240px expanded / 72px icon-only collapsed.
- **Content max width**: `max-w-5xl mx-auto` to prevent over-stretching.

## Keyboard Shortcuts

| Shortcut    | Action                                          |
| ----------- | ----------------------------------------------- |
| `N`         | Open new expense entry (when not in an input)   |
| `I`         | Toggle entry type → Income                      |
| `E`         | Toggle entry type → Expense                     |
| `T`         | Toggle entry type → Transfer                    |
| `Enter`     | Submit form (when valid)                        |
| `Esc`       | Cancel / close drawer                           |
| `Tab`       | Advance to next field                           |
| `Shift+Tab` | Return to previous field                        |
| `Ctrl+Z`    | Undo last saved entry (5-second window)         |

## Form Validation

1. Validation runs on **field blur**, not on every keystroke.
2. On submit, **all** invalid fields highlight simultaneously with `border-[--color-error]`.
3. Error messages render below each field: `text-[--color-error] text-xs mt-1`.
4. First invalid field receives focus automatically.

### Field Rules
| Field              | Rule                                           | Error Message                                     |
| ------------------ | ---------------------------------------------- | ------------------------------------------------- |
| Amount             | Required, positive number, max 10 digits       | "Enter a valid amount"                            |
| Date               | Required, not > 10 years in past               | "Date out of acceptable range"                    |
| Category           | Required                                       | "Select a category"                               |
| Wallet             | Required                                       | "Select a wallet"                                 |
| Description        | Required, max 200 chars                        | "Description required (max 200 chars)"            |
| Tags               | Max 10 tags, each max 30 chars                 | "Max 10 tags, 30 chars each"                      |
| Transfer → To Wallet | Must differ from source wallet              | "Source and destination wallets must differ"       |

## Amount Field Behaviour

- Input type: `<input type="text" inputMode="decimal">` — avoid browser number spinners.
- Accepts: `1234`, `1234.56`, `.50`, `1,234.56` (comma stripped on parse).
- On blur: format to `locale.toLocaleString()` with 2 decimal places.
- On focus: restore raw numeric value for editing.

## Entry Drawer

- **Mobile**: Slides up from bottom (`translate-y-full → translate-y-0`, `transition-transform duration-300`).
- **Desktop**: Right-side panel (`w-96`, fixed right), `bg-[--color-surface-bright]`.
- **Backdrop**: `bg-[--color-on-surface]/50 backdrop-blur-sm`.
- **Scroll lock**: `document.body.style.overflow = 'hidden'` while open.
- **ARIA**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="entry-form-title"`. Focus trapped.

## Toast Notification System

- **Position**: Bottom-right (desktop), bottom-center (mobile).
- **Duration**: 4s auto-dismiss; 8s for actionable toasts (e.g., "Undo").
- **Types**: `success` (green), `error` (rose), `warning` (amber), `info` (sky).
- **Max visible**: 3 simultaneous; FIFO dismissal.
- **Animation**: `opacity-0 translate-y-2 → opacity-100 translate-y-0`.
