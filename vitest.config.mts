/** Configura a execução dos testes e a cobertura de 100% por arquivo de código executável. */
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "jsdom",
    pool: "threads",
    include: ["tests/**/*.test.{ts,tsx,mjs}"],
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "istanbul",
      include: [
        "app/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "lib/**/*.ts",
        "middleware.ts",
        "next.config.mjs",
      ],
      reporter: [["text", { skipFull: false }], "html", "json"],
      thresholds: { 100: true, perFile: true },
    },
  },
});
