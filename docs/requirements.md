# Requirements

## Sources of truth

1. [Product video](https://drive.google.com/file/d/1yexyRO8qCElTYBFR9wrJCfZsqsBcTZgQ/view) — behavior, interactions, flows, edge cases
2. [Figma design file](https://www.figma.com/design/imfHHa4B6WNdMXqhJh0pat/Notes-Taking-App-Challenge) — colors, typography, spacing, component design
3. [Figma prototype](https://www.figma.com/proto/nIqpRyEWKPYqYsW7RMfi3S/Notes-Taking-App-Challenge?node-id=34-889&starting-point-node-id=34%3A889) — navigation flow, transitions, interactive states

**Conflict rule**: Figma wins on visual, video wins on behavioral. Document decisions in the relevant ticket.

---

## Features

### Auth

- Register with email + password — greeting shown: "Yay, New Friend!"
- Login with email + password — greeting shown: "Yay, You're Back!"
- JWT stored in httpOnly cookies (never localStorage)
- Redirect to main view on success

### Main view

- Left sidebar with an "All Categories" heading at the top (no total count shown next to it)
- Below the heading: each category listed with its note count (e.g. `Random Thoughts  3`)
- 3-column note grid showing all notes for the active category
- "+ New Note" button (top-right corner) to create a blank note and open it in the editor

### Note card (grid item)

Each card in the grid displays:
- Header line: `<relative date> · <category>` (e.g. `today · Random Thoughts`)
- Title: large, bold
- Body preview: plain text — truncated if longer than the card height
- Background color: determined by category (values from Figma)

### Empty state

- Shown when the active category has no notes
- Illustrated graphic
- Message: "I'm just here waiting for your charming notes..."

### Note editor

- Opens as a full-screen overlay when a card is clicked or a new note is created
- Background color matches the selected category
- Category dropdown (top-left, shows colored dot + category name) to change the note's category
- ✕ close button (top-right corner) to dismiss the editor
- Editable title (`<h1>`-style input, plain text) — placeholder text "Note Title"
- Editable body — plain text textarea — placeholder text "Pour your heart out..."
- "Last Edited" timestamp shown top-right of the note card (absolute format, e.g. "July 21, 2024 at 8:39pm") — updates on each auto-save
- No explicit save button

### Body text

- The body field stores plain text in the database
- Both the card preview and editor display plain text — no rendering or formatting
- No markdown library needed

### Category filter

- Clicking a sidebar category filters the note grid to show only notes in that category
- Clicking "All Categories" (the heading) clears the filter and shows all notes
- Active category is visually highlighted in the sidebar

### Auto-save

- No explicit save button
- Changes persist automatically — debounced on keystroke (300–500 ms delay)
- "Last Edited" timestamp updates on each save

### Relative dates (note card header only)

- Same calendar day → "today"
- Previous calendar day → "yesterday"
- Older → absolute date (format from Figma)

The "Last Edited" line inside the editor always uses an absolute format including time (e.g. "July 21, 2024 at 8:39pm").

---

## Data model

### Note

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| title | string | Required, non-blank, max 255 chars |
| body | text | Plain text |
| category | enum | See below |
| user | FK → User | Cascade delete |
| created_at | datetime | Set on create |
| updated_at | datetime | Auto-updated on every save |

### Category enum (Django TextChoices)

| Value | Label |
|---|---|
| `random_thoughts` | Random Thoughts |
| `school` | School |
| `personal` | Personal |

### Category color mapping

Lives in the frontend only — never persisted. Maps category value → background color token from Figma.

---

## Open decisions

| # | Question | Default assumption |
|---|---|---|
| 1 | ~~Markdown or plain text body?~~ | **Resolved: plain text only. Markdown enrichment deferred.** |
| 2 | Is there a character limit on the body? | No limit — truncated visually on card only |
| 3 | ~~Can a note have no title?~~ | **Resolved: title is required. Empty string and whitespace-only are invalid. Enforced on both backend (model validation) and frontend (block save if blank).** |
