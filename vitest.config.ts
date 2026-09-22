import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    include: ["test/unit/**/*.test.ts", "test/unit/**/*.test.tsx"],
    environment: "node",
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
