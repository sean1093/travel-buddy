import { readFileSync } from "node:fs";
import { test as base, expect, type Page } from "@playwright/test";

/** The same sample traveller the screenshot script uses. */
export const SAMPLE_PROFILE: Record<string, unknown> = JSON.parse(
  readFileSync(new URL("../scripts/sample-profile.json", import.meta.url), "utf8"),
);

export const PROFILE_KEY = "travelbuddy.japan.profile";
export const SETTINGS_KEY = "travelbuddy.japan.settings";

export interface SeedOptions {
  /** A profile to store; omit (or null) for a first run with nothing saved. */
  profile?: Record<string, unknown> | null;
  textSize?: "large" | "xlarge";
  theme?: "system" | "light" | "dark";
}

/**
 * Stores a profile and settings before the app's first script runs. The init
 * script runs on every navigation, so it writes only once per tab (a
 * sessionStorage flag): a reload then shows what the app itself saved.
 */
export async function seed(page: Page, options: SeedOptions = {}): Promise<void> {
  const settings = { theme: options.theme ?? "system", textSize: options.textSize ?? "large", voice: null };
  await page.addInitScript(
    ([profileKey, settingsKey, profile, settingsData]) => {
      if (sessionStorage.getItem("e2e.seeded")) return;
      sessionStorage.setItem("e2e.seeded", "1");
      if (profile) localStorage.setItem(profileKey, JSON.stringify({ v: 1, data: profile }));
      else localStorage.removeItem(profileKey);
      localStorage.setItem(settingsKey, JSON.stringify({ v: 1, data: settingsData }));
    },
    [PROFILE_KEY, SETTINGS_KEY, options.profile ?? null, settings] as const,
  );
}

interface Fixtures {
  /** Bound to the test's page: `await seed({ profile: SAMPLE_PROFILE })`. */
  seed: (options?: SeedOptions) => Promise<void>;
  /** Auto: any uncaught exception or console error fails the test. */
  failOnErrors: void;
}

/** Errors collected per page; exported so a test that opens its own context can watch that page too. */
export function watchErrors(page: Page, errors: string[]): void {
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
  });
}

export const test = base.extend<Fixtures>({
  seed: async ({ page }, use) => {
    await use((options) => seed(page, options));
  },
  failOnErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      watchErrors(page, errors);
      await use();
      expect(errors, "page errors and console errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
