/// <reference types="vitest/config" />
import { copyFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { GUIDES } from "./src/content/guides";
import { renderGuidePage, sitemapXml } from "./src/seo/pages";

/**
 * The pages outside the app (src/seo/pages.ts): each travel cheat sheet at
 * guide/<id>/index.html in the Japan edition, and, one level up at the site
 * root, the root page (site/index.html) and the sitemap. writeBundle runs only
 * after a successful build, into whatever outDir is configured.
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
    writeBundle(options) {
      // The site root is one level above the edition (dist/japan → dist). With any other
      // outDir that would be a source folder, so refuse rather than overwrite index.html.
      if (basename(options.dir!) !== "japan") throw new Error(`static-pages: outDir must be <site>/japan, got ${options.dir}`);
      const siteRoot = resolve(options.dir!, "..");
      // Everything in site/ belongs at the site root: the root page, and the Google Search
      // Console verification file (googleXXXX.html), which must stay for verification to hold.
      // Files only, no dotfiles (a stray .DS_Store must not be deployed).
      for (const entry of readdirSync(new URL("./site/", import.meta.url), { withFileTypes: true })) {
        if (!entry.isFile() || entry.name.startsWith(".")) continue;
        copyFileSync(new URL(`./site/${entry.name}`, import.meta.url), resolve(siteRoot, entry.name));
      }
      writeFileSync(resolve(siteRoot, "sitemap.xml"), sitemapXml(GUIDES));
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
    // (site/index.html) and the sitemap are written next to it by staticPages().
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
