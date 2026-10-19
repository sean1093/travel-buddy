import { EMERGENCY_NUMBERS } from "../content/emergency";
import { plain } from "../lib/jp";
import { allergyCard, type CardBlock, helpCard, hotelCard, lineText, medicalCard } from "../profile/cards";
import { isEmpty, loadProfile } from "../profile/profile";
import { BUTTON, h, icon } from "./dom";
import { page } from "./layout";

/** Numbers worth a place on the paper card: the first four, and TECRO Tokyo. */
const PRINTED_NUMBERS = ["police", "ambulance", "jnto-hotline", "tecro-tokyo"];

/**
 * One wallet card (85.6 × 54 mm, see `.wallet-card` in style.css): the
 * Japanese for the helper, a small Chinese title for the traveller. `big`
 * is for cards read at a distance, such as by a taxi driver.
 */
function walletCard(title: string, blocks: CardBlock[], options: { big?: boolean; accent?: string } = {}): HTMLElement {
  return h(
    "article",
    { class: `wallet-card ${options.big ? "wallet-card-big" : ""} bg-white text-black` },
    h(
      "p",
      { class: "wallet-title", style: options.accent ? `background:${options.accent}` : undefined },
      title,
    ),
    blocks.map((block) =>
      h(
        "div",
        { class: "wallet-block" },
        h("p", { lang: "ja", class: "font-bold" }, plain(block.jp)),
        block.extra.map((line) => h("p", { lang: "ja" }, lineText(line))),
      ),
    ),
  );
}

/** `#/print`: every card on one A4 sheet, cut along the dashed lines. */
export function renderPrint(root: HTMLElement): void {
  const profile = loadProfile();
  const allergy = allergyCard(profile);
  const help = helpCard(profile);
  const numbers = EMERGENCY_NUMBERS.filter((n) => PRINTED_NUMBERS.includes(n.id));
  const emergencyBlock: CardBlock = {
    jp: "{緊急|きんきゅう} {連絡先|れんらくさき}",
    zh: "緊急電話",
    extra: numbers.map((n) => `${n.number}　${n.title}`),
  };
  const cards = [
    walletCard("求救卡", help, { accent: "#fde2de" }),
    ...profile.hotels.map((hotel) => walletCard("飯店卡（給計程車司機看）", [hotelCard(hotel)], { big: true })),
    walletCard("醫療卡", medicalCard(profile), { accent: "#e3e9f8" }),
    allergy && walletCard("過敏卡（給餐廳看）", allergy, { accent: "#fdf3d2" }),
    walletCard("緊急電話", [emergencyBlock], { big: true }),
  ];
  page(
    root,
    "列印護貝小卡",
    [
      h(
        "div",
        { class: "no-print mt-2 space-y-3" },
        h(
          "p",
          { class: "text-lg leading-relaxed" },
          "印在 A4 紙上，沿虛線剪下、護貝，放在錢包或護照夾。手機沒電、沒網路也能拿出來給對方看。比較長的卡片請對折後再護貝。",
        ),
        isEmpty(profile) &&
          h(
            "a",
            { href: "#/setup", class: "block rounded-2xl bg-ai-soft p-4 text-lg" },
            "還沒有填資料，卡片上不會有飯店、電話和健康資料。按這裡先填好。",
          ),
        h("button", { type: "button", class: BUTTON.primary, onclick: () => window.print() }, icon("print"), "列印"),
        h("p", { class: "text-base text-muted" }, "電腦或手機都可以列印；也可以在列印畫面選「另存為 PDF」，傳給家人或自己留一份。"),
      ),
      h("div", { class: "print-sheet mt-6" }, cards),
    ],
    { back: "#/" },
  );
  foldOverflowing(root);
}

/** A card whose content does not fit gets double height, to be folded once before laminating. */
function foldOverflowing(root: HTMLElement): void {
  // On a narrow phone the preview shrinks the cards; the decision must match the paper.
  const sheet = root.querySelector<HTMLElement>(".print-sheet");
  sheet?.classList.add("print-measure");
  for (const card of root.querySelectorAll<HTMLElement>(".wallet-card")) {
    if (card.scrollHeight > card.clientHeight + 1) card.classList.add("wallet-card-tall");
  }
  sheet?.classList.remove("print-measure");
}
