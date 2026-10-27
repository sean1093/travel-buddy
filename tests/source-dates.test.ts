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

  it("are all written so the parser reads them", () => {
    // Counted with a looser pattern than the parser's: "@checked" not followed by a letter or
    // "_" (identifiers). A glued "@checked2026-10-08", or a parser change that stops reading a
    // form, shows up as a mismatch here instead of a date that silently never runs out.
    for (const { path, text, checked, undated } of scans) {
      const written = text.match(/@checked(?![a-z_])/gi)?.length ?? 0;
      expect(checked.length + undated.length, `${path}: write markers as "(@checked YYYY-MM-DD)"`).toBe(written);
    }
    expect(scans.some((s) => s.checked.length > 0), "markers exist at all").toBe(true);
  });
});
