# Plan: Project scaffold and documentation (Issue #1)

## Context
The repo is nearly empty — only `README.md`, `.claude/settings.local.json`, and `.claude/skills/execute-plan/SKILL.md` exist. This plan initializes the full scaffold: CLAUDE.md hierarchy, docs structure, agentic workflow files, and placeholder directories. No application code is created.

## What already exists (skip these)
- `README.md` — leave untouched, filled in at end of project

## Files to create

### 1. `.gitignore`
Cover: Python (`__pycache__`, `*.pyc`, `.venv`, `dist/`), Node (`node_modules/`, `.next/`, `dist/`), environment files (`.env`, `.env.*`, `!.env.example`), Docker (`.docker/`), IDE (`.vscode/`, `.idea/`), and explicitly `.claude/settings.local.json`.

### 2. `/CLAUDE.md`
Include these sections:
- **Project**: Notes-taking app challenge — Django REST + Next.js 14. 7-day build.
- **Tech stack**: Backend: uv, Django, DRF, simplejwt, PostgreSQL, pytest, ruff. Frontend: Next.js 14 App Router, Tailwind, vitest. Infra: Docker Compose.
- **Repo structure**: Include:
  ```
  /
  ├── backend/          # Django project
  ├── frontend/         # Next.js project
  ├── docs/
  │   ├── plans/        # Plan files — one per ticket, input to /execute-plan
  │   ├── ralph-loops/  # Loop logs — one per ticket, written after execution
  │   └── adr/          # Architectural decision records (2–3 max)
  ├── .claude/
  │   ├── skills/       # Custom Claude Code skills
  │   └── hooks/        # Claude Code hooks
  └── CLAUDE.md
  ```
  Note: Tickets live in GitHub Issues at `gollerdev/notes-taking-app-challenge` — fetched via `gh issue view <number>`. No local ticket files needed.
- **Branching**: `main` + feature branches (`feat/<issue-number>-<slug>`). One branch → one PR → `Closes #N`.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`).
- **Tickets**: Live in GitHub Issues. Fetched on demand via `gh issue view <number>`. Issue number is the canonical reference everywhere.
- **Agentic workflow**: Ralph Loop via `/execute-plan <plan-file>`. Plan files in `docs/plans/`. Loop logs in `docs/ralph-loops/`.
- **Figma MCP rules**: Always call `get_design_context` before implementing any UI. Never hardcode colors, spacing, or typography — fetch from Figma node first.
- **Sources of truth hierarchy**:
  1. Product video — behavioral (interactions, flows, edge cases)
  2. Figma design file — visual (colors, spacing, typography)
  3. Figma prototype — navigation and transitions
  - Conflict rule: Figma wins on visual, video wins on behavioral. Decision documented in the ticket.
- **CLAUDE.md hierarchy**: Root = project-wide. `backend/CLAUDE.md` = Django rules. `frontend/CLAUDE.md` = Next.js rules.

### 3. `/backend/CLAUDE.md`
Include:
- **Package manager**: uv. Use `uv add` not `pip install`. Use `uv run` to execute commands.
- **Django conventions**: Apps live in `backend/apps/`. Settings split: `settings/base.py`, `settings/local.py`, `settings/production.py`.
- **API**: Django REST Framework. JWT auth via `djangorestframework-simplejwt`. All endpoints under `/api/v1/`.
- **Database**: PostgreSQL. Never use SQLite in any environment.
- **Test runner**: pytest + pytest-django. Run with `uv run pytest`. All tests in `tests/` per app.
- **Linter**: ruff. Run with `uv run ruff check . --fix`. Must pass before DONE.
- **Environment**: python-decouple for env vars. Never hardcode secrets.

### 4. `/frontend/CLAUDE.md`
Include:
- **Framework**: Next.js 14 App Router. All routes in `app/`. No `pages/` directory.
- **Styling**: Tailwind CSS only. No inline styles, no CSS modules unless Tailwind cannot express it.
- **Figma-first rule**: Before implementing any component, fetch its Figma node with `get_design_context`. Use returned values for colors, spacing, and typography. Never guess visual values.
- **Test runner**: vitest. Run with `npm run test`. Tests co-located with components (`Component.test.tsx`).
- **State**: No global state library for this app — React state + fetch is sufficient.
- **Auth**: JWT stored in httpOnly cookies. Never localStorage.

### 5. `docs/requirements.md`
Include:
- Links to all three sources of truth (video, Figma design, Figma prototype)
- Feature extraction from the video:
  - Auth: Register ("Yay, New Friend!") and Login ("Yay, You're Back!") with email + password
  - Main view: Left sidebar with category list + note counts. 3-column note grid.
  - Empty state: "I'm just here waiting for your charming notes..." with illustration
  - Note editor: Full-screen overlay, editable title + body, category dropdown, "Last Edited" timestamp. Background color matches category.
  - Category filter: Clicking sidebar category filters the grid
  - Auto-save: No explicit save button — changes persist automatically
  - Relative dates: "today", "yesterday", then absolute dates
- Data model:
  - `Note`: id, title, body, category (enum), user FK, created_at, updated_at
  - Category enum (Django TextChoices): Random Thoughts, School, Personal
  - Category color mapping lives in frontend only
- Conflict resolution rule (same as CLAUDE.md)

### 6. `docs/figma-mcp-setup.md`
Include:
- How to get a Figma personal access token (Settings → Security → Personal access tokens)
- How the Figma MCP is configured (desktop app plugin)
- How to duplicate the original Figma file to gain editor access (required for editor-level MCP access)
- How to use `get_design_context` in Claude Code: pass `fileKey` and `nodeId` from the URL

### 7. `docs/github-mcp-setup.md`
Include:
- Install `gh` CLI: `winget install GitHub.cli` (Windows)
- Authenticate: `gh auth login`
- List issues: `gh issue list --repo <owner>/<repo>`
- View issue: `gh issue view <number>`
- How Claude Code uses it: reference `#<number>` in commits and PRs

