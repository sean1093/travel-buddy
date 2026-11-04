import { guideById } from "../src/content/guides";
import { expect, SAMPLE_PROFILE, test } from "./fixtures";

// What crawlers and link previews get from the built site. tests/seo.test.ts checks
// the source files; this checks that the build keeps them and serves what they name.
const SITE_URL = "https://sean1093.github.io/travel-buddy/japan/";

test("the built page keeps its canonical URL, preview tags and structured data", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", SITE_URL);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `${SITE_URL}og-image.png`);
  const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(data["@type"]).toBe("WebApplication");
});

test("the preview image and the sitemap are served where the tags say", async ({ request, baseURL }) => {
  const image = await request.get(new URL("og-image.png", baseURL).href);
  expect(image.ok()).toBe(true);
  expect(image.headers()["content-type"]).toContain("image/png");
  // The sitemap sits at the site root (/travel-buddy/sitemap.xml once deployed).
  const sitemap = await request.get(new URL("../sitemap.xml", baseURL).href);
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain(`<loc>${SITE_URL}</loc>`);
});

test("a crawler that runs JavaScript sees real content: a heading and the scenes", async ({ page }) => {
  // A first visit, as a crawler makes it: nothing saved.
  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /我需要幫忙/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "交通", exact: true })).toBeVisible();
});

test("the tab title follows the page, and home gets the full title back", async ({ page, seed }) => {
  await seed({ profile: SAMPLE_PROFILE });
  await page.goto("./");
  const home = await page.title();
  expect(home).toMatch(/^隨身旅伴・日本｜/);
  await page.goto("#/scene/transport");
  await expect(page).toHaveTitle("交通｜隨身旅伴・日本");
  await page.goto("#/help");
  await expect(page).toHaveTitle("我需要幫忙｜隨身旅伴・日本");
  await page.goto("#/guide/tax-refund");
  await expect(page).toHaveTitle(`${guideById("tax-refund")!.title}｜隨身旅伴・日本`);
  await page.goto("#/tools");
  await expect(page).toHaveTitle("推薦的免費工具｜隨身旅伴・日本");
  // The router resets the title before each page: home, which names nothing, gets its own back.
  await page.goto("#/");
  await expect(page).toHaveTitle(home);
});
