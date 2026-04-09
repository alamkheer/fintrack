---
name: bug-fix
description: Workflow for diagnosing and fixing bugs with proper verification. Triggers via /bug-fix command.
---

# Bug Fix Workflow

Use this workflow when diagnosing and fixing a reported bug.

## Step 1: Reproduce

1. Understand the exact steps to reproduce the issue.
2. Identify the affected:
   - Route/page
   - Component(s)
   - IndexedDB store (if data-related)
   - Context/reducer (if state-related)

## Step 2: Diagnose

1. Trace the data flow: **Component → Context → Service → IndexedDB**.
2. Check for common issues:
   - Missing `syncMeta.deletedAt` filter (showing soft-deleted records)
   - Floating-point arithmetic on currency values (use integer cents!)
   - Missing `await` on IndexedDB operations (race condition)
   - Wallet balance not recomputed after write
   - Missing keyboard event handler (`N`, `Esc`, etc.)
   - Incorrect breakpoint styling (mobile vs. desktop)
   - Missing dark mode token swap

## Step 3: Fix

1. Apply the minimal fix — do not refactor unrelated code.
2. Ensure the fix follows all rules in `.agents/rules/`.
3. Preserve existing comments and documentation.
4. If the fix requires a schema change, follow the `db-migration` workflow.

## Step 4: Verify

1. Confirm the bug is fixed by following the original reproduction steps.
2. Verify no regressions in related features.
3. Test in both light and dark mode.
4. Test at mobile, tablet, and desktop breakpoints.
5. Verify no console errors or TypeScript warnings.
6. Check IndexedDB state in DevTools if data was involved.
