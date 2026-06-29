#!/usr/bin/env bash
# PostToolUse — Edit/Write/MultiEdit
# Runs prettier + eslint --fix on frontend .ts/.tsx/.js/.jsx files after Claude writes them.

INPUT=$(cat)
FILE=$(echo "$INPUT" | python -c "
import sys, json
d = json.load(sys.stdin)
p = d.get('tool_input', {}).get('file_path', '').replace(chr(92), '/')
print(p)
" 2>/dev/null || echo "")

[[ -z "$FILE" ]] && exit 0

# Only act on frontend files with relevant extensions
case "$FILE" in
  */frontend/*.ts|*/frontend/*.tsx|*/frontend/*.js|*/frontend/*.jsx) ;;
  *) exit 0 ;;
esac

# Run prettier then eslint from the frontend directory
FRONTEND_DIR="$(cd "$(dirname "$0")/../../frontend" && pwd)"
(cd "$FRONTEND_DIR" && npx prettier --write "$FILE") 2>/dev/null || true
(cd "$FRONTEND_DIR" && npx eslint --fix "$FILE") 2>/dev/null || true
exit 0
