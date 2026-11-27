import { describe, expect, it } from "vitest";
import { EMERGENCY_NUMBERS } from "../src/content/emergency";
import { SCENES } from "../src/content/scenes";
import { checkJp } from "../src/content/validate";
import { plain } from "../src/lib/jp";
import { allergyCard, contactLines, helpCard, hotelCard, LINES, lineText, medicalCard, placeWord } from "../src/profile/cards";
import { ready } from "../src/profile/fill";
import { emptyProfile } from "../src/profile/profile";
import { sampleProfile } from "./fixtures";

describe("fixed lines", () => {
  it.each(Object.entries(LINES))("%s is well-formed", (_, markup) => {
    expect(checkJp(markup)).toEqual([]);
  });
});

describe("help card", () => {
  it("works without any data", () => {
    const blocks = helpCard(emptyProfile());
    expect(blocks.map((b) => plain(b.jp))).toEqual([
      "すみません。日本語が話せません。台湾から来た旅行者です。",
      "道に迷ってしまいました。助けてください。",
    ]);
  });

  it("brings in the hotel for the night and the family's number", () => {
    const blocks = helpCard(sampleProfile(), "2026-11-06");
    expect(blocks[0]?.extra).toEqual(["名前：LIN MEI-HUA"]);
    expect(blocks[2]?.extra).toContain("京都タワーホテル");
    // Relations in Japanese: 女兒 reads like 女児 (a girl) in a Japanese font.
    // The typed word in brackets: 娘 alone reads as "mother" to the traveller.
    expect(blocks[3]?.extra).toEqual(["娘（女兒）　林小美", { phone: "+886 912-345-678" }, { phone: "010-886-912-345-678", label: "日本の電話から" }]);
    expect(blocks[4]?.extra).toEqual(["友人（朋友）　田中", { phone: "090-1234-5678" }]);
    // 播放 names the hotel (by its reading), not just "this hotel".
    expect(plain(blocks[2]!.say!)).toBe("きょうとたわーほてるに帰りたいです。行き方を教えてください。");
    // The number belongs to the acquaintance; the traveller is not one.
    expect(plain(blocks[4]!.jp)).toBe("日本にいる知人の電話番号です。こちらに電話していただけませんか。");
    for (const block of blocks) expect(checkJp(block.jp)).toEqual([]);
  });

  it("makes a taxi card that says the hotel's name, by its reading", () => {
    const card = hotelCard(sampleProfile().hotels[0]!);
    expect(card.extra).toEqual(["ホテルグレイスリー新宿", "住所：東京都新宿区歌舞伎町1-19-1", { phone: "03-6833-2489" }]);
    // The reading itself: the voice reads the text, not the ruby.
    expect(card.say).toBe("ほてるぐれいすりーしんじゅく まで お{願|ねが}い します。");
    expect(checkJp(card.say!)).toEqual([]);
  });

  it("says the hotel's name only when the voice can read it: otherwise 'this hotel'", () => {
    const hotel = sampleProfile().hotels[0]!;
    expect(hotelCard({ ...hotel, name: "Hotel Gracery Shinjuku", kana: "" }).say).toBe(LINES.taxiToHotel);
    expect(hotelCard({ ...hotel, name: "新宿華盛頓酒店", kana: "" }).say).toBe(LINES.taxiToHotel);
    // A reading that isn't kana is not used by the voice, so it doesn't make the name sayable.
    expect(hotelCard({ ...hotel, name: "新宿格拉斯麗酒店", kana: "Gracery" }).say).toBe(LINES.taxiToHotel);
    expect(hotelCard({ ...hotel, name: "ホテルグレイスリー新宿", kana: "" }).say).toBe("ホテルグレイスリー新宿 まで お{願|ねが}い します。");
    expect(hotelCard({ ...hotel, name: "ホテル Gracery 新宿", kana: "" }).say).toBe(LINES.taxiToHotel);
    // An English name with a kana reading: the reading is what's said.
    expect(plain(hotelCard({ ...hotel, name: "Hotel Gracery Shinjuku", kana: "ほてるぐれいすりー" }).say!)).toBe("ほてるぐれいすりーまでお願いします。");
  });

  it("gives an allergy typed in 其他過敏 its own block on the restaurant card, not among the foods", () => {
    const profile = emptyProfile();
    profile.health.allergyOther = "Latex";
    const blocks = allergyCard(profile)!;
    // Alone, so not "also".
    expect(plain(blocks[0]!.jp)).toBe("次のものにアレルギーがあります。入った料理は食べられません。");
    expect(blocks[0]!.extra).toEqual(["・Latex"]);
    expect(blocks.map((b) => plain(b.jp)).join("")).not.toContain("食物アレルギー");
    for (const block of blocks) expect(checkJp(block.jp)).toEqual([]);
    // After a food allergy: "also".
    profile.health.foodAllergies = ["peanut"];
    expect(plain(allergyCard(profile)![1]!.jp)).toBe("次のものにもアレルギーがあります。入った料理は食べられません。");
  });

  it("puts an allergy typed in 其他過敏 on its own line, not under food", () => {
    const profile = emptyProfile();
    profile.health.allergyOther = "Aspirin";
    expect(medicalCard(profile)[0]?.extra).toEqual(["薬のアレルギー：未記入", "食物アレルギー：未記入", "その他のアレルギー：Aspirin"]);
  });

  it("leaves an empty medicine card off the medical card", () => {
    const profile = emptyProfile();
    profile.health.meds = [{ ingredient: " ", dose: "" }];
    expect(medicalCard(profile)[2]?.extra).toEqual(["持病：未記入", "服用中の薬：未記入"]);
  });

  it("formats contacts without a phone, and keeps a relation it doesn't know as typed", () => {
    expect(contactLines({ relation: "女兒", name: "", phone: "" }, "tw")).toEqual(["娘（女兒）"]);
    expect(contactLines({ relation: "鄰居", name: "", phone: "" }, "tw")).toEqual(["鄰居"]);
    expect(contactLines({ relation: "constructor", name: "", phone: "" }, "tw")).toEqual(["constructor"]);
  });

  it("prints the passport name as the passport does, in capitals", () => {
    const profile = { ...emptyProfile(), passportName: "chen wen-hsiung" };
    expect(helpCard(profile)[0]?.extra).toEqual(["名前：CHEN WEN-HSIUNG"]);
    expect(medicalCard(profile)[1]?.extra[0]).toBe("名前：CHEN WEN-HSIUNG");
  });
});

