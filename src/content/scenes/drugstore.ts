import type { Scene } from "../types";

const SEE_CARD = { jp: "あります。この カード を {見|み}て ください。", zh: "有，請看這張卡（醫療卡）" };

export default {
  id: "drugstore",
  title: "藥妝店",
  icon: "pill",
  phrases: [
    // Asked, not demanded: 〜はありますか reads politely to a pharmacist; 〜がほしいです sounded blunt.
    { id: "drugstore-cold", zh: "有感冒藥嗎？", jp: "{風邪薬|かぜぐすり} は あります か。" },
    { id: "drugstore-fever", zh: "有退燒藥嗎？", jp: "{解熱剤|げねつざい} は あります か。" },
    { id: "drugstore-headache", zh: "有頭痛藥嗎？", jp: "{頭痛薬|ずつうやく} は あります か。" },
    { id: "drugstore-stomach", zh: "有腸胃藥嗎？", jp: "{胃腸薬|いちょうやく} は あります か。" },
    { id: "drugstore-diarrhea", zh: "有止瀉藥嗎？", jp: "{下痢止|げりど}め は あります か。" },
    { id: "drugstore-motion", zh: "有暈車藥嗎？", jp: "{酔|よ}い{止|ど}め は あります か。" },
    { id: "drugstore-itch", zh: "有蚊蟲咬傷的藥嗎？", jp: "{虫刺|むしさ}され の {薬|くすり} は あります か。" },
    { id: "drugstore-plaster", zh: "OK 繃在哪裡？", jp: "{絆創膏|ばんそうこう} は どこ です か。", answers: "direction" },
    { id: "drugstore-eye-drops", zh: "眼藥水在哪裡？", jp: "{目薬|めぐすり} は どこ です か。", answers: "direction" },
    { id: "drugstore-mask", zh: "口罩在哪裡？", jp: "マスク は どこ です か。", answers: "direction" },
    {
      id: "drugstore-this-product",
      zh: "有這個商品嗎？（給對方看照片）",
      jp: "この {商品|しょうひん} は あります か。",
      answers: "yesNo",
    },
    {
      id: "drugstore-pharmacist",
      zh: "可以問藥劑師嗎？",
      jp: "{薬剤師|やくざいし} さん に {相談|そうだん} できます か。",
      answers: "yesNo",
    },
    {
      id: "drugstore-allergy-ok",
      zh: "我有過敏，這個藥我可以吃嗎？",
      jp: "アレルギー が あります。この {薬|くすり} は {大丈夫|だいじょうぶ} です か。",
      link: { href: "#/medical/card", label: "打開醫療卡" },
      answers: "medicineOk",
    },
    {
      id: "drugstore-other-meds",
      zh: "我平常有在吃其他的藥。",
      jp: "{普段|ふだん} {他|ほか} の {薬|くすり} を {飲|の}んで います。",
      link: { href: "#/medical/card", label: "打開醫療卡" },
    },
    {
      id: "drugstore-how-often",
      zh: "一天要吃幾次？",
      jp: "{一日|いちにち} {何回|なんかい} {飲|の}みます か。",
      answers: [
        { jp: "{1回|いっかい}", zh: "一天 1 次" },
        { jp: "{2回|にかい}", zh: "一天 2 次" },
        { jp: "{3回|さんかい}", zh: "一天 3 次" },
        { jp: "わかりません", zh: "不知道" },
      ],
    },
    { id: "drugstore-tax-free", zh: "可以辦免稅嗎？", jp: "{免税|めんぜい} に できます か。", answers: "yesNo" },
  ],
  heard: [
    {
      id: "drugstore-heard-symptoms",
      jp: "どんな {症状|しょうじょう} です か。",
      zh: "有什麼症狀？",
      replies: [
        { jp: "{頭|あたま} が {痛|いた}い です。", zh: "頭痛" },
        { jp: "{熱|ねつ} が あります。", zh: "發燒" },
        { jp: "お{腹|なか} が {痛|いた}い です。", zh: "肚子痛" },
        { jp: "{咳|せき} が {出|で}ます。", zh: "咳嗽" },
      ],
    },
    {
      id: "drugstore-heard-since",
      jp: "いつ から です か。",
      zh: "從什麼時候開始的？",
      replies: [
        { jp: "{今日|きょう} から です。", zh: "今天" },
        { jp: "{昨日|きのう} から です。", zh: "昨天" },
        { jp: "{二日前|ふつかまえ} から です。", zh: "兩天前" },
      ],
    },
    {
      id: "drugstore-heard-allergy",
      jp: "アレルギー は あります か。",
      zh: "有過敏嗎？",
      replies: [{ jp: "ありません。", zh: "沒有" }, SEE_CARD],
    },
    {
      id: "drugstore-heard-other-meds",
      jp: "{他|ほか} に {飲|の}んで いる {薬|くすり} は あります か。",
      zh: "有在吃其他的藥嗎？",
      replies: [{ jp: "ありません。", zh: "沒有" }, SEE_CARD],
    },
    {
      id: "drugstore-heard-no-pharmacist",
      jp: "ただいま {薬剤師|やくざいし} が {不在|ふざい} の ため、こちら の {薬|くすり} は {販売|はんばい} できません。",
      zh: "藥劑師現在不在，這個藥不能賣。",
      replies: [
        { jp: "{何時|なんじ} に {戻|もど}られます か。", zh: "藥劑師幾點回來？" },
        { jp: "{他|ほか} の {薬|くすり} は あります か。", zh: "有別的藥嗎？" },
      ],
    },
    {
      id: "drugstore-heard-drowsy",
      jp: "{眠|ねむ}く なる {成分|せいぶん} が {入|はい}って います。",
      zh: "這個藥吃了會想睡。",
      replies: [
        { jp: "わかりました。", zh: "知道了" },
        { jp: "{眠|ねむ}く ならない {薬|くすり} は あります か。", zh: "有不會想睡的嗎？" },
      ],
    },
    {
      id: "drugstore-heard-after-meals",
      jp: "{食後|しょくご} に {飲|の}んで ください。",
      zh: "請在飯後吃。",
      replies: [
        { jp: "わかりました。", zh: "知道了" },
        { jp: "{一日|いちにち} {何回|なんかい} です か。", zh: "一天幾次？" },
      ],
    },
  ],
} satisfies Scene;
