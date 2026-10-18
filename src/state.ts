import { configureSpeech } from "./lib/speech";
import { asRecord, defineStore } from "./lib/store";

/** Which palette to paint: follow the device, or pin one. */
export type Theme = "system" | "light" | "dark";

/** Root font size; everything else is in rem, so the whole UI scales with it. */
export type TextSize = "large" | "xlarge";

const THEMES: readonly unknown[] = ["system", "light", "dark"];
const TEXT_SIZES: readonly unknown[] = ["large", "xlarge"];

/**
 * `--paper` of each theme, for <meta name="theme-color">. Must match style.css and the
 * inline script in index.html (tests/theme-color.test.ts checks all three).
 */
export const PAPER: Record<"light" | "dark", string> = { light: "#f4efe6", dark: "#1c1a17" };

export const NORMAL_RATE = 0.9;
export const SLOW_RATE = 0.6;

export interface Settings {
  theme: Theme;
  textSize: TextSize;
  /** `voiceURI` of the chosen voice; null picks the best available. */
  voice: string | null;
}

export const DEFAULT_SETTINGS: Settings = { theme: "system", textSize: "large", voice: null };

/** Saved settings over the defaults; malformed fields fall back individually. */
export function parseSettings(data: unknown): Settings {
  const saved = asRecord(data) ?? {};
  const settings = { ...DEFAULT_SETTINGS };
  if (THEMES.includes(saved.theme)) settings.theme = saved.theme as Theme;
  if (TEXT_SIZES.includes(saved.textSize)) settings.textSize = saved.textSize as TextSize;
  if (typeof saved.voice === "string") settings.voice = saved.voice;
  return settings;
}

const store = defineStore("settings", 1, parseSettings);

export const settings: Settings = store.load();

export function saveSettings(): void {
  store.save(settings);
  applySettings();
}

/** Mirrors the inline script in index.html, which runs before first paint. */
export function applySettings(): void {
  const root = document.documentElement;
  const theme =
    settings.theme === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : settings.theme;
  root.dataset.theme = theme;
  root.dataset.textSize = settings.textSize;
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", PAPER[theme]);
  configureSpeech({ voice: settings.voice, rate: NORMAL_RATE });
}
