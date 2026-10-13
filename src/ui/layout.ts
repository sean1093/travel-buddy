import { fill, h, icon, type Child } from "./dom";

/**
 * A page with a "back" link and a large title. Every page is one step from
 * home, so back always goes home unless `back` says otherwise. The title sits
 * left under the back link, big enough to tell at a glance where you are;
 * once it scrolls away, a one-line copy appears in the sticky bar.
 */
export function page(
  root: HTMLElement,
  title: string,
  body: Child[],
  options: { back?: string; backLabel?: string; icon?: Child } = {},
): void {
  const compact = h(
    "span",
    { class: "min-w-0 flex-1 truncate pr-14 text-center text-lg font-semibold opacity-0 transition-opacity", "aria-hidden": "true" },
    title,
  );
  const large = h(
    "h1",
    { class: "no-print flex items-center gap-2 px-4 pb-1 pt-1 font-title text-3xl font-semibold leading-tight [text-wrap:balance]" },
    options.icon,
    title,
  );
  titleObserver?.disconnect();
  const header = h(
    "header",
    { class: "pt-safe no-print sticky top-0 z-10 flex items-center gap-2 bg-paper/95 px-3 pb-1 backdrop-blur" },
    h(
      "a",
      {
        href: options.back ?? "#/",
        // A quiet text link, still a 56px target: the page content is what should stand out.
        class: "-ml-1 inline-flex min-h-14 shrink-0 items-center gap-0.5 rounded-lg px-1 text-lg font-medium text-ai active:bg-ai-soft",
      },
      icon("back", "h-6 w-6"),
      options.backLabel ?? "首頁",
    ),
    compact,
  );
  fill(root, header, large, h("main", { class: "px-4 pb-16" }, body));
  if (typeof IntersectionObserver === "undefined") return;
  titleObserver = new IntersectionObserver(([entry]) => compact.classList.toggle("opacity-0", entry?.isIntersecting ?? true), {
    // Measured, not fixed: the bar grows with the text size and the safe-area inset.
    // The title counts as gone once the bar covers it.
    rootMargin: `-${header.offsetHeight}px 0px 0px 0px`,
  });
  titleObserver.observe(large);
}

/** The current page's title watcher; one at a time, replaced on every render. */
let titleObserver: IntersectionObserver | null = null;

/**
 * A section title: a quiet small label with a hairline running to the edge,
 * like the headings of a printed ryokan guide. Emergency sections use red.
 */
export function heading(text: string, tone: "ai" | "shu" = "ai"): HTMLElement {
  return h(
    "h2",
    {
      class: `mb-2 flex items-center gap-3 px-1 text-base font-medium tracking-[0.25em] after:h-px after:flex-1 after:bg-hair ${
        tone === "shu" ? "text-shu" : "text-muted"
      }`,
    },
    text,
  );
}

/** A titled group of content. */
export function section(title: string | null, ...children: Child[]): HTMLElement {
  return h("section", { class: "mt-6" }, title && heading(title), children);
}

/**
 * Actions docked at the bottom of the screen, reachable from anywhere on a
 * long page, plus the spacer that keeps the dock from covering the last
 * line. Put both at the end of the page body.
 */
export function dock(label: string, ...children: Child[]): HTMLElement[] {
  return [
    h("div", { class: "h-24", "aria-hidden": "true" }),
    h(
      "nav",
      { class: "pb-safe fixed inset-x-0 bottom-0 z-20 border-t-2 border-hair bg-paper/95 backdrop-blur", "aria-label": label },
      h("div", { class: "mx-auto max-w-xl px-4 pt-2" }, children),
    ),
  ];
}
