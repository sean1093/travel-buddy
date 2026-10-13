import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Reads the `--name: R G B;` tokens of one theme block in src/style.css. */
function tokens(css: string, selector: string): Record<string, number[]> {
  const start = css.indexOf(`${selector} {`);
  const block = css.slice(start, css.indexOf("}", start));
  const out: Record<string, number[]> = {};
  for (const [, name, r, g, b] of block.matchAll(/--([\w-]+):\s*(\d+)\s+(\d+)\s+(\d+);/g)) {
    out[name!] = [Number(r), Number(g), Number(b)];
  }
  return out;
}

/** WCAG 2 relative luminance and contrast ratio. */
function luminance([r, g, b]: number[]): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!);
}

function contrast(a: number[], b: number[]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** Every text colour on every background it is drawn on. */
// Read from disk: Vitest stubs CSS imports, even with ?raw.
const css = readFileSync(new URL("../src/style.css", import.meta.url), "utf8");

const PAIRS: [string, string][] = [
  ["ink", "paper"],
  ["ink", "card"],
  ["ink", "sand"],
  ["ink", "ai-soft"],
  ["ink", "warn-soft"],
  ["muted", "paper"],
  ["muted", "card"],
  ["muted", "sand"],
  ["ai", "paper"],
  ["ai", "card"],
  ["ai", "sand"],
  ["ai", "ai-soft"],
  ["shu", "paper"],
  ["shu", "card"],
  ["shu", "sand"],
  ["shu", "shu-soft"],
  ["ok", "ok-soft"],
  ["ok", "card"],
  ["on-accent", "ai"],
  ["on-accent", "shu"],
  ["on-sos", "sos"],
  ["on-accent", "ok"],
  ["on-exit", "exit"],
];

describe.each([
  ["light", ":root"],
  ["dark", ':root[data-theme="dark"]'],
])("%s theme", (_, selector) => {
  const theme = tokens(css, selector);
  it.each(PAIRS)("%s on %s meets WCAG AA (4.5:1)", (fg, bg) => {
    expect(theme[fg], fg).toBeDefined();
    expect(theme[bg], bg).toBeDefined();
    expect(contrast(theme[fg]!, theme[bg]!)).toBeGreaterThanOrEqual(4.5);
  });
});
