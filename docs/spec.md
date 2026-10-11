# 隨身旅伴 TravelBuddy — 產品規格

> 給不會當地語言的台灣旅客，出國時帶在手機裡的小幫手。現在提供日本版。
> 不用學日文、也不用開口：App 替你**念出來**，或把日文**放大給對方看**，對方也可以**點答案**回你。
>
> 這是給所有人用的服務：UI 與文件都不使用針對特定年齡層或族群的稱呼。大字、大按鈕、不打字，是為了讓任何人在慌亂時都能用。

狀態：日本版已上線。改了什麼見 [changelog.md](changelog.md)；之後的方向見 [roadmap.md](roadmap.md)。

---

## 1. 使用者與核心流程

| 角色 | 什麼時候用 | 做什麼 |
|---|---|---|
| **設定者**（旅客本人，或幫忙的家人朋友） | 出發前，在自己的手機或電腦 | 填資料後直接使用；或產生連結／QR code 傳給旅客 |
| **旅客（使用者）** | 在當地，遇到狀況時 | 打開 → 點一個大按鈕 → 把手機拿給對方看或按播放 |
| **當地人（對方）** | 被旅客拿手機問的時候 | 看日文卡片；在「給對方點選」模式下用手指點答案 |

```
設定者：#/setup 填資料 ──► #/share 產生連結＋QR ──(LINE/當面)──► 旅客手機開啟 #/s/<資料>
                                                                │
                                                     匯入 localStorage，網址改成 #/imported
                                                                ▼
旅客：首頁 ──► 「我需要幫忙」／情境大按鈕 ──► 一句話 ──► 播放 or 給對方看 or 給對方點選
```

設計底線：

- **使用端零設定**：沒有登入、沒有選單樹、沒有搜尋。字體大小與深色模式放在首頁最下方的小連結。
- **沒有填資料也能用**：所有情境句都能用；需要站名或飯店的句子改用「這裡」「這間飯店」，並提示「把地址拿給對方看」。
- **只有設定頁要打字**：表單只出現在 `#/setup`，使用中的畫面完全不需要輸入。

---

## 2. 功能

### 2.1 設定與分享（`#/setup`、`#/share`、`#/s/…`）

**表單**：6 段可收合卡片，標題列顯示摘要；全部選填，自動儲存。

| 區塊 | 欄位 | 用在哪裡 |
|---|---|---|
| 旅客 | 稱呼、護照英文姓名、出生年 | 首頁問候（「媽媽，旅途平安」）、求救卡、醫療卡 |
| 飯店（可多筆） | 日文名稱、讀音、地址、電話、入住日～退房日 | 依今天日期自動選「目前的飯店」；不在日期內就用第一筆 |
| 每天的行程（可多筆） | 類型（車站／地點）、日文名稱、讀音、中文名稱、日期、電梯筆記 | 交通句子的站名插槽；首頁「今天要去」 |
| 聯絡人 | 家人（關係、姓名、電話，可多筆，第一筆為主要）、日本當地聯絡人 | 求救卡、一鍵撥號 |
| 健康 | 慢性病（勾選＋自填）、常用藥（成分名＋劑量）、血型 | 醫療卡 |
| 過敏・飲食・保險 | 藥物過敏、食物過敏（日本「特定原材料」等）、飲食習慣（全素、蛋奶素、五辛素、不吃海鮮…）、旅遊保險 | 過敏卡、醫療卡 |

**分享**：

- 資料編碼在網址 `#` 後面（`#/s/1.<payload>`），**不送到任何伺服器**（見 §6）。
- 分享頁有：分享／複製連結、QR code、列印護貝小卡，以及不能收合的隱私提醒：「這個連結裡有飯店地址、電話和健康資料。只傳給本人，不要貼到群組或社群。」

**旅客打開連結**：

1. 解碼、驗證。失敗 → 「這個連結好像不完整，請重新傳一次」。
2. 本機已有不同的資料 → 「要換成新的資料嗎？」（換新的／保留原本的）。
3. 存進 localStorage，網址改成 `#/imported`（地址列、書籤不留資料）。
4. 顯示「設定完成」：之後直接打開網站就好，不用再點連結。

