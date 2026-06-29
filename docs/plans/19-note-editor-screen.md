# Plan: Note Editor Screen (Issue #19)

## Context
This ticket implements the note editor — a full-screen page at `/notes/[id]` that opens when a user clicks an existing note card or creates a new note via the "+ New Note" button. The editor handles both creation and editing via autosave (debounced PATCH calls). It also updates the `NewNoteButton` behavior from Issue #17: instead of optimistically adding to the grid, the button now creates a note and navigates to the editor. Pixel-perfect implementation against Figma is required. This ticket depends on #17 (notes main screen), which is merged.

**Ambiguity / decisions noted:**
- **`/notes/new` route behavior.** The ticket says `/notes/new` "creates a blank note, redirects to `/notes/[id]`." This means `/notes/new` is a transient page — it calls POST, gets the new note's ID, and immediately redirects. It does not render an editor.
- **Category dropdown node IDs.** The ticket lists open/closed states for the category dropdown. The subagent must extract both states from Figma and implement a controlled dropdown with toggle behavior.
- **Autosave sends only changed fields.** The ticket's autosave pseudocode shows `save(patch: Partial<Note>)` — each keystroke saves only the changed field (title OR body), not all fields. Category changes also save individually.

## Sources of truth to consult
- **Figma design file** — File ID `imfHHa4B6WNdMXqhJh0pat`. The subagent **must** call `get_design_context` for the note editor screen node(s) before writing any component code. Extract: background colors per category, header layout (category dropdown, X button, "Last Edited" timestamp), title input typography, body textarea typography, all spacing/padding, and dropdown open/closed states.
- **Figma prototype** — for editor open/close transitions and navigation flow.
- **Product video** — for behavioral details on autosave timing, category switching UX, and close button behavior.

## What already exists (skip / build on these)
- **`lib/api.ts`** — `api.get/post/patch/delete<T>()` with in-memory Bearer token. `api.patch` already exists and is ready to use.
- **`services/notes.ts`** — `notesService.getAll()` and `notesService.create()`. Does NOT have `patch` or `getById` yet — must be added.
- **`hooks/useNotes.ts`** — Fetches all notes on mount. Not directly needed for the editor, but remains used by the notes page.
- **`types/index.ts`** — `Note` (id: string, title, body, category, created_at, updated_at), `CreateNotePayload`. Already correct.
- **`lib/categoryColors.ts`** — `CATEGORY_COLORS`, `CATEGORY_BORDER_COLORS`, `CATEGORY_DOT_COLORS`, `CATEGORY_LABELS`, `CATEGORY_KEYS`. Ready to use for the editor background and dropdown dot colors.
- **`components/notes/NewNoteButton.tsx`** — Currently accepts `onClick: () => void`. Must be updated to handle create + navigate internally.
- **`app/notes/page.tsx`** — Notes main screen. `handleNewNote` must be updated to navigate to the editor instead of optimistic grid update. `NoteCard` click behavior must also navigate to `/notes/[id]`.
- **`test-utils/factories.ts`** — `mockNote()` factory already exists.
- **`tailwind.config.ts`** — Category color tokens (`note-random`, `note-school`, `note-personal`, `dot-*`, `border-*`) already defined.

## Files to create / modify

### `frontend/services/notes.ts` (modify)
- Add `patch` method: `patch(id: string, payload: Partial<CreateNotePayload>): Promise<Note>` -> `api.patch<Note>(\`/notes/${id}/\`, payload)`
- Add `getById` method: `getById(id: string): Promise<Note>` -> `api.get<Note>(\`/notes/${id}/\`)`

### `frontend/services/notes.test.ts` (modify)
- Add tests for `patch`: calls `api.patch` with `/notes/${id}/` and the payload; strict call verification.
- Add tests for `getById`: calls `api.get` with `/notes/${id}/`; strict call verification.

### `frontend/components/editor/NoteEditor.tsx` (create) — `"use client"`
- Root editor component. Owns autosave logic via `useRef` debounce pattern (NOT `useEffect` with dependency array).
- Props: `note: Note`
- State: `title`, `body`, `category`, `lastEdited` (initialized from `note`).
- Autosave delay: 400ms. Each field change calls `save({ fieldName: newValue })` which clears previous timeout, sets a new one, and on fire calls `notesService.patch(note.id, patch)`. On success, updates `lastEdited` from the response's `updated_at`.
- Background color: full-screen, dynamically set from `CATEGORY_COLORS[category]`.
- Renders: `EditorHeader` (top), `TitleInput`, `BodyTextarea`.
- All visual values from Figma — no hardcoded guesses.

### `frontend/components/editor/NoteEditor.test.tsx` (create)
- Renders TitleInput, BodyTextarea, EditorHeader.
- Changing title triggers `notesService.patch` after debounce delay with only the title field.
- Changing body triggers `notesService.patch` after debounce delay with only the body field.
- Changing category triggers `notesService.patch` and updates background color immediately.
- `notesService` is mocked in all tests.

