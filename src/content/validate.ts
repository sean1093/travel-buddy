import { KANA, parse, plain, SLOT_WORD, slotsOf } from "../lib/jp";
import { TRAILING_PUNCT, WA_FINAL } from "../lib/romaji";
import type { EmergencyNumber } from "./emergency";
import type { Guide } from "./guides";
import { REPLY_SETS } from "./replies";
import { type Jp, type Phrase, type Preset, type Reply, type Scene, SLOTS } from "./types";

/** Anything that cannot be read without a {…|reading}: kanji, latin letters, digits. */
const NEEDS_READING = /[\p{Script=Han}A-Za-z0-9０-９]/u;
/** Ids appear in URLs and saved data, so they stay to a safe, stable shape. */
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Polite endings: every sentence a traveller says ends in です／ます style (or a request). */
const POLITE_END = /(です|ます|ません|ください|でしょうか|ですか|ますか|ませんか|ました|でした)[。？！]?$/;

/** Problems with one piece of markup; empty when it is well-formed. */
export function checkJp(markup: Jp): string[] {
  if (markup.trim() === "") return [`empty Japanese: "${markup}"`];
  let words;
  try {
    words = parse(markup);
  } catch (err) {
    return [(err as Error).message];
  }
  const problems: string[] = [];
  if (markup.includes("　")) problems.push(`full-width space: ${markup}`);
  for (const word of markup.split(" ")) {
    const slot = SLOT_WORD.exec(word)?.[1];
    if (slot !== undefined) {
      if (!SLOTS.includes(slot)) problems.push(`unknown slot $${slot}: ${markup}`);
      continue;
    }
    if (word.includes("$")) problems.push(`a slot must be a whole word: ${markup}`);
    const core = word.replace(TRAILING_PUNCT, "");
    // An unspaced particle would be romanised "ha"/"wo".
    if (core.endsWith("は") && core !== "は" && !WA_FINAL[core] && !core.endsWith("では") && !core.endsWith("には")) {
      problems.push(`particle は must be its own word: ${markup}`);
    }
    if (core.includes("を") && core !== "を") problems.push(`particle を must be its own word: ${markup}`);
  }
  for (const segment of words.flat()) {
    if (SLOT_WORD.test(segment.text)) continue;
    if (segment.ruby !== undefined && !KANA.test(segment.ruby)) {
      problems.push(`reading must be kana: {${segment.text}|${segment.ruby}}`);
    }
    if (segment.ruby === undefined && NEEDS_READING.test(segment.text)) {
      problems.push(`"${segment.text}" needs a {漢字|かな} reading: ${markup}`);
    }
  }
  return problems;
}

/** True for a real calendar date written YYYY-MM-DD (not 2026-02-30). */
export function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * How many days a verification lasts before the content must be checked
 * against its source again. Cheat sheets describe rules that change (the tax
 * refund system changed on 2026-11-01); emergency numbers rarely do. `comment`
 * covers facts dated only in a source comment with an `@checked` marker
 * followed by the date: allergen lists, dialling rules, tool links.
 */
export const REVERIFY_AFTER_DAYS = { emergency: 365, guide: 180, comment: 365 } as const;

/** Something that says when it was last checked against its sources. */
export interface Checked {
  /** Where to look, e.g. "guide tax-refund" or "src/lib/phone.ts:8". */
  where: string;
  verified: string;
  days: number;
  /** A known date the facts change on: check again by then even if the window hasn't run out. */
  recheckBy?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** The checked content with its windows: emergency numbers and cheat sheets. */
export function checkedContent(content: {
  emergency: Pick<EmergencyNumber, "id" | "verified" | "recheckBy">[];
  guides: Pick<Guide, "id" | "verified" | "recheckBy">[];
}): Checked[] {
  return [
    ...content.emergency.map((e) => ({ where: `emergency ${e.id}`, verified: e.verified, days: REVERIFY_AFTER_DAYS.emergency, recheckBy: e.recheckBy })),
    ...content.guides.map((g) => ({ where: `guide ${g.id}`, verified: g.verified, days: REVERIFY_AFTER_DAYS.guide, recheckBy: g.recheckBy })),
  ];
}

/**
 * The marker a source comment uses for a dated check, written exactly
 * `@checked 2026-10-08`: `@checked`, one space, the date (e.g. inside brackets
 * or before a comment's end). `@checked` is reserved for it: any other use
 * (another case, separator or spelling, no date, a range) is reported with how
 * to write it, so no form slips through unread. Only right after a letter or
 * digit, as in an e-mail address or a handle, is it not a marker. A date
 * written as plain prose ("checked 2026-10-08") is not read and never runs
 * out: docs/content-guide.md §9 makes the marker the rule.
 */
const MARKER_WORD = /(?<![\p{L}\p{N}_])@checked/giu;
/** The date ends the marker: then the line ends, or a space or closing punctuation (not a range or "2026-10-08.1"). */
const MARKER = /^@checked (\d{4}-\d{2}-\d{2})(?=$|[\s)\]};,*]|\.(?!\d))/;

