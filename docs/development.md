# 開發與部署

## 環境

- Node.js 20.19+ 或 22.12+（CI 用 24）。
- 執行期相依只有 `fflate`（分享連結壓縮）和 `qrcode-generator`（QR code）。沒有框架，DOM 用 `src/ui/dom.ts` 的 `h()`。
- Vite + TypeScript（strict）+ Tailwind CSS 3 + Vitest。

```bash
npm install
npm run dev      # 本機開發（http://localhost:5173）
npm test         # 內容檢查與單元測試
npm run build    # 型別檢查 → 建置日本版到 dist/japan/ → 複製根目錄轉址頁到 dist/index.html
npm run preview  # 預覽建置結果（伺服器根目錄就是日本版）
```

## 專案結構

```
src/
  main.ts                路由表（PAGES）、註冊 service worker
  state.ts               設定（字體、顏色、語音），套用到 <html>
  style.css              設計 token（淺色／深色）、列印用 CSS
  lib/
    jp.ts                日文標記 {漢字|かな} 的解析、插槽 $dest/$stop/$hotel
    romaji.ts            拼音
    speech.ts            Web Speech API：挑語音、念句子、偵測沒有日文語音
    store.ts             localStorage 存取（前綴 travelbuddy.japan.）
    phone.ts             電話正規化（台灣 +886、從日本撥 010-886、日本國內）
  profile/
    profile.ts           Profile 型別、parseProfile、目前飯店、今天的行程
    cards.ts             求救卡、回飯店卡、醫療卡、過敏卡的內容
    fill.ts              把插槽換成站名或飯店名，沒資料時用 fallback
    summary.ts           設定頁每一段的摘要
  share/
    codec.ts             Profile ⇄ 短鍵名 JSON ⇄ 壓縮 ⇄ 網址
    qr.ts                QR code SVG
  content/               所有文字內容（見 content-guide.md）
    types.ts             Phrase、Heard、Scene、Preset 等型別
    scenes/*.ts          每個情境一個檔；index.ts 決定首頁順序
    replies.ts           預設答案組（是否、月台、方向、時間、地點、出口）
    rescue.ts            萬用句
    medical.ts           慢性病、藥物過敏、食物過敏、飲食習慣、症狀
    emergency.ts         緊急電話（附來源與查證日期）
    guides.ts            旅遊小抄（附來源與查證日期）
    tools.ts             推薦的免費工具與連結
    validate.ts          內容檢查規則（npm test 會跑）
  ui/
    dom.ts               h()、fill()、線條圖示 ICONS、pictogram()、按鈕樣式
    layout.ts            page()、heading()、section()、底部固定列 dock()
    overlay.ts           全螢幕覆蓋層：給對方看、給對方點選
    japanese.ts          日文顯示（振假名＋拼音）、播放／慢速按鈕
    lines.ts             卡片上的額外行（電話號碼不斷行）
    home.ts help.ts hotel.ts scene.ts medical.ts guide.ts
    settings.ts setup.ts share.ts import.ts print.ts voice-help.ts
public/
  sw.js                  離線快取（頁面網路優先、資源快取優先）
  manifest.webmanifest   PWA 設定
  favicon.svg icon-*.png apple-touch-icon.png
site/
  index.html             網站根目錄的轉址頁（之後改成選擇國家）
tests/                   單元測試與內容測試
scripts/
  screenshots.cjs        手機尺寸截圖
  sample-profile.json    截圖用的範例資料
docs/                    文件（見 docs/README.md）
.github/workflows/
  ci.yml                 PR 與非 main 分支：測試＋建置
  pages.yml              push 到 main：測試＋建置＋部署 GitHub Pages
```

## 路由

