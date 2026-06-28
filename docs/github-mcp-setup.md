# GitHub MCP Setup

## Install gh CLI (Windows)
```
winget install GitHub.cli
```

## Authenticate
```
gh auth login
```
Follow the prompts to authenticate with your GitHub account.

## Common commands
```bash
# List issues
gh issue list --repo <owner>/<repo>

# View a specific issue
gh issue view <number>

# Create a PR
gh pr create --title "..." --body "..."

# List PRs
gh pr list
```

## How Claude Code uses it
- Reference `#<number>` in commits and PRs to link to issues
- Issue numbers are the canonical reference — no duplicate ticket files
- `gh issue view <number>` is the primary way to load ticket context into a plan

## Repository
`gollerdev/notes-taking-app-challenge`