export const MARKER_FORMAT = 'write the marker as "@checked YYYY-MM-DD"';

/**
 * Every `@checked` in a source file, in one pass: each one is a checked entry
 * (checkFreshness rejects an impossible date such as 2026-02-30) or a problem.
 */
export function scanMarkers(path: string, source: string): { checked: Checked[]; problems: string[] } {
  const checked: Checked[] = [];
  const problems: string[] = [];
  source.split("\n").forEach((line, i) => {
    const where = `${path}:${i + 1}`;
    for (const match of line.matchAll(MARKER_WORD)) {
      const date = MARKER.exec(line.slice(match.index))?.[1];
      if (date) checked.push({ where, verified: date, days: REVERIFY_AFTER_DAYS.comment });
      else problems.push(`${where}: "${line.slice(match.index, match.index + 24).trim()}": ${MARKER_FORMAT}`);
    }
  });
  return { checked, problems };
}

/**
 * Entries whose check has run out on `today` (YYYY-MM-DD), or will within
 * `leadDays`, or that are dated in the future or not a real date. Fix a problem
 * by checking the content against its sources again, then updating the date;
 * never by moving the date alone.
 */
export function checkFreshness(entries: Checked[], today: string, leadDays = 0): string[] {
  if (!isDate(today)) throw new Error(`today must be YYYY-MM-DD, got "${today}"`);
  if (!Number.isInteger(leadDays) || leadDays < 0) throw new Error(`leadDays must be a whole number of days, got ${leadDays}`);
  const problems: string[] = [];
  for (const { where, verified, days, recheckBy } of entries) {
    if (!isDate(verified)) {
      problems.push(`${where}: "${verified}" is not a date`);
      continue;
    }
    // A day of slack: a date written in Taiwan's morning is still "yesterday" in UTC.
    if (verified > addDays(today, 1)) {
      problems.push(`${where}: verified ${verified} is in the future`);
      continue;
    }
    const window = addDays(verified, days);
    // A change date already passed when the entry was last checked has been dealt with.
    const due = recheckBy && isDate(recheckBy) && recheckBy > verified && recheckBy < window ? recheckBy : window;
    if (due <= today) problems.push(`${where}: verified ${verified}, re-verification was due ${due}`);
    else if (due <= addDays(today, leadDays)) problems.push(`${where}: verified ${verified}, re-verification due ${due}`);
  }
  return problems;
}

/** Minimum counts per scene. */
export const MIN_PHRASES = 12;
export const MIN_TRANSPORT_PHRASES = 18;
export const MIN_HEARD = 4;

/** Phrases the transport scene must have, by id. */
export const REQUIRED_TRANSPORT = [
  "transport-want-to-go",
  "transport-stops-at",
  "transport-rode-past",
  "transport-wrong-ticket",
  "transport-ic-short",
  "transport-which-platform",
];

