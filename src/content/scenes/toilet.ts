import type { Reply, Scene } from "../types";

const UNDERSTOOD: Reply[] = [
  { jp: "わかりました。ありがとう ございます。", zh: "知道了，謝謝" },
  { jp: "もう {一度|いちど} お{願|ねが}い します。", zh: "請再說一次" },
];

/** 廁所・問路: finding the toilet, and finding the way. */
export default {
  id: "toilet",
  title: "廁所・問路",
  icon: "restroom",
  phrases: [
    { id: "toilet-where", zh: "廁所在哪裡？", jp: "トイレ は どこ です か。", answers: "direction" },
    { id: "toilet-borrow", zh: "可以借廁所嗎？", jp: "トイレ を {借|か}りて も いい です か。", answers: "borrow" },
    { id: "toilet-flush", zh: "我不知道怎麼沖水。", jp: "{水|みず} の {流|なが}し{方|かた} が わかりません。" },
    { id: "toilet-no-paper", zh: "沒有衛生紙了。", jp: "トイレットペーパー が ありません。" },
    {
      id: "toilet-accessible",
      zh: "有無障礙廁所嗎？",
      jp: "{多目的|たもくてき}トイレ は あります か。",
      answers: "place",
    },
    {
      id: "toilet-trash",
      zh: "垃圾桶在哪裡？",
      jp: "ゴミ{箱|ばこ} は どこ です か。",
      tip: "日本街上幾乎沒有垃圾桶，通常在車站、便利商店裡。",
      answers: "direction",
    },
    { id: "toilet-where-am-i", zh: "這裡是哪裡？", jp: "ここ は どこ です か。", tip: "可以請對方在地圖上指給你看。" },
    { id: "toilet-show-map", zh: "請在地圖上指給我看。", jp: "{地図|ちず} で {教|おし}えて ください。" },
    {
      id: "toilet-which-way",
      zh: "〇〇在哪個方向？",
      jp: "$dest は どちら です か。",
      fallback: "この {場所|ばしょ} は どちら です か。",
      fallbackZh: "這個地方在哪個方向？（同時給對方看地址或地圖）",
      answers: "direction",
    },
    { id: "toilet-walkable", zh: "走路到得了嗎？", jp: "{歩|ある}いて {行|い}けます か。", answers: "yesNo" },
    { id: "toilet-walk-time", zh: "走路要多久？", jp: "{歩|ある}いて どのくらい です か。", answers: "time" },
    {
      id: "toilet-nearest-station",
      zh: "最近的車站在哪裡？",
      jp: "{一番|いちばん} {近|ちか}い {駅|えき} は どこ です か。",
      answers: "direction",
    },
    {
      id: "toilet-take-me",
      zh: "可以帶我過去嗎？",
      jp: "そこ まで {連|つ}れて {行|い}って いただけます か。",
      answers: "yesNo",
    },
    {
      id: "toilet-no-stairs",
      zh: "有不用走樓梯的路嗎？",
      jp: "{階段|かいだん} を {使|つか}わない {行|い}き{方|かた} は あります か。",
      answers: "yesNo",
    },
    {
      id: "toilet-wheelchair",
      zh: "可以借輪椅嗎？",
      jp: "{車椅子|くるまいす} を {借|か}りられます か。",
      tip: "大車站、機場、百貨公司常有輪椅可以借，問服務台。",
      answers: "yesNo",
    },
    { id: "toilet-locker", zh: "置物櫃在哪裡？", jp: "コインロッカー は どこ です か。", answers: "direction" },
    {
      id: "toilet-rest",
      zh: "附近有可以坐下休息的地方嗎？",
      jp: "{近|ちか}く に {座|すわ}って {休|やす}める {場所|ばしょ} は あります か。",
      answers: "place",
    },
  ],
  heard: [
    { id: "toilet-heard-right", jp: "{右|みぎ} に {曲|ま}がって ください。", zh: "請右轉。", replies: UNDERSTOOD },
    { id: "toilet-heard-left", jp: "{左|ひだり} に {曲|ま}がって ください。", zh: "請左轉。", replies: UNDERSTOOD },
    {
      id: "toilet-heard-straight",
      jp: "この {道|みち} を まっすぐ {行|い}って ください。",
      zh: "這條路一直走。",
      replies: UNDERSTOOD,
    },
    {
      id: "toilet-heard-cross",
      jp: "{信号|しんごう} を {渡|わた}って ください。",
      zh: "請過紅綠燈（過馬路）。",
      replies: UNDERSTOOD,
    },
    {
      id: "toilet-heard-upstairs",
      jp: "{2階|にかい} に あります。",
      zh: "在二樓。",
      replies: [
        { jp: "エレベーター は どこ です か。", zh: "電梯在哪裡？" },
        { jp: "わかりました。", zh: "知道了" },
      ],
    },
    {
      id: "toilet-heard-guide",
      jp: "ご{案内|あんない} します。",
      zh: "我帶你去。",
      replies: [
        { jp: "ありがとう ございます。", zh: "謝謝" },
        { jp: "{大丈夫|だいじょうぶ} です。", zh: "不用了" },
      ],
    },
  ],
} satisfies Scene;
