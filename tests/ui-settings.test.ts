// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 字體與聲音 (Text and voice): the choices are radio groups a keyboard and a
// screen reader can use.

beforeEach(() => {
  document.body.replaceChildren();
  localStorage.clear();
  const app = document.createElement("div");
  app.id = "app";
  document.body.append(app);
  // settings and state.ts keep the current settings in module state.
  vi.resetModules();
});

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.removeAttribute("data-text-size");
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
});

const app = () => document.getElementById("app")!;
const render = async () => (await import("../src/ui/settings")).renderSettings(app());
const group = (name: string) => app().querySelector<HTMLElement>(`[role="radiogroup"][aria-label="${name}"]`)!;
const radio = (name: string, label: string) => [...group(name).querySelectorAll<HTMLElement>('[role="radio"]')].find((r) => r.textContent === label)!;
const key = (target: HTMLElement, name: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true, ...init }));

describe("settings", () => {
  it("names each choice group after its section", async () => {
    await render();
    expect(group("字體大小")).not.toBeNull();
    expect(group("顏色")).not.toBeNull();
  });

  it("keeps focus on the choice just made, though the page redraws", async () => {
    await render();
    radio("字體大小", "特大").click();
    expect(document.activeElement).toBe(radio("字體大小", "特大"));
    expect(radio("字體大小", "特大").getAttribute("aria-checked")).toBe("true");
    radio("顏色", "深色").click();
    expect(document.activeElement).toBe(radio("顏色", "深色"));
  });

  it("is one Tab stop per group, on the checked choice", async () => {
    await render();
    const tabbable = [...group("顏色").querySelectorAll<HTMLElement>('[role="radio"]')].map((r) => r.tabIndex);
    expect(tabbable).toEqual([0, -1, -1]);
  });

  it("moves the choice with the arrow keys, wrapping around, as native radio buttons do", async () => {
    await render();
    key(radio("顏色", "跟手機"), "ArrowRight");
    expect(radio("顏色", "淺色").getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(radio("顏色", "淺色"));
    key(radio("顏色", "淺色"), "End");
    expect(document.activeElement).toBe(radio("顏色", "深色"));
    key(radio("顏色", "深色"), "ArrowDown");
    expect(document.activeElement).toBe(radio("顏色", "跟手機"));
    expect(JSON.parse(localStorage.getItem("travelbuddy.japan.settings")!).data.theme).toBe("system");
  });

  it("leaves Alt+Left to the browser (Back)", async () => {
    await render();
    expect(key(radio("顏色", "跟手機"), "ArrowLeft", { altKey: true })).toBe(true);
    expect(radio("顏色", "跟手機").getAttribute("aria-checked")).toBe("true");
  });
});
