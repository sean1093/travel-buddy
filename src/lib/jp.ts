import { TRAILING_PUNCT, wordToRomaji } from "./romaji";

/**
 * Japanese markup (from Ippo, github.com/sean1093/ippo) — one string per
 * piece of Japanese:
 *   - words are separated by single ASCII spaces: `わたし は がくせい です。`
 *   - kanji carry their reading in braces: `{私|わたし} は {学生|がくせい} です。`
 *   - a word made only of `$name` is a slot, filled from the traveller's data
 *     before display: `$stop に {止|と}まります か。`
 *
 * Everything else derives from it: the ruby display, the text handed to the
 * speech engine, the kana reading and the romaji.
 */

/** A run of text; `ruby` is set when the run is kanji with its kana reading. */
export interface Segment {
  text: string;
  ruby?: string;
}

export class MarkupError extends Error {}

/** A whole word that is a slot, e.g. `$dest`. */
export const SLOT_WORD = /^\$([a-z]+)$/;

/** Words of the markup, each a list of segments. Throws on malformed markup. */
export function parse(markup: string): Segment[][] {
  // No markup is no words; spaces with nothing between them are still an error below.
  if (markup === "") return [];
  return markup.split(" ").map((word) => {
    const segments: Segment[] = [];
    let rest = word;
    while (rest) {
      const open = rest.indexOf("{");
      const text = open === -1 ? rest : rest.slice(0, open);
      if (/[}|]/.test(text)) throw new MarkupError(`stray "}" or "|": ${markup}`);
      if (text) segments.push({ text });
      if (open === -1) break;
      const close = rest.indexOf("}", open);
      if (close === -1) throw new MarkupError(`unclosed "{": ${markup}`);
      const [base, ruby, ...extra] = rest.slice(open + 1, close).split("|");
      if (!base || !ruby || extra.length > 0 || base.includes("{")) {
        throw new MarkupError(`expected {漢字|かな}: ${markup}`);
      }
      segments.push({ text: base, ruby });
      rest = rest.slice(close + 1);
    }
    if (segments.length === 0) throw new MarkupError(`empty word (double space?): "${markup}"`);
    return segments;
  });
}

/** Slot names used in `markup`, in order. */
export function slotsOf(markup: string): string[] {
  return markup.split(" ").flatMap((word) => SLOT_WORD.exec(word)?.[1] ?? []);
}

/**
 * Replaces each slot word with its value's markup. A slot without a value is
 * left as is, so callers check `slotsOf` first and use a fallback instead.
 */
export function fillSlots(markup: string, values: Partial<Record<string, string>>): string {
  return markup
    .split(" ")
    .map((word) => {
      const name = SLOT_WORD.exec(word)?.[1];
      return name !== undefined ? (values[name] ?? word) : word;
    })
    .join(" ");
}

/**
 * Markup for text someone typed (a station, a hotel), as a single word:
 * braces and pipes are dropped so it cannot break the parser, and spaces
 * become no-break spaces so "Hotel Gracery" stays one readable word.
 * `kana` is the optional reading; it becomes ruby over the whole name.
 */
export function userWord(text: string, kana = ""): string {
  const clean = (value: string) => value.replace(/[{}|$]/g, "").trim().replace(/\s+/g, " ");
  const base = clean(text);
  const reading = clean(kana).replace(/ /g, "");
  if (!base) return "";
  return reading && KANA.test(reading) ? `{${base}|${reading}}` : base;
}

/** Hiragana, katakana and the long-vowel mark. */
export const KANA = /^[ぁ-ゖァ-ヺー]+$/;

/** Kanji text without spaces: what the speech engine reads and screen readers announce. */
export function plain(markup: string): string {
  return parse(markup)
    .map((word) => word.map((s) => s.text).join(""))
    .join("");
}

/** Kana reading of each word. */
export function readings(markup: string): string[] {
  return parse(markup).map((word) => word.map((s) => s.ruby ?? s.text).join(""));
}

/**
 * Romaji for one word's reading, or "" when the reading is not all kana
 * (a typed station name without its reading): half-converted romaji would
 * only mislead.
 */
export function wordRomaji(reading: string): string {
  const core = reading.replace(TRAILING_PUNCT, "").replace(/[、：・]/g, "");
  if (core && !KANA.test(core)) return "";
  return wordToRomaji(reading.replace(/[：・]/g, ""));
}

export function romaji(markup: string): string {
  return readings(markup).map(wordRomaji).filter(Boolean).join(" ");
}
