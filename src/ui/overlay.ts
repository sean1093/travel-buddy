import type { Jp, Reply } from "../content/types";
import { plain } from "../lib/jp";
import type { Line } from "../profile/cards";
import { BUTTON, h, icon } from "./dom";
import { hush, play, playAll, playButton } from "./japanese";
import { lineNode } from "./lines";

/** Marks the history entries overlays push; the value is the overlay's own token. */
const STATE_KEY = "travelBuddyOverlay";

/** Open overlays, bottom first. A phrase's detail can open 給對方看 on top of itself. */
const stack: { token: string; element: HTMLElement; teardown: () => void }[] = [];
let opened = 0;

/** Token in the current history entry, if it was pushed by an overlay. */
function historyToken(): unknown {
  return (history.state as Record<string, unknown> | null)?.[STATE_KEY];
}

/** Inert and hidden from screen readers; aria-hidden covers browsers without `inert`. */
function cover(element: HTMLElement, covered: boolean): void {
  element.inert = covered;
  if (covered) element.setAttribute("aria-hidden", "true");
  else element.removeAttribute("aria-hidden");
}

/**
 * Only the top layer can be reached: the page and any layer under the top
 * are covered, so screen readers and taps cannot wander into them.
 */
function syncInert(): void {
  const app = document.getElementById("app");
  if (app) cover(app, stack.length > 0);
  for (const [i, entry] of stack.entries()) cover(entry.element, i < stack.length - 1);
}

/**
 * Back (or forward) landed somewhere: keep the overlay whose entry this is
 * and the ones under it, close the rest. An entry left over from an overlay
 * that is already gone (after a reload, or a link out of an overlay) matches
 * none, so everything closes — never a layer that ignores the back button.
 */
function onPop(): void {
  const keep = stack.findIndex((entry) => entry.token === historyToken());
  for (const entry of stack.slice(keep + 1).reverse()) entry.teardown();
}

/**
 * A full-screen layer over the current page (from Ippo's showToClerk). Each
 * layer pushes a history entry, so the phone's back button closes the top
 * layer only, instead of leaving the page; leaving the page closes them all.
 */
export function openOverlay(label: string, build: (close: () => void) => HTMLElement): () => void {
  opened += 1;
  const token = `${Date.now().toString(36)}-${opened}`;
  const overlay = h("div", {
    class: "fixed inset-0 flex flex-col bg-paper text-ink",
    style: `z-index: ${50 + stack.length + 1}`,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": label,
  });
  let open = true;
  const entry = { token, element: overlay, teardown };

  function teardown(): void {
    if (!open) return;
    open = false;
    hush();
    overlay.remove();
    stack.splice(stack.indexOf(entry), 1);
    syncInert();
    if (stack.length === 0) {
      document.body.classList.remove("overflow-hidden");
      window.removeEventListener("popstate", onPop);
    }
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("hashchange", teardown);
    returnFocus?.focus({ preventScroll: true });
  }
  /** Closed from inside: drop the history entry we pushed, which fires popstate → teardown. */
  function close(): void {
    if (!open) return;
    if (historyToken() === token) history.back();
    else teardown();
  }
  function onKey(event: KeyboardEvent): void {
    // Only the top layer answers the keyboard.
    if (stack.at(-1) !== entry) return;
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key !== "Tab") return;
    // The page underneath is inert, but browsers without `inert` still tab into it:
    // keep the focus ring inside the layer.
    const stops = [...overlay.querySelectorAll<HTMLElement>("button, a[href]")];
    const edge = event.shiftKey ? stops[0] : stops.at(-1);
    if (document.activeElement === edge || !overlay.contains(document.activeElement)) {
      event.preventDefault();
      (event.shiftKey ? stops.at(-1) : stops[0])?.focus();
    }
  }

  const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  overlay.append(build(close));
  if (stack.length === 0) window.addEventListener("popstate", onPop);
  stack.push(entry);
  history.pushState({ [STATE_KEY]: token }, "");
  window.addEventListener("hashchange", teardown);
  document.addEventListener("keydown", onKey);
  document.body.classList.add("overflow-hidden");
  document.body.append(overlay);
  syncInert();
  overlay.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
  return close;
}

/**
 * Font size for Japanese shown at arm's length: a short phrase fills the
 * screen, a long one stays readable. Both axes are capped, so turning the
 * phone sideways enlarges the text and never clips it.
 */
export function armsLength(text: string): string {
  const n = text.length;
  const vw = n <= 6 ? 15 : n <= 12 ? 11 : n <= 20 ? 8.5 : n <= 32 ? 7 : 6;
  return `font-size: clamp(1.5rem, min(${vw}vw, ${vw * 1.5}vh), 5rem)`;
}

const HINT_TONES = {
  // What to do next, for whoever is holding the phone.
  action: "text-lg font-bold leading-snug text-ai",
  // Just where you are, e.g. the scene a phrase belongs to.
  quiet: "text-base text-muted",
};

/**
 * The bar on top of every layer: a close button anyone can find in a hurry,
 * and one line on the right. `lang` marks a hint written for the Japanese
 * person the phone has been handed to.
 */
export function overlayBar(
  close: () => void,
  hint: string,
  tone: keyof typeof HINT_TONES = "action",
  lang?: string,
  hintClass = "",
): HTMLElement {
  return h(
    "div",
    { class: "pt-safe flex items-center gap-3 border-b border-hair bg-card px-3 pb-2" },
    h(
      "button",
      {
        type: "button",
        class: "inline-flex min-h-14 shrink-0 items-center gap-1 rounded-2xl bg-sand px-4 text-xl font-bold text-ink active:scale-95",
        onclick: close,
        "data-autofocus": "",
      },
      icon("close", "h-6 w-6"),
      "關閉",
    ),
    h("p", { lang, class: `min-w-0 flex-1 text-right ${HINT_TONES[tone]} ${hintClass}` }, hint),
  );
}

