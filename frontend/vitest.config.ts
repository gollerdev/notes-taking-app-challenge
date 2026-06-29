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
      },
      exclude: [
        "app/layout.tsx",
        "app/page.tsx",
        "app/health/page.tsx",
        "next.config.mjs",
        "tailwind.config.ts",
        "postcss.config.js",
        "vitest.config.ts",
        "vitest.setup.ts",
        "types/**",
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.test.tsx",
        "node_modules/**",
        ".next/**",
      ],
    },
  },
});