### 8. `docs/ai-workflow.md`
Include these H2 sections:
- **Overview**: Agentic workflow using Claude Code, Figma MCP, and GitHub Issues as ticket source of truth.
- **Tools Used**:
  - Claude Code (Claude Sonnet 4.6)
  - Figma MCP (desktop app)
  - GitHub CLI (`gh`)
- **Ralph Loop process**: Plan file → `/execute-plan <plan-file>` → verify → log in `docs/ralph-loops/` → PR
- **Per-ticket log**: (empty — entries added per ticket as work progresses)

### 9. `docs/plans/.gitkeep`, `docs/adr/.gitkeep`, `docs/ralph-loops/.gitkeep`
Empty files to make Git track these directories.

### 10. `.claude/skills/create-react-component/SKILL.md`
YAML frontmatter:
```
description: Creates a React component from a Figma node. Use when the user asks to create, build, or implement a UI component or screen.
```
Body:
- Step 1: Ask for or extract the Figma node URL for this component
- Step 2: Call `get_design_context` with the fileKey and nodeId from the URL
- Step 3: Implement the component using only values from the design context (colors, spacing, font sizes, border radius). Never hardcode visual values.
- Step 4: Use Tailwind classes that match the design token values
- Step 5: Write a co-located `.test.tsx` file with at minimum a render smoke test
- Rules: No inline styles. No guessed values. Tailwind only.

### 11. `.claude/hooks/ruff-fix.sh`
Trigger: `PostToolUse` — Edit/Write on any `.py` file.

Hooks receive tool context as JSON via stdin. Use `python` (not `python3` — Git Bash on Windows only has `python` in PATH) to parse stdin and extract `.tool_input.file_path`. Skip if the file does not end in `.py`. Run `uv run ruff check --fix "$FILE"`. Exit 0 always — PostToolUse hooks cannot block.

```bash
#!/usr/bin/env bash
INPUT=$(cat)
FILE=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")
[[ -z "$FILE" || "$FILE" != *.py ]] && exit 0
uv run ruff check --fix "$FILE" 2>/dev/null
exit 0
```

### 12. `.claude/hooks/dangerous-bash.sh`
Trigger: `PreToolUse` — Bash.

Parse stdin with `python`, extract `.tool_input.command`. If the command matches any blocked pattern, print the reason to stderr and **exit 2** — per Claude Code docs, exit 2 is the blocking exit code for hooks. Exit 0 otherwise.

Blocked patterns: `rm -rf`, `git push --force`, `git push -f`, `git reset --hard`, `DROP TABLE`, `--no-verify`.

```bash
#!/usr/bin/env bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null || echo "")
BLOCKED_PATTERNS=("rm -rf" "git push --force" "git push -f" "git reset --hard" "DROP TABLE" "--no-verify")
for PATTERN in "${BLOCKED_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qF "$PATTERN"; then
    echo "dangerous-bash: blocked dangerous command matching '$PATTERN'" >&2
    exit 2
  fi
done
exit 0
```

### 13. `.claude/hooks/secret-guard.sh`
Trigger: `PreToolUse` — Write and Edit.

Parse stdin with `python`. Content field differs by tool: Write uses `.tool_input.content`, Edit uses `.tool_input.new_string` — extract both via a single Python call with `.get()` fallback. Scan content with `grep -E` using POSIX character classes (`[[:space:]]`) — avoid `\s` and `\x27` which may not be supported on all platforms. On match, print to stderr and **exit 2** to block.

```bash
#!/usr/bin/env bash
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | python -c "
import sys, json
d = json.load(sys.stdin)
ti = d.get('tool_input', {})
print(ti.get('content', ti.get('new_string', '')))
" 2>/dev/null || echo "")
FILE=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")
PATTERNS=(
  'SECRET_KEY[[:space:]]*=[[:space:]]*["'"'"']'
  'PASSWORD[[:space:]]*=[[:space:]]*["'"'"']'
  'API_KEY[[:space:]]*=[[:space:]]*["'"'"']'
)
for PATTERN in "${PATTERNS[@]}"; do
  if echo "$CONTENT" | grep -qE "$PATTERN" 2>/dev/null; then
    echo "secret-guard: hardcoded secret detected in $FILE -- use python-decouple instead" >&2
    exit 2
  fi
done
exit 0
```

