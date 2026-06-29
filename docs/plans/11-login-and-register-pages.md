# Plan: Login & Register Pages (Issue #11)

## Context
This ticket implements the two pixel-perfect auth screens — `/login` and `/register` — that sit in front of the app, plus the in-memory `AuthContext`, the `services/auth.ts` layer, and the `/` redirect gate. It is the frontend counterpart to the backend auth infrastructure (Issue #7), whose `POST /api/v1/auth/register/` and `POST /api/v1/auth/login/` endpoints return `{access, refresh}` token pairs. This is a frontend-only ticket; the backend is already merged and running.

**Ambiguity / decisions noted:**
- **Token storage conflict (must resolve in this ticket).** The ticket states tokens are stored **in memory only via `AuthContext` — never `localStorage`, never a cookie**, and are intentionally lost on refresh. The existing [lib/api.ts](frontend/lib/api.ts) `getAccessToken()` reads from `localStorage`, and `frontend/CLAUDE.md` (Token Storage) documents `localStorage` as the interim choice "to be decided in the Auth ticket." **This is the Auth ticket → the decision is in-memory.** Because `lib/api.ts` is a plain module (it cannot call `useContext`), the resolution is: keep the single `getAccessToken()` helper contract, but back it with a module-level variable set by `AuthContext` via a new `setAccessToken(token | null)` exported from `lib/api.ts`. `AuthContext.login()` writes the token into both React state and `setAccessToken()`. This preserves the "swap storage without touching call sites" guarantee while satisfying the ticket. Document this in the PR and update `frontend/CLAUDE.md`'s Token Storage section to reflect the final in-memory decision.
- **Figma file resolved.** The ticket pinned File ID `nIqpRyEWKPYqYsW7RMfi3S` (an original challenge file), but the originals are read-only and the Figma MCP cannot access them ("edit access" error). The **canonical source of truth is our own writable copy, `imfHHa4B6WNdMXqhJh0pat`** — a duplicate of the challenge file with edit permissions, so node IDs/layouts match the originals (see `/CLAUDE.md` → "Figma source of truth"). The Login frame is node `34:831` ("MacBook Air - 13") and Register is node `34:889` ("MacBook Air - 14"). All values in "Figma values (extracted)" below come from that copy.
- **`/notes` does not exist yet.** The `/` redirect and post-auth redirect both target `/notes`, which is a future ticket. The redirect is still wired to `/notes`; landing there 404s until that ticket lands — acceptable and in-scope only as a `router.replace("/notes")` call.
- **`id` type on tokens/user.** Backend `User` uses a UUID pk; existing `types/index.ts` types `User.id` as `number`. Auth responses here only carry `{access, refresh}` strings, so no `id` is consumed — leave `types/index.ts` `User`/`Note` untouched except for adding the new auth types below.

## Sources of truth to consult
- **Figma design file** — File ID `imfHHa4B6WNdMXqhJh0pat` (project default), Login node `34:831`, Register node `34:889`. Concrete values already extracted via `get_design_context` are recorded in "Figma values (extracted)" below. The subagent should still re-pull `get_design_context` for these two nodes to (a) export the illustration/icon assets at 2x and (b) confirm any focused/error-state styling, before writing component code. Never hardcode or guess values not present here (`/CLAUDE.md` Figma rules, `frontend/CLAUDE.md` Figma-first rule).
- **Figma prototype** — for navigation flow and interactive (focused, error) states if needed; the design file already supplies the static styling.
- Product video — only if a behavioral question arises; Figma wins on visuals, video wins on behavior.

### Figma values (extracted 2026-06-29 — design file `imfHHa4B6WNdMXqhJh0pat`)
**Note:** the Figma input controls reuse a component literally named "Category Dropdown"; in these two screens they render as the email/password fields. Treat them as the text inputs described below, not as dropdowns.

**Colors**
- Page background: `#faf1e3` (cream)
- Brand brown (input border, button border + text, links): `#957139`
- Heading brown: `#88642a`
- Input placeholder / value text: black (`#000`)
- Error state color: **not defined in these two frames** — the subagent must derive an error treatment consistent with the palette (e.g. a red border + helper text) and confirm against any error-state frame in the prototype; document the chosen value in the PR.

**Typography**
- Heading (greeting): font family **Inria Serif**, weight Bold, size `48px`, color `#88642a`
- Input placeholder/value + nav links: **Inter** Regular, `12px`
- Button label: **Inter** Bold, `16px`, color `#957139`
- Both are Google Fonts → load via `next/font/google` (see new "Fonts" file note); do not rely on system fonts.

**Layout / dimensions** (desktop frame 1280×832; design uses a centered single column ~`384px` wide)
- Form column width: `384px`, horizontally centered.
- Illustration sits above the heading (~`top 194`), heading below it, then the two inputs (`52px` vertical pitch), then the button, then the nav link.
- Email input then Password input stacked; vertical gap ≈ `13px` (input height `39px`, pitch `52px`).

**Email & Password input**
- Border: `1px solid #957139`; border-radius: `6px`; height: `39px`; padding: `7px 15px`; gap `8px`; width `384px`.
- Placeholder text: `Email address` and `Password` (Inter Regular 12px).

**Password show/hide toggle — present (build it).** The password field has an eye icon button (node `143:247` on login / `35:9007` on register) plus a small "Hide" label on the right edge of the field. `PasswordInput` must implement the show/hide toggle, swapping input `type` between `password` and `text`.

**Primary button** (outlined, not filled)
- Border: `1px solid #957139`; border-radius: `46px`; height: `43px`; padding: `12px 16px`; width `384px`; background transparent/cream.
- Label: Inter Bold `16px`, color `#957139`. **Login screen label: `Login`. Register screen label: `Sign Up`.**

**Exact strings**
- Greetings: login `Yay, You're Back!` (node `34:872`); register `Yay, New Friend!` (node `34:893`).
- Placeholders: `Email address`, `Password`.
- Nav link, login→register: `Oops! I've never been here before` (underlined, node `35:9026`).
- Nav link, register→login: `We're already friends!` (underlined, node `35:9016`).

**Illustrations (export at 2x → `public/images/`)**
- Login: cactus-in-pot graphic, node `143:244` (~`95×114`).
- Register: sleeping-cat graphic, node `34:899` (~`188×134`).
- The eye/Hide toggle icon is a vector group (node `143:247` / `35:9007`) — either export as SVG or reproduce with an inline SVG.

## What already exists (skip / build on these)
- **[lib/api.ts](frontend/lib/api.ts)** — `api.get/post/patch/delete<T>()`, `ApiError`, `buildHeaders()` (adds `Authorization: Bearer <token>` when present), and `getAccessToken()` (currently reads `localStorage`). This ticket **modifies** the token source (see below) but reuses `api.post`.
- **[types/index.ts](frontend/types/index.ts)** — has `User`, `Note`, `CreateNotePayload`, `HealthCheckResponse`. Add the new auth types here.
- **[app/layout.tsx](frontend/app/layout.tsx)** — root server layout. Must be modified to mount the `AuthProvider` (a client component) around `{children}`.
- **[app/page.tsx](frontend/app/page.tsx)** — current static "Notes App" home. Repurposed into the `/` redirect gate.
- **`vitest` + RTL + faker** are configured; `test-utils/factories.ts` is referenced by `frontend/CLAUDE.md` as "introduced with first feature" — create it here.
- Backend auth endpoints (`/api/v1/auth/register/`, `/api/v1/auth/login/`) from Issue #7 are merged.

## Files to create / modify

### `frontend/types/index.ts` (modify)
- Add:
  - `AuthCredentials` — `{ email: string; password: string }` (request payload for both flows).
  - `AuthTokens` — `{ access: string; refresh: string }` (response from both endpoints).
- Do not alter existing `User`/`Note`/`CreateNotePayload`.

### `frontend/lib/api.ts` (modify) — in-memory token source
- Add a module-level `let accessToken: string | null = null;`.
- Add `export function setAccessToken(token: string | null): void` that assigns it (called by `AuthContext`).
- Change `getAccessToken()` to return the in-memory `accessToken` variable instead of reading `localStorage` (remove the `localStorage`/`window` read). Keep the function name and signature so `buildHeaders()` is untouched.
- Update the docstring to state storage is **in-memory only** per Issue #11.
- Update the existing `lib/api.test.ts` token-injection test(s) to drive the token via `setAccessToken()` instead of `localStorage` (see Verification — existing tests must stay green and at 100%).

### `frontend/services/auth.ts` (create)
- `authService` object, calling `lib/api.ts` only (no raw `fetch`), per the ticket:
  - `register(payload: AuthCredentials): Promise<AuthTokens>` → `api.post<AuthTokens>("/auth/register/", payload)`
  - `login(payload: AuthCredentials): Promise<AuthTokens>` → `api.post<AuthTokens>("/auth/login/", payload)`
- Typed with the new `types/index.ts` interfaces; no `any`.

### `frontend/context/AuthContext.tsx` (create) — `"use client"`
- Provides `{ access, refresh, isAuthenticated, login, logout }` via React Context + `useState`.
- `login({ access, refresh }: AuthTokens)` → stores both tokens in state **and** calls `setAccessToken(access)` from `lib/api.ts` so subsequent requests are authorized.
- `logout()` → clears state and calls `setAccessToken(null)`.
- `isAuthenticated` derived from presence of `access`.
- Export a `useAuth()` hook that reads the context and throws if used outside the provider.
- Tokens live in memory only — no `localStorage`/cookie writes; lost on refresh by design.

### `frontend/app/layout.tsx` (modify)
- Wrap `{children}` in `<AuthProvider>`. Since `AuthProvider` is a client component, importing it into the server layout is fine (it renders a client boundary). Keep `metadata` and `<html>/<body>` structure intact.

### `frontend/app/(auth)/layout.tsx` (create)
- Auth route-group layout: **no nav/sidebar chrome**, centered content. Use Tailwind only. Pull container background/spacing from Figma. Server component unless Figma requires client-only behavior.

### `frontend/app/fonts.ts` (create) — or inline in `app/layout.tsx`
- The **canonical font setup for the whole app** (not just auth): load **Inria Serif** (weight 700) and **Inter** (400, 700) via `next/font/google`, exposed as CSS variables (e.g. `--font-inria-serif`, `--font-inter`). Wire the variables onto `<body>` in `app/layout.tsx` and reference them in `tailwind.config.ts` `fontFamily` so components use `font-serif`/`font-sans` (or named utilities) rather than hardcoded font stacks. Future pages reuse this same setup. No self-hosted font files; no `@import`.

### `frontend/tailwind.config.ts` (modify) — establishes the project-wide design-token convention
- This is the **first styled feature, so the tokens defined here become the canonical design system for all future UI tickets** — later work must reuse these tokens, not redefine hex values or font stacks.
- Extend `theme.colors` with the palette tokens so components avoid raw hex: `cream: "#faf1e3"`, `brand: "#957139"`, `heading: "#88642a"` (names illustrative — pick semantic names that read well across the app, not just auth). Extend `fontFamily` with the `next/font` CSS variables (e.g. `serif` → Inria Serif for headings, `sans` → Inter for body/UI). Components then use `bg-cream`, `border-brand`, `text-heading`, `font-serif`, etc. — satisfying the "no hardcoded colors" rule.
- Treat this token set as extensible: future tickets add new tokens here (more palette entries, spacing scale, etc.) rather than introducing one-off values in components.

### `frontend/CLAUDE.md` (modify) — document the convention
- Update the **Styling** section to record the design-token convention this ticket introduces, so it binds future UI work: the canonical palette tokens (`#faf1e3`/`#957139`/`#88642a` → their Tailwind names), the two fonts and how they're loaded (`next/font/google`, exposed as CSS variables, mapped to `font-serif`/`font-sans`), and the rule that **all new UI must consume these tokens — never hardcode colors, font sizes, or families; add new tokens to `tailwind.config.ts` instead.** Keep it brief (a short subsection), consistent with the existing "Tailwind only" rule.

### `frontend/app/(auth)/login/page.tsx` (create) — `"use client"`
- Renders `AuthForm` configured for login: greeting `Yay, You're Back!`, cactus illustration (node `143:244`), email + password inputs, submit button labeled `Login`, and a link to `/register` with text `Oops! I've never been here before`.
- On submit (after client validation passes): call `authService.login(payload)`, then `useAuth().login(tokens)`, then `useRouter().replace("/notes")`.
- On API error: surface the message from `ApiError.body` as an inline error (invalid credentials) per Figma error styles.

### `frontend/app/(auth)/login/page.test.tsx` (create)
- Mocks `authService` and `next/navigation` `useRouter`. Tests (per ticket Testing Requirements): renders email/password/submit; empty-field submit shows validation errors and does **not** call `authService`; successful login calls `authService.login` with correct args and redirects to `/notes`; failed login renders the API error message. Strict call verification (correct args + no other service method called).

### `frontend/app/(auth)/register/page.tsx` (create) — `"use client"`
- Same as login but greeting `Yay, New Friend!`, sleeping-cat illustration (node `34:899`), submit button labeled `Sign Up`, calls `authService.register`, link to `/login` with text `We're already friends!`.
- On success: `useAuth().login(tokens)` → `router.replace("/notes")`.
- On error: inline error below the relevant field.

### `frontend/app/(auth)/register/page.test.tsx` (create)
- Mirror of the login test against `authService.register`.

### `frontend/components/auth/AuthForm.tsx` (create) — `"use client"`
- Shared form shell used by both pages. Props (suggested): `greeting`, `submitLabel`, `onSubmit(credentials)`, `footer` (link node), and an optional top-level `error` string.
- Owns email/password field state and runs client validation (see Validation) before invoking `onSubmit`; blocks submit on validation failure.
- Composes `EmailInput`, `PasswordInput`, `SubmitButton`. All visual values from Figma. Handles default/focused/error states as designed.

### `frontend/components/auth/EmailInput.tsx` (create) — `"use client"`
- Props: `value`, `onChange`, `error?`. Renders label + input + error message when `error` is set. Figma dimensions/colors/typography for default/focused/error.

### `frontend/components/auth/EmailInput.test.tsx` (create)
- Renders label, input, and error message when `error` prop is provided (per ticket Components tests).

### `frontend/components/auth/PasswordInput.tsx` (create) — `"use client"`
- Props: `value`, `onChange`, `error?`. Label + input + error message. **Show/hide toggle is required** — the design has an eye icon + "Hide" label on the field's right edge (nodes `143:247` / `35:9007`). Toggling swaps the input `type` between `password` and `text`. Figma states for default/focused/error.

### `frontend/components/auth/PasswordInput.test.tsx` (create)
- Renders label, input, and error message when `error` prop is provided. Tests the show/hide toggle flips `type` between `password` and `text`.

### `frontend/components/auth/SubmitButton.tsx` (create) — `"use client"`
- Props: `label`, `loading`, `disabled?`. Primary CTA. **Disabled while a request is in flight** (loading state) per ticket. Figma dimensions/colors/hover/active.

### `frontend/components/auth/SubmitButton.test.tsx` (create)
- Asserts the button is disabled when `loading` is true (per ticket Components tests).

### `frontend/app/page.tsx` (modify) — `/` redirect gate, `"use client"`
- Replace the static home with a client component that reads `useAuth()` and, on mount (`useEffect`), `router.replace("/login")` when unauthenticated or `router.replace("/notes")` when authenticated. Render nothing / a minimal placeholder while redirecting.
- Note: because tokens are in-memory and lost on refresh, an unauthenticated `/` after refresh correctly routes to `/login`.

### `frontend/app/page.test.tsx` (create)
- Mocks `useRouter` and wraps in `AuthProvider`: unauthenticated visit calls `router.replace("/login")`; authenticated state calls `router.replace("/notes")`.

### `frontend/context/AuthContext.test.tsx` (create)
- Tests `login` stores tokens, flips `isAuthenticated`, and calls `setAccessToken` (mock `lib/api.ts`); `logout` clears them; `useAuth` throws outside a provider. Strict call verification on `setAccessToken`.

### `frontend/services/auth.test.ts` (create)
- Mocks `lib/api.ts`: `register`/`login` call `api.post` with the exact path and payload and return its result; assert no other `api` method is called.

### `frontend/test-utils/factories.ts` (create)
- `mockAuthPayload()` exactly per ticket:
  ```typescript
  export const mockAuthPayload = () => ({
    email: faker.internet.email(),
    password: faker.internet.password({ length: 12 }),
  });
  ```
- Add a `mockAuthTokens()` helper returning `{ access, refresh }` with `faker` strings for use in page/context tests. Randomized data per `frontend/CLAUDE.md`.

### `frontend/public/images/` (create, as needed)
- Destination for any illustrations/images exported from Figma at 2x as PNG.

## Validation (frontend, before hitting the API)
| Field | Rule |
|---|---|
| `email` | Required, valid email format |
| `password` | Required, minimum 8 characters |
- Implement as small pure validators (co-located in `AuthForm` or a tiny `components/auth/validation.ts`) so they are unit-testable and reused by both pages. Show inline messages matching Figma error styles; do not submit when invalid.

## Order of execution
1. **Types** — add `AuthCredentials`, `AuthTokens` to `types/index.ts`.
2. **api.ts token swap** — add `setAccessToken`, back `getAccessToken` with the in-memory variable; update `lib/api.test.ts`.
3. **Service** — `services/auth.ts` + `services/auth.test.ts`.
4. **Context** — `context/AuthContext.tsx` + test; mount `<AuthProvider>` in `app/layout.tsx`.
5. **Fonts + tokens (design-system foundation)** — add `next/font` (Inria Serif, Inter) in `app/fonts.ts`/`layout.tsx`; extend `tailwind.config.ts` colors + fontFamily; document the token/font convention in `frontend/CLAUDE.md` Styling section.
6. **Figma assets** — re-pull `get_design_context` for nodes `34:831`/`34:889` and export the cactus (`143:244`), cat (`34:899`), and eye-icon (`143:247`) assets at 2x into `public/images/`.
7. **Leaf components** — `EmailInput`, `PasswordInput` (with show/hide toggle), `SubmitButton` (+ tests) using the extracted Figma values/tokens.
8. **Shared form** — `AuthForm` + validation.
9. **Route group** — `app/(auth)/layout.tsx`, then `login/page.tsx` + test, `register/page.tsx` + test.
10. **Redirect gate** — repurpose `app/page.tsx` + `app/page.test.tsx`.
11. Run the full lint/format/type/test suite; verify 100% coverage.

## Verification
- [ ] `npm run test` passes with no failures.
- [ ] Vitest coverage is **100%** (lines, branches, functions, statements) on all new pages, components, context, and service (server-shell exclusions per `frontend/CLAUDE.md` still apply).
- [ ] `npm run lint` passes (no `any`, no unused vars).
- [ ] `npx prettier --check .` passes.
- [ ] `npx tsc --noEmit` passes.
- [ ] `/login` renders email input, password input, and submit button and matches Figma (typography, colors, dimensions, spacing, border radius, error states).
- [ ] `/register` renders the same and matches Figma.
- [ ] Submitting either form with empty fields shows inline validation errors and does **not** call `authService`.
- [ ] Successful login calls `authService.login` with the entered credentials and `router.replace("/notes")`; successful register calls `authService.register` and redirects likewise.
- [ ] Failed login/register renders the API error message inline.
- [ ] On success, tokens are stored in `AuthContext` (in memory) and `setAccessToken(access)` is called so subsequent requests carry `Authorization: Bearer <access>`.
- [ ] No token is written to `localStorage` or a cookie anywhere.
- [ ] Login links to `/register` (text `Oops! I've never been here before`) and register links to `/login` (text `We're already friends!`); buttons read `Login` / `Sign Up`; greetings read `Yay, You're Back!` / `Yay, New Friend!`.
- [ ] `PasswordInput` show/hide toggle flips the input between masked and visible.
- [ ] Inria Serif + Inter loaded via `next/font`; palette tokens (`#faf1e3`, `#957139`, `#88642a`) live in `tailwind.config.ts` — no raw hex in components.
- [ ] The design-token + font convention is documented in `frontend/CLAUDE.md` (Styling) so future UI tickets reuse the tokens instead of redefining values.
- [ ] Unauthenticated visit to `/` redirects to `/login`; authenticated state redirects to `/notes`.
- [ ] `SubmitButton` is disabled while a request is in flight.
- [ ] `authService` is mocked in all page tests — no real API calls; strict call verification (exact args + nothing else called).
- [ ] Illustrations/images exported at 2x render correctly from `public/images/`.
- [ ] No hardcoded colors, spacing, typography, or secrets — all visual values sourced from Figma.

## Out of scope
- The `/notes` page, note list, note editor, autosave, and any post-login app chrome (separate ticket) — only the `router.replace("/notes")` call is in scope here.
- Refresh-token rotation/refresh flow on the client, logout UI, and persisting auth across refresh — tokens are intentionally in-memory and lost on refresh per the ticket.
- Backend auth changes — Issue #7 is merged and unchanged.
- Password reset, email verification, social login, "remember me", and rate limiting.
- Switching token storage to httpOnly cookies (explicitly rejected by the ticket).
- Docker/CI config changes beyond what already exists.
