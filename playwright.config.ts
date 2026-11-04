import { defineConfig, devices } from "@playwright/test";

// Without this, context.setOffline() and context.route() don't reach the service
// worker's own requests: it quietly fetches from the network, and an "offline" test
// passes without ever using the offline cache. Set here, so every worker inherits it.
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = "1";

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
    // Not 4173: the screenshot script's preview server (dist/japan at /) may already be running there.
    baseURL: "http://localhost:4310/japan/",
    trace: "retain-on-failure",
    // The app is Traditional Chinese first.
    locale: "zh-TW",
    ...devices["Pixel 7"],
    // Use the Chromium already on the machine when there is one (CHROMIUM=/path/to/chrome).
    launchOptions: process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {},
  },
  webServer: {
    command: "npx vite preview --port 4310 --strictPort --outDir dist",
    url: "http://localhost:4310/japan/",
    reuseExistingServer: !process.env.CI,
  },
});
