---
name: project-architecture
description: Enforces the project architecture, file organization, and technology stack constraints defined in the SRS.
---

# Project Architecture Rules

## Technology Stack — Non-Negotiable

| Concern             | Technology                                                   |
| ------------------- | ------------------------------------------------------------ |
| UI Framework        | React 19 (Hooks, Context API — client-only, NO Server Actions) |
| Styling             | Tailwind CSS v4 (CSS-first config via `@theme {}`, NO `tailwind.config.js`) |
| Client Storage      | IndexedDB via the `idb` wrapper library                      |
| State Management    | React Context + `useReducer`; use `use()` hook where applicable |
| Routing             | React Router v7                                              |
| Build Tool          | Vite 6+ with `@tailwindcss/vite` plugin                     |
| Charts              | Recharts or Chart.js (lightweight, Tailwind-compatible)      |

## React 19 Conventions

1. **Use `use()` hook** for consuming Context and resolving Promises inside render.
2. **Use `useFormStatus` and `useOptimistic`** for form UX and optimistic expense updates.
3. **`ref` is a regular prop** — never use `forwardRef`.
4. **React Compiler is enabled** (`babel-plugin-react-compiler`) — do NOT manually write `useMemo` or `useCallback` unless the compiler output is demonstrably insufficient. If you suspect a performance issue, measure before memoizing.
5. Use `ReactDOM.createRoot` — no hydration APIs (client-only app).

## Tailwind CSS v4 Conventions

1. All theme tokens are defined in `/src/styles/theme.css` using `@theme { }` blocks.
2. Use the `@tailwindcss/vite` plugin — NOT the PostCSS pipeline.
3. Dark mode is configured via `@variant dark (.dark &);` — toggled by adding `class="dark"` to `<html>`.
4. Arbitrary values (e.g., `bg-[#8655f6]`) are permitted.
5. **Never create a `tailwind.config.js`** file.

## File Organization

```
src/
├── components/          # Reusable UI components (buttons, cards, inputs)
│   ├── ui/              # Primitive UI elements
│   └── features/        # Feature-specific composites
├── contexts/            # React Context providers
├── hooks/               # Custom hooks
├── pages/               # Route-level page components
├── services/
│   └── db/              # ALL IndexedDB interactions (zero direct indexedDB calls elsewhere)
│       ├── index.ts     # DatabaseService singleton
│       └── migrations/  # One file per DB version
├── styles/
│   └── theme.css        # Tailwind v4 @theme block — single source of design tokens
├── types/
│   └── schema.ts        # ALL data schema types — single source of truth
├── utils/
│   ├── currency.ts      # ALL monetary formatting — single source of truth
│   └── theme.ts         # Dark/light/system theme toggle utility
├── main.tsx             # App entry point
└── App.tsx              # Root component with routing
```

### Critical Encapsulation Rules

- **ZERO** direct `indexedDB` calls in React components — all access goes through `src/services/db/`.
- **ALL** TypeScript schema types live in `src/types/schema.ts`.
- **ALL** monetary formatting lives in `src/utils/currency.ts`.
- **ALL** database migrations live in `src/services/db/migrations/`.
