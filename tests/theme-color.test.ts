import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PAPER } from "../src/state";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

/** `--paper` of a theme block in style.css, as #rrggbb. */
function paper(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  const [, r, g, b] = css.slice(start).match(/--paper:\s*(\d+)\s+(\d+)\s+(\d+);/)!;
  return `#${[r, g, b].map((c) => Number(c).toString(16).padStart(2, "0")).join("")}`;
}

// The phone's browser bar takes this colour. Three places set it: the inline
// script before first paint, applySettings() after, and the page background.
// If they drift, the bar visibly changes colour as the app starts.
describe("theme-color", () => {
  const css = read("../src/style.css");
  const html = read("../index.html");

  it("matches the page background in both themes", () => {
    expect(PAPER.light).toBe(paper(css, ":root"));
    expect(PAPER.dark).toBe(paper(css, ':root[data-theme="dark"]'));
  });

  it("matches the inline script and the default meta tag in index.html", () => {
    expect(html).toContain(`<meta name="theme-color" content="${PAPER.light}" />`);
    expect(html).toContain(`theme === "dark" ? "${PAPER.dark}" : "${PAPER.light}"`);
  });
});
