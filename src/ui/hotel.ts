import { plain } from "../lib/jp";
import { dialable } from "../lib/phone";
import { hotelCard, LINES } from "../profile/cards";
import { currentHotel, loadProfile } from "../profile/profile";
import { BUTTON, h, icon } from "./dom";
import { callButton, cardBlock } from "./help";
import { playButton } from "./japanese";
import { page, section } from "./layout";
import { showToOther } from "./overlay";

/** `#/hotel` and `#/hotel/<n>`: the hotel card for a taxi driver or anyone giving directions. */
export function renderHotel(root: HTMLElement, [index]: string[]): void {
  const profile = loadProfile();
  const chosen = index !== undefined ? profile.hotels[Number(index)] : undefined;
  const hotel = chosen ?? currentHotel(profile);
  if (!hotel) {
    page(root, "回飯店", [
      h("p", { class: "mt-4 text-xl leading-relaxed" }, "還沒有填飯店。填好飯店的日文名稱和地址，這裡就會變成可以直接給計程車司機看的卡片。"),
      h("a", { href: "#/setup", class: `${BUTTON.primary} mt-6` }, icon("edit"), "去填飯店"),
      h("p", { class: "mt-6 text-lg text-muted" }, "現在可以先把訂房確認信上的地址給司機看，再按下面念這句："),
      h("p", { lang: "ja", class: "mt-2 text-2xl font-bold" }, plain("この {住所|じゅうしょ} まで お{願|ねが}い します。")),
      h("div", { class: "mt-3 flex gap-3" }, playButton("この {住所|じゅうしょ} まで お{願|ねが}い します。")),
    ]);
    return;
  }
  const card = hotelCard(hotel);
  const phone = dialable(hotel.phone, "jp");
  const others = profile.hotels.map((h, i) => ({ h, i })).filter(({ h: other }) => other !== hotel);
  page(root, "回飯店", [
    h("p", { class: "mt-2 flex items-center gap-2 text-lg font-bold text-ai" }, icon("taxi", "h-6 w-6"), "給計程車司機或路人看"),
    h("div", { class: "mt-3" }, cardBlock(card)),
    h(
      "div",
      { class: "mt-4 grid grid-cols-2 gap-2" },
      playButton(LINES.taxiToHotel, "normal", "md", "whitespace-nowrap"),
      h(
        "button",
        {
          type: "button",
          class: "inline-flex min-h-14 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-ai-soft px-2 text-lg font-bold text-ai active:scale-95",
          onclick: () => showToOther([card], "回飯店"),
        },
        icon("expand"),
        "給對方看",
      ),
    ),
    phone && h("div", { class: "mt-4" }, callButton("打電話給飯店", phone.display, phone.tel, true)),
    others.length > 0 &&
      section(
        "其他飯店",
        h(
          "div",
          { class: "space-y-2" },
          others.map(({ h: other, i }) =>
            h(
              "a",
              { href: `#/hotel/${i}`, class: "block min-h-14 rounded-2xl bg-card px-4 py-3 text-xl font-bold" },
              h("span", { lang: "ja" }, other.name || other.address),
              (other.from || other.to) && h("span", { class: "block text-base font-normal text-muted" }, `${other.from} ～ ${other.to}`),
            ),
          ),
        ),
      ),
  ]);
}
