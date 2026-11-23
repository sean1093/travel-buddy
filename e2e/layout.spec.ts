import type { Page } from "@playwright/test";
import { expect, SAMPLE_PROFILE, test, type SeedOptions } from "./fixtures";

const ROUTES = [
  "#/",
  "#/help",
  "#/scene/transport",
  "#/scene/konbini/heard",
  "#/medical",
  "#/setup",
  "#/hotel",
  "#/guide/tax-refund",
  "#/tools",
  "#/settings",
  "#/print",
];

interface Variant {
  name: string;
  viewport: { width: number; height: number };
  settings?: Omit<SeedOptions, "profile">;
}

const VARIANTS: Variant[] = [
  { name: "phone", viewport: { width: 390, height: 844 } },
  { name: "narrow", viewport: { width: 320, height: 640 } },
  { name: "xlarge", viewport: { width: 390, height: 844 }, settings: { textSize: "xlarge" } },
  { name: "dark", viewport: { width: 390, height: 844 }, settings: { theme: "dark" } },
  { name: "landscape", viewport: { width: 844, height: 390 } },
];

/** WCAG 2.5.5 / Apple HIG minimum; docs/design.md asks for more, this is the floor. */
const MIN_TARGET = 44;

/**
 * Full-screen layers, where the phone is handed to the other person: each is
 * opened on top of a page and measured the same way.
 */
const OVERLAYS: { name: string; route: string; open: (page: Page) => Promise<void> }[] = [
  {
    name: "phrase page",
    route: "#/scene/transport",
    open: (page) => page.getByRole("button", { name: /這班車有停/ }).first().click(),
  },
  {
    name: "給對方點選 (let them tap)",
    route: "#/scene/transport",
    open: async (page) => {
      await page.getByRole("button", { name: /幾號月台/ }).first().click();
      await page.getByRole("button", { name: "給對方點選答案" }).click();
    },
  },
  {
    name: "給對方看 (show them)",
    route: "#/help",
    open: (page) => page.getByRole("button", { name: "給對方看", exact: true }).click(),
  },
  {
    name: "萬用句 (all-purpose phrases)",
    route: "#/scene/konbini",
    open: (page) => page.getByRole("button", { name: /萬用句/ }).click(),
  },
];

/**
 * Checks what's on screen now: no sideways scroll, every visible tappable target
 * (page header, content, open layers) at least MIN_TARGET tall, and every button
 * and link named. Covered content (inert or aria-hidden) is skipped.
 */
async function checkScreen(page: Page): Promise<void> {
  const report = await page.evaluate((min) => {
    const doc = document.documentElement;
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && style.visibility !== "hidden" && !el.closest("[aria-hidden=true], [inert]");
    };
    const describe = (el: Element) =>
      `<${el.tagName.toLowerCase()}> "${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40)}"`;
    const targets = "header a[href], header button, main a[href], main button, [role=dialog] a[href], [role=dialog] button";
    const small = [...document.querySelectorAll(targets)]
      .filter(visible)
      .map((el) => ({ el, height: el.getBoundingClientRect().height }))
      .filter(({ height }) => height < min)
      .map(({ el, height }) => `${describe(el)} ${height.toFixed(1)}px`);
    // Text that doesn't fit its button spills over its neighbours without scrolling the page.
    const spilled = [...document.querySelectorAll(targets)]
      .filter((el) => visible(el) && el.scrollWidth > el.clientWidth + 1)
      .map((el) => `${describe(el)} ${el.scrollWidth}>${el.clientWidth}`);
    // Wider than the viewport: what makes the page scroll sideways.
    const wide = [...document.querySelectorAll("body *")]
      .filter((el) => visible(el) && el.getBoundingClientRect().right > doc.clientWidth + 0.5)
      .slice(0, 5)
      .map((el) => `${describe(el)} right=${el.getBoundingClientRect().right.toFixed(1)}`);
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, small, wide, spilled };
  }, MIN_TARGET);

  expect
    .soft(report.scrollWidth, `horizontal overflow; widest: ${report.wide.join(", ")}`)
    .toBeLessThanOrEqual(report.clientWidth);
  expect.soft(report.small, `tap targets under ${MIN_TARGET}px tall`).toEqual([]);
  expect.soft(report.spilled, "buttons and links whose content doesn't fit").toEqual([]);

  // Accessible names as the browser computes them: an unnamed button or link shows as a bare role.
  const tree = await page.locator("body").ariaSnapshot();
  const unnamed = tree.split("\n").filter((line) => /^\s*- (button|link)(:|\s*\[|$)/.test(line));
  expect.soft(unnamed, "buttons and links without an accessible name").toEqual([]);
}


