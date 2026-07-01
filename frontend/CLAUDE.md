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
    page.tsx                # Home page (redirect gate)
    fonts.ts                # Google Font loading (Inria Serif, Inter)
    health/
      page.tsx              # Health-check page (server shell)
    (auth)/
      layout.tsx            # Auth route-group layout (centered, cream bg)
      login/page.tsx        # Login page
      register/page.tsx     # Register page
    notes/
      page.tsx              # Notes list
      new/page.tsx          # Create new note
      [id]/page.tsx         # Edit existing note
  components/
    ui/                     # Generic reusable UI components
    auth/                   # Auth components (AuthForm, EmailInput, PasswordInput, SubmitButton, validation)
    notes/                  # Note list components (NoteCard, NoteGrid, CategoryItem, CategorySidebar, EmptyState, NewNoteButton)
    editor/                 # Note editor components (NoteEditor, EditorHeader, TitleInput, BodyTextarea, CategoryDropdown, LastEditedStamp)
    HealthStatus.tsx        # Health-check client component
  context/                  # React Context providers (e.g. AuthContext)
  hooks/                    # Custom hooks (e.g. useNotes)
  lib/
    api.ts                  # Base fetch wrapper (single source for base URL, headers, errors)
    categoryColors.ts       # Category-to-color mapping
    relativeDate.ts         # Relative date formatting
  services/                 # Service layer (one file per domain, e.g. notes.ts, auth.ts)
  types/
    index.ts                # Shared TypeScript interfaces (Note, User, CreateNotePayload, etc.)
  test-utils/
    factories.ts            # Faker-based test data factories
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

Domain-specific API call orchestrators. Each service file groups related API calls (e.g., `services/notes.ts` has `getAll`, `create`, `getById`, `patch`). Services call `lib/api.ts` -- never `fetch` directly.

#### Base API Wrapper (`lib/api.ts`)

Single place for the backend base URL, auth headers, and error normalization. Exposes `api.get/post/patch/delete<T>()` over native `fetch`. All HTTP calls to the backend go through here.

`BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/api/v1"`

#### Context (`context/`)

React Context providers for global state (e.g., `AuthContext` for the current user). No external state library -- React Context + `useReducer`/`useState` is sufficient.

#### Hooks (`hooks/`)

Custom hooks that encapsulate data fetching and state logic (e.g., `useNotes`). Hooks call services -- never `lib/api.ts` or `fetch` directly.

#### Components (`components/`)

- `ui/` -- Generic, reusable components (buttons, modals, inputs).
- `notes/` -- Note list components (`NoteCard`, `NoteGrid`, `CategoryItem`, `CategorySidebar`, `EmptyState`, `NewNoteButton`).
- `editor/` -- Note editor components (`NoteEditor`, `EditorHeader`, `TitleInput`, `BodyTextarea`, `CategoryDropdown`, `LastEditedStamp`).
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

### Design Tokens (introduced in Issue #11)

All visual values from Figma are centralized as Tailwind tokens in `tailwind.config.ts`. Components use token-based utilities -- never raw hex values, font stacks, or magic numbers.

**Palette tokens** (in `theme.extend.colors`):

| Token     | Value     | Usage                            |
| --------- | --------- | -------------------------------- |
| `cream`   | `#faf1e3` | Page/card backgrounds            |
| `brand`   | `#957139` | Borders, buttons, links, accents |
| `heading` | `#88642a` | Heading text                     |

Use: `bg-cream`, `border-brand`, `text-heading`, etc.

**Font tokens** (in `theme.extend.fontFamily`):

| Token   | Font        | Usage                   |
| ------- | ----------- | ----------------------- |
| `serif` | Inria Serif | Headings / display text |
| `sans`  | Inter       | Body text / UI elements |

Fonts are loaded via `next/font/google` in `app/fonts.ts` and exposed as CSS variables (`--font-inria-serif`, `--font-inter`) on `<body>`. Use: `font-serif`, `font-sans`.

**Rules for future UI work:**

- All new UI must consume these tokens -- never hardcode colors, font sizes, or font families.
- To add new visual values, extend `tailwind.config.ts` with new tokens rather than introducing one-off values in components.
- Error states use `text-red-600` / `border-red-600` (consistent with auth forms).

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

JWT tokens (access and refresh) are persisted in `localStorage` so sessions survive page reloads. A module-level variable in `lib/api.ts` acts as an in-memory cache for the access token.

**Implementation:** `setAccessToken(token)` writes to both the in-memory variable and `localStorage`. `getAccessToken()` returns the in-memory value first, falling back to `localStorage` (e.g. after a reload). `AuthContext` restores tokens from `localStorage` on mount (post-hydration) and provides `login()` / `logout()` / `clearSession()`. On 401, `lib/api.ts` attempts a single token refresh using the stored refresh token; on failure it clears both stores and redirects to `/login`. Call sites (services, hooks) are unaware of the storage mechanism.

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

| Component             | Rendering | Reason                                |
| --------------------- | --------- | ------------------------------------- |
| `app/layout.tsx`      | Server    | Static shell                          |
| `app/page.tsx`        | Client    | `useAuth` + `useEffect` redirect gate |
| `app/health/page.tsx` | Server    | Shell for HealthStatus                |
| `app/(auth)/layout`   | Server    | Static centered layout                |
| `app/(auth)/login`    | Client    | Form state + auth context             |
| `app/(auth)/register` | Client    | Form state + auth context             |
| `app/notes/page`      | Client    | `useNotes` + `useAuth`                |
| `app/notes/new/page`  | Client    | Note creation form state              |
| `app/notes/[id]/page` | Client    | Note editing form state               |
| `HealthStatus`        | Client    | `useEffect` + `useState`              |
| `NoteGrid`            | Client    | Renders note cards                    |
| `NoteEditor`          | Client    | Form state + event handlers           |

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
- Excluded from coverage: `app/layout.tsx`, `app/page.tsx`, `app/health/page.tsx`, `app/fonts.ts`, `app/(auth)/layout.tsx` (server-component shells), `next.config.mjs`, `tailwind.config.ts`, `postcss.config.js`, `vitest.config.ts`, `vitest.setup.ts`, `types/**` (type-only files), `test-utils/**`, `**/*.test.ts`, `**/*.test.tsx`, `**/*.d.ts`.

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
npm run typecheck       # tsc --noEmit
npm run lint            # ESLint (next lint)
npm run format:check    # Prettier
npm run test            # Vitest (run once)
npm run test:coverage   # Vitest with coverage thresholds (used in CI)
```
