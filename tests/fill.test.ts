import { afterEach, describe, expect, it, vi } from "vitest";
import { REPLY_SETS, repliesFor } from "../src/content/replies";
import { SCENES } from "../src/content/scenes";
import type { Phrase, Reply, ReplySet } from "../src/content/types";
import { plain } from "../src/lib/jp";
import { ready } from "../src/profile/fill";
import { emptyProfile, type Place } from "../src/profile/profile";
import { sampleProfile } from "./fixtures";

function phrase(id: string): Phrase {
  const found = SCENES.flatMap((scene) => scene.phrases).find((p) => p.id === id);
  if (!found) throw new Error(`no phrase ${id}`);
  return found;
}

function place(name: string): Place {
  const found = sampleProfile().places.find((p) => p.name === name);
  if (!found) throw new Error(`no place ${name}`);
  return found;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("ready", () => {
  it("returns a phrase without slots unchanged", () => {
    const p = SCENES.flatMap((scene) => scene.phrases).find((x) => !x.jp.includes("$"))!;
    expect(ready(p, sampleProfile(), place("新宿"))).toEqual({ jp: p.jp, zh: p.zh });
    expect(ready(p, emptyProfile(), null)).toEqual({ jp: p.jp, zh: p.zh });
  });

  it("fills $dest with the station name plus 駅 and the Chinese name", () => {
    const result = ready(phrase("transport-want-to-go"), sampleProfile(), place("新宿"));
    expect(result.jp).toBe("{新宿|しんじゅく}{駅|えき} に {行|い}きたい です。");
    expect(plain(result.jp)).toBe("新宿駅に行きたいです。");
    expect(result.zh).toBe("我想去新宿。");
  });

  it("fills $dest without 駅 for a place that is not a station", () => {
    const result = ready(phrase("transport-want-to-go"), sampleProfile(), place("浅草寺"));
    expect(plain(result.jp)).toBe("浅草寺に行きたいです。");
    expect(result.zh).toBe("我想去淺草寺。");
  });

  it("fills $stop with the bare station name", () => {
    const result = ready(phrase("transport-stops-at"), sampleProfile(), place("浅草"));
    expect(plain(result.jp)).toBe("この電車は浅草に止まりますか。");
    expect(result.zh).toBe("這班車有停淺草嗎？");
  });

  it("fills $hotel with the hotel covering today, without needing a place", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 6, 12));
    const p = phrase("luggage-send-hotel");
    const result = ready(p, sampleProfile(), null);
    expect(result.jp).toBe("この {荷物|にもつ} を {京都タワーホテル|きょうとたわーほてる} に {送|おく}りたい です。");
    expect(result.zh).toBe(p.zh);
  });

  it("falls back to the first hotel outside every stay", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 0, 1, 12));
    expect(plain(ready(phrase("luggage-send-hotel"), sampleProfile(), null).jp)).toBe(
      "この荷物をホテルグレイスリー新宿に送りたいです。",
    );
  });

  it("uses the fallback when no place is chosen", () => {
    const p = phrase("transport-want-to-go");
    expect(ready(p, sampleProfile(), null)).toEqual({ jp: p.fallback, zh: p.fallbackZh });
  });

  it("uses the fallback when no hotel is saved", () => {
    const p = phrase("luggage-send-hotel");
    expect(ready(p, emptyProfile(), place("新宿"))).toEqual({ jp: p.fallback, zh: p.fallbackZh });
  });

  it("keeps the original when a slotted phrase has no fallback", () => {
    const p: Phrase = { id: "test-no-fallback", zh: "去〇〇。", jp: "$dest へ" };
    expect(ready(p, sampleProfile(), null)).toEqual({ jp: "$dest へ", zh: "去〇〇。" });
  });

  it("uses the Japanese name in Chinese when the place has no Chinese name", () => {
    const unnamed: Place = { ...place("上野"), zh: "" };
    expect(ready(phrase("transport-want-to-go"), sampleProfile(), unnamed).zh).toBe("我想去上野。");
  });

  it("produces markup that reads cleanly for every slotted phrase", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 3, 12));
    const slotted = SCENES.flatMap((scene) => scene.phrases).filter((p) => p.jp.includes("$"));
    expect(slotted.length).toBeGreaterThan(0);
    for (const p of slotted) {
      const result = ready(p, sampleProfile(), place("浅草"));
      expect(result.jp).not.toContain("$");
      expect(result.zh).not.toContain("〇〇");
      expect(() => plain(result.jp)).not.toThrow();
    }
  });
});

describe("repliesFor", () => {
  it("returns a list of replies as it is", () => {
    const replies: Reply[] = [{ jp: "はい", zh: "是" }];
    expect(repliesFor(replies)).toBe(replies);
    expect(repliesFor([])).toEqual([]);
  });

  it("resolves every named set to a non-empty list ending with わかりません", () => {
    const names = Object.keys(REPLY_SETS) as ReplySet[];
    expect(names.sort()).toEqual(["direction", "exit", "place", "platform", "time", "yesNo"]);
    for (const name of names) {
      const replies = repliesFor(name);
      expect(replies.length, name).toBeGreaterThan(0);
      expect(replies.at(-1)?.jp, name).toBe("わかりません");
      for (const reply of replies) expect(() => plain(reply.jp)).not.toThrow();
    }
  });

  it("lists platforms 1 to 14 with their readings", () => {
    const platforms = repliesFor("platform");
    expect(platforms).toHaveLength(15);
    expect(platforms[0]).toEqual({ jp: "{1番線|いちばんせん}", zh: "1 號月台" });
    expect(platforms[13]).toEqual({ jp: "{14番線|じゅうよんばんせん}", zh: "14 號月台" });
  });

  it("resolves the named sets used by scene phrases", () => {
    for (const p of SCENES.flatMap((scene) => scene.phrases)) {
      if (p.answers !== undefined) expect(repliesFor(p.answers).length, p.id).toBeGreaterThan(0);
    }
  });
});
