# Figma MCP Setup

## Personal access token
1. Open Figma → Settings → Security → Personal access tokens
2. Create a token with read access
3. Store as `FIGMA_API_KEY` in your environment

## MCP configuration
The Figma MCP runs as a desktop app plugin. Install via:
```
claude plugin install figma@claude-plugins-official
```

## Gain editor access
The shared Figma link gives view-only access. To edit (required for design-to-code writes):
1. Open the original file URL
2. Duplicate to your drafts: File → Duplicate to your Drafts
3. Use your duplicate's `fileKey` for all write operations

## Using `get_design_context`
Extract `fileKey` and `nodeId` from the Figma URL:
```
https://www.figma.com/design/<fileKey>/...?node-id=<nodeId>
```
Call in Claude Code:
```
get_design_context({ fileKey: "<fileKey>", nodeId: "<nodeId>" })
```
Returns colors, spacing, typography, and component tree for that node.

## Plugin commands
After installing the Figma plugin, these slash commands are available:
- `/implement-design` — translate a Figma node into code
- `/create-design-system-rules` — extract design tokens into CLAUDE.md rules
- `/code-connect-components` — map Figma components to codebase components

## First-run step
Run `/create-design-system-rules` once after scaffold is complete. The output feeds into `frontend/CLAUDE.md` as concrete token values (colors, spacing, fonts).
