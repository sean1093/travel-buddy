import { CONDITIONS, DIETS, DRUG_ALLERGIES, FOOD_ALLERGIES } from "../content/medical";
import type { Preset } from "../content/types";
import { plain } from "../lib/jp";
import {
  clearProfile,
  type Contact,
  emptyProfile,
  type Hotel,
  LIMITS,
  loadProfile,
  type Med,
  type Place,
  type Profile,
  parseProfile,
  saveProfile,
} from "../profile/profile";
import { type SetupSectionId, sectionSummaries } from "../profile/summary";
import { BUTTON, type Child, fill, h, icon, type IconName, pictogram } from "./dom";
import { dock, page } from "./layout";

const INPUT =
  "mt-1 block min-h-14 w-full rounded-2xl bg-card px-3 py-2 text-xl text-ink ring-1 ring-muted/60 placeholder:text-muted/80 focus:ring-ai";
const HINT = "mt-1 block text-base text-muted";
const CARD = "space-y-4 rounded-2xl bg-card/60 p-4";

interface FieldOptions {
  hint?: string;
  placeholder?: string;
  /** "ja" for Japanese, so the phone offers a Japanese keyboard and font. */
  lang?: string;
  type?: string;
  inputmode?: string;
  max?: number;
  autocomplete?: string;
}

/** A labelled input that writes through `set` on every keystroke. */
function field(label: string, value: string, set: (value: string) => void, options: FieldOptions = {}): HTMLElement {
  return h(
    "label",
    { class: "block text-lg font-bold" },
    label,
    h("input", {
      class: INPUT,
      value,
      type: options.type ?? "text",
      lang: options.lang,
      inputmode: options.inputmode,
      placeholder: options.placeholder,
      maxlength: options.max ?? LIMITS.short,
      autocomplete: options.autocomplete ?? "off",
      oninput: (event: Event) => set((event.target as HTMLInputElement).value),
    }),
    options.hint && h("span", { class: `${HINT} font-normal` }, options.hint),
  );
}

/**
 * Checkboxes for preset items, writing the checked ids through `set`. `wide`
 * gives each a full row, for labels that explain themselves (diets).
 */
function presets(list: Preset[], chosen: string[], set: (ids: string[]) => void, wide = false): HTMLElement {
  const picked = new Set(chosen);
  return h(
    "div",
    { class: `grid gap-2 ${wide ? "grid-cols-1" : "grid-cols-2"}` },
    list.map((preset) =>
      h(
        "label",
        { class: "flex min-h-14 items-center gap-3 rounded-2xl bg-card px-3 py-2 text-lg ring-1 ring-hair has-[:checked]:bg-ai-soft has-[:checked]:ring-ai" },
        h("input", {
          type: "checkbox",
          class: "h-6 w-6 shrink-0 accent-[rgb(var(--ai))]",
          checked: picked.has(preset.id),
          onchange: (event: Event) => {
            if ((event.target as HTMLInputElement).checked) picked.add(preset.id);
            else picked.delete(preset.id);
            set(list.map((p) => p.id).filter((id) => picked.has(id)));
          },
        }),
        h("span", { class: "min-w-0" }, preset.zh, h("span", { lang: "ja", class: "block truncate text-sm text-muted" }, plain(preset.jp))),
      ),
    ),
  );
}

/**
 * An editable list: one card per item, a delete button on each, and an add
 * button below. Only add and delete redraw the list; typing never does, so
 * the caret stays where it is.
 */
