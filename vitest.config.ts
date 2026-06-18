import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// `server-only` vyhazuje mimo RSC kontext — v testech ho nahradíme prázdným
// modulem. `@` mapuje na kořen projektu (stejně jako tsconfig paths).
export default defineConfig({
  resolve: {
    alias: {
      "server-only": fileURLToPath(new URL("./test/stubs/empty.ts", import.meta.url)),
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["app/**/*.test.ts"],
  },
});
