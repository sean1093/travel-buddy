/**
 * The device checks from docs/testing.md that a browser can do: speech requests
 * (with a fake engine), voice choice, install and offline, sideways layout,
 * print size, share links, and what a screen reader is given. What still needs
 * a real phone is listed in docs/testing.md.
 */
import type { Page } from "@playwright/test";
import { expect, SAMPLE_PROFILE, test } from "./fixtures";

/** Records what the app asks the speech engine to do; installed before any app script runs. */
async function fakeSpeech(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const voices = [
      { name: "Kyoko", voiceURI: "com.apple.voice.compact.ja-JP.Kyoko", lang: "ja-JP", localService: true, default: false },
      { name: "Kyoko (Enhanced)", voiceURI: "com.apple.voice.enhanced.ja-JP.Kyoko", lang: "ja-JP", localService: true, default: false },
      { name: "Samantha", voiceURI: "com.apple.voice.compact.en-US.Samantha", lang: "en-US", localService: true, default: true },
    ];
    const log: { text: string; lang: string; rate: number; voice: string | null }[] = [];
    let cancels = 0;
    const synth = {
      speaking: false,
      pending: false,
      getVoices: () => voices,
      addEventListener() {},
      speak(u: { text: string; lang: string; rate: number; voice: { voiceURI: string } | null; onend?: () => void }) {
        log.push({ text: u.text, lang: u.lang, rate: u.rate, voice: u.voice?.voiceURI ?? null });
        // Keeps "speaking" until cancelled: no timer, so a slow runner can't change the outcome.
        synth.speaking = true;
      },
      cancel() {
        cancels += 1;
        synth.speaking = false;
      },
    };
    class Utterance {
      text: string;
      lang = "";
      rate = 1;
      voice: unknown = null;
      onend?: () => void;
      onerror?: () => void;
      constructor(text: string) {
        this.text = text;
      }
    }
    Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { value: Utterance, configurable: true });
    Object.defineProperty(window, "__speech", { value: { log, cancels: () => cancels } });
  });
}

const speechLog = (page: Page) =>
  page.evaluate(() => {
    const s = (window as unknown as { __speech: { log: unknown[]; cancels: () => number } }).__speech;
    return { log: s.log as { text: string; lang: string; rate: number; voice: string | null }[], cancels: s.cancels() };
  });

async function openPhrase(page: Page, scene: string, name: RegExp): Promise<void> {
  await page.goto(`#/scene/${scene}`);
  await page.getByRole("button", { name }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test("1. play, then slow: Japanese, normal then slow rate, the second stops the first", async ({ page, seed }) => {
  await seed({ profile: SAMPLE_PROFILE });
  await fakeSpeech(page);
  await openPhrase(page, "transport", /這班車有停/);
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /^播放「/ }).click();
  await dialog.getByRole("button", { name: /^慢速播放「/ }).click();
  const { log, cancels } = await speechLog(page);
  expect(log).toHaveLength(2);
  for (const u of log) {
    expect(u.lang).toBe("ja-JP");
    expect(u.text).not.toMatch(/[{}|]/); // plain text, no ruby markup read aloud
    expect(u.voice).toBe("com.apple.voice.enhanced.ja-JP.Kyoko"); // best Japanese voice, never the English one
  }
  expect(log.map((u) => u.rate)).toEqual([0.9, 0.6]);
  expect(cancels, "the slow play cancels the one still speaking").toBe(1);
  await expect(dialog.locator(".speaking")).toHaveCount(1);
  await expect(dialog.getByRole("button", { name: /^慢速播放「/ })).toHaveClass(/speaking/);
});