function listEditor<T>(options: {
  items: T[];
  noun: string;
  make: () => T;
  row: (item: T, index: number) => HTMLElement[];
  onChange: () => void;
}): HTMLElement {
  const box = h("div", { class: "space-y-3" });
  function draw(focusLast = false): void {
    fill(
      box,
      options.items.map((item, i) =>
        h(
          "div",
          { class: CARD },
          h(
            "div",
            { class: "flex items-center justify-between" },
            h("p", { class: "text-lg font-bold text-muted" }, `${options.noun} ${i + 1}`),
            h(
              "button",
              {
                type: "button",
                class: "inline-flex min-h-12 items-center gap-1 rounded-lg px-3 text-base font-bold text-shu active:bg-shu-soft",
                onclick: () => {
                  options.items.splice(i, 1);
                  options.onChange();
                  draw();
                },
              },
              icon("trash", "h-5 w-5"),
              "刪除",
            ),
          ),
          ...options.row(item, i),
        ),
      ),
      options.items.length < LIMITS.list
        ? h(
            "button",
            {
              type: "button",
              class: `${BUTTON.secondary} text-ai`,
              onclick: () => {
                options.items.push(options.make());
                options.onChange();
                draw(true);
              },
            },
            icon("plus"),
            `新增${options.noun}`,
          )
        : null,
    );
    if (focusLast) {
      const cards = box.querySelectorAll<HTMLElement>(":scope > div");
      cards[cards.length - 1]?.querySelector<HTMLInputElement>("input:not([type=radio])")?.focus();
    }
  }
  draw();
  return box;
}

function hotelRow(hotel: Hotel, save: () => void): HTMLElement[] {
  return [
    field("飯店日文名稱", hotel.name, (v) => ((hotel.name = v), save()), {
      lang: "ja",
      placeholder: "例：ホテルグレイスリー新宿",
      hint: "從訂房確認信複製貼上最準確。",
    }),
    field("讀音（可不填）", hotel.kana, (v) => ((hotel.kana = v), save()), {
      lang: "ja",
      placeholder: "例：ほてるぐれいすりーしんじゅく",
      hint: "平假名或片假名，語音才不會念錯。",
    }),
    field("日文地址", hotel.address, (v) => ((hotel.address = v), save()), {
      lang: "ja",
      max: LIMITS.long,
      placeholder: "例：東京都新宿区歌舞伎町1-19-1",
    }),
    field("飯店電話", hotel.phone, (v) => ((hotel.phone = v), save()), { type: "tel", placeholder: "例：03-1234-5678" }),
    h(
      "div",
      { class: "grid grid-cols-2 gap-3" },
      field("入住日", hotel.from, (v) => ((hotel.from = v), save()), { type: "date" }),
      field("退房日", hotel.to, (v) => ((hotel.to = v), save()), { type: "date" }),
    ),
  ];
}

/**
 * 電梯筆記: looked up before the trip, shown on the transport page when the
 * station is picked, and enlarged for station staff.
 */
function noteField(place: Place, save: () => void): HTMLElement {
  const area = h("textarea", {
    class: `${INPUT} h-28 resize-y`,
    maxlength: LIMITS.long,
    placeholder: "例：エレベーターはA3出口（改札外）。ホームへは3番線中央のエレベーター。",
    oninput: (event: Event) => {
      place.note = (event.target as HTMLTextAreaElement).value;
      save();
    },
  });
  area.value = place.note;
  return h(
    "label",
    { class: "block text-lg font-bold" },
    "電梯筆記（可不填）",
    area,
    h(
      "span",
      { class: `${HINT} font-normal` },
      "哪個出口有電梯、在剪票口內還是外。直接貼上官方網站的日文說明最好，站務員也看得懂。",
    ),
  );
}

function placeRow(place: Place, index: number, save: () => void): HTMLElement[] {
  const name = `place-kind-${index}`;
  const kind = (value: Place["kind"], glyph: IconName, label: string) =>
    h(
      "label",
      { class: "flex min-h-14 items-center justify-center gap-2 rounded-lg bg-card text-lg font-bold ring-1 ring-hair has-[:checked]:bg-ai-soft has-[:checked]:ring-2 has-[:checked]:ring-ai has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ai" },
      h("input", {
        type: "radio",
        name,
        class: "sr-only",
        checked: place.kind === value,
        onchange: () => ((place.kind = value), save()),
      }),
      icon(glyph, "h-6 w-6 text-ai"),
      label,
    );
  return [
    h("div", { class: "grid grid-cols-2 gap-3", role: "radiogroup", "aria-label": "類型" }, kind("station", "train", "車站"), kind("place", "pin", "地點")),
    field("日文名稱", place.name, (v) => ((place.name = v), save()), {
      lang: "ja",
      placeholder: "例：新宿、浅草寺",
      hint: "車站不用加「駅」，會自動加上。",
    }),
    field("讀音（可不填）", place.kana, (v) => ((place.kana = v), save()), { lang: "ja", placeholder: "例：しんじゅく" }),
    field("中文名稱", place.zh, (v) => ((place.zh = v), save()), { placeholder: "例：新宿" }),
    field("哪一天去（可不填）", place.date, (v) => ((place.date = v), save()), { type: "date", hint: "當天會排在最前面。" }),
    noteField(place, save),
  ];
}

