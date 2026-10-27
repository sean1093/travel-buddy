/**
 * Free tools that already do a job well, so this app points to them instead
 * of rebuilding them. Links were checked against search results for the
 * store listings and the publishers' own pages (@checked 2026-10-11); only
 * addresses that could be confirmed are listed (sources below). Where a store address could
 * not be confirmed, the publisher's page links to both stores.
 */
export interface Tool {
  id: string;
  name: string;
  /** What it is for, in one line. */
  use: string;
  /** Anything to know before relying on it. */
  note?: string;
  links: ToolLink[];
}

export interface ToolLink {
  label: "App Store" | "Google Play" | "官方網站";
  url: string;
}

const appStore = (id: string): ToolLink => ({ label: "App Store", url: `https://apps.apple.com/app/id${id}` });
const googlePlay = (pkg: string): ToolLink => ({ label: "Google Play", url: `https://play.google.com/store/apps/details?id=${pkg}` });
const site = (url: string): ToolLink => ({ label: "官方網站", url });

export const TOOLS: Tool[] = [
  {
    id: "safety-tips",
    name: "Safety tips",
    use: "地震、海嘯、颱風、中暑警報會推播通知，有繁體中文。日本觀光廳監修。",
    // https://www.city.nagoya.jp/bousaiportal/international/1037420.html (15 languages incl. Traditional Chinese)
    links: [appStore("858357174"), site("https://www.rcsc.co.jp/safety-tips-en")],
  },
  {
    id: "google-translate",
    name: "Google 翻譯",
    use: "用相機拍菜單、招牌、藥品說明，直接看中文。",
    note: "先下載日文離線翻譯，沒網路也能用。",
    links: [appStore("414706506"), googlePlay("com.google.android.apps.translate")],
  },
  {
    id: "google-maps",
    name: "Google 地圖",
    use: "查路線、轉乘和走路時間。",
    note: "大車站裡的出口和電梯不一定準，到站後問站務員比較快。",
    links: [appStore("585027354"), googlePlay("com.google.android.apps.maps")],
  },
  {
    id: "go-taxi",
    name: "GO（計程車）",
    use: "在日本叫計程車，2026 年 3 月起有繁體中文。",
    note: "建議出發前先下載、註冊好。",
    // https://www.travelvoice.jp/english/japan-s-taxi-app-go-opens-a-mini-program-in-china-s-no-1-communication-app-wechat-in-partnership-with-e-ticket-platform-linktivity
    links: [appStore("1254341709"), site("https://go.goinc.jp/lp/inbound")],
  },
  {
    id: "welcome-suica",
    name: "Welcome Suica Mobile",
    use: "iPhone 用的交通卡，不用押金，可以搭車和在便利商店付款。",
    note: "只有 iPhone 能用，效期 180 天。",
    // https://www.businesswire.com/news/home/20250310510899/en (launched 2025-03-06)
    links: [appStore("6738336566")],
  },
  {
    id: "visit-japan-web",
    name: "Visit Japan Web",
    use: "入境審查和海關申報的 QR code。部分機場也能用來辦出境退稅。",
    note: "出發前在台灣先填好。",
    links: [site("https://www.digital.go.jp/en/services/visit_japan_web-en")],
  },
];