test("2. a voice picked in settings is used after a reload", async ({ page, seed }) => {
  await seed({ profile: SAMPLE_PROFILE });
  await fakeSpeech(page);
  await page.goto("#/settings");
  const select = page.getByRole("combobox", { name: "選擇聲音" });
  // Only Japanese voices are offered.
  await expect(select.locator("option")).toHaveText(["自動（音質最好的）", "Kyoko (Enhanced)", "Kyoko"]);
  await select.selectOption("com.apple.voice.compact.ja-JP.Kyoko");
  await page.reload();
  await expect(page.getByRole("combobox", { name: "選擇聲音" })).toHaveValue("com.apple.voice.compact.ja-JP.Kyoko");
  await openPhrase(page, "transport", /這班車有停/);
  await page.getByRole("dialog").getByRole("button", { name: /^播放「/ }).click();
  const { log } = await speechLog(page);
  expect(log.at(-1)?.voice).toBe("com.apple.voice.compact.ja-JP.Kyoko");
});

test("3. installable, then works offline: a scene and the help card", async ({ page, seed, context, request }) => {
  await seed({ profile: SAMPLE_PROFILE });
  await page.goto("#/");
  await expect(page.locator("h1")).toBeVisible();

  // What the browser needs to offer "Add to Home Screen".
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  const manifestUrl = new URL(manifestHref!, page.url()).href;
  const manifest = await (await request.get(manifestUrl)).json();
  expect(manifest).toMatchObject({ display: "standalone", start_url: "./", scope: "./" });
  expect(manifest.name).toBeTruthy();
  expect(manifest.short_name.length).toBeLessThanOrEqual(12);
  const pngSize = async (url: string) => {
    const res = await request.get(new URL(url, manifestUrl).href);
    expect(res.ok(), url).toBe(true);
    const body = await res.body();
    expect(body.subarray(1, 4).toString(), `${url} is a PNG`).toBe("PNG");
    return `${body.readUInt32BE(16)}x${body.readUInt32BE(20)}`;
  };
  for (const icon of manifest.icons) expect(await pngSize(icon.src), icon.src).toBe(icon.sizes);
  expect(manifest.icons.some((i: { purpose: string }) => i.purpose === "maskable")).toBe(true);
  const appleIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
  expect(await pngSize(new URL(appleIcon!, page.url()).href)).toBe("180x180");

  // Service worker in control, then airplane mode.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.goto("#/scene/konbini");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "便利商店" })).toBeVisible();
  await page.goto("#/help");
  await expect(page.getByText("LIN MEI-HUA").first()).toBeVisible();
  await page.getByRole("button", { name: "放大" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await context.setOffline(false);
});

test.describe("4. sideways", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  for (const [name, open] of [
    ["help card", (page: Page) => page.goto("#/help").then(() => page.getByRole("button", { name: "放大" }).click())],
    [
      "short phrase",
      (page: Page) =>
        openPhrase(page, "konbini", /請幫我加熱/).then(() => page.getByRole("button", { name: "給對方看", exact: true }).click()),
    ],
  ] as const) {
    test(`給對方看 (${name}): text is large and starts in view, play buttons are in the top bar`, async ({ page, seed }) => {
      await seed({ profile: SAMPLE_PROFILE });
      await open(page);
      const dialog = page.getByRole("dialog").last();
      const bar = await dialog.getByRole("button", { name: "關閉" }).boundingBox();
      for (const label of [/^播放「/, /^慢速播放「/]) {
        const box = (await dialog.getByRole("button", { name: label }).boundingBox())!;
        expect(box.y, "play buttons sit in the top bar").toBeLessThan(bar!.y + bar!.height);
        expect(box.y + box.height).toBeLessThanOrEqual(bar!.y + bar!.height + 1);
      }
      const jp = dialog.locator('p[lang="ja"]').first();
      const jpBox = (await jp.boundingBox())!;
      const fontSize = await jp.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      expect(fontSize, "readable at arm's length").toBeGreaterThanOrEqual(32);
      expect(jpBox.y, "first line below the bar, not cut off").toBeGreaterThanOrEqual(bar!.y + bar!.height - 1);
      expect(jpBox.y).toBeLessThan(390);
      expect(jpBox.x).toBeGreaterThanOrEqual(0);
      expect(jpBox.x + jpBox.width).toBeLessThanOrEqual(844);
    });
  }
});

/** The printed sheet as measured in print media: card sizes in mm, offsets from the sheet's top, and the PDF's pages. */
async function printSheet(page: Page) {
  await page.goto("#/print");
  await expect(page.locator(".wallet-card").first()).toBeVisible();
  await page.emulateMedia({ media: "print" });
  const mm = (px: number) => (px * 25.4) / 96;
  const cards = (
    await page.locator(".print-sheet").evaluate((sheet) => {
      const top = sheet.getBoundingClientRect().top;
      return [...sheet.querySelectorAll(".wallet-card")].map((el) => {
        const r = el.getBoundingClientRect();
        return { w: r.width, h: r.height, top: r.top - top, tall: el.classList.contains("wallet-card-tall") };
      });
    })
  ).map((c) => ({ ...c, w: mm(c.w), h: mm(c.h), top: mm(c.top) }));
  const pdf = (await page.pdf({ preferCSSPageSize: true, printBackground: true })).toString("latin1");
  const pages = [...pdf.matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)].map((m) => [Number(m[1]), Number(m[2])]);
  return { cards, pages };
}

