import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

// The e2e tests and the screenshots run on a fixed day, before the sample trip, so what
// they show doesn't change with the date they run on. Both must use the same day.
describe("fixed test date", () => {
  it("is the same for the e2e tests and the screenshots", () => {
    const date = /new Date\("(\d{4}-\d{2}-\d{2}T[^"]+)"\)/;
    const e2e = read("e2e/fixtures.ts").match(date)?.[1];
    const shots = read("scripts/screenshots.cjs").match(date)?.[1];
    expect(e2e, "a fixed date in e2e/fixtures.ts").toBeTruthy();
    expect(shots, "a fixed date in scripts/screenshots.cjs").toBe(e2e);
  });
});
