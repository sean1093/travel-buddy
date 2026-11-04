import type { Guide } from "../content/guides";

/**
 * Static pages for search engines, written at build time (see vite.config.ts).
 * The app's routes live in the # fragment, which search engines ignore, so each
 * travel cheat sheet also gets a real page of its own at /japan/guide/<id>/:
 * plain HTML, no script, readable by any crawler and by people who arrive from
 * a search. The app's own #/guide/<id> screens stay as they are (they work
 * offline); each static page links to its in-app twin.
 */

/** The Japan edition's front page: the app, and the base of every other URL here. */
export const SITE_URL = "https://sean1093.github.io/travel-buddy/japan/";
export const OG_IMAGE = `${SITE_URL}og-image.png`;
const SITE_NAME = "隨身旅伴・日本";

export const guideUrl = (guide: Pick<Guide, "id">) => `${SITE_URL}guide/${guide.id}/`;

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
/** Text and attribute values for HTML. */
export const esc = (text: string) => text.replace(/[&<>"']/g, (c) => ESCAPES[c]!);

/** JSON for a <script> block: "<" escaped, so no text in it can close the tag. */
const json = (value: unknown) => JSON.stringify(value, null, 2).replace(/</g, "\\u003c");

/** Description for search results: the summary, kept to what a result shows. */
function description(guide: Guide): string {
  const text = `${guide.summary}${guide.steps.map((s) => s.title).join("、")}，一步一步說明。`;
  return [...text].length <= 90 ? text : `${[...text].slice(0, 89).join("")}…`;
}

/** One travel cheat sheet as a complete, self-contained HTML page. */
export function renderGuidePage(guide: Guide, all: Guide[]): string {
  const url = guideUrl(guide);
  const title = `${guide.title}｜${SITE_NAME}`;
  const desc = description(guide);
  const others = all.filter((g) => g.id !== guide.id);
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: desc,
      inLanguage: "zh-Hant-TW",
      url,
      image: OG_IMAGE,
      dateModified: guide.verified,
      isAccessibleForFree: true,
      author: { "@type": "Organization", name: "隨身旅伴 TravelBuddy", url: SITE_URL },
      publisher: { "@type": "Organization", name: "隨身旅伴 TravelBuddy", url: SITE_URL },
      citation: guide.sources,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
        { "@type": "ListItem", position: 2, name: guide.title, item: url },
      ],
    },
  ];
  return `<!doctype html>
<html lang="zh-Hant-TW">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}" />
    <link rel="canonical" href="${url}" />
    <meta name="theme-color" content="#f4efe6" />
    <link rel="icon" href="../../favicon.svg" type="image/svg+xml" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="隨身旅伴 TravelBuddy" />
    <meta property="og:locale" content="zh_TW" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">
${json(data)}
    </script>
    <style>
      :root { --paper: #f4efe6; --card: #fbf8f2; --ink: #2b2a27; --muted: #6b6357; --ai: #3d4f7a; --shu: #a8402f; --warn: #f5eacd; color-scheme: light; }
      @media (prefers-color-scheme: dark) {
        :root { --paper: #1c1a17; --card: #282521; --ink: #ece6dc; --muted: #b0a89b; --ai: #a5b6e4; --shu: #e88c76; --warn: #443819; color-scheme: dark; }
      }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--paper); color: var(--ink); font: 20px/1.7 "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif; }
      main { max-width: 36rem; margin: 0 auto; padding: 24px 16px 48px; }
      a { color: var(--ai); font-weight: 700; }
      .crumbs { font-size: 16px; color: var(--muted); }
      h1 { font-family: "Noto Serif TC", "Songti TC", serif; font-size: 32px; line-height: 1.3; margin: 8px 0 0; }
      .summary { color: var(--muted); margin: 8px 0 0; }
      ol { list-style: none; padding: 0; margin: 24px 0 0; display: grid; gap: 12px; counter-reset: step; }
      ol li { counter-increment: step; background: var(--card); border-radius: 16px; padding: 16px 16px 16px 64px; position: relative; }
      ol li::before { content: counter(step); position: absolute; left: 16px; top: 16px; width: 36px; height: 36px; border-radius: 50%; background: var(--ai); color: var(--paper); display: grid; place-items: center; font-weight: 700; }
      h2 { font-size: 22px; margin: 0; }
      ol p { margin: 4px 0 0; }
      .notes { background: var(--warn); border-radius: 16px; padding: 16px; margin-top: 24px; }
      .notes h2 { color: var(--shu); font-size: 18px; letter-spacing: .2em; }
      .notes ul { margin: 8px 0 0; padding-left: 1.4em; }
      .open { display: block; margin-top: 24px; background: var(--ai); color: var(--paper); text-align: center; text-decoration: none; border-radius: 16px; padding: 16px; }
      .meta { font-size: 16px; color: var(--muted); margin-top: 24px; }
      .meta ul { padding-left: 1.2em; margin: 4px 0 0; }
      .meta a { font-weight: 400; overflow-wrap: anywhere; }
      nav.more { margin-top: 32px; }
      nav.more h2 { font-size: 18px; color: var(--muted); letter-spacing: .2em; }
      nav.more ul { padding-left: 1.2em; }
    </style>
  </head>
  <body>
    <main>
      <p class="crumbs"><a href="../../">${esc(SITE_NAME)}</a> › 旅遊小抄</p>
      <h1>${esc(guide.title)}</h1>
      <p class="summary">${esc(guide.summary)}</p>
      <ol>
${guide.steps.map((step) => `        <li><h2>${esc(step.title)}</h2><p>${esc(step.body)}</p></li>`).join("\n")}
      </ol>
${
  guide.notes.length > 0
    ? `      <section class="notes">
        <h2>注意</h2>
        <ul>
${guide.notes.map((note) => `          <li>${esc(note)}</li>`).join("\n")}
        </ul>
      </section>
`
    : ""
}      <a class="open" href="../../#/guide/${esc(guide.id)}">在隨身旅伴裡打開（離線也能看）</a>
      <section class="meta">
        <p>查證日期：<time datetime="${guide.verified}">${guide.verified}</time>。規定可能會改，以現場人員的說明為準。</p>
        <p>資料來源：</p>
        <ul>
${guide.sources.map((src) => `          <li><a href="${esc(src)}" rel="noopener">${esc(new URL(src).hostname)}</a></li>`).join("\n")}
        </ul>
      </section>
${
  others.length > 0
    ? `      <nav class="more" aria-label="其他旅遊小抄">
        <h2>其他旅遊小抄</h2>
        <ul>
${others.map((g) => `          <li><a href="../${esc(g.id)}/">${esc(g.title)}</a></li>`).join("\n")}
        </ul>
      </nav>
`
    : ""
}      <p class="meta"><a href="../../">隨身旅伴・日本</a>：不會日文也能在日本求救、問路、點餐。免註冊、離線可用。</p>
    </main>
  </body>
</html>
`;
}

/** The sitemap at the site root: the app, then every static page. */
export function sitemapXml(guides: Guide[]): string {
  const urls = [{ loc: SITE_URL }, ...guides.map((g) => ({ loc: guideUrl(g), lastmod: g.verified }))];
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by the build (src/seo/pages.ts). Submitted in Google Search Console. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${esc(u.loc)}</loc>${"lastmod" in u ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}\n  </url>`).join("\n")}
</urlset>
`;
}