test.describe("5. print", () => {
  // More cards than one sheet holds: the rest must print on the next sheet, not be cut off.
  test("a long trip continues on a second sheet", async ({ page, seed }) => {
    const hotels = SAMPLE_PROFILE.hotels as Record<string, unknown>[];
    await seed({ profile: { ...SAMPLE_PROFILE, hotels: [...hotels, ...hotels, ...hotels] } });
    const { cards, pages } = await printSheet(page);
    expect(cards.length).toBe(10); // 2 folded + 8 short = 12 slots: more than the 8 on one sheet
    expect(pages).toHaveLength(2);
  });

  for (const viewport of [undefined, { width: 320, height: 640 }]) {
    test.describe(viewport ? `on a ${viewport.width} px phone` : "on a Pixel 7", () => {
      if (viewport) test.use({ viewport });

      test("wallet cards are true size, cut lines line up, all on one A4 sheet, no title or controls", async ({ page, seed }) => {
        await seed({ profile: SAMPLE_PROFILE });
        const { cards, pages } = await printSheet(page);
        // The sample trip: the help and medical cards fold, the two hotel cards, allergy and numbers don't.
        // A narrow screen must not change that, or the paper changes with the phone.
        expect(cards.map((c) => c.tall)).toEqual([true, false, false, true, false, false]);
        for (const c of cards) {
          expect(c.w).toBeCloseTo(85.6, 0);
          // A folded card is two slots and the gap: 2 × 54 + 4 mm.
          expect(c.h).toBeCloseTo(c.tall ? 112 : 54, 0);
          // Every card starts on a 58 mm row (54 mm card + 4 mm gap): one straight cut across the sheet.
          expect(c.top % 58 < 0.5 || c.top % 58 > 57.5, `card top ${c.top.toFixed(1)} mm on the 58 mm grid`).toBe(true);
        }
        await expect(page.locator("h1")).toBeHidden();
        await expect(page.locator("header")).toBeHidden();
        expect(await page.locator("button:visible, a[href]:visible").count(), "no buttons or links on paper").toBe(0);
        // Eight slots fill one sheet.
        expect(pages, "one A4 page (595 × 842 pt)").toEqual([[expect.closeTo(595, 0), expect.closeTo(842, 0)]]);
      });

      if (viewport) {
        // Narrower than a card: the preview must not shrink cards (that would clip their text,
        // or fold cards that fit on paper). The sheet scrolls sideways instead, not the page.
        test("the preview keeps cards at true size, with nothing clipped", async ({ page, seed }) => {
          await seed({ profile: SAMPLE_PROFILE });
          await page.goto("#/print");
          await expect(page.locator(".wallet-card").first()).toBeVisible();
          const cards = await page.locator(".wallet-card").evaluateAll((els) =>
            els.map((el) => ({ w: (el.getBoundingClientRect().width * 25.4) / 96, clipped: el.scrollHeight > el.clientHeight + 1 })),
          );
          for (const c of cards) {
            expect(c.w).toBeCloseTo(85.6, 0);
            expect(c.clipped, "card text cut off in the preview").toBe(false);
          }
          const sheet = page.getByRole("region", { name: "卡片預覽" });
          expect(await sheet.evaluate((el) => el.scrollWidth > el.clientWidth), "the sheet scrolls sideways").toBe(true);
          expect(await sheet.getAttribute("tabindex"), "keyboard users can scroll it").toBe("0");
          const doc = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(doc, "the page itself does not scroll sideways").toBeLessThanOrEqual(0);
        });
      }
    });
  }

});

