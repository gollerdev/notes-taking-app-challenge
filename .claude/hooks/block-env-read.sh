#!/usr/bin/env bash
# PreToolUse — Read and Bash
# Blocks reading .env files (not .env.example). Exit 2 = blocking per Claude Code docs.

INPUT=$(cat)

# Fast path: skip if .env doesn't appear in the input at all (eliminates Python on every Read)
echo "$INPUT" | grep -q '\.env' || exit 0

if echo "$INPUT" | grep -q '"file_path"'; then
  # Read tool — extract file_path with grep/sed, no Python subprocess
  FILE=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"\([^"]*\)"$/\1/')
  BASE=$(basename "$FILE")
  if [[ "$BASE" == ".env" ]] || [[ "$BASE" == .env.* && "$BASE" != ".env.example" ]]; then
    echo "block-env-read: reading $FILE is blocked -- check .env.example instead" >&2
    exit 2
  fi
else
  # Bash tool — extract command (Python only runs when .env appears in a bash command)
  CMD=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null || echo "")
  if echo "$CMD" | grep -qE '(cat|less|head|tail|source|\.[[:space:]])[[:space:]]+\.env([[:space:]]|$|\*)'; then
    echo "block-env-read: reading .env via shell is blocked -- check .env.example instead" >&2
    exit 2
  fi
fi

exit 0
