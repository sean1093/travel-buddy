import type { Jp } from "../content/types";
import { parse, plain, romaji } from "../lib/jp";
import { speak, stopSpeaking } from "../lib/speech";
import { SLOW_RATE } from "../state";
import { h, icon } from "./dom";

const SIZES = {
  xl: { jp: "text-3xl font-bold", romaji: "text-base" },
  lg: { jp: "text-2xl font-medium", romaji: "text-base" },
  md: { jp: "text-xl", romaji: "text-sm" },
};

/**
 * A Japanese line: ruby over the kanji, and under the whole sentence its
 * romaji (from Ippo's jpText), split from the Japanese by a hairline. Words
 * whose reading is unknown — a typed name without kana — have no romaji.
 */
export function jpText(markup: Jp, size: keyof typeof SIZES = "md", options: { romaji?: boolean } = {}): HTMLElement {
  const words = parse(markup);
  const japanese = h("span", { lang: "ja", class: `jp block ${SIZES[size].jp}` });
  words.forEach((word, i) => {
    if (i > 0) japanese.append(" ");
    // `.jp` keeps each word whole (keep-all); a word wider than the line can still break (overflow-wrap).
    const unit = h("span");
    for (const segment of word) unit.append(segment.ruby ? h("ruby", null, segment.text, h("rt", null, segment.ruby)) : segment.text);
    japanese.append(unit);
  });
  const roma = options.romaji === false ? "" : romaji(markup);
  return h(
    "span",
    { class: "block" },
    japanese,
    // Hidden from screen readers, which already read the Japanese.
    roma &&
      h(
        "span",
        { class: `jp-romaji mt-2 block border-t border-dashed border-hair pt-2 text-muted ${SIZES[size].romaji}`, "aria-hidden": "true" },
        roma,
      ),
  );
}

// `generation` advances whenever new audio is requested, so a running
// sequence notices it has been superseded.
let generation = 0;

function mark(button: HTMLElement | undefined): void {
  for (const el of document.querySelectorAll(".speaking")) el.classList.remove("speaking");
  button?.classList.add("speaking");
}

/** Speaks `markup`, marking `button` while it plays. Interrupts anything already playing. */
export async function play(markup: Jp, button?: HTMLElement, rate?: number): Promise<void> {
  const mine = ++generation;
  mark(button);
  await speak(markup, rate === undefined ? {} : { rate });
  if (mine === generation) button?.classList.remove("speaking");
}

/** Speaks lines one after another; stops as soon as anything else plays or `hush` is called. */
export async function playAll(lines: Jp[], button?: HTMLElement, rate?: number): Promise<void> {
  const mine = ++generation;
  mark(button);
  for (const line of lines) {
    await speak(line, rate === undefined ? {} : { rate });
    if (mine !== generation) return;
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    if (mine !== generation) return;
  }
  button?.classList.remove("speaking");
}

/** Silences everything, e.g. when leaving a page. */
export function hush(): void {
  generation += 1;
  stopSpeaking();
  mark(undefined);
}

export const PLAY_SIZES = {
  sm: "min-h-12 gap-2 px-3 text-base",
  md: "min-h-14 gap-2 px-3 text-lg",
  lg: "min-h-16 gap-2 px-4 text-xl",
  /** One cell of a shared action row: icon over a short label. */
  cell: "min-h-16 flex-col gap-0.5 px-1 py-2 text-base leading-tight",
};

const PLAY_TONES = {
  soft: "rounded-lg bg-ai-soft",
  // Inside a shared card (see the phrase page): no fill of its own.
  plain: "",
};

/** Play button (normal or slow). Plays every line of `lines` in turn. */
export function playButton(
  lines: Jp | Jp[],
  kind: "normal" | "slow" = "normal",
  size: keyof typeof PLAY_SIZES = "md",
  extra = "",
  tone: keyof typeof PLAY_TONES = "soft",
): HTMLButtonElement {
  const all = Array.isArray(lines) ? lines : [lines];
  const slow = kind === "slow";
  const button = h(
    "button",
    {
      type: "button",
      // Normal and slow look the same: the icon and the label tell them apart.
      class: `inline-flex items-center justify-center font-bold text-ai transition active:scale-95 ${PLAY_TONES[tone]} ${PLAY_SIZES[size]} ${extra}`,
      "aria-label": `${slow ? "慢速播放" : "播放"}「${all.map(plain).join("")}」`,
    },
    icon(slow ? "slow" : "speaker", "h-6 w-6"),
    slow ? "慢速" : "播放",
  );
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    void playAll(all, button, slow ? SLOW_RATE : undefined);
  });
  return button;
}
