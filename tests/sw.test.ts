import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import { describe, expect, it } from "vitest";

// public/sw.js is plain JavaScript outside the typechecked bundle. If it doesn't
// parse, the browser silently keeps no service worker and the app stops working
// offline, with nothing failing at build time.
describe("service worker (public/sw.js)", () => {
  const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

  it("parses as a script", () => {
    expect(() => new Script(source, { filename: "sw.js" })).not.toThrow();
  });

  it("stores only the app's own page as the offline shell", () => {
    // Other pages in scope (the static guide pages) are cached under their own address.
    expect(source).toMatch(/cache\.put\(shell \? "\.\/index\.html" : request,/);
  });
});
