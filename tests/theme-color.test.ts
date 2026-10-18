import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { hex, tokens } from "./css-tokens";

// The phone's browser bar takes <meta name="theme-color">. Before the CSS loads,
// the inline script in index.html sets it from its own copy of the page
// background; applySettings() then reads --paper from the stylesheet. If the copy
// drifts, the bar visibly changes colour as the app starts.
describe("theme-color in index.html", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const light = hex(tokens(":root").paper!);
  const dark = hex(tokens(':root[data-theme="dark"]').paper!);

  it("starts as the light page background", () => {
    expect(html).toContain(`<meta name="theme-color" content="${light}" />`);
  });

  it("is set to the page background of the theme before first paint", () => {
    expect(html).toContain(`theme === "dark" ? "${dark}" : "${light}"`);
  });
});
