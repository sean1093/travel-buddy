import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Read from disk: the root page is plain HTML outside the app bundle.
const root = readFileSync(new URL("../site/index.html", import.meta.url), "utf8");

describe("root page", () => {
  it("forwards to the Japan edition and keeps the hash", () => {
    expect(root).toContain('location.replace("./japan/" + location.hash)');
  });

  it("works without JavaScript", () => {
    expect(root).toContain('href="./japan/"');
  });
});
