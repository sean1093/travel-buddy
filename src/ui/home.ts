import { SCENES } from "../content/scenes";
import { voiceStatus } from "../lib/speech";
import { isEmpty, isPlannedFor, loadProfile, type Place, type Profile, today } from "../profile/profile";
import { fill, h, icon, pictogram } from "./dom";
import { guideRows } from "./guide";
import { heading } from "./layout";
import { pickPlace } from "./scene";

// Pictogram beside the label: two columns of short buttons fit all ten scenes on about one screen.
const TILE =
  "flex min-h-16 items-center gap-2 rounded-2xl bg-card px-3 py-2 text-left text-lg font-semibold leading-tight text-ink [text-wrap:balance] transition active:scale-[0.97] active:bg-ai-soft";
// The two shortcuts share one card, split by a dashed line like a printed form.
const SHORTCUT =
  "flex min-h-16 items-center gap-2 whitespace-nowrap px-3 py-2 text-xl font-semibold leading-tight text-ink transition-colors active:bg-ai-soft focus-visible:[outline-offset:-3px]";

/** One short line: the app greets by name when it has one. */
export function greeting(profile: Profile): string {
  return profile.callName ? `${profile.callName}，旅途平安` : "隨身旅伴";
}

/** Places dated today, in itinerary order. */
export function todaysPlaces(profile: Profile, day = today()): Place[] {
  return profile.places.filter((place) => isPlannedFor(place, day));
}

/** "今天要去": one tap opens transport with that place already picked. */
function todayRow(places: Place[]): HTMLElement {
  return h(
    "section",
    { class: "mt-5" },
    heading("今天要去"),
    h(
      "div",
      { class: "-mx-3 mt-2 flex gap-2 overflow-x-auto px-3 pb-1" },
      places.map((place) =>
        h(
          "button",
          {
            type: "button",
            class: "inline-flex min-h-14 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-card px-3 text-xl font-bold active:scale-95 active:bg-ai-soft",
            onclick: () => {
              pickPlace(place);
              location.hash = "#/scene/transport";
            },
          },
          icon(place.kind === "station" ? "train" : "pin", "h-6 w-6 text-ai"),
          place.zh || place.name,
          icon("next", "h-5 w-5 text-muted"),
        ),
      ),
    ),
  );
}

export function renderHome(root: HTMLElement): void {
  const profile = loadProfile();
  const empty = isEmpty(profile);
  const places = todaysPlaces(profile);
  fill(
    root,
    h(
      "main",
      { class: "pt-safe px-4 pb-10" },
      h("p", { class: "mt-2 px-0.5 text-sm tracking-[0.3em] text-muted", "aria-hidden": "true" }, "隨身旅伴・日本"),
      h("h1", { class: "truncate font-title text-3xl font-semibold leading-snug" }, greeting(profile)),
      voiceStatus() === "missing" &&
        h(
          "a",
          { href: "#/settings", class: "mt-3 flex items-center gap-2 rounded-2xl bg-warn-soft p-3 text-lg font-bold" },
          icon("alert", "h-6 w-6 shrink-0"),
          "這支手機還不會念日文 → 怎麼安裝",
        ),
      h(
        "a",
        {
          href: "#/help",
          class: "mt-3 flex min-h-28 items-center gap-4 rounded-2xl bg-shu px-5 py-4 text-on-accent transition active:scale-[0.98]",
        },
        icon("help", "h-11 w-11 shrink-0"),
        h(
          "span",
          { class: "text-left" },
          h("span", { class: "block whitespace-nowrap text-[min(2rem,9vw)] font-bold leading-tight" }, "我需要幫忙"),
          h("span", { class: "block text-lg opacity-90" }, "迷路・找家人・急病"),
        ),
      ),
      empty &&
        h(
          "section",
          { class: "mt-3 rounded-2xl bg-ai-soft p-4" },
          h("h2", { class: "text-xl font-bold text-ai" }, "第一次使用"),
          h(
            "p",
            { class: "mt-1 text-lg leading-relaxed" },
            "先填好飯店、行程和聯絡人，求救卡和站名就會自動帶入。有收到分享連結的話，直接點開就好。",
          ),
          h(
            "a",
            {
              href: "#/setup",
              class: "mt-3 flex min-h-14 items-center justify-center gap-2 rounded-lg bg-ai text-xl font-bold text-on-accent active:scale-[0.98]",
            },
            icon("edit"),
            "開始填資料",
          ),
        ),
      h(
        "div",
        { class: "mt-3 grid grid-cols-2 divide-x divide-dashed divide-hair overflow-hidden rounded-2xl bg-card" },
        h("a", { href: "#/hotel", class: SHORTCUT }, pictogram("taxi", "ai", "xs"), "回飯店"),
        h("a", { href: "#/medical", class: SHORTCUT }, pictogram("medcard", "shu", "xs"), "醫療卡"),
      ),
      places.length > 0 && todayRow(places),
      h(
        "nav",
        { class: "mt-5", "aria-label": "情境" },
        heading("情境"),
        h(
          "div",
          { class: "grid grid-cols-2 gap-2" },
          SCENES.map((scene, i) =>
            h(
              "a",
              {
                href: `#/scene/${scene.id}`,
                // With an odd number of scenes the last tile spans the row, so the grid has no gap.
                class: i === SCENES.length - 1 && SCENES.length % 2 === 1 ? `${TILE} col-span-2` : TILE,
              },
              pictogram(scene.icon, scene.id === "emergency" ? "shu" : "ai", "xs"),
              scene.title,
            ),
          ),
        ),
      ),
      h("section", { class: "mt-6" }, heading("旅遊小抄"), guideRows()),
      h(
        "nav",
        { class: "mt-6", "aria-label": "其他" },
        heading("設定"),
        h(
          "div",
          { class: "divide-y divide-dashed divide-hair overflow-hidden rounded-2xl bg-card" },
          (
            [
              ["#/setup", "edit", "設定資料", "飯店、行程、聯絡人、健康"],
              ["#/settings", "sliders", "字體與聲音", null],
              ["#/print", "print", "列印小卡", "手機沒電也能用"],
            ] as const
          ).map(([href, glyph, label, note]) =>
            h(
              "a",
              {
                href,
                class: "flex min-h-14 items-center gap-3 px-4 py-2 text-lg transition-colors active:bg-ai-soft focus-visible:[outline-offset:-3px]",
              },
              icon(glyph, "h-6 w-6 shrink-0 text-muted"),
              h(
                "span",
                { class: "min-w-0 flex-1" },
                h("span", { class: "block font-semibold" }, label),
                note && h("span", { class: "block text-base text-muted" }, note),
              ),
              icon("next", "h-5 w-5 shrink-0 text-ai"),
            ),
          ),
        ),
      ),
    ),
  );
}
