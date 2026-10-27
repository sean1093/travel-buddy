/**
 * Phone numbers for emergencies in Japan. Every entry names its source and
 * the date it was checked; tests/content.test.ts refuses an entry without
 * them. Only numbers with an official source are listed.
 *
 * Checked 2026-10-08. The official sites were not reachable from the build
 * environment, so the numbers were read from search results quoting these
 * official pages (and cross-checked between two searches for TECRO Tokyo
 * and the JNTO hotline). Re-check before each release season.
 */
export interface EmergencyNumber {
  id: string;
  /** As dialled from a phone in Japan. */
  number: string;
  /** Who answers, in Chinese. */
  title: string;
  /** When to call, in Chinese. */
  when: string;
  source: string;
  verified: string;
  /** A known date the facts change on; see `Checked.recheckBy` in validate.ts. */
  recheckBy?: string;
}

export const EMERGENCY_NUMBERS: EmergencyNumber[] = [
  {
    id: "police",
    number: "110",
    title: "警察",
    when: "被偷、被搶、車禍、有危險。免費，手機也能打。",
    // JNTO Japan Visitor Hotline page lists 110 / 119; Tokyo Metropolitan Police: an interpreter joins if you cannot speak Japanese.
    source: "https://www.japan.travel/en/plan/hotline/ ; https://www.keishicho.metro.tokyo.lg.jp/multilingual/english/finding_services/living_guide/living_guide_e_1.html",
    verified: "2026-10-08",
  },
  {
    id: "ambulance",
    number: "119",
    title: "救護車・火災",
    when: "急病、受重傷、火災。免費，手機也能打。多數地區有電話口譯。",
    // FDMA: three-way interpretation in major languages, 24h, at 673 of 720 fire headquarters (2025-01-01).
    source: "https://www.fdma.go.jp/mission/enrichment/gaikokujin_syougaisya_torikumi/sanshakan-douji-tsuuyaku.html",
    verified: "2026-10-08",
  },
  {
    id: "jnto-hotline",
    number: "050-3816-2787",
    title: "日本觀光局 訪日旅客熱線",
    when: "24 小時、全年無休，可以說中文。生病、受傷、天災、旅遊問題都可以問。",
    source: "https://www.japan.travel/en/plan/hotline/ ; https://www.jnto.go.jp/emergency/chs/japan_visitor_hotline.html",
    verified: "2026-10-08",
  },
  {
    id: "tecro-tokyo",
    number: "080-1009-7179",
    title: "台北駐日經濟文化代表處 急難救助（東京）",
    when: "限中華民國國民。被逮捕、遭遇重大犯罪、緊急就醫等危及生命安全時。一般問題請勿撥打。另一支：080-1009-7436。",
    source: "https://www.roc-taiwan.org/jp/post/26.html ; https://www.boca.gov.tw/sp-foof-countrycp-03-29-77969-03-1.html",
    verified: "2026-10-08",
  },
  {
    id: "tecro-osaka",
    number: "090-8794-4568",
    title: "台北駐大阪經濟文化辦事處 急難救助",
    when: "限中華民國國民，危及生命安全的緊急狀況。",
    source: "https://www.roc-taiwan.org/jposa/post/13.html",
    verified: "2026-10-08",
  },
  {
    id: "tecro-yokohama",
    number: "090-3211-7576",
    title: "橫濱分處 急難救助（神奈川、靜岡）",
    when: "限中華民國國民，危及生命安全的緊急狀況。",
    source: "https://www.roc-taiwan.org/jpyok/index.html",
    verified: "2026-10-08",
  },
  {
    id: "tecro-fukuoka",
    number: "090-1922-9740",
    title: "福岡分處 急難救助",
    when: "限中華民國國民，危及生命安全的緊急狀況。",
    source: "https://www.roc-taiwan.org/jpfuk/index.html",
    verified: "2026-10-08",
  },
  {
    id: "tecro-sapporo",
    number: "080-1460-2568",
    title: "札幌分處 急難救助",
    when: "限中華民國國民，危及生命安全的緊急狀況。",
    source: "https://www.roc-taiwan.org/jpokd/index.html",
    verified: "2026-10-08",
  },
  {
    id: "tecro-naha",
    number: "080-8056-0122",
    title: "那霸分處 急難救助",
    when: "限中華民國國民，危及生命安全的緊急狀況。",
    source: "https://www.roc-taiwan.org/jpna/post/20.html",
    verified: "2026-10-08",
  },
  {
    id: "mofa-taiwan",
    number: "+886-800-085-095",
    title: "外交部緊急聯絡中心（台灣）",
    when: "24 小時。用台灣門號國際漫遊撥打會收漫遊費。在台灣的家人可以撥 0800-085-095 幫忙求助。",
    source: "https://www.boca.gov.tw/np-53-1.html",
    verified: "2026-10-08",
  },
];

/** `tel:` form of a listed number. */
export function telOf(number: string): string {
  return number.replace(/[^\d+]/g, "");
}
