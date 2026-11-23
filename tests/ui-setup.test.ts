// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { encodeProfile } from "../src/share/codec";
import { spoken } from "./a11y";
import { sampleProfile } from "./fixtures";

// Setting up and receiving a profile: 設定資料 (Set up info) and the share-link import.

function resetPage(): void {
  window.dispatchEvent(new Event("hashchange"));
  history.replaceState(null, "", location.pathname);
  document.body.replaceChildren();
  localStorage.clear();
}

const persist = vi.fn(() => Promise.resolve(true));
const persisted = vi.fn(() => Promise.resolve(false));
/** persist() runs after persisted() answers. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(async () => {
  // Let an announcement from the previous test land first, so it isn't heard in this one.
  await new Promise((resolve) => requestAnimationFrame(resolve));
  resetPage();
  const app = document.createElement("div");
  app.id = "app";
  document.body.append(app);
  // store.ts asks for persistent storage once per page: fresh modules per test.
  vi.resetModules();
  persist.mockClear();
  persisted.mockClear();
  Object.defineProperty(navigator, "storage", { value: { persist, persisted }, configurable: true });
});

afterEach(resetPage);

const app = () => document.getElementById("app")!;
const saveProfile = (data: unknown) => localStorage.setItem("travelbuddy.japan.profile", JSON.stringify({ v: 1, data }));
const stored = () => JSON.parse(localStorage.getItem("travelbuddy.japan.profile")!).data;

describe("setup", () => {
  const render = async () => (await import("../src/ui/setup")).renderSetup(app());
  const deletes = () => [...app().querySelectorAll<HTMLButtonElement>("button[aria-label^='刪除']")];
  const hotelDeletes = () => deletes().filter((b) => b.getAttribute("aria-label")!.startsWith("刪除飯店"));

  it("names each delete button after its card", async () => {
    saveProfile(sampleProfile());
    await render();
    expect(hotelDeletes().map((b) => b.getAttribute("aria-label"))).toEqual(sampleProfile().hotels.map((_, i) => `刪除飯店 ${i + 1}`));
  });

  it("keeps focus next to a deleted card, and says what went", async () => {
    saveProfile(sampleProfile());
    await render();
    const count = sampleProfile().hotels.length;
    hotelDeletes()[1]!.click();
    expect(stored().hotels).toHaveLength(count - 1);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("刪除飯店 1");
    expect(await spoken()).toBe("已刪除飯店 2");
  });

  it("says a card was added, since 已儲存 is said only on change", async () => {
    await render();
    [...app().querySelectorAll("button")].find((b) => b.textContent === "新增飯店")!.click();
    expect(await spoken()).toBe("已新增飯店 1");
  });

  it("moves focus to the add button when the last card goes", async () => {
    saveProfile({ ...sampleProfile(), hotels: [sampleProfile().hotels[0]] });
    await render();
    hotelDeletes()[0]!.click();
    expect(hotelDeletes()).toHaveLength(0);
    expect(document.activeElement?.textContent).toBe("新增飯店");
  });

  it("says 已儲存 when a field is finished, not on every key", async () => {
    await render();
    const name = app().querySelector<HTMLInputElement>("input")!;
    for (const value of ["媽", "媽媽"]) {
      name.value = value;
      name.dispatchEvent(new Event("input", { bubbles: true }));
    }
    expect(stored().callName).toBe("媽媽");
    // The visible badge is not a live region.
    expect(app().querySelector("[aria-live]")).toBeNull();
    expect(await spoken()).toBe("");
    name.dispatchEvent(new Event("change", { bubbles: true }));
    expect(await spoken()).toBe("已儲存");
  });

  it("marks, explains and says a birth year it can't keep, instead of 已儲存", async () => {
    saveProfile({ birthYear: 1950 });
    await render();
    const year = app().querySelector<HTMLInputElement>('input[inputmode="numeric"]')!;
    const type = (value: string) => {
      year.value = value;
      year.dispatchEvent(new Event("input", { bubbles: true }));
      year.dispatchEvent(new Event("change", { bubbles: true }));
    };
    type("195");
    // The year kept stays until a good one replaces it: the message says the field isn't saved.
    expect(stored().birthYear).toBe(1950);
    expect(year.getAttribute("aria-invalid")).toBe("true");
    const error = document.getElementById(year.getAttribute("aria-describedby")!)!;
    expect(error.textContent).toBe("請填四位數的西元年，例：1956。這一欄還沒存。");
    expect(await spoken()).toBe("請填四位數的西元年，例：1956。這一欄還沒存。");
    // Full-width digits, as a Chinese keyboard may type them, are a year too.
    type("１９５６");
    expect(stored().birthYear).toBe(1956);
    expect(year.hasAttribute("aria-invalid")).toBe(false);
    expect(error.textContent).toBe("");
    expect(await spoken()).toBe("已儲存");
  });

  it("asks the browser to keep the data on 完成, not while typing (Firefox shows a prompt for it)", async () => {
    await render();
    const name = app().querySelector<HTMLInputElement>("input")!;
    name.value = "媽媽";
    name.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(persist).not.toHaveBeenCalled();
    [...app().querySelectorAll("a")].find((a) => a.textContent === "完成")!.addEventListener("click", (e) => e.preventDefault());
    [...app().querySelectorAll("a")].find((a) => a.textContent === "完成")!.click();
    await settle();
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("doesn't ask again when the browser already keeps the data", async () => {
    persisted.mockResolvedValueOnce(true);
    await render();
    const done = [...app().querySelectorAll("a")].find((a) => a.textContent === "分享")!;
    done.addEventListener("click", (e) => e.preventDefault());
    done.click();
    await settle();
    expect(persist).not.toHaveBeenCalled();
  });
});

describe("import", () => {
  const render = async (payload: string) => (await import("../src/ui/import")).renderImport(app(), [payload]);

  it("saves the profile, suggests the home screen, and asks to keep the data on 開始使用", async () => {
    history.replaceState(null, "", `${location.pathname}?openExternalBrowser=1#/s/${encodeProfile(sampleProfile())}`);
    await render(encodeProfile(sampleProfile()));
    expect(stored()).toEqual(JSON.parse(JSON.stringify(sampleProfile())));
    await settle();
    // Not as the screen opens: Firefox shows a prompt for it.
    expect(persist).not.toHaveBeenCalled();
    const start = [...app().querySelectorAll("a")].find((a) => a.textContent === "開始使用")!;
    start.addEventListener("click", (e) => e.preventDefault());
    start.click();
    await settle();
    expect(persist).toHaveBeenCalledTimes(1);
    expect(app().querySelector("h1")?.textContent).toBe("設定完成");
    const { HOME_SCREEN_TIP } = await import("../src/ui/import");
    expect(app().textContent).toContain(HOME_SCREEN_TIP);
  });

  it("doesn't suggest the home screen on an iPhone, where the icon wouldn't see the saved data", async () => {
    const ua = vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)");
    try {
      await render(encodeProfile(sampleProfile()));
      const { HOME_SCREEN_TIP } = await import("../src/ui/import");
      expect(app().querySelector("h1")?.textContent).toBe("設定完成");
      expect(app().textContent).not.toContain(HOME_SCREEN_TIP);
    } finally {
      ua.mockRestore();
    }
  });

  it("clears the payload and LINE's query from the address bar", async () => {
    history.replaceState(null, "", `${location.pathname}?openExternalBrowser=1#/s/${encodeProfile(sampleProfile())}`);
    await render(encodeProfile(sampleProfile()));
    expect(location.search).toBe("");
    expect(location.hash).toBe("#/imported");
  });

  it("doesn't ask to keep anything for a broken link", async () => {
    await render("1.AAAA");
    expect(app().querySelector("h1")?.textContent).toBe("這個連結好像不完整");
    await settle();
    expect(persist).not.toHaveBeenCalled();
  });
});
