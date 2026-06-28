#!/usr/bin/env bash
# PreToolUse — Read and Bash
# Blocks reading .env files (not .env.example). Exit 2 = blocking per Claude Code docs.

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
