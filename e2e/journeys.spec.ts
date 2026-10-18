import { expect, SAMPLE_PROFILE, test, watchErrors } from "./fixtures";

test("first run with an empty profile: home invites setup", async ({ page, seed }) => {
  await seed();
  await page.goto("#/");
  await expect(page.getByRole("heading", { level: 1, name: "隨身旅伴" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "第一次使用" })).toBeVisible();
  await page.getByRole("link", { name: "開始填資料" }).click();
  await expect(page).toHaveURL(/#\/setup$/);
  await expect(page.getByRole("heading", { level: 1, name: "設定資料" })).toBeVisible();
});

test("help card: passport name, enlarge, close with 關閉 and with back", async ({ page, seed }) => {
  await seed({ profile: SAMPLE_PROFILE });
  await page.goto("#/");
  await page.getByRole("link", { name: /我需要幫忙/ }).click();
  await expect(page).toHaveURL(/#\/help$/);
  await expect(page.getByRole("main")).toContainText("LIN MEI-HUA");

  const dialog = page.getByRole("dialog", { name: "我需要幫忙" });
  await page.getByRole("button", { name: "放大" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("LIN MEI-HUA");
  await dialog.getByRole("button", { name: "關閉" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/#\/help$/);
  await expect(page.getByRole("button", { name: "放大" })).toBeVisible();

  await page.getByRole("button", { name: "放大" }).click();
  await expect(dialog).toBeVisible();
  await page.goBack();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/#\/help$/);
  await expect(page.getByRole("heading", { level: 1, name: "我需要幫忙" })).toBeVisible();
});

test("transport: pick a destination, let the other person tap an answer", async ({ page, seed }) => {
  await seed({ profile: SAMPLE_PROFILE });
  await page.goto("#/scene/transport");
  const picker = page.getByRole("radiogroup", { name: "目的地" });
  await picker.getByRole("radio", { name: /^上野/ }).click();
  await expect(picker.getByRole("radio", { name: /^上野/ })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("button", { name: /去上野的車在幾號月台/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /這班車有停上野嗎/ })).toBeVisible();

  await page.getByRole("button", { name: /去上野的車在幾號月台/ }).click();
  const phrase = page.getByRole("dialog", { name: /去上野的車在幾號月台/ });
  await expect(phrase).toBeVisible();
  await phrase.getByRole("button", { name: "給對方點選答案" }).click();

  const ask = page.getByRole("dialog", { name: "給對方點選" });
  await expect(ask).toContainText("上野");
  await ask.getByRole("button", { name: "3番線", exact: true }).click();
  await expect(ask).toContainText("3 號月台");
  await expect(ask).toContainText("你問：去上野的車在幾號月台？");
  await ask.getByRole("button", { name: "知道了" }).click();
  await expect(ask).toHaveCount(0);
  // Back on the phrase it was asked from, still on the transport page.
  await expect(phrase).toBeVisible();
  await expect(page).toHaveURL(/#\/scene\/transport$/);
});

test("konbini heard tab: a reply opens 我的回答 in Japanese", async ({ page, seed }) => {
  await seed({ profile: SAMPLE_PROFILE });
  await page.goto("#/scene/konbini");
  await page.getByRole("link", { name: "對方說" }).click();
  await expect(page).toHaveURL(/#\/scene\/konbini\/heard$/);
  const card = page.getByRole("article").filter({ hasText: "要筷子嗎？" });
  await card.getByRole("button", { name: "不用" }).click();
  const answer = page.getByRole("dialog", { name: "我的回答" });
  await expect(answer).toBeVisible();
  await expect(answer.locator('[lang="ja"]').first()).toHaveText("いいえ、大丈夫です。");
  await expect(answer).toContainText("不用");
});

test("medical: two symptoms, the show button stays on screen", async ({ page, seed }) => {
  await seed({ profile: SAMPLE_PROFILE });
  await page.goto("#/medical");
  await expect(page.getByRole("button", { name: "先點選症狀" })).toBeDisabled();
  await page.getByRole("button", { name: "頭痛" }).click();
  await page.getByRole("button", { name: "發燒" }).click();
  await expect(page.getByRole("button", { name: "頭痛" })).toHaveAttribute("aria-pressed", "true");

  const show = page.getByRole("button", { name: "給對方看（2 項）" });
  await expect(show).toBeEnabled();
  // Visible where it is, without scrolling to it.
  const box = await show.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  await show.click();
  const card = page.getByRole("dialog", { name: "我的症狀" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("頭痛");
  await expect(card).toContainText("發燒");
});

test("setup → share link → import in a fresh browser", async ({ page, seed, browser }) => {
  await seed();
  await page.goto("#/setup");
  await page.getByRole("textbox", { name: "稱呼" }).fill("阿嬤");
  await page.getByRole("link", { name: "分享" }).click();
  await expect(page).toHaveURL(/#\/share$/);
  await expect(page.getByRole("heading", { level: 1, name: "分享給旅客" })).toBeVisible();
  // The link text is folded away until asked for.
  await page.getByText("顯示連結文字").click();
  const link = await page.getByRole("textbox", { name: "分享連結" }).inputValue();
  // The data rides in the fragment, which never reaches a server.
  expect(new URL(link).pathname).toBe("/japan/");
  expect(new URL(link).hash).toMatch(/^#\/s\//);

  const context = await browser.newContext();
  try {
    const other = await context.newPage();
    const errors: string[] = [];
    watchErrors(other, errors);
    await other.goto(link);
    await expect(other.getByRole("heading", { name: "設定完成" })).toBeVisible();
    await expect(other.getByText(/^阿嬤，之後直接打開這個網站就好/)).toBeVisible();
    // The personal data does not linger in the address bar.
    await expect(other).toHaveURL(/#\/imported$/);
    await other.getByRole("link", { name: "開始使用" }).click();
    await expect(other.getByRole("heading", { level: 1 })).toHaveText("阿嬤，旅途平安");
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test("settings: 特大 and dark persist across a reload", async ({ page, seed }) => {
  await seed({ profile: SAMPLE_PROFILE });
  await page.goto("#/settings");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-text-size", "large");
  await page.getByRole("radio", { name: "特大" }).click();
  await page.getByRole("radio", { name: "深色" }).click();
  await expect(page.getByRole("radio", { name: "特大" })).toHaveAttribute("aria-checked", "true");
  await expect(html).toHaveAttribute("data-text-size", "xlarge");
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(page.locator("html[data-text-size=xlarge]")).toHaveCount(1);
  await expect(page.locator("html[data-theme=dark]")).toHaveCount(1);
  await expect(page.getByRole("radio", { name: "深色" })).toHaveAttribute("aria-checked", "true");
});

for (const hash of ["#/nope", "#/scene/nope", "#/constructor"]) {
  test(`unknown route ${hash} lands on home`, async ({ page, seed }) => {
    await seed({ profile: SAMPLE_PROFILE });
    await page.goto(hash);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("媽媽，旅途平安");
    await expect(page.getByRole("link", { name: /我需要幫忙/ })).toBeVisible();
  });
}

test("offline: after the first visit, home and a scene still open", async ({ page, context, seed }) => {
  await seed({ profile: SAMPLE_PROFILE });
  await page.goto("#/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    // Wait for clients.claim(), so the reload below goes through the worker.
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
    }
  });
  await context.setOffline(true);
  try {
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("媽媽，旅途平安");
    await page.getByRole("link", { name: "便利商店" }).click();
    await expect(page).toHaveURL(/#\/scene\/konbini$/);
    await expect(page.getByRole("button", { name: /請幫我加熱/ })).toBeVisible();
    // A cold open of a deep link works offline too.
    await page.goto("#/scene/transport");
    await page.reload();
    await expect(page.getByRole("button", { name: /這班車有停新宿嗎/ })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});

for (const theme of ["light", "dark"] as const) {
  test(`browser bar colour is the ${theme} page background once the app has started`, async ({ page, seed }) => {
    await seed({ profile: SAMPLE_PROFILE, theme });
    await page.goto("#/");
    await expect(page.locator("h1").first()).toBeVisible();
    const { meta, background } = await page.evaluate(() => {
      const hex = (rgb: string) =>
        `#${(rgb.match(/\d+/g) ?? []).slice(0, 3).map((c) => Number(c).toString(16).padStart(2, "0")).join("")}`;
      return {
        meta: document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content,
        background: hex(getComputedStyle(document.body).backgroundColor),
      };
    });
    // applySettings() has run by now; the inline script's value is checked in tests/theme-color.test.ts.
    expect(meta).toBe(background);
  });
}
