# 隨身旅伴 TravelBuddy — Product Spec

> A small helper that Taiwanese travellers who don't speak the local language carry on their phone abroad. A Japan edition is available now.
> No need to learn Japanese or even speak: the app **reads it aloud** for you, or **shows the Japanese in large text** to the other person, who can **tap an answer** to reply.
>
> This service is for everyone: neither the UI nor the docs use terms aimed at a particular age group or demographic. Large text, large buttons and no typing are there so anyone can use it when flustered.

Status: the Japan edition is live. For what changed, see [changelog.md](changelog.md); for what's next, see [roadmap.md](roadmap.md).

---

## 1. Users and core flow

| Role | When | What they do |
|---|---|---|
| **Setter-up** (the traveller, or a family member or friend helping out) | Before departure, on their own phone or computer | Fill in the details and use it directly; or generate a link / QR code and send it to the traveller |
| **Traveller (user)** | In the destination, when something comes up | Open → tap one large button → hand the phone to the other person or press play |
| **Local (the other person)** | When the traveller shows them the phone | Read the Japanese card; in 給對方點選 (Let them tap) mode, tap an answer with a finger |

```
Setter-up: fill in #/setup ──► #/share generates link + QR ──(LINE / in person)──► traveller's phone opens #/s/<data>
                                                                │
                                                     imported into localStorage, URL changed to #/imported
                                                                ▼
Traveller: home ──► 「我需要幫忙」(I need help) / big scene buttons ──► one phrase ──► play or 給對方看 (Show them) or 給對方點選 (Let them tap)
```

Design baseline:

- **Zero setup on the user side**: no login, no menu tree, no search. Text size and dark mode are small links at the bottom of the home page.
- **Works without any data filled in**: every scene phrase works; phrases that need a station or hotel name use 「這裡」 (here) or 「這間飯店」 (this hotel) instead, with the hint 「把地址拿給對方看」 (show them the address).
- **Only the setup page needs typing**: forms appear only in `#/setup`; the in-use screens need no input at all.

---

## 2. Features

### 2.1 Setup and sharing (`#/setup`, `#/share`, `#/s/…`)

**Form**: 6 collapsible cards, each with a summary in its title bar. Every field is optional and saves automatically.

