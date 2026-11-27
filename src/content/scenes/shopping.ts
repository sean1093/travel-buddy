import type { Scene } from "../types";

const OK = { jp: "わかりました。", zh: "知道了" };

export default {
  id: "shopping",
  title: "購物",
  icon: "bag",
  groups: [
    { id: "shop", title: "挑選" },
    { id: "pay", title: "結帳・包裝・退換" },
    { id: "tax", title: "免稅・退稅" },
  ],
  phrases: [
    { id: "shopping-how-much", group: "shop", zh: "這個多少錢？", jp: "これ は いくら です か。" },
    { id: "shopping-this", group: "shop", zh: "我要這個。", jp: "これ を ください。" },
    { id: "shopping-just-looking", group: "shop", zh: "我只是看看。", jp: "{見|み}て いる だけ です。" },
    {
      id: "shopping-where-item", group: "shop",
      zh: "這個在哪裡？（給對方看照片）",
      jp: "これ は どこ に あります か。",
      answers: "direction",
    },
    { id: "shopping-try-on", group: "shop", zh: "可以試穿嗎？", jp: "{試着|しちゃく} して も いい です か。", answers: "yesNo" },
    {
      id: "shopping-bigger", group: "shop",
      zh: "有大一點的尺寸嗎？",
      jp: "もう {少|すこ}し {大|おお}きい サイズ は あります か。",
      answers: "have",
    },
    {
      id: "shopping-smaller", group: "shop",
      zh: "有小一點的尺寸嗎？",
      jp: "もう {少|すこ}し {小|ちい}さい サイズ は あります か。",
      answers: "have",
    },
    { id: "shopping-other-color", group: "shop", zh: "有別的顏色嗎？", jp: "{他|ほか} の {色|いろ} は あります か。", answers: "have" },
    { id: "shopping-write-price", group: "pay", zh: "請把價錢寫下來。", jp: "{値段|ねだん} を {書|か}いて ください。" },
    {
      id: "shopping-tax-free", group: "tax",
      zh: "可以辦免稅嗎？",
      jp: "{免税|めんぜい} に できます か。",
      tip: "要出示護照。2026 年 11 月 1 日起改成先付含稅價、出境時在機場退稅。",
      answers: "yesNo",
      link: { href: "#/guide/tax-refund", label: "看出境退稅步驟" },
    },
    {
      id: "shopping-refund-how",
      group: "tax",
      zh: "稅金之後要怎麼退給我？",
      jp: "{税金|ぜいきん} は どう やって {返金|へんきん} されます か。",
      tip: "各店的退款方式不同，買的時候先問清楚。",
      answers: [
        { jp: "クレジットカード に {返金|へんきん} します", zh: "退回信用卡" },
        { jp: "{現金|げんきん} で {返金|へんきん} します", zh: "退現金" },
        { jp: "アプリ で {受|う}け{取|と}れます", zh: "用 App 領取" },
        { jp: "{説明書|せつめいしょ} を {見|み}て ください", zh: "請看說明書" },
        { jp: "わかりません", zh: "不知道" },
      ],
    },
    {
      id: "shopping-refund-paper",
      group: "tax",
      zh: "有中文的退稅說明嗎？",
      jp: "{中国語|ちゅうごくご} の {説明|せつめい} は あります か。",
      answers: "have",
    },
    {
      id: "shopping-refund-receipt",
      group: "tax",
      zh: "請給我收據，退稅要用。",
      jp: "{免税|めんぜい} の {手続|てつづ}き に {使|つか}う ので、レシート を ください。",
    },
    {
      id: "shopping-refund-kiosk",
      group: "tax",
      zh: "（機場）免稅手續的機台在哪裡？",
      jp: "{免税|めんぜい} {手続|てつづ}き の {端末|たんまつ} は どこ です か。",
      tip: "在國際線出境大廳，一定要在報到托運之前辦。要帶護照和全部的免稅品。",
      answers: "direction",
      link: { href: "#/guide/tax-refund", label: "看出境退稅步驟" },
    },
    {
      id: "shopping-refund-customs",
      group: "tax",
      zh: "（機場）我要給海關看免稅的東西。",
      jp: "{免税品|めんぜいひん} の {確認|かくにん} を お{願|ねが}い します。",
      tip: "機台顯示紅色時，帶著東西和護照到海關檢查處。",
    },
    {
      id: "shopping-refund-used",
      group: "tax",
      zh: "（海關）有一部分已經用掉了。",
      jp: "{一部|いちぶ} を もう {使|つか}って しまいました。",
      tip: "已經用掉或沒帶在身上的東西，辦手續前先告訴海關人員。",
    },
    { id: "shopping-card", group: "pay", zh: "可以刷卡嗎？", jp: "カード で {払|はら}えます か。", answers: "yesNo" },
    {
      id: "shopping-gift-wrap", group: "pay",
      zh: "可以幫我包裝成禮物嗎？",
      jp: "プレゼント {用|よう} に {包|つつ}んで もらえます か。",
      answers: "yesNo",
    },
    { id: "shopping-bag", group: "pay", zh: "請給我袋子。", jp: "{袋|ふくろ} を ください。" },
    { id: "shopping-think", group: "shop", zh: "我再考慮一下。", jp: "{少|すこ}し {考|かんが}えます。" },
    {
      id: "shopping-exchange", group: "pay",
      zh: "這個可以換嗎？",
      jp: "これ を {交換|こうかん} して もらえます か。",
      tip: "同時給對方看收據。",
      answers: "yesNo",
    },
    {
      id: "shopping-return", group: "pay",
      zh: "我想退貨。",
      jp: "これ を {返品|へんぴん} したい です。",
      tip: "同時給對方看收據。",
    },
  ],
  heard: [
    {
      id: "shopping-heard-looking-for",
      jp: "{何|なに} か お{探|さが}し です か。",
      zh: "在找什麼嗎？",
      replies: [
        { jp: "{見|み}て いる だけ です。", zh: "只是看看" },
        { jp: "これ を {探|さが}して います。", zh: "我在找這個（給對方看照片）" },
      ],
    },
    {
      id: "shopping-heard-tax-free",
      jp: "{免税|めんぜい} の お{手続|てつづ}き を します か。",
      zh: "要辦免稅嗎？",
      replies: [
        { jp: "はい、お{願|ねが}い します。", zh: "要" },
        { jp: "いいえ、{大丈夫|だいじょうぶ} です。", zh: "不用" },
      ],
    },
    {
      id: "shopping-heard-passport",
      jp: "パスポート を お{願|ねが}い します。",
      zh: "請給我護照。",
      replies: [
        { jp: "はい、どうぞ。", zh: "好，給你" },
        { jp: "{今|いま} {持|も}って いません。", zh: "我現在沒帶" },
      ],
    },
    {
      id: "shopping-heard-refund-later",
      jp: "{税金|ぜいきん} は {出国|しゅっこく} の とき に {返金|へんきん} されます。",
      zh: "稅金要等出境時才會退。",
      replies: [
        OK,
        { jp: "どう やって {返金|へんきん} されます か。", zh: "要怎麼退？" },
      ],
    },
    {
      id: "shopping-heard-show-goods",
      jp: "{免税品|めんぜいひん} を {見|み}せて ください。",
      zh: "（海關）請給我看免稅的東西。",
      replies: [
        { jp: "はい、これ です。", zh: "好，在這裡" },
        { jp: "スーツケース に {入|い}れました。", zh: "我放在行李箱裡了" },
      ],
    },
    {
      id: "shopping-heard-paid-bag",
      jp: "{袋|ふくろ} は {有料|ゆうりょう} です が、よろしい です か。",
      zh: "袋子要另外付錢，可以嗎？",
      replies: [
        { jp: "はい、お{願|ねが}い します。", zh: "好，要袋子" },
        { jp: "いいえ、いりません。", zh: "不用袋子" },
      ],
    },
    {
      id: "shopping-heard-lump-sum",
      jp: "お{支払|しはら}い は {一括|いっかつ} で よろしい です か。",
      zh: "刷卡一次付清可以嗎？",
      replies: [
        { jp: "はい。", zh: "好" },
        { jp: "わかりません。", zh: "我不懂" },
      ],
    },
    {
      id: "shopping-heard-pin",
      jp: "{暗証番号|あんしょうばんごう} を {入力|にゅうりょく} して ください。",
      zh: "請輸入信用卡密碼。",
      replies: [
        { jp: "はい。", zh: "好" },
        { jp: "{暗証番号|あんしょうばんごう} が わかりません。", zh: "我不知道密碼" },
      ],
    },
    {
      id: "shopping-heard-sold-out",
      jp: "{申|もう}し{訳|わけ} ありません。{在庫|ざいこ} が ありません。",
      zh: "很抱歉，沒有庫存了。",
      replies: [OK, { jp: "{他|ほか} の {店|みせ} に あります か。", zh: "別家店有嗎？" }],
    },
    {
      id: "shopping-heard-card-declined",
      jp: "{申|もう}し{訳|わけ} ありません。この カード は {使|つか}えません。",
      zh: "很抱歉，這張卡不能用。",
      replies: [
        { jp: "{現金|げんきん} で {払|はら}います。", zh: "我付現金" },
        { jp: "{別|べつ} の カード で {払|はら}います。", zh: "我換一張卡" },
        { jp: "{近|ちか}く に {ATM|エーティーエム} は あります か。", zh: "附近有 ATM 嗎？" },
      ],
    },
  ],
} satisfies Scene;
