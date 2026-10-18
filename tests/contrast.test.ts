import { describe, expect, it } from "vitest";
import { tokens } from "./css-tokens";

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
  const theme = tokens(selector);
  it.each(PAIRS)("%s on %s meets WCAG AA (4.5:1)", (fg, bg) => {
    expect(theme[fg], fg).toBeDefined();
    expect(theme[bg], bg).toBeDefined();
    expect(contrast(theme[fg]!, theme[bg]!)).toBeGreaterThanOrEqual(4.5);
  });
});
