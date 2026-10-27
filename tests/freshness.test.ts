import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EMERGENCY_NUMBERS } from "../src/content/emergency";
import { GUIDES } from "../src/content/guides";
import { type Checked, checkedComments, checkedContent, checkFreshness, isDate, REVERIFY_AFTER_DAYS } from "../src/content/validate";

/** Every "Checked YYYY-MM-DD" in a source comment under src/, with its file and line. */
function commentDates(): Checked[] {
  const root = new URL("../src/", import.meta.url);
  return (readdirSync(root, { recursive: true }) as string[])
    .filter((file) => file.endsWith(".ts"))
    .flatMap((file) => checkedComments(`src/${file}`, readFileSync(new URL(file, root), "utf8")));
}

/** FRESHNESS_LEAD_DAYS, validated: a typo must not look like stale content. */
function leadDays(): number {
  const raw = process.env.FRESHNESS_LEAD_DAYS ?? "0";
  if (!/^\d+$/.test(raw)) throw new Error(`FRESHNESS_LEAD_DAYS must be a whole number of days, got "${raw}"`);
  return Number(raw);
}

/**
 * Emergency numbers, cheat sheets and dated source comments promise they were
 * checked against an official source. This fails once a check has run out, so
 * stale information can't be merged. The weekly `freshness` workflow runs it
 * with a lead time (FRESHNESS_LEAD_DAYS) to warn first, and writes what it
 * found to FRESHNESS_REPORT for the issue it opens.
 *
 * To fix a failure: check the entry against its sources again, correct it if
 * anything changed, then update the date. Never move the date alone.
 */
describe("content is re-verified in time", () => {
  it("has nothing overdue (or due within FRESHNESS_LEAD_DAYS)", () => {
    const today = new Date().toISOString().slice(0, 10);
    const lead = leadDays();
    const problems = checkFreshness([...checkedContent({ emergency: EMERGENCY_NUMBERS, guides: GUIDES }), ...commentDates()], today, lead);
    if (problems.length && process.env.FRESHNESS_REPORT) writeFileSync(process.env.FRESHNESS_REPORT, problems.map((p) => `- ${p}`).join("\n") + "\n");
    expect(problems, `today ${today}, lead ${lead} days`).toEqual([]);
  });

  it("finds the dated source comments", () => {
    // If this drops to zero, the comment pattern no longer matches and comment dates go unchecked.
    expect(commentDates().length).toBeGreaterThanOrEqual(5);
  });
});

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

  it("leaves malformed dates to validateContent", () => {
    expect(checkFreshness(guide("2026-02-30"), "2026-10-27")).toEqual([]);
  });

  it("refuses a bad lead or today instead of reporting stale content", () => {
    expect(() => checkFreshness(guide("2026-10-11"), "2026-10-27", Number.NaN)).toThrow(/leadDays/);
    expect(() => checkFreshness(guide("2026-10-11"), "today")).toThrow(/today/);
  });
});

describe("checkedComments", () => {
  it("finds each dated check with its line", () => {
    const source = "/**\n * Sources: …\n * (checked 2026-10-08).\n */\n// Checked 2026-10-11 via search results\nconst x = 1;";
    expect(checkedComments("src/x.ts", source)).toEqual([
      { where: "src/x.ts:3", verified: "2026-10-08", days: REVERIFY_AFTER_DAYS.comment },
      { where: "src/x.ts:5", verified: "2026-10-11", days: REVERIFY_AFTER_DAYS.comment },
    ]);
  });
});

describe("isDate", () => {
  it.each(["2026-10-08", "2028-02-29"])("accepts %s", (value) => expect(isDate(value)).toBe(true));
  it.each(["2026-02-30", "2027-02-29", "2026-13-01", "2026-1-8", "soon", ""])("rejects %j", (value) => expect(isDate(value)).toBe(false));
});