### `frontend/components/editor/EditorHeader.tsx` (create) — `"use client"`
- Props: `category: string`, `lastEdited: string`, `onCategoryChange: (category: string) => void`, `onClose: () => void`
- Renders: `CategoryDropdown` (left), `LastEditedStamp` (right area or per Figma), X close button (top-right).
- X button: calls `onClose` which navigates to `/notes`.
- All positions/sizes from Figma.

### `frontend/components/editor/EditorHeader.test.tsx` (create)
- Renders category dropdown, X button, and "Last Edited" timestamp.
- X button calls `onClose`.
- "Last Edited" displays the correct absolute format.

### `frontend/components/editor/CategoryDropdown.tsx` (create) — `"use client"`
- Props: `value: string`, `onChange: (category: string) => void`
- Renders colored dot + category label for the current value.
- On click: toggles open state showing all three category options.
- Selecting an option calls `onChange(newCategory)` and closes the dropdown.
- Dot colors from `CATEGORY_DOT_COLORS`; labels from `CATEGORY_LABELS`; keys from `CATEGORY_KEYS`.
- Open/closed styling from Figma.

### `frontend/components/editor/CategoryDropdown.test.tsx` (create)
- Renders colored dot and category label for the current value.
- Clicking toggles open state showing all three category options.
- Selecting a new category calls `onChange` with the correct value.
- Dropdown closes after selection.

### `frontend/components/editor/TitleInput.tsx` (create) — `"use client"`
- Props: `value: string`, `onChange: (value: string) => void`
- Styled as a large h1-style plain text input per Figma.
- Placeholder: "Note Title".
- No visible border or background — transparent input.
- Font size, weight, color from Figma.

### `frontend/components/editor/TitleInput.test.tsx` (create)
- Renders with correct placeholder text "Note Title".
- Calls `onChange` on every keystroke.

### `frontend/components/editor/BodyTextarea.tsx` (create) — `"use client"`
- Props: `value: string`, `onChange: (value: string) => void`
- Plain text textarea — no markdown, no formatting toolbar.
- Placeholder: "Pour your heart out..."
- No visible border or background — transparent textarea.
- Font size, weight, color from Figma.
- Should expand to fill available vertical space.

### `frontend/components/editor/BodyTextarea.test.tsx` (create)
- Renders with correct placeholder text "Pour your heart out..."
- Calls `onChange` on every keystroke.

### `frontend/components/editor/LastEditedStamp.tsx` (create) — `"use client"`
- Props: `updatedAt: string`
- Formats ISO string as absolute: "July 21, 2024 at 8:39pm" (month name, day, year, "at", time with am/pm lowercase, no leading zero on hour).
- Typography from Figma.

### `frontend/components/editor/LastEditedStamp.test.tsx` (create)
- Formats `updated_at` ISO string as "July 21, 2024 at 8:39pm".
- Updates when `updatedAt` prop changes.

### `frontend/app/notes/[id]/page.tsx` (create) — `"use client"`
- Editor shell page. Protected route — redirects to `/login` if `!isAuthenticated`.
- Fetches the note via `notesService.getById(id)` on mount using the route param.
- Renders `NoteEditor` once the note is loaded.
- Passes `onClose` handler that calls `router.push("/notes")`.
- Shows loading state while fetching.

### `frontend/app/notes/[id]/page.test.tsx` (create)
- `/notes/[id]` renders the editor pre-filled with the note's content.
- `/notes/[id]` redirects to `/login` when unauthenticated.
- `notesService.getById` is called with the correct id. Mocked.

### `frontend/app/notes/new/page.tsx` (create) — `"use client"`
- Transient page: on mount, calls `notesService.create({ title: "", body: "", category: "personal" })`.
- On success: `router.replace(\`/notes/${newNote.id}\`)` (replace, not push, so back button goes to `/notes` not `/notes/new`).
- Protected route — redirects to `/login` if `!isAuthenticated`.
- Shows loading state ("Creating note...") while the POST is in flight.

### `frontend/app/notes/new/page.test.tsx` (create)
- Calls `notesService.create` with default values on mount.
- Redirects to `/notes/[id]` on success using `router.replace`.
- Redirects to `/login` when unauthenticated.

### `frontend/components/notes/NewNoteButton.tsx` (modify)
- **Remove** the `onClick` prop.
- Internalize the behavior: on click, call `notesService.create({ title: "", body: "", category: "personal" })`, then `router.push(\`/notes/${newNote.id}\`)`.
- **OR** (simpler, per the `/notes/new` route): just navigate to `/notes/new` on click, letting that page handle the POST and redirect. This avoids duplicating API logic. **Decision: use `router.push("/notes/new")`** — the `/notes/new` page handles creation and redirect.

### `frontend/components/notes/NewNoteButton.test.tsx` (modify)
- Update tests: clicking the button navigates to `/notes/new`.
- Remove tests for `onClick` prop and optimistic grid update.

### `frontend/app/notes/page.tsx` (modify)
- Remove `handleNewNote` function and `createError` state — NewNoteButton now handles its own navigation.
- Update `NewNoteButton` usage: remove `onClick` prop.
- Update `NoteCard` usage in `NoteGrid`: clicking a note card navigates to `/notes/[id]`. This may require passing an `onNoteClick` handler or making `NoteCard` handle navigation internally.

