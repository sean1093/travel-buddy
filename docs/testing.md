# Test plan

How TravelBuddy is tested, what each layer is responsible for, and what still needs a person with a real phone.

## What can go wrong, and how badly

The app is opened in a hurry: lost on a platform, at a pharmacy counter, in a taxi. Testing effort follows the cost of a failure.

| Risk | Example | Severity | Covered by |
|---|---|---|---|
| Wrong or unreadable emergency information | A wrong 110/119 number, a help card without the hotel, Japanese that breaks mid-word | Critical | Content tests, card tests, e2e help journey |
| Information that was right but has gone stale | A tax refund rule that changed, an office phone number that moved | Critical | `content-freshness.test.ts` (fails PRs when re-verification is overdue, including `@checked` source comments), `freshness.test.ts` (the rules), weekly `freshness` workflow (opens an issue 30 days ahead) |
| A screen that can't be used under stress | A button cut off at 特大 (extra-large) text, text clipped when the phone is turned sideways, an overlay the back button can't close | Critical | Component tests, e2e layout matrix |
| Data loss or leaks | Settings or the profile lost after a reload; share links that break or carry more than they should | High | Store and codec tests, e2e share journey |
| Works online only | The service worker doesn't cache the app | High | e2e offline journey |
| Speech fails silently | No Japanese voice, an engine that never fires `end` | Medium | Speech unit tests, manual device check |
| Visual drift from the design language | Outlines, two solid buttons on one screen, low contrast | Medium | Contrast test, screenshots, review |

## Test layers

| Layer | Tool | Location | Runs | What it proves |
|---|---|---|---|---|
| Content and logic | Vitest (Node) | `tests/*.test.ts` | `npm test`, CI `check` | Phrase markup, emergency numbers and sources, cards, share-link codec, phone numbers, romaji, storage, speech queueing, settings parsing |
| Components | Vitest + happy-dom | `tests/ui-*.test.ts` | `npm test`, CI `check` | Each screen renders the right controls for its data; overlays trap focus and close on back/Escape; toggles, counts and ARIA states |
| Browser journeys | Playwright (Chromium, Pixel 7) | `e2e/*.spec.ts` | `npm run test:e2e`, CI `e2e`, and before every deploy | Real routing, storage, share link round trip, service worker offline, layout at every size and theme |
| Visual review | `scripts/screenshots.cjs` | `docs/screenshots/` | By hand for UI changes | What a person sees; judged by eye in review |
| Device checks | Playwright, fake speech engine | `e2e/device.spec.ts` | With the e2e suite | Speech requests, voice choice, install and offline, sideways, print size, share links, screen-reader text |
| Manual device check | Real iPhone and Android phones | — | Before a release that touches speech, install or sharing | What a browser can't: real voices, the install prompt, messenger apps, real screen readers, Safari |

Rules of thumb:

- Test behaviour the user can see: text, roles, `aria-*` states, links. Assert a class only when the class *is* the behaviour (for example `sticky`, `.speaking`).
- One reason per test. Name it as a sentence about behaviour ("the back button closes only the top layer").
- Logic tests stay in Node. A DOM test opts in with `// @vitest-environment happy-dom` on its first line.
- Layout (sizes, overflow, sticky positions) is only trusted from Playwright: happy-dom does no layout.
- A test that finds a real bug is never weakened to pass. Fix the bug in the same PR, or mark the test `it.fails` / `test.fail()` with a comment and open an issue.

## Coverage by feature

| Feature | Logic | Component | e2e |
|---|---|---|---|
| Home: greeting, first use, today's places, scene links | `home.test.ts` | `ui-pages.test.ts` | first-run journey, layout matrix |
| 我需要幫忙 (I need help) card and call dock | `cards.test.ts` | `ui-pages.test.ts` | help journey |
| Scenes: 我要說 (I say) / 對方說 (They say), destination picker, phrase page | `content.test.ts`, `fill.test.ts` | `ui-scene.test.ts` | transport and konbini journeys |
| 給對方看 (Show them), 給對方點選 (Let them tap) | — | `ui-overlay.test.ts` | transport journey |
| Japanese text, ruby, romaji, play buttons | `jp.test.ts`, `romaji.test.ts` | `ui-japanese.test.ts` | — |
| Speech | `speech.test.ts` | `ui-japanese.test.ts` | — (device check) |
| Medical, allergy and symptom cards | `cards.test.ts`, `content.test.ts` | `ui-pages.test.ts` | medical journey |
| Setup, share and import | `profile.test.ts`, `codec.test.ts` | — | share journey |
| Settings: text size, theme, voice | `state.test.ts`, `summary.test.ts` | — | settings journey |
| Storage | `store.test.ts` | — | settings and share journeys |
| Routing, unknown routes | — | — | routing journey |
| Offline | — | — | offline journey |
| Colours | `contrast.test.ts` | — | layout matrix (dark) |

