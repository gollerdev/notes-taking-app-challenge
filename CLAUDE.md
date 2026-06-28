# CLAUDE.md — Project Root

## Project
Notes-taking app challenge for Turbo AI. Built with Django REST (backend) and Next.js 14 (frontend). 7-day build evaluated on functionality, code quality, creative AI use, and time management.

## Tech stack
| Layer | Stack |
|---|---|
| Backend | Python, uv, Django, Django REST Framework, djangorestframework-simplejwt, PostgreSQL, pytest, ruff, python-decouple |
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS, vitest |
| Infra | Docker, Docker Compose |

## Repo structure
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
└── CLAUDE.md         # This file
```

> Tickets live in GitHub Issues at `gollerdev/notes-taking-app-challenge` — not in the filesystem. No `docs/tickets/` folder. The issue number (`#N`) is the canonical reference everywhere.

## Branching
- `main` is the only long-lived branch
- Feature branches: use the branch name GitHub generates when creating branches from issues (e.g. `1-project-scaffold-and-agentic-workflow-setup`)
- One branch → one PR → `Closes #N` in the PR description
- Delete branch after merge

## Commits
Conventional Commits:
- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — scaffold, config, docs
- `test:` — tests only

## Tickets
- Live in GitHub Issues at `gollerdev/notes-taking-app-challenge`
- Issue number is the canonical reference — no duplicate ticket files
- Access via `gh issue view <number>`

## Agentic workflow
- Plan files live in `docs/plans/<issue-number>-<slug>.md`
- Execute with: `/execute-plan docs/plans/<issue-number>-<slug>.md`
- Log every loop in `docs/ralph-loops/<issue-number>-<slug>.md` after completion

## Figma MCP rules
- **Always** call `get_design_context` with the Figma node URL before implementing any UI element
- **Never** hardcode colors, spacing, font sizes, or border radius — use values from the design context

## Sources of truth hierarchy
| Priority | Source | Wins on |
|---|---|---|
| 1 | [Product video](https://drive.google.com/file/d/1yexyRO8qCElTYBFR9wrJCfZsqsBcTZgQ/view) | Behavior, interactions, flows, edge cases |
| 2 | [Figma design file](https://www.figma.com/design/imfHHa4B6WNdMXqhJh0pat/Notes-Taking-App-Challenge) | Colors, typography, spacing, component design |
| 3 | [Figma prototype](https://www.figma.com/proto/nIqpRyEWKPYqYsW7RMfi3S/Notes-Taking-App-Challenge?node-id=34-889&starting-point-node-id=34%3A889) | Navigation flow, transitions, interactive states |

**Conflict rule**: Figma wins on visual, video wins on behavioral. When sources conflict, document the decision in the relevant ticket.

## CLAUDE.md hierarchy
- `/CLAUDE.md` — project-wide rules (this file)
- `/backend/CLAUDE.md` — Django-specific rules (loaded when working in backend/)
- `/frontend/CLAUDE.md` — Next.js-specific rules (loaded when working in frontend/)
