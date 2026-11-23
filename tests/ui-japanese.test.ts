// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { romaji } from "../src/lib/jp";
import { accessibleName, KANA, visibleText } from "./a11y";

type Japanese = typeof import("../src/ui/japanese");
let jp: Japanese;

/** Utterances handed to the fake engine, in order. */
let spoken: { text: string; rate: number; onend: (() => void) | null }[];

class FakeUtterance {
  text: string;
  lang = "";
  rate = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

beforeEach(async () => {
  document.body.replaceChildren();
  localStorage.clear();
  spoken = [];
  // speech.ts captures speechSynthesis when it is imported: stub first, then import afresh.
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  vi.stubGlobal("speechSynthesis", {
    speaking: false,
    pending: false,
    speak: vi.fn((u: FakeUtterance) => spoken.push(u)),
    cancel: vi.fn(),
    getVoices: () => [],
    addEventListener: vi.fn(),
  });
  vi.resetModules();
  jp = await import("../src/ui/japanese");
});

afterEach(() => {
  jp.hush();
  document.body.replaceChildren();
});

describe("jpText", () => {
  const markup = "{駅|えき} に {行|い}きたい です。";

  it("puts the reading over each kanji as ruby", () => {
    const el = jp.jpText(markup);
    const rubies = [...el.querySelectorAll("ruby")];
    expect(rubies.map((r) => r.querySelector("rt")?.textContent)).toEqual(["えき", "い"]);
    expect(rubies.map((r) => r.firstChild?.textContent)).toEqual(["駅", "行"]);
    expect(el.querySelector('[lang="ja"]')).not.toBeNull();
  });

  it("hides the readings from screen readers, so each word is read once", () => {
    const el = jp.jpText(markup);
    expect([...el.querySelectorAll("rt")].every((rt) => rt.getAttribute("aria-hidden") === "true")).toBe(true);
  });

  it("adds one romaji line for the whole sentence, hidden from screen readers", () => {
    const el = jp.jpText(markup);
    const hidden = [...el.querySelectorAll('.jp-romaji[aria-hidden="true"]')];
    expect(hidden).toHaveLength(1);
    expect(hidden[0]!.textContent).toBe(romaji(markup));
    // One line, several words: not one romaji per word.
    expect(hidden[0]!.textContent!.split(" ").length).toBeGreaterThan(1);
    // The romaji sits outside the Japanese, which screen readers do read.
    expect(el.querySelector('[lang="ja"]')!.contains(hidden[0]!)).toBe(false);
  });

  it("leaves the romaji out when asked", () => {
    const el = jp.jpText(markup, "lg", { romaji: false });
    expect(el.querySelector(".jp-romaji")).toBeNull();
    expect(el.textContent).not.toContain(romaji(markup));
    expect(el.querySelectorAll("ruby")).toHaveLength(2);
  });

  it("renders kana-only text without ruby", () => {
    const el = jp.jpText("ありがとう ございます。");
    expect(el.querySelector("ruby")).toBeNull();
    expect(el.querySelector('[lang="ja"]')!.textContent).toBe("ありがとう ございます。");
  });
});

describe("playButton", () => {
  it("names what it plays", () => {
    expect(accessibleName(jp.playButton("{駅|えき} です。"))).toBe("播放「駅です。」");
    expect(accessibleName(jp.playButton("{駅|えき} です。", "slow"))).toBe("慢速播放「駅です。」");
    expect(accessibleName(jp.playButton(["はい", "いいえ"]))).toBe("播放「はいいいえ」");
  });

  it("shows only 播放 or 慢速, and marks the Japanese in its name, so a screen reader reads it in a Japanese voice", () => {
    for (const [button, label] of [
      [jp.playButton("{駅|えき} です。"), "播放"],
      [jp.playButton("{駅|えき} です。", "slow"), "慢速"],
    ] as const) {
      expect(visibleText(button)).toBe(label);
      // An aria-label can't carry lang="ja": the Chinese page language would read the kana.
      expect(button.getAttribute("aria-label")).toBeNull();
      expect(button.querySelector('[lang="ja"]')?.textContent).toBe("駅です。");
      for (const node of button.querySelectorAll(":not([lang=ja])")) {
        const own = [...node.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join("");
        expect(own).not.toMatch(KANA);
      }
    }
  });

  it("is marked as speaking while it plays, and speaks the plain text", () => {
    const button = jp.playButton("{駅|えき} です。");
    document.body.append(button);
    button.click();
    expect(button.classList.contains("speaking")).toBe(true);
    expect(spoken.map((u) => u.text)).toEqual(["駅です。"]);
  });

  it("speaks slower from the slow button", () => {
    const normal = jp.playButton("はい");
    const slow = jp.playButton("はい", "slow");
    document.body.append(normal, slow);
    normal.click();
    slow.click();
    expect(spoken).toHaveLength(2);
    expect(spoken[1]!.rate).toBeLessThan(spoken[0]!.rate);
  });

  it("marks only one button at a time", () => {
    const first = jp.playButton("はい");
    const second = jp.playButton("いいえ", "slow");
    document.body.append(first, second);
    first.click();
    second.click();
    expect(first.classList.contains("speaking")).toBe(false);
    expect(second.classList.contains("speaking")).toBe(true);
    expect(document.querySelectorAll(".speaking")).toHaveLength(1);
  });

  it("is unmarked once every line has been spoken", async () => {
    vi.useFakeTimers();
    try {
      const button = jp.playButton(["はい", "いいえ"]);
      document.body.append(button);
      button.click();
      spoken[0]!.onend?.();
      await vi.advanceTimersByTimeAsync(400);
      expect(button.classList.contains("speaking")).toBe(true);
      expect(spoken.map((u) => u.text)).toEqual(["はい", "いいえ"]);
      spoken[1]!.onend?.();
      await vi.advanceTimersByTimeAsync(400);
      expect(button.classList.contains("speaking")).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("is unmarked by hush()", () => {
    const button = jp.playButton("はい");
    document.body.append(button);
    button.click();
    jp.hush();
    expect(document.querySelectorAll(".speaking")).toHaveLength(0);
  });

  it("does not let the click reach the row around it", () => {
    const row = document.createElement("div");
    const onRow = vi.fn();
    row.addEventListener("click", onRow);
    const button = jp.playButton("はい");
    row.append(button);
    document.body.append(row);
    button.click();
    expect(onRow).not.toHaveBeenCalled();
  });
});
