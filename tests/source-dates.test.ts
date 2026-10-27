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

  it("are found", () => {
    // If this drops to zero, the marker pattern no longer matches and comment dates go unchecked.
    expect(SOURCES.flatMap(({ path, text }) => checkedComments(path, text)).length).toBeGreaterThan(0);
  });
});
