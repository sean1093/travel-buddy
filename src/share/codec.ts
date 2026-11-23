import { deflateSync, inflateSync, strFromU8, strToU8 } from "fflate";
import { asRecord } from "../lib/store";
import { parseProfile, type Profile } from "../profile/profile";

/**
 * A profile travels inside the share link, after the `#`, which browsers
 * never send to a server:
 *
 *   …/#/s/1.<payload>
 *   payload = base64url( deflate-raw( UTF-8( JSON( wire ) ) ) )
 *
 * `wire` is the profile with short keys and empty fields left out. The "1."
 * is the format version: a new format gets a new number, and old links keep
 * decoding. Compression is fflate rather than CompressionStream, which
 * phones older than iOS 16.4 lack.
 */
export const SHARE_PREFIX = "#/s/";
const VERSION = "1";

/**
 * Short wire keys for each profile field. A nested object maps its own
 * fields; arrays of objects map their items' fields.
 */
type KeyMap = { [field: string]: string | [string, KeyMap] };

const CONTACT: KeyMap = { relation: "r", name: "n", phone: "t" };
const KEYS: KeyMap = {
  callName: "n",
  passportName: "p",
  birthYear: "y",
  hotels: ["h", { name: "n", kana: "k", address: "a", phone: "t", from: "f", to: "o" }],
  places: ["d", { kind: "s", name: "n", kana: "k", zh: "z", date: "d", note: "e" }],
  contacts: ["c", CONTACT],
  localContact: ["l", CONTACT],
  health: [
    "m",
    {
      conditions: "c",
      conditionsOther: "co",
      meds: ["md", { ingredient: "i", dose: "d" }],
      drugAllergies: "da",
      foodAllergies: "fa",
      diets: "di",
      allergyOther: "ao",
      bloodType: "b",
    },
  ],
  insurance: ["i", { company: "c", policy: "p", phone: "t" }],
};

function isBlank(value: unknown): boolean {
  if (value === "" || value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as object).length === 0;
  return false;
}

/** Profile → wire: rename keys, drop blanks. The station/place kind is the default, so only "place" is written. */
function pack(value: unknown, map: KeyMap): unknown {
  if (Array.isArray(value)) return value.map((item) => pack(item, map));
  const record = asRecord(value);
  if (!record) return value;
  const out: Record<string, unknown> = {};
  for (const [field, spec] of Object.entries(map)) {
    let item = record[field];
    if (field === "kind" && item === "station") continue;
    if (Array.isArray(spec)) item = pack(item, spec[1]);
    if (!isBlank(item)) out[Array.isArray(spec) ? spec[0] : spec] = item;
  }
  return out;
}

/** Wire → profile-shaped data, for parseProfile to validate. */
function unpack(value: unknown, map: KeyMap): unknown {
  if (Array.isArray(value)) return value.map((item) => unpack(item, map));
  const record = asRecord(value);
  if (!record) return value;
  const out: Record<string, unknown> = {};
  for (const [field, spec] of Object.entries(map)) {
    const key = Array.isArray(spec) ? spec[0] : spec;
    if (!Object.hasOwn(record, key)) continue;
    out[field] = Array.isArray(spec) ? unpack(record[key], spec[1]) : record[key];
  }
  return out;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** The part after `#/s/`. */
export function encodeProfile(profile: Profile): string {
  const json = JSON.stringify(pack(profile, KEYS));
  return `${VERSION}.${toBase64Url(deflateSync(strToU8(json), { level: 9 }))}`;
}

/** Links longer than this are not something anyone typed or shared on purpose. */
const MAX_PAYLOAD = 6000;
/** Inflated JSON beyond this is a decompression bomb, not a profile. */
const MAX_JSON = 64 * 1024;

/** The profile in a share payload, or null when the link is damaged or not ours. */
export function decodeProfile(payload: string): Profile | null {
  const match = /^(\d+)\.([A-Za-z0-9_-]+)$/.exec(payload);
  if (!match || match[1] !== VERSION || payload.length > MAX_PAYLOAD) return null;
  try {
    const json = inflateSync(fromBase64Url(match[2]!), { out: new Uint8Array(MAX_JSON) });
    return parseProfile(unpack(JSON.parse(strFromU8(json)), KEYS));
  } catch {
    return null;
  }
}

/**
 * LINE opens links in its own browser, whose storage the phone's browser and a
 * home-screen icon never see: an import there would look lost the next day.
 * This query asks LINE to open the phone's browser instead; elsewhere it is
 * ignored, and the import screen removes it from the address bar.
 */
export const OPEN_EXTERNAL = "?openExternalBrowser=1";

/**
 * The full link to this app with `profile` in the fragment. The QR code uses
 * it too: many people scan with LINE's own reader, which opens LINE's browser.
 */
export function shareUrl(profile: Profile, base = `${location.origin}${location.pathname}`): string {
  return `${base}${OPEN_EXTERNAL}${SHARE_PREFIX}${encodeProfile(profile)}`;
}
