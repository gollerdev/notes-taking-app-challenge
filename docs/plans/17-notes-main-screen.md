# Plan: Notes Main Screen (Issue #17)

## Context
This ticket implements the main notes screen at `/notes` — the primary view after login. It displays a category sidebar with note counts, a 3-column note grid filtered by the active category, an empty state when no notes exist, and a "+ New Note" button. This is a frontend-only ticket; it depends on Issue #11 (auth/login) and Issue #16 (backend notes endpoints), both of which are merged. The backend exposes `GET /api/v1/notes/` (list, optionally filtered by `?category=`) and `POST /api/v1/notes/` (create); response shape is `{ id, title, body, category, created_at, updated_at }`.

**Ambiguity / decisions noted:**
- **`Note.id` type mismatch.** The current `types/index.ts` defines `Note.id` as `number`, but the backend uses UUID primary keys (strings). This ticket must fix the type to `string` so the frontend correctly handles UUIDs.
- **"+ New Note" creates with default values → opens editor.** The editor is a future ticket (FRONTEND-003). For now, the button creates a note via `POST /api/v1/notes/` with default values (e.g. `{ title: "Untitled", body: "", category: "personal" }`) and optimistically adds it to the grid. Opening the editor is out of scope — the new card simply appears in the grid.
- **Category filtering is client-side.** All notes are fetched once on mount; selecting a category filters in-memory. No additional API call per category selection.
- **Relative date logic is frontend-only.** "today" / "yesterday" / absolute date is computed from `created_at` in the card header.

## Sources of truth to consult
- **Figma design file** — File ID `imfHHa4B6WNdMXqhJh0pat`, main screen node `12-486`. The subagent **must** call `get_design_context` for this node before writing any component code to extract all colors, spacing, typography, card dimensions, sidebar width, grid gap, empty state illustration, category color mapping, and "+ New Note" button styling.
- **Product video** — for behavioral details on category sidebar interaction, note card click behavior, and empty state transitions if ambiguous in Figma.

## What already exists (skip / build on these)
- **`lib/api.ts`** — `api.get/post/patch/delete<T>()` with in-memory Bearer token via `setAccessToken()`.
- **`services/auth.ts`** — Auth service with `login`/`register`. No notes service exists yet — create it.
- **`context/AuthContext.tsx`** — `useAuth()` providing `isAuthenticated`, `login`, `logout`.
- **`types/index.ts`** — `Note`, `CreateNotePayload`, `AuthCredentials`, `AuthTokens` already defined. `Note.id` needs fixing from `number` to `string`.
- **`tailwind.config.ts`** — Design tokens: `cream`, `brand`, `heading` colors; `serif`/`sans` font families. New category color tokens will be added here.
- **`test-utils/factories.ts`** — `mockAuthPayload()`, `mockAuthTokens()`. A `mockNote()` factory must be added.
- **`app/(auth)/`** — Auth pages already exist at `/login` and `/register`.
- **Backend** — `GET /api/v1/notes/`, `POST /api/v1/notes/`, `PATCH /api/v1/notes/:id/`, `GET /api/v1/notes/:id/` all merged and working. Categories: `random_thoughts`, `school`, `personal` (default: `personal`).

## Files to create / modify

### `frontend/types/index.ts` (modify)
- Change `Note.id` from `number` to `string` (backend uses UUID).
- Verify `User.id` is consistent (leave as-is if not consumed yet).

### `frontend/services/notes.ts` (create)
- `notesService` object calling `lib/api.ts`:
  - `getAll(): Promise<Note[]>` -> `api.get<Note[]>("/notes/")`
  - `create(payload: CreateNotePayload): Promise<Note>` -> `api.post<Note>("/notes/", payload)`
- Typed with `types/index.ts` interfaces; no `any`.

### `frontend/services/notes.test.ts` (create)
- Mock `lib/api.ts`. Test that `getAll` calls `api.get` with `/notes/` and returns its result; `create` calls `api.post` with `/notes/` and the payload. Strict call verification (correct args + no other api method called).

### `frontend/hooks/useNotes.ts` (create) -- `"use client"` not needed (hook, not component)
- Custom hook that fetches all notes on mount via `notesService.getAll()`.
- Returns `{ notes, loading, setNotes }`.
- `notes` is `Note[]`, `loading` is `boolean`.
- `setNotes` exposed so the page can optimistically add a new note.
- Pattern per ticket:
  ```typescript
  useEffect(() => {
    notesService.getAll().then(setNotes).finally(() => setLoading(false));
  }, []);
  ```

### `frontend/hooks/useNotes.test.ts` (create)
- Mock `notesService`. Test that `getAll` is called on mount and nothing else. Test that `notes` and `loading` state update correctly. Strict call verification.

### `frontend/lib/categoryColors.ts` (create)
- `CATEGORY_COLORS: Record<string, string>` mapping `random_thoughts`, `school`, `personal` to their background colors.
- **Values must be extracted from Figma node `12-486`** — do not hardcode guesses.
- Also export a `CATEGORY_LABELS: Record<string, string>` mapping category values to display names: `random_thoughts` -> `"Random Thoughts"`, `school` -> `"School"`, `personal` -> `"Personal"`.

