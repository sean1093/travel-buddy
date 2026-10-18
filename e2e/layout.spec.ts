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

        // One pass in the page: overflow, then every visible tappable target in the content.
        const report = await page.evaluate((min) => {
          const doc = document.documentElement;
          const visible = (el: Element) => {
            const r = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            return r.width > 0 && r.height > 0 && style.visibility !== "hidden" && !el.closest("[aria-hidden=true], [inert]");
          };
          const describe = (el: Element) =>
            `<${el.tagName.toLowerCase()}> "${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40)}"`;
          const small = [...document.querySelectorAll("main a[href], main button")]
            .filter(visible)
            .map((el) => ({ el, height: el.getBoundingClientRect().height }))
            .filter(({ height }) => height < min)
            .map(({ el, height }) => `${describe(el)} ${height.toFixed(1)}px`);
          // Wider than the viewport: what makes the page scroll sideways.
          const wide = [...document.querySelectorAll("body *")]
            .filter((el) => visible(el) && el.getBoundingClientRect().right > doc.clientWidth + 0.5)
            .slice(0, 5)
            .map((el) => `${describe(el)} right=${el.getBoundingClientRect().right.toFixed(1)}`);
          return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, small, wide };
        }, MIN_TARGET);

        expect
          .soft(report.scrollWidth, `horizontal overflow; widest: ${report.wide.join(", ")}`)
          .toBeLessThanOrEqual(report.clientWidth);
        expect.soft(report.small, `tap targets under ${MIN_TARGET}px tall`).toEqual([]);

        // Accessible names as the browser computes them: an unnamed button or link shows as a bare role.
        const tree = await page.locator("body").ariaSnapshot();
        const unnamed = tree.split("\n").filter((line) => /^\s*- (button|link)(:|\s*\[|$)/.test(line));
        expect.soft(unnamed, "buttons and links without an accessible name").toEqual([]);
      });
    }
  });
}
