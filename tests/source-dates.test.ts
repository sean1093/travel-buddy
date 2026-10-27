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
    // Counted line by line with a looser pattern than the parser's: "@checked" not followed by a
    // letter or "_" + letter (identifiers such as @checkedAt, @checked_at). A glued
    // "@checked2026-10-08" or "@checked_2026-10-08", or a parser change that stops reading a
    // form, shows up here with its line instead of a date that silently never runs out.
    const unread = scans.flatMap(({ path, text, checked, undated }) => {
      const read = [...checked.map((c) => c.where), ...undated.map((u) => u.split(": ")[0]!)];
      return text.split("\n").flatMap((line, i) => {
        const where = `${path}:${i + 1}`;
        const written = line.match(/@checked(?![a-z]|_[a-z])/gi)?.length ?? 0;
        return written > read.filter((w) => w === where).length ? [`${where}: write the marker as "(@checked YYYY-MM-DD)"`] : [];
      });
    });
    expect(unread).toEqual([]);
    expect(scans.some((s) => s.checked.length > 0), "markers exist at all").toBe(true);
  });
});