| Section | Fields | Used in |
|---|---|---|
| Traveller | Name to call them by, passport name in English, birth year | Home greeting (「媽媽，旅途平安」, "Mom, have a safe trip"), help card, medical card |
| Hotels (multiple allowed) | Japanese name, reading, address, phone, check-in to check-out date | The "current hotel" is chosen from today's date; if no dates match, the first one is used |
| Daily plans (multiple allowed) | Type (station / place), Japanese name, reading, Chinese name, date, elevator notes | Station slot in transport phrases; 「今天要去」 (Going today) on the home page |
| Contacts | Family (relationship, name, phone; multiple allowed, the first is primary), local contact in Japan | Help card, one-tap calling |
| Health | Chronic conditions (checkboxes + free text), regular medications (active ingredient + dose), blood type | Medical card |
| Allergies, diet, insurance | Drug allergies, food allergies (Japan's "specified raw materials", etc.), dietary practice (vegan, lacto-ovo vegetarian, five-pungent-free vegetarian, no seafood…), travel insurance | Allergy card, medical card |

**Sharing**:

- The data is encoded in the URL after `#` (`#/s/1.<payload>`) and is **never sent to any server** (see §6).
- The share page has: share / copy link, QR code, a printable card for laminating, and a privacy notice that cannot be collapsed: 「這個連結裡有飯店地址、電話和健康資料。只傳給本人，不要貼到群組或社群。」 ("This link contains hotel addresses, phone numbers and health information. Send it only to the traveller; don't post it in group chats or on social media.")

**When the traveller opens the link**:

1. Decode and validate. On failure → 「這個連結好像不完整，請重新傳一次」 ("This link seems incomplete. Please send it again.").
2. If different data is already stored on the device → 「要換成新的資料嗎？」 ("Replace with the new data?") (換新的 Replace / 保留原本的 Keep existing).
3. Save to localStorage and change the URL to `#/imported` (so no data stays in the address bar or bookmarks).
4. Show 「設定完成」 ("Setup complete"): from now on, just open the site; no need to tap the link again.

### 2.2 我需要幫忙 (I need help) (`#/help`)

- The large red button at the top of the home page.
- The help card is assembled from the data. Each section is in large Japanese, with small Chinese below for the traveller:
  - I don't speak Japanese; I'm from Taiwan (with the passport name in English).
  - I'm lost. Please help me.
  - I want to go back to this hotel (hotel name, address, phone).
  - Please call my family for me (relationship, name, phone, and how to dial from Japan).
- Play, slow, show enlarged to the other person.
- 「找警察（交番）」 ("Find the police (koban)"): an explanation of police boxes and a 「附近的派出所在哪裡？」 ("Where is the nearest police box?") card.
- Emergency numbers: the Japan National Tourism Organization visitor hotline, the Taipei Economic and Cultural Representative Office in Japan, and others, each with a Chinese description. More numbers are under 「各地辦事處」 (Regional offices).
- Fixed call bar at the bottom: family (international call), 110, 119.

### 2.3 Scene phrasebook (`#/scene/<id>`)

Scenes are ordered on the home page by importance:

| id | Name | Groups |
|---|---|---|
| `transport` | 交通 (Transport) | Asking the way, where to go / Elevators, avoiding stairs / Platforms, boarding / Tickets, gates, missed stop / Buses, taxis / Lost items |
| `hotel` | 飯店 (Hotel) | — |
| `luggage` | 行李 (Luggage) | Storage, lockers / Luggage delivery / Oversized luggage on the Shinkansen |
| `restaurant` | 餐廳 (Restaurant) | Allergies, vegetarian, taste / Entering, waiting for a table / Ordering / Paying |
| `konbini` | 便利商店 (Convenience store) | — |
| `shopping` | 購物 (Shopping) | Choosing / Paying, wrapping, returns / Tax-free, tax refunds |
| `drugstore` | 藥妝店 (Drugstore) | — |
| `toilet` | 廁所・問路 (Toilets, directions) | — |
| `family` | 帶小孩 (With children) | Lost child, illness / Going out, trains / Meals / Diapers, nursing, toilets |
| `emergency` | 緊急・醫療 (Emergency, medical) | Feeling unwell, seeing a doctor / Lost or stolen items, finding the police / Separated from companions / Earthquakes, typhoons, power outages |

- Two tabs at the top of the scene page: 「我要說」 (I want to say) | 「對方說」 (They say).
- The phrase list shows Chinese plus a Japanese preview. Tapping a phrase opens a full-screen detail view: Chinese, Japanese (with furigana, and the full romanization below), and a tip. A fixed row at the bottom has 「播放」 (Play) / 「慢速」 (Slow) / 「給對方點選答案」 (Let them tap an answer) (when the phrase has answers) and a solid 「給對方看」 (Show them) button, plus related links.
- **Station slot**: `$dest` / `$stop` in transport phrases are replaced with the pre-filled station name. A row of destination buttons sits at the top of the scene page (today's first); tapping one switches the phrases to that station. If the selected station has elevator notes, they appear below and can be enlarged to show station staff. Without data, the `fallback` is used (「這裡」, "here").

### 2.4 Two-way communication

**I ask → they tap an answer** (phrases with `answers`):

```
┌──────────────────────────────┐
│ この電車は新宿に止まりますか。  │  ← Japanese question (large text)
│ 下の答えを指でタッチしてください │  ← instructions for the other person
├──────────────────────────────┤
│  [ はい ]      [ いいえ ]       │  ← Japanese options
│  [ わかりません ]               │
└──────────────────────────────┘
          ↓ they tap 「いいえ」
┌──────────────────────────────┐
│        不是／不對               │  ← Chinese for the traveller (No / Not right), extra-large text
│   [ 知道了 ]   [ 再問一次 ]     │  ← Got it / Ask again
└──────────────────────────────┘
```

Default answer sets: `yesNo`, `platform`, `direction`, `time`, `place`, `exit` (see [content-guide.md](content-guide.md)).

**They say → I understand and reply**: each item shows Chinese (largest text) and Japanese, with a speaker icon in the top-right corner (normal speed the first time, slow on the second tap). Below are 2–4 large Chinese reply buttons; tapping one speaks the Japanese and shows it enlarged.

**萬用句 (All-purpose phrases)**: always at the bottom of every scene page. Tapping opens a full-screen list: Excuse me; I don't speak Japanese; Please answer yes or no; Please write it on paper; Please speak more slowly; Please say that again; Please point to it; Please wait a moment; Thank you.

### 2.5 Medical card and allergy card (`#/medical`)

- **Symptom pointing card**: check off symptoms (like a hospital registration form) to produce 「我有以下症狀：…」 ("I have the following symptoms: …") to show the doctor.
- **Allergy card** (for restaurants): food allergies and dietary practice. Taiwanese vegetarian categories have no common equivalent in Japan, so the card lists the ingredients the traveller can't eat directly, and spells out fish stock and meat extract.
- **Medical card** (for doctors and paramedics): name, birth year and age, nationality, chronic conditions, regular medications, drug allergies, blood type, family phone number, travel insurance.
- Common phrases: call an ambulance; take me to a hospital; I have travel insurance; please give me a medical certificate and a receipt; can you write the medical certificate in English?

### 2.6 Back-to-hotel card (`#/hotel`, `#/hotel/<n>`)

A card to show a taxi driver or passer-by: 「請載我到這間飯店」 ("Please take me to this hotel") plus the name, address and phone number. It can be played aloud, enlarged, or used to call the hotel directly. With more than one hotel, you can switch between them.

### 2.7 Travel cheat sheets (`#/guide/<id>`) and recommended tools (`#/tools`)

- **Travel cheat sheets**: step-by-step procedures. Each has numbered steps, things to watch for, sources and a verification date. Current topics: the new departure tax refund system, oversized luggage on the Shinkansen, and seeing a doctor and claiming insurance.
- **Recommended free tools**: apps that already do the job well (alerts, translation, maps, ride-hailing, transit cards, entry procedures), with what they're for, caveats and download links. We don't rebuild these features.

### 2.8 Printable cards (`#/print`)

One A4 sheet prints credit-card-sized (85.6 × 54 mm) cards with cut lines, suitable for laminating and keeping in a wallet: help card, hotel card (one per hotel), medical card, allergy card (only if filled in), emergency numbers card. Printing always uses the light theme with black text.

---

## 3. Interface rules for easy reading and tapping

For visual details, see [design.md](design.md).

| Rule | Implementation |
|---|---|
| Large text by default | Two text sizes: **Large** (root 125%, default) and **Extra large** (150%). All sizes use rem. |
| Large buttons | Primary buttons ≥ 4rem tall, secondary ≥ 3.5rem. |
| One-level menus | Home page = big scene buttons; one level down are the phrases. Full-screen cards are overlays; 「關閉」 (Close) or the back button returns to the original page. |
| No typing, no search | In-use pages have no input fields (only the setup page does); stations are chosen with buttons. |
| Icon + text | Line SVG icons always come with text. No emoji. |
| Contrast | Separate light and dark token sets; every text / background pair is ≥ 4.5:1 (WCAG AA), checked by tests. |
| Dark mode | Follow phone / light / dark; an inline script in `index.html` applies it first to avoid a white flash. |
| Landscape | Full-screen card text size is based on `min(vw, vh)`, so it grows in landscape without being cut off. In 「給對方看」 (Show them) in landscape, the play button moves to the top bar and the text scrolls from the first line. |
| Animation | Respects `prefers-reduced-motion`. |
| Back | Every page has 「‹ 首頁」 (‹ Home) in the top-left, with a large left-aligned title below; the title shrinks into the top bar on scroll. Overlays always have 「× 關閉」 (× Close) in the top-left. |
| Assistive technology | When an overlay opens, the page behind it gets `inert` and `aria-hidden`; only the top layer is operable. |

---

## 4. Pages and routes

All routes come after `#` (the `PAGES` table in `src/main.ts`), so the site works under any subpath.

| Route | Page | Used by |
|---|---|---|
| `#/` | Home | Traveller |
| `#/help` | 我需要幫忙 (I need help) | Traveller |
| `#/scene/<id>` | Scene: 我要說 (I want to say) | Traveller |
| `#/scene/<id>/heard` | Scene: 對方說 (They say) | Traveller |
| `#/medical` | Medical card, allergy card, symptom pointing card | Traveller |
| `#/hotel`, `#/hotel/<n>` | Back-to-hotel card | Traveller |
| `#/guide/<id>` | Travel cheat sheet | Traveller |
| `#/tools` | Recommended free tools | Traveller |
| `#/settings` | Text size, colors, voice, what to do if there's no sound | Traveller |
| `#/setup` | Setup form | Setter-up |
| `#/share` | Share link, QR code, privacy notice | Setter-up |
| `#/print` | Printable cards | Setter-up |
| `#/s/<version>.<payload>` | Import (replaced with `#/imported` once processed) | Traveller |

Full-screen cards (phrase detail, 給對方看 (Show them), 給對方點選 (Let them tap), 萬用句 (All-purpose phrases)) are overlays, not routes. Each one, when opened, does a `pushState` of a history entry with a unique token, so the back button closes only the top layer. Focus is trapped in the top layer, and Esc also closes it.

URLs are split by country (`…/japan/`); see [development.md](development.md#urls-and-countries).

---

## 5. Data structures

### 5.1 Japanese markup

- One half-width space between words; kanji are written as `{漢字|かな}`; the particles 「は」 and 「を」 are separate words.
- **Slots**: a whole word starting with `$` — `$dest`, `$stop`, `$hotel` — replaced with user data on expansion.
- Japanese entered by the user (station names, hotel names, addresses): if a reading is given it becomes `{新宿|しんじゅく}`; if not, it's shown as is and the voice reads the original text.

For writing rules, see [content-guide.md](content-guide.md).

### 5.2 Content (`src/content/`)

```ts
type Jp = string;                         // Japanese markup; may contain $slot
type Slot = "dest" | "stop" | "hotel";
type ReplySet = "yesNo" | "platform" | "direction" | "time" | "place" | "exit";

interface Reply { jp: Jp; zh: string }    // zh: the Chinese the traveller sees

/** Something the traveller needs to say. */
interface Phrase {
  id: string;                             // starts with the scene id; globally unique
  zh: string;
  jp: Jp;
  fallback?: Jp;                          // when there is a slot but no data
  fallbackZh?: string;
  tip?: string;
  answers?: ReplySet | Reply[];           // 「給對方點選答案」 (Let them tap an answer) appears only when set
  link?: { href: string; label: string };
  group?: string;                         // required when the scene has groups
}

/** Something staff commonly say to the traveller. */
interface Heard { id: string; jp: Jp; zh: string; replies: Reply[] }

interface Scene {
  id: SceneId;
  title: string;
  icon: IconName;                         // line icon from src/ui/dom.ts
  groups?: { id: string; title: string }[];
  phrases: Phrase[];
  heard: Heard[];
}

/** Checkboxes in the form; the Japanese is pre-written and checked. */
interface Preset { id: string; zh: string; jp: Jp }   // chronic conditions, allergies, diets, symptoms

interface Guide {                         // travel cheat sheet
  id: string; title: string; summary: string;
  steps: { title: string; body: string }[];
  notes: string[];
  sources: string[];                      // https
  verified: string;                       // YYYY-MM-DD
}

interface Tool {                          // recommended tool
  id: string; name: string; use: string; note?: string;
  links: { label: "App Store" | "Google Play" | "官方網站"; url: string }[];
}
```

### 5.3 Traveller data (Profile)

```ts
interface Profile {
  callName: string;            // what the home page calls the traveller, e.g. 媽媽 (Mom), 小美 (a given name)
  passportName: string;        // passport name in English
  birthYear: number | null;
  hotels: Hotel[];
  places: Place[];
  contacts: Contact[];         // the first is the primary contact, usually family in Taiwan
  localContact: Contact;       // a friend, relative or tour guide in Japan
  health: Health;
  insurance: { company: string; policy: string; phone: string };
}

interface Hotel { name: string; kana: string; address: string; phone: string; from: string; to: string }

interface Place {
  kind: "station" | "place";
  name: string;                // Japanese; station names omit 「駅」
  kana: string;
  zh: string;
  date: string;                // YYYY-MM-DD or blank
  note: string;                // elevator notes
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

Every field has a length limit (names 80 characters, addresses 200 characters, arrays 20 items). `parseProfile(unknown)` validates field by field, and any broken field falls back to its default on its own. The screen always renders with `textContent`, so HTML injection isn't possible.

### 5.4 Local storage

| key | Contents |
|---|---|
| `travelbuddy.japan.profile` | Profile (version 1) |
| `travelbuddy.japan.settings` | Text size, colors, voice |

Each country edition uses its own prefix (see [development.md](development.md#local-storage)).

---

## 6. Share links

```
https://sean1093.github.io/travel-buddy/japan/#/s/1.<payload>
                                                  │ └─ base64url( deflate-raw( UTF-8( JSON( wire ) ) ) )
                                                  └─── format version
```

- **Wire format**: the Profile as JSON with short key names; empty fields are omitted entirely. The mapping is in `src/share/codec.ts` (e.g. elevator notes are `e`), with round-trip tests.
- **Compression**: `fflate`. Not `CompressionStream`, because older iOS versions lack it.
- **base64url**: doesn't get truncated or escaped in LINE or text messages.
- **Size**: typical data is about 1,000 characters; above 1,500 characters, the share page warns that the QR code will be denser.
- **Version**: `1.` is only ever added to, never changed; a format change uses `2.`, and old links still decode.
- **Security**: decoded data always goes through `parseProfile`. Anything after `#` isn't sent to the server, but it does stay in chat history and browser history, so the share page warns about it; after import, the URL is replaced immediately.

**Known risk**: Safari may clear localStorage for sites not opened in 7 days. The mitigations are a share-page reminder, 「出發前一兩天再傳，出發當天打開一次」 ("Send it a day or two before departure, and open it once on the day you leave"), and the printed cards.

---

## 7. Voice

- Uses the browser's built-in Web Speech API, which needs no network. Picks good-quality voices (Premium, Enhanced, Google) and avoids robotic ones.
- Default rate 0.9; 「慢速」 (Slow) is 0.6.
- If there's no Japanese voice, the top of the home page shows 「這支手機還不會念日文 → 怎麼安裝」 ("This phone can't read Japanese yet → how to install"). 「給對方看」 (Show them) isn't affected.
- If a station name has no reading, the voice reads the original kanji; the form notes that filling in the reading avoids mispronunciation.

---

## 8. Tech

- Pure front-end static site: Vite, TypeScript (strict), Tailwind CSS 3. The only runtime dependencies are `fflate` and `qrcode-generator`.
- PWA: can be added to the home screen; a service worker makes the whole app work offline.
- Deployed on GitHub Pages.
- For project structure, testing and deployment, see [development.md](development.md); for content rules, see [content-guide.md](content-guide.md).

---

## 9. Decision log

| Item | Decision |
|---|---|
| Name | 隨身旅伴 TravelBuddy, with the country after the name (隨身旅伴・日本, TravelBuddy Japan), to prepare for adding other countries later |
| URL | `sean1093.github.io/travel-buddy/`, split by country; the Japan edition is at `/japan/`. The root redirects and keeps the `#` |
| Storage keys | Each country has its own prefix; Japan is `travelbuddy.japan.` |
| Wording | A service for everyone; no terms aimed at a particular age group |
| Language | UI in Mandarin (Taiwanese usage), no Taiwanese Hokkien; code, issues and PRs in English |
| Visual | Design direction C, "Washi, soft" (chosen from four mockups); no emoji |
| Positioning | Not an all-in-one toolbox; translation, maps, ride-hailing and alerts are left to dedicated apps and introduced under "Recommended free tools" instead |
| In-station elevator maps | Not doing (data is scattered, goes stale, is hard to read, and Google Maps already has wheelchair routes); doing elevator phrases and elevator notes instead |
| 「請寫在這裡」 ("Please write here") handwriting pad | Not doing; ask the other person to write on paper |
| iOS home-screen app doesn't share storage with Safari | Not addressed for now |
| Birth year | Included in the medical card and share link |
| Usage tracking | Not added; data stays only on the user's phone |
