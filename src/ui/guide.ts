import { GUIDES, guideById } from "../content/guides";
import { TOOLS } from "../content/tools";
import { h, icon } from "./dom";
import { heading, page, section, setTitle } from "./layout";

function row(href: string, title: string, summary: string): HTMLElement {
  return h(
    "a",
    {
      href,
      class: "flex min-h-16 items-center gap-3 px-4 py-3 transition-colors active:bg-ai-soft focus-visible:[outline-offset:-3px]",
    },
    h(
      "span",
      { class: "min-w-0 flex-1" },
      h("span", { class: "block text-xl font-semibold leading-snug" }, title),
      h("span", { class: "mt-0.5 block text-base text-muted" }, summary),
    ),
    icon("next", "h-6 w-6 shrink-0 text-ai"),
  );
}

/** One row per guide for the home page, then the recommended tools. */
export function guideRows(): HTMLElement {
  return h(
    "div",
    { class: "divide-y divide-dashed divide-hair overflow-hidden rounded-2xl bg-card" },
    GUIDES.map((guide) => row(`#/guide/${guide.id}`, guide.title, guide.summary)),
    row("#/tools", "推薦的免費工具", "警報、翻譯、地圖、叫車、交通卡：這些交給專門的 App。"),
  );
}

/** `#/tools`: free apps that already do a job well, named so they can be found in the app store. */
export function renderTools(root: HTMLElement): void {
  page(root, "旅遊小抄", [
    h("h2", { class: "mt-2 text-2xl font-bold leading-snug" }, "推薦的免費工具"),
    h(
      "p",
      { class: "mt-2 text-lg leading-relaxed text-muted" },
      "這些事已經有好用的 App。出發前在台灣先下載好，點下面的按鈕就會開啟下載頁。",
    ),
    h(
      "ul",
      { class: "mt-5 divide-y divide-dashed divide-hair rounded-2xl bg-card" },
      TOOLS.map((tool) =>
        h(
          "li",
          { class: "px-4 py-4" },
          h("h3", { class: "text-xl font-semibold" }, tool.name),
          h("p", { class: "mt-1 text-lg leading-relaxed" }, tool.use),
          tool.note && h("p", { class: "mt-1 text-base text-muted" }, tool.note),
          h(
            "div",
            { class: "mt-3 grid grid-cols-2 gap-2" },
            tool.links.map((link) =>
              h(
                "a",
                {
                  href: link.url,
                  target: "_blank",
                  rel: "noopener",
                  "aria-label": `${tool.name}：${link.label}`,
                  class: "inline-flex min-h-12 items-center justify-center rounded-lg bg-ai-soft px-2 py-1 text-center text-lg font-bold leading-tight text-ai active:scale-95",
                },
                link.label,
              ),
            ),
          ),
        ),
      ),
    ),
    section(null, h("p", { class: "text-base text-muted" }, "日本政府觀光局的 24 小時中文熱線在「我需要幫忙」頁。")),
  ]);
  setTitle("推薦的免費工具");
}

/** `#/guide/<id>`: numbered steps, then what goes wrong, then where it comes from. */
export function renderGuide(root: HTMLElement, [id]: string[]): void {
  const guide = guideById(id);
  if (!guide) {
    location.replace("#/");
    return;
  }
  page(root, "旅遊小抄", [
    h("h2", { class: "mt-2 text-2xl font-bold leading-snug" }, guide.title),
    h("p", { class: "mt-2 text-lg leading-relaxed text-muted" }, guide.summary),
    h(
      "ol",
      { class: "mt-5 space-y-3" },
      guide.steps.map((step, i) =>
        h(
          "li",
          { class: "flex gap-3 rounded-2xl bg-card p-4" },
          h(
            "span",
            { class: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ai text-lg font-bold text-on-accent", "aria-hidden": "true" },
            String(i + 1),
          ),
          h(
            "div",
            { class: "min-w-0" },
            h("h3", { class: "text-xl font-semibold leading-snug" }, step.title),
            h("p", { class: "mt-1 text-lg leading-relaxed" }, step.body),
          ),
        ),
      ),
    ),
    guide.notes.length > 0 &&
      h(
        "section",
        { class: "mt-6 rounded-2xl bg-warn-soft p-4" },
        heading("注意", "shu"),
        h("ul", { class: "list-disc space-y-2 pl-6 text-lg leading-relaxed" }, guide.notes.map((note) => h("li", null, note))),
      ),
    section(
      null,
      h(
        "p",
        { class: "text-base text-muted" },
        `查證日期：${guide.verified}。來源：${guide.sources.map((url) => new URL(url).hostname).join("、")}。規定可能會改，以現場人員的說明為準。`,
      ),
    ),
  ]);
  // Each guide is its own entry in tabs and history, not all "旅遊小抄".
  setTitle(guide.title);
}
