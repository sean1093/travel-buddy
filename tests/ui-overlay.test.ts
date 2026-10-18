// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { plain, romaji } from "../src/lib/jp";

type Overlay = typeof import("../src/ui/overlay");
let ov: Overlay;

/** Leaves the app as a fresh page load would: no overlays, no hash, an empty #app. */
function resetPage(): void {
  // Every open layer (from this module instance or an earlier one) closes on hashchange.
  window.dispatchEvent(new Event("hashchange"));
  history.replaceState(null, "", location.pathname);
  document.body.replaceChildren();
  document.body.className = "";
  localStorage.clear();
}

beforeEach(async () => {
  resetPage();
  const app = document.createElement("div");
  app.id = "app";
  document.body.append(app);
  // overlay.ts keeps its stack in module state: start every test with a fresh one.
  vi.resetModules();
  ov = await import("../src/ui/overlay");
});

afterEach(resetPage);

const app = () => document.getElementById("app")!;
const dialogs = () => [...document.querySelectorAll<HTMLElement>('[role="dialog"]')];
const topDialog = () => dialogs().at(-1)!;
const buttons = (root: ParentNode = document) => [...root.querySelectorAll<HTMLButtonElement>("button")];
const button = (root: ParentNode, text: string) => {
  const found = buttons(root).find((b) => b.textContent?.trim() === text);
  if (!found) throw new Error(`no button "${text}" in: ${buttons(root).map((b) => b.textContent?.trim()).join(" / ")}`);
  return found;
};
const press = (key: string, shiftKey = false) => {
  const event = new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true });
  (document.activeElement ?? document.body).dispatchEvent(event);
  return event;
};
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const isCovered = (el: HTMLElement) => el.inert === true && el.getAttribute("aria-hidden") === "true";

/** A layer with the standard bar (關閉 + hint) and two more buttons, A and B. */
function layer(label: string): () => void {
  return ov.openOverlay(label, (close) => {
    const body = document.createElement("div");
    const a = document.createElement("button");
    a.textContent = `${label} A`;
    const b = document.createElement("button");
    b.textContent = `${label} B`;
    body.append(ov.overlayBar(close, `${label} hint`), a, b);
    return body;
  });
}