### `frontend/app/notes/page.test.tsx` (modify)
- Update tests to reflect that `NewNoteButton` no longer calls `notesService.create` from the page.
- Remove tests for optimistic grid update.
- Add/update tests for note card click navigating to `/notes/[id]`.

### `frontend/components/notes/NoteCard.tsx` (modify)
- Make the card clickable: wrap in a link or add an `onClick` handler that navigates to `/notes/[id]`.
- Add `cursor-pointer` styling.

### `frontend/components/notes/NoteCard.test.tsx` (modify)
- Add test: clicking the card navigates to `/notes/[note.id]`.

## Order of execution
1. **Figma extraction** — call `get_design_context` for the note editor screen node(s) in file `imfHHa4B6WNdMXqhJh0pat` to extract all visual values: full-screen background per category, header layout, category dropdown (open/closed), X button, "Last Edited" typography, title input typography, body textarea typography, all spacing/padding.
2. **Service layer** — add `patch` and `getById` to `services/notes.ts` + update tests.
3. **Leaf editor components** — `TitleInput`, `BodyTextarea`, `LastEditedStamp`, `CategoryDropdown` (+ tests for each), all using extracted Figma values and Tailwind tokens.
4. **Composite editor components** — `EditorHeader` (+ test), `NoteEditor` (+ test, with autosave logic).
5. **Editor pages** — `app/notes/[id]/page.tsx` (+ test), `app/notes/new/page.tsx` (+ test).
6. **Update existing components** — `NewNoteButton` (remove `onClick`, navigate to `/notes/new`), `NoteCard` (make clickable, navigate to `/notes/[id]`), update their tests.
7. **Update notes page** — `app/notes/page.tsx` (remove `handleNewNote`, update `NewNoteButton` usage), update page tests.
8. **Full verification** — run the entire lint/format/type/test suite; verify 100% coverage on all new and modified code.
9. **Playwright E2E validation** — with Docker Compose running, use Playwright MCP to visually and functionally verify the editor screen against Figma and test all behaviors.

## Verification
- [ ] `npm run test` passes with no failures
- [ ] Vitest coverage is **100%** (lines, branches, functions, statements) on all new and modified components, hooks, services, and pages
- [ ] `npm run lint` passes (no `any`, no unused vars)
- [ ] `npx prettier --check .` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `/notes/new` creates a blank note via POST and redirects to `/notes/[id]`
- [ ] `/notes/[id]` opens pre-filled for existing notes (title, body, category)
- [ ] `/notes/[id]` redirects to `/login` when unauthenticated
- [ ] Autosave fires on every keystroke debounced at 400ms
- [ ] Autosave sends only the changed field (not all fields)
- [ ] "Last Edited" timestamp updates on every successful autosave response
- [ ] "Last Edited" format is "July 21, 2024 at 8:39pm" (absolute, lowercase am/pm)
- [ ] Category change updates background color immediately and autosaves
- [ ] Category dropdown renders colored dot + label, toggles open/closed, shows all three options
- [ ] X button navigates back to `/notes`
- [ ] NewNoteButton navigates to `/notes/new` instead of optimistic grid update
- [ ] Clicking a NoteCard on the main screen navigates to `/notes/[id]`
- [ ] Full-screen background color per category matches Figma exactly
- [ ] All Figma values extracted and applied via Tailwind tokens — no hardcoded hex in components
- [ ] `notesService` is mocked in all component/page tests — no real API calls; strict call verification
- [ ] No hardcoded colors, spacing, typography, or secrets

### Playwright E2E validation (via Playwright MCP, with Docker Compose running)
- [ ] Navigate to `/notes/[id]` while unauthenticated — verify redirect to `/login`
- [ ] Log in, then click an existing note card on `/notes` — verify navigation to `/notes/[id]` and editor opens pre-filled
- [ ] Click "+ New Note" on `/notes` — verify navigation to `/notes/new`, then redirect to `/notes/[id]` with blank editor
- [ ] Type in the title field — verify autosave fires (check network or "Last Edited" timestamp update)
- [ ] Type in the body field — verify autosave fires
- [ ] Change category via dropdown — verify background color updates immediately and autosave fires
- [ ] Click X button — verify navigation back to `/notes`
- [ ] Take a screenshot of the editor and visually compare against Figma — background, header, title, body, spacing must match
- [ ] Verify "Last Edited" shows correct absolute date format
- [ ] Verify category dropdown open state matches Figma (colored dots, labels, styling)

## Out of scope
- Note deletion or soft-delete UI
- Rich text / markdown / formatting toolbar — plain text only
- Search / full-text search
- Backend changes — all notes endpoints are merged (Issue #16)
- Responsive / mobile layout (desktop-first per Figma)
- Creating new categories or editing category names
- Refresh-token rotation or persistent auth across page refresh
- Undo/redo functionality
- Offline autosave or conflict resolution
- Confirmation dialog on close (autosave makes this unnecessary per ticket)
