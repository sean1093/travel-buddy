# Content guide

All text content lives in `src/content/`. It is written in TypeScript and bundled into the app, so it works offline. `npm test` checks most of the rules. What it can't check (tone, accuracy) relies on this document and on review.

## 1. Japanese markup

Write Japanese with this markup. The app generates furigana, romaji and speech from it automatically:

- **Put one half-width space between words.** Word breaks decide how the romaji is split and where lines wrap.
- **Always give readings for kanji, English letters and numbers:** `{漢字|かな}`, for example `{電車|でんしゃ}`, `{QR|キューアール}`. Readings must be kana only.
- **The particles 「は」 and 「を」 are separate words:** `これ は`, `メニュー を`, so the romaji comes out as wa and o.
- Don't use full-width spaces.

```ts
jp: "この {電車|でんしゃ} は $stop に {止|と}まります か。"
```

## 2. Phrases (Phrase)

```ts
{
  id: "transport-stops-at",       // starts with the scene id, kebab-case, globally unique; never change it once live
  group: "train",                 // required when the scene has groups
  zh: "這班車有停〇〇嗎？",        // Chinese shown to the traveller; 〇〇 is replaced by the station name
  jp: "この {電車|でんしゃ} は $stop に {止|と}まります か。",
  fallback: "この {電車|でんしゃ} は ここ に {止|と}まります か。",
  fallbackZh: "這班車有停這裡嗎？（同時給對方看站名）",
  tip: "上車前問月台上的站務員或旁邊的人。",   // optional, a one- or two-sentence tip in Chinese
  answers: "yesNo",               // optional: only when set does 「給對方點選答案」 (Let them tap an answer) appear
  link: { href: "#/guide/tax-refund", label: "看出境退稅步驟" },  // optional
}
```

### Tone

- Always natural, polite 「です／ます」 form. For requests use 「〜て ください」 or 「〜て いただけます か」.
- Chinese uses Taiwan usage. Keep it short and direct, like speech.
- Keep phrases as short as possible: the other person is a stranger standing and reading a phone.

### Slots

| Slot | Replaced with | Example |
|---|---|---|
| `$dest` | Destination; stations get 「駅」 added | 新宿駅 に 行きたい です |
| `$stop` | Station name only | 新宿 に 止まります か |
| `$hotel` | Name of the current hotel | この 荷物 を ○○ホテル に 送りたい です |

A phrase with a slot must have `fallback` and `fallbackZh`. When there is no data, it says 「這裡」 (here) or 「這間飯店」 (this hotel) instead, and tells the traveller to show the address or map at the same time.

### Answers (let them tap)

`answers` can use a preset answer set (`src/content/replies.ts`) or a set written inline:

| Answer set | Contents |
|---|---|
| `yesNo` | Yes, no |
| `platform` | Platforms 1–14 |
| `direction` | Right, left, straight on, behind, upstairs, downstairs, right here |
| `time` | Right away, about 5/10/30 minutes, about 1 hour |
| `place` | Nearby, far, inside the station, outside the station, there isn't one |
| `exit` | East exit, west exit, south exit, north exit, central exit, they write it for you |

Every set ends with 「不知道」 (I don't know).

Custom answer sets need at least 2 answers. End with 「不知道」 (I don't know) or 「寫在紙上」 (write it on paper) so the other person has a way out.

### Groups

Scenes with more than about 20 phrases must be grouped (`groups` and each phrase's `group`). Put the most important group first (for example the restaurant's 「過敏・素食・口味」 (Allergies, vegetarian, taste)).

## 3. They say (Heard)

Things staff and station workers often say. The traveller reads the Chinese and taps a Chinese reply:

```ts
{
  id: "konbini-heard-bag",        // starts with the scene id + "-heard-"
  jp: "{袋|ふくろ} は ご{利用|りよう} です か。",
  zh: "要袋子嗎？（袋子要錢）",
  replies: [
    { jp: "はい、お{願|ねが}い します。", zh: "要" },
    { jp: "いいえ、{大丈夫|だいじょうぶ} です。", zh: "不用" },
  ],
}
```

Each one needs at least 2 replies.

## 4. Adding a scene

1. Add a file in `src/content/scenes/` with `export default { … } satisfies Scene`.
2. Add the id to `SceneId` in `src/content/types.ts`.
3. Place it in `SCENES` in `src/content/scenes/index.ts` by importance (this is the home screen order).
4. If you need a new icon, add a 24×24 line SVG to `ICONS` in `src/ui/dom.ts` (see [design.md](design.md)).
5. Update the scene list in `tests/content.test.ts`.
6. At least 12 「我要說」 (I say) phrases and 4 「對方說」 (They say) entries (at least 18 phrases for Transport).

## 5. Travel cheat sheets (Guide)

Step-by-step procedure guides, written in `src/content/guides.ts`. The page is at `#/guide/<id>`:

- `title`, `summary` (one line for the home screen list), `steps` (each step has a short title and one or two sentences), `notes` (common mistakes).
- **Always include `sources` (https) and `verified` (verification date).** Above each source, add an English comment saying which points it supports.
- Don't write rules you can't find a reliable source for. For details that change, such as amounts and deadlines, write 「以現場人員或店家的說明為準」 (Follow what on-site staff or the shop tell you).
- Related phrases link to the cheat sheet with `link`, and the cheat sheet's notes can point back to the scene.

## 6. Emergency numbers

Written in `src/content/emergency.ts`. Each entry must have: the number to dial, a Chinese name, when to call, `source` (https) and `verified` (date). Only include numbers with an official source.

## 7. Recommended tools

Written in `src/content/tools.ts`. Only recommend free apps that already do the job well (translation, maps, ride-hailing, alerts, transit cards). State clearly what each is for and what to watch out for:

- Links must be verified App Store, Google Play or official website URLs. Don't guess.
- If you can't find the URL for one of the stores, link the official website (it usually has download buttons for both).

## 8. What `npm test` blocks

- Markup that fails to parse, kanji or letters/numbers without readings, readings that aren't kana, full-width spaces, 「は」 or 「を」 not separated.
- Duplicate ids or ids that aren't kebab-case; phrase ids that don't start with the scene id.
- Missing Chinese; phrases that don't end in polite form.
- A slot without a `fallback`; unknown slot names; slots left in the fallback.
- Fewer than 2 answers; using an answer set that doesn't exist.
- Missing scene groups, phrases without a group, empty groups.
- Too few phrases in a scene; Transport missing required phrases.
- Emergency numbers or travel cheat sheets without an https source or verification date.
- Recommended tools without a purpose or without an https link.

## 9. Verification rules

- **Emergency, medical and procedural information must be verified** against official sources (government, railway companies, airports). News and blogs are only leads.
- Code comments give the source URL and verification date. With several sources, say which point each one supports.
- If the official website is unreachable, you can use official content quoted in search results, but say so in the comment.
- Before each travel season, recheck content with older `verified` dates.
- If you're not sure, leave it out and ask the traveller to check with on-site staff instead.

## 10. Wording

- This is a service for everyone: don't use terms aimed at a specific age group, such as 「長輩」 (elders).
- No emoji.
- Use arrow characters for directions (→ ← ↑).