### 2.2 我需要幫忙（`#/help`）

- 首頁最上方的紅色大按鈕。
- 求救卡依資料自動組合，每段日文大字、下方小字中文給旅客自己看：
  - 我不會說日文，從台灣來（附護照英文姓名）。
  - 我迷路了，請幫忙。
  - 我想回這間飯店（飯店名稱、地址、電話）。
  - 請幫我打給家人（關係、姓名、電話，以及從日本撥打的方式）。
- 播放、慢速、放大給對方看。
- 「找警察（交番）」：派出所的說明與「附近的派出所在哪裡？」卡片。
- 緊急電話：日本觀光局訪日旅客熱線、駐日代表處等，每個號碼附中文說明；更多電話收在「各地辦事處」。
- 底部固定撥號列：家人（國際電話）、110、119。

### 2.3 情境句庫（`#/scene/<id>`）

情境依重要性排在首頁：

| id | 名稱 | 分組 |
|---|---|---|
| `transport` | 交通 | 問路・去哪裡／電梯・不走樓梯／月台・搭車／車票・閘門・坐過站／公車・計程車／東西掉了 |
| `hotel` | 飯店 | — |
| `luggage` | 行李 | 寄放・置物櫃／宅配寄送／新幹線大行李 |
| `restaurant` | 餐廳 | 過敏・素食・口味／進門・等位子／點餐／結帳 |
| `konbini` | 便利商店 | — |
| `shopping` | 購物 | 挑選／結帳・包裝・退換／免稅・退稅 |
| `drugstore` | 藥妝店 | — |
| `toilet` | 廁所・問路 | — |
| `family` | 帶小孩 | 走失・生病／外出・電車／吃飯／尿布・哺乳・廁所 |
| `emergency` | 緊急・醫療 | 身體不舒服・看醫生／東西掉了・被偷・找警察／跟同伴走散了／地震・颱風・停電 |

- 情境頁上方兩個分頁：「我要說」｜「對方說」。
- 句子清單顯示中文＋日文預覽；點一句開全螢幕單句詳情：中文、日文（振假名＋拼音）、提示、播放、慢速、給對方看、給對方點選答案（有答案時）、相關連結。
- **站名插槽**：交通句子裡的 `$dest`／`$stop` 換成預先填好的站名。情境頁上方有一排目的地按鈕（今天的排前面），點一個就把句子換成那一站；選到的車站有電梯筆記時，會顯示在下方並可以放大給站務員看。沒有資料時改用 `fallback`（「這裡」）。

### 2.4 雙向溝通

**我問 → 對方點答案**（句子有 `answers`）：

```
┌──────────────────────────────┐
│ この電車は新宿に止まりますか。  │  ← 日文問題（大字）
│ 下の答えを指でタッチしてください │  ← 給對方的說明
├──────────────────────────────┤
│  [ はい ]      [ いいえ ]       │  ← 日文選項
│  [ わかりません ]               │
└──────────────────────────────┘
          ↓ 對方點「いいえ」
┌──────────────────────────────┐
│        不是／不對               │  ← 給自己看的中文，超大字
│   [ 知道了 ]   [ 再問一次 ]     │
└──────────────────────────────┘
```