## Layout matrix

`e2e/layout.spec.ts` opens every main route with the sample profile at:

- phone 390×844
- narrow 320×640
- 特大 (extra-large) text
- dark theme
- landscape 844×390

It also opens the full-screen layers at each variant: the phrase page, 給對方點選 (Let them tap), 給對方看 (Show them) and 萬用句 (All-purpose phrases).

For each case it checks three things:
- The page must not scroll sideways.
- Every visible button and link must have an accessible name.
- Tappable targets must be at least 44px tall. This covers the page header, the content and any open layer.

## Running the tests

```bash
npm test                 # logic and component tests
npm run test:coverage    # the same, with a coverage summary (HTML in coverage/)
npm run build && npm run test:e2e   # browser journeys against the built site
```

In the Claude Code cloud environment, Chromium is already installed. Point Playwright at it instead of downloading:

```bash
CHROMIUM=/opt/pw-browsers/chromium npm run test:e2e
```

On another machine, install it once:

```bash
npx playwright install chromium
```

## Device checks

`e2e/device.spec.ts` automates every part of the old manual checklist that a browser can check, so it runs in CI and before every deploy:

| Check | What the test proves | What it can't prove |
|---|---|---|
| Play, then slow | Speech is requested in Japanese (ja-JP) at the normal rate, then the slow rate. The best Japanese voice is used, never an English one. The second play stops the first. | How the voice sounds (a fake speech engine records the requests) |
| Voice choice | Only Japanese voices are offered; the choice survives a reload and is used | — |
| Install and offline | The manifest and icons are valid for Add to Home Screen. With the network off, a scene and the help card still open. | The real install prompt and home-screen icon |
| Sideways | On 給對方看 (Show them), the play buttons sit in the top bar and the Japanese is large and starts in view | — |
| Print | Wallet cards are 85.6×54 mm (folded cards span two slots, 112 mm) and their cut lines line up. The sample trip fits one A4 sheet, without the page title or any controls; a longer trip continues on a second sheet. On a 320 px phone the preview keeps true-size cards with nothing clipped, and only the card area scrolls sideways. | The printer's own scaling |
| Share link | The link uses only URL-safe characters, is under 2,000 characters, and imports every field in a fresh browser | How a messenger app previews or rewrites the link |
| Screen reader | One h1, every control named, the dialog labelled with focus on 關閉 (Close). All Japanese is marked `lang="ja"`, and the furigana is not read aloud. | What VoiceOver or TalkBack actually say |

## Manual device check

What's left needs a real phone. Do this before a release that touches speech, printing, install or sharing. Use one iPhone (Safari) and one Android phone (Chrome); CI only runs Chromium.

1. Play a phrase, then slow. It sounds like a natural Japanese voice, with no English accent.
2. Add to the home screen. The icon and name look right, and the app opens full screen from the icon.
3. Send a share link through LINE and Messages, then tap it there. The import screen appears.
4. Use VoiceOver or TalkBack on the home page and a phrase page. Each control is announced with its label, and Japanese is read once, in a Japanese voice.
5. On Safari, repeat the sideways and print checks once by eye: Safari isn't covered by CI.

## When a test fails in CI

- **Content test:** the message names the phrase id and rule. Fix the content; never relax the rule to fit.
- **Contrast test:** pick a token value that passes in both themes.
- **e2e:** download the `playwright-report` artifact from the failed run. It has a trace of each failed test (open it with `npx playwright show-trace`).
- **Flaky test:** don't retry it until it passes. Find the race (usually waiting on a timer or an animation) and wait on the condition instead.
