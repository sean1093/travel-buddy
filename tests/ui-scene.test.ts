// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RESCUE } from "../src/content/rescue";
import { SCENES, sceneById } from "../src/content/scenes";
import { plain, romaji, slotsOf } from "../src/lib/jp";
import { sampleProfile } from "./fixtures";

type SceneModule = typeof import("../src/ui/scene");
let scene: SceneModule;

function resetPage(): void {
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
  // scene.ts remembers the picked place, overlay.ts its stack: fresh modules for every test.
  vi.resetModules();
  scene = await import("../src/ui/scene");
});

afterEach(() => {
  resetPage();
  vi.useRealTimers();
});

const app = () => document.getElementById("app")!;
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const dialogs = () => [...document.querySelectorAll<HTMLElement>('[role="dialog"]')];
const topDialog = () => dialogs().at(-1)!;
const buttons = (root: ParentNode) => [...root.querySelectorAll<HTMLButtonElement>("button")];
const button = (root: ParentNode, text: string) => {
  const found = buttons(root).find((b) => b.textContent?.trim() === text);
  if (!found) throw new Error(`no button "${text}" in: ${buttons(root).map((b) => b.textContent?.trim()).join(" / ")}`);
  return found;
};
/** Phrase rows show the Chinese first, then a hint of the Japanese. */
const rowTitles = () => buttons(app().querySelector("main")!).flatMap((b) => b.querySelector("span > span")?.textContent ?? []);
const row = (zh: string) => {
  const found = buttons(app().querySelector("main")!).find((b) => b.querySelector("span > span")?.textContent === zh);
  if (!found) throw new Error(`no row "${zh}" in: ${rowTitles().join(" / ")}`);
  return found;
};
const saveProfile = (data: unknown) => localStorage.setItem("travelbuddy.japan.profile", JSON.stringify({ v: 1, data }));
const onDay = (day: string) => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(`${day}T10:00:00`));
};

describe("renderScene", () => {
  it("sends an unknown scene home", async () => {
    location.hash = "#/scene/nope";
    await tick();
    const replace = vi.spyOn(location, "replace");
    scene.renderScene(app(), ["nope"]);
    // replace, not assign: back must not return to the dead link. (happy-dom's
    // location.replace still adds a history entry, so the entry count is left to e2e.)
    expect(replace).toHaveBeenCalledWith("#/");
    expect(location.hash).toBe("#/");
    expect(app().childElementCount).toBe(0);
  });

  it("titles the page with the scene and links back home", () => {
    scene.renderScene(app(), ["konbini"]);
    expect(app().querySelector("h1")!.textContent).toBe(sceneById("konbini")!.title);
    const back = app().querySelector<HTMLAnchorElement>("header a")!;
    expect(back.getAttribute("href")).toBe("#/");
  });

  it("has 我要說／對方說 tabs marking the current one", () => {
    scene.renderScene(app(), ["transport"]);
    const tabs = [...app().querySelectorAll<HTMLAnchorElement>('nav[aria-label="分頁"] a')];
    expect(tabs.map((a) => [a.textContent, a.getAttribute("href"), a.getAttribute("aria-current")])).toEqual([
      ["我要說", "#/scene/transport", "page"],
      ["對方說", "#/scene/transport/heard", null],
    ]);
    scene.renderScene(app(), ["transport", "heard"]);
    const heardTabs = [...app().querySelectorAll<HTMLAnchorElement>('nav[aria-label="分頁"] a')];
    expect(heardTabs.map((a) => a.getAttribute("aria-current"))).toEqual([null, "page"]);
  });

  it("lists every phrase of the scene under its group headings", () => {
    const transport = sceneById("transport")!;
    scene.renderScene(app(), ["transport"]);
    const headings = [...app().querySelectorAll("main h2")].map((h) => h.textContent);
    expect(headings).toEqual(transport.groups!.map((g) => g.title));
    expect(rowTitles()).toHaveLength(transport.phrases.length);
  });

  it("asks for a station when a place phrase has none to fill in", () => {
    scene.renderScene(app(), ["transport"]);
    const setup = app().querySelector<HTMLAnchorElement>('main a[href="#/setup"]');
    expect(setup?.textContent).toContain("〇〇");
    expect(app().querySelector('[role="radiogroup"]')).toBeNull();
    // Without a place the phrase falls back to "here".
    expect(rowTitles()).toContain("我想去這裡。（同時給對方看地址或地圖）");
  });
});