/** Problems with all content; empty when it is ready to ship. */
export function validateContent(content: {
  scenes: Scene[];
  rescue: Phrase[];
  presets: Record<string, Preset[]>;
  emergency: EmergencyNumber[];
  guides: Guide[];
  extra: Record<string, Jp>;
}): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const need = (ok: boolean, where: string, what: string) => {
    if (!ok) problems.push(`${where}: ${what}`);
  };
  const jp = (markup: Jp, where: string) => {
    for (const issue of checkJp(markup)) problems.push(`${where}: ${issue}`);
  };
  const id = (value: string, where: string) => {
    need(KEBAB.test(value), where, `id "${value}" must be kebab-case`);
    need(!ids.has(value), where, `duplicate id "${value}"`);
    ids.add(value);
  };
  const text = (value: string | undefined, where: string, what: string) =>
    need((value ?? "").trim().length > 0, where, `missing ${what}`);
  const replies = (list: Reply[], where: string) => {
    need(list.length >= 2, where, "needs at least 2 replies");
    list.forEach((reply, i) => {
      jp(reply.jp, `${where} reply ${i}`);
      text(reply.zh, `${where} reply ${i}`, "Chinese");
    });
  };
  const phrase = (p: Phrase, where: string, scene?: string) => {
    id(p.id, where);
    if (scene) need(p.id.startsWith(`${scene}-`), where, `id must start with "${scene}-"`);
    text(p.zh, where, "Chinese");
    jp(p.jp, where);
    need(POLITE_END.test(plain(p.jp)), where, `should end politely (です／ます): ${p.jp}`);
    if (slotsOf(p.jp).length > 0) {
      need(p.fallback !== undefined, where, "a phrase with a slot needs a fallback");
      need(p.fallbackZh !== undefined, where, "a phrase with a slot needs fallbackZh");
    }
    if (p.fallback !== undefined) {
      jp(p.fallback, `${where} fallback`);
      need(slotsOf(p.fallback).length === 0, where, "the fallback cannot have slots");
    }
    if (Array.isArray(p.answers)) replies(p.answers, where);
    else if (p.answers !== undefined) need(Object.hasOwn(REPLY_SETS, p.answers), where, `unknown answer set ${p.answers}`);
  };

  for (const [name, set] of Object.entries(REPLY_SETS)) replies(set, `reply set ${name}`);

  for (const scene of content.scenes) {
    const where = `scene ${scene.id}`;
    text(scene.title, where, "title");
    const min = scene.id === "transport" ? MIN_TRANSPORT_PHRASES : MIN_PHRASES;
    need(scene.phrases.length >= min, where, `needs at least ${min} phrases, has ${scene.phrases.length}`);
    need(scene.heard.length >= MIN_HEARD, where, `needs at least ${MIN_HEARD} "店員可能會說", has ${scene.heard.length}`);
    scene.phrases.forEach((p, i) => phrase(p, `${where} phrase ${i} (${p.id})`, scene.id));
    const groupIds = (scene.groups ?? []).map((g) => g.id);
    need(new Set(groupIds).size === groupIds.length, where, "duplicate group ids");
    for (const p of scene.phrases) {
      if (scene.groups) need(p.group !== undefined && groupIds.includes(p.group), where, `${p.id} needs a group from ${groupIds.join("/")}`);
      else need(p.group === undefined, where, `${p.id} has a group but the scene has none`);
    }
    for (const g of scene.groups ?? []) {
      text(g.title, `${where} group ${g.id}`, "title");
      need(scene.phrases.some((p) => p.group === g.id), where, `group ${g.id} is empty`);
    }
    scene.heard.forEach((heard, i) => {
      const at = `${where} heard ${i} (${heard.id})`;
      id(heard.id, at);
      need(heard.id.startsWith(`${scene.id}-heard-`), at, `id must start with "${scene.id}-heard-"`);
      jp(heard.jp, at);
      text(heard.zh, at, "Chinese");
      replies(heard.replies, at);
    });
  }
  const transport = content.scenes.find((s) => s.id === "transport");
  for (const required of REQUIRED_TRANSPORT) {
    need(transport?.phrases.some((p) => p.id === required) ?? false, "scene transport", `missing required phrase ${required}`);
  }

  content.rescue.forEach((p, i) => phrase(p, `rescue ${i} (${p.id})`, "rescue"));

  for (const [name, list] of Object.entries(content.presets)) {
    const local = new Set<string>();
    list.forEach((preset, i) => {
      const where = `${name} ${i} (${preset.id})`;
      need(KEBAB.test(preset.id), where, "id must be kebab-case");
      need(!local.has(preset.id), where, "duplicate id");
      local.add(preset.id);
      text(preset.zh, where, "Chinese");
      jp(preset.jp, where);
    });
  }

  for (const entry of content.emergency) {
    const where = `emergency ${entry.id}`;
    need(/^https:\/\//.test(entry.source), where, "needs an https source");
    need(isDate(entry.verified), where, "needs a verified date");
    need(entry.recheckBy === undefined || isDate(entry.recheckBy), where, "recheckBy must be a date");
    need(/^\+?[\d-]+$/.test(entry.number), where, "number must be digits and hyphens");
    text(entry.title, where, "title");
    text(entry.when, where, "when to call");
  }

  for (const guide of content.guides) {
    const where = `guide ${guide.id}`;
    id(guide.id, where);
    text(guide.title, where, "title");
    text(guide.summary, where, "summary");
    need(guide.steps.length > 0, where, "needs steps");
    guide.steps.forEach((step, i) => {
      text(step.title, `${where} step ${i}`, "title");
      text(step.body, `${where} step ${i}`, "body");
    });
    need(guide.sources.length > 0 && guide.sources.every((url) => /^https:\/\//.test(url)), where, "needs https sources");
    need(isDate(guide.verified), where, "needs a verified date");
    need(guide.recheckBy === undefined || isDate(guide.recheckBy), where, "recheckBy must be a date");
  }

  for (const [name, markup] of Object.entries(content.extra)) jp(markup, name);
  return problems;
}
