import { CONDITIONS, DIETS, DRUG_ALLERGIES, FOOD_ALLERGIES, presetsById } from "../content/medical";
import type { Jp, Preset } from "../content/types";
import { plain, userWord } from "../lib/jp";
import { dialable } from "../lib/phone";
import { type Contact, currentHotel, type Hotel, type Place, type Profile } from "./profile";

/**
 * The cards built from the saved profile — shown on screen, read aloud and
 * printed. Japanese for the person helping, Chinese in small print for the
 * traveller. Pure data, so tests can check every sentence.
 */
/**
 * A phone number, kept apart from plain text so every renderer can keep the
 * digits on one line instead of guessing from the text.
 */
export interface PhoneLine {
  phone: string;
  /** What the number is, before it (default TEL), e.g. 日本の電話から for the 010 form. */
  label?: string;
}

/** One extra line of a card: plain text, or a phone number. */
export type Line = string | PhoneLine;

/** The line as plain text, for print and copying. */
export function lineText(line: Line): string {
  if (typeof line === "string") return line;
  return line.label ? `（${line.label}：${line.phone}）` : `TEL ${line.phone}`;
}

export interface CardBlock {
  jp: Jp;
  zh: string;
  /** Lines shown as they are (names, addresses, numbers); never read aloud. */
  extra: Line[];
  /** What a doctor must not miss (allergies): shown in the alert colour. */
  alert?: boolean;
  /** What 播放 says, when it is more than `jp` (the hotel's name after "this hotel"). */
  say?: Jp;
}

export const LINES = {
  sorry: "すみません。{日本語|にほんご} が {話|はな}せません。",
  fromTaiwan: "{台湾|たいわん} から {来|き}た {旅行者|りょこうしゃ} です。",
  lost: "{道|みち} に {迷|まよ}って しまいました。{助|たす}けて ください。",
  backToHotel: "この ホテル に {帰|かえ}りたい です。{行|い}き{方|かた} を {教|おし}えて ください。",
  taxiToHotel: "この ホテル まで お{願|ねが}い します。",
  callFamily: "{家族|かぞく} に {電話|でんわ} を して いただけません か。",
  // The number's owner, not the traveller, is the acquaintance: 「知り合いです」 alone read as "I am".
  callLocal: "{日本|にほん} に いる {知人|ちじん} の {電話番号|でんわばんごう} です。こちら に {電話|でんわ} して いただけません か。",
  koban: "{近|ちか}く の {交番|こうばん} は どこ です か。",
  callPolice: "{警察|けいさつ} を {呼|よ}んで ください。",
  wantElevator: "エレベーター を {使|つか}いたい です。",
} satisfies Record<string, Jp>;

/** Japanese for the name a phrase slot shows: 新宿 → 新宿駅 for a station when `withEki`. */
export function placeWord(place: Place, withEki: boolean): Jp {
  const base = place.name.replace(/駅$/, "");
  const kana = place.kana.replace(/えき$|エキ$/, "");
  const word = userWord(base, kana);
  if (!withEki || place.kind !== "station") return word;
  return `${word}{駅|えき}`;
}

export function hotelWord(hotel: Hotel): Jp {
  return userWord(hotel.name, hotel.kana);
}

/** Address and phone of a hotel, as lines for the card. (〒 marks a postal code, so the address gets 住所.) */
export function hotelLines(hotel: Hotel): Line[] {
  const phone = dialable(hotel.phone, "jp");
  return [hotel.name, hotel.address ? `住所：${hotel.address}` : "", phone ? { phone: phone.display } : ""].filter(
    (line): line is Line => Boolean(line),
  );
}

/**
 * Relations as a Japanese reader reads them. Typed in Chinese, 女兒 looks like
 * 女児 (a girl child) in a Japanese font; anything not listed stays as typed.
 */
