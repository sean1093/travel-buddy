// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SYMPTOMS } from "../src/content/medical";
import { SCENES } from "../src/content/scenes";
import { sampleProfile } from "./fixtures";

function resetPage(): void {
  window.dispatchEvent(new Event("hashchange"));
  history.replaceState(null, "", location.pathname);
  document.body.replaceChildren();
  document.body.className = "";
  localStorage.clear();
}

beforeEach(() => {
  resetPage();
  const app = document.createElement("div");
  app.id = "app";
  document.body.append(app);
  // Pages read the profile, speech and their observers when imported or rendered: fresh modules per test.
  vi.resetModules();
});

afterEach(() => {
  resetPage();
  vi.useRealTimers();
});

const app = () => document.getElementById("app")!;
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const dialogs = () => [...document.querySelectorAll<HTMLElement>('[role="dialog"]')];
const links = (root: ParentNode) => [...root.querySelectorAll<HTMLAnchorElement>("a")];
const saveProfile = (data: unknown) => localStorage.setItem("travelbuddy.japan.profile", JSON.stringify({ v: 1, data }));
const onDay = (day: string) => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(`${day}T10:00:00`));
};

describe("home", () => {
  const render = async () => (await import("../src/ui/home")).renderHome(app());
  const todayHeading = () => [...app().querySelectorAll("h2")].find((h) => h.textContent === "今天要去");

  it("greets by name, without the first-use card, once a profile is saved", async () => {
    saveProfile(sampleProfile());
    await render();
    expect(app().querySelector("h1")!.textContent).toBe("媽媽，旅途平安");
    expect(app().textContent).not.toContain("第一次使用");
  });

  it("shows the first-use card with an empty profile", async () => {
    await render();
    expect(app().querySelector("h1")!.textContent).toBe("隨身旅伴");
    expect(app().textContent).toContain("第一次使用");
    expect(links(app()).find((a) => a.textContent === "開始填資料")?.getAttribute("href")).toBe("#/setup");
  });

  it("puts 我需要幫忙 first, linking to the help card", async () => {
    await render();
    const first = app().querySelector("main a")!;
    expect(first.getAttribute("href")).toBe("#/help");
    expect(first.textContent).toContain("我需要幫忙");
  });

  it("links all ten scenes in order", async () => {
    await render();
    const scenes = links(app().querySelector('nav[aria-label="情境"]')!);
    expect(scenes).toHaveLength(10);
    expect(scenes.map((a) => a.getAttribute("href"))).toEqual(SCENES.map((s) => `#/scene/${s.id}`));
    expect(scenes.map((a) => a.textContent)).toEqual(SCENES.map((s) => s.title));
  });

  it("shows 今天要去 only on a day with places", async () => {
    saveProfile(sampleProfile());
    onDay("2026-12-01");
    await render();
    expect(todayHeading()).toBeUndefined();
  });

  it("lists today's places and opens transport with the tapped one", async () => {
    saveProfile(sampleProfile());
    onDay("2026-11-03");
    await render();
    const section = todayHeading()!.parentElement!;
    const places = [...section.querySelectorAll("button")];
    expect(places.map((b) => b.textContent)).toEqual(["淺草", "淺草寺"]);
    places[1]!.click();
    expect(location.hash).toBe("#/scene/transport");
    // The tapped place is the one transport fills in.
    const { renderScene } = await import("../src/ui/scene");
    renderScene(app(), ["transport"]);
    expect(app().querySelector('[role="radio"][aria-checked="true"]')?.textContent).toBe("淺草寺");
  });

  it("links the settings list", async () => {
    await render();
    const others = links(app().querySelector('nav[aria-label="其他"]')!);
    expect(others.map((a) => a.getAttribute("href"))).toEqual(["#/setup", "#/settings", "#/print"]);
    expect(others.map((a) => a.querySelector("span > span")?.textContent)).toEqual(["設定資料", "字體與聲音", "列印小卡"]);
  });

  it("warns when the phone has voices but none Japanese", async () => {
    vi.stubGlobal("speechSynthesis", {
      speaking: false,
      pending: false,
      getVoices: () => [{ lang: "en-US", name: "Samantha", voiceURI: "Samantha" }],
      addEventListener: () => {},
      cancel: () => {},
      speak: () => {},
    });
    await render();
    const warning = links(app()).find((a) => a.textContent?.includes("這支手機還不會念日文"));
    expect(warning?.getAttribute("href")).toBe("#/settings");
  });

  it("does not warn when speech is simply unavailable", async () => {
    await render();
    expect(app().textContent).not.toContain("這支手機還不會念日文");
  });
});