function contactFields(contact: Contact, save: () => void, phoneHint: string): HTMLElement[] {
  return [
    h(
      "div",
      { class: "grid grid-cols-2 gap-3" },
      field("關係", contact.relation, (v) => ((contact.relation = v), save()), { placeholder: "例：女兒" }),
      field("姓名", contact.name, (v) => ((contact.name = v), save()), { autocomplete: "off" }),
    ),
    field("電話", contact.phone, (v) => ((contact.phone = v), save()), { type: "tel", hint: phoneHint, max: 40 }),
  ];
}

function medRow(med: Med, save: () => void): HTMLElement[] {
  return [
    field("成分名稱（英文）", med.ingredient, (v) => ((med.ingredient = v), save()), {
      placeholder: "例：Amlodipine",
      hint: "藥袋或藥盒上的英文成分名，日本醫師看得懂；不要寫商品名。",
    }),
    field("劑量與次數", med.dose, (v) => ((med.dose = v), save()), { placeholder: "例：5mg，一天一次" }),
  ];
}

/** The form's six parts, each a collapsible card whose header says what it holds. */
const GROUPS: { id: SetupSectionId; icon: IconName; title: string }[] = [
  { id: "traveller", icon: "user", title: "旅客" },
  { id: "hotels", icon: "bed", title: "飯店" },
  { id: "places", icon: "train", title: "每天的行程" },
  { id: "contacts", icon: "phone", title: "聯絡人" },
  { id: "health", icon: "firstaid", title: "健康" },
  { id: "allergy", icon: "bowl", title: "過敏・飲食・保險" },
];