const RELATIONS: Record<string, string> = {
  女兒: "娘",
  兒子: "息子",
  先生: "夫",
  老公: "夫",
  丈夫: "夫",
  太太: "妻",
  老婆: "妻",
  妻子: "妻",
  爸爸: "父",
  父親: "父",
  媽媽: "母",
  母親: "母",
  哥哥: "兄",
  弟弟: "弟",
  姊姊: "姉",
  姐姐: "姉",
  妹妹: "妹",
  朋友: "友人",
  家人: "家族",
  孫子: "孫",
  孫女: "孫",
  媳婦: "義理の娘",
  女婿: "義理の息子",
};

export const relationJa = (relation: string) => RELATIONS[relation.trim()] ?? relation.trim();

/** A contact as lines a Japanese helper can dial from. */
export function contactLines(contact: Contact, home: "tw" | "jp"): Line[] {
  const phone = dialable(contact.phone, home);
  const who = [relationJa(contact.relation), contact.name].filter(Boolean).join("　");
  if (!phone) return [who].filter(Boolean);
  const lines: Line[] = [who, { phone: phone.display }];
  // How a Japanese phone reaches a Taiwanese number: the helper will not know.
  if (phone.fromJapan) lines.push({ phone: phone.fromJapan, label: "日本の電話から" });
  return lines.filter(Boolean);
}

/** An age known only from the birth year: before the birthday they are a year younger. */
const age = (years: number) => (years <= 0 ? "0歳" : `${years - 1}〜${years}歳`);

/** The name as a passport prints it. */
const passport = (profile: Profile) => profile.passportName.trim().toUpperCase();

/** The "I need help" card: who I am, I'm lost, my hotel, call my family. */
export function helpCard(profile: Profile, day?: string): CardBlock[] {
  const blocks: CardBlock[] = [
    {
      jp: `${LINES.sorry} ${LINES.fromTaiwan}`,
      zh: "不好意思，我不會說日文。我是從台灣來的旅客。",
      extra: passport(profile) ? [`名前：${passport(profile)}`] : [],
    },
    { jp: LINES.lost, zh: "我迷路了，請幫幫我。", extra: [] },
  ];
  const hotel = currentHotel(profile, day);
  if (hotel) blocks.push({ jp: LINES.backToHotel, zh: "我想回這間飯店，請告訴我怎麼走。", extra: hotelLines(hotel) });
  const family = profile.contacts[0];
  if (family) blocks.push({ jp: LINES.callFamily, zh: "可以幫我打電話給家人嗎？", extra: contactLines(family, "tw") });
  if (profile.localContact.phone) {
    blocks.push({ jp: LINES.callLocal, zh: "可以幫我打這支電話嗎？這是我在日本的朋友。", extra: contactLines(profile.localContact, "jp") });
  }
  return blocks;
}

/** For a taxi driver or anyone giving directions. */
export function hotelCard(hotel: Hotel): CardBlock {
  return { jp: LINES.taxiToHotel, zh: "請載我到這間飯店。", extra: hotelLines(hotel), say: hotelSay(hotel) };
}

/** Said to a driver: the hotel by name (its reading, when typed), not just "this hotel". */
export function hotelSay(hotel: Hotel): Jp {
  const word = hotelWord(hotel);
  return plain(word).trim() ? `${word} まで お{願|ねが}い します。` : LINES.taxiToHotel;
}

const JOIN = "、";

/** Preset Japanese for the ids, then the free text, as one plain line. */
function presetLine(list: Preset[], ids: string[], other = ""): string {
  return [...presetsById(list, ids).map((p) => plain(p.jp)), other.trim()].filter(Boolean).join(JOIN);
}

/**
 * The medical card for a doctor, paramedic or pharmacist. Labels are
 * Japanese; free text stays as typed (the form asks for English, which
 * Japanese doctors read).
 */
