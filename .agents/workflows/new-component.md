---
name: new-component
description: Workflow for creating a new React component that adheres to project design and coding standards. Triggers via /new-component command.
---

# New Component Workflow

Use this workflow when creating any new React component.

## Step 1: Classify the Component

- **UI primitive** (button, card, input, badge) → place in `src/components/ui/`
- **Feature composite** (WalletCard, BudgetProgressBar, ExpenseRow) → place in `src/components/features/`
- **Page** (Dashboard, Analytics) → place in `src/pages/`

## Step 2: Create the Component File

1. Create `ComponentName.tsx` (PascalCase, one component per file).
2. Define a `Props` interface at the top of the file. Export it if the component is reusable.
3. Use a functional component with destructured props.
4. Do NOT use `forwardRef` — `ref` is a regular prop in React 19.

```typescript
interface WalletCardProps {
  wallet: Wallet;
  onEdit?: (id: string) => void;
}

export function WalletCard({ wallet, onEdit }: WalletCardProps) {
  // ...
}
```

## Step 3: Apply Digital Parchment Design

Before writing any JSX or CSS, review:
- `.agents/skills/digital-parchment/SKILL.md`
- `.agents/skills/digital-parchment/design-reference.md`

### Mandatory Checks
- [ ] **No pure black** — use `#292524` (`on-surface`)
- [ ] **No 1px borders** for layout — use tonal surface shifts
- [ ] **Tri-font hierarchy**: Titles → Plus Jakarta Sans, Body → Inter, Numbers → Space Grotesk
- [ ] **All monetary values** use `font-mono tabular-nums` (Space Grotesk)
- [ ] **Cards**: `rounded-2xl` (16px), `bg-[--color-surface-bright]`, no shadow
- [ ] **Buttons**: `rounded-lg` (8px), primary = `bg-[--color-brand]`
- [ ] **Hover states**: `transition-all duration-200 ease-in-out`

## Step 4: Accessibility

- [ ] All interactive elements have focus rings
- [ ] Icon-only buttons have `aria-label`
- [ ] Form inputs have `<label>` or `sr-only` label
- [ ] Colour is not the sole conveyor of meaning

## Step 5: Responsive Design

- [ ] Mobile-first: default styles for < 640px
- [ ] `sm:` for tablet (640–1023px)
- [ ] `lg:` for desktop (≥ 1024px)

## Step 6: Dark Mode

- [ ] Component renders correctly with `.dark` class on `<html>`
- [ ] Uses theme tokens with `-dark` variants where needed