export function renderSetup(root: HTMLElement): void {
  // Edited in place; every change is saved at once, so nothing is lost if the page closes.
  const profile: Profile = loadProfile();
  const year = profile.birthYear === null ? "" : String(profile.birthYear);

  const progress = h("span", { class: "min-w-0 text-lg font-bold" });
  const saved = h("span", { class: "shrink-0 text-base font-bold text-ok", "aria-live": "polite" });
  const headers = new Map<SetupSectionId, { text: HTMLElement; mark: HTMLElement }>();
  let savedTimer = 0;

  /** Rewrites the section headers and the progress line from the current data. */
  function refresh(parsed: Profile): void {
    const summaries = sectionSummaries(parsed);
    for (const summary of summaries) {
      const header = headers.get(summary.id);
      if (!header) continue;
      header.text.textContent = summary.text;
      header.mark.replaceChildren(summary.done ? icon("checkcircle", "h-7 w-7") : "");
    }
    progress.textContent = `已填 ${summaries.filter((s) => s.done).length}／${summaries.length} 段・會自動儲存`;
  }

  function save(): void {
    const parsed = parseProfile(profile);
    saveProfile(parsed);
    refresh(parsed);
    saved.replaceChildren(icon("check", "mr-1 inline h-4 w-4 align-[-2px]"), "已儲存");
    window.clearTimeout(savedTimer);
    savedTimer = window.setTimeout(() => (saved.textContent = ""), 1500);
  }

  function group(id: SetupSectionId, ...children: Child[]): HTMLElement {
    const meta = GROUPS.find((g) => g.id === id)!;
    const text = h("span", { class: "block truncate text-base font-normal text-muted" });
    const mark = h("span", { class: "w-7 shrink-0 text-ok", "aria-hidden": "true" });
    headers.set(id, { text, mark });
    const details = h(
      "details",
      { class: "group mt-4 rounded-2xl bg-card" },
      h(
        "summary",
        { class: "flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-2 [&::-webkit-details-marker]:hidden" },
        pictogram(meta.icon, "ai", "sm"),
        h("span", { class: "min-w-0 flex-1" }, h("span", { class: "block text-xl font-bold" }, meta.title), text),
        mark,
        icon("next", "h-6 w-6 shrink-0 text-ai transition group-open:rotate-90"),
      ),
      h("div", { class: "space-y-4 border-t-2 border-hair px-4 pb-4 pt-3" }, children),
    );
    // Only the first part starts open, so the whole form fits on a few screens.
    details.open = id === "traveller";
    return details;
  }

  const SUB = "pt-2 text-lg font-bold text-muted";

  page(root, "設定資料", [
    h(
      "div",
      { class: "mt-2 rounded-2xl bg-ai-soft p-4" },
      h("p", { class: "flex items-baseline justify-between gap-2" }, progress, saved),
      h("p", { class: "mt-1 text-base leading-relaxed" }, "全部都可以不填，填越多越好用。資料只存在這支手機，", h("b", null, "不會上傳"), "。"),
    ),
    group(
      "traveller",
      h(
        "div",
        { class: "space-y-4" },
        field("稱呼", profile.callName, (v) => ((profile.callName = v), save()), {
          placeholder: "例：媽媽、小美",
          hint: "首頁會用這個稱呼打招呼。",
          max: 20,
        }),
        field("護照上的英文姓名", profile.passportName, (v) => ((profile.passportName = v), save()), {
          placeholder: "例：LIN MEI-HUA",
          hint: "求救卡和醫療卡會給警察、醫院看。",
        }),
        field(
          "出生年（西元）",
          year,
          (v) => {
            const n = Number(v);
            profile.birthYear = Number.isInteger(n) && n >= 1900 && n <= 2100 ? n : null;
            save();
          },
          { inputmode: "numeric", placeholder: "例：1956", hint: "醫院一定會問年齡。", max: 4 },
        ),
      ),
    ),
    group(
      "hotels",
      listEditor({ items: profile.hotels, noun: "飯店", make: (): Hotel => ({ name: "", kana: "", address: "", phone: "", from: "", to: "" }), row: (hotel) => hotelRow(hotel, save), onChange: save }),
    ),
    group(
      "places",
      h("p", { class: "text-lg text-muted" }, "「我想去〇〇站」「這班車有停〇〇嗎」會直接用這些名稱，不用打字。"),
      h(
        "details",
        { class: "rounded-2xl bg-ai-soft p-3" },
        h("summary", { class: "cursor-pointer text-lg font-bold text-ai" }, "怎麼查車站的電梯？"),
        h(
          "ul",
          { class: "mt-2 list-disc space-y-1.5 pl-6 text-base leading-relaxed" },
          h("li", null, "Google 地圖查大眾運輸路線時，在路線「選項」裡勾選輪椅可通行（Wheelchair accessible），會改走有電梯的路線。"),
          h("li", null, "東京地下鐵（Tokyo Metro）官網每一站都有「Accessibility」頁面，列出電梯在哪個出口、在剪票口內還是外。"),
          h("li", null, "其他車站可以在 Yahoo!乗換案内 的車站頁面看「バリアフリー」資訊，或到該鐵路公司官網查「駅構内図」。"),
          h("li", null, "查到後把重點寫進下面每一站的「電梯筆記」；到了日本不用上網也看得到。"),
        ),
      ),
      listEditor({ items: profile.places, noun: "目的地", make: (): Place => ({ kind: "station", name: "", kana: "", zh: "", date: "", note: "" }), row: (place, i) => placeRow(place, i, save), onChange: save }),
    ),
    group(
      "contacts",
      h("p", { class: "text-lg text-muted" }, "通常是在台灣的家人。第一位會放在求救卡上。"),
      listEditor({
        items: profile.contacts,
        noun: "聯絡人",
        make: (): Contact => ({ relation: "", name: "", phone: "" }),
        row: (contact) => contactFields(contact, save, "台灣手機直接寫 09 開頭就好，例：0912-345-678。"),
        onChange: save,
      }),
      h("h3", { class: SUB }, "日本當地聯絡人（可不填）"),
      h(
        "div",
        { class: CARD },
        h("p", { class: "text-lg text-muted" }, "在日本的朋友、親戚或導遊。日本人最容易幫忙打的電話。"),
        ...contactFields(profile.localContact, save, "日本電話，例：090-1234-5678。"),
      ),
    ),
    group(
      "health",
      h("h3", { class: SUB }, "慢性病"),
      presets(CONDITIONS, profile.health.conditions, (ids) => ((profile.health.conditions = ids), save())),
      field("其他慢性病（請寫英文）", profile.health.conditionsOther, (v) => ((profile.health.conditionsOther = v), save()), {
        max: LIMITS.long,
        placeholder: "例：Glaucoma",
      }),
      h("h3", { class: SUB }, "常吃的藥"),
      listEditor({ items: profile.health.meds, noun: "藥", make: (): Med => ({ ingredient: "", dose: "" }), row: (med) => medRow(med, save), onChange: save }),
      h(
        "label",
        { class: "block text-lg font-bold" },
        "血型",
        h(
          "select",
          {
            class: INPUT,
            onchange: (event: Event) => {
              profile.health.bloodType = (event.target as HTMLSelectElement).value as Profile["health"]["bloodType"];
              save();
            },
          },
          (["", "A", "B", "O", "AB"] as const).map((type) =>
            h("option", { value: type, selected: profile.health.bloodType === type }, type ? `${type} 型` : "不知道／不填"),
          ),
        ),
      ),
    ),
    group(
      "allergy",
      h("h3", { class: SUB }, "藥物過敏"),
      presets(DRUG_ALLERGIES, profile.health.drugAllergies, (ids) => ((profile.health.drugAllergies = ids), save())),
      h("h3", { class: SUB }, "食物過敏"),
      presets(FOOD_ALLERGIES, profile.health.foodAllergies, (ids) => ((profile.health.foodAllergies = ids), save())),
      field("其他過敏（請寫英文）", profile.health.allergyOther, (v) => ((profile.health.allergyOther = v), save()), {
        max: LIMITS.long,
        placeholder: "例：Latex",
      }),
      h("h3", { class: SUB }, "飲食習慣"),
      presets(DIETS, profile.health.diets, (ids) => ((profile.health.diets = ids), save()), true),
      h("h3", { class: SUB }, "旅遊保險（可不填）"),
      h(
        "div",
        { class: CARD },
        field("保險公司", profile.insurance.company, (v) => ((profile.insurance.company = v), save())),
        field("保單號碼", profile.insurance.policy, (v) => ((profile.insurance.policy = v), save())),
        field("24 小時救援電話", profile.insurance.phone, (v) => ((profile.insurance.phone = v), save()), {
          type: "tel",
          max: 40,
          hint: "保單上的海外急難救助電話，請包含國碼，例：+886-2-1234-5678。",
        }),
      ),
    ),
    h(
      "div",
      { class: "mt-8 space-y-3" },
      h("a", { href: "#/print", class: BUTTON.secondary }, icon("print"), "列印護貝小卡"),
      h(
        "button",
        {
          type: "button",
          class: "mt-6 w-full min-h-14 rounded-2xl text-lg font-bold text-shu active:bg-shu-soft",
          onclick: () => {
            if (!confirm("確定要清除這支手機上的所有資料嗎？")) return;
            clearProfile();
            Object.assign(profile, emptyProfile());
            renderSetup(root);
          },
        },
        "清除所有資料",
      ),
    ),
    ...dock(
      "完成",
      h(
        "div",
        { class: "grid grid-cols-2 gap-2" },
        // 完成 is what everyone does; 分享 is for family filling it in for someone else, so it stays soft.
        h("a", { href: "#/share", class: `${BUTTON.soft} min-h-14` }, icon("share"), "分享"),
        h("a", { href: "#/", class: `${BUTTON.primary} min-h-14` }, icon("check"), "完成"),
      ),
    ),
  ]);
  refresh(parseProfile(profile));
}