export function medicalCard(profile: Profile, now = new Date()): CardBlock[] {
  const h = profile.health;
  const year = now.getFullYear();
  const person = [
    passport(profile) && `名前：${passport(profile)}`,
    // Only the year is known: before the birthday they are a year younger.
    profile.birthYear && `生年：${profile.birthYear}年（${age(year - profile.birthYear)}）`,
    "国籍：台湾",
    h.bloodType && `血液型：${h.bloodType}型`,
  ].filter((line): line is string => Boolean(line));
  // A question never answered is 未記入 (not filled in), never なし (none): a doctor reads なし as
  // "no allergies". Once some allergy (or some condition or medicine) is entered, the rest of that
  // question is taken as none. A diet, insurance or a blood type answers neither.
  const allergiesAnswered = h.drugAllergies.length > 0 || h.foodAllergies.length > 0 || Boolean(h.allergyOther.trim());
  const healthAnswered = h.conditions.length > 0 || Boolean(h.conditionsOther.trim()) || h.meds.length > 0;
  const none = (section: "health" | "allergy") => ((section === "health" ? healthAnswered : allergiesAnswered) ? "なし" : "未記入");
  const conditions = presetLine(CONDITIONS, h.conditions, h.conditionsOther);
  const drugs = presetLine(DRUG_ALLERGIES, h.drugAllergies);
  const foods = presetLine(FOOD_ALLERGIES, h.foodAllergies, h.allergyOther);
  const blocks: CardBlock[] = [
    // First, before even the name: what a doctor must not miss, on the first screen at any text size.
    {
      jp: "{薬|くすり} と {食|た}べ{物|もの} の アレルギー です。",
      zh: "藥物和食物過敏。",
      extra: [`薬のアレルギー：${drugs || none("allergy")}`, foods && `食物アレルギー：${foods}`].filter(
        (line): line is string => Boolean(line),
      ),
      alert: true,
    },
    { jp: "{私|わたし} の {医療|いりょう} {情報|じょうほう} です。", zh: "這是我的醫療資料。", extra: person },
    {
      jp: "{持病|じびょう} と {服用中|ふくようちゅう} の {薬|くすり} です。",
      zh: "慢性病和常吃的藥。",
      extra: [
        `持病：${conditions || none("health")}`,
        h.meds.length > 0 ? "服用中の薬：" : `服用中の薬：${none("health")}`,
        ...h.meds.map((m) => `・${[m.ingredient, m.dose].filter(Boolean).join(" ")}`),
      ],
    },
  ];
  const family = profile.contacts[0];
  if (family) blocks.push({ jp: "{家族|かぞく} の {連絡先|れんらくさき} です。", zh: "家人的聯絡方式。", extra: contactLines(family, "tw") });
  const ins = profile.insurance;
  if (ins.company || ins.policy || ins.phone) {
    const phone = dialable(ins.phone, "tw");
    blocks.push({
      jp: "{海外旅行|かいがいりょこう} {保険|ほけん} に {入|はい}って います。",
      zh: "我有保旅遊保險。",
      extra: [ins.company, ins.policy && `証券番号：${ins.policy}`, phone && { phone: phone.display }].filter(
        (line): line is Line => Boolean(line),
      ),
    });
  }
  return blocks;
}

/** The allergy and diet card for restaurants, or null when nothing applies. */
export function allergyCard(profile: Profile): CardBlock[] | null {
  const h = profile.health;
  const foods = [...presetsById(FOOD_ALLERGIES, h.foodAllergies).map((p) => plain(p.jp)), h.allergyOther.trim()].filter(Boolean);
  const diets = presetsById(DIETS, h.diets);
  const blocks: CardBlock[] = [];
  if (foods.length > 0) {
    blocks.push({
      jp: "{食物|しょくもつ} アレルギー が あります。{次|つぎ} の もの が {入|はい}った {料理|りょうり} は {食|た}べられません。",
      zh: `我對食物過敏，有放這些東西的料理我不能吃：${presetsById(FOOD_ALLERGIES, h.foodAllergies)
        .map((p) => p.zh)
        .concat(h.allergyOther.trim() ? [h.allergyOther.trim()] : [])
        .join("、")}`,
      extra: foods.map((food) => `・${food}`),
    });
  }
  for (const diet of diets) blocks.push({ jp: diet.jp, zh: diet.zh, extra: [] });
  if (blocks.length === 0) return null;
  blocks.push({
    jp: "{入|はい}って いる か どう か、{教|おし}えて いただけません か。",
    zh: "可以告訴我料理裡有沒有放嗎？",
    extra: [],
  });
  return blocks;
}
