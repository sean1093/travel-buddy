import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GUIDES } from "../src/content/guides";
import { SCENES } from "../src/content/scenes";
import { guideUrl, OG_IMAGE as PAGES_OG_IMAGE, SITE_URL as PAGES_SITE_URL, sitemapXml } from "../src/seo/pages";
import { HOME_TITLE } from "../src/ui/layout";

/**
 * What search engines and link previews (LINE, Facebook, X) read. Routes live in
 * the # fragment, which search engines ignore, so the Japan edition's front page
 * is the one indexed URL; everything here must point at it.
 */
const SITE_URL = "https://sean1093.github.io/travel-buddy/japan/";
const OG_IMAGE = `${SITE_URL}og-image.png`;

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url));
const app = read("index.html").toString("utf8");
const root = read("site/index.html").toString("utf8");
const sitemap = sitemapXml(GUIDES);

/** The content of `<meta name|property="key" content="…">`, or undefined. */
function meta(html: string, key: string): string | undefined {
  const tag = [...html.matchAll(/<meta\s[^>]*>/gs)].map((m) => m[0]).find((t) => new RegExp(`(?:name|property)="${key}"`).test(t));
  return tag?.match(/content="([^"]*)"/s)?.[1]?.replace(/\s+/g, " ").trim();
}
const canonical = (html: string) => html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
const title = (html: string) => html.match(/<title>([^<]+)<\/title>/)?.[1];

describe("the app page (index.html)", () => {
  it("has a title that names the app and what it does, short enough to show in full", () => {
    // Search results cut titles at about 30 CJK characters.
    expect(title(app)).toMatch(/^隨身旅伴・日本｜/);
    expect([...title(app)!].length).toBeLessThanOrEqual(30);
  });

  it("is the title the app gives home when you come back to it", () => {
    expect(title(app)).toBe(HOME_TITLE);
  });

  it("has a description that fits a search result", () => {
    const description = meta(app, "description")!;
    expect(description).toBeTruthy();
    // About 80 to 90 CJK characters show before the cut.
    expect([...description].length).toBeLessThanOrEqual(90);
  });

  it("names one canonical URL, and every link preview points at it", () => {
    expect(canonical(app)).toBe(SITE_URL);
    expect(meta(app, "og:url")).toBe(SITE_URL);
    expect(meta(app, "og:image")).toBe(OG_IMAGE);
    for (const key of ["og:title", "og:description", "og:image:alt", "og:site_name"]) expect(meta(app, key), key).toBeTruthy();
    expect(meta(app, "twitter:card")).toBe("summary_large_image");
  });

  it("describes itself as a free web app in structured data", () => {
    const json = app.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    const data = JSON.parse(json!);
    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      url: SITE_URL,
      image: OG_IMAGE,
      inLanguage: "zh-Hant-TW",
      isAccessibleForFree: true,
      offers: { price: "0" },
    });
    expect(data.description).toBe(meta(app, "description"));
  });

  it("still says what it is without JavaScript", () => {
    const noscript = app.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] ?? "";
    expect(noscript).toContain("<h1>隨身旅伴・日本</h1>");
    expect(noscript).toContain("請開啟 JavaScript");
    expect(noscript.replace(/<[^>]+>/g, "").length).toBeGreaterThan(100);
  });

  it("links every travel cheat sheet's own page from the no-JavaScript summary, so crawlers find them", () => {
    const noscript = app.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] ?? "";
    const links = [...noscript.matchAll(/<a href="\.\/guide\/([^/]+)\/">([^<]+)<\/a>/g)].map((m) => [m[1], m[2]]);
    expect(links).toEqual(GUIDES.map((g) => [g.id, g.title]));
  });

  it("names every scene in the no-JavaScript summary", () => {
    const noscript = app.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] ?? "";
    for (const scene of SCENES) expect(noscript, scene.title).toContain(scene.title);
  });

  it("keeps the no-referrer policy: share links carry personal data in the #", () => {
    expect(meta(app, "referrer")).toBe("no-referrer");
  });
});

describe("the root page (site/index.html)", () => {
  it("hands search engines and previews to the Japan edition", () => {
    expect(canonical(root)).toBe(SITE_URL);
    expect(meta(root, "og:url")).toBe(SITE_URL);
    expect(meta(root, "og:image")).toBe(OG_IMAGE);
    expect(meta(root, "description")).toBeTruthy();
  });

  it("gives link previews the same card as the app page", () => {
    for (const key of ["og:site_name", "og:locale", "og:title", "og:description", "og:image", "og:image:width", "og:image:height", "og:image:alt", "twitter:card"]) {
      expect(meta(app, key), `${key} on the app page`).toBeTruthy();
      expect(meta(root, key), key).toBe(meta(app, key));
    }
  });

  it("forwards without JavaScript too", () => {
    expect(root).toMatch(/<noscript><meta http-equiv="refresh" content="0; url=\.\/japan\/" \/><\/noscript>/);
  });
});

describe("sitemap (generated by the build, served at /travel-buddy/sitemap.xml)", () => {
  it("lists the app, then every travel cheat sheet's own page", () => {
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])).toEqual([SITE_URL, ...GUIDES.map(guideUrl)]);
  });

  it("dates each guide page by its last check", () => {
    expect([...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1])).toEqual(GUIDES.map((g) => g.verified));
  });

  it("uses the same site URL as the pages", () => {
    expect(PAGES_SITE_URL).toBe(SITE_URL);
    expect(PAGES_OG_IMAGE).toBe(OG_IMAGE);
  });
});

describe("link-preview image (public/og-image.png)", () => {
  it("is a 1200×630 PNG, the size previews expect", () => {
    const png = read("public/og-image.png");
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
  });
});

describe("Google Search Console verification (site/google*.html)", () => {
  const files = readdirSync(new URL("../site/", import.meta.url)).filter((f) => /^google[0-9a-f]+\.html$/.test(f));

  it("keeps this property's file: removing it un-verifies the site", () => {
    expect(files).toContain("googleba773c0e975ffdb4.html");
  });

  it("has each file as Google's exact one line, named after its own token", () => {
    for (const file of files) expect(read(`site/${file}`).toString("utf8").trim(), file).toBe(`google-site-verification: ${file}`);
  });
});

describe("the documented URL", () => {
  it("matches the README", () => {
    expect(read("README.md").toString("utf8")).toContain(SITE_URL);
  });
});
