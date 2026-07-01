# Notes-Taking App Challenge

A full-stack notes app built with **Django REST** (backend) and **Next.js 14** (frontend), architected and implemented end-to-end with an **agentic Claude Code workflow**.

> The headline of this project isn't the app — it's the *process*. Every line of code was produced by a documented, traceable, guardrailed AI pipeline that starts at a GitHub issue and ends at a merged, CI-green PR.

<p align="center">
  <img src="docs/assets/ralph-wiggum.png" alt="Ralph Wiggum" width="220" />
  <br/>
  <em>Meet Ralph. He writes a lot of this codebase. More on him below.</em>
</p>

---

## Table of contents
- [The process](#the-process)
- [Key design & technical decisions](#key-design--technical-decisions)
- [AI tools — what I used and how](#ai-tools--what-i-used-and-how)
  - [Custom skills](#custom-skills)
  - [Custom hooks (the guardrails)](#custom-hooks-the-guardrails)
  - [CI/CD as the final gate](#cicd-as-the-final-gate)
- [The Ralph Loop](#the-ralph-loop)
- [Scope decisions](#scope-decisions)
- [Running the app](#running-the-app)
- [Repo structure](#repo-structure)

---

## The process

The whole project runs on one repeatable loop. It is **AI-heavy, workflow-oriented, and obsessed with documentation and traceability** — every unit of work can be traced from idea to merged code.

```
GitHub Issue  ─►  /create-plan  ─►  human-in-the-loop review  ─►  /execute-plan (Ralph loop)  ─►  PR  ─►  CI + Claude review  ─►  merge
   (#N)            docs/plans/        iterate on the plan          docs/ralph-loops/ log         Closes #N
```

1. **Everything starts as a GitHub issue.** The issue number (`#N`) is the *only* canonical reference — there are no duplicate ticket files in the repo. A branch is created straight from the issue.
2. **Plan.** I run the [`/create-plan`](.claude/skills/create-plan/SKILL.md) skill and Claude writes a structured implementation plan into [`docs/plans/`](docs/plans/), grounded strictly in the ticket body and the `CLAUDE.md` conventions. I then **iterate on the plan with a human-in-the-loop approach** — the plan is cheap to change, the code is not, so this is where the thinking happens.
3. **Execute.** I run [`/execute-plan`](.claude/skills/execute-plan/SKILL.md) to kick off a **Ralph loop** with a chosen min/max iteration count. Each iteration is a fresh-context subagent that reads the real repo state, executes only what the plan describes, runs the tests, and checks every acceptance criterion.
4. **Log.** Every loop writes a run log to [`docs/ralph-loops/`](docs/ralph-loops/) — date, iterations, what was done, deviations, failed ACs, lessons. Full audit trail.
5. **Review & merge.** A PR is opened with `Closes #N`. Claude Code is **installed in the repo itself**, so it runs an automated code review on every PR and can be `@claude`-mentioned to fix bugs or address review comments. For simple issues (e.g. bug fixes), the task was **assigned to Claude directly in the ticket** — no local execution required.
6. **Guardrails everywhere.** Safety hooks, linter hooks, strict always-followed `CLAUDE.md` standards, and a CI/CD pipeline keep the AI on rails and the app in a permanently clean state.

---

## Key design & technical decisions

These are the decisions that shaped the project — both *how it was built* and *what it was built with*.

### Workflow & AI-orchestration decisions

| Decision | Why |
|---|---|
| **Issue-driven, single source of reference** | The GitHub issue number is the canonical ID everywhere — branch, plan, loop log, PR. No ticket files to drift out of sync. |
| **Separate *planning* from *execution*** | Planning is human-in-the-loop and cheap to revise; execution is autonomous. Splitting them means I steer intent up front, then let the agent grind. Plans live in `docs/plans/`, separate from the agents that run them. |
| **Fresh context per iteration (Ralph loop)** | Each execute-plan iteration spawns a *new* subagent with a clean context window. This prevents accumulated bias / context rot — every pass re-reads the actual repo state and the plan, instead of trusting a stale internal narrative. |
| **`CLAUDE.md` as a constitution** | A hierarchical, strict, always-followed rule set (root + `backend/` + `frontend/`) encodes architecture, tooling, naming, and test standards. The agent inherits a senior engineer's standards on every run instead of improvising. |
| **Explicit source-of-truth hierarchy** | Product video wins on *behavior*; Figma wins on *visuals*. Conflicts are resolved by a documented rule, so the agent never has to guess which input is authoritative. |
| **Guardrails as code, not vibes** | Safety + quality are enforced by deterministic hooks and CI gates (below), not by hoping the model behaves. The AI literally *cannot* read a `.env`, write a hardcoded secret, or run `rm -rf`. |
| **Claude installed in the repo** | GitHub Actions run an automated Claude code review on every PR and let me delegate small tickets to `@claude` directly — moving routine work entirely off my local machine. |
| **Full traceability** | `docs/plans/` (intent) + `docs/ralph-loops/` (execution record) + PR (`Closes #N`) means any change can be traced from idea to merge. |

### Architecture & technical decisions

| Decision | Why |
|---|---|
| **Layered backend** (`Filter → View → Serializer → Service → Repository → ORM`) | Strict separation of concerns; View and Service layers are unit-tested with the layer below mocked, while the Repository layer is tested against the real database with randomized factory data. Business logic never leaks into views, ORM queries never leak out of repositories. |
| **Layered frontend** (`Page → Service → lib/api → backend`, with `Context`/`hooks`/`components`) | One responsibility per layer; components never call `fetch` directly. Swapping the transport or auth mechanism touches exactly one file. |
| **100% test coverage gate, both stacks** | CI fails under 100% line coverage (backend `pytest`) and 100% across lines, branches, functions, and statements (frontend `vitest`). Combined with **randomized factory data** (`factory_boy`/`faker`), tests catch bugs fixed fixtures would mask. |
| **`uv`, not pip** · **PostgreSQL, not SQLite** · **`ruff` + `mypy --strict`** | Modern, reproducible, locked dependency graph (`uv.lock`); production-grade DB locally and in CI; lint + format + strict typing enforced before merge. |
| **localStorage JWT storage with in-memory cache** (Issue #11) | Access and refresh tokens are persisted in `localStorage` so sessions survive page reloads. A module-level variable in `lib/api.ts` acts as a fast in-memory cache. On 401, the wrapper attempts a single token refresh; on failure it clears both stores and redirects to `/login`. |
| **Design tokens, never magic values** | All Figma colors / fonts / spacing are centralized as Tailwind tokens; components consume `bg-cream`, `text-heading`, etc. `CLAUDE.md` rules prohibit hardcoded visual values, and ESLint + Prettier hooks keep the frontend clean on every write. |
| **Dockerized everything** | `docker compose up` brings up `db` + `web` + `frontend`. The same base compose stack runs locally and in CI (CI layers a `docker-compose.ci.yml` overlay for test settings) — so "works on my machine" and "works in CI" are the same containers. |
| **OpenAPI schema as a contract** | `drf-spectacular` auto-generates the API schema; CI validates it (`--fail-on-warn`), so the API docs can never silently drift from the code. |

---

## AI tools — what I used and how

### Claude Code
The primary engine. It plans, writes, tests, reviews, and self-corrects — driven by the custom skills and hooks below. It runs **locally** (interactive development) and **in the repo via GitHub Actions** (automated PR review + `@claude` task delegation).

### Playwright MCP
Gives Claude a real browser. During `/execute-plan`, any iteration that touches frontend code **must visually verify the result** — Claude boots the stack with `docker compose up`, navigates the running app, snapshots the DOM, takes screenshots, exercises user flows (forms, navigation, error states), and checks the browser console for JS errors before it's allowed to mark a frontend acceptance criterion as done. Unit tests alone are not accepted as proof.

### Figma MCP
Lets Claude read the design directly so interfaces are **pixel-perfect**. Before implementing any designed UI, Claude calls `get_design_context` and pulls exact colors, typography, spacing, and radii — never guessing or hardcoding visual values. (A nuance worth noting: the Figma MCP needs *edit* access, so the canonical file is a **writable duplicate**, `imfHHa4B6WNdMXqhJh0pat`; the original challenge file is read-only and MCP-inaccessible.)

### Custom skills
Project-specific slash commands in [`.claude/skills/`](.claude/skills/) that codify the workflow:

| Skill | What it does |
|---|---|
| [**`/create-plan`**](.claude/skills/create-plan/SKILL.md) | The **plan author**. Takes a GitHub issue number/URL, fetches the ticket with `gh`, loads all three `CLAUDE.md` files, studies an existing plan for format, and writes a scoped implementation plan to `docs/plans/<n>-<slug>.md`. It deliberately **does not write code** — it only plans, so intent can be reviewed before any execution. |
| [**`/execute-plan`**](.claude/skills/execute-plan/SKILL.md) | The **loop controller** (the Ralph loop). Takes a plan file plus `--min`/`--max` iteration bounds and spawns a fresh subagent per iteration. Each subagent reads the plan + `CLAUDE.md`, executes only in-scope work, runs tests, and outputs `DONE` / `BLOCKED`. When the loop ends it writes a run log to `docs/ralph-loops/`. Includes mandatory Playwright visual verification for frontend work. |
| [**`/create-react-component`**](.claude/skills/create-react-component/SKILL.md) | **Figma-first component generator.** Extracts a Figma node URL, calls `get_design_context`, builds the component using only design-token values (Tailwind only, no inline styles, no guessed values), and writes a co-located `.test.tsx` smoke test. |

### Custom hooks (the guardrails)
Deterministic shell hooks in [`.claude/hooks/`](.claude/hooks/), wired up in [`.claude/settings.json`](.claude/settings.json). They fire on matched tool calls (Read, Bash, Write, Edit, MultiEdit) — this is what keeps an autonomous agent *safe* and the codebase *clean* without me watching every keystroke.

**Safety — `PreToolUse` (can block the action, exit code 2):**

| Hook | Guards against |
|---|---|
| [`block-env-read.sh`](.claude/hooks/block-env-read.sh) | Reading any `.env` file (via the Read tool *or* a shell `cat`/`source`/etc.). `.env.example` is allowed. Secrets never enter the model's context. |
| [`dangerous-bash.sh`](.claude/hooks/dangerous-bash.sh) | Destructive shell commands — `rm -rf`, `git push --force`, `git reset --hard`, `DROP TABLE`, `--no-verify`. The agent simply cannot run them. |
| [`secret-guard.sh`](.claude/hooks/secret-guard.sh) | Writing files that contain hardcoded `SECRET_KEY` / `PASSWORD` / `API_KEY` literals — pushes the agent toward `python-decouple` instead. |

**Quality — `PostToolUse` (runs after a write, keeps the tree clean):**

| Hook | Does |
|---|---|
| [`ruff-fix.sh`](.claude/hooks/ruff-fix.sh) | Runs `ruff check --fix` on every Python file the moment it's written. |
| [`frontend-lint.sh`](.claude/hooks/frontend-lint.sh) | Runs Prettier + ESLint `--fix` on every frontend `.ts/.tsx/.js/.jsx` file the moment it's written. |
| [`migration-reminder.sh`](.claude/hooks/migration-reminder.sh) | Prints a reminder to run `makemigrations` whenever `models.py` changes. |

### CI/CD as the final gate
Three GitHub Actions workflows keep `main` permanently green:
- [`ci.yml`](.github/workflows/ci.yml) — spins up the full Docker stack and runs **every quality gate**: backend ruff + format + `mypy` + `pytest` at **100% coverage** + OpenAPI schema validation, and frontend typecheck + lint + format + `vitest` coverage.
- [`claude-code-review.yml`](.github/workflows/claude-code-review.yml) — an automated Claude code review on every opened/updated PR.
- [`claude.yml`](.github/workflows/claude.yml) — lets me `@claude` in any issue or PR comment to delegate work.

---

## The Ralph Loop

<p align="center">
  <img src="docs/assets/ralph-loop.png" alt="Ralph Wiggum at the wheel" width="240" />
  <br/>
  <em>"I'm a plan execution agent!" — Ralph, probably</em>
</p>

The execution half of the workflow is a **"Ralph loop"**: run the same agent over and over, each time with a *fresh* context window, until the acceptance criteria are met (or a max-iteration cap is hit). The naming is a wink — like Ralph Wiggum, a single iteration is cheerfully simple-minded and forgets everything between runs. But that amnesia is the *feature*: because each pass re-reads the real repo and the plan from scratch, the loop self-corrects instead of compounding its own earlier mistakes. Bounded by `--min`/`--max`, every run is logged in [`docs/ralph-loops/`](docs/ralph-loops/) for a complete execution audit trail.

---

## Scope decisions

The product demo video is the authoritative source for required functionality. Two features that might be expected in a notes app were **intentionally omitted** because they are not shown in the video:

- **Logout** — The video does not demonstrate a logout flow. The backend supports token blacklisting (`POST /api/v1/auth/logout/`) and the frontend has a `logout()` function wired into `AuthContext`, but no UI button was added since the feature is not part of the demonstrated scope.
- **Note deletion** — The video does not show deleting a note. The backend blocks `DELETE` requests on the notes endpoint, and no delete UI exists. Notes can only be created and edited.

With more time beyond the demonstrated requirements, I would add: a logout button in the sidebar, note deletion with a confirmation dialog, and Playwright E2E tests committed as a repeatable test suite (currently used interactively during Ralph loops but not persisted).

---

## Running the app

Everything runs through Docker Compose from the project root:

```bash
cp .env.example .env      # fill in values
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend (Next.js) | http://localhost:3000 |
| Backend API (Django REST) | http://localhost:8000/api/v1/ |
| API docs (Swagger) | http://localhost:8000/api/docs/ |

**Backend:** Python · `uv` · Django · Django REST Framework · `djangorestframework-simplejwt` · PostgreSQL · `pytest` · `ruff` · `mypy` · `python-decouple`
**Frontend:** Next.js 14 App Router · TypeScript (strict, no `any`) · Tailwind CSS · `vitest` · React Testing Library

---

## Repo structure

```
/
├── backend/                # Django project (layered: filter→view→serializer→service→repository→ORM)
├── frontend/               # Next.js 14 project (layered: page→service→lib/api→backend)
├── docs/
│   ├── plans/              # One implementation plan per ticket — input to /execute-plan
│   ├── ralph-loops/        # One run log per ticket — written after each Ralph loop
│   └── assets/             # README images (Ralph lives here)
├── .claude/
│   ├── skills/             # /create-plan, /execute-plan, /create-react-component
│   ├── hooks/              # Safety + quality guardrails
│   └── settings.json       # Hook wiring
├── .github/workflows/      # CI + Claude review + @claude delegation
├── docker-compose.yml      # Full stack: db + web + frontend
├── docker-compose.ci.yml   # CI overlay (test settings, ephemeral credentials)
├── docker-compose.prod.yml # Production-style builds (slim multi-stage, no bind mounts)
└── CLAUDE.md               # Project-wide rules (+ backend/ and frontend/ variants)
```
