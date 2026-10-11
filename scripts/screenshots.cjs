// Mobile screenshots for review (docs/screenshots). Needs `npm run build && npx vite preview --port 4173`
// running, and Playwright with Chromium (preinstalled in the Claude Code cloud environment):
//   CHROMIUM=/path/to/chrome NODE_PATH=$(npm root -g) node scripts/screenshots.cjs scripts/sample-profile.json docs/screenshots
const { chromium } = require("playwright");
const fs = require("fs");
const [profileFile, out] = process.argv.slice(2);
const profile = fs.readFileSync(profileFile, "utf8");
const PHONE = { width: 390, height: 844 };
const LANDSCAPE = { width: 844, height: 390 };

// Rows are named by their Chinese then their Japanese, so a substring match finds them.
const openRow = (p, text) => p.getByRole("button", { name: text }).first().click();

const SHOTS = [
  { name: "01-home", hash: "#/" },
  { name: "02-home-dark", hash: "#/", theme: "dark" },
  { name: "03-home-xlarge", hash: "#/", size: "xlarge" },
  { name: "04-home-empty", hash: "#/", empty: true },
  { name: "05-help", hash: "#/help" },
  { name: "06-help-dark", hash: "#/help", theme: "dark" },
  { name: "07-help-enlarged-landscape", hash: "#/help", viewport: LANDSCAPE, act: (p) => p.getByRole("button", { name: "放大" }).click() },
  { name: "08-scene-transport", hash: "#/scene/transport" },
  { name: "09-phrase-detail", hash: "#/scene/transport", act: (p) => openRow(p, "這班車有停新宿嗎") },
  {
    name: "10-ask-other",
    hash: "#/scene/transport",
    act: async (p) => {
      await openRow(p, "去新宿的車在幾號月台");
      await p.getByRole("button", { name: "給對方點選答案" }).click();
    },
  },
  {
    name: "11-ask-other-answered",
    hash: "#/scene/transport",
    act: async (p) => {
      await openRow(p, "去新宿的車在幾號月台");
      await p.getByRole("button", { name: "給對方點選答案" }).click();
      await p.getByRole("button", { name: "3番線", exact: true }).click();
    },
  },
  { name: "12-heard-konbini", hash: "#/scene/konbini/heard" },
  {
    name: "13-show-to-other-landscape",
    hash: "#/scene/konbini",
    viewport: LANDSCAPE,
    act: async (p) => {
      await openRow(p, "請幫我加熱");
      await p.getByRole("button", { name: "給對方看", exact: true }).click();
    },
  },
  { name: "14-rescue-sheet", hash: "#/scene/konbini", act: (p) => p.getByRole("button", { name: /萬用句/ }).click() },
  { name: "15-medical", hash: "#/medical", act: async (p) => { await p.getByText("頭痛").click(); await p.getByText("發燒").click(); } },
  { name: "16-setup", hash: "#/setup" },
  { name: "17-dark-detail", hash: "#/scene/transport", theme: "dark", act: (p) => openRow(p, "這班車有停新宿嗎") },
  { name: "18-scene-family", hash: "#/scene/family" },
  { name: "19-home-bottom", hash: "#/", act: (p) => p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)) },
  { name: "20-guide-tax-refund", hash: "#/guide/tax-refund" },
  { name: "21-scene-luggage", hash: "#/scene/luggage" },
  { name: "22-tools", hash: "#/tools" },
];

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const errors = [];
  for (const shot of SHOTS) {
    const ctx = await browser.newContext({ viewport: shot.viewport ?? PHONE, deviceScaleFactor: 1, colorScheme: shot.theme ?? "light" });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(`${shot.name}: ${e.message}`));
    await p.goto("http://localhost:4173/");
    await p.evaluate(
      ([data, size, empty]) => {
        if (!empty) localStorage.setItem("travelbuddy.japan.profile", JSON.stringify({ v: 1, data: JSON.parse(data) }));
        localStorage.setItem("travelbuddy.japan.settings", JSON.stringify({ v: 1, data: { theme: "system", textSize: size, voice: null } }));
      },
      [profile, shot.size ?? "large", Boolean(shot.empty)],
    );
    await p.goto("http://localhost:4173/" + shot.hash);
    await p.reload();
    await p.waitForTimeout(250);
    if (shot.act) await shot.act(p);
    await p.waitForTimeout(250);
    // Horizontal page scroll is a layout bug at phone width.
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 0) errors.push(`${shot.name}: horizontal overflow ${overflow}px`);
    await p.screenshot({ path: `${out}/${shot.name}.png` });
    await ctx.close();
  }
  console.log(errors.length ? errors.join("\n") : "no errors");
  await browser.close();
})();
