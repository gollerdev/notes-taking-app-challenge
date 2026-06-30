# Plan: fix(frontend): move Last Edited stamp inside the note card to match Figma (Issue #26)

## Context
The note editor screen does not match the Figma design (node `2:8568`). The "Last Edited" timestamp is currently rendered **outside** the note card in the `EditorHeader` component (alongside the category dropdown and close button), but Figma positions it **inside** the note card at the top-right corner within the bordered/colored area. This is a pixel-perfect layout fix — no new features, no behavior changes. The fix is scoped to moving `LastEditedStamp` from `EditorHeader` into the card `div` inside `NoteEditor`, and updating tests accordingly.

**Pixel-perfect emphasis:** The subagent **must** call `get_design_context` on Figma node `2:8568` (file `imfHHa4B6WNdMXqhJh0pat`) before making any changes, and verify that the resulting layout — including the exact position, alignment, and spacing of the "Last Edited" stamp within the card — matches Figma precisely. After code changes, take a Playwright screenshot and visually compare against the Figma node. No approximations.

## Sources of truth to consult
- **Figma design file** — node `2:8568` in file `imfHHa4B6WNdMXqhJh0pat`. Extract the exact position of "Last Edited" within the card (top-right corner), its spacing from card edges, and typography. Also confirm that the category dropdown and X close button remain in the header area above the card.

## What already exists (skip / build on these)
- **`frontend/components/editor/NoteEditor.tsx`** — Root editor component. Currently renders `EditorHeader` (which contains `LastEditedStamp`) above the card div. The card div contains only `TitleInput` and `BodyTextarea`.
- **`frontend/components/editor/EditorHeader.tsx`** — Currently renders `CategoryDropdown`, `LastEditedStamp`, and the X close button in a flex row. `LastEditedStamp` must be removed from here.
- **`frontend/components/editor/LastEditedStamp.tsx`** — The component itself is unchanged — only its render location moves.
- **`frontend/components/editor/EditorHeader.test.tsx`** — Tests that currently assert `LastEditedStamp` is rendered inside `EditorHeader`.
- **`frontend/components/editor/NoteEditor.test.tsx`** — Tests for the root editor.

## Files to create / modify

### `frontend/components/editor/EditorHeader.tsx` (modify)
- **Remove** the `LastEditedStamp` import and rendering from this component.
- **Remove** the `lastEdited` prop from `EditorHeaderProps`.
- The component should now only render `CategoryDropdown` (left) and the X close button (right).
- Keep the existing flex layout but simplify: no longer needs a `div` wrapper for the right side grouping if only the X button remains. Adjust spacing per Figma.

### `frontend/components/editor/EditorHeader.test.tsx` (modify)
- **Remove** tests that assert `LastEditedStamp` renders inside `EditorHeader`.
- **Remove** the `lastEdited` prop from test renders.
- Keep tests for: category dropdown renders, X button calls `onClose`.

### `frontend/components/editor/NoteEditor.tsx` (modify)
- **Import** `LastEditedStamp` directly (no longer comes through `EditorHeader`).
- **Remove** `lastEdited` from `EditorHeader` props.
- **Move** `<LastEditedStamp updatedAt={lastEdited} />` **inside** the card `div` (the bordered/colored area with `TitleInput` and `BodyTextarea`).
- Position it at the **top-right** of the card. This likely requires making the card div `relative` and positioning `LastEditedStamp` with `absolute top-right` — or using a flex/grid layout with the stamp in a top row. The subagent must extract the exact positioning from Figma node `2:8568`.
- All spacing values (padding from card edges to the stamp) must come from Figma — no guesses.

### `frontend/components/editor/NoteEditor.test.tsx` (modify)
- Update tests to verify that `LastEditedStamp` renders **inside** the card area (i.e., within the `NoteEditor` render output, not via `EditorHeader`).
- Existing autosave tests that check `lastEdited` state updates remain valid — only the render tree structure changes.

## Order of execution
1. **Figma extraction** — call `get_design_context` for node `2:8568` in file `imfHHa4B6WNdMXqhJh0pat`. Extract the exact position of the "Last Edited" stamp within the card (top-right corner), spacing from card edges, and confirm the category dropdown + X button remain above the card. Write down all pixel values before modifying code.
2. **Modify `EditorHeader.tsx`** — remove `LastEditedStamp` and `lastEdited` prop.
3. **Modify `EditorHeader.test.tsx`** — remove `lastEdited` prop and stamp-related assertions.
4. **Modify `NoteEditor.tsx`** — import `LastEditedStamp`, remove `lastEdited` from `EditorHeader` props, render `LastEditedStamp` inside the card div at the top-right per Figma spacing.
5. **Modify `NoteEditor.test.tsx`** — update assertions to verify `LastEditedStamp` renders within the card.
6. **Run full verification** — `npm run test`, `npm run lint`, `npx prettier --check .`, `npx tsc --noEmit`.
7. **Playwright visual verification** — take a screenshot of the editor and compare against Figma node `2:8568`. Verify the stamp is inside the card at the top-right, and that the category dropdown and X button remain in the header area above.

## Verification
- [ ] `npm run test` passes with no failures
- [ ] Vitest coverage remains **100%** on all modified files
- [ ] `npm run lint` passes
- [ ] `npx prettier --check .` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `LastEditedStamp` is rendered **inside** the note card div, top-right aligned
- [ ] `CategoryDropdown` and close button remain in the header area above the card
- [ ] `EditorHeader` no longer renders `LastEditedStamp` or accepts a `lastEdited` prop
- [ ] Visual result matches Figma node `2:8568` — verified with Playwright screenshot (stamp inside card, correct spacing from card edges, correct alignment)
- [ ] No hardcoded colors, spacing, or typography values — all from Figma via Tailwind tokens
- [ ] Autosave behavior unchanged — "Last Edited" still updates on successful save

## Out of scope
- Any behavior changes (autosave, category switching, close button)
- New components or new files
- Backend changes
- Changes to `LastEditedStamp.tsx` itself (the component is unchanged — only its render location moves)
- Changes to `CategoryDropdown.tsx`, `TitleInput.tsx`, or `BodyTextarea.tsx`
- Any other pages or components outside the editor