路由都在網址的 `#` 後面，資源用相對路徑（`vite.config.ts` 的 `base: "./"`），所以網站放在任何子路徑都能運作。路由表在 `src/main.ts`，各頁說明見 [spec.md §4](spec.md#4-頁面與路由)。

## 測試

`npm test` 會跑：

| 測試檔 | 檢查什麼 |
|---|---|
| `content.test.ts` | 所有內容規則（見 [content-guide.md §8](content-guide.md#8-npm-test-會擋下什麼)），以及推薦工具都有 https 連結 |
| `contrast.test.ts` | 讀 `src/style.css` 的設計 token，所有文字／底色組合在淺色、深色都 ≥ 4.5:1（WCAG AA） |
| `codec.test.ts` | 分享連結往返相等；壞掉、截斷、超長的資料不會出錯；一般資料的大小預算 |
| `profile.test.ts` | parseProfile、目前飯店、今天的行程 |
| `cards.test.ts` | 求救卡、醫療卡、過敏卡、回飯店卡的內容 |
| `jp.test.ts` `romaji.test.ts` | 標記解析、插槽、拼音 |
| `phone.test.ts` | 電話正規化 |
| `home.test.ts` `summary.test.ts` | 首頁問候、設定頁摘要 |
| `site.test.ts` | 根目錄轉址頁會帶著 `#` 轉到 `./japan/` |

## 截圖

`docs/screenshots/` 是 390×844 的手機截圖（另有橫拿、深色、特大字）。改了畫面就重新產生，並實際看過每一張：

```bash
npm run build
npx vite preview --port 4173 &
CHROMIUM=/path/to/chrome NODE_PATH=$(npm root -g) node scripts/screenshots.cjs scripts/sample-profile.json docs/screenshots
```

在 Claude Code 雲端環境裡，Chromium 在 `/opt/pw-browsers/chromium`。腳本也會檢查頁面錯誤和手機寬度下的橫向捲動；要新增截圖，在 `scripts/screenshots.cjs` 的 `SHOTS` 加一筆。

## 部署

推到 `main` 時，`pages.yml` 會測試、建置，然後部署 `dist/` 到 GitHub Pages。第一次需要在 repo 的 **Settings → Pages → Source** 選 **GitHub Actions**，並確認 **Settings → Environments → github-pages** 允許 `main` 部署。

### 網址與國家

```
https://sean1093.github.io/travel-buddy/            根目錄：site/index.html，帶著 # 轉到 ./japan/
https://sean1093.github.io/travel-buddy/japan/      日本版（dist/japan/）
https://sean1093.github.io/travel-buddy/japan/#/s/1.<資料>   分享連結
```

- 根目錄的轉址頁會保留 `#` 後面的內容，所以指向根目錄的分享連結也能匯入資料。
- 之後有第二個國家時，根目錄改成選擇國家的頁面（見 [roadmap.md](roadmap.md)）。

### 本機儲存

| key | 內容 |
|---|---|
| `travelbuddy.japan.profile` | 旅客資料（Profile，版本 1） |
| `travelbuddy.japan.settings` | 字體大小、顏色、語音 |

所有國家版本都在同一個網域（`sean1093.github.io`），所以每個版本用自己的前綴（`src/lib/store.ts` 的 `STORE_PREFIX`）。`index.html` 會在畫面出現前直接讀設定的 key，改前綴時兩邊要一起改。

離線快取名稱是 `travel-buddy-v1`（`public/sw.js`）；啟用時只清掉這個 App 自己的舊快取（`travel-buddy-` 開頭），同網域的其他專案不受影響。

### repo 改名

以後若要改 repo 名稱：

1. GitHub → Settings → General → Repository name。
2. 本機更新遠端網址：`git remote set-url origin <新網址>`。
3. 重新部署一次：推一個 commit 到 `main`，或在 Actions → pages 按 **Run workflow**。確認新網址能打開。
4. GitHub Pages 不會自動轉址，舊網址和舊的分享連結會失效。

## 工作流程

所有修改都走同一個流程，issue、PR、commit 訊息一律英文：

1. **開 issue：** 說明為什麼、範圍、驗收條件。
2. **開發：** 在工作分支上改；內容有事實就查證並附來源。
3. **自我檢查：** `npm test`、`npm run build`、重新產生並看過截圖。
4. **開 PR：** 寫清楚改了什麼、怎麼驗證，`Closes #<issue>`。
5. **Review：** 逐項看過 diff，有問題就修；結果留言在 PR 上。
6. **CI 通過後 merge：** `main` 會自動部署。

commit 訊息第一行寫做了什麼，內文寫為什麼。
