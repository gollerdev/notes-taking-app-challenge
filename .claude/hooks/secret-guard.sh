#!/usr/bin/env bash
# PreToolUse — Write and Edit
# Blocks writes containing hardcoded secrets. Exit 2 = blocking per Claude Code docs.

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
