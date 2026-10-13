export type Child = Node | string | number | null | undefined | false | Child[];

/** Attributes; `class` sets className, `on<event>` functions become listeners, false/null/undefined are skipped. */
export type Props = Record<string, unknown>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props | null = null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2), value as EventListener);
    else if (key === "class") el.className = String(value);
    else el.setAttribute(key, value === true ? "" : String(value));
  }
  append(el, children);
  return el;
}

function append(parent: Node, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) append(parent, child);
    else parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

/** Replaces the content of `parent` with `children`, following the same child rules as `h`. */
export function fill(parent: Element, ...children: Child[]): void {
  parent.replaceChildren();
  append(parent, children);
}

/** The one live region; created on the first announcement and never removed. */
let liveRegion: HTMLElement | null = null;

/**
 * Says `text` to a screen reader without showing it. One polite region for
 * the whole app, so two announcements never race.
 */
export function announce(text: string): void {
  if (!liveRegion) {
    liveRegion = h("div", { class: "sr-only", "aria-live": "polite", "aria-atomic": "true" });
    document.body.append(liveRegion);
  }
  const region = liveRegion;
  // The same text twice in a row is not a change, and would stay unread:
  // clear it, then set it once the empty value has been seen.
  region.textContent = "";
  requestAnimationFrame(() => {
    region.textContent = text;
  });
}

/**
 * Moves focus to the heading of a screen that has just replaced another, so
 * the keyboard and the screen reader start where the new content does instead
 * of falling back to `<body>`. The region itself takes focus when it has no
 * heading.
 */
export function focusHeading(region: HTMLElement): void {
  const target = region.querySelector<HTMLElement>("h1, h2") ?? region;
  target.tabIndex = -1;
  target.focus({ preventScroll: true });
}

/** Stroke icons from Feather (MIT), drawn on a 24×24 grid. */
const ICONS = {
  speaker:
    '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  slow: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  back: '<polyline points="15 18 9 12 15 6"/>',
  next: '<polyline points="9 18 15 12 9 6"/>',
  expand:
    '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0v0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  share:
    '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  print:
    '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  trash:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  alert:
    '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  sliders:
    '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  // Pictograms for places and services, drawn on the same 24×24 grid and stroke as the
  // Feather icons above, in the spirit of the JIS public-information signs used in stations.
  train:
    '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M7.5 6.5h9v4.5h-9z"/><path d="M8.5 17 6.5 21M15.5 17l2 4M7.5 19.5h9"/><path d="M8.5 14h.01M15.5 14h.01"/>',
  bed: '<path d="M3 19V6M3 14h18v5M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="2"/>',
  bowl: '<path d="M3.5 12h17a8.5 8.5 0 0 1-17 0z"/><path d="M8.5 20.5h7"/><path d="M13 3l-2.5 7M19 4l-5.5 6"/>',
  store:
    '<path d="M4 9 5 4h14l1 5"/><path d="M4 9a2.67 2.67 0 0 0 5.33 0 2.67 2.67 0 0 0 5.34 0A2.67 2.67 0 0 0 20 9"/><path d="M5 11.5V20h14v-8.5"/><path d="M10 20v-5h4v5"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  pill: '<path d="M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7z"/><path d="M7 7l7 7"/>',
  restroom:
    '<circle cx="6.5" cy="4.5" r="1.5"/><path d="M4.5 8.5h4v6h-1V21h-2v-6.5h-1z"/><path d="M12 3v18"/><circle cx="17.5" cy="4.5" r="1.5"/><path d="M17.5 8l-3 7h2v6h2v-6h2z"/>',
  firstaid: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 7.5v9M7.5 12h9"/>',
  taxi:
    '<path d="M10 2.5h4v2.5h-4z"/><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><rect x="3" y="11" width="18" height="6" rx="2"/><path d="M6 17v2.5M18 17v2.5"/><path d="M7 14h.01M17 14h.01"/>',
  medcard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M8 9v6M5 12h6"/><path d="M14 10h5M14 14h3"/>',
  elevator: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 9.5l3-3 3 3M9 14.5l3 3 3-3"/>',
  lifebuoy:
    '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M4.93 19.07l4.24-4.24"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M12 6.5v7"/><path d="M12 17.5h.01"/>',
  shield: '<path d="M12 2l8 3v6c0 5.25-3.5 9.25-8 11-4.5-1.75-8-5.75-8-11V5z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16.5v-5"/><path d="M12 7.5h.01"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  swap: '<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  // A suitcase on wheels, as on left-luggage and baggage signs.
  luggage: '<rect x="4.5" y="6.5" width="15" height="12.5" rx="2"/><path d="M9 6.5V3.5h6v3"/><path d="M9.5 10v5.5M14.5 10v5.5"/><path d="M7.5 19v2M16.5 19v2"/>',
  stroller:
    '<path d="M2.5 4.5h2.5l2 7"/><path d="M7 11.5h13a6.5 6.5 0 0 0-6.5-6.5v6.5"/><path d="M7 11.5a6.5 4.5 0 0 0 13 0"/><circle cx="8.5" cy="19.5" r="1.75"/><circle cx="17.5" cy="19.5" r="1.75"/><path d="M10 16l-1 2M16 16l1 2"/>',
  checkcircle: '<circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
} satisfies Record<string, string>;


export type IconName = keyof typeof ICONS;

export function icon(name: IconName, cls = "h-6 w-6"): SVGSVGElement {
  const template = document.createElement("template");
  template.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls}">${ICONS[name]}</svg>`;
  return template.content.firstElementChild as SVGSVGElement;
}

const PICTOGRAM_TONES = {
  ai: "text-ai",
  shu: "text-shu",
  // Exits and elevators keep the station's yellow plate: there the colour is the sign.
  exit: "rounded-lg bg-exit text-exit-on",
};

/**
 * A fine-line pictogram in its tone's colour, without a plate (the washi
 * look, docs/design.md). Decorative: the label next to it carries the meaning.
 */
export function pictogram(name: IconName, tone: keyof typeof PICTOGRAM_TONES = "ai", size: "xs" | "sm" | "md" | "lg" = "md"): HTMLElement {
  const box = { xs: "h-8 w-8", sm: "h-9 w-9", md: "h-10 w-10", lg: "h-12 w-12" }[size];
  const glyph = { xs: "h-7 w-7", sm: "h-7 w-7", md: "h-8 w-8", lg: "h-9 w-9" }[size];
  const mark = h("span", { class: `inline-flex shrink-0 items-center justify-center ${box} ${PICTOGRAM_TONES[tone]}`, "aria-hidden": "true" });
  const svg = icon(name, glyph);
  svg.setAttribute("stroke-width", tone === "exit" ? "2" : "1.6");
  mark.append(svg);
  return mark;
}

const BUTTON_BASE =
  "flex w-full min-h-16 items-center justify-center gap-3 rounded-2xl px-5 py-3 text-xl font-bold transition active:scale-[0.98] disabled:opacity-40";

/** Shared button looks; every one is at least 4rem tall. */
export const BUTTON = {
  primary: `${BUTTON_BASE} bg-ai text-on-accent`,
  danger: `${BUTTON_BASE} bg-sos text-sos-on`,
  secondary: `${BUTTON_BASE} bg-sand text-ink`,
  /** A second action that still matters, e.g. 分享 next to 完成. */
  soft: `${BUTTON_BASE} bg-ai-soft text-ai`,
};

/** Small caption above a section. */
export const LABEL = "text-lg font-bold text-muted";
