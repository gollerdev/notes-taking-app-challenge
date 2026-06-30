# Ralph Loop: fix(frontend): resolve auth-flow defects (Issue #30)

## 2026-06-30

**Plan file:** `docs/plans/30-resolve-auth-flow-defects.md`
**Iterations:** 2 (min 2 / max 2)
**Result:** DONE

### What Claude did

**Iteration 1 — Implementation**
Modified 14 files across the frontend to fix both auth-flow defects:

1. **Hydration fix (`AuthContext.tsx`):** Removed `localStorage` read from `useState` initializer. Tokens now initialize to `{ access: null, refresh: null }` (server-consistent). Added post-mount `useEffect` to restore tokens from `localStorage`. Added `isHydrated` boolean flag and `clearSession` function to the context.

2. **401 interceptor (`lib/api.ts`):** Added `withRefreshRetry` wrapper that intercepts 401 responses, attempts a single token refresh using raw `fetch` (avoids recursion through the api wrapper), retries the original request on success, and clears session + redirects to `/login` on failure. Uses a mutex (`refreshPromise`) to prevent concurrent refresh attempts.

3. **Refresh endpoint (`services/auth.ts`):** Added `refreshAccessToken(refreshToken)` function calling `/auth/refresh/`.

4. **Page-level hydration gating:** Updated `app/page.tsx`, `app/notes/page.tsx`, `app/notes/[id]/page.tsx`, and `app/notes/new/page.tsx` to gate auth redirects on `isHydrated` — no redirect until tokens have been restored from `localStorage`.

5. **Tests:** Updated/added tests across all modified files. 208 tests passing across 29 test files.

6. **CI:** All four CI checks pass — `npm run test`, `npm run lint`, `npx prettier --check .`, `npx tsc --noEmit`.

7. **Visual verification:** Playwright confirmed no hydration errors on reload, no flash-redirect, correct redirect for logged-out users.

**Iteration 2 — Verification pass**
Re-ran all CI checks (208 tests pass, lint/prettier/tsc clean). Visually verified all acceptance criteria via Playwright: no hydration errors, no flash-redirect on reload, logged-out users redirect to `/login`, no console errors. All 13 acceptance criteria confirmed met.

### Deviations from the plan
- None. All files listed in the plan were modified as described.

### AC items that failed verification
- None. All acceptance criteria passed on both iterations.

### Lessons / surprises
- The 401 interceptor uses raw `fetch` instead of the `api` wrapper for the refresh call to avoid infinite recursion — this is a pattern worth documenting for future API interceptor work.
- The mutex pattern for concurrent 401 handling (single `refreshPromise` shared across callers) is clean and prevents thundering herd refresh attempts.
