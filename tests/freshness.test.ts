import { describe, expect, it } from "vitest";
import { type Checked, checkedContent, checkFreshness, isDate, REVERIFY_AFTER_DAYS, scanMarkers } from "../src/content/validate";

const checkedComments = (path: string, source: string) => scanMarkers(path, source).checked;
const undatedMarkers = (path: string, source: string) => scanMarkers(path, source).undated;

// The rules behind tests/content-freshness.test.ts, on fixed dates. That file
// checks the real content against today and is the one deploys skip.

describe("checkFreshness", () => {
  const guide = (verified: string, recheckBy?: string): Checked[] => [
    { where: "guide tax-refund", verified, days: REVERIFY_AFTER_DAYS.guide, recheckBy },
  ];

  it("accepts a check until the day before it runs out", () => {
    // 2026-10-11 + 180 days = 2027-04-09.
    expect(checkFreshness(guide("2026-10-11"), "2027-04-08")).toEqual([]);
  });

  it("reports an entry on the day its check runs out, with the due date", () => {
    expect(checkFreshness(guide("2026-10-11"), "2027-04-09")).toEqual([
      "guide tax-refund: verified 2026-10-11, re-verification was due 2027-04-09",
    ]);
  });

  it("gives emergency numbers a longer window than guides", () => {
    const content = checkedContent({ emergency: [{ id: "police", verified: "2026-10-08" }], guides: [] });
    expect(REVERIFY_AFTER_DAYS.emergency).toBeGreaterThan(REVERIFY_AFTER_DAYS.guide);
    expect(checkFreshness(content, "2027-04-09")).toEqual([]);
    expect(checkFreshness(content, "2027-10-08")).toEqual(["emergency police: verified 2026-10-08, re-verification was due 2027-10-08"]);
  });

  it("asks for a check by a known change date, even inside the window", () => {
    expect(checkFreshness(guide("2026-10-11", "2026-11-15"), "2026-11-14")).toEqual([]);
    expect(checkFreshness(guide("2026-10-11", "2026-11-15"), "2026-11-15")).toEqual([
      "guide tax-refund: verified 2026-10-11, re-verification was due 2026-11-15",
    ]);
    // Re-checked after the change: the window counts from the new date.
    expect(checkFreshness(guide("2026-11-20", "2026-11-15"), "2027-01-01")).toEqual([]);
  });

  it("warns ahead of time with a lead", () => {
    expect(checkFreshness(guide("2026-10-11"), "2027-03-09", 30)).toEqual([]);
    expect(checkFreshness(guide("2026-10-11"), "2027-03-10", 30)).toEqual([
      "guide tax-refund: verified 2026-10-11, re-verification due 2027-04-09",
    ]);
  });

  it("rejects a date in the future, with a day's slack for time zones", () => {
    expect(checkFreshness(guide("2026-10-28"), "2026-10-27")).toEqual([]);
    expect(checkFreshness(guide("2026-10-29"), "2026-10-27")).toEqual(["guide tax-refund: verified 2026-10-29 is in the future"]);
  });

  it("reports a date that doesn't exist", () => {
    expect(checkFreshness(guide("2026-02-30"), "2026-10-27")).toEqual(['guide tax-refund: "2026-02-30" is not a date']);
  });

  it("reports malformed content dates too, so the weekly check sees them", () => {
    const entries = checkedContent({ emergency: [], guides: [{ id: "tax-refund", verified: "2026-1-08" }] });
    expect(checkFreshness(entries, "2026-10-27")).toEqual(['guide tax-refund: "2026-1-08" is not a date']);
  });

  it("refuses a bad lead or today instead of reporting stale content", () => {
    expect(() => checkFreshness(guide("2026-10-11"), "2026-10-27", Number.NaN)).toThrow(/leadDays/);
    expect(() => checkFreshness(guide("2026-10-11"), "today")).toThrow(/today/);
  });
});

describe("checkedComments", () => {
  it("finds each @checked marker with its line", () => {
    const source = "/**\n * Sources: https://example.jp/ (@checked 2026-10-08).\n */\n// Read from the leaflet (@checked 2026-10-11); see below.\nconst x = 1;";
    expect(checkedComments("src/x.ts", source)).toEqual([
      { where: "src/x.ts:2", verified: "2026-10-08", days: REVERIFY_AFTER_DAYS.comment },
      { where: "src/x.ts:4", verified: "2026-10-11", days: REVERIFY_AFTER_DAYS.comment },
    ]);
  });

  it.each(["(@Checked 2026-10-08)", "(@CHECKED: 2026-10-08)", "@checked=2026-10-08;", "/* @checked 2026-10-08*/", "[@checked on 2026-10-08]", "(@checked2026-10-08)", "(@checked_2026-10-08)"])(
    "reads the variant %j",
    (line) => expect(checkedComments("src/x.ts", line).map((e) => e.verified)).toEqual(["2026-10-08"]),
  );

  it.each([
    ["// (@checked 2026/10/08)", "2026/10/08"],
    ["// (@checked 2026-10-08x)", "2026-10-08x"],
    ["// (@checked 2026-10-08/09)", "2026-10-08/09"],
  ])("keeps the malformed date in %j, so checkFreshness reports it", (line, date) => {
    expect(checkFreshness(checkedComments("src/x.ts", line), "2026-10-27")).toEqual([`src/x.ts:1: "${date}" is not a date`]);
  });
});

describe("undatedMarkers", () => {
  it.each([
    ["// @checked", 1],
    ["// (@Checked: soon)", 1],
    ["// @checked on Monday", 1],
    ["// @checked (rules), @checked (links)", 2],
  ])("reports each marker without a date in %j", (line, count) =>
    expect(undatedMarkers("src/x.ts", line)).toEqual(Array(count).fill("src/x.ts:1: the @checked marker needs a date after it")),
  );

  it.each(["// (@checked 2026-10-11)", " * @checkedAt the time of the last check"])("accepts %j", (line) =>
    expect(undatedMarkers("src/x.ts", line)).toEqual([]),
  );

  it("does not read a date written as prose: the marker is the rule (content guide §9)", () => {
    expect(scanMarkers("src/x.ts", "// checked 2026-10-08 against the leaflet")).toEqual({ checked: [], undated: [] });
  });
});

describe("isDate", () => {
  it.each(["2026-10-08", "2028-02-29"])("accepts %s", (value) => expect(isDate(value)).toBe(true));
  it.each(["2026-02-30", "2027-02-29", "2026-13-01", "2026-1-8", "soon", ""])("rejects %j", (value) => expect(isDate(value)).toBe(false));
});
