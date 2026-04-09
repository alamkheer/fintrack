---
name: digital-parchment
description: Instructions for generating UI and CSS code conforming to the Digital Parchment high-end editorial aesthetic.
---
# Digital Parchment Design System - Agent Coding Skill

This document defines the strict, behavioral instructions for any AI Agent working on this project. When writing components, updating layouts, or modifying CSS in this repository, you MUST adhere to the following rules based on the "Digital Parchment" design reference.

## 1. Context Injection
Before generating HTML/CSS or React components, always reference `agent/design-reference.md`. Ensure that the overall look feels like a "Financial Atelier"—clean, tactile, and studio-inspired. We avoid the "spreadsheet" aesthetic.

## 2. Strict CSS & Styling Rules

### Colors & The "No-Line" Rule
1. **Never use pure black (`#000000`).** All dark text must use `#292524` (`text-[#292524]`).
2. **Never use 1px layout borders (`border`, `border-b`, `border-r`).** Layouts must be separated by tonal shifts. For instance, put a pure white card (`#FFFFFF`) over a warm neutral background (`#F5F5F4` or `#FAF9F8`). The only exception for borders is a 30% opacity fallback for secondary interactive elements, or 2px high-contrast outlines in data charts.
3. **Primary Accent:** When generating call-to-actions, use the primary color `#8655f6` (`bg-[#8655f6]`).
4. **Error States:** Use `#F43F5E` for warnings/errors instead of generic red.

### Typography Application
You must enforce a tri-font hierarchy matching the reference:
1. **Titles & Metrics:** Apply `font-family: 'Plus Jakarta Sans', sans-serif;` for page titles, section headers, and XL balances. 
2. **Standard Text:** Apply `font-family: 'Inter', sans-serif;` for paragraphs, descriptions, and lists.
3. **Numbers & Ledgers:** Apply `font-family: 'Space Grotesk', sans-serif;` for ALL currency formatting, dates, timestamps, and input fields handling numbers.
4. **Over-titles & Micro Labels:** Labels indicating category types must be `text-[10px] uppercase tracking-[0.05em]`. 

### Depth & Elevation (Atmospheric Stacking)
1. **No Standard Card Shadows:** Do not apply generic `shadow-md` or `shadow-lg` to standard layout blocks. Depth is created via contrast (e.g., `#FFFFFF` block next to a `#FAF9F8` background).
2. **Ambient Shadows for Floating Elements:** When an element floats (Modals, Sticky Headers, Popovers), strictly use the specific diffused shadow logic: `box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05)`.
3. **Glassmorphism Overlays:** When elements need to blur the background (e.g., Sticky Navigation), combine a 20% opacity white background with a backdrop filter: `bg-white/20 backdrop-blur-[12px]`.

### Component Specifics
1. **Buttons:** Primary buttons get exactly `0.5rem` (`rounded-lg` or `border-radius: 8px`). Ghost buttons use transparent backgrounds and transition to `#F5F5F4` on hover.
2. **Cards/Envelopes:** Main layout cards have exactly `1rem` (`rounded-2xl` or `border-radius: 16px`).
3. **Interactive Lists:** Row items or list elements must trigger a hover state containing `transition-all duration-200 ease-in-out` which reveals any hidden action buttons (like "Pay Now") and shifts the background slightly.

## 3. Workflow for Developers & Agents
1. Before adding a UI component, ask yourself: *"Does this introduce unnecessary lines/borders?"* If so, replace with background color blocks.
2. When displaying numbers, ensure the wrapping span or div forces `Space Grotesk`.
3. Ensure generous horizontal padding to let components breathe—avoid overly dense layouts.
4. **Tailwind CSS v4**: This project uses Tailwind CSS v4 with CSS-first configuration. **Never create a `tailwind.config.js` file.** All design tokens are defined in `/src/styles/theme.css` using `@theme { }` blocks. When adding new colors, inject them into the `@theme` block in `theme.css`, referencing `design-reference.md`.

**Implementation Goal:** Create an environment that feels calm, authoritative, and intentionally designed—not a standard SaaS dashboard. Validate any generated code against these rules before finalizing it.