### `frontend/lib/relativeDate.ts` (create)
- `formatRelativeDate(isoString: string): string` — pure function:
  - Same calendar day as now -> `"today"`
  - Previous calendar day -> `"yesterday"`
  - Older -> absolute date format (check Figma for exact format; fallback to locale date string like `"Jun 15, 2026"`)
- No external date library; use native `Date`.

### `frontend/lib/relativeDate.test.ts` (create)
- Test all three branches: today, yesterday, older. Mock `Date` or use known dates.

### `frontend/tailwind.config.ts` (modify)
- Add category background color tokens extracted from Figma (e.g. `note-random`, `note-school`, `note-personal` or similar semantic names). The exact hex values come from `get_design_context` for node `12-486`.

### `frontend/components/notes/CategorySidebar.tsx` (create) -- `"use client"`
- Props: `notes: Note[]`, `activeCategory: string | null`, `onSelect: (category: string | null) => void`
- Renders "All Categories" heading at top; clicking it calls `onSelect(null)`
- Below: each category row via `CategoryItem`, with note count derived from `notes.filter(n => n.category === cat).length`
- Active category is visually highlighted per Figma active state
- All visual values from Figma node `12-486` (sidebar width, padding, typography, colors)

### `frontend/components/notes/CategorySidebar.test.tsx` (create)
- Renders "All Categories" heading
- Renders each category with correct note count
- Clicking a category calls `onSelect` with the correct category value
- Clicking "All Categories" calls `onSelect(null)`
- Active category is visually distinguished (check for active class/style)

### `frontend/components/notes/CategoryItem.tsx` (create) -- `"use client"`
- Props: `label: string`, `count: number`, `isActive: boolean`, `onClick: () => void`
- Single sidebar row: category name + note count badge
- Active/inactive styling from Figma

### `frontend/components/notes/NoteGrid.tsx` (create) -- `"use client"`
- Props: `notes: Note[]`
- 3-column grid layout per Figma (gap from Figma)
- Renders a `NoteCard` for each note
- Renders `EmptyState` when the note list is empty

### `frontend/components/notes/NoteGrid.test.tsx` (create)
- Renders a `NoteCard` for each note in the list
- Renders `EmptyState` when the note list is empty

### `frontend/components/notes/NoteCard.tsx` (create) -- `"use client"`
- Props: `note: Note`
- Displays:
  - Header line: `<relative date> . <category label>` using `formatRelativeDate` and `CATEGORY_LABELS`
  - Title: large, bold
  - Body preview: plain text, truncated via CSS (line-clamp or overflow-hidden)
- Background color from `CATEGORY_COLORS[note.category]`
- All dimensions, border radius, padding, typography from Figma node `12-486`

### `frontend/components/notes/NoteCard.test.tsx` (create)
- Renders title, body preview, and header line
- Header line shows "today" for notes created today
- Header line shows "yesterday" for notes created yesterday
- Header line shows absolute date for older notes
- Background color matches the category color mapping

### `frontend/components/notes/EmptyState.tsx` (create) -- `"use client"`
- Illustrated empty state graphic (exported from Figma at 2x into `public/images/`)
- Message: `"I'm just here waiting for your charming notes..."`
- Typography and layout from Figma

### `frontend/components/notes/EmptyState.test.tsx` (create)
- Renders the illustration image and correct message text

### `frontend/components/notes/NewNoteButton.tsx` (create) -- `"use client"`
- Props: `onClick: () => void`
- "+ New Note" CTA button, positioned per Figma (top-right in header area)
- Dimensions, colors, typography from Figma

### `frontend/components/notes/NewNoteButton.test.tsx` (create)
- Clicking calls `onClick`
- `notesService` is mocked in this test (via the page test, not directly here -- button just fires onClick)

### `frontend/app/notes/page.tsx` (create) -- `"use client"`
- Protected route: redirects to `/login` if `!isAuthenticated` (via `useAuth()`)
- Uses `useNotes()` to fetch notes on mount
- Manages `activeCategory` state (`string | null`, default `null` = all)
- Renders layout: header with "Notes List" title and `NewNoteButton`, then sidebar + grid
- Category filtering: `const filtered = activeCategory ? notes.filter(n => n.category === activeCategory) : notes`
- NewNoteButton onClick: `POST /api/v1/notes/` with default values (`{ title: "Untitled", body: "", category: "personal" }`) via `notesService.create()`, optimistically prepend the returned note to the notes array via `setNotes`
- Show loading state while `useNotes` is loading

### `frontend/app/notes/page.test.tsx` (create)
- `/notes` redirects to `/login` when unauthenticated
- `/notes` renders the sidebar and note grid when authenticated
- Selecting a category filters the grid
- "All Categories" clears the filter
- "+ New Note" calls `notesService.create` and adds the note to the grid
- `notesService` is mocked; strict call verification

