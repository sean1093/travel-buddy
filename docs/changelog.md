# Changelog

Newest first. Every item goes through the "issue → development → PR → review → testing → merge" process. The PR links have the full changes and how they were verified.

## 2026-10-19

### Fixes
- **Printing:** the wallet cards now pack folded cards next to short ones, so a typical trip fits on one A4 sheet instead of two. Printing no longer adds a blank second page.
- **Screen readers:** the furigana over kanji is no longer read aloud, so each Japanese word is read once instead of twice (電車 でんしゃ).

### Testing
- **Device checks in CI** (`e2e/device.spec.ts`): speech requests, voice choice, install and offline, sideways layout, print size, share links and screen-reader text, from the manual checklist. The manual checklist now only lists what needs a real phone. See [testing.md](testing.md#device-checks).

## 2026-10-18

### Testing
- **Test plan and three test layers** (see [testing.md](testing.md)): unit tests for storage, speech, settings and slot filling; component tests (happy-dom) for overlays, Japanese text, scene pages, home, medical and help; Playwright browser journeys and a layout matrix (11 routes × 5 screen variants). CI now runs coverage and e2e. Line coverage went from 44% to 76%.

### Fixes found by the new tests
- **Browser bar colour:** the phone's browser bar no longer changes colour as the app starts (the app's copy of the background colour was out of date).
- **Keyboard and screen-reader focus:** after 再問一次 (Ask again) and after picking a destination, focus stays on the screen instead of jumping back to the top of the page.
- **Destination row:** picking a station further along the row no longer scrolls the row back to the start.
- **Speech:** asking to speak empty or blank text resolves quietly instead of throwing an error.
- **Content checks:** empty Japanese text is now reported by `npm test` instead of slipping through.

## 2026-10-13

### Visual design: inn instruction card
The direction chosen after the UX review (texture "inn instruction card", header A, scene grid B, 對方說 (They say) A). See items 10–13 in [design.md](design.md).
- **Single page header style**: regular pages have 「‹ 首頁」 (‹ Home) in the top left plus a large left-aligned title, which shrinks into the top bar when you scroll down. Overlays always have 「× 關閉」 (× Close) in the top left.
- **Mincho headings, font weight hierarchy**: page titles now use semi-bold Mincho, lists and scene buttons use semi-bold, and bold is only for buttons. Section labels are followed by a thin line.
- **Home screen**: scenes are now two columns of horizontal buttons, so all ten scenes fit on about one screen. 「回飯店／醫療卡」 (Back to hotel / Medical card) are merged into one card. The text links at the bottom are now a settings list.
- **Phrase page**: the Japanese sits on a note with a brick-red line along the top edge, and romaji is now one line for the whole sentence. 「播放／慢速／給對方點選答案」 (Play / Slow / Let them tap an answer) are merged into one row, and the solid 「給對方看」 (Show them) button is fixed to the bottom.
- **對方說 (They say)**: reply buttons are larger and are now the focus. Playback is reduced to one speaker; press again for slow. Three questions fit on one screen.
- **Removed unneeded borders**: answer options, destination buttons and let-them-tap no longer have borders. 「我要說／對方說」 (I say / They say) is now a segmented toggle.

### Fixes
- **Furigana and romaji layout**: fixed romaji taking one column per character, and kana sticking to the previous line on wrap. When furigana are wider than the kanji, the kanji are no longer spread apart (新 宿).
- **Text cut off in landscape**: in 「給對方看」 (Show them) in landscape, the play button moves to the top bar. Long text scrolls from the first line instead of being clipped at top and bottom.
- **給對方點選 (Let them tap)**: after the phone is handed over, the top bar text is now the Japanese 「こちらをご覧ください」. The repeated 「對方的回答是」 (Their answer is) was removed from the answer screen. Japanese now wraps between phrases (ください is no longer split into くださ／い).
- **Help button in dark mode**: 「我需要幫忙」 (I need help), the help page top bar and 110/119 now use the new `sos` colour (white on dark red). In dark mode they are no longer black on pale pink.
- **Settings data**: the solid bottom button is now 「完成」 (Done), and 「分享」 (Share) now has a pale blue background. The one-solid-button-per-screen rule still holds.
- **Extra-large text**: 「迷路・找家人・急病」 (Lost, finding family, sudden illness) on the home screen no longer wraps.
- **Symptom card**: after you tick symptoms, 「給對方看（N 項）」 (Show them (N items)) is fixed to the bottom of the screen. Symptom names no longer break mid-word.

## 2026-10-11