describe("phrase overlay", () => {
  const wantToGo = "我想去這裡。（同時給對方看地址或地圖）";

  it("opens from a row with the scene, the Chinese and the Japanese slip", () => {
    scene.renderScene(app(), ["transport"]);
    row(wantToGo).click();
    const dialog = topDialog();
    expect(dialog.getAttribute("aria-label")).toBe(wantToGo);
    expect(dialog.querySelector("h2")!.textContent).toBe(wantToGo);
    // The bar says where you are.
    const hint = button(dialog, "關閉").parentElement!.querySelector("p")!;
    expect(hint.textContent).toBe("交通");
    // The slip: Japanese with ruby and a romaji line.
    const slip = dialog.querySelector('[lang="ja"]')!;
    expect(slip.textContent).toContain("ここ");
    expect(dialog.querySelector("ruby rt")?.textContent).toBe("い");
    expect(dialog.textContent).toContain(romaji(sceneById("transport")!.phrases[0]!.fallback!));
  });

  it("offers play, slow, let-them-tap and show for a phrase with answers", () => {
    scene.renderScene(app(), ["transport"]);
    row(wantToGo).click();
    const dialog = topDialog();
    const labels = buttons(dialog).map((b) => b.textContent?.trim());
    expect(labels).toEqual(expect.arrayContaining(["播放", "慢速", "給對方點選答案", "給對方看"]));
    expect(button(dialog, "播放").getAttribute("aria-label")).toBe("播放「ここに行きたいです。」");
    expect(button(dialog, "慢速").getAttribute("aria-label")).toBe("慢速播放「ここに行きたいです。」");
  });

  it("has no let-them-tap button for a phrase without answers", () => {
    // Any phrase that needs no slot and has no answers will do; find one.
    const found = SCENES.flatMap((s) => s.phrases.map((p) => ({ s, p }))).find(
      ({ s, p }) => !p.answers && slotsOf(p.jp).length === 0 && s.phrases.filter((q) => q.zh === p.zh).length === 1,
    )!;
    scene.renderScene(app(), [found.s.id]);
    row(found.p.zh).click();
    const labels = buttons(topDialog()).map((b) => b.textContent?.trim());
    expect(labels).toEqual(expect.arrayContaining(["播放", "慢速", "給對方看"]));
    expect(labels).not.toContain("給對方點選答案");
  });

  it("makes 給對方看 the only solid action", () => {
    scene.renderScene(app(), ["transport"]);
    row(wantToGo).click();
    // Solid = the filled indigo of docs/design.md principle 9; the class is the look being tested.
    const solid = [...topDialog().querySelectorAll<HTMLElement>("button, a")].filter((el) => el.classList.contains("bg-ai"));
    expect(solid.map((el) => el.textContent?.trim())).toEqual(["給對方看"]);
  });

  it("shows the phrase to the other person on top of itself", () => {
    scene.renderScene(app(), ["transport"]);
    row(wantToGo).click();
    button(topDialog(), "給對方看").click();
    expect(dialogs().map((d) => d.getAttribute("aria-label"))).toEqual([wantToGo, "給對方看"]);
    expect(topDialog().textContent).toContain("ここに行きたいです。");
    expect(topDialog().querySelector("ruby")).toBeNull();
  });

  it("lets the other person tap an answer", () => {
    scene.renderScene(app(), ["transport"]);
    row(wantToGo).click();
    button(topDialog(), "給對方點選答案").click();
    expect(topDialog().getAttribute("aria-label")).toBe("給對方點選");
    button(topDialog(), "右").click();
    expect(topDialog().textContent).toContain("右邊 →");
  });
});

describe("heard view", () => {
  const heard = sceneById("transport")!.heard;

  it("shows a card for everything staff say, without the place picker", () => {
    saveProfile(sampleProfile());
    scene.renderScene(app(), ["transport", "heard"]);
    const cards = [...app().querySelectorAll("main article")];
    expect(cards.map((c) => c.querySelector("h3")?.textContent)).toEqual(heard.map((h) => h.zh));
    expect(app().querySelector('[role="radiogroup"]')).toBeNull();
  });

  it("gives every card a speaker that alternates normal and slow", () => {
    scene.renderScene(app(), ["transport", "heard"]);
    const cards = [...app().querySelectorAll("main article")];
    cards.forEach((card, i) => {
      const text = plain(heard[i]!.jp);
      const speaker = card.querySelector<HTMLButtonElement>("button[aria-label]")!;
      expect(speaker.getAttribute("aria-label")).toBe(`播放「${text}」`);
      speaker.click();
      expect(speaker.getAttribute("aria-label")).toBe(`慢速播放「${text}」`);
      speaker.click();
      expect(speaker.getAttribute("aria-label")).toBe(`播放「${text}」`);
      speaker.click();
      expect(speaker.getAttribute("aria-label")).toBe(`慢速播放「${text}」`);
    });
  });

  it("shows my answer in Japanese when I tap it", () => {
    scene.renderScene(app(), ["transport", "heard"]);
    const reply = heard[0]!.replies[1]!;
    const card = app().querySelector("main article")!;
    button(card, reply.zh).click();
    const dialog = topDialog();
    expect(dialog.getAttribute("aria-label")).toBe("我的回答");
    expect(dialog.textContent).toContain(plain(reply.jp));
    expect(dialog.textContent).toContain(reply.zh);
  });
});

