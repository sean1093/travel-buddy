import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EMERGENCY_NUMBERS } from "../src/content/emergency";
import { GUIDES } from "../src/content/guides";
import { checkedComments, checkedContent, checkFreshness, unmarkedChecks } from "../src/content/validate";
import { SOURCES } from "./source-files";

/**
 * Emergency numbers, cheat sheets and `@checked` source comments promise they
 * were checked against an official source. This fails once a check has run
 * out, so stale information can't be merged. It is the one test that depends
 * on today's date, so deploys skip it (the stale entry is already live;
 * blocking would only hold back fixes). The weekly `freshness` workflow runs it
 * with a lead time (FRESHNESS_LEAD_DAYS) and writes what it found to
 * FRESHNESS_REPORT for the issue it opens.
 *
 * To fix a failure: check the entry against its sources again, correct it if
 * anything changed, then update the date. Never move the date alone.
 */

/** FRESHNESS_LEAD_DAYS, validated: a typo must not look like stale content. */
function leadDays(): number {
  const raw = process.env.FRESHNESS_LEAD_DAYS ?? "0";
  if (!/^\d+$/.test(raw)) throw new Error(`FRESHNESS_LEAD_DAYS must be a whole number of days, got "${raw}"`);
  return Number(raw);
}

describe("content is re-verified in time", () => {
  it("has nothing overdue (or due within FRESHNESS_LEAD_DAYS)", () => {
    const today = new Date().toISOString().slice(0, 10);
    const lead = leadDays();
    const entries = [
      ...checkedContent({ emergency: EMERGENCY_NUMBERS, guides: GUIDES }),
      ...SOURCES.flatMap(({ path, text }) => checkedComments(path, text)),
    ];
    // One list for the weekly issue: deadlines, and checks dated so they could never run out.
    const problems = [...checkFreshness(entries, today, lead), ...SOURCES.flatMap(({ path, text }) => unmarkedChecks(path, text))];
    if (problems.length && process.env.FRESHNESS_REPORT) writeFileSync(process.env.FRESHNESS_REPORT, problems.map((p) => `- ${p}`).join("\n") + "\n");
    expect(problems, `today ${today}, lead ${lead} days`).toEqual([]);
  });
});
