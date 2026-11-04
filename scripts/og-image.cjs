// Renders the link-preview image (public/og-image.png, 1200x630) shown when the site is
// shared on LINE, Facebook, X and in search results. Re-run after changing the design or copy:
//   CHROMIUM=/path/to/chrome NODE_PATH=$(npm root -g) node scripts/og-image.cjs
const { chromium } = require("playwright");
const path = require("path");

const html = `<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; background: #f4efe6; color: #2b2a27;
    font-family: "PingFang TC", "Noto Sans TC", "WenQuanYi Zen Hei", sans-serif; display: flex; align-items: center; gap: 56px; padding: 0 72px; }
  .text { flex: 1; }
  .eyebrow { font-size: 26px; letter-spacing: .3em; color: #6b6357; }
  h1 { font-family: "Noto Serif TC", "Songti TC", "WenQuanYi Zen Hei", serif; font-size: 76px; font-weight: 700; margin-top: 12px; line-height: 1.15; }
  .sub { font-size: 34px; margin-top: 22px; line-height: 1.45; color: #3d3a35; }
  .chips { display: flex; gap: 14px; margin-top: 34px; flex-wrap: wrap; }
  .chip { background: #e6e9f1; color: #3d4f7a; font-size: 26px; font-weight: 700; padding: 10px 20px; border-radius: 14px; }
  .card { width: 380px; background: #fbf8f2; border-radius: 28px; padding: 28px; box-shadow: 0 18px 40px -24px rgba(0,0,0,.35); }
  .sos { background: #a8402f; color: #fff; border-radius: 18px; padding: 22px; font-size: 38px; font-weight: 700; }
  .sos small { display: block; font-size: 22px; font-weight: 400; opacity: .9; margin-top: 4px; }
  .slip { margin-top: 20px; border-top: 4px solid #a8402f; border-radius: 4px 4px 16px 16px; background: #fff; padding: 18px 20px; }
  .jp { font-size: 30px; line-height: 1.5; word-break: auto-phrase; }
  .zh { font-size: 22px; color: #6b6357; margin-top: 8px; }
  .url { position: absolute; bottom: 30px; left: 72px; font-size: 22px; color: #6b6357; }
</style></head><body>
  <div class="text">
    <p class="eyebrow">隨身旅伴・日本　TravelBuddy</p>
    <h1>不會日文，<br>出國也不怕</h1>
    <p class="sub">替你念出日文，或放大給對方看。<br>求救、問路、點餐、看醫生。</p>
    <div class="chips"><span class="chip">免註冊</span><span class="chip">離線可用</span><span class="chip">家人可先填好</span></div>
  </div>
  <div class="card">
    <div class="sos">我需要幫忙<small>迷路・找家人・急病</small></div>
    <div class="slip"><p class="jp" lang="ja">すみません。日本語が話せません。</p><p class="zh">不好意思，我不會說日文。</p></div>
  </div>
  <p class="url">sean1093.github.io/travel-buddy</p>
</body></html>`;

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.screenshot({ path: path.join(__dirname, "..", "public", "og-image.png") });
  await browser.close();
})();
