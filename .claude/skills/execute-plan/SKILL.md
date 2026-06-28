---
description: Executes a plan file using the Ralph Loop workflow. Use when the user runs /execute-plan or asks to execute a plan, start a ticket loop, or implement a docs/plans/ file.
---

## Usage
```
/execute-plan <plan-file> [--min <n>] [--max <n>]
```
- `--min <n>` (optional) — run at least `n` iterations even if `DONE` is output earlier
- `--max <n>` (optional) — stop after `n` iterations even if `DONE` has not been output

## Instructions

You are the **loop controller**. You do not execute the plan yourself — you spawn a subagent for each iteration. Each subagent gets a fresh context window, ensuring every pass reads the real repo state with no accumulated bias from previous iterations.

Follow these steps exactly:

1. Read the plan file at **$0** to understand its scope and acceptance criteria
2. Determine iteration bounds from `--min` and `--max` arguments (default: no bounds)
3. Spawn a subagent with the prompt below, passing the plan file path and current iteration number
4. Wait for the subagent to return its result
5. If the subagent outputs `DONE` **and** the iteration count is ≥ `--min` (or no min was set): stop the loop and output `DONE`
6. If the subagent outputs `DONE` but the iteration count is below `--min`: increment the counter and go to step 3
7. If the subagent outputs `BLOCKED: <reason>`: stop the loop and surface the reason to the user
8. If the iteration count reaches `--max` and `DONE` has not been output: output `MAX ITERATIONS REACHED` and stop
9. Otherwise (criteria not yet met): increment the counter and go to step 3

## Subagent prompt template

> You are executing iteration **{n}** of an execute-plan loop for plan file `{plan-file}`.
>
> Steps:
> 1. Read the plan file in full
> 2. Read `CLAUDE.md`, `backend/CLAUDE.md`, and `frontend/CLAUDE.md` (whichever exist) to load architecture conventions, code standards, tooling rules, and naming constraints before touching any code
> 3. Run `git status` and inspect existing files to understand what is already done
> 4. Execute only what the plan describes — nothing outside its scope, and always following the standards from the CLAUDE.md files
> 5. After each meaningful change, run the relevant tests or verification steps described in CLAUDE.md (e.g. `uv run pytest`, `npm run test`, `uv run ruff check . --fix`)
> 6. Check every acceptance criterion in the plan
> 7. If all criteria pass: output `DONE`
> 8. If criteria do not pass: output `BLOCKED: <reason>`
>
> Rules:
> - Never write code or files outside the scope defined in the plan
> - Always honour the conventions in CLAUDE.md files — they override your defaults (e.g. package manager, test runner, linter, auth storage)
> - Do not output `DONE` unless every acceptance criterion is met and tests pass
> - `DONE` is the only keyword that signals successful completion

## Rules
- You (the controller) never touch the repo directly — only subagents do
- `DONE` is the only keyword that signals the loop has ended successfully
- Each subagent is isolated: it has no memory of previous iterations

## After the loop completes (controller step)
Once the loop ends (via `DONE` or `MAX ITERATIONS REACHED`), you must write the loop log.

Derive the log path from the plan file path: `docs/plans/<issue-number>-<slug>.md` → `docs/ralph-loops/<issue-number>-<slug>.md`

- If the file **does not exist**: create it
- If the file **already exists** (plan was run before): append a new dated entry to the bottom — do not overwrite previous entries

Log content (per run):
- Date
- Plan file used
- Number of iterations
- What Claude did
- Deviations from the plan
- AC items that failed verification
- Lessons / surprises
