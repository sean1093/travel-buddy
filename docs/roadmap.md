# Roadmap

## 1. Positioning

**The phone your family set up for you, which you take out and show people when something comes up.**

Every new feature must answer three questions. We only build it if all three answers are "yes":

1. Is it about talking to locals, or about paperwork where people get stuck?
2. Can it work offline and be prepared in advance?
3. Is it something existing free tools don't do well?

Things we don't do: free-form translation, map navigation, calling taxis, currency conversion, expense tracking and splitting, weather, trip planning, sightseeing suggestions. These are left to dedicated apps, which we introduce in 推薦的免費工具 (Recommended free tools) (see [research.md §5](research.md#5-competitor-analysis-and-expansion-review-2026-10-11)).

## 2. Versions for more countries

URLs are split by country: `…/travel-buddy/japan/`, then later `…/korea/`, `…/thailand/` and so on.

### Priority

| Priority | Country | Reason |
|---|---|---|
| 1 | South Korea | One of the most popular destinations for Taiwanese travellers; Korean is completely unreadable to them, unlike Japanese where kanji give hints, so the need is stronger |
| 2 | Thailand | Popular; Thai is unreadable; high need around doctors and allergies |
| 3 | Vietnam | Growing fast; also unreadable, and English is not widely spoken |
| On hold | France, Italy, Spain, etc. | English works to some extent and translation apps are good enough, so we add little |

### Approach: shared core + country content packs

Instead of copying the app several times, we organise the code into:

- **Shared core:** screens, show the other person, let the other person tap an answer, share links, 設定資料 (Set up info), printed cards, the travel guide framework, offline support, the design system.
- **Language modules (one per language):**
  - Markup and pronunciation: `{漢字|かな}` for Japanese; Korean and Thai need a pronunciation guide that Chinese speakers can read aloud.
  - Politeness check rules: Japanese です／ます, Korean honorifics.
  - Voice: the system voices for Japanese, Korean and Thai.
  - Thai polite particles (ครับ／ค่ะ) depend on the speaker's gender, so Thai needs an extra "speaker gender" setting.
- **Country content packs (one per country):** scene phrases, 對方說 (They say), emergency numbers, travel guides, recommended tools, rules for place name slots (for example, adding 「駅」 to station names in Japan).
- **Local storage:** each country uses its own prefix, for example `travelbuddy.japan.` for Japan.

### Steps

1. **Restructure** (without affecting current features): move the Japanese-specific code (`lib/jp.ts`, `lib/romaji.ts`, `ui/japanese.ts`, the politeness rules in the content checks) and the Japan content into a "language module + Japan content pack", and make the screens get content from the current country.
2. **Turn the root into a country picker page** (`site/index.html`), while keeping the "redirect to the Japan version with the `#`" behaviour for old links.
3. **Korea pilot:** first find a native-speaker reviewer, run the full process once, and estimate the cost per country.
4. Decide on Thailand and Vietnam based on the pilot.

### Risks

- **Content quality:** every country needs a native-speaker reviewer. Emergency and medical information must still have sources and check dates, or we lose our biggest advantage.
- **Maintenance:** rules change (like Japan's new tax refund system), so content must be checked again before each travel season.
- **Validating demand:** we deliberately added no usage tracking, so we can only learn about demand by asking users or watching community discussions.

## 3. To-do and follow-up

| Item | Details |
|---|---|
| Recheck the new tax refund system | After it starts on 2026-11-01, check the steps and notes in 「出境退稅新制」 (New tax refund system at departure) against real experience. |
| Google Play links for recommended tools | The Google Play URLs for Safety tips and GO haven't been checked yet, so the official websites are used for now. |
| Symptom names wrapping on the medical page | The screenshot environment's font is wider, so names like 「呼吸困難」 (difficulty breathing) wrap onto two lines; this needs checking on a real phone. |
| Regular checks | Before each travel season, review content in `emergency.ts`, `guides.ts` and `tools.ts` with older `verified` dates. |
