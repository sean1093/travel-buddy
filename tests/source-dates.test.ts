import { describe, expect, it } from "vitest";
import { checkedComments, undatedMarkers } from "../src/content/validate";
import { SOURCES } from "./source-files";

// A static guard on the @checked parser, run on every PR and deploy: a marker
// form the parser stops reading would silently stop running out. The markers'
// dates and deadlines are checked in tests/content-freshness.test.ts.
describe("@checked markers in source comments", () => {
  it("are all read: each one written is parsed as a date or reported as missing one", () => {
    for (const { path, text } of SOURCES) {
      const written = text.match(/@checked\b/gi)?.length ?? 0;
      expect(checkedComments(path, text).length + undatedMarkers(path, text).length, path).toBe(written);
    }
    expect(SOURCES.some(({ text }) => /@checked\b/i.test(text)), "markers exist at all").toBe(true);
  });
});
