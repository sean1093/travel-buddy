import { defineConfig, devices } from "@playwright/test";

/**
 * Browser journeys against the built site (`npm run build` first), served the
 * way GitHub Pages serves it: the Japan edition under /japan/.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:4173/japan/",
    trace: "retain-on-failure",
    // The app is Traditional Chinese first.
    locale: "zh-TW",
    ...devices["Pixel 7"],
    // Use the Chromium already on the machine when there is one (CHROMIUM=/path/to/chrome).
    launchOptions: process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {},
  },
  webServer: {
    command: "npx vite preview --port 4173 --strictPort --outDir dist",
    url: "http://localhost:4173/japan/",
    reuseExistingServer: !process.env.CI,
  },
});
