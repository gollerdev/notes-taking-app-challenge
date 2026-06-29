# Ralph Loop Log: Login & Register Pages (Issue #11)

## 2026-06-29

**Plan file:** `docs/plans/11-login-and-register-pages.md`
**Iterations:** 2 (min: 2, max: 3)
**Result:** DONE

### What Claude did

**Iteration 1** (implementation):
- Added `AuthCredentials` and `AuthTokens` types to `frontend/types/index.ts`
- Swapped `lib/api.ts` token storage from `localStorage` to in-memory (`setAccessToken`/`getAccessToken`) and updated existing tests
- Created `services/auth.ts` with `login`/`register` calling `api.post`
- Created `context/AuthContext.tsx` with `AuthProvider`, `useAuth`, in-memory token state, and `setAccessToken` integration
- Mounted `<AuthProvider>` in `app/layout.tsx`
- Set up fonts (`app/fonts.ts`) with Inria Serif (700) and Inter (400, 700) via `next/font/google`
- Extended `tailwind.config.ts` with palette tokens (`cream`, `brand`, `heading`) and font families (`serif`, `sans`)
- Documented design-token convention in `frontend/CLAUDE.md` Styling section
- Exported Figma illustrations (cactus, cat) at 2x to `public/images/`
- Built leaf components: `EmailInput`, `PasswordInput` (with show/hide toggle), `SubmitButton`
- Built shared `AuthForm` with client-side validation
- Created `(auth)/layout.tsx` route group layout (cream bg, centered column)
- Created `login/page.tsx` and `register/page.tsx` with full flows
- Repurposed `app/page.tsx` as redirect gate (unauthenticated → `/login`, authenticated → `/notes`)
- Created `test-utils/factories.ts` with `mockAuthPayload` and `mockAuthTokens`
- Wrote comprehensive tests for all new files (81 tests total)
- Verified visually with Playwright: both pages render correctly, navigation works, validation works, password toggle works

**Iteration 2** (verification pass):
- Re-read the plan and all CLAUDE.md files
- Ran full CI suite: `npm run test` (81 tests pass), `npm run lint`, `npx prettier --check .`, `npx tsc --noEmit` — all green
- Confirmed 100% coverage on all testable code
- Visually verified `/login` and `/register` via Playwright screenshots
- Verified empty-field validation, password show/hide toggle, page navigation links
- Confirmed `/` redirect to `/login` when unauthenticated
- Grepped for hardcoded hex values in components — none found
- Grepped for localStorage/cookie usage — none found
- All 21 acceptance criteria verified as met

### Deviations from the plan
- None

### AC items that failed verification
- None — all passed on both iterations

### Lessons / surprises
- Docker containers were already running from a previous session, so no startup delay
- The Playwright visual verification caught the full rendering pipeline working end-to-end, confirming `next/font` loaded correctly in the Docker container
- 81 tests with 100% coverage across 11 test files — the plan's detailed file list made the scope very clear