### 14. `.claude/hooks/migration-reminder.sh`
Trigger: `PostToolUse` — Edit/Write.

Parse stdin with `python`, extract `.tool_input.file_path`. If the path ends in `models.py`, print the reminder to stderr. Exit 0 always — PostToolUse hooks cannot block.

```bash
#!/usr/bin/env bash
INPUT=$(cat)
FILE=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")
if echo "$FILE" | grep -q "models\.py$"; then
  echo "warning: models.py changed -- run: uv run python manage.py makemigrations" >&2
fi
exit 0
```

### 15. `.claude/hooks/block-env-read.sh`
Trigger: `PreToolUse` — Read and Bash.

Parse stdin with `python`. Extract `.tool_name` to branch:
- For `Read`: extract `.tool_input.file_path`, get basename, block if it is `.env` or `.env.*` but NOT `.env.example`.
- For `Bash`: extract `.tool_input.command`, block if it matches `cat .env` patterns.

Print reason to stderr and **exit 2** to block. Exit 0 otherwise.

```bash
#!/usr/bin/env bash
INPUT=$(cat)
TOOL=$(echo "$INPUT" | python -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")
if [[ "$TOOL" == "Read" ]]; then
  FILE=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")
  BASE=$(basename "$FILE")
  if [[ "$BASE" == ".env" ]] || [[ "$BASE" == .env.* && "$BASE" != ".env.example" ]]; then
    echo "block-env-read: reading $FILE is blocked -- check .env.example instead" >&2
    exit 2
  fi
fi
if [[ "$TOOL" == "Bash" ]]; then
  CMD=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null || echo "")
  if echo "$CMD" | grep -qE 'cat[[:space:]]+\.env([[:space:]]|$|\*)'; then
    echo "block-env-read: reading .env via shell is blocked -- check .env.example instead" >&2
    exit 2
  fi
fi
exit 0
```

### 16. `.claude/settings.json`
Register all five hooks. Use project-level `settings.json` (committed to the repo, applies to all contributors):
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Read",
        "hooks": [{"type": "command", "command": "bash .claude/hooks/block-env-read.sh"}]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {"type": "command", "command": "bash .claude/hooks/dangerous-bash.sh"},
          {"type": "command", "command": "bash .claude/hooks/block-env-read.sh"}
        ]
      },
      {
        "matcher": "Write",
        "hooks": [{"type": "command", "command": "bash .claude/hooks/secret-guard.sh"}]
      },
      {
        "matcher": "Edit",
        "hooks": [{"type": "command", "command": "bash .claude/hooks/secret-guard.sh"}]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {"type": "command", "command": "bash .claude/hooks/ruff-fix.sh"},
          {"type": "command", "command": "bash .claude/hooks/migration-reminder.sh"}
        ]
      },
      {
        "matcher": "Edit",
        "hooks": [
          {"type": "command", "command": "bash .claude/hooks/ruff-fix.sh"},
          {"type": "command", "command": "bash .claude/hooks/migration-reminder.sh"}
        ]
      }
    ]
  }
}
```

### 17. `backend/.gitkeep`, `frontend/.gitkeep`
Empty files to track the placeholder directories.

## Order of execution
1. `.gitignore`
2. `CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md` (in any order)
3. `docs/requirements.md`
4. `docs/figma-mcp-setup.md`, `docs/github-mcp-setup.md`, `docs/ai-workflow.md`
5. All `.gitkeep` files
6. `.claude/hooks/ruff-fix.sh`, `dangerous-bash.sh`, `secret-guard.sh`, `migration-reminder.sh`, `block-env-read.sh`
7. `.claude/settings.json`

## Verification
After all files are created, verify:
- `git status` shows all expected files as untracked (skills and hooks already in repo are committed, not untracked)
- No files outside the list above were created
- No application code exists in `backend/` or `frontend/`
- All CLAUDE.md files contain all required sections listed above
- All five hook scripts exist under `.claude/hooks/` and are registered in `.claude/settings.json`
- Hook smoke tests (run each inline, check exit code):
  - `echo '{"tool_name":"Write","tool_input":{"file_path":"t.py","content":"SECRET_KEY = \"x\""}}' | bash .claude/hooks/secret-guard.sh` → exits 2
  - `echo '{"tool_name":"Read","tool_input":{"file_path":".env"}}' | bash .claude/hooks/block-env-read.sh` → exits 2
  - `echo '{"tool_name":"Read","tool_input":{"file_path":".env.example"}}' | bash .claude/hooks/block-env-read.sh` → exits 0
  - `echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' | bash .claude/hooks/dangerous-bash.sh` → exits 2
- Output: `DONE`

## Out of scope
- Any application code
- Docker, docker-compose files
- Django or Next.js initialization
