import type { Jp, Preset } from "./types";

/**
 * Checkboxes in the setup form, each with Japanese written in advance so the
 * medical and allergy cards never depend on what someone typed.
 */

/** Chronic conditions, as nouns for 「持病：…」. */
export const CONDITIONS: Preset[] = [
  { id: "hypertension", zh: "高血壓", jp: "{高血圧|こうけつあつ}" },
  { id: "diabetes", zh: "糖尿病", jp: "{糖尿病|とうにょうびょう}" },
  { id: "heart-disease", zh: "心臟病", jp: "{心臓病|しんぞうびょう}" },
  { id: "arrhythmia", zh: "心律不整", jp: "{不整脈|ふせいみゃく}" },
  { id: "pacemaker", zh: "裝有心律調節器", jp: "ペースメーカー {使用中|しようちゅう}" },
  { id: "anticoagulant", zh: "正在吃抗凝血劑", jp: "{抗凝固薬|こうぎょうこやく} {服用中|ふくようちゅう}" },
  { id: "stroke", zh: "曾經中風", jp: "{脳卒中|のうそっちゅう} の {既往|きおう}" },
  { id: "asthma", zh: "氣喘", jp: "{喘息|ぜんそく}" },
  { id: "kidney", zh: "腎臟病", jp: "{腎臓病|じんぞうびょう}" },
  { id: "liver", zh: "肝臟病", jp: "{肝臓病|かんぞうびょう}" },
  { id: "epilepsy", zh: "癲癇", jp: "てんかん" },
  { id: "hearing", zh: "聽力不好", jp: "{難聴|なんちょう}" },
];

/** Drug allergies, as nouns for 「…アレルギー」. */
export const DRUG_ALLERGIES: Preset[] = [
  { id: "penicillin", zh: "盤尼西林", jp: "ペニシリン" },
  { id: "cephem", zh: "頭孢菌素類抗生素", jp: "セフェム{系|けい} {抗生物質|こうせいぶっしつ}" },
  { id: "aspirin", zh: "阿斯匹靈", jp: "アスピリン" },
  { id: "nsaids", zh: "消炎止痛藥（NSAIDs）", jp: "{解熱鎮痛薬|げねつちんつうやく}" },
  { id: "contrast", zh: "顯影劑", jp: "{造影剤|ぞうえいざい}" },
  { id: "anesthetic", zh: "麻醉藥", jp: "{麻酔薬|ますいやく}" },
];

/**
 * Food allergies. The first nine are Japan's mandatory allergen labels
 * (特定原材料), so packaged food in Japan names them on the label; the rest
 * are from the recommended list (特定原材料に準ずるもの) or common in Taiwan.
 *
 * Source: Consumer Affairs Agency (消費者庁), food allergy labelling —
 * https://www.caa.go.jp/policies/policy/food_labeling/food_sanitation/allergy/
 * カシューナッツ became mandatory on 2026-04-01 (令和8年内閣府令第34号):
 * https://www.caa.go.jp/policies/policy/food_labeling/food_labeling_act/assets/food_labeling_cms201_260401_10.pdf
 * Read via search results of the official pages (@checked 2026-10-08).
 */
export const FOOD_ALLERGIES: Preset[] = [
  { id: "shrimp", zh: "蝦", jp: "えび" },
  { id: "crab", zh: "蟹", jp: "かに" },
  { id: "walnut", zh: "核桃", jp: "くるみ" },
  { id: "wheat", zh: "小麥", jp: "{小麦|こむぎ}" },
  { id: "buckwheat", zh: "蕎麥", jp: "そば" },
  { id: "egg", zh: "蛋", jp: "{卵|たまご}" },
  { id: "milk", zh: "牛奶・乳製品", jp: "{乳製品|にゅうせいひん}" },
  { id: "peanut", zh: "花生", jp: "{落花生|らっかせい}（ピーナッツ）" },
  { id: "cashew", zh: "腰果", jp: "カシューナッツ" },
  { id: "soy", zh: "黃豆", jp: "{大豆|だいず}" },
  { id: "sesame", zh: "芝麻", jp: "ごま" },
  { id: "almond", zh: "杏仁果", jp: "アーモンド" },
  { id: "fish", zh: "魚", jp: "{魚|さかな}" },
  { id: "squid", zh: "魷魚・花枝", jp: "いか" },
  { id: "shellfish", zh: "貝類", jp: "{貝類|かいるい}" },
  { id: "salmon-roe", zh: "鮭魚卵", jp: "いくら" },
  { id: "kiwi", zh: "奇異果", jp: "キウイフルーツ" },
  { id: "peach", zh: "桃子", jp: "もも" },
];

/**
 * Eating restrictions that are not allergies; each is a full sentence.
 *
 * Taiwanese vegetarian types have no everyday Japanese name (五辛素 least of
 * all), so each sentence names the foods instead of the label. Japanese
 * cooking hides fish stock (だし: bonito, dried sardines) and meat extract
 * (エキス) in soups and sauces, so the vegetarian ones say so explicitly.
 * The id "vegetarian" predates the split and keeps its meaning: no meat or
 * seafood, which is 蛋奶素.
 */
