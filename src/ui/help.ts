import { EMERGENCY_NUMBERS, telOf } from "../content/emergency";
import { plain } from "../lib/jp";
import { dialable } from "../lib/phone";
import { type CardBlock, helpCard, LINES } from "../profile/cards";
import { loadProfile } from "../profile/profile";
import { fill, h, icon, type IconName } from "./dom";
import { dock, heading } from "./layout";
import { playButton } from "./japanese";
import { lineNode } from "./lines";
import { showToOther } from "./overlay";

/** One block of the help card: Japanese large for the helper, Chinese small for the traveller. */
export function cardBlock(block: CardBlock, size = "text-3xl"): HTMLElement {
  return h(
    "div",
    { class: "rounded-2xl bg-card p-4" },
    h("p", { lang: "ja", class: `${size} font-bold leading-snug` }, plain(block.jp)),
    block.extra.length > 0 &&
      h(
        "div",
        { lang: "ja", class: "mt-3 space-y-1 border-l-4 border-shu pl-3 text-2xl font-bold leading-snug" },
        block.extra.map((line) => lineNode(line)),
      ),
    h("p", { class: "mt-2 text-lg text-muted" }, block.zh),
  );
}

/**
 * A big `tel:` button: what it calls on top, details below. When `sub` is
 * just the number, `numberOnly` keeps it on one line.
 */
export function callButton(label: string, sub: string, tel: string, numberOnly = false): HTMLElement {
  return h(
    "a",
    {
      href: `tel:${tel}`,
      "aria-label": `${label}，${sub}`,
      class: "flex min-h-16 items-center gap-3 rounded-2xl bg-card px-4 py-3 text-ink transition active:scale-[0.98]",
    },
    icon("phone", "h-7 w-7 shrink-0 text-ai"),
    h(
      "span",
      { class: "min-w-0" },
      h("span", { class: "block text-2xl font-bold" }, label),
      h("span", { class: `block text-base ${numberOnly ? "whitespace-nowrap" : ""}` }, sub),
    ),
  );
}

