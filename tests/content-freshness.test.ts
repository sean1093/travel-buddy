import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EMERGENCY_NUMBERS } from "../src/content/emergency";
import { GUIDES } from "../src/content/guides";
import { type Checked, checkedComments, checkedContent, checkFreshness, unmarkedChecks } from "../src/content/validate";

/**
 * Emergency numbers, cheat sheets and `@checked` source comments promise they
 * were checked against an official source. This fails once a check has run
 * out, so stale information can't be merged. It depends on today's date, so
 * deploys skip it (the stale entry is already live; blocking would only hold
 * back fixes). The weekly `freshness` workflow runs it with a lead time
 * (FRESHNESS_LEAD_DAYS) and writes what it found to FRESHNESS_REPORT.
 *
 * To fix a failure: check the entry against its sources again, correct it if
 * anything changed, then update the date. Never move the date alone.
 */

/** Every .ts file under src/, except the one that defines the marker (its messages spell it out). */
function sources(): { path: string; text: string }[] {
  const root = new URL("../src/", import.meta.url);
  return (readdirSync(root, { recursive: true }) as string[])
    .filter((file) => file.endsWith(".ts") && file !== "content/validate.ts")
    .map((file) => ({ path: `src/${file}`, text: readFileSync(new URL(file, root), "utf8") }));
}

/** FRESHNESS_LEAD_DAYS, validated: a typo must not look like stale content. */
function leadDays(): number {
  const raw = process.env.FRESHNESS_LEAD_DAYS ?? "0";
  if (!/^\d+$/.test(raw)) throw new Error(`FRESHNESS_LEAD_DAYS must be a whole number of days, got "${raw}"`);
  return Number(raw);
}

describe("content is re-verified in time", () => {
  const comments: Checked[] = sources().flatMap(({ path, text }) => checkedComments(path, text));

  it("has nothing overdue (or due within FRESHNESS_LEAD_DAYS)", () => {
    const today = new Date().toISOString().slice(0, 10);
    const lead = leadDays();
    const problems = checkFreshness([...checkedContent({ emergency: EMERGENCY_NUMBERS, guides: GUIDES }), ...comments], today, lead);
    if (problems.length && process.env.FRESHNESS_REPORT) writeFileSync(process.env.FRESHNESS_REPORT, problems.map((p) => `- ${p}`).join("\n") + "\n");
    expect(problems, `today ${today}, lead ${lead} days`).toEqual([]);
  });

  it("dates every source-comment check with the @checked marker", () => {
    expect(sources().flatMap(({ path, text }) => unmarkedChecks(path, text))).toEqual([]);
    // If this drops to zero, the marker no longer matches and comment dates go unchecked.
    expect(comments.length).toBeGreaterThanOrEqual(4);
  });
});
