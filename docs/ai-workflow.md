# AI Workflow

## Overview
Agentic workflow using Claude Code, Ralph Loop, Figma MCP, and GitHub Issues as ticket source of truth. Each feature ticket maps to a plan file, executed autonomously by Claude Code via the Ralph Loop (`/execute-plan` skill).

## Tools Used
- **Claude Code** (Claude Sonnet 4.6) — primary agent
- **Figma MCP** — design context and write-back
- **GitHub CLI** (`gh`) — ticket and PR management

## Ralph Loop process
1. Create a plan file in `docs/plans/<issue-number>-<slug>.md`
2. Run `/execute-plan docs/plans/<issue-number>-<slug>.md`
3. Claude executes the plan, verifies all acceptance criteria
4. On success, Claude outputs `DONE`
5. Log the loop in `docs/ralph-loops/<issue-number>-<slug>.md`
6. Open a PR with `Closes #<number>` in the body

## Per-ticket log

| Issue | Slug | Loop log | Status |
|---|---|---|---|
| — | — | — | — |