test("6. a share link survives being sent: URL-safe, short enough, and imports every field", async ({ page, seed, browser }) => {
  await seed({ profile: SAMPLE_PROFILE });
  await page.goto("#/share");
  await page.getByText("顯示連結文字").click();
  const link = await page.getByRole("textbox", { name: "分享連結" }).inputValue();
  // Messengers cut links at spaces and often at punctuation they don't expect.
  expect(link).toMatch(/^https?:\/\/[A-Za-z0-9.:/_~-]+#\/s\/[A-Za-z0-9_~.-]+$/);
  expect(link.length, "fits a messenger link (LINE, SMS split)").toBeLessThan(2000);

  const context = await browser.newContext({ locale: "zh-TW" });
  try {
    const other = await context.newPage();
    await other.goto(link);
    await expect(other.getByRole("heading", { name: "設定完成" })).toBeVisible();
    const saved = await other.evaluate(() => JSON.parse(localStorage.getItem("travelbuddy.japan.profile")!).data);
    const pick = (p: Record<string, unknown>) => JSON.parse(JSON.stringify(p));
    expect(pick(saved)).toEqual(pick({ ...saved, ...SAMPLE_PROFILE }));
  } finally {
    await context.close();
  }
});

test("7. screen reader: named controls, labelled dialog, headings, Japanese marked as Japanese", async ({ page, seed }) => {
  await seed({ profile: SAMPLE_PROFILE });
  const audit = () =>
    page.evaluate(() => {
      // Hiragana and katakana, but not ・ (U+30FB), which Chinese labels use too.
      const kana = /[\u3041-\u30fa\u30fc-\u30ff]/;
      const covered = (el: Element) => el.closest("[aria-hidden=true], [inert]");
      // Japanese text a screen reader would read with a Chinese voice.
      const notJa: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const el = n.parentElement!;
        if (!kana.test(n.textContent ?? "") || covered(el)) continue;
        if (!el.closest('[lang="ja"]')) notJa.push(n.textContent!.trim().slice(0, 30));
      }
      const svgs = [...document.querySelectorAll("svg")].filter((s) => !s.closest("[aria-hidden=true]") && !s.getAttribute("aria-label"));
      return { notJa, unlabelledSvgs: svgs.length, h1: document.querySelectorAll("h1").length };
    });
  const unnamed = async () =>
    (await page.locator("body").ariaSnapshot()).split("\n").filter((l) => /^\s*- (button|link|radio|checkbox|textbox|combobox)(:|\s*\[|$)/.test(l));

  await page.goto("#/");
  await expect(page.locator("h1")).toBeVisible();
  let r = await audit();
  expect(r.h1).toBe(1);
  expect(r.notJa).toEqual([]);
  expect(r.unlabelledSvgs).toBe(0);
  expect(await unnamed()).toEqual([]);

  await openPhrase(page, "transport", /這班車有停/);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  expect(await dialog.getAttribute("aria-label")).toBeTruthy();
  r = await audit();
  expect(r.notJa).toEqual([]);
  expect(r.unlabelledSvgs).toBe(0);
  expect(await unnamed()).toEqual([]);
  // Focus starts inside the layer, on its close button.
  await expect(dialog.getByRole("button", { name: "關閉" })).toBeFocused();
  // Each word once: the furigana is for the eye, the kanji are read in Japanese.
  const tree = await dialog.ariaSnapshot();
  // (Chromium's tree adds spaces at word and ruby boundaries; Japanese speech ignores them.)
  expect(tree.replace(/ /g, "")).toContain("この電車は新宿に止まりますか。");
  expect(tree).not.toContain("でんしゃ");
});
