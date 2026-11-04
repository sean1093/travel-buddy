import { GUIDES, guideById } from "../src/content/guides";
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
  const text = await sitemap.text();
  expect(text).toContain(`<loc>${SITE_URL}</loc>`);
  for (const guide of GUIDES) expect(text).toContain(`<loc>${SITE_URL}guide/${guide.id}/</loc>`);
});

test.describe("travel cheat sheets as pages of their own", () => {
  for (const guide of GUIDES) {
    test(`${guide.id}: built, readable without JavaScript, and links into the app`, async ({ browser, baseURL }) => {
      // As a crawler that doesn't run JavaScript would see it.
      const context = await browser.newContext({ javaScriptEnabled: false });
      try {
        const page = await context.newPage();
        const response = await page.goto(new URL(`guide/${guide.id}/`, baseURL).href);
        expect(response?.status()).toBe(200);
        await expect(page).toHaveTitle(`${guide.title}｜隨身旅伴・日本`);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(guide.title);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${SITE_URL}guide/${guide.id}/`);
        await expect(page.getByRole("heading", { level: 2, name: guide.steps[0]!.title, exact: true })).toBeVisible();
      } finally {
        await context.close();
      }
    });
  }

  test("the link opens the same guide in the app", async ({ page }) => {
    const guide = GUIDES[0]!;
    await page.goto(`guide/${guide.id}/`);
    await page.getByRole("link", { name: /在隨身旅伴裡打開/ }).click();
    await expect(page).toHaveURL(new RegExp(`/japan/#/guide/${guide.id}$`));
    await expect(page).toHaveTitle(`${guide.title}｜隨身旅伴・日本`);
    await expect(page.getByRole("heading", { level: 2, name: guide.title })).toBeVisible();
  });

  test("fits a 320 px phone without sideways scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const guide of GUIDES) {
      await page.goto(`guide/${guide.id}/`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, guide.id).toBeLessThanOrEqual(0);
    }
  });

  // The service worker used to store every page it served as the offline app. A guide page
  // must be kept under its own address and never replace the app.
  test("visiting one doesn't replace the offline app", async ({ page, context, seed }) => {
    await seed({ profile: SAMPLE_PROFILE });
    await page.goto("./");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
      }
    });
    await page.goto(`guide/${GUIDES[0]!.id}/`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(GUIDES[0]!.title);
    await context.setOffline(true);
    try {
      await page.goto("./");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("媽媽，旅途平安");
      // The guide page itself is there offline too, under its own address, with or without a
      // share's ?fbclid=… (it was cached without the query).
      await page.goto(`guide/${GUIDES[0]!.id}/?fbclid=abc`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(GUIDES[0]!.title);
    } finally {
      await context.setOffline(false);
    }
  });

  test("a guide page never opened online opens the same guide in the app when offline", async ({ page, context, seed }) => {
    await seed({ profile: SAMPLE_PROFILE });
    await page.goto("./");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
      }
    });
    const guide = GUIDES[1]!;
    await context.setOffline(true);
    try {
      await page.goto(`guide/${guide.id}/`);
      await expect(page).toHaveURL(new RegExp(`/japan/#/guide/${guide.id}$`));
      await expect(page.getByRole("heading", { level: 2, name: guide.title })).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
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