describe("openOverlay", () => {
  it("opens a modal dialog and covers the page underneath", () => {
    layer("第一層");
    const dialog = topDialog();
    expect(dialogs()).toHaveLength(1);
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-label")).toBe("第一層");
    expect(isCovered(app())).toBe(true);
    expect(document.body.classList.contains("overflow-hidden")).toBe(true);
    // The close button takes the focus, so a keyboard user starts inside the layer.
    expect(document.activeElement).toBe(button(dialog, "關閉"));
  });

  it("stacks a second layer that covers the first", () => {
    layer("下層");
    layer("上層");
    const [lower, upper] = dialogs();
    expect(lower!.getAttribute("aria-label")).toBe("下層");
    expect(upper!.getAttribute("aria-label")).toBe("上層");
    expect(isCovered(lower!)).toBe(true);
    expect(upper!.inert).toBe(false);
    expect(upper!.hasAttribute("aria-hidden")).toBe(false);
    expect(isCovered(app())).toBe(true);
  });

  it("closes only the top layer on Escape", () => {
    layer("下層");
    layer("上層");
    press("Escape");
    expect(dialogs().map((d) => d.getAttribute("aria-label"))).toEqual(["下層"]);
    // The remaining layer is reachable again; the page is still covered.
    expect(topDialog().inert).toBe(false);
    expect(topDialog().hasAttribute("aria-hidden")).toBe(false);
    expect(isCovered(app())).toBe(true);
    press("Escape");
    expect(dialogs()).toHaveLength(0);
    expect(app().inert).toBe(false);
    expect(app().hasAttribute("aria-hidden")).toBe(false);
    expect(document.body.classList.contains("overflow-hidden")).toBe(false);
  });

  it("closes with the 關閉 button", () => {
    layer("第一層");
    button(topDialog(), "關閉").click();
    expect(dialogs()).toHaveLength(0);
    expect(app().inert).toBe(false);
    expect(document.body.classList.contains("overflow-hidden")).toBe(false);
  });

  it("closes from the function openOverlay returns", () => {
    const close = layer("第一層");
    close();
    expect(dialogs()).toHaveLength(0);
    // A second call is harmless.
    close();
    expect(dialogs()).toHaveLength(0);
  });

  it("closes only the top layer on browser back", () => {
    layer("下層");
    layer("上層");
    history.back();
    expect(dialogs().map((d) => d.getAttribute("aria-label"))).toEqual(["下層"]);
    expect(isCovered(app())).toBe(true);
    history.back();
    expect(dialogs()).toHaveLength(0);
    expect(app().inert).toBe(false);
  });

  it("closes every layer when the page changes (hashchange)", async () => {
    layer("下層");
    layer("上層");
    location.hash = "#/scene/transport";
    // happy-dom fires hashchange on the next tick, as browsers do.
    await tick();
    expect(dialogs()).toHaveLength(0);
    expect(app().inert).toBe(false);
    expect(app().hasAttribute("aria-hidden")).toBe(false);
    expect(document.body.classList.contains("overflow-hidden")).toBe(false);
  });

  it("returns the focus to the button that opened it", () => {
    const opener = document.createElement("button");
    opener.textContent = "打開";
    app().append(opener);
    opener.focus();
    layer("第一層");
    expect(document.activeElement).not.toBe(opener);
    button(topDialog(), "關閉").click();
    expect(document.activeElement).toBe(opener);
  });

  it("returns the focus layer by layer when stacked", () => {
    const opener = document.createElement("button");
    app().append(opener);
    opener.focus();
    layer("下層");
    const lowerClose = button(topDialog(), "關閉");
    layer("上層");
    press("Escape");
    expect(document.activeElement).toBe(lowerClose);
    press("Escape");
    expect(document.activeElement).toBe(opener);
  });

  it("keeps Tab inside the layer", () => {
    layer("第一層");
    const dialog = topDialog();
    const first = button(dialog, "關閉");
    const last = button(dialog, "第一層 B");
    // Tab on the last stop wraps to the first.
    last.focus();
    expect(press("Tab").defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
    // Shift+Tab on the first stop wraps to the last.
    expect(press("Tab", true).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
    // In the middle the browser moves the focus as usual.
    button(dialog, "第一層 A").focus();
    expect(press("Tab").defaultPrevented).toBe(false);
  });

  it("pulls the focus back into the layer from outside", () => {
    const outside = document.createElement("button");
    document.body.append(outside);
    layer("第一層");
    outside.focus();
    expect(press("Tab").defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(button(topDialog(), "關閉"));
  });

  it("lets only the top layer answer Tab", () => {
    layer("下層");
    layer("上層");
    const upper = topDialog();
    button(upper, "上層 B").focus();
    press("Tab");
    expect(document.activeElement).toBe(button(upper, "關閉"));
  });
});

describe("armsLength", () => {
  const vw = (text: string) => Number(/min\(([\d.]+)vw/.exec(ov.armsLength(text))?.[1]);

  it("is a font-size capped on both axes", () => {
    const css = ov.armsLength("すみません");
    expect(css).toMatch(/^font-size: clamp\(1\.5rem, min\([\d.]+vw, [\d.]+vh\), 5rem\)$/);
  });

  it("gets smaller as the text gets longer", () => {
    const sizes = [3, 10, 16, 30, 60].map((n) => vw("あ".repeat(n)));
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeLessThan(sizes[i - 1]!);
  });

  it("caps the height at 1.5 times the width, so a sideways phone never clips", () => {
    const css = ov.armsLength("あ".repeat(10));
    const [, w, hgt] = /min\(([\d.]+)vw, ([\d.]+)vh\)/.exec(css)!;
    expect(Number(hgt)).toBeCloseTo(Number(w) * 1.5);
  });
});

describe("showToOther", () => {
  const jp = "{駅|えき} は どこ です か。";

  it("shows plain Japanese without ruby or romaji, and the Chinese", () => {
    ov.showToOther([{ jp, zh: "車站在哪裡？", extra: ["東京都新宿区1-1"] }]);
    const dialog = topDialog();
    expect(dialog.getAttribute("aria-label")).toBe("給對方看");
    expect(dialog.textContent).toContain("請把畫面拿給對方看");
    const japanese = [...dialog.querySelectorAll('[lang="ja"]')].map((el) => el.textContent);
    expect(japanese).toContain(plain(jp));
    expect(japanese).toContain("東京都新宿区1-1");
    expect(dialog.querySelector("ruby, rt")).toBeNull();
    expect(dialog.textContent).not.toContain(romaji(jp));
    expect(dialog.textContent).toContain("車站在哪裡？");
  });

  it("offers normal and slow playback of every block", () => {
    ov.showToOther([
      { jp, zh: "車站在哪裡？" },
      { jp: "ありがとう", zh: "謝謝" },
    ]);
    const labels = buttons(topDialog()).map((b) => b.getAttribute("aria-label"));
    expect(labels).toContain(`播放「${plain(jp)}ありがとう」`);
    expect(labels).toContain(`慢速播放「${plain(jp)}ありがとう」`);
  });

  it("uses the label it is given", () => {
    ov.showToOther([{ jp, zh: "車站在哪裡？" }], "我的回答");
    expect(topDialog().getAttribute("aria-label")).toBe("我的回答");
  });
});

describe("askOther", () => {
  const question = { jp: "{何番線|なんばんせん} です か。", zh: "幾號月台？" };
  const replies = [
    { jp: "{1番線|いちばんせん}", zh: "1 號月台" },
    { jp: "わかりません", zh: "不知道" },
  ];

  it("asks in Japanese, with one line in Chinese for the traveller", () => {
    ov.askOther(question, replies);
    const dialog = topDialog();
    expect(dialog.getAttribute("aria-label")).toBe("給對方點選");
    expect(dialog.textContent).toContain("把手機交給對方，請對方點答案");
    expect(dialog.textContent).toContain("（幾號月台？）");
    expect([...dialog.querySelectorAll('[lang="ja"]')].map((el) => el.textContent)).toContain(plain(question.jp));
    // The bar now speaks to the Japanese person holding the phone.
    const hint = button(dialog, "關閉").parentElement!.querySelector("p")!;
    expect(hint.getAttribute("lang")).toBe("ja");
    expect(hint.textContent).toBe("こちらをご覧ください");
    // Answers are Japanese buttons.
    for (const reply of replies) expect(button(dialog, plain(reply.jp)).getAttribute("lang")).toBe("ja");
  });

  it("shows the tapped answer in Chinese with the question", () => {
    ov.askOther(question, replies);
    button(topDialog(), "1番線").click();
    const dialog = topDialog();
    expect(dialog.textContent).toContain("你問：幾號月台？");
    expect(dialog.textContent).toContain("1 號月台");
    expect(dialog.textContent).toContain("1番線");
    expect(dialog.textContent).toContain("對方的回答");
    // The answer buttons are gone; 知道了 has the focus.
    expect(buttons(dialog).some((b) => b.textContent === "わかりません")).toBe(false);
    expect(document.activeElement).toBe(button(dialog, "知道了"));
  });

  it("goes back to the question with 再問一次", () => {
    ov.askOther(question, replies);
    button(topDialog(), "わかりません").click();
    button(topDialog(), "再問一次").click();
    const dialog = topDialog();
    expect(dialogs()).toHaveLength(1);
    expect(dialog.textContent).toContain("（幾號月台？）");
    expect(dialog.textContent).not.toContain("你問：");
    expect(button(dialog, "1番線")).toBeTruthy();
  });

  // Regression: 再問一次 replaces the whole layer, including the focused 知道了; without
  // refocusing, the focus fell to <body>, outside the modal.
  it("keeps the focus inside the layer after 再問一次", () => {
    ov.askOther(question, replies);
    button(topDialog(), "1番線").click();
    button(topDialog(), "再問一次").click();
    expect(topDialog().contains(document.activeElement)).toBe(true);
  });

  it("closes with 知道了", () => {
    ov.askOther(question, replies);
    button(topDialog(), "1番線").click();
    button(topDialog(), "知道了").click();
    expect(dialogs()).toHaveLength(0);
    expect(app().inert).toBe(false);
  });
});
