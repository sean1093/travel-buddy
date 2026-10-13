import { repliesFor } from "../content/replies";
import { RESCUE } from "../content/rescue";
import { sceneById } from "../content/scenes";
import type { Heard, Jp, Phrase, Scene } from "../content/types";
import { plain, slotsOf } from "../lib/jp";
import { LINES } from "../profile/cards";
import { type Ready, ready } from "../profile/fill";
import { loadProfile, type Place, placesForToday } from "../profile/profile";
import { fill, h, icon, pictogram } from "./dom";
import { SLOW_RATE } from "../state";
import { jpText, play, playButton } from "./japanese";
import { dock, heading, page } from "./layout";
import { askOther, openOverlay, overlayBar, showToOther } from "./overlay";

/** The destination picked on the scene page; kept while the app is open. */
let pickedPlace: Place | null = null;

/** Picks the destination the transport phrases use, e.g. from the home screen's "today" row. */
export function pickPlace(place: Place): void {
  pickedPlace = place;
}

const ACTION =
  "inline-flex min-h-16 items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-2 text-xl font-bold leading-tight transition active:scale-95";

/** One cell of the quiet action row: icon over a short label. */
const CELL = "min-h-16 flex-col gap-0.5 px-1 py-2 text-base leading-tight active:bg-ai-soft focus-visible:[outline-offset:-3px]";

/**
 * The buttons that do something with a phrase. 給對方看 is the one solid
 * button; hearing it and letting the other person answer share one quiet
 * card above it, split by dashed lines.
 */
function phraseActions(phrase: Phrase, line: Ready): HTMLElement {
  const quiet = [
    playButton(line.jp, "normal", "md", CELL, "plain"),
    playButton(line.jp, "slow", "md", CELL, "plain"),
    phrase.answers &&
      h(
        "button",
        {
          type: "button",
          // Green means "the other person answers".
          class: `inline-flex items-center justify-center font-bold text-ok transition active:scale-95 ${CELL}`,
          onclick: () => askOther(line, repliesFor(phrase.answers!)),
        },
        icon("hand"),
        h("span", { class: "whitespace-normal" }, "給對方點選答案"),
      ),
  ].filter(Boolean);
  return h(
    "div",
    { class: "space-y-2" },
    phrase.link && h("a", { href: phrase.link.href, class: `${ACTION} w-full bg-shu-soft text-shu` }, phrase.link.label),
    h(
      "div",
      { class: `grid divide-x divide-dashed divide-hair overflow-hidden rounded-2xl bg-card ${quiet.length === 3 ? "grid-cols-3" : "grid-cols-2"}` },
      quiet,
    ),
    h(
      "button",
      {
        type: "button",
        class: `${ACTION} w-full bg-ai text-on-accent`,
        onclick: () => showToOther([{ jp: line.jp, zh: line.zh }]),
      },
      icon("expand"),
      "給對方看",
    ),
  );
}

/** A usage hint for the traveller: an info mark, not decoration. */
function tip(text: string): HTMLElement {
  return h(
    "p",
    { class: "mt-3 flex gap-2 rounded-lg bg-warn-soft p-3 text-lg leading-relaxed" },
    icon("info", "mt-1 h-5 w-5 shrink-0 text-muted"),
    h("span", null, text),
  );
}

/**
 * One phrase, full screen: the Chinese to check, the Japanese on a slip with
 * a red top edge like a printed note, and the actions docked at the bottom.
 */
export function openPhrase(phrase: Phrase, line: Ready, sceneTitle?: string): void {
  openOverlay(line.zh, (close) =>
    h(
      "div",
      { class: "flex min-h-0 flex-1 flex-col" },
      overlayBar(close, sceneTitle ?? "", "quiet"),
      h(
        "div",
        { class: "min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4" },
        h("h2", { class: "px-1 font-title text-3xl font-semibold leading-snug [text-wrap:balance]" }, line.zh),
        h("div", { class: "mt-4 rounded-b-2xl rounded-t-sm border-t-[3px] border-shu bg-card px-4 pb-4 pt-3" }, jpText(line.jp, "lg")),
        phrase.tip && tip(phrase.tip),
      ),
      h("div", { class: "pb-safe border-t border-hair px-4 pt-3" }, phraseActions(phrase, line)),
    ),
  );
}

/** A phrase as a list row: the Chinese to find it by, a hint of the Japanese, and a way in. */
export function phraseRow(phrase: Phrase, line: Ready, sceneTitle?: string): HTMLElement {
  return h(
    "button",
    {
      type: "button",
      class:
        // Rows sit in a shared card (rowGroup), so they draw no box of their own; the
        // focus ring is drawn inside, where the card's rounded corners cannot clip it.
        "flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-ai-soft focus-visible:[outline-offset:-3px]",
      onclick: () => openPhrase(phrase, line, sceneTitle),
    },
    h(
      "span",
      { class: "min-w-0 flex-1" },
      h("span", { class: "block text-xl font-semibold leading-snug" }, line.zh),
      h("span", { lang: "ja", class: "mt-0.5 block truncate text-base text-muted" }, plain(line.jp)),
    ),
    icon("next", "h-6 w-6 shrink-0 text-ai"),
  );
}