describe("page layout", () => {
  class FakeObserver {
    static created = 0;
    static disconnected = 0;
    static last: FakeObserver;
    target: Element | null = null;
    constructor(readonly callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {
      FakeObserver.created += 1;
      FakeObserver.last = this;
    }
    observe(target: Element) {
      this.target = target;
    }
    unobserve() {}
    disconnect() {
      FakeObserver.disconnected += 1;
    }
    takeRecords() {
      return [];
    }
  }

  beforeEach(() => {
    FakeObserver.created = 0;
    FakeObserver.disconnected = 0;
    vi.stubGlobal("IntersectionObserver", FakeObserver);
  });

  const layout = () => import("../src/ui/layout");
  const body = () => [document.createElement("p")];

  it("has a back link home and a large title", async () => {
    (await layout()).page(app(), "醫療・過敏", body());
    const back = app().querySelector<HTMLAnchorElement>("header a")!;
    expect(back.textContent).toBe("首頁");
    expect(back.getAttribute("href")).toBe("#/");
    expect(app().querySelector("h1")!.textContent).toBe("醫療・過敏");
    expect(app().querySelectorAll("h1")).toHaveLength(1);
    expect(app().querySelector("main p")).not.toBeNull();
  });

  it("can go back somewhere else", async () => {
    (await layout()).page(app(), "分享", body(), { back: "#/setup", backLabel: "設定資料" });
    const back = app().querySelector<HTMLAnchorElement>("header a")!;
    expect(back.textContent).toBe("設定資料");
    expect(back.getAttribute("href")).toBe("#/setup");
  });

  it("shows the one-line title in the bar only once the large one has scrolled away", async () => {
    (await layout()).page(app(), "交通", body());
    const compact = app().querySelector<HTMLElement>('header > span[aria-hidden="true"]')!;
    expect(compact.textContent).toBe("交通");
    expect(FakeObserver.last.target).toBe(app().querySelector("h1"));
    // opacity-0 is the behaviour here: the copy is invisible while the real title shows.
    expect(compact.classList.contains("opacity-0")).toBe(true);
    FakeObserver.last.callback([{ isIntersecting: false }]);
    expect(compact.classList.contains("opacity-0")).toBe(false);
    FakeObserver.last.callback([{ isIntersecting: true }]);
    expect(compact.classList.contains("opacity-0")).toBe(true);
  });

  it("keeps one title watcher alive across re-renders", async () => {
    const { page } = await layout();
    page(app(), "一", body());
    page(app(), "二", body());
    page(app(), "三", body());
    expect(FakeObserver.created).toBe(3);
    expect(FakeObserver.created - FakeObserver.disconnected).toBe(1);
  });

  it("still renders where IntersectionObserver is missing", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    (await layout()).page(app(), "交通", body());
    expect(app().querySelector("h1")!.textContent).toBe("交通");
  });
});

describe("medical", () => {
  const render = async () => (await import("../src/ui/medical")).renderMedical(app());
  const symptoms = () => [...app().querySelectorAll<HTMLButtonElement>("button[aria-pressed]")];
  const symptom = (zh: string) => symptoms().find((b) => b.textContent === zh)!;
  const showButton = () =>
    [...app().querySelectorAll<HTMLButtonElement>("button")].find((b) => /先點選症狀|給對方看（/.test(b.textContent ?? ""))!;

  it("offers every symptom as an unpressed toggle", async () => {
    await render();
    expect(symptoms().map((b) => b.textContent)).toEqual(SYMPTOMS.map((s) => s.zh));
    expect(symptoms().every((b) => b.getAttribute("aria-pressed") === "false")).toBe(true);
  });

  it("asks for a symptom before it can show anything", async () => {
    await render();
    expect(showButton().disabled).toBe(true);
    expect(showButton().textContent).toBe("先點選症狀");
    expect(showButton().parentElement!.className).not.toContain("sticky");
  });

  it("counts the picked symptoms and follows the list down", async () => {
    await render();
    symptom("頭痛").click();
    expect(symptom("頭痛").getAttribute("aria-pressed")).toBe("true");
    expect(showButton().disabled).toBe(false);
    expect(showButton().textContent).toBe("給對方看（1 項）");
    // Sticky is the behaviour: the next step stays on screen while the list scrolls.
    expect(showButton().parentElement!.className).toContain("sticky");
    symptom("發燒").click();
    expect(showButton().textContent).toBe("給對方看（2 項）");
  });

  it("goes back to the start when every symptom is unpicked", async () => {
    await render();
    symptom("頭痛").click();
    symptom("發燒").click();
    symptom("頭痛").click();
    expect(symptom("頭痛").getAttribute("aria-pressed")).toBe("false");
    expect(showButton().textContent).toBe("給對方看（1 項）");
    symptom("發燒").click();
    expect(showButton().disabled).toBe(true);
    expect(showButton().textContent).toBe("先點選症狀");
    expect(showButton().parentElement!.className).not.toContain("sticky");
  });

  it("shows the picked symptoms to the other person", async () => {
    await render();
    symptom("發燒").click();
    symptom("頭痛").click();
    showButton().click();
    const dialog = dialogs().at(-1)!;
    expect(dialog.getAttribute("aria-label")).toBe("我的症狀");
    expect(dialog.textContent).toContain("我有這些症狀：");
    expect(dialog.textContent).toContain("頭が痛いです。");
    expect(dialog.textContent).toContain("熱があります。");
    expect(dialog.textContent).not.toContain("寒気");
  });

  it("asks for health data with an empty profile, and shows the allergy card once there is some", async () => {
    await render();
    expect(app().querySelector('main a[href="#/setup"]')).not.toBeNull();
    expect(app().textContent).not.toContain("過敏卡（給餐廳看）");
    saveProfile(sampleProfile());
    await render();
    expect(app().querySelector('main a[href="#/setup"]')).toBeNull();
    expect(app().textContent).toContain("過敏卡（給餐廳看）");
    expect(app().textContent).toContain("LIN MEI-HUA");
  });
});

