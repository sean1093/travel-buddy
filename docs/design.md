# Design language: washi, soft

This app gets opened on platforms, at shop entrances and in taxis, often in a panic. The screens should be quiet, easy to read and reassuring, like a Japanese inn's instruction card or paper goods from a stationery shop, not a generic app template.

This direction (C) was chosen from four design drafts (see issue #22): A station signage, B minimal list, C washi soft, D high-contrast monochrome. After the 2026-10-13 UX review it was refined towards an "inn instruction card": Mincho headings, dashed dividers, a single page header style (items 10–13).

## Principles

1. **No emoji.**
   - Emoji look different on every phone, and make the screen look like it was produced by a chatbot.
   - Scenes and features always use the line icons in `src/ui/dom.ts`: 24×24 grid, round line caps.
   - Place and service icons (`train`, `bed`, `bowl`, `store`, `restroom`, `firstaid`…) follow the shapes of JIS public information symbols.
2. **Thin-line icons, no backing plate** (`pictogram()`).
   - Icons use a 1.6px thin line, coloured by meaning (blue or red). There is always text next to them; the icon itself is only decoration (`aria-hidden`).
   - The one exception is exits and lifts: they keep the black-on-yellow plate, because in a station that colour is itself the sign.
3. **Colour only carries meaning, never decoration.**

   | Colour | Token | Meaning |
   |---|---|---|
   | Washi (和紙, Japanese paper) | `paper` | Page background (warm beige) |
   | White paper | `card` | Cards, lists |
   | Sand | `sand` | Secondary buttons, shortcuts |
   | Ai (藍, indigo) | `ai` | Things you can tap, regular scenes |
   | Shu (朱, brick red) | `shu` | Emergency: help, medical, 110/119 |
   | Deep shu (深朱, deep vermilion) | `sos` | Solid emergency buttons (我需要幫忙 (I need help), 110/119): white on dark red in both light and dark mode; it does not turn pale pink in dark mode |
   | Yellow | `exit` | Exits, lifts; black on yellow like station exit signs |
   | Green | `ok` | Letting the other person tap an answer |
   | Pale yellow | `warn-soft` | Tips, 萬用句 (all-purpose phrases) |

4. **Layer with blocks of colour, not borders.**
   - Cards, cells and lists are separated by the difference between their background and the paper colour. No borders, no shadows.
   - Corner radius is 16px throughout (`rounded-2xl`); small buttons use `rounded-lg`.
   - Exception one: input fields keep a visible border (`ring-muted/60`) so people know where they can type.
   - Exception two: the "selected" state uses a 2px border so you can see at a glance what is chosen.
   - All other buttons (answer options, destinations, let-them-tap) have no border.
5. **Section headings are quiet small text** (`heading()`): muted colour, wider letter spacing, followed by a thin line to the edge, like the small labels above lists in a printed guide. Emergency sections use red.
6. **Copy gives instructions; it doesn't chat.**
   - Short, imperative sentences. No emoticons, and no "👉" or "👇".
   - Examples: 「請把畫面拿給對方看」 (Please show this screen to the other person), 「點一句，念給對方聽」 (Tap a phrase to read it aloud to them).
   - Once the phone is handed to a Japanese person, on-screen instructions for them are always in Japanese (for example 「こちらをご覧ください」).
   - Use arrow characters directly for directions (→ ← ↑).
7. **Checkboxes look like a paper form.** Symptoms and dietary needs use boxes that fill in with a tick, like a hospital registration form.
8. **Phrases in the same group go on the same card** (`rowGroup()`), separated by dashed lines, like a menu or an inn's instruction card. Don't give each phrase its own box.
9. **Only one solid button per screen.**
   - The main action is solid (for example 「給對方看」 (Show them)). Other actions use a pale background (`bg-sand`, `bg-ai-soft`, `bg-ok-soft`), or sit in the same card divided by dashed lines (the phrase page's 「播放／慢速／給對方點選答案」 (Play / Slow / Let them tap an answer)).
   - "Play" and "Slow" look the same; only the icon and text tell them apart.
   - On 「對方說」 (They say) cards, the reply buttons are the focus. Playback is reduced to one speaker in the top right: normal speed the first time, slow when pressed again.
10. **Font weights have a hierarchy.** Page titles use semi-bold Mincho (`font-title`). List titles and scene buttons use semi-bold (`font-semibold`). Bold is only for buttons and words people must see immediately. Japanese text and descriptions use regular weight in a muted colour.
11. **There is only one kind of page header.**
   - Regular pages: 「‹ 首頁」 (‹ Home) in the top left, with a large left-aligned title below (scene pages put an icon before the title). When you scroll down, the title shrinks to one line in the top bar (`page()`).
   - Overlays: 「× 關閉」 (× Close) in the top left, with one line of muted small text on the right saying where you are or what to do next (`overlayBar()`).
12. **Japanese looks like a note.** On the phrase page, the Japanese sits on a card with a thin brick-red line along the top edge. Furigana are centred over the kanji. Romaji is one line for the whole sentence, separated from the Japanese by a dashed line.
13. **Home screen scenes are two columns of horizontal buttons**: icon on the left, text on the right, so all ten scenes fit on about one screen. 「回飯店／醫療卡」 (Back to hotel / Medical card) share one card, divided by a dashed line. Settings, font size and printing are in the list at the bottom.

## Why

- **Reassurance.** When you are panicking, a quiet screen makes it easier to see where to tap than a busy one.
- **Consistency.** SVG looks the same on every phone, in dark mode and on printed cards.
- **Credibility.** The help card and medical card are shown to strangers. The more they look like official documents, the more seriously people read them.
