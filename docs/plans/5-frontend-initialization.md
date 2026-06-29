# Plan: Frontend Initialization (Issue #5)

## Context
The `frontend/` directory currently holds only a brief stub `frontend/CLAUDE.md`. This ticket (#5) stands up the Next.js 14 App Router frontend from scratch — a runnable, tested, lint-clean skeleton that boots and connects to the backend's `GET /api/v1/health/` endpoint — and rewrites `frontend/CLAUDE.md` into the full frontend standards contract that every later ticket (Auth, Notes UI) will follow. No feature UI (notes list, note form, auth screens) is built here; the only page is a health-check page used to prove the stack talks to the backend end-to-end.

Unlike the backend (#4) where `backend/CLAUDE.md` was pre-finalized and treated as spec, here **`frontend/CLAUDE.md` is an explicit deliverable of this ticket** ("Standards to define in `frontend/CLAUDE.md`"). The user-provided draft is the authoritative base for it.

### Ambiguity / conflict to resolve (token storage)
The user's draft `lib/api.ts` reads the JWT from `localStorage.getItem("access_token")`, but the existing stub `frontend/CLAUDE.md` states "JWT stored in httpOnly cookies. Never localStorage." These contradict.
- **Assumption for this ticket:** no auth is implemented in #5 (health-check only), so the token-storage mechanism is not exercised yet. The new `frontend/CLAUDE.md` should **document the chosen approach explicitly and remove the contradiction** rather than ship both. Recommended: keep the draft's layered architecture but flag token storage as a decision to be finalized in the Auth ticket, and note the security trade-off (httpOnly cookie = XSS-safe but needs same-site/CSRF handling; localStorage = simpler but XSS-exposed). The subagent must pick one and state it; it must not leave both claims in the file.

## Sources of truth to consult
- None required for build behavior — this is a scaffold ticket with no designed UI. The health-check page is utility chrome, not a Figma screen, so `get_design_context` is **not** needed here.
- The user-provided frontend CLAUDE.md draft (in the ticket invocation) is the base content for the standards file.

## What already exists (skip these / build on these)
- **Backend is already running** with `GET /api/v1/health/` → `200` `{"status": "ok"}` under `/api/v1/` (see `docs/plans/4-backend-initialization.md`). The health-check page consumes this exact endpoint.
- **`frontend/CLAUDE.md` — stub only.** It is a short placeholder and **is a deliverable to be rewritten** in this ticket (not a frozen spec). Replace it with the full standards based on the user's draft, reconciling the token-storage conflict above.
- `.gitignore` at repo root — verify it ignores `.env.local` and `node_modules`; extend if missing, do not recreate.

## Files to create / modify

### `frontend/` — Next.js 14 scaffold (App Router, TypeScript, Tailwind)
- Initialize a Next.js 14 App Router project under `frontend/` using **npm** (per ticket: "Package manager: npm"). No `pages/` directory — App Router only.
- TypeScript with **strict mode** (`"strict": true` in `tsconfig.json`). Configure the `@/*` path alias used throughout the draft's imports.
- Tailwind CSS configured (`tailwind.config.ts`, `postcss.config`, global stylesheet with Tailwind directives). Tailwind only — no CSS modules / styled-components.

### `frontend/package.json` (scripts + deps)
- Scripts matching the CI contract in the standards doc: `dev`, `build`, `start`, `lint` (ESLint), `test` (`vitest run`), and a coverage/format invocation (`prettier --check .`, `tsc --noEmit`).
- Dev deps for testing/lint: `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@faker-js/faker`, `eslint` (+ `typescript-eslint`), `prettier`.

### `frontend/tsconfig.json`
- `"strict": true`, `@/*` path alias, Next.js + vitest-friendly settings. No `any` allowed anywhere in the codebase (enforced via ESLint rule below).

### `frontend/.eslintrc.json`
- Extends `next/core-web-vitals` and `plugin:@typescript-eslint/recommended-type-checked`.
- Rules: `@typescript-eslint/no-explicit-any: "error"`, `@typescript-eslint/no-unused-vars: "error"` (per draft).

### `frontend/.prettierrc`
- `{ "semi": true, "singleQuote": false, "trailingComma": "all", "printWidth": 88 }` (per draft).

### `frontend/vitest.config.ts` + `frontend/vitest.setup.ts`
- `vitest.config.ts`: `react()` plugin, `environment: "jsdom"`, `globals: true`, `setupFiles: ["./vitest.setup.ts"]`, coverage provider `v8` with `thresholds: { lines: 100 }` and the draft's `exclude` list (`app/layout.tsx`, `next.config.ts`, `tailwind.config.ts`, `**/*.d.ts`).
- `vitest.setup.ts`: import `@testing-library/jest-dom`.
- Note: 100% line coverage is the **standard** declared in CLAUDE.md, but in this ticket coverage applies only to the small surface actually built (the health-check page + `lib/api.ts` + any service it uses). Do not author untested code in this ticket that would fail the threshold.

### `frontend/.env.example`
- Documented, committed template. The real `.env.local` stays gitignored — never created or read.
- Key: `NEXT_PUBLIC_API_URL=http://localhost:8000` (the base URL; `lib/api.ts` appends `/api/v1`). All env vars exposed to the browser use the `NEXT_PUBLIC_` prefix.

### `frontend/lib/api.ts` — base fetch wrapper (foundational)
- Single place for base URL, auth headers, and error normalization, per the draft. `BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/api/v1"`.
- Exposes `api.get/post/patch/delete<T>()` over native `fetch` (ticket: "API communication: fetch (native)").
- **Token storage:** implement per the reconciled decision above; if deferred, read the token through a single helper so the storage mechanism can be swapped in the Auth ticket without touching call sites. Do not scatter `localStorage` access across files.

### `frontend/types/index.ts` — shared types (foundational, matches backend contract)
- Define `Note`, `CreateNotePayload`, `User` interfaces per the draft so later tickets import from here. No `any`. Keep aligned with the backend's eventual serializer shapes.

### Health-check page + its test (the ticket's proof-of-connectivity deliverable)
The whole point of this page is to **prove the frontend can talk to the locally-running backend** and visibly report whether the backend is up or down.
- **`frontend/app/health/page.tsx`** (or a `HealthStatus` client component rendered by a server-component page shell, per the draft's rendering rule): on mount, calls the backend `GET /api/v1/health/` through `lib/api.ts` and renders the connection state. Because it fetches user-facing live data and uses hooks/effects, the data-bearing piece is a **client component**; the page shell stays a server component.
- **Three visible states** the page must distinguish and display so a human can tell at a glance whether the two services can talk:
  1. **Loading / checking** — request in flight (e.g. "Checking backend…").
  2. **Up / connected** — `200` with `{"status": "ok"}` → a clear healthy indicator (e.g. "Backend: up ✅" / green).
  3. **Down / unreachable** — non-`2xx`, network error, or fetch rejection (backend not running, wrong `NEXT_PUBLIC_API_URL`, CORS) → a clear unhealthy indicator (e.g. "Backend: down ❌" / red). The error path must be caught and rendered, **not** thrown as an unhandled error or a blank screen.
- The component must target the *locally running* backend via `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`), so stopping the backend flips the page to the "down" state and starting it flips it back to "up" — the visible signal that the two services can communicate.
- **Test** (co-located or under `__tests__/` mirroring structure, per CLAUDE.md): mock the service/`fetch` boundary and cover **both outcomes** — (a) backend up → renders the healthy state, and (b) backend down (rejected/`!ok` response) → renders the error/down state without throwing. Follow the draft's strict-call-verification style (assert the health call was made; assert no unrelated calls). Run with `npm run test`.

### `frontend/CLAUDE.md` (DELIVERABLE — rewrite from the draft)
Replace the stub with the full standards contract based on the user's provided draft, covering every item the ticket lists:
- Architecture overview + layered diagram (Page → Service → `lib/api.ts` → backend `/api/v1/`; Context for global state; hooks; components `ui/` vs `notes/`).
- Folder structure (the draft's tree).
- Layer responsibilities (pages, services, base api wrapper, context, hooks, components).
- TypeScript rules (strict, no `any`, every API response typed in `types/`).
- Styling (Tailwind only).
- Environment & secrets (`NEXT_PUBLIC_` prefix, never commit `.env.local`, document in `.env.example`).
- Linting/formatting (ESLint + Prettier + typescript-eslint configs).
- Testing standards (Vitest + React Testing Library, 100% line coverage, per-layer mock strategy, strict call verification, faker-based factories).
- Rendering strategy (server-default, the `"use client"` triggers table, the per-component table).
- Docker note (see below).
- **Reconcile the token-storage contradiction** — the finished file must state one approach, not both.

### Docker (`frontend/Dockerfile` + compose integration)
- `frontend/Dockerfile`: Node base image; install deps from `package.json` + lockfile via npm; run the Next.js dev server (e.g. `npm run dev` on `0.0.0.0:3000`) for a working dev container.
- **Compose decision to flag:** the backend created `backend/docker-compose.yml`. The frontend draft says "All services are defined in `docker-compose.yml`." The subagent should add a `frontend` service so the full stack (Postgres + backend + frontend) comes up together. **Recommended:** a root `docker-compose.yml` that composes `db` + backend `web` + `frontend`, or extend the existing compose file — pick one and note it. Frontend reaches the backend via `NEXT_PUBLIC_API_URL` (browser-facing, so `http://localhost:8000` for local dev, not the compose service name).
- Heavy production hardening (multi-stage build, `next build`/standalone output, non-root user) is **out of scope** — deliver a working dev container only.

## Order of execution
1. Scaffold `frontend/` (Next.js 14 App Router + TS strict + Tailwind) with npm; configure `@/*` alias.
2. Tooling config: `tsconfig.json`, `.eslintrc.json`, `.prettierrc`, `vitest.config.ts`, `vitest.setup.ts`, `package.json` scripts.
3. `frontend/.env.example`.
4. Foundational layers: `lib/api.ts`, `types/index.ts`.
5. Health-check page/component + its test, wired to `GET /api/v1/health/`.
6. Rewrite `frontend/CLAUDE.md` from the draft (reconcile token storage).
7. `frontend/Dockerfile` + compose integration.
8. Run lint / typecheck / test, then boot (`npm run dev` and/or `docker compose up`) and confirm the health-check page shows the backend status.

## Verification
- [ ] `npm run lint` passes with no errors.
- [ ] `npx prettier --check .` passes (formatting clean).
- [ ] `npx tsc --noEmit` passes (strict, no `any`).
- [ ] `npm run test` (vitest) passes with no failures; the health-check test is green.
- [ ] `npm run dev` boots the app and the health-check page renders the backend status by calling `GET /api/v1/health/` (backend running) — proves frontend↔backend connectivity.
- [ ] With the backend **running locally**, the health-check page shows the "up/connected" state.
- [ ] With the backend **stopped**, the same page shows the "down/unreachable" state (caught and displayed, not a crash or blank page) — confirming the page actually detects whether the two services can talk.
- [ ] The health-check test covers both the up and down outcomes.
- [ ] `frontend/CLAUDE.md` covers every standard the ticket lists (npm, Next.js App Router + React + TS, Tailwind, Context API, fetch against `/api/v1/`, folder structure, env/secrets, Vitest + RTL, ESLint + Prettier) **and contains a single, non-contradictory token-storage statement**.
- [ ] No `any` anywhere; all API responses typed in `types/index.ts`.
- [ ] No hardcoded secrets; `.env.local` is gitignored; `.env.example` is committed with `NEXT_PUBLIC_API_URL`.
- [ ] No inline styles / CSS modules — Tailwind only.
- [ ] `docker compose up` brings up the frontend service alongside the backend stack (dev container).

## Out of scope
- Auth UI (`(auth)/login`, `(auth)/register`), `AuthContext`, and `services/auth.ts` — Auth ticket. Only the storage *mechanism note* is documented here, not implemented.
- Notes UI (`NoteList`, `NoteCard`, `NoteForm`, `CategoryFilter`, `DeleteButton`), `services/notes.ts`, `hooks/useNotes.ts` — Notes UI ticket. These are described as **conventions** in `frontend/CLAUDE.md` but not built now (building unused code would also break the `no-unused-vars` rule and the 100% coverage threshold).
- Full `test-utils/factories.ts` for `Note`/`User` beyond what the health-check test needs — introduced with the first consuming feature.
- CI pipeline files (GitHub Actions) — the CLAUDE.md documents the CI contract, but wiring the workflow is separate.
- Production Docker hardening (multi-stage, standalone build, non-root).
- Any final visual/Figma design work — no designed screens are part of initialization.
```