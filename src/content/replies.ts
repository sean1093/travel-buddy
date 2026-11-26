import type { Reply, ReplySet } from "./types";

/**
 * Every set ends with わかりません, so the other person is never forced to guess, except
 * `borrow` (may I use the toilet?), where a clerk always knows the answer.
 */
export const DONT_KNOW: Reply = { jp: "わかりません", zh: "不知道" };

/** For an answer the list doesn't have: every set but yes/no offers it (see repliesFor). */
export const WRITE_IT: Reply = { jp: "{紙|かみ} に {書|か}きます", zh: "對方會寫給你看（請準備紙筆）" };

/** 1番線 … 16番線, read as station announcements say them. */
const PLATFORM_KANA = [
  "いちばんせん",
  "にばんせん",
  "さんばんせん",
  "よんばんせん",
  "ごばんせん",
  "ろくばんせん",
  "ななばんせん",
  "はちばんせん",
  "きゅうばんせん",
  "じゅうばんせん",
  "じゅういちばんせん",
  "じゅうにばんせん",
  "じゅうさんばんせん",
  "じゅうよんばんせん",
  "じゅうごばんせん",
  "じゅうろくばんせん",
];

/** Ready-made answers for "給對方點選", shared by many phrases. */
export const REPLY_SETS: Record<ReplySet, Reply[]> = {
  yesNo: [{ jp: "はい", zh: "是／對" }, { jp: "いいえ", zh: "不是／不對" }, DONT_KNOW],
  platform: [
    // Big stations (JR Shinjuku) go up to 16; a higher number is what 紙に書きます is for.
    ...PLATFORM_KANA.map((_, i) => i + 1).map((n) => ({
      jp: `{${n}番線|${PLATFORM_KANA[n - 1]}}`,
      zh: `${n} 號月台`,
    })),
    DONT_KNOW,
  ],
  direction: [
    { jp: "{右|みぎ}", zh: "右邊 →" },
    { jp: "{左|ひだり}", zh: "← 左邊" },
    { jp: "まっすぐ", zh: "↑ 直走" },
    { jp: "{後|うし}ろ", zh: "後面（往回走）" },
    { jp: "{上|うえ} の {階|かい}", zh: "樓上" },
    { jp: "{下|した} の {階|かい}", zh: "樓下" },
    { jp: "ここ です", zh: "就是這裡" },
    DONT_KNOW,
  ],
  time: [
    { jp: "すぐ です", zh: "馬上" },
    { jp: "{5分|ごふん} ぐらい", zh: "大約 5 分鐘" },
    { jp: "{10分|じゅっぷん} ぐらい", zh: "大約 10 分鐘" },
    { jp: "{30分|さんじゅっぷん} ぐらい", zh: "大約 30 分鐘" },
    { jp: "{1時間|いちじかん} ぐらい", zh: "大約 1 小時" },
    DONT_KNOW,
  ],
  place: [
    { jp: "この {近|ちか}く", zh: "就在附近" },
    { jp: "{遠|とお}い です", zh: "很遠" },
    { jp: "{駅|えき} の {中|なか}", zh: "在車站裡面" },
    { jp: "{駅|えき} の {外|そと}", zh: "在車站外面" },
    { jp: "ありません", zh: "沒有" },
    DONT_KNOW,
  ],
  // Exits are named by direction at most stations; numbered exits (A3…) vary too much to list,
  // so the other person can write the name instead.
  exit: [
    { jp: "{東口|ひがしぐち}", zh: "東口" },
    { jp: "{西口|にしぐち}", zh: "西口" },
    { jp: "{南口|みなみぐち}", zh: "南口" },
    { jp: "{北口|きたぐち}", zh: "北口" },
    { jp: "{中央口|ちゅうおうぐち}", zh: "中央口" },
    WRITE_IT,
    DONT_KNOW,
  ],
  // May I use the toilet? — a clerk says yes or no, never "I don't know".
  borrow: [
    { jp: "どうぞ", zh: "可以，請用" },
    { jp: "{申|もう}し{訳|わけ} ありません、お{貸|か}し できません", zh: "不好意思，不能借" },
    { jp: "トイレ は ありません", zh: "這裡沒有廁所" },
  ],
  // Is this medicine OK with my allergy? — はい／いいえ would be ambiguous.
  medicineOk: [
    { jp: "{飲|の}んで も {大丈夫|だいじょうぶ} です", zh: "可以吃" },
    { jp: "{飲|の}まないで ください", zh: "不要吃" },
    { jp: "{薬剤師|やくざいし} に {確認|かくにん} します", zh: "對方會去問藥劑師" },
    DONT_KNOW,
  ],
};


/** Sets whose answers are all there is: nothing to write down. */
const CLOSED: ReplySet[] = ["yesNo", "borrow", "medicineOk"];

/**
 * The answers to offer. A named set of places, times or numbers also offers
 * 紙に書きます before its わかりません, so an answer it lacks can still be
 * given. A phrase's own list is offered as written.
 */
export function repliesFor(answers: ReplySet | Reply[]): Reply[] {
  if (Array.isArray(answers)) return answers;
  const list = REPLY_SETS[answers];
  if (CLOSED.includes(answers) || list.some((r) => r.jp === WRITE_IT.jp)) return list;
  const last = list.at(-1);
  return last?.jp === DONT_KNOW.jp ? [...list.slice(0, -1), WRITE_IT, last] : [...list, WRITE_IT];
}
