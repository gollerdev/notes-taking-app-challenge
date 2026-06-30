# Plan: fix(frontend): resolve auth-flow defects — hydration mismatch and broken redirect on expired sessions (Issue #30)

## Context
The frontend auth flow has two related defects that must be fixed together. First, `AuthProvider` reads `localStorage` during the `useState` initializer, causing a React hydration mismatch on every authenticated page load — the server renders unauthenticated HTML while the client hydrates with real tokens, triggering a full re-render and console error floods. Second, auth is derived from token *presence* not validity, so expired/invalid tokens leave users stranded on error screens instead of redirecting to `/login`. There is no 401 interceptor and the stored refresh token is dead code. Both issues originate in `AuthContext.tsx` and were introduced/exposed by #23. This ticket covers all current auth-flow issues as described in issue #30.

## Sources of truth to consult
- Issue #30 body — contains root cause analysis, reproduction steps, proposed fixes, and acceptance criteria for both problems
- `frontend/CLAUDE.md` — token storage conventions, rendering strategy, CI contract, testing standards

## What already exists (skip / build on these)
- **`frontend/context/AuthContext.tsx`** — `AuthProvider` with `useState(getStoredTokens)` initializer causing hydration mismatch; `isAuthenticated` derived from `tokens.access !== null`
- **`frontend/lib/api.ts`** — base fetch wrapper with `ApiError` class; no 401 interceptor or refresh logic
- **`frontend/services/auth.ts`** — auth service calls (login, register, logout); no refresh-token endpoint call
- **`frontend/app/page.tsx`**, **`frontend/app/notes/page.tsx`**, **`frontend/app/notes/[id]/page.tsx`**, **`frontend/app/notes/new/page.tsx`** — protected pages with `useEffect` redirect guard on `isAuthenticated`
- Co-located `*.test.tsx` / `*.test.ts` files for all of the above

## Files to create / modify

### `frontend/context/AuthContext.tsx` (modify)
- **Hydration fix:** Remove `localStorage` read from the `useState` initializer. Initialize state to a server-consistent value (e.g., `{ access: null, refresh: null }`).
- **Post-mount restore:** Add a `useEffect` that reads `localStorage` after mount and calls `setTokens` with the stored values.
- **Expose `isHydrated`:** Add an `isHydrated` boolean to the context value. It starts `false` and flips to `true` after the `useEffect` has run (whether or not tokens were found). This lets consumers gate redirects/fetches until hydration is complete.
- **Logout-on-401:** Expose a `clearSession` (or similar) function that clears tokens from state and `localStorage`, so the 401 interceptor in `lib/api.ts` can call it.
- **Update context type:** Add `isHydrated: boolean` and the clear-session function to the context interface.

### `frontend/context/AuthContext.test.tsx` (modify)
- Add tests for the hydration-safe initialization: verify initial render has `isAuthenticated === false` and `isHydrated === false`.
- Add tests for post-mount token restoration: verify `isAuthenticated` becomes `true` and `isHydrated` becomes `true` after mount when `localStorage` has valid tokens.
- Add tests for `isHydrated === true` with no tokens in `localStorage`.
- Add tests for the clear-session function: verify it sets `isAuthenticated` to `false` and removes tokens from `localStorage`.
- Maintain 100% coverage.

### `frontend/lib/api.ts` (modify)
- **401 interceptor:** After any API call returns a 401 status, attempt a single token refresh using the refresh token from `localStorage` (call the refresh endpoint via `services/auth.ts` or inline).
- **Retry on success:** If refresh succeeds, update the stored access token and retry the original request exactly once with the new token.
- **Clear + redirect on failure:** If refresh fails (or no refresh token exists), clear the session (remove tokens from `localStorage`, call `setAccessToken(null)`) and redirect to `/login` via `window.location.href` (or `next/navigation` if accessible).
- **Prevent loops:** Use a flag or mutex to ensure only one refresh attempt is in-flight at a time. Queue concurrent 401s behind the single refresh attempt. Never retry more than once.
- Important: the interceptor must work even outside React component context (no `useContext` — use the module-level token and `localStorage` directly, which `lib/api.ts` already does).

