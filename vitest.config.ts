import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["__tests__/setup.ts"],
    include: ["__tests__/public/**/*.test.ts"],
    exclude: [
      "node_modules",
      ".next",
      ".worktrees",
      "__tests__/harness/**",
      "scripts/*.ts",
      "**/node_modules/**",
    ],
    coverage: {
      provider: "v8",
      exclude: [
        "lib/prompts/templates/**",
        "lib/prompts/core/base-system.ts",
        "lib/prompts/core/voice-profile.ts",
        "lib/prompts/core/copywriting-techniques.ts",
        "lib/prompts/scoring/scoring.ts",
        "lib/prompts/classification/classifier.ts",
        "**/*.config.*",
        "__tests__/**",
      ],
    },
  },
});
