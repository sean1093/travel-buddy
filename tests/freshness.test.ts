import { describe, expect, it } from "vitest";
import { type Checked, checkedContent, checkFreshness, isDate, MARKER_FORMAT, REVERIFY_AFTER_DAYS, scanMarkers } from "../src/content/validate";

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

describe("scanMarkers", () => {
  const scan = (line: string) => scanMarkers("src/x.ts", line);

  it("reads each marker with its line", () => {
    const source = "/**\n * Sources: https://example.jp/ (@checked 2026-10-08).\n */\n// Read from the leaflet (@checked 2026-10-11); see below.\nconst x = 1;";
    expect(scanMarkers("src/x.ts", source)).toEqual({
      checked: [
        { where: "src/x.ts:2", verified: "2026-10-08", days: REVERIFY_AFTER_DAYS.comment },
        { where: "src/x.ts:4", verified: "2026-10-11", days: REVERIFY_AFTER_DAYS.comment },
      ],
      problems: [],
    });
  });

  it.each([
    "(@checked 2026-10-08)",
    "@checked 2026-10-08",
    "/* @checked 2026-10-08*/",
    "[@checked 2026-10-08]",
    "@checked 2026-10-08; see below",
    "Sources: … (@checked 2026-10-08).",
    "//@checked 2026-10-08",
    "x -@checked 2026-10-08",
    "https://a.jp/@checked 2026-10-08",
    "（@checked 2026-10-08）",
    "確認@checked 2026-10-08。",
    "note: '@checked 2026-10-08'",
    "`@checked 2026-10-08`",
    "<p>@checked 2026-10-08</p>",
    "@checked 2026-10-08: rules",
    "@checked 2026-10-08. Then",
    "@checked 2026-10-08、確認済み",
    "「@checked 2026-10-08」",
    "@checked 2026-10-08！",
    "@checked 2026-10-08\t// tab",
  ])(
    "reads %j",
    (line) => expect(scan(line)).toEqual({ checked: [expect.objectContaining({ verified: "2026-10-08" })], problems: [] }),
  );

  it("reads an impossible date in the right shape, so checkFreshness reports it", () => {
    expect(checkFreshness(scan("(@checked 2026-02-30)").checked, "2026-10-27")).toEqual(['src/x.ts:1: "2026-02-30" is not a date']);
  });

  it.each([
    "// @checked",
    "// (@checked soon)",
    "(@Checked 2026-10-08)",
    "(@checked: 2026-10-08)",
    "(@checked  2026-10-08)",
    "(@checked on 2026-10-08)",
    "(@checked2026-10-08)",
    "(@checked_2026-10-08)",
    "(@checkedOn 2026-10-08)",
    "(@checked 2026/10/08)",
    "(@checked 2026-10-8)",
    "(@checked 2026-10-08x)",
    "(@checked 2026-10-08/09)",
    " * @checkedAt the time of the last check",
    "(@checked 2026-10-08–2026-11-01)",
    "(@checked 2026-10-08.1)",
    "(@checked 2026-10-08:12)",
    "(@checked 2026-10-08〜2026-11-01)",
    "(@checked 2026-10-08～2026-11-01)",
    "(@checked 2026-10-08~2026-11-01)",
    "(@checked 2026-10-08‐2026-11-01)",
    "(@checked 2026-10-08−2026-11-01)",
    "(@checked 2026-10-08+1)",
    "(@checked 2026-10-08．1)",
    "(@checked 2026-10-08：12)",
    "// https://x.com/@checkedjapan",
    "// 名前@checked",
  ])("reports %j with the text and how to write the marker", (line) => {
    const { checked, problems } = scan(line);
    expect(checked).toEqual([]);
    expect(problems).toHaveLength(1);
    const [, quoted, rest] = /^src\/x\.ts:1: (".*"): (.*)$/.exec(problems[0]!)!;
    expect(rest).toBe(MARKER_FORMAT);
    // The quote is the offending marker itself, as written.
    const text = JSON.parse(quoted!) as string;
    expect(text.toLowerCase().startsWith("@checked")).toBe(true);
    expect(line.includes(text)).toBe(true);
  });

  it("quotes the text safely: escaped, and cut between whole characters (graphemes)", () => {
    const [problem] = scan('@checked "x" 🗓️🗓️🗓️🗓️🗓️🗓️🗓️🗓️👨‍👩‍👧').problems;
    const quoted = problem!.slice("src/x.ts:1: ".length, -`: ${MARKER_FORMAT}`.length);
    expect(JSON.parse(quoted)).toBe('@checked "x" 🗓️🗓️🗓️🗓️🗓️🗓️🗓️🗓️👨‍👩‍👧');
    const [long] = scan(`@checked ${"確認".repeat(40)}`).problems;
    // 24 graphemes: "@checked " is 9, then 15 more.
    expect(JSON.parse(long!.slice("src/x.ts:1: ".length, -`: ${MARKER_FORMAT}`.length))).toBe(`@checked ${"確認".repeat(7)}確`);
  });

  it("reports each bad marker on a line", () => {
    expect(scan("// @checked (rules), @checked (links)").problems).toHaveLength(2);
  });

  it.each(['"support@checked.jp"', "// see foo@checked", "// foo_@checked", "// x1@checked"])("ignores %j, right after an ASCII letter, digit or _", (line) =>
    expect(scan(line)).toEqual({ checked: [], problems: [] }),
  );

  it("does not read a date written as prose: the marker is the rule (content guide §9)", () => {
    expect(scan("// checked 2026-10-08 against the leaflet")).toEqual({ checked: [], problems: [] });
  });
});

describe("isDate", () => {
  it.each(["2026-10-08", "2028-02-29"])("accepts %s", (value) => expect(isDate(value)).toBe(true));
  it.each(["2026-02-30", "2027-02-29", "2026-13-01", "2026-1-8", "soon", ""])("rejects %j", (value) => expect(isDate(value)).toBe(false));
});
