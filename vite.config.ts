/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset URLs. Routing lives entirely in the hash, so the built site
  // works from any GitHub Pages subpath without hard-coding the repo name.
  base: "./",
  build: {
    // Each country edition is served from its own path; the root page
    // (site/index.html) is copied in by `npm run build`.
    outDir: "dist/japan",
    emptyOutDir: true,
  },
  test: {
    // Unit and component tests. Browser journeys live in e2e/ and run under Playwright.
    include: ["tests/**/*.test.ts"],
    // Logic tests run in Node; DOM tests opt in with `// @vitest-environment happy-dom`.
    environment: "node",
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // The entry point only wires the router to the window; e2e covers it.
      exclude: ["src/main.ts"],
      reporter: ["text-summary", "html"],
    },
  },
});