預設答案組：`yesNo`、`platform`、`direction`、`time`、`place`、`exit`（見 [content-guide.md](content-guide.md#答案給對方點選)）。

**對方說 → 我看懂並回答**：每則顯示中文（最大字）、日文與播放，下方 2～4 個中文回答按鈕；點了就念出日文並放大顯示。

**萬用句**：每個情境頁底部常駐，點開是全螢幕清單：不好意思、我不會說日文、請用是或不是回答、請寫在紙上、請說慢一點、請再說一次、請指給我看、請等一下、謝謝。

### 2.5 醫療卡和過敏卡（`#/medical`）

- **症狀指指卡**：勾選症狀（像醫院掛號單），產生「我有以下症狀：…」給醫生看。
- **過敏卡**（給餐廳看）：食物過敏與飲食習慣。台灣的素食分類在日本沒有通用說法，所以卡片直接列出不能吃的食材，並寫出魚高湯和肉萃取物。
- **醫療卡**（給醫生、救護人員看）：姓名、出生年與年齡、國籍、慢性病、常用藥、藥物過敏、血型、家人電話、旅遊保險。
- 常用句：叫救護車、帶我去醫院、我有旅遊保險、請給我診斷書和收據、可以開英文診斷書嗎。

### 2.6 回飯店卡（`#/hotel`、`#/hotel/<n>`）

給計程車司機或路人看的卡片：「請載我到這間飯店」＋名稱、地址、電話。可以播放、放大，也可以直接打電話給飯店；有多間飯店時可以切換。

### 2.7 旅遊小抄（`#/guide/<id>`）與推薦工具（`#/tools`）

- **旅遊小抄**：一步一步的手續說明，每篇都有編號步驟、注意事項、來源與查證日期。目前有：出境退稅新制、新幹線大型行李、看病與保險理賠。
- **推薦的免費工具**：已經把那件事做好的 App（警報、翻譯、地圖、叫車、交通卡、入境手續），附用途、注意事項與下載連結。我們不重做這些功能。

### 2.8 列印小卡（`#/print`）

一張 A4 印出信用卡大小（85.6 × 54 mm）的卡片，含剪裁線，適合護貝放皮夾：求救卡、飯店卡（每間一張）、醫療卡、過敏卡（有填才印）、緊急電話卡。列印時一律淺色、黑字。

---

## 3. 好讀好按的介面規則

視覺細節見 [design.md](design.md)。

| 規則 | 實作 |
|---|---|
| 預設大字 | 字體兩檔：**大**（root 125%，預設）與**特大**（150%）。全部尺寸用 rem。 |
| 按鈕大 | 主要按鈕高 ≥ 4rem，次要 ≥ 3.5rem。 |
| 選單一層 | 首頁＝情境大按鈕；進一層就是句子。全螢幕卡片是覆蓋層，按「關閉」或返回鍵回到原頁。 |
| 不打字不搜尋 | 使用中的頁面沒有輸入框（只有設定頁有）；站名用按鈕選。 |
| 圖示＋文字 | 線條 SVG 圖示一定搭配文字，不用 emoji。 |
| 對比 | 淺色與深色兩套 token，所有文字／底色組合 ≥ 4.5:1（WCAG AA），有測試檢查。 |
| 深色模式 | 跟手機／淺色／深色；`index.html` 內聯腳本先套用，避免閃白。 |
| 橫拿 | 全螢幕卡片字級依 `min(vw, vh)` 計算，橫拿時放大、不被裁切。 |
| 動畫 | 遵守 `prefers-reduced-motion`。 |
| 返回 | 每頁左上「回首頁」。 |
| 輔助科技 | 覆蓋層打開時，後面的頁面設為 `inert` 與 `aria-hidden`，只有最上層能操作。 |

---

## 4. 頁面與路由

路由都在 `#` 之後（`src/main.ts` 的 `PAGES` 表），網站放在任何子路徑都能運作。

| 路由 | 頁面 | 誰用 |
|---|---|---|
| `#/` | 首頁 | 旅客 |
| `#/help` | 我需要幫忙 | 旅客 |
| `#/scene/<id>` | 情境：我要說 | 旅客 |
| `#/scene/<id>/heard` | 情境：對方說 | 旅客 |
| `#/medical` | 醫療卡、過敏卡、症狀指指卡 | 旅客 |
| `#/hotel`、`#/hotel/<n>` | 回飯店卡 | 旅客 |
| `#/guide/<id>` | 旅遊小抄 | 旅客 |
| `#/tools` | 推薦的免費工具 | 旅客 |
| `#/settings` | 字體大小、顏色、語音、聽不到聲音怎麼辦 | 旅客 |
| `#/setup` | 設定表單 | 設定者 |
| `#/share` | 分享連結、QR code、隱私提醒 | 設定者 |
| `#/print` | 列印小卡 | 設定者 |
| `#/s/<version>.<payload>` | 匯入（處理完換成 `#/imported`） | 旅客 |

全螢幕卡片（單句詳情、給對方看、給對方點選、萬用句）是覆蓋層而不是路由。每層開啟時 `pushState` 一筆帶有唯一 token 的 history，返回鍵只關最上層；焦點鎖在最上層，Esc 也能關閉。

網址依國家區分（`…/japan/`），見 [development.md](development.md#網址與國家)。

---

## 5. 資料結構

### 5.1 日文標記

- 詞與詞之間一個半形空格；漢字寫成 `{漢字|かな}`；助詞「は」「を」獨立成詞。
- **插槽**：以 `$` 開頭的整個詞，`$dest`、`$stop`、`$hotel`，展開時換成使用者資料。
- 使用者填的日文（站名、飯店名、地址）：讀音有填就變成 `{新宿|しんじゅく}`，沒填就原樣顯示，語音直接念原文。

撰寫規則見 [content-guide.md](content-guide.md)。

### 5.2 內容（`src/content/`）

```ts
type Jp = string;                         // 日文標記，可含 $slot
type Slot = "dest" | "stop" | "hotel";
type ReplySet = "yesNo" | "platform" | "direction" | "time" | "place" | "exit";

interface Reply { jp: Jp; zh: string }    // zh：旅客看到的中文

/** Something the traveller needs to say. */
interface Phrase {
  id: string;                             // 情境 id 開頭，全域唯一
  zh: string;
  jp: Jp;
  fallback?: Jp;                          // 有插槽但沒有資料時
  fallbackZh?: string;
  tip?: string;
  answers?: ReplySet | Reply[];           // 有才會出現「給對方點選答案」
  link?: { href: string; label: string };
  group?: string;                         // 情境有分組時必填
}

/** Something staff commonly say to the traveller. */
interface Heard { id: string; jp: Jp; zh: string; replies: Reply[] }

interface Scene {
  id: SceneId;
  title: string;
  icon: IconName;                         // src/ui/dom.ts 的線條圖示
  groups?: { id: string; title: string }[];
  phrases: Phrase[];
  heard: Heard[];
}

/** Checkboxes in the form; the Japanese is pre-written and checked. */
interface Preset { id: string; zh: string; jp: Jp }   // 慢性病、過敏、飲食、症狀

interface Guide {                         // 旅遊小抄
  id: string; title: string; summary: string;
  steps: { title: string; body: string }[];
  notes: string[];
  sources: string[];                      // https
  verified: string;                       // YYYY-MM-DD
}

interface Tool {                          // 推薦工具
  id: string; name: string; use: string; note?: string;
  links: { label: "App Store" | "Google Play" | "官方網站"; url: string }[];
}
```

### 5.3 旅客資料（Profile）

```ts
interface Profile {
  callName: string;            // 首頁怎麼稱呼旅客，例如 媽媽、小美
  passportName: string;        // 護照英文姓名
  birthYear: number | null;
  hotels: Hotel[];
  places: Place[];
  contacts: Contact[];         // 第一筆是主要聯絡人，通常是台灣的家人
  localContact: Contact;       // 日本當地的朋友、親戚或導遊
  health: Health;
  insurance: { company: string; policy: string; phone: string };
}

interface Hotel { name: string; kana: string; address: string; phone: string; from: string; to: string }

interface Place {
  kind: "station" | "place";
  name: string;                // 日文；車站不含「駅」
  kana: string;
  zh: string;
  date: string;                // YYYY-MM-DD 或空白
  note: string;                // 電梯筆記
}

interface Contact { relation: string; name: string; phone: string }

interface Health {
  conditions: string[];        // preset ids
  conditionsOther: string;
  meds: { ingredient: string; dose: string }[];
  drugAllergies: string[];
  foodAllergies: string[];
  diets: string[];
  allergyOther: string;
  bloodType: "" | "A" | "B" | "O" | "AB";
}
```

所有欄位都有長度上限（名稱 80 字、地址 200 字、陣列 20 筆）。`parseProfile(unknown)` 逐欄驗證，壞掉的欄位個別退回預設值。畫面一律用 `textContent` 輸出，不會有 HTML 注入。

### 5.4 本機儲存

| key | 內容 |
|---|---|
| `travelbuddy.japan.profile` | Profile（版本 1） |
| `travelbuddy.japan.settings` | 字體大小、顏色、語音 |

每個國家版本用自己的前綴（見 [development.md](development.md#本機儲存)）。

---

## 6. 分享連結

```
https://sean1093.github.io/travel-buddy/japan/#/s/1.<payload>
                                                  │ └─ base64url( deflate-raw( UTF-8( JSON( wire ) ) ) )
                                                  └─── 格式版本
```

- **wire 格式**：Profile 轉成短鍵名的 JSON，空欄位整個省略。對照表在 `src/share/codec.ts`（例：電梯筆記是 `e`），有往返測試。
- **壓縮**：`fflate`。不用 `CompressionStream`，因為舊的 iOS 沒有。
- **base64url**：在 LINE、簡訊裡不會被截斷或轉義。
- **大小**：一般資料約 1,000 字元；超過 1,500 字元時，分享頁提示 QR code 會比較密。
- **版本**：`1.` 之後只增不改；改格式就用 `2.`，舊連結照樣能解。
- **安全**：解碼後一律走 `parseProfile`。`#` 之後的內容不會傳到伺服器，但會留在聊天紀錄和瀏覽器歷史，所以分享頁要提醒；匯入後立刻把網址換掉。

**已知風險**：Safari 對 7 天沒開的網站可能清掉 localStorage。對策是分享頁提醒「出發前一兩天再傳，出發當天打開一次」，以及紙本小卡。

---

## 7. 語音

- 用瀏覽器內建的 Web Speech API，不需要網路。挑音質好的語音（Premium、Enhanced、Google），避開機械音。
- 預設語速 0.9；「慢速」0.6。
- 沒有日文語音時，首頁頂端出現提示「這支手機還不會念日文 → 怎麼安裝」。「給對方看」不受影響。
- 站名沒有填讀音時，語音直接念漢字原文；表單提示填讀音可以避免念錯。

---

## 8. 技術

- 純前端靜態網站：Vite、TypeScript（strict）、Tailwind CSS 3；執行期相依只有 `fflate`、`qrcode-generator`。
- PWA：可加到主畫面；service worker 讓整個 App 離線可用。
- 部署在 GitHub Pages。
- 專案結構、測試、部署見 [development.md](development.md)；內容規則見 [content-guide.md](content-guide.md)。

---

## 9. 決定紀錄

| 項目 | 決定 |
|---|---|
| 名稱 | 隨身旅伴 TravelBuddy，國家放在名稱後面（隨身旅伴・日本），為之後加入其他國家做準備 |
| 網址 | `sean1093.github.io/travel-buddy/`，依國家區分，日本版在 `/japan/`；根目錄轉址並保留 `#` |
| 儲存鍵 | 每個國家自己的前綴，日本版 `travelbuddy.japan.` |
| 用詞 | 給所有人用的服務，不使用針對特定年齡層的稱呼 |
| 語言 | UI 用華語（台灣用語），不做台語；程式、issue、PR 用英文 |
| 視覺 | 設計方向 C「和紙・柔和」（從四個設計稿選出），不用 emoji |
| 定位 | 不做萬用工具箱；翻譯、地圖、叫車、警報交給專門的 App，改用「推薦的免費工具」介紹 |
| 站內電梯地圖 | 不做（資料分散、會過期、不好讀、Google 地圖已有輪椅路線）；改做電梯問句與電梯筆記 |
| 「請寫在這裡」手寫板 | 不做，請對方寫在紙上 |
| iOS 主畫面 App 與 Safari 不共用儲存 | 先不處理 |
| 出生年 | 放進醫療卡與分享連結 |
| 使用量追蹤 | 不加，資料只在使用者手機裡 |
