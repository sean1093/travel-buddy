/**
 * Phone numbers as typed in the setup form, turned into something a person
 * in Japan can dial.
 *
 * From a Japanese phone, an international call is 010 + country code +
 * the number without its leading 0 (a mobile may type "+" instead of 010).
 * Sources: NTT docomo, https://www.docomo.ne.jp/service/world/worldcall/call/ ;
 * au, https://www.au.com/mobile/service/global/call/ (@checked 2026-10-08).
 */

export interface Dialable {
  /** For `tel:` links: digits with an optional leading "+". */
  tel: string;
  /** As shown on screen, e.g. "+886 912-345-678". */
  display: string;
  /** How to dial it from a Japanese phone, when it is not a Japanese number. */
  fromJapan: string | null;
}

/** Digits and hyphens, with any "+" or "00" prefix kept apart. */
function clean(input: string): { intl: boolean; body: string } {
  let s = input.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[ー－‐−–—]/g, "-");
  s = s.replace(/[^\d+-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (s.startsWith("+")) return { intl: true, body: s.slice(1).replace(/\+/g, "").replace(/^-/, "") };
  if (s.startsWith("00")) return { intl: true, body: s.slice(2).replace(/^-/, "") };
  return { intl: false, body: s.replace(/\+/g, "") };
}

const COUNTRY_CODES = ["886", "81", "852", "853", "86", "1", "44", "65", "60", "82"];

/**
 * `home` is where a number without a country code is assumed to be:
 * Taiwan for family, Japan for hotels and local contacts.
 */
export function dialable(input: string, home: "tw" | "jp"): Dialable | null {
  const { intl, body } = clean(input);
  const digits = body.replace(/-/g, "");
  if (digits.length < 4) return null;
  let country: string;
  let national: string;
  if (intl) {
    country = COUNTRY_CODES.find((code) => digits.startsWith(code)) ?? digits.slice(0, 3);
    // Keep the typed grouping after the country code.
    national = body.replace(new RegExp(`^${country.split("").join("-?")}-?`), "").replace(/^0-?/, "");
  } else {
    country = home === "tw" ? "886" : "81";
    national = body.replace(/^0-?/, "");
  }
  const nationalDigits = national.replace(/-/g, "");
  if (country === "81") {
    const domestic = `0${national}`;
    return { tel: `0${nationalDigits}`, display: domestic, fromJapan: null };
  }
  return {
    tel: `+${country}${nationalDigits}`,
    display: `+${country} ${national}`,
    fromJapan: `010-${country}-${national}`,
  };
}
