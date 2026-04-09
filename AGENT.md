# Personal Finance Tracker — Agent Configuration

**App Name:** FinTrack  
**Version:** 1.1.0  
**Architecture:** 100% client-side, local-first, IndexedDB-powered  
**Stack:** React 19 + Tailwind CSS v4 + IndexedDB + Vite

## Project Purpose

A personal finance tracker targeting long-term solo use. All data resides in the browser's IndexedDB with zero external dependencies for core functionality. The architecture supports a future cloud sync layer.

## How This Project Is Organised

- **`docs/srs.md`** — Complete Software Requirements Specification (the source of truth)
- **`.agents/rules/`** — Immutable coding, design, and architectural standards
- **`.agents/workflows/`** — Step-by-step processes for common development tasks
- **`.agents/skills/`** — Domain-specific expertise loaded on demand
- **`.agents/references/`** — Quick-lookup tables for schema, requirements, and edge cases

## Agent Behaviour

1. **Always check `.agents/rules/` before writing code.** These are non-negotiable constraints.
2. **Follow `.agents/workflows/` for multi-step tasks.** Don't improvise the order.
3. **Load `.agents/skills/` when working in a specific domain.** Read the SKILL.md before generating code.
4. **Consult `.agents/references/` for schema and requirement lookups.** Don't re-derive from the SRS.
5. **IndexedDB is the source of truth** — React state is a cache.
6. **Every record has SyncMeta** — isDirty, version, soft deletes.
7. **All monetary values use integer cents** internally.
8. **All UI follows the Digital Parchment design system** — no generic SaaS styling.
9. **React 19 conventions** — `use()`, no `forwardRef`, React Compiler enabled.
10. **Tailwind CSS v4** — `@theme {}` in CSS, no `tailwind.config.js`.

## Key Design Principles

- **Local-First**: Data always available offline. Network is an enhancement.
- **Manual Entry as a Feature**: Keyboard-driven, fast data entry is first-class.
- **Long-Term Portability**: All data exportable in open formats (JSON/CSV).
- **Future-Proof Schema**: Every record carries `syncMeta` for future cloud sync.
