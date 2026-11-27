import type { Scene } from "../types";

const OK = { jp: "わかりました。", zh: "知道了" };

/** 行李: lockers, left-luggage, forwarding by courier, and big suitcases on the Shinkansen. */
export default {
  id: "luggage",
  title: "行李",
  icon: "luggage",
  groups: [
    { id: "store", title: "寄放・置物櫃" },
    { id: "send", title: "宅配寄送" },
    { id: "shinkansen", title: "新幹線大行李" },
  ],
  phrases: [
    {
      id: "luggage-locker",
      group: "store",
      zh: "置物櫃在哪裡？",
      jp: "コインロッカー は どこ です か。",
      answers: "direction",
    },
    {
      id: "luggage-big-locker",
      group: "store",
      zh: "有放得下大行李箱的置物櫃嗎？",
      jp: "{大|おお}きい スーツケース が {入|はい}る ロッカー は あります か。",
      answers: "have",
    },
    {
      id: "luggage-left-luggage",
      group: "store",
      zh: "附近有可以寄放行李的地方嗎？",
      jp: "{近|ちか}く に {荷物|にもつ} を {預|あず}けられる {所|ところ} は あります か。",
      tip: "大車站的置物櫃常常客滿。車站、飯店櫃台和部分便利商店有人工寄放。",
      answers: "place",
    },
    {
      id: "luggage-keep",
      group: "store",
      zh: "可以幫我保管行李嗎？",
      jp: "{荷物|にもつ} を {預|あず}かって いただけます か。",
      tip: "退房後還要逛街，可以請飯店櫃台先保管。",
      answers: "yesNo",
    },
    {
      id: "luggage-until",
      group: "store",
      zh: "可以放到幾點？",
      jp: "{何時|なんじ} まで {預|あず}けられます か。",
      answers: "time",
    },
    {
      id: "luggage-pick-up",
      group: "store",
      zh: "我來拿寄放的行李。",
      jp: "{預|あず}けた {荷物|にもつ} を {受|う}け{取|と}りに {来|き}ました。",
      tip: "同時給對方看寄放時拿到的號碼牌或收據。",
    },
    {
      id: "luggage-send-hotel",
      group: "send",
      zh: "我想把這件行李寄到我住的飯店。",
      jp: "この {荷物|にもつ} を $hotel に {送|おく}りたい です。",
      fallback: "この {荷物|にもつ} を この ホテル に {送|おく}りたい です。",
      fallbackZh: "我想把這件行李寄到這間飯店。（同時給對方看地址）",
      tip: "飯店櫃台、便利商店和機場都能寄宅配（宅急便），寄到下一間飯店就不用自己扛。",
    },
    {
      id: "luggage-send-airport",
      group: "send",
      zh: "我想把這件行李寄到機場。",
      jp: "この {荷物|にもつ} を {空港|くうこう} に {送|おく}りたい です。",
      tip: "要寫搭機日期和航班，而且要提早幾天寄。哪天前要寄出，問櫃台最準。",
    },
    {
      id: "luggage-arrive-when",
      group: "send",
      zh: "什麼時候會送到？",
      jp: "いつ {届|とど}きます か。",
      answers: [
        { jp: "{今日|きょう} {中|じゅう}", zh: "今天" },
        { jp: "{明日|あした}", zh: "明天" },
        { jp: "{明後日|あさって}", zh: "後天" },
        { jp: "{紙|かみ} に {書|か}きます", zh: "寫在紙上" },
      ],
    },
    {
      id: "luggage-fee",
      group: "send",
      zh: "運費多少錢？",
      jp: "{送料|そうりょう} は いくら です か。",
      tip: "請對方寫在紙上或指給你看。",
    },
    {
      id: "luggage-form",
      group: "send",
      zh: "請教我怎麼填寄件單。",
      jp: "{伝票|でんぴょう} の {書|か}き{方|かた} を {教|おし}えて ください。",
    },
    {
      id: "luggage-fragile",
      group: "send",
      zh: "裡面有易碎的東西。",
      jp: "{割|わ}れ{物|もの} が {入|はい}って います。",
    },
    {
      id: "luggage-oversized-check",
      group: "shinkansen",
      zh: "這件行李算特大行李嗎？",
      jp: "この {荷物|にもつ} は {特大|とくだい} {荷物|にもつ} です か。",
      tip: "長、寬、高加起來超過 160 公分就算。",
      answers: "yesNo",
      link: { href: "#/guide/shinkansen-luggage", label: "看新幹線大型行李規定" },
    },
    {
      id: "luggage-oversized-seat",
      group: "shinkansen",
      zh: "我想訂可以放大行李的座位。",
      jp: "{特大|とくだい} {荷物|にもつ} スペース つき {座席|ざせき} を {予約|よやく} したい です。",
      tip: "東海道、山陽、九州新幹線要先訂，不另外收費。",
      link: { href: "#/guide/shinkansen-luggage", label: "看新幹線大型行李規定" },
    },
    {
      id: "luggage-oversized-corner",
      group: "shinkansen",
      zh: "放大行李的地方在哪裡？",
      jp: "{特大|とくだい} {荷物|にもつ} コーナー は どこ です か。",
      answers: "direction",
    },
    {
      id: "luggage-rack",
      group: "shinkansen",
      zh: "這件行李可以放上面的架子嗎？",
      jp: "この {荷物|にもつ} は {棚|たな} に {載|の}せられます か。",
      answers: "yesNo",
    },
  ],
  heard: [
    {
      id: "luggage-heard-full",
      jp: "ロッカー は {満杯|まんぱい} です。",
      zh: "置物櫃都滿了。",
      replies: [
        { jp: "{近|ちか}く に {荷物|にもつ} を {預|あず}けられる {所|ところ} は あります か。", zh: "附近有可以寄放的地方嗎？" },
        OK,
      ],
    },
    {
      id: "luggage-heard-too-big",
      jp: "サイズ が {大|おお}きすぎます。",
      zh: "尺寸太大了。",
      replies: [
        { jp: "どう すれば いい です か。", zh: "那該怎麼辦？" },
        { jp: "{宅配|たくはい} で {送|おく}れます か。", zh: "可以用宅配寄嗎？" },
      ],
    },
    {
      id: "luggage-heard-write-address",
      jp: "こちら に {送|おく}り{先|さき} を {書|か}いて ください。",
      zh: "請在這裡寫寄送地址。",
      replies: [
        { jp: "{書|か}いて いただけます か。", zh: "可以幫我寫嗎？（給對方看地址）" },
        { jp: "はい。", zh: "好" },
      ],
    },
    {
      id: "luggage-heard-fee",
      jp: "{特大|とくだい} {荷物|にもつ} の {手数料|てすうりょう} が かかります。",
      zh: "大行李要收手續費。",
      replies: [
        OK,
        { jp: "{予約|よやく} が {必要|ひつよう} だと {知|し}りませんでした。", zh: "我不知道要先預約" },
      ],
    },
    {
      id: "luggage-heard-arrival",
      jp: "{到着|とうちゃく} は {明後日|あさって} に なります。",
      zh: "後天才會送到。",
      replies: [OK, { jp: "{明日|あした} は {無理|むり} です か。", zh: "明天沒辦法嗎？" }],
    },
  ],
} satisfies Scene;