### `frontend/lib/api.test.ts` (modify)
- Add tests for the 401 interceptor: verify refresh is attempted on 401, original request is retried on successful refresh, and session is cleared + redirect fires on failed refresh.
- Add tests for concurrent 401 handling: verify only one refresh call is made.
- Add tests for non-401 errors: verify they pass through unchanged.
- Maintain 100% coverage.

### `frontend/services/auth.ts` (modify)
- **Add refresh endpoint call:** Export a `refreshAccessToken(refreshToken: string)` function that calls the backend's token refresh endpoint (`/api/v1/auth/token/refresh/` or similar — check existing backend URLs).
- Returns the new access token on success, throws on failure.

### `frontend/services/auth.test.ts` (modify)
- Add tests for `refreshAccessToken`: success case returns new token, failure case throws.
- Maintain 100% coverage.

### `frontend/app/page.tsx` (modify)
- Gate the auth redirect on `isHydrated` from `useAuth()`. Do not redirect to `/login` until `isHydrated === true`.
- Pattern: `if (!isHydrated) return null;` (or a loading state) before the redirect check.

### `frontend/app/notes/page.tsx` (modify)
- Same `isHydrated` gating as `app/page.tsx`.

### `frontend/app/notes/[id]/page.tsx` (modify)
- Same `isHydrated` gating.

### `frontend/app/notes/new/page.tsx` (modify)
- Same `isHydrated` gating.

### Co-located page test files (modify as needed)
- Update tests for all four pages to cover: renders nothing (or loading) while `isHydrated === false`; redirects to `/login` when `isHydrated === true` and `isAuthenticated === false`; renders content when both are `true`.
- Maintain 100% coverage.

## Order of execution
1. **`frontend/context/AuthContext.tsx`** — Hydration-safe init, `useEffect` restore, `isHydrated` flag, clear-session function.
2. **`frontend/context/AuthContext.test.tsx`** — Tests for all new context behavior.
3. **`frontend/services/auth.ts`** — Add `refreshAccessToken` function.
4. **`frontend/services/auth.test.ts`** — Tests for refresh function.
5. **`frontend/lib/api.ts`** — 401 interceptor with refresh, retry, and clear+redirect fallback.
6. **`frontend/lib/api.test.ts`** — Tests for interceptor behavior.
7. **`frontend/app/page.tsx`** — Gate redirect on `isHydrated`.
8. **`frontend/app/notes/page.tsx`** — Gate redirect on `isHydrated`.
9. **`frontend/app/notes/[id]/page.tsx`** — Gate redirect on `isHydrated`.
10. **`frontend/app/notes/new/page.tsx`** — Gate redirect on `isHydrated`.
11. **Co-located page tests** — Update all four page test files.
12. **Full CI verification** — `npm run test`, `npm run lint`, `npx prettier --check .`, `npx tsc --noEmit`.

## Verification
- [ ] No `react-hydration-error` or "1 error" toast on reload of any authenticated page
- [ ] Initial client render matches server render (auth state hydrated post-mount via `isHydrated`)
- [ ] A logged-in reload does **not** flash-redirect to `/login` before tokens are restored
- [ ] Reloading a protected page with an expired/invalid access token redirects to `/login` (no stuck error screen)
- [ ] A 401 on any API call triggers a single refresh attempt; on success the original request is retried and succeeds transparently
- [ ] When refresh fails or no refresh token exists, the session is cleared and the user is redirected to `/login`
- [ ] No infinite refresh/redirect loops
- [ ] A genuinely logged-out user (no token) still redirects to `/login`
- [ ] `npm run test` passes with no failures and 100% coverage maintained
- [ ] `npm run lint` passes
- [ ] `npx prettier --check .` passes
- [ ] `npx tsc --noEmit` passes
- [ ] No hardcoded secrets, colors, or spacing values

## Out of scope
- Backend changes (token endpoints already exist)
- UI/visual changes to any page or component (this is purely auth-flow logic)
- Changes to login/register pages or their forms
- New pages or routes
- Figma design extraction (no visual work in this ticket)
- Token storage migration (stays in `localStorage` as established by #23)
- Server-side auth (middleware, SSR token validation)