describe("place names in phrases", () => {
  it("adds 駅 to stations only when asked", () => {
    const shinjuku = { kind: "station" as const, name: "新宿駅", kana: "しんじゅくえき", zh: "新宿", date: "", note: "" };
    expect(placeWord(shinjuku, true)).toBe("{新宿|しんじゅく}{駅|えき}");
    expect(placeWord(shinjuku, false)).toBe("{新宿|しんじゅく}");
    expect(placeWord({ ...shinjuku, kind: "place", name: "浅草寺", kana: "" }, true)).toBe("浅草寺");
  });
});

describe("emergency numbers", () => {
  it.each(EMERGENCY_NUMBERS.map((e) => [e.id, e] as const))("%s names its source and check date", (_, entry) => {
    expect(entry.source).toMatch(/^https:\/\//);
    expect(entry.verified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("filling phrase slots", () => {
  const profile = sampleProfile();
  const shinjuku = profile.places[0]!;
  const phrase = SCENES[0]!.phrases.find((p) => p.id === "transport-stops-at")!;

  it("uses the picked station", () => {
    const line = ready(phrase, profile, shinjuku);
    expect(plain(line.jp)).toBe("この電車は新宿に止まりますか。");
    expect(line.zh).toBe("這班車有停新宿嗎？");
  });

  it("adds 駅 where the phrase wants a destination", () => {
    const want = SCENES[0]!.phrases.find((p) => p.id === "transport-want-to-go")!;
    expect(plain(ready(want, profile, shinjuku).jp)).toBe("新宿駅に行きたいです。");
  });

  it("falls back without a place", () => {
    const line = ready(phrase, emptyProfile(), null);
    expect(plain(line.jp)).toBe("この電車はここに止まりますか。");
    expect(line.zh).toContain("這裡");
  });

  it("produces valid markup for every phrase and place", () => {
    for (const scene of SCENES) {
      for (const p of scene.phrases) {
        for (const place of [null, ...profile.places]) expect(checkJp(ready(p, profile, place).jp)).toEqual([]);
      }
    }
  });
});

describe("medical and allergy cards", () => {
  const now = new Date("2026-11-03T12:00:00");

  it("lists health data in Japanese", () => {
    const blocks = medicalCard(sampleProfile(), now);
    // Allergies first of all, marked: what a doctor must not miss.
    expect(blocks[0]).toMatchObject({ alert: true, extra: ["薬のアレルギー：ペニシリン", "食物アレルギー：えび、かに"] });
    expect(plain(blocks[0]!.jp)).toBe("アレルギー情報です。");
    // Only the year is known, so the age is a range.
    expect(blocks[1]?.extra).toEqual(["名前：LIN MEI-HUA", "生年：1956年（69〜70歳）", "国籍：台湾", "血液型：O型"]);
    expect(blocks[2]?.extra).toEqual([
      "持病：高血圧、糖尿病",
      "服用中の薬：",
      "・Amlodipine 5mg 1/day",
      "・Metformin 500mg 2/day",
      "・Aspirin 100mg 1/day",
    ]);
    expect(blocks.at(-1)?.extra).toEqual(["富邦產險", "証券番号：TRV-12345678", { phone: "+886 2-2345-6789" }]);
    for (const block of blocks) expect(checkJp(block.jp)).toEqual([]);
  });

  it("says 未記入 for a question never answered, never なし: a doctor reads なし as 'no allergies'", () => {
    const blocks = medicalCard({ ...emptyProfile(), callName: "雅婷" }, now);
    expect(blocks).toHaveLength(3);
    expect(blocks[0]?.extra).toEqual(["薬のアレルギー：未記入", "食物アレルギー：未記入"]);
    expect(blocks[2]?.extra).toEqual(["持病：未記入", "服用中の薬：未記入"]);
  });

  it("doesn't take a diet, insurance or a blood type as answering allergies or conditions", () => {
    const profile = emptyProfile();
    profile.health.diets = ["vegan"];
    profile.health.bloodType = "B";
    profile.insurance = { company: "富邦產險", policy: "", phone: "+886 2 2345 6789" };
    const blocks = medicalCard(profile, now);
    expect(blocks[0]?.extra).toEqual(["薬のアレルギー：未記入", "食物アレルギー：未記入"]);
    expect(blocks[2]?.extra).toEqual(["持病：未記入", "服用中の薬：未記入"]);
  });

  it("never shows a negative age", () => {
    const profile = { ...emptyProfile(), birthYear: 2026 };
    expect(medicalCard(profile, now)[1]?.extra).toContain("生年：2026年（0歳）");
    expect(medicalCard({ ...emptyProfile(), birthYear: 2056 }, now)[1]?.extra).toContain("生年：2056年");
  });

  it("says 未記入 for each empty line, even when the lines next to it are filled in", () => {
    const profile = emptyProfile();
    profile.health.foodAllergies = ["peanut"];
    profile.health.meds = [{ ingredient: "Amlodipine", dose: "" }];
    const blocks = medicalCard(profile, now);
    expect(blocks[0]?.extra).toEqual(["薬のアレルギー：未記入", "食物アレルギー：落花生（ピーナッツ）"]);
    expect(blocks[2]?.extra).toEqual(["持病：未記入", "服用中の薬：", "・Amlodipine"]);
    for (const block of blocks) expect(block.extra.join("")).not.toContain("なし");
  });

  it("spells out vegetarian types the Japanese have no word for", () => {
    const profile = emptyProfile();
    profile.health.diets = ["vegan", "no-pungent", "no-seafood"];
    const lines = allergyCard(profile)!.map((b) => plain(b.jp));
    expect(lines[0]).toContain("卵・乳製品は食べられません");
    expect(lines[0]).toContain("魚のだしや肉のエキスも食べられません");
    expect(lines[1]).toContain("にんにく・ねぎ・たまねぎ・にら・らっきょうは食べられません");
    expect(lines[2]).toBe("魚・えび・かに・貝・いかなど、魚介類は食べられません。");
  });

  it("makes an allergy card only when there is something to say", () => {
    expect(allergyCard(emptyProfile())).toBeNull();
    const blocks = allergyCard(sampleProfile())!;
    expect(blocks[0]?.extra).toEqual(["・えび", "・かに"]);
    expect(blocks[0]?.zh).toContain("蝦、蟹");
    expect(plain(blocks[1]!.jp)).toBe("牛肉は食べられません。");
    for (const block of blocks) expect(checkJp(block.jp)).toEqual([]);
  });
});

describe("lineText", () => {
  it("prints a phone line with its TEL label", () => {
    expect(lineText({ phone: "03-6833-2489" })).toBe("TEL 03-6833-2489");
    expect(lineText("住所：東京都")).toBe("住所：東京都");
  });
});
