# CLAUDE.md — Frontend

## Framework
Next.js 14 App Router. All routes in `app/`. No `pages/` directory.

## Styling
Tailwind CSS only. No inline styles, no CSS modules unless Tailwind cannot express it.

## Figma-first rule
Before implementing any component, fetch its Figma node with `get_design_context`. Use returned values for colors, spacing, and typography. Never guess visual values.

## Test runner
vitest. Run with `npm run test`. Tests co-located with components (`Component.test.tsx`).

## State
No global state library — React state + fetch is sufficient.

## Auth
JWT stored in httpOnly cookies. Never localStorage.