describe("help", () => {
  const render = async () => (await import("../src/ui/help")).renderHelp(app());

  it("dates the numbers by the oldest check among them, never the freshest", async () => {
    const actual = await vi.importActual<typeof import("../src/content/emergency")>("../src/content/emergency");
    const [first, ...rest] = actual.EMERGENCY_NUMBERS;
    // The first number re-checked recently, another one long ago.
    const numbers = [{ ...first!, verified: "2027-09-01" }, ...rest.map((e, i) => (i === 2 ? { ...e, verified: "2026-01-15" } : e))];
    vi.doMock("../src/content/emergency", () => ({ ...actual, EMERGENCY_NUMBERS: numbers }));
    try {
      await render();
      expect(app().textContent).toContain("電話號碼查證日期：2026-01-15");
    } finally {
      // resetModules doesn't clear doMock: a failure here must not leak into the other help tests.
      vi.doUnmock("../src/content/emergency");
    }
  });
  const callDock = () => app().querySelector('nav[aria-label="撥打電話"]')!;

  it("docks 110 and 119", async () => {
    await render();
    const hrefs = links(callDock()).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["tel:110", "tel:119"]);
    expect(callDock().textContent).toContain("警察");
    expect(callDock().textContent).toContain("救護車");
  });

  it("adds the family call only when a contact is saved", async () => {
    saveProfile(sampleProfile());
    await render();
    const calls = links(callDock());
    expect(calls).toHaveLength(3);
    expect(calls[0]!.getAttribute("href")).toBe("tel:+886912345678");
    expect(calls[0]!.textContent).toContain("女兒");
    expect(calls[0]!.textContent).toContain("國際電話");
  });

  it("puts the passport name on the card", async () => {
    saveProfile(sampleProfile());
    await render();
    const card = [...app().querySelectorAll('main [lang="ja"]')].map((el) => el.textContent).join("\n");
    expect(card).toContain("名前：LIN MEI-HUA");
    expect(app().textContent).not.toContain("還沒有填飯店和家人電話");
  });

  it("asks for hotel and family with an empty profile", async () => {
    await render();
    expect(app().textContent).not.toContain("名前：");
    expect(app().querySelector('main a[href="#/setup"]')?.textContent).toContain("還沒有填飯店和家人電話");
  });

  it("enlarges the whole card for the other person", async () => {
    saveProfile(sampleProfile());
    await render();
    [...app().querySelectorAll("button")].find((b) => b.textContent === "放大")!.click();
    const dialog = dialogs().at(-1)!;
    expect(dialog.getAttribute("aria-label")).toBe("我需要幫忙");
    expect(dialog.textContent).toContain("名前：LIN MEI-HUA");
  });

  it("closes an enlarged card when leaving the page", async () => {
    await render();
    [...app().querySelectorAll("button")].find((b) => b.textContent === "放大")!.click();
    expect(dialogs()).toHaveLength(1);
    location.hash = "#/";
    await tick();
    expect(dialogs()).toHaveLength(0);
  });
});
