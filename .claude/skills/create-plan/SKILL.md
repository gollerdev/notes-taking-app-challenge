---
description: Creates an implementation plan file from a GitHub issue. Use when the user provides a GitHub issue URL or number and asks to plan, create a plan, or start a ticket.
---

## Usage
```
/create-plan <github-issue-url-or-number>
```

Examples:
- `/create-plan https://github.com/gollerdev/notes-taking-app-challenge/issues/3`
- `/create-plan 3`

## Instructions

You are the **plan author**. Do not execute the plan — only write it.

Follow these steps exactly:

1. **Parse the input** to extract the issue number and repo:
   - If a full GitHub URL is given: extract `owner/repo` and the issue number from the URL path
   - If only a number is given: use the default repo `gollerdev/notes-taking-app-challenge`

2. **Fetch the ticket** by running:
   ```
   gh issue view <number> --repo <owner>/<repo> --json number,title,body,labels,milestone,assignees
   ```
   Read the full title and body carefully — these are the authoritative source of requirements for this plan.

3. **Load project conventions** by reading all three CLAUDE.md files that exist:
   - `CLAUDE.md` — project-wide: branching, commits, agentic workflow, Figma rules, sources of truth
   - `backend/CLAUDE.md` — Django conventions: uv, DRF, pytest, ruff, PostgreSQL
   - `frontend/CLAUDE.md` — Next.js conventions: App Router, Tailwind only, Figma-first, vitest, localStorage token storage

4. **Read an existing plan** to internalize the exact format and section structure. Run `ls docs/plans/*.md 2>/dev/null | head -1` to find the most recent one, then read it. Skip this step if no plan files exist yet.

5. **Derive the plan file path**:
   - Slug = lowercase title with spaces replaced by hyphens, truncated to ~40 chars
   - Path = `docs/plans/<issue-number>-<slug>.md`
   - Example: issue #3 "User authentication flow" → `docs/plans/3-user-authentication-flow.md`

6. **Write the plan file** using the structure below. Every decision in the plan must be grounded in the ticket body and the CLAUDE.md conventions — never invent requirements, never add scope the ticket doesn't mention.

7. **Print a one-line confirmation**: `Plan written to docs/plans/<filename>.md`

---

## Plan file structure

```markdown
# Plan: <ticket title> (Issue #<n>)

## Context
<2–4 sentences: what problem this ticket solves, why it matters now, and any constraints
 from the ticket body. Reference the issue number.>

## Sources of truth to consult
<List only the sources relevant to this ticket. Options:>
- Product video (behavior, flows, edge cases)
- Figma design file — node URL(s) for affected components
- Figma prototype — navigation flow

## What already exists (skip these)
<Files or structures already in the repo that this ticket builds on. Omit section if nothing pre-exists.>

## Files to create / modify
<One H3 per file or logical group. For each:>
### <path/to/file>
- What to put in it (content, not implementation — leave implementation choices to the subagent)
- Reference CLAUDE.md constraints where relevant (e.g. "use uv run pytest", "Tailwind only")
- For API endpoints: list method, path, request shape, response shape
- For UI components: list props, states, Figma node to fetch before implementing
- For models: list fields, types, constraints, relationships

## Order of execution
<Numbered list — backend before frontend, models before views, migrations before endpoints.>

## Verification
<Bulleted list of concrete, binary acceptance criteria the subagent can check:>
- [ ] `uv run pytest` passes with no failures (if backend touched)
- [ ] `uv run ruff check .` passes with no errors (if backend touched)
- [ ] `npm run test` passes with no failures (if frontend touched)
- [ ] Specific behavioral checks drawn from the ticket body
- [ ] No hardcoded secrets, colors, or spacing values

## Out of scope
<Explicit list of things the ticket does NOT include, to prevent scope creep.>
```

---

## Rules
- Never add features, endpoints, or files the ticket does not mention
- Always pull visual values (colors, spacing, typography) from Figma via `get_design_context` — note this in the relevant file section so the subagent knows to do it
- Backend work must reference `uv`, `pytest`, `ruff`, and PostgreSQL — never pip, unittest, or SQLite
- Frontend work must reference Tailwind and vitest — never CSS modules or Jest
- If the ticket is ambiguous, note the ambiguity in the Context section and state the assumption made
- Do not create the branch or write any code — only write the plan file
