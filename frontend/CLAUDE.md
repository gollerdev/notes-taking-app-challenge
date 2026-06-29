# CLAUDE.md -- Frontend

## Architecture

### Overview

This project follows a **layered architecture** for the Next.js 14 frontend, enforcing a strict separation of concerns. Each layer has one responsibility and communicates only with the layer directly below it.

```
Page (app/) --> Service (services/) --> Base API wrapper (lib/api.ts) --> Backend /api/v1/
                                                   |
Context (context/) <-- hooks (hooks/) <-- components (components/)
```

### Folder Structure

```
frontend/
  app/
    layout.tsx              # Root layout (server component)
    page.tsx                # Home page
    health/
      page.tsx              # Health-check page (server shell)
    (auth)/
      login/page.tsx        # Login page (future)
      register/page.tsx     # Register page (future)
    (notes)/
      page.tsx              # Notes list (future)
  components/
    ui/                     # Generic reusable UI components
    notes/                  # Note-specific components (NoteCard, NoteForm, etc.)
    HealthStatus.tsx        # Health-check client component
  context/                  # React Context providers (e.g. AuthContext)
  hooks/                    # Custom hooks (e.g. useNotes)
  lib/
    api.ts                  # Base fetch wrapper (single source for base URL, headers, errors)
  services/                 # Service layer (one file per domain, e.g. notes.ts, auth.ts)
  types/
    index.ts                # Shared TypeScript interfaces (Note, User, CreateNotePayload, etc.)
  test-utils/
    factories.ts            # Faker-based test data factories (introduced with first feature)
  public/                   # Static assets
  tailwind.config.ts
  tsconfig.json
  vitest.config.ts
  vitest.setup.ts
  .eslintrc.json
  .prettierrc
  .env.example
  Dockerfile
  CLAUDE.md                 # This file
```

---

### Layer Responsibilities

#### Pages (`app/`)

Route entry points. Server components by default. They import and compose components or render a client-component shell. No business logic lives here.

#### Services (`services/`)

Domain-specific API call orchestrators. Each service file groups related API calls (e.g., `services/notes.ts` has `getNotes`, `createNote`, `deleteNote`). Services call `lib/api.ts` -- never `fetch` directly.

#### Base API Wrapper (`lib/api.ts`)

Single place for the backend base URL, auth headers, and error normalization. Exposes `api.get/post/patch/delete<T>()` over native `fetch`. All HTTP calls to the backend go through here.

`BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/api/v1"`

#### Context (`context/`)

React Context providers for global state (e.g., `AuthContext` for the current user). No external state library -- React Context + `useReducer`/`useState` is sufficient.

#### Hooks (`hooks/`)

Custom hooks that encapsulate data fetching and state logic (e.g., `useNotes`). Hooks call services -- never `lib/api.ts` or `fetch` directly.

#### Components (`components/`)

- `ui/` -- Generic, reusable components (buttons, modals, inputs).
- `notes/` -- Note-specific components (`NoteCard`, `NoteForm`, `CategoryFilter`, `DeleteButton`).
- Root-level components (e.g., `HealthStatus.tsx`) for cross-cutting concerns.

---

## Framework

Next.js 14 App Router. All routes in `app/`. No `pages/` directory.

**Package manager:** npm.

---

## TypeScript

- `strict: true` in `tsconfig.json`.
- **No `any` anywhere** -- enforced via ESLint rule `@typescript-eslint/no-explicit-any: "error"`.
- Every API response is typed in `types/index.ts`.
- `@/*` path alias configured in `tsconfig.json`.

---

## Styling

Tailwind CSS only. No inline styles, no CSS modules, no styled-components. If Tailwind cannot express a visual requirement, document the exception.

---

## Figma-first Rule

Before implementing any component with a designed UI, fetch its Figma node with `get_design_context`. Use returned values for colors, spacing, and typography. Never hardcode or guess visual values.

---

## Environment and Secrets

- All browser-exposed env vars use the `NEXT_PUBLIC_` prefix.
- `.env.local` is gitignored -- never committed.
- `.env.example` is committed with documented keys.
- Key: `NEXT_PUBLIC_API_URL=http://localhost:8000` (browser-facing base URL; `lib/api.ts` appends `/api/v1`).
- Key: `INTERNAL_API_URL=http://web:8000` (container-internal URL for server-component fetches).

