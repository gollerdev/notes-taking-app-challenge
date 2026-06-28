#!/usr/bin/env bash
# PostToolUse — Edit/Write
# Prints a reminder when models.py is changed. Exit 0 always (reminder only).

INPUT=$(cat)
FILE=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")

if echo "$FILE" | grep -q "models\.py$"; then
  echo "warning: models.py changed -- run: uv run python manage.py makemigrations" >&2
fi

exit 0
