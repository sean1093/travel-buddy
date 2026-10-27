import { describe, expect, it } from "vitest";
import { checkedComments, unmarkedChecks } from "../src/content/validate";
import { SOURCES } from "./source-files";

// Static rules for dated checks in source comments; they don't depend on today,
// so they run everywhere, deploys included. The deadlines themselves are in
// tests/content-freshness.test.ts.
describe("dated checks in source comments", () => {
  it("are all written as @checked markers with a date", () => {
    expect(SOURCES.flatMap(({ path, text }) => unmarkedChecks(path, text))).toEqual([]);
  });

  it("are all read: every @checked written is parsed as a date or reported as missing one", () => {
    // Catches a marker pattern that stops matching some forms, without hard-coding how many there are.
    for (const { path, text } of SOURCES) {
      const written = text.match(/@checked\b/gi)?.length ?? 0;
      const read = checkedComments(path, text).length + unmarkedChecks(path, text).filter((p) => p.includes("needs a date")).length;
      expect(read, path).toBe(written);
    }
    expect(SOURCES.some(({ text }) => /@checked\b/i.test(text)), "markers exist at all").toBe(true);
  });
});
