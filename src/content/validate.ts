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
    need(/^\d{4}-\d{2}-\d{2}$/.test(entry.verified), where, "needs a verified date");
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
    need(/^\d{4}-\d{2}-\d{2}$/.test(guide.verified), where, "needs a verified date");
  }

  for (const [name, markup] of Object.entries(content.extra)) jp(markup, name);
  return problems;
}
