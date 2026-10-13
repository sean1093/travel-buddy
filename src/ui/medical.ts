import { SYMPTOMS, SYMPTOMS_INTRO } from "../content/medical";
import { sceneById } from "../content/scenes";
import { allergyCard, type CardBlock, medicalCard } from "../profile/cards";
import { isEmpty, loadProfile } from "../profile/profile";
import { BUTTON, h, icon } from "./dom";
import { cardBlock } from "./help";
import { playButton } from "./japanese";
import { page, section } from "./layout";
import { showToOther } from "./overlay";
import { phraseRow, rowGroup } from "./scene";

/** Phrases from the emergency scene that belong next to the cards. */
const MEDICAL_PHRASES = [
  "emergency-ambulance",
  "emergency-to-hospital",
  "emergency-insurance",
  "emergency-documents",
  "emergency-english-certificate",
];

/** The card, then 播放／放大 for it. */
function cardWithActions(blocks: CardBlock[], label: string): HTMLElement {
  return h(
    "div",
    { class: "space-y-3" },
    h(
      "div",
      { class: "grid grid-cols-2 gap-2" },
      playButton(blocks.map((b) => b.jp)),
      h(
        "button",
        {
          type: "button",
          class: "inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-ai text-lg font-bold text-on-accent active:scale-95",
          onclick: () => showToOther(blocks, label),
        },
        icon("expand"),
        "給對方看",
      ),
    ),
    blocks.map((block) => cardBlock(block, "text-2xl")),
  );
}

/** Toggle buttons for symptoms; the chosen ones become one card. */
function symptomPicker(): HTMLElement {
  const chosen = new Set<string>();
  const show = h("button", { type: "button", class: BUTTON.danger, disabled: true }, "先點選症狀");
  // Once something is ticked, the button follows the list down, so the next step is always on screen.
  const showBar = h("div", { class: "mt-3" }, show);
  function refresh(): void {
    show.disabled = chosen.size === 0;
    show.replaceChildren(...(chosen.size === 0 ? ["先點選症狀"] : [icon("expand"), `給對方看（${chosen.size} 項）`]));
    showBar.className =
      chosen.size === 0 ? "mt-3" : "pb-safe sticky bottom-0 z-10 -mx-4 mt-3 bg-paper/95 px-4 pt-2 backdrop-blur";
  }
  show.addEventListener("click", () => {
    const picked = SYMPTOMS.filter((s) => chosen.has(s.id));
    showToOther([{ jp: SYMPTOMS_INTRO, zh: "我有這些症狀：" }, ...picked.map((s) => ({ jp: s.jp, zh: s.zh }))], "我的症狀", true);
  });
  return h(
    "div",
    null,
    h(
      "div",
      { class: "grid grid-cols-2 gap-2" },
      SYMPTOMS.map((symptom) => {
        const button = h(
          "button",
          {
            type: "button",
            "aria-pressed": "false",
            class:
              // Room for four characters per line; balance splits a longer label evenly (呼吸／困難, not 呼吸困／難).
              "group flex min-h-16 items-center gap-2.5 rounded-lg bg-card px-2.5 py-2 text-left text-xl font-semibold leading-tight [text-wrap:balance] active:scale-95 aria-pressed:bg-shu-soft aria-pressed:ring-2 aria-pressed:ring-shu",
          },
          // A check box that fills in, like ticking a form at a clinic's reception.
          h(
            "span",
            {
              class:
                "flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 border-muted text-on-accent group-aria-pressed:border-shu group-aria-pressed:bg-shu",
              "aria-hidden": "true",
            },
            icon("check", "h-4 w-4 opacity-0 group-aria-pressed:opacity-100"),
          ),
          symptom.zh,
        );
        button.addEventListener("click", () => {
          if (chosen.has(symptom.id)) chosen.delete(symptom.id);
          else chosen.add(symptom.id);
          button.setAttribute("aria-pressed", String(chosen.has(symptom.id)));
          refresh();
        });
        return button;
      }),
    ),
    showBar,
  );
}

/** `#/medical`: medical card, allergy card, symptom pointing card. */
export function renderMedical(root: HTMLElement): void {
  const profile = loadProfile();
  const allergy = allergyCard(profile);
  const emergency = sceneById("emergency");
  const phrases = MEDICAL_PHRASES.flatMap((id) => emergency?.phrases.find((p) => p.id === id) ?? []);
  page(root, "醫療・過敏", [
    isEmpty(profile) &&
      h(
        "a",
        { href: "#/setup", class: "mt-2 block rounded-2xl bg-ai-soft p-4 text-lg" },
        "還沒有填健康資料。按這裡填慢性病、常吃的藥和過敏，醫療卡和過敏卡就會自動產生。症狀卡現在就能用。",
      ),
    section("哪裡不舒服？點選症狀", symptomPicker()),
    allergy && section("過敏卡（給餐廳看）", cardWithActions(allergy, "過敏卡")),
    section("醫療卡（給醫生、救護人員看）", cardWithActions(medicalCard(profile), "醫療卡")),
    section("常用句", rowGroup(phrases.map((p) => phraseRow(p, { jp: p.jp, zh: p.zh }, "醫療・過敏")))),
  ]);
}
