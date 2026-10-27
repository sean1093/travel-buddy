import { describe, expect, it } from "vitest";
import { EMERGENCY_NUMBERS } from "../src/content/emergency";
import { GUIDES } from "../src/content/guides";
import { checkFreshness, isDate, REVERIFY_AFTER_DAYS } from "../src/content/validate";

/**
 * Emergency numbers and cheat sheets promise they were checked against an
 * official source. This fails once a check has run out, so stale information
 * can't ship. The weekly `freshness` workflow runs it with a lead time
 * (FRESHNESS_LEAD_DAYS) to warn before that happens.
 *
 * To fix a failure: check the entry against its sources again, correct it if
 * anything changed, then update `verified`. Never move the date alone.
 */
describe("content is re-verified in time", () => {
  const today = new Date().toISOString().slice(0, 10);
  const lead = Number(process.env.FRESHNESS_LEAD_DAYS ?? 0);

  it(`has nothing overdue${lead ? ` or due within ${lead} days` : ""} (today is ${today})`, () => {
    expect(checkFreshness({ emergency: EMERGENCY_NUMBERS, guides: GUIDES }, today, lead)).toEqual([]);
  });
});

describe("checkFreshness", () => {
  const guide = (verified: string) => ({ emergency: [], guides: [{ id: "tax-refund", verified }] });
  const number = (verified: string) => ({ emergency: [{ id: "police", verified }], guides: [] });

  it("accepts a check until the day before it runs out", () => {
    // 2026-10-11 + 180 days = 2027-04-09.
    expect(checkFreshness(guide("2026-10-11"), "2027-04-08")).toEqual([]);
  });

  it("reports a guide on the day its check runs out, with the due date", () => {
    expect(checkFreshness(guide("2026-10-11"), "2027-04-09")).toEqual([
      "guide tax-refund: verified 2026-10-11, re-verification was due 2027-04-09",
    ]);
  });

  it("gives emergency numbers a longer window than guides", () => {
    expect(REVERIFY_AFTER_DAYS.emergency).toBeGreaterThan(REVERIFY_AFTER_DAYS.guide);
    expect(checkFreshness(number("2026-10-08"), "2027-04-09")).toEqual([]);
    expect(checkFreshness(number("2026-10-08"), "2027-10-08")).toEqual([
      "emergency police: verified 2026-10-08, re-verification was due 2027-10-08",
    ]);
  });

  it("warns ahead of time with a lead", () => {
    expect(checkFreshness(guide("2026-10-11"), "2027-03-09", 30)).toEqual([]);
    expect(checkFreshness(guide("2026-10-11"), "2027-03-10", 30)).toEqual([
      "guide tax-refund: verified 2026-10-11, re-verification due 2027-04-09",
    ]);
  });

  it("rejects a date in the future or one that doesn't exist", () => {
    expect(checkFreshness(guide("2027-01-01"), "2026-10-27")).toEqual(["guide tax-refund: verified 2027-01-01 is in the future"]);
    expect(checkFreshness(guide("2026-02-30"), "2026-10-27")).toEqual(['guide tax-refund: verified "2026-02-30" is not a date']);
  });
});

describe("isDate", () => {
  it.each(["2026-10-08", "2028-02-29"])("accepts %s", (value) => expect(isDate(value)).toBe(true));
  it.each(["2026-02-30", "2027-02-29", "2026-13-01", "2026-1-8", "soon", ""])("rejects %j", (value) => expect(isDate(value)).toBe(false));
});
