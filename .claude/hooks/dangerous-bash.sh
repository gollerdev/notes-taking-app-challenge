#!/usr/bin/env bash
# PreToolUse — Bash
# Blocks dangerous shell commands. Exit 2 = blocking per Claude Code docs.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null || echo "")

BLOCKED_PATTERNS=(
  "rm -rf"
  "git push --force"
  "git push -f"
  "git reset --hard"
  "DROP TABLE"
  "--no-verify"
)

for PATTERN in "${BLOCKED_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qiF "$PATTERN"; then
    echo "dangerous-bash: blocked dangerous command matching '$PATTERN'" >&2
    exit 2
  fi
done

exit 0