**Server vs browser API URL:** `NEXT_PUBLIC_API_URL` resolves correctly in the browser (where `localhost:8000` is port-mapped from the host). It does NOT work inside the Next.js container — `localhost` there is the container itself. Server components that fetch data must use `INTERNAL_API_URL` (`http://web:8000`) so Docker's internal network resolves the backend service.

---

## Token Storage

JWT access tokens are read through a single helper function (`getAccessToken()` in `lib/api.ts`) so the storage mechanism can be swapped without touching call sites.

**Current implementation:** `localStorage` for simplicity during development.

**Security trade-off:** `localStorage` is accessible to JavaScript and therefore exposed to XSS attacks. An `httpOnly` cookie approach is XSS-safe but requires same-site/CSRF handling and backend cookie support. The final storage mechanism will be decided and implemented in the Auth ticket.

---

## Rendering Strategy

**Default:** Server Components. Only add `"use client"` when the component needs one of these:

| Trigger                  | Example                  |
| ------------------------ | ------------------------ |
| `useState`, `useReducer` | Form state, toggle       |
| `useEffect`              | Data fetching on mount   |
| `useContext`             | Auth context             |
| Browser APIs             | `localStorage`, `window` |
| Event handlers           | `onClick`, `onChange`    |

**Per-component rendering decisions:**

| Component             | Rendering | Reason                      |
| --------------------- | --------- | --------------------------- |
| `app/layout.tsx`      | Server    | Static shell                |
| `app/page.tsx`        | Server    | Static content              |
| `app/health/page.tsx` | Server    | Shell for HealthStatus      |
| `HealthStatus`        | Client    | `useEffect` + `useState`    |
| `NoteList` (future)   | Client    | `useEffect` + `useState`    |
| `NoteForm` (future)   | Client    | Form state + event handlers |

---

## Linting and Formatting

### ESLint

- Extends `next/core-web-vitals` and `plugin:@typescript-eslint/recommended-type-checked`.
- Type-aware linting is enabled (`parserOptions.project: ./tsconfig.json`), catching unhandled promises (`no-floating-promises`) and other type-level errors that `recommended` misses.
- Rules: `@typescript-eslint/no-explicit-any: "error"`, `@typescript-eslint/no-unused-vars: "error"`.
- Run: `npm run lint`

### Prettier

- Config: `{ "semi": true, "singleQuote": false, "trailingComma": "all", "printWidth": 88 }`
- Run: `npx prettier --check .`

### TypeScript

- Strict mode, no emit.
- Run: `npx tsc --noEmit`

---

## Testing Standards

### Tools

- **Vitest** as the test runner (`npm run test`).
- **React Testing Library** for component rendering.
- **jsdom** as the test environment.
- **@faker-js/faker** for randomized test data factories.

### Coverage

- **100% coverage** (lines, branches, functions, statements) is required on all testable code.
- Coverage provider: `v8`.
- Excluded from coverage: `app/layout.tsx`, `app/page.tsx`, `app/health/page.tsx` (server-component shells), `next.config.mjs`, `tailwind.config.ts`, `postcss.config.js`, `vitest.config.ts`, `vitest.setup.ts`, `types/**` (type-only files), `**/*.test.ts`, `**/*.test.tsx`, `**/*.d.ts`.

### Test Co-location

Tests are co-located with their source files: `Component.tsx` and `Component.test.tsx` live side by side.

### Mock Strategy (Per Layer)

| Layer              | What to mock                  |
| ------------------ | ----------------------------- |
| Component tests    | Service layer or `lib/api.ts` |
| Service tests      | `lib/api.ts`                  |
| `lib/api.ts` tests | Global `fetch`                |

### Strict Call Verification

Every unit test must assert:

1. The expected method was called with the exact expected arguments.
2. No other methods on the mocked dependency were called.

### Factories

Use `@faker-js/faker` to generate randomized test data. Factories live in `test-utils/factories.ts`. Fixed test data can silently mask bugs.

---

## Docker

The frontend is containerized for development. The root `docker-compose.yml` brings up the full stack:

- `db` -- PostgreSQL
- `web` -- Django backend
- `frontend` -- Next.js dev server

Run: `docker compose up` from the project root.

The frontend reaches the backend via `NEXT_PUBLIC_API_URL` (`http://localhost:8000` for local dev -- browser-facing, not the Docker service name).

---

## CI Contract

All of the following must pass before a PR can be merged:

```bash
npm run lint            # ESLint
npx prettier --check .  # Formatting
npx tsc --noEmit        # Type checking
npm run test            # Vitest
```