### URLs and name
- **Removed compatibility handling for the old name** ([#42](https://github.com/sean1093/travel-buddy/issues/42)): there are no users yet, so local storage now uses the Japan edition's own prefix `travelbuddy.japan.`. Cache cleanup and service worker handling kept for old versions were removed.
- **Repo renamed to `travel-buddy`, old URL retired**: the site is now at `sean1093.github.io/travel-buddy/japan/`. The old URL `/daijoubu/` does not redirect, so share links and QR codes sent earlier must be regenerated. Data already saved on phones is not affected.
- **Japan edition moved to `/japan/`** ([#37](https://github.com/sean1093/travel-buddy/pull/37)): the Japan edition builds to `dist/japan/`. The site root has a redirect page that carries the `#` over to the Japan edition, so old share links and home screen shortcuts still work. Later the root will become a country picker.
- **Renamed to "隨身旅伴 TravelBuddy"** ([#35](https://github.com/sean1093/travel-buddy/pull/35)): formerly "日本旅遊小幫手 (Daijoubu)" (Japan Travel Helper). To make room for other countries, "Japan" was dropped from the name and the country goes after it (隨身旅伴・日本, TravelBuddy · Japan). The local storage key deliberately keeps `daijoubu.` so no data is lost.

### Improvements from competitor analysis and forum pain points ([research.md §5](research.md#5-competitor-analysis-and-expansion-review-2026-10-11))
- **Direct links for recommended tools** ([#33](https://github.com/sean1093/travel-buddy/pull/33)): App Store, Google Play and official website buttons. Only verified URLs are included.
- **Seeing a doctor and insurance claims, recommended free tools** ([#31](https://github.com/sean1093/travel-buddy/pull/31)): added claim steps to the travel cheat sheets (including National Health Insurance reimbursement of self-paid medical costs). Added phrases to the emergency scene for an English medical certificate, an itemised bill, paying by card and more. Added a recommended tools page.
- **Luggage scene, large luggage on the Shinkansen, exits and transfers** ([#30](https://github.com/sean1093/travel-buddy/pull/30)): added a tenth scene, "Luggage" (storage, delivery, large luggage on the Shinkansen). Added the Shinkansen large luggage rules to the travel cheat sheets. Added exit and transfer questions to Transport.
- **Restaurant: phone ordering and dashi** ([#29](https://github.com/sean1093/travel-buddy/pull/29)): when your phone doesn't work, ask staff to take your order directly, or ask them to help you order on your phone. Added answer buttons to the dashi question, and added "no bonito dashi, please".
- **New departure tax refund system and travel cheat sheets** ([#28](https://github.com/sean1093/travel-buddy/pull/28)): added "travel cheat sheets" (step-by-step guides with sources and verification dates). The first one covers the new tax refund system starting 2026-11-01. Grouped the shopping scene and added tax refund phrases.

### Visual design
- **Design direction C: washi, soft** ([#23](https://github.com/sean1093/travel-buddy/pull/23)): chosen from four design drafts. Warm paper background, no borders, thin-line icons, quiet section headings. See [design.md](design.md).
- **Grouped lists, one solid button per screen** ([#21](https://github.com/sean1093/travel-buddy/pull/21)).
- **Pages behind an open full-screen card can't be used** ([#19](https://github.com/sean1093/travel-buddy/pull/19)): `inert` plus `aria-hidden`, so screen readers and the keyboard only reach the top layer.
- **Title bar, share page and phone numbers don't wrap** ([#18](https://github.com/sean1093/travel-buddy/pull/18)): phone numbers are now structured data, and all cards share one display format.
- **Station signage design language, emoji removed** ([#14](https://github.com/sean1093/travel-buddy/pull/14)): all emoji replaced with line icons.

### Content
- **Travelling with kids scene** ([#15](https://github.com/sean1093/travel-buddy/pull/15)): lost or sick, out and about and on trains, meals, nappies, breastfeeding and toilets; 21 phrases in total.
- **Lift questions and lift notes** ([#11](https://github.com/sean1093/travel-buddy/pull/11)): after review, we decided not to build in-station lift maps (the data is scattered, goes out of date, is hard to read, and Google Maps already has wheelchair routes). Instead we added lift questions and per-station lift notes (`Place.note`).
- **Improvements from traveller pain points** ([#10](https://github.com/sean1093/travel-buddy/pull/10)): rubbish bins, declined cards, tablet ordering, wrong train, taxi receipts, lost property, getting separated, earthquakes, avoiding stairs. See [research.md §1–4](research.md).

## 2026-10-08

- **Dietary needs: vegan, lacto-ovo vegetarian, five-pungent-free vegetarian, no seafood** ([#9](https://github.com/sean1093/travel-buddy/pull/9)): the Japanese doesn't give the diet's name. It lists the ingredients you can't eat directly, and calls out fish stock and meat extract.
- **UX redesign** ([#8](https://github.com/sean1093/travel-buddy/pull/8), issues #1–#7):
  - Home screen: 「回飯店」 (Back to hotel) and 「醫療卡」 (Medical card) sit right below the help button. When there is an itinerary for the day, 「今天要去」 (Going today) is shown.
  - Scene pages: a compact list plus full-screen single-phrase details. Transport is grouped (page height dropped from about 10,600 px to 3,400 px).
  - 對方說 (They say): Chinese on the first line in the largest text, with reply buttons right below.
  - 萬用句 (All-purpose phrases): always at the bottom of every scene page.
  - Full-screen cards: can stack; the back button only closes the top one.
  - Help page: fixed dial bar at the bottom; the address is labelled 「住所：」.
  - Settings form: 6 collapsible section cards that show a summary and saved state.
- **First release**: settings and sharing, 我需要幫忙 (I need help), scene phrasebook, 給對方看 (Show them), 給對方點選 (Let them tap), 對方說 (They say), 萬用句 (All-purpose phrases), medical card, allergy card, symptom pointing card, back-to-hotel card, printed cards, offline use.
