import { describe, expect, it } from "vitest";
import { scanMarkers } from "../src/content/validate";
import { SOURCES } from "./source-files";

// Static rules for @checked markers in source comments, run everywhere
// (deploys included). The deadlines are in tests/content-freshness.test.ts.
describe("@checked markers in source comments", () => {
  const scans = SOURCES.map(({ path, text }) => ({ path, text, ...scanMarkers(path, text) }));

  it("all have a date", () => {
    expect(scans.flatMap((s) => s.undated)).toEqual([]);
  });

  it("are all read: each one written is parsed as a date or reported as missing one", () => {
    // A marker form the parser stops reading would silently stop running out.
    for (const { path, text, checked, undated } of scans) {
      expect(checked.length + undated.length, path).toBe(text.match(/@checked(?![a-z])/gi)?.length ?? 0);
    }
    expect(scans.some((s) => s.checked.length > 0), "markers exist at all").toBe(true);
  });
});