/** `#/help`: the card to show a passer-by, station staff or the police. */
export function renderHelp(root: HTMLElement): void {
  const profile = loadProfile();
  const blocks = helpCard(profile);
  const family = profile.contacts[0];
  const familyPhone = family ? dialable(family.phone, "tw") : null;
  const lines = blocks.map((b) => b.jp);

  fill(
    root,
    h(
      "header",
      { class: "pt-safe sticky top-0 z-10 flex items-center justify-between gap-2 bg-sos px-3 pb-2 text-sos-on" },
      h(
        "a",
        { href: "#/", class: "inline-flex min-h-14 items-center gap-1 rounded-lg px-3 text-lg font-bold active:bg-black/10" },
        icon("back", "h-6 w-6"),
        "首頁",
      ),
      h("h1", { class: "flex items-center gap-2 text-2xl font-bold" }, icon("help", "h-7 w-7"), "我需要幫忙"),
    ),
    h(
      "main",
      { class: "space-y-4 px-4 pb-16 pt-4" },
      h("p", { class: "text-lg font-bold text-shu" }, "把下面的畫面拿給路人、車站人員或警察看"),
      h(
        "div",
        { class: "grid grid-cols-3 gap-2" },
        playButton(lines, "normal", "md", "whitespace-nowrap"),
        playButton(lines, "slow", "md", "whitespace-nowrap"),
        h(
          "button",
          {
            type: "button",
            class: "inline-flex min-h-14 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-ai-soft px-2 text-lg font-bold text-ai active:scale-95",
            onclick: () => showToOther(blocks, "我需要幫忙"),
          },
          icon("expand"),
          "放大",
        ),
      ),
      blocks.map((block) => cardBlock(block)),
      blocks.length <= 2 &&
        h(
          "a",
          { href: "#/setup", class: "block rounded-2xl bg-ai-soft p-4 text-lg" },
          "還沒有填飯店和家人電話。按這裡填好，卡片就會自動帶入地址和電話。",
        ),
      h(
        "section",
        { class: "space-y-3 pt-4" },
        heading("找警察（交番）", "shu"),
        h(
          "p",
          { class: "text-lg leading-relaxed" },
          "日本街上和車站附近常有派出所，叫「交番」（KOBAN），門口有紅色的燈。迷路、東西掉了都可以進去問，不用錢。",
        ),
        h(
          "button",
          {
            type: "button",
            class: "flex min-h-16 w-full items-center gap-3 rounded-2xl bg-card px-4 text-left text-xl font-bold active:scale-[0.98]",
            onclick: () =>
              showToOther(
                [
                  { jp: LINES.koban, zh: "附近的派出所在哪裡？" },
                  { jp: LINES.callPolice, zh: "請幫我叫警察。" },
                ],
                "找警察",
              ),
          },
          icon("expand", "h-7 w-7 shrink-0 text-ai"),
          h("span", null, "給對方看：附近的派出所在哪裡？", h("span", { lang: "ja", class: "block text-base font-normal text-muted" }, plain(LINES.koban))),
        ),
      ),
      h(
        "section",
        { class: "space-y-3 pt-4" },
        heading("緊急電話", "shu"),
        EMERGENCY_NUMBERS.filter((e) => MAIN_NUMBERS.includes(e.id)).map((entry) =>
          callButton(entry.title, `${entry.number}・${entry.when}`, telOf(entry.number)),
        ),
        h(
          "details",
          { class: "rounded-2xl bg-card p-4" },
          h("summary", { class: "cursor-pointer text-xl font-bold text-ai" }, "更多電話（各地辦事處）"),
          h(
            "div",
            { class: "mt-3 space-y-3" },
            EMERGENCY_NUMBERS.filter((e) => !MAIN_NUMBERS.includes(e.id) && !DOCKED_NUMBERS.includes(e.id)).map((entry) =>
              callButton(entry.title, `${entry.number}・${entry.when}`, telOf(entry.number)),
            ),
          ),
        ),
        h(
          "p",
          { class: "text-base text-muted" },
          "電話號碼查證日期：",
          // The oldest check among the numbers listed: never claim more freshness than the stalest one has.
          EMERGENCY_NUMBERS.map((e) => e.verified).sort()[0] ?? "",
          "。來源為日本政府觀光局、日本消防廳、日本警察與中華民國外交部、駐日代表處官方網站。",
        ),
      ),
      callDock(family?.relation || "家人", familyPhone?.tel ?? null),
    ),
  );
}

/** 110 and 119 live in the dock; these two come first in the list below the card. */
const DOCKED_NUMBERS = ["police", "ambulance"];
const MAIN_NUMBERS = ["jnto-hotline", "tecro-tokyo", "mofa-taiwan"];

/**
 * Calls that matter most, docked at the bottom so they are reachable from
 * anywhere on the page. No extra confirmation: a tel: link never dials by
 * itself (iOS asks, Android opens the dialer), and a second prompt only
 * slows someone down in an emergency.
 */
function callDock(familyLabel: string, familyTel: string | null): HTMLElement[] {
  const dial = (glyph: IconName, top: string, bottom: string, tel: string, tone: string) =>
    h(
      "a",
      {
        href: `tel:${tel}`,
        class: `flex min-h-16 min-w-0 flex-col items-center justify-center rounded-lg px-1 text-center font-bold leading-tight active:scale-95 ${tone}`,
      },
      h("span", { class: "flex max-w-full items-center gap-1 text-xl" }, icon(glyph, "h-5 w-5 shrink-0"), h("span", { class: "truncate" }, top)),
      h("span", { class: "block max-w-full truncate text-sm" }, bottom),
    );
  const police = EMERGENCY_NUMBERS.find((e) => e.id === "police");
  const ambulance = EMERGENCY_NUMBERS.find((e) => e.id === "ambulance");
  return dock(
    "撥打電話",
    h(
      "div",
      { class: `grid gap-2 ${familyTel ? "grid-cols-3" : "grid-cols-2"}` },
      // The family is abroad: say so, since the call is charged as international.
      familyTel && dial("phone", familyLabel, "國際電話", familyTel, "bg-ai text-on-accent"),
      police && dial("shield", "110", "警察", telOf(police.number), "bg-sos text-sos-on"),
      ambulance && dial("firstaid", "119", "救護車", telOf(ambulance.number), "bg-sos text-sos-on"),
    ),
  );
}
