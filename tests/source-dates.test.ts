import { describe, expect, it } from "vitest";
import { scanMarkers } from "../src/content/validate";
import { SOURCES } from "./source-files";

// Static rule for @checked markers in source comments, run everywhere (deploys
// included): each one is written "@checked YYYY-MM-DD". The deadlines are in
// tests/content-freshness.test.ts.
describe("@checked markers in source comments", () => {
  const scans = SOURCES.map(({ path, text }) => scanMarkers(path, text));

  it("are all written \"@checked YYYY-MM-DD\"", () => {
    expect(scans.flatMap((s) => s.problems)).toEqual([]);
  });

  it("exist", () => {
    // The marker is how comment-dated facts run out; none found means the scan is broken.
    expect(scans.some((s) => s.checked.length > 0)).toBe(true);
  });
});
