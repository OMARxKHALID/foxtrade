import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "tests/server-only-stub.js"),
    },
  },
  test: {
    environment: "node",
    globalSetup: "./tests/global-setup.mjs",
    hookTimeout: 120_000,
    testTimeout: 30_000,
    pool: "forks",
    fileParallelism: false,
  },
});