export interface ShowBlock {
  jp: Jp;
  /** Chinese for the traveller holding the phone, to check before handing it over. */
  zh?: string;
  /** Extra lines shown as they are: an address, a phone number. */
  extra?: Line[];
}

/**
 * 給對方看: plain Japanese as large as the screen allows, without ruby or
 * romaji — the person reading it is Japanese.
 */
export function showToOther(blocks: ShowBlock[], label = "給對方看", speakNow = false): void {
  if (speakNow) void playAll(blocks.map((b) => b.jp));
  openOverlay(label, (close) => {
    const many = blocks.length > 1;
    const total = blocks.map((b) => plain(b.jp)).join("");
    return h(
      "div",
      { class: "flex min-h-0 flex-1 flex-col" },
      overlayBar(close, "請把畫面拿給對方看", "action", undefined, "landscape-hide"),
      h(
        "div",
        {
          class: "flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4 text-center",
        },
        // Centred with auto margins, not justify-center: when the text is taller than the
        // screen (a phone held sideways), it scrolls from its first line instead of being cut.
        h(
          "div",
          { class: `${many ? "" : "my-auto"} space-y-6` },
          blocks.map((block) =>
          h(
            "div",
            null,
            h(
              "p",
              { lang: "ja", class: "font-bold leading-snug", style: armsLength(many ? total : plain(block.jp)) },
              plain(block.jp),
            ),
            block.extra?.map((line) => h("div", { lang: "ja" }, lineNode(line, "mt-2 text-3xl font-bold leading-snug"))),
            block.zh && h("p", { class: "mt-3 text-xl font-bold text-ink/80" }, block.zh),
          ),
          ),
        ),
      ),
      // One row, so a phone held sideways still shows the actions.
      h(
        "div",
        // On a phone held sideways this row moves up into the bar (see .landscape-dock), so the text gets the height.
        { class: "landscape-dock pb-safe flex items-center justify-center gap-3 px-5 pt-3" },
        playButton(blocks.map((b) => b.jp)),
        playButton(
          blocks.map((b) => b.jp),
          "slow",
        ),
      ),
    );
  });
}

/** "Please take a look at this screen", for the person the phone is handed to. */
const LOOK_PLEASE: Jp = "こちら を ご{覧|らん} ください";

/** Asks the person in front of you to tap one of `replies`. */
const TAP_PLEASE: Jp = "{下|した} の {答|こた}え を {指|ゆび} で {押|お}して ください。";

/**
 * 給對方點選: the question in Japanese on top, Japanese answers to tap
 * below; once tapped, the traveller sees the answer in Chinese.
 */
export function askOther(question: { jp: Jp; zh: string }, replies: Reply[]): void {
  openOverlay("給對方點選", (close) => {
    const root = h("div", { class: "flex min-h-0 flex-1 flex-col" });

    function asking(): void {
      const options = replies.map((reply) =>
        h(
          "button",
          {
            type: "button",
            lang: "ja",
            class:
              "min-h-16 rounded-2xl bg-ai-soft px-3 py-3 text-2xl font-bold text-ink transition active:scale-95 active:bg-ai active:text-on-accent",
            onclick: () => answered(reply),
          },
          plain(reply.jp),
        ),
      );
      root.replaceChildren(
        // From here on the phone is in the other person's hands: the bar speaks Japanese.
        overlayBar(close, plain(LOOK_PLEASE), "action", "ja"),
        h(
          "div",
          { class: "min-h-0 flex-1 overflow-y-auto px-5 pb-safe pt-4" },
          // The one line for the traveller, before the phone changes hands.
          h("p", { class: "mb-3 text-center text-base text-muted" }, "把手機交給對方，請對方點答案"),
          h("p", { lang: "ja", class: "text-center font-bold leading-snug", style: armsLength(plain(question.jp)) }, plain(question.jp)),
          h("p", { class: "mt-1 text-center text-lg text-ink/80" }, `（${question.zh}）`),
          h("p", { lang: "ja", class: "mt-4 rounded-2xl bg-ai-soft px-3 py-2 text-center text-lg font-bold text-ai" }, plain(TAP_PLEASE)),
          h("div", { class: `mt-4 grid gap-3 ${replies.length > 4 ? "grid-cols-2" : "grid-cols-1"}` }, options),
        ),
      );
      // Coming back from an answer (再問一次) replaced the focused button: put focus back on 關閉,
      // where opening the layer puts it. On the first draw the layer isn't attached yet; openOverlay does it.
      root.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
      void play(`${question.jp} ${TAP_PLEASE}`);
    }

    function answered(reply: Reply): void {
      hush();
      const done = h("button", { type: "button", class: BUTTON.primary, onclick: close }, "知道了");
      root.replaceChildren(
        overlayBar(close, "對方的回答"),
        h(
          "div",
          { class: "flex min-h-0 flex-1 flex-col overflow-y-auto px-5 text-center" },
          h(
            "div",
            { class: "my-auto space-y-3 py-4" },
            h("p", { class: "text-lg text-muted" }, `你問：${question.zh}`),
            h("p", { class: "font-bold leading-tight", style: armsLength(reply.zh) }, reply.zh),
            h("p", { lang: "ja", class: "text-2xl text-muted" }, plain(reply.jp)),
          ),
        ),
        h(
          "div",
          { class: "pb-safe grid grid-cols-2 gap-3 px-5 pt-3" },
          h("button", { type: "button", class: BUTTON.secondary, onclick: asking }, "再問一次"),
          done,
        ),
      );
      done.focus({ preventScroll: true });
    }

    asking();
    return root;
  });
}