### `frontend/test-utils/factories.ts` (modify)
- Add `mockNote()` factory per ticket:
  ```typescript
  export const mockNote = (overrides?: Partial<Note>): Note => ({
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    body: faker.lorem.paragraphs(),
    category: faker.helpers.arrayElement(['random_thoughts', 'school', 'personal']),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  });
  ```

### `frontend/public/images/` (add assets)
- Export the empty state illustration from Figma at 2x as PNG into `public/images/`.
- Subagent should use `get_design_context` or `download_assets` for the empty state illustration node within `12-486`.

## Order of execution
1. **Fix types** -- change `Note.id` from `number` to `string` in `types/index.ts`.
2. **Figma extraction** -- call `get_design_context` for node `12-486` (file `imfHHa4B6WNdMXqhJh0pat`) to extract all visual values: sidebar width/padding/typography, note card dimensions/colors/border-radius, category background colors, grid gap, empty state illustration, "+ New Note" button styling. Export empty state illustration at 2x into `public/images/`.
3. **Design tokens** -- add category background color tokens to `tailwind.config.ts`.
4. **Utility modules** -- create `lib/categoryColors.ts` and `lib/relativeDate.ts` + tests.
5. **Notes service** -- create `services/notes.ts` + `services/notes.test.ts`.
6. **useNotes hook** -- create `hooks/useNotes.ts` + `hooks/useNotes.test.ts`.
7. **Test factory** -- add `mockNote()` to `test-utils/factories.ts`.
8. **Leaf components** -- `CategoryItem`, `NoteCard`, `EmptyState`, `NewNoteButton` (+ tests for each), all using extracted Figma values and Tailwind tokens.
9. **Composite components** -- `CategorySidebar` (+ test), `NoteGrid` (+ test).
10. **Page** -- `app/notes/page.tsx` + `app/notes/page.test.tsx`.
11. **Full verification** -- run the entire lint/format/type/test suite; verify 100% coverage on all new code.
12. **Playwright E2E validation** -- with Docker Compose running (`docker compose up`), use Playwright MCP to visually and functionally verify the `/notes` screen against Figma. Walk through every behavior listed below.

## Verification
- [ ] `npm run test` passes with no failures
- [ ] Vitest coverage is **100%** (lines, branches, functions, statements) on all new components, hooks, services, and utilities
- [ ] `npm run lint` passes (no `any`, no unused vars)
- [ ] `npx prettier --check .` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `/notes` renders the full main screen pixel-perfect against Figma node `12-486`
- [ ] `/notes` redirects to `/login` when unauthenticated
- [ ] Category sidebar filters the note grid correctly
- [ ] "All Categories" clears the filter and shows all notes
- [ ] Note counts in sidebar are correct per category
- [ ] Note card relative dates are correct ("today", "yesterday", absolute for older)
- [ ] Note card background colors match per category from Figma
- [ ] Empty state renders when a category has no notes (illustration + message text)
- [ ] "+ New Note" creates a note via `notesService.create` and optimistically adds it to the grid
- [ ] All Figma color values extracted and applied via Tailwind tokens -- no hardcoded hex in components
- [ ] Category color tokens live in `tailwind.config.ts`, not inline
- [ ] `notesService` is mocked in all component/page tests -- no real API calls; strict call verification
- [ ] `mockNote()` factory uses faker for randomized test data
- [ ] Empty state illustration exported from Figma at 2x and renders correctly from `public/images/`
- [ ] No hardcoded colors, spacing, typography, or secrets

### Playwright E2E validation (via Playwright MCP, with Docker Compose running)
- [ ] Navigate to `/notes` while unauthenticated -- verify redirect to `/login`
- [ ] Register or log in via `/login`, then confirm redirect lands on `/notes`
- [ ] `/notes` renders the sidebar with "All Categories" and each category row with correct note counts
- [ ] Take a screenshot of `/notes` and visually compare against Figma node `12-486` -- sidebar width, grid layout, card colors, typography, and spacing must match
- [ ] Click a category in the sidebar -- verify the grid filters to show only notes of that category
- [ ] Click "All Categories" -- verify the grid shows all notes again
- [ ] Click "+ New Note" -- verify a new card appears in the grid without a page reload (optimistic update)
- [ ] With no notes in a category (or for a new user), verify the empty state illustration and message `"I'm just here waiting for your charming notes..."` are visible
- [ ] Verify note card header lines show correct relative dates ("today" for new notes, proper format for older ones)
- [ ] Verify note card background colors differ per category and match Figma

## Out of scope
- Note editor / detail view (FRONTEND-003) -- the "+ New Note" button creates a note but does not open an editor
- Note deletion or soft-delete UI
- Search / full-text search
- Pagination or infinite scroll on the note grid
- Backend changes -- all notes endpoints are merged (Issue #16)
- Responsive / mobile layout (desktop-first per Figma frame 1280x832)
- Drag-and-drop reordering
- Creating new categories or editing category names
- Refresh-token rotation or persistent auth across page refresh
