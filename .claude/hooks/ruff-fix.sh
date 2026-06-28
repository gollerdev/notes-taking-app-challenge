#!/usr/bin/env bash
# PostToolUse — Edit/Write
# Runs ruff --fix on .py files immediately after Claude writes them.

INPUT=$(cat)
FILE=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")

[[ -z "$FILE" || "$FILE" != *.py ]] && exit 0

uv run ruff check --fix "$FILE" 2>/dev/null
exit 0
