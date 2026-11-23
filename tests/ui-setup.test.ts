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

beforeEach(() => {
  resetPage();
  const app = document.createElement("div");
  app.id = "app";
  document.body.append(app);
  // store.ts asks for persistent storage once per page: fresh modules per test.
  vi.resetModules();
  persist.mockClear();
  Object.defineProperty(navigator, "storage", { value: { persist }, configurable: true });
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

  it("asks the browser to keep the data once something is saved", async () => {
    await render();
    expect(persist).not.toHaveBeenCalled();
    const name = app().querySelector<HTMLInputElement>("input")!;
    name.value = "媽媽";
    name.dispatchEvent(new Event("input", { bubbles: true }));
    name.dispatchEvent(new Event("input", { bubbles: true }));
    expect(persist).toHaveBeenCalledTimes(1);
  });
});

describe("import", () => {
  const render = async (payload: string) => (await import("../src/ui/import")).renderImport(app(), [payload]);

  it("saves the profile, asks to keep it, and suggests the home screen", async () => {
    history.replaceState(null, "", `${location.pathname}?openExternalBrowser=1#/s/${encodeProfile(sampleProfile())}`);
    await render(encodeProfile(sampleProfile()));
    expect(stored()).toEqual(JSON.parse(JSON.stringify(sampleProfile())));
    expect(persist).toHaveBeenCalledTimes(1);
    expect(app().querySelector("h1")?.textContent).toBe("設定完成");
    const { HOME_SCREEN_TIP } = await import("../src/ui/import");
    expect(app().textContent).toContain(HOME_SCREEN_TIP);
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
    expect(persist).not.toHaveBeenCalled();
  });
});