for (const variant of VARIANTS) {
  test.describe(variant.name, () => {
    test.use({ viewport: variant.viewport });

    for (const route of ROUTES) {
      test(route, async ({ page, seed }) => {
        await seed({ profile: SAMPLE_PROFILE, ...variant.settings });
        await page.goto(route);
        await expect(page.locator("h1").first()).toBeVisible();
        if (variant.settings?.theme) await expect(page.locator("html")).toHaveAttribute("data-theme", variant.settings.theme);
        if (variant.settings?.textSize) await expect(page.locator("html")).toHaveAttribute("data-text-size", variant.settings.textSize);
        await checkScreen(page);
      });
    }

    test("#/setup: a focused field is never hidden behind the header or the dock", async ({ page, seed }) => {
      await seed({ profile: SAMPLE_PROFILE, ...variant.settings });
      await page.goto("#/setup");
      await expect(page.locator("h1").first()).toBeVisible();
      // Open every section, then walk the form the way a keyboard or switch user does.
      await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
      await page.locator("main input").first().focus();
      const hidden: string[] = [];
      for (let i = 0; i < 60; i++) {
        const r = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          if (!el.closest("main") || el.matches("details, summary")) return null;
          const box = el.getBoundingClientRect();
          const top = document.querySelector("header")!.getBoundingClientRect().bottom;
          const bottom = document.querySelector("[data-dock]")!.getBoundingClientRect().top;
          // The first line, where the caret and the text being typed are: a box taller than the
          // space (the 電梯筆記 text area when sideways) can't show whole, and needn't (WCAG 2.4.11).
          const firstLine = Math.min(box.height, 48);
          return { what: `${el.tagName} ${el.getAttribute("aria-label") ?? ""} ${box.top.toFixed(0)}–${box.bottom.toFixed(0)}, clear ${top.toFixed(0)}–${bottom.toFixed(0)}`, covered: box.top < top - 0.5 || box.top + firstLine > bottom + 0.5 };
        });
        if (r?.covered) hidden.push(r.what);
        await page.keyboard.press("Tab");
      }
      expect(hidden).toEqual([]);
    });

    test("the 醫療卡 shortcut opens at the medical card, in view", async ({ page, seed }) => {
      await seed({ profile: SAMPLE_PROFILE, ...variant.settings });
      await page.goto("#/");
      await page.getByRole("link", { name: "醫療卡" }).click();
      const heading = page.getByRole("heading", { name: "醫療卡（給醫生、救護人員看）" });
      await expect(heading).toBeFocused();
      const box = (await heading.boundingBox())!;
      const headerBottom = await page.locator("header").evaluate((el) => el.getBoundingClientRect().bottom);
      expect(box.y).toBeGreaterThanOrEqual(headerBottom - 0.5);
      expect(box.y + box.height).toBeLessThanOrEqual(variant.viewport.height);
    });

    for (const overlay of OVERLAYS) {
      test(`overlay: ${overlay.name}`, async ({ page, seed }) => {
        await seed({ profile: SAMPLE_PROFILE, ...variant.settings });
        await page.goto(overlay.route);
        await expect(page.locator("h1").first()).toBeVisible();
        await overlay.open(page);
        await expect(page.getByRole("dialog").last()).toBeVisible();
        await checkScreen(page);
      });
    }
  });
}
