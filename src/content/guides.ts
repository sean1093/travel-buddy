/**
 * 旅遊小抄: short step-by-step guides for procedures that trip travellers up.
 * Like the emergency numbers, every guide names its sources and the date it
 * was checked, and tests/content.test.ts refuses one without them. A rule
 * that could not be confirmed is left out, and the guide says to ask staff.
 *
 * Each guide's `verified` says when it was last checked. At the first check
 * the official sites were not reachable from the build environment, so the
 * rules were read from the official leaflets and from search results quoting
 * these official pages. Each guide must be checked again within 180 days, or
 * by its `recheckBy` (tests/content-freshness.test.ts).
 */
export interface GuideStep {
  title: string;
  body: string;
}

export interface Guide {
  /** Kebab-case; the page is `#/guide/<id>`. */
  id: string;
  title: string;
  /** One line under the title on the home list. */
  summary: string;
  steps: GuideStep[];
  /** Things that go wrong, in plain words. */
  notes: string[];
  sources: string[];
  verified: string;
  /** A known date the facts change on; see `Checked.recheckBy` in validate.ts. */
  recheckBy?: string;
}

export const GUIDES: Guide[] = [
  {
    id: "tax-refund",
    title: "出境退稅新制",
    summary: "2026 年 11 月 1 日起買的東西，先付含稅價，出境時在機場確認後才退稅。",
    steps: [
      {
        title: "在店裡",
        body: "結帳時出示護照，付含稅的價錢。順便問店員稅金之後怎麼退：會由店家或合作的業者，照你登記的方式退回。",
      },
      {
        title: "出發去機場前",
        body: "把護照和全部的免稅品放在好拿的地方。同一張收據上的東西要全部帶著。想用手機辦的話，先在 Visit Japan Web 設定好。",
      },
      {
        title: "到機場，報到托運之前",
        body: "在國際線出境大廳的退稅機台刷護照。成田、羽田、關西、中部、福岡、新千歲、那霸也可以連機場的退稅 Wi-Fi，用 Visit Japan Web 在手機上辦；人一定要在機場，不能在飯店先辦。手機辦不成就改用機台。",
      },
      {
        title: "看結果的顏色",
        body: "綠色：辦好了，不用給海關檢查。紅色：到出境大廳的海關檢查處，把免稅品拿給海關看。",
      },
      {
        title: "辦完再去報到",
        body: "免稅品這時候要托運或手提都可以。稅金之後照你在店裡登記的方式退回。",
      },
    ],
    notes: [
      "同一張收據上的東西少一件沒帶，整張收據都不能退稅。",
      "還沒辦完就托運行李，就失去退稅資格，航空公司也不會幫你把行李拿回來。",
      "還沒給海關確認就用宅配寄走的東西，不能退稅。",
      "已經用掉、或沒帶在身上的東西，辦手續前先告訴海關人員。",
      "排隊可能要一段時間，請提早到機場。自己趕時間中途放棄，算沒辦完。",
      "先搭日本國內線再轉國際線：免稅品不要直掛，到國際線出境的機場再辦。",
      "10 月 31 日以前買的照舊制，在店裡就直接免稅。",
      "退款方式和手續費各店不同，以店家的說明為準。",
    ],
    sources: [
      // Steps and notes: the official zh-TW leaflet 「外國人旅客免稅（退稅）手續指南」 by the Japan Tourism
      // Agency, National Tax Agency and Japan Customs (shared by the owner, 2026-10-11), and the JTA page:
      // refund model from purchases on 2026-11-01, passport at a kiosk within 90 days.
      "https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00021.html",
      // Japan Customs: co-issuer of the leaflet; confirms goods at departure.
      "https://www.customs.go.jp/",
      // Chubu Centrair: once baggage is checked in, the procedure is no longer possible.
      "https://www.centrair.jp/taxrefund/",
    ],
    verified: "2026-10-11",
    // Written before the new system starts on 2026-11-01: confirm it once it is running
    // (kiosks, what the airports actually ask for), and correct the guide.
    recheckBy: "2026-11-15",
  },
  {
    id: "shinkansen-luggage",
    title: "新幹線大型行李",
    summary: "東海道、山陽、九州新幹線：三邊加起來超過 160 公分的行李要先訂位。",
    steps: [
      {
        title: "量行李",
        body: "長、寬、高加起來。160 公分以下放座位上方的架子就好；160～250 公分算特大行李；超過 250 公分不能帶上車。",
      },
      {
        title: "買票時一起訂位",
        body: "訂指定席時選「特大行李放置處座位」（特大荷物スペースつき座席），行李放在座位後方。不另外收費。",
      },
      {
        title: "沒訂到這種座位",
        body: "部分車廂連接處有「特大荷物コーナー」。2025 年 7 月起試辦免預約，先到先用。",
      },
      {
        title: "沒預約就帶上車",
        body: "要付 1,000 日圓手續費，並照車掌的指示放行李。",
      },
    ],
    notes: [
      "這個規定只適用東海道、山陽、九州、西九州新幹線。其他新幹線的規定不同，問站務員。",
      "不想自己扛，可以用宅配把行李寄到下一間飯店：見「行李」情境。",
    ],
    sources: [
      // JR Central: 160–250 cm needs a seat with oversized baggage space, reserved in advance at no extra
      // charge; ¥1,000 fee without one; deck corners reservation-free on trial since 2025-07-01.
      "https://railway.jr-central.co.jp/oversized-baggage/",
      // JR West (JR Odekake): the same rule for the Sanyo Shinkansen.
      "https://www.jr-odekake.net/railroad/service/baggage/",
    ],
    verified: "2026-10-11",
  },
  {
    id: "medical-claim",
    title: "看病與保險理賠",
    summary: "在日本看病是自費。當場拿齊文件，回台灣才申請得到保險和健保。",
    steps: [
      {
        title: "先打保險公司的急難救助電話",
        body: "電話印在保單或保險卡上。問他們該去哪家醫院、能不能由保險公司直接付款。",
      },
      {
        title: "帶護照和醫療卡去看病",
        body: "醫療卡在這個 App 的「醫療卡」頁，給醫生看。很多診所要先打電話確認能不能看。",
      },
      {
        title: "付錢時拿齊文件",
        body: "診斷書（最好是英文）、收據正本、費用明細。診斷書可能要另外付費，也可能要等幾天才拿得到。",
      },
      {
        title: "回台灣後申請",
        body: "照保險公司的要求寄文件。健保的「自墊醫療費用核退」也可以申請，期限是看診或出院後 6 個月內。",
      },
    ],
    notes: [
      "健保核退要附：申請書、收據正本和明細、診斷書（外文要附中文翻譯）、這次出入境的證明。",
      "走自動通關的話，出入境證明可能要另外申請，出發前先問清楚。",
      "健保核退只限緊急傷病，金額有上限，通常不會全額退。旅遊保險要另外買。",
      "藥局買藥也要留收據。",
    ],
    sources: [
      // Ministry of Health and Welfare / NHIA: overseas emergency self-paid reimbursement, 6 months, documents
      // (application, original receipts and itemised bill, certificate with Chinese translation, entry/exit proof).
      "https://www.mohw.gov.tw/cp-16-73066-1.html",
      "https://www.nhi.gov.tw/",
    ],
    verified: "2026-10-11",
  },
];

export function guideById(id: string | undefined): Guide | undefined {
  return GUIDES.find((guide) => guide.id === id);
}