describe("place picker", () => {
  it("is a radio group of the saved places, today's first and picked", () => {
    saveProfile(sampleProfile());
    onDay("2026-11-03");
    scene.renderScene(app(), ["transport"]);
    const group = app().querySelector('[role="radiogroup"]')!;
    expect(group.getAttribute("aria-label")).toBe("目的地");
    const radios = [...group.querySelectorAll<HTMLElement>('[role="radio"]')];
    expect(radios.map((r) => r.textContent!.replace("（有電梯筆記）", ""))).toEqual(["淺草", "淺草寺", "新宿", "上野", "京都", "清水寺", "嵐山"]);
    expect(radios.map((r) => r.getAttribute("aria-checked"))).toEqual(["true", "false", "false", "false", "false", "false", "false"]);
    expect(rowTitles()).toContain("我想去淺草。");
  });

  it("rewrites the 〇〇 phrases when another place is picked", () => {
    saveProfile(sampleProfile());
    onDay("2026-11-03");
    scene.renderScene(app(), ["transport"]);
    const radio = (name: string) =>
      [...app().querySelectorAll<HTMLElement>('[role="radio"]')].find((r) => r.textContent!.startsWith(name))!;
    // 淺草 has an elevator note; it is offered for station staff.
    expect(app().textContent).toContain("淺草・電梯筆記");
    radio("新宿").click();
    expect(radio("新宿").getAttribute("aria-checked")).toBe("true");
    expect(radio("淺草").getAttribute("aria-checked")).toBe("false");
    expect(app().querySelectorAll('[aria-checked="true"]')).toHaveLength(1);
    expect(rowTitles()).toContain("我想去新宿。");
    expect(rowTitles()).not.toContain("我想去淺草。");
    expect(app().textContent).not.toContain("淺草・電梯筆記");
    // The picked station reaches the Japanese too.
    row("我想去新宿。").click();
    expect(button(topDialog(), "播放").getAttribute("aria-label")).toBe("播放「新宿駅に行きたいです。」");
  });

  // Regression: picking redraws the whole picker; without refocusing, the focus fell to
  // <body> and keyboard and screen-reader users had to start over from the top.
  it("keeps the focus on the place just picked", () => {
    saveProfile(sampleProfile());
    onDay("2026-11-03");
    scene.renderScene(app(), ["transport"]);
    const target = [...app().querySelectorAll<HTMLElement>('[role="radio"]')].find((r) => r.textContent === "新宿")!;
    target.focus();
    target.click();
    const focused = document.activeElement;
    expect(focused?.getAttribute("role")).toBe("radio");
    expect(focused?.textContent).toBe("新宿");
  });

  // The redraw replaces the scrolling row; the chip just tapped must stay where the finger is.
  it("keeps the destination row scrolled where it was", () => {
    saveProfile(sampleProfile());
    onDay("2026-11-03");
    scene.renderScene(app(), ["transport"]);
    const row = () => app().querySelector<HTMLElement>('[role="radiogroup"]')!;
    row().scrollLeft = 120;
    [...row().querySelectorAll<HTMLElement>('[role="radio"]')].at(-1)!.click();
    expect(row().scrollLeft).toBe(120);
  });

  it("keeps the pick across scenes", () => {
    saveProfile(sampleProfile());
    onDay("2026-11-03");
    scene.renderScene(app(), ["transport"]);
    [...app().querySelectorAll<HTMLElement>('[role="radio"]')].find((r) => r.textContent === "上野")!.click();
    scene.renderScene(app(), ["transport"]);
    const checked = app().querySelector('[role="radio"][aria-checked="true"]');
    expect(checked?.textContent).toBe("上野");
  });
});

describe("萬用句 dock", () => {
  it("opens the rescue list, and a tap shows that sentence", () => {
    scene.renderScene(app(), ["restaurant"]);
    const dock = app().querySelector('nav[aria-label="萬用句"]')!;
    buttons(dock)[0]!.click();
    const list = topDialog();
    expect(list.getAttribute("aria-label")).toBe("萬用句");
    for (const phrase of RESCUE) expect(list.textContent).toContain(phrase.zh);
    const slowly = RESCUE.find((p) => p.id === "rescue-slowly")!;
    buttons(list).find((b) => b.textContent?.startsWith(slowly.zh))!.click();
    expect(dialogs().map((d) => d.getAttribute("aria-label"))).toEqual(["萬用句", slowly.zh]);
    expect(topDialog().textContent).toContain(plain(slowly.jp));
  });

  it("is on the heard view too", () => {
    scene.renderScene(app(), ["restaurant", "heard"]);
    expect(app().querySelector('nav[aria-label="萬用句"] button')).not.toBeNull();
  });
});
