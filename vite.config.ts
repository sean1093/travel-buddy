/// <reference types="vitest/config" />
import { writeFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import { GUIDES } from "./src/content/guides";
import { renderGuidePage, sitemapXml } from "./src/seo/pages";

/**
 * Static pages for search engines (src/seo/pages.ts): each travel cheat sheet
 * at guide/<id>/index.html in the Japan edition, and the sitemap at the site
 * root (dist/sitemap.xml, next to the root page npm run build copies in).
 */
function staticPages(): Plugin {
  return {
    name: "static-pages",
    apply: "build",
    generateBundle() {
      for (const guide of GUIDES) {
        this.emitFile({ type: "asset", fileName: `guide/${guide.id}/index.html`, source: renderGuidePage(guide, GUIDES) });
      }
    },
    closeBundle() {
      writeFileSync(new URL("./dist/sitemap.xml", import.meta.url), sitemapXml(GUIDES));
    },
  };
}

export default defineConfig({
  // Relative asset URLs. Routing lives entirely in the hash, so the built site
  // works from any GitHub Pages subpath without hard-coding the repo name.
  base: "./",
  plugins: [staticPages()],
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
