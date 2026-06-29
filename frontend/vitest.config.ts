import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
      exclude: [
        "app/layout.tsx",
        "app/page.tsx",
        "app/health/page.tsx",
        "app/fonts.ts",
        "app/(auth)/layout.tsx",
        "next.config.mjs",
        "tailwind.config.ts",
        "postcss.config.js",
        "vitest.config.ts",
        "vitest.setup.ts",
        "types/**",
        "test-utils/**",
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.test.tsx",
        "node_modules/**",
        ".next/**",
      ],
    },
  },
});