/** Rows of one group in one card, split by hairlines: a list, not a stack of boxes. */
export function rowGroup(rows: HTMLElement[]): HTMLElement {
  return h("div", { class: "divide-y divide-dashed divide-hair overflow-hidden rounded-2xl bg-card" }, rows);
}

/**
 * A speaker that plays at normal speed, then slow on the next tap: one quiet
 * control instead of two buttons on every card.
 */
function replayButton(jp: Jp): HTMLButtonElement {
  let slowNext = false;
  const text = plain(jp);
  const button = h(
    "button",
    {
      type: "button",
      class: "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ai-soft text-ai transition active:scale-95",
      "aria-label": `播放「${text}」`,
    },
    icon("speaker", "h-6 w-6"),
  );
  button.addEventListener("click", () => {
    void play(jp, button, slowNext ? SLOW_RATE : undefined);
    slowNext = !slowNext;
    button.setAttribute("aria-label", `${slowNext ? "慢速播放" : "播放"}「${text}」`);
    button.replaceChildren(icon(slowNext ? "slow" : "speaker", "h-6 w-6"));
  });
  return button;
}

/** What staff say: the Chinese to find it by, the Japanese to check against, and the answers as the main buttons. */
function heardCard(heard: Heard): HTMLElement {
  return h(
    "article",
    { class: "rounded-2xl bg-card p-3" },
    h(
      "div",
      { class: "flex items-start gap-2" },
      h(
        "div",
        { class: "min-w-0 flex-1" },
        h("h3", { class: "text-xl font-semibold leading-snug" }, heard.zh),
        h("p", { lang: "ja", class: "mt-0.5 text-base text-muted" }, plain(heard.jp)),
      ),
      replayButton(heard.jp),
    ),
    h(
      "div",
      { class: `mt-3 grid gap-2 ${heard.replies.length === 3 ? "grid-cols-3" : "grid-cols-2"}` },
      heard.replies.map((reply) =>
        h(
          "button",
          {
            type: "button",
            class: "min-h-16 rounded-2xl bg-ok-soft px-2 py-2 text-xl font-bold leading-tight text-ok transition active:scale-95",
            onclick: () => showToOther([{ jp: reply.jp, zh: reply.zh }], "我的回答", true),
          },
          reply.zh,
        ),
      ),
    ),
  );
}

/** 萬用救援句 in a sheet: one tap shows the sentence to the other person and reads it out. */
export function openRescue(): void {
  openOverlay("萬用句", (close) =>
    h(
      "div",
      { class: "flex min-h-0 flex-1 flex-col" },
      overlayBar(close, "點一句，念給對方聽"),
      h(
        "div",
        { class: "min-h-0 flex-1 overflow-y-auto px-4 pb-safe pt-4" },
        h(
          "div",
          { class: "divide-y divide-dashed divide-hair overflow-hidden rounded-2xl bg-card" },
          RESCUE.map((phrase) =>
          h(
            "button",
            {
              type: "button",
              class: "block min-h-16 w-full px-4 py-3 text-left transition-colors active:bg-warn-soft focus-visible:[outline-offset:-3px]",
              onclick: () => showToOther([{ jp: phrase.jp, zh: phrase.zh }], phrase.zh, true),
            },
            h("span", { class: "block text-xl font-semibold leading-snug" }, phrase.zh),
            h("span", { lang: "ja", class: "mt-0.5 block text-base text-muted" }, plain(phrase.jp)),
          ),
          ),
        ),
      ),
    ),
  );
}

/** Docked at the bottom of every scene, so help with a stuck conversation is one tap from anywhere. */
function rescueDock(): HTMLElement[] {
  return dock(
    "萬用句",
    h(
      "button",
      {
        type: "button",
        class: "flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-warn-soft text-xl font-bold text-ink active:scale-[0.98]",
        onclick: openRescue,
      },
      icon("lifebuoy", "h-6 w-6"),
      "萬用句",
      h("span", { class: "text-base font-normal text-muted" }, "聽不懂・請說慢一點…"),
    ),
  );
}

/** Big buttons for the saved destinations; the picked one fills every 〇〇. */
/** The picked station's 電梯筆記, ready to enlarge for station staff. */
function elevatorNote(place: Place): HTMLElement {
  return h(
    "div",
    { class: "mt-3 rounded-2xl bg-card p-3" },
    h("p", { class: "flex items-center gap-2 text-lg font-bold" }, pictogram("elevator", "exit", "sm"), `${place.zh || place.name}・電梯筆記`),
    h("p", { class: "mt-1 whitespace-pre-line break-words text-lg" }, place.note),
    h(
      "button",
      {
        type: "button",
        class: "mt-2 inline-flex min-h-12 items-center gap-2 rounded-lg bg-ai px-4 text-lg font-bold text-on-accent active:scale-95",
        // The note is shown as typed (it may not be Japanese); the line above it is what gets read out.
        onclick: () =>
          showToOther(
            [{ jp: LINES.wantElevator, zh: "我想搭電梯（下面是事先查好的電梯資訊）", extra: place.note.split(/\n+/).filter(Boolean) }],
            "電梯筆記",
          ),
      },
      icon("expand", "h-5 w-5"),
      "放大給站務員看",
    ),
  );
}

