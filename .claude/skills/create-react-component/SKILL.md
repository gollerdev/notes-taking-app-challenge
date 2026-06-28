---
description: Creates a React component from a Figma node. Use when the user asks to create, build, or implement a UI component or screen.
---

## Steps

1. Ask for or extract the Figma node URL for this component
2. Call `get_design_context` with the `fileKey` and `nodeId` from the URL
3. Implement the component using only values from the design context (colors, spacing, font sizes, border radius). Never hardcode visual values.
4. Use Tailwind classes that match the design token values
5. Write a co-located `.test.tsx` file with at minimum a render smoke test

## Rules
- No inline styles
- No guessed values
- Tailwind only
