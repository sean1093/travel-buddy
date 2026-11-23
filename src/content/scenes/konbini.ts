import type { Scene } from "../types";

const YES = { jp: "はい、お{願|ねが}い します。", zh: "要" };
const NO = { jp: "いいえ、{大丈夫|だいじょうぶ} です。", zh: "不用" };

export default {
  id: "konbini",
  title: "便利商店",
  icon: "store",
  phrases: [
    { id: "konbini-no-bag", zh: "不用袋子。", jp: "{袋|ふくろ} は いりません。" },
    { id: "konbini-bag", zh: "請給我袋子。", jp: "{袋|ふくろ} を ください。" },
    { id: "konbini-heat", zh: "請幫我加熱。", jp: "{温|あたた}めて ください。" },
    { id: "konbini-no-heat", zh: "不用加熱。", jp: "{温|あたた}め は {大丈夫|だいじょうぶ} です。" },
    { id: "konbini-chopsticks", zh: "請給我筷子。", jp: "お{箸|はし} を ください。" },
    { id: "konbini-spoon", zh: "請給我湯匙。", jp: "スプーン を ください。" },
    { id: "konbini-separate", zh: "請分開裝。", jp: "{別|べつ} の {袋|ふくろ} に {入|い}れて ください。" },
    {
      id: "konbini-where-item",
      zh: "這個放在哪裡？（給對方看照片）",
      jp: "これ は どこ に あります か。",
      answers: "direction",
    },
    {
      id: "konbini-hot-water",
      zh: "熱水在哪裡？（泡麵用）",
      jp: "お{湯|ゆ} は どこ です か。",
      answers: "direction",
    },
    { id: "konbini-atm", zh: "ATM 在哪裡？", jp: "{ATM|エーティーエム} は どこ です か。", answers: "direction" },
    {
      id: "konbini-toilet",
      zh: "可以借廁所嗎？",
      jp: "トイレ を {借|か}りて も いい です か。",
      answers: "yesNo",
    },
    { id: "konbini-pay-ic", zh: "我用交通卡付。", jp: "{交通系|こうつうけい} {IC|アイシー}カード で {払|はら}います。" },
    { id: "konbini-pay-card", zh: "我刷信用卡。", jp: "クレジットカード で お{願|ねが}い します。" },
    { id: "konbini-pay-cash", zh: "我付現金。", jp: "{現金|げんきん} で お{願|ねが}い します。" },
    { id: "konbini-receipt", zh: "請給我收據。", jp: "レシート を ください。" },
    {
      id: "konbini-throw-away",
      zh: "這個垃圾可以丟在這裡嗎？",
      jp: "この ゴミ を ここ に {捨|す}てて も いい です か。",
      tip: "日本街上垃圾桶很少。便利商店的垃圾桶是給店裡買的東西用的，先問一聲比較禮貌。",
      answers: "yesNo",
    },
    {
      id: "konbini-charger",
      zh: "有賣手機充電器嗎？",
      jp: "スマホ の {充電器|じゅうでんき} は あります か。",
      answers: "yesNo",
    },
  ],
  heard: [
    {
      id: "konbini-heard-bag",
      jp: "{袋|ふくろ} は ご{利用|りよう} です か。",
      zh: "要袋子嗎？（袋子要錢）",
      replies: [YES, { jp: "いりません。", zh: "不用" }],
    },
    { id: "konbini-heard-heat", jp: "{温|あたた}めます か。", zh: "要加熱嗎？", replies: [YES, NO] },
    {
      id: "konbini-heard-chopsticks",
      jp: "お{箸|はし} は お{付|つ}け します か。",
      zh: "要筷子嗎？",
      replies: [YES, NO],
    },
    {
      id: "konbini-heard-spoon",
      jp: "スプーン は お{付|つ}け します か。",
      zh: "要湯匙嗎？",
      replies: [YES, NO],
    },
    {
      id: "konbini-heard-eat-in",
      jp: "こちら で お{召|め}し{上|あ}がり です か。",
      zh: "要在店裡吃（內用）嗎？",
      replies: [
        { jp: "はい、ここ で {食|た}べます。", zh: "內用" },
        { jp: "いいえ、{持|も}ち{帰|かえ}り です。", zh: "外帶" },
      ],
    },
    {
      id: "konbini-heard-point-card",
      jp: "ポイントカード は お{持|も}ち です か。",
      zh: "有集點卡嗎？",
      replies: [
        { jp: "{持|も}って いません。", zh: "沒有" },
        { jp: "はい、あります。", zh: "有" },
      ],
    },
    {
      id: "konbini-heard-separate",
      jp: "{袋|ふくろ} は お{分|わ}け します か。",
      zh: "要分開裝嗎？",
      replies: [
        { jp: "はい、{分|わ}けて ください。", zh: "要分開" },
        { jp: "{一緒|いっしょ} で {大丈夫|だいじょうぶ} です。", zh: "一起裝就好" },
      ],
    },
    {
      id: "konbini-heard-payment",
      jp: "お{支払|しはら}い は どう されます か。",
      zh: "要怎麼付錢？",
      replies: [
        { jp: "{現金|げんきん} で。", zh: "現金" },
        { jp: "カード で。", zh: "信用卡" },
        { jp: "{IC|アイシー}カード で。", zh: "交通卡" },
      ],
    },
    {
      id: "konbini-heard-pay-screen",
      jp: "お{支払|しはら}い {方法|ほうほう} を {画面|がめん} で お{選|えら}び ください。",
      zh: "請在面前的螢幕上選付款方式。",
      replies: [
        { jp: "わかりました。", zh: "知道了" },
        { jp: "{使|つか}い{方|かた} が わかりません。", zh: "我不會操作" },
      ],
    },
    {
      id: "konbini-heard-age",
      jp: "{年齢|ねんれい} {確認|かくにん} の ボタン を {押|お}して ください。",
      zh: "請按畫面上的年齡確認按鈕。（買酒、菸時）",
      replies: [
        { jp: "はい。", zh: "好" },
        { jp: "どれ です か。", zh: "是哪一個？" },
      ],
    },
  ],
} satisfies Scene;