function placePicker(places: Place[], picked: Place | null, pick: (place: Place) => void): HTMLElement {
  return h(
    "div",
    { class: "mt-3 rounded-2xl bg-ai-soft p-3" },
    h("p", { class: "text-lg font-bold" }, "要去哪裡？點一下換進句子"),
    h(
      "div",
      { class: "-mx-3 mt-2 flex gap-2 overflow-x-auto px-3 pb-1", role: "radiogroup", "aria-label": "目的地" },
      places.map((place) =>
        h(
          "button",
          {
            type: "button",
            role: "radio",
            "aria-checked": String(place === picked),
            class: `inline-flex min-h-14 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xl font-bold ring-1 ring-inset active:scale-95 ${
              place === picked ? "bg-ai text-on-accent ring-ai" : "bg-card text-ink ring-transparent"
            }`,
            onclick: () => pick(place),
          },
          icon(place.kind === "station" ? "train" : "pin", "h-5 w-5"),
          place.zh || place.name,
          place.note && h("span", { class: "sr-only" }, "（有電梯筆記）"),
          place.note && icon("elevator", "h-5 w-5"),
        ),
      ),
    ),
    picked?.note && elevatorNote(picked),
  );
}

function tabs(scene: Scene, heard: boolean): HTMLElement {
  const tab = (href: string, label: string, active: boolean) =>
    h(
      "a",
      {
        href,
        "aria-current": active ? "page" : undefined,
        // A segmented control: the current side is a raised card, not a solid button.
        class: `flex min-h-14 items-center justify-center rounded-xl text-xl ${active ? "bg-card font-bold text-ink shadow-sm" : "font-medium text-muted"}`,
      },
      label,
    );
  return h(
    "nav",
    { class: "mt-2 grid grid-cols-2 gap-1 rounded-2xl bg-sand p-1", "aria-label": "分頁" },
    tab(`#/scene/${scene.id}`, "我要說", !heard),
    tab(`#/scene/${scene.id}/heard`, "對方說", heard),
  );
}

/** The phrase rows, under the scene's headings when it has them. */
function phraseList(scene: Scene, line: (phrase: Phrase) => Ready): HTMLElement[] {
  const rows = (phrases: Phrase[]) => rowGroup(phrases.map((p) => phraseRow(p, line(p), scene.title)));
  if (!scene.groups) return [rows(scene.phrases)];
  return scene.groups.map((group) =>
    h(
      "section",
      { class: "space-y-2" },
      h("div", { class: "pt-2" }, heading(group.title)),
      rows(scene.phrases.filter((p) => p.group === group.id)),
    ),
  );
}

/** `#/scene/<id>` and `#/scene/<id>/heard`. */
export function renderScene(root: HTMLElement, [id, view]: string[]): void {
  const scene = sceneById(id);
  if (!scene) {
    location.replace("#/");
    return;
  }
  const heard = view === "heard";
  const profile = loadProfile();
  const places = placesForToday(profile);
  // Keep the pick across scenes, but only while it is still in the profile.
  const picked = places.find((p) => p === pickedPlace || JSON.stringify(p) === JSON.stringify(pickedPlace)) ?? places[0] ?? null;
  const usesPlace = scene.phrases.some((p) => slotsOf(p.jp).some((s) => s === "dest" || s === "stop"));
  const list = h("div", { class: "mt-4 space-y-3" });

  function drawPhrases(place: Place | null): void {
    fill(list, phraseList(scene!, (phrase) => ready(phrase, profile, place)));
  }

  // Picking redraws only the picker and the phrases, so the page does not jump.
  const pickerSlot = h("div");
  function drawPicker(current: Place | null): void {
    fill(
      pickerSlot,
      placePicker(places, current, (place) => {
        pickedPlace = place;
        drawPicker(place);
        drawPhrases(place);
      }),
    );
  }
  if (!heard && usesPlace && places.length > 0) drawPicker(picked);

  page(
    root,
    scene.title,
    [
    tabs(scene, heard),
    !heard && usesPlace && places.length === 0
      ? h(
          "a",
          { href: "#/setup", class: "mt-3 block rounded-2xl bg-ai-soft p-3 text-lg" },
          "先在「設定資料」填好要去的車站，句子裡的〇〇就會自動換成站名。",
        )
      : pickerSlot,
    heard && h("p", { class: "mt-3 text-lg text-muted" }, "聽到對方這樣說 → 點你的回答，手機會念給對方聽。喇叭可以再聽一次，第二次是慢速。"),
    list,
    rescueDock(),
    ],
    { icon: pictogram(scene.icon, scene.id === "emergency" ? "shu" : "ai", "sm") },
  );
  if (heard) fill(list, scene.heard.map(heardCard));
  else drawPhrases(picked);
}
