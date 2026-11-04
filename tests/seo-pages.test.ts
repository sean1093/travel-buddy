import { describe, expect, it } from "vitest";
import { type Guide, GUIDES } from "../src/content/guides";
import { esc, guideUrl, OG_IMAGE, renderGuidePage, SITE_URL } from "../src/seo/pages";

// The static travel-cheat-sheet pages written at build time (src/seo/pages.ts).
const pages = GUIDES.map((guide) => ({ guide, html: renderGuidePage(guide, GUIDES) }));

const meta = (html: string, key: string) =>
  html.match(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`))?.[1];
const jsonLd = (html: string) => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]!);
const text = (html: string) => html.replace(/<style>[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<[^>]+>/g, " ");

describe.each(pages)("the page for $guide.id", ({ guide, html }) => {
  it("has its own title, description and canonical URL", () => {
    expect(html).toContain(`<title>${esc(guide.title)}｜隨身旅伴・日本</title>`);
    expect([...`${guide.title}｜隨身旅伴・日本`].length).toBeLessThanOrEqual(30);
    const description = meta(html, "description")!;
    expect(description.startsWith(esc(guide.summary))).toBe(true);
    expect([...description].length).toBeLessThanOrEqual(90);
    expect(html).toContain(`<link rel="canonical" href="${guideUrl(guide)}" />`);
    expect(guideUrl(guide)).toBe(`${SITE_URL}guide/${guide.id}/`);
  });

  it("gives link previews the guide's own card", () => {
    expect(meta(html, "og:url")).toBe(guideUrl(guide));
    expect(meta(html, "og:type")).toBe("article");
    expect(meta(html, "og:image")).toBe(OG_IMAGE);
    expect(meta(html, "og:title")).toContain(esc(guide.title));
  });

  it("describes itself as an article, dated by its last check, with its sources", () => {
    const [article, breadcrumbs] = jsonLd(html);
    expect(article).toMatchObject({ "@type": "Article", headline: guide.title, url: guideUrl(guide), dateModified: guide.verified, citation: guide.sources });
    expect(breadcrumbs.itemListElement.map((i: { item: string }) => i.item)).toEqual([SITE_URL, guideUrl(guide)]);
  });

  it("shows every step, note and source as text a crawler can read", () => {
    const body = text(html);
    for (const step of guide.steps) {
      expect(body).toContain(esc(step.title));
      expect(body).toContain(esc(step.body));
    }
    for (const note of guide.notes) expect(body).toContain(esc(note));
    for (const source of guide.sources) expect(html).toContain(`href="${esc(source)}"`);
    expect(body).toContain(`查證日期：`);
  });

  it("links to its in-app twin, home and the other guides", () => {
    expect(html).toContain(`href="../../#/guide/${guide.id}"`);
    expect(html).toContain('href="../../"');
    for (const other of GUIDES.filter((g) => g.id !== guide.id)) expect(html).toContain(`href="../${other.id}/"`);
    expect(html).not.toContain(`href="../${guide.id}/"`);
  });

  it("needs no script to read: no <script> but the structured data", () => {
    expect([...html.matchAll(/<script\b[^>]*>/g)].map((m) => m[0])).toEqual(['<script type="application/ld+json">']);
  });
});

describe("escaping", () => {
  const evil: Guide = {
    id: "x",
    title: '<img src=x onerror="alert(1)">',
    summary: "a & b </script><script>alert(1)</script>",
    steps: [{ title: "<b>", body: "'quoted'" }],
    notes: ["<i>"],
    sources: ["https://example.jp/?a=1&b=<2>"],
    verified: "2026-10-11",
  };
  const html = renderGuidePage(evil, [evil]);

  it("escapes every text and attribute value", () => {
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<b>");
    expect(html).not.toContain("<i>");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("a=1&amp;b=&lt;2&gt;");
  });

  it("can't close the structured-data script from inside it", () => {
    const script = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]!;
    expect(script).not.toContain("</script");
    expect(JSON.parse(script)[0].description).toContain("</script>");
  });
});