export const DIETS: Preset[] = [
  {
    id: "vegan",
    zh: "全素（不吃任何動物性食物）",
    jp: "ヴィーガン です。{肉|にく}・{魚介類|ぎょかいるい}・{卵|たまご}・{乳製品|にゅうせいひん} は {食|た}べられません。{魚|さかな} の だし や {肉|にく} の エキス も {食|た}べられません。",
  },
  {
    id: "vegetarian",
    zh: "蛋奶素（不吃肉和海鮮，可以吃蛋和奶）",
    jp: "ベジタリアン です。{肉|にく} と {魚介類|ぎょかいるい} は {食|た}べられません が、{卵|たまご} と {乳製品|にゅうせいひん} は {大丈夫|だいじょうぶ} です。{魚|さかな} の だし や {肉|にく} の エキス も {食|た}べられません。",
  },
  {
    id: "no-pungent",
    zh: "五辛素（不吃蔥、蒜、洋蔥、韭菜、蕎頭）",
    jp: "{宗教|しゅうきょう} の {理由|りゆう} で、にんにく・ねぎ・たまねぎ・にら・らっきょう は {食|た}べられません。ソース や スープ に {入|はい}って いる もの も {食|た}べられません。",
  },
  {
    id: "no-seafood",
    zh: "不吃海鮮",
    jp: "{魚|さかな}・えび・かに・{貝|かい}・いか など、{魚介類|ぎょかいるい} は {食|た}べられません。",
  },
  { id: "no-beef", zh: "不吃牛肉", jp: "{牛肉|ぎゅうにく} は {食|た}べられません。" },
  { id: "no-pork", zh: "不吃豬肉", jp: "{豚肉|ぶたにく} は {食|た}べられません。" },
  { id: "no-raw", zh: "不吃生的食物", jp: "{生|なま} の もの は {食|た}べられません。" },
  { id: "no-spicy", zh: "不吃辣", jp: "{辛|から}い もの は {食|た}べられません。" },
  { id: "no-alcohol", zh: "不能喝酒", jp: "お{酒|さけ} は {飲|の}めません。" },
  { id: "low-salt", zh: "要少鹽", jp: "{塩分|えんぶん} を {控|ひか}えて います。" },
  { id: "soft-food", zh: "要軟一點的食物", jp: "やわらかい {料理|りょうり} が いい です。" },
];

/** Symptoms for the pointing card; each is a full sentence a doctor or staff member reads. */
export const SYMPTOMS: Preset[] = [
  { id: "headache", zh: "頭痛", jp: "{頭|あたま} が {痛|いた}い です。" },
  { id: "fever", zh: "發燒", jp: "{熱|ねつ} が あります。" },
  { id: "chills", zh: "發冷", jp: "{寒気|さむけ} が します。" },
  { id: "dizzy", zh: "頭暈", jp: "めまい が します。" },
  { id: "chest-pain", zh: "胸痛", jp: "{胸|むね} が {痛|いた}い です。" },
  { id: "breathless", zh: "呼吸困難", jp: "{息|いき} が {苦|くる}しい です。" },
  { id: "numb", zh: "手腳發麻", jp: "{手足|てあし} が しびれます。" },
  { id: "stomachache", zh: "肚子痛", jp: "お{腹|なか} が {痛|いた}い です。" },
  { id: "nausea", zh: "想吐", jp: "{吐|は}き{気|け} が します。" },
  { id: "vomited", zh: "吐了", jp: "{吐|は}きました。" },
  { id: "diarrhea", zh: "拉肚子", jp: "{下痢|げり} を して います。" },
  { id: "cough", zh: "咳嗽", jp: "{咳|せき} が {出|で}ます。" },
  { id: "sore-throat", zh: "喉嚨痛", jp: "{喉|のど} が {痛|いた}い です。" },
  { id: "toothache", zh: "牙痛", jp: "{歯|は}が {痛|いた}い です。" },
  { id: "fell", zh: "跌倒受傷", jp: "{転|ころ}んで けが を しました。" },
  { id: "sprain", zh: "扭到腳", jp: "{足|あし} を ひねりました。" },
  { id: "bleeding", zh: "血止不住", jp: "{血|ち} が {止|と}まりません。" },
  { id: "sting", zh: "被蟲咬・被蜂螫", jp: "{虫|むし} に {刺|さ}されました。" },
  { id: "rash", zh: "皮膚起疹子、癢", jp: "{発疹|ほっしん} が {出|で}て、かゆい です。" },
  { id: "heatstroke", zh: "可能中暑", jp: "{熱中症|ねっちゅうしょう} かも しれません。" },
];

/** 「次の症状があります。」: the line above the chosen symptoms. */
export const SYMPTOMS_INTRO: Jp = "{次|つぎ} の {症状|しょうじょう} が あります。";

export const PRESET_LISTS = { CONDITIONS, DRUG_ALLERGIES, FOOD_ALLERGIES, DIETS, SYMPTOMS } as const;

export function presetsById<T extends Preset>(list: T[], ids: string[]): T[] {
  return ids.flatMap((id) => list.find((p) => p.id === id) ?? []);
}
