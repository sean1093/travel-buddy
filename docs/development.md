# Development and deployment

## Environment

- Node.js 20.19+ or 22.12+ (CI uses 24).
- The only runtime dependencies are `fflate` (share link compression) and `qrcode-generator` (QR codes). No framework; the DOM is built with `h()` from `src/ui/dom.ts`.
- Vite + TypeScript (strict) + Tailwind CSS 3 + Vitest.

```bash
npm install
npm run dev      # local development (http://localhost:5173)
npm test         # content checks and unit tests
npm run build    # type check → build the Japan version into dist/japan/ → copy the root redirect page to dist/index.html
npm run preview  # preview the build (the server root is the Japan version)
```

## Project structure

```
src/
  main.ts                route table (PAGES), registers the service worker
  state.ts               settings (font, colour, voice), applied to <html>
  style.css              design tokens (light/dark), print CSS
  lib/
    jp.ts                parsing of the Japanese markup {漢字|かな}, slots $dest/$stop/$hotel
    romaji.ts            romanisation
    speech.ts            Web Speech API: pick a voice, speak phrases, detect missing Japanese voices
    store.ts             localStorage access (prefix travelbuddy.japan.)
    phone.ts             phone number normalisation (Taiwan +886, 010-886 from Japan, domestic Japan)
  profile/
    profile.ts           Profile type, parseProfile, current hotel, today's plan
    cards.ts             contents of the help card, back-to-hotel card, medical card, allergy card
    fill.ts              replaces slots with station or hotel names, with a fallback when there's no data
    summary.ts           summary of each section on the settings page
  share/
    codec.ts             Profile ⇄ short-key JSON ⇄ compressed ⇄ URL
    qr.ts                QR code SVG
  content/               all text content (see content-guide.md)
    types.ts             types such as Phrase, Heard, Scene, Preset
    scenes/*.ts          one file per scene; index.ts sets the order on the home page
    replies.ts           preset answer sets (yes/no, platform, direction, time, place, exit)
    rescue.ts            all-purpose phrases
    medical.ts           chronic conditions, drug allergies, food allergies, diets, symptoms
    emergency.ts         emergency numbers (with sources and check dates)
    guides.ts            travel guides (with sources and check dates)
    tools.ts             recommended free tools and links
    validate.ts          content check rules (run by npm test)
  ui/
    dom.ts               h(), fill(), line icons ICONS, pictogram(), button styles
    layout.ts            page(), heading(), section(), fixed bottom bar dock()
    overlay.ts           full-screen overlays: show the other person, let the other person tap an answer
    japanese.ts          Japanese display (furigana + romaji), play / slow buttons
    lines.ts             extra lines on cards (phone numbers don't wrap)
    home.ts help.ts hotel.ts scene.ts medical.ts guide.ts
    settings.ts setup.ts share.ts import.ts print.ts voice-help.ts
public/
  sw.js                  offline cache (network first for pages, cache first for assets)
  manifest.webmanifest   PWA settings
  favicon.svg icon-*.png apple-touch-icon.png
site/
  index.html             redirect page at the site root (later becomes a country picker)
tests/                   unit, content and component tests (Vitest)
e2e/                     browser journeys and layout matrix (Playwright)
scripts/
  screenshots.cjs        phone-size screenshots
  sample-profile.json    sample data for screenshots
docs/                    documentation (see docs/README.md)
.github/workflows/
  ci.yml                 PRs and non-main branches: test + coverage + build, and e2e
  pages.yml              push to main: test + build + deploy to GitHub Pages
```

## Routes

All routes live after the `#` in the URL, and assets use relative paths (`base: "./"` in `vite.config.ts`), so the site works under any subpath. The route table is in `src/main.ts`. For a description of each page, see [spec.md §4](spec.md#4-pages-and-routes).

## Tests

The full test plan (risks, layers, coverage by feature, manual device check) is in [testing.md](testing.md).

```bash
npm test                 # logic and component tests (Vitest)
npm run test:coverage    # the same, with coverage (HTML report in coverage/)
npm run build && npm run test:e2e   # browser journeys (Playwright) against the built site
```

In the Claude Code cloud environment, run e2e with `CHROMIUM=/opt/pw-browsers/chromium npm run test:e2e` instead of downloading a browser.

`npm test` runs:

| Test file | What it checks |
|---|---|
| `content.test.ts` | All content rules (see [content-guide.md §8](content-guide.md#8-what-npm-test-blocks)), and that every recommended tool has an https link |
| `contrast.test.ts` | Reads the design tokens in `src/style.css`; every text/background pair is ≥ 4.5:1 in both light and dark (WCAG AA) |
| `theme-color.test.ts` | The browser-bar colour in `src/state.ts` and `index.html` matches `--paper` in both themes |
| `codec.test.ts` | Share links round-trip unchanged; broken, truncated or oversized data doesn't cause errors; size budget for typical data |
| `profile.test.ts` | parseProfile, current hotel, today's plan |
| `cards.test.ts` | Contents of the help card, medical card, allergy card and back-to-hotel card |
| `fill.test.ts` | Slots in phrases filled from the profile, fallbacks, answer sets |
| `jp.test.ts` `romaji.test.ts` | Markup parsing, slots, romanisation |
| `phone.test.ts` | Phone number normalisation |
| `store.test.ts` `state.test.ts` | Versioned local storage that survives bad data and blocked storage; settings parsing |
| `speech.test.ts` | Voice ranking, voice status, speaking, interrupting, safety timeout (fake speech engine) |
| `home.test.ts` `summary.test.ts` | Home page greeting, settings page summaries |
| `site.test.ts` | The root redirect page goes to `./japan/` and keeps the `#` |
| `ui-overlay.test.ts` | Full-screen layers: stacking, inert page, Escape and back button, focus trap and return; 給對方看 (Show them) and 給對方點選 (Let them tap) |
| `ui-japanese.test.ts` | Ruby and romaji rendering, play buttons and their speaking state |
| `ui-scene.test.ts` | Scene pages: tabs, phrase page actions, heard cards, destination picker, 萬用句 (All-purpose phrases) |
| `ui-pages.test.ts` | Home, page header, medical symptom picker, help page and call buttons |

The `ui-*` files run in happy-dom (`// @vitest-environment happy-dom`); the rest run in Node.

`npm run test:e2e` runs `e2e/journeys.spec.ts` (first run, help, ask and answer, heard reply, symptoms, share and import, settings, unknown routes, offline) and `e2e/layout.spec.ts` (every main route at 390 px, 320 px, extra-large text, dark and landscape: no sideways scroll, accessible names, 44 px targets).

## Screenshots

`docs/screenshots/` holds 390×844 phone screenshots (plus landscape, dark and extra-large text). When you change a screen, regenerate them and look at every one:

```bash
npm run build
npx vite preview --port 4173 &
CHROMIUM=/path/to/chrome NODE_PATH=$(npm root -g) node scripts/screenshots.cjs scripts/sample-profile.json docs/screenshots
```

In the Claude Code cloud environment, Chromium is at `/opt/pw-browsers/chromium`. The script also checks for page errors and horizontal scrolling at phone width. To add a screenshot, add an entry to `SHOTS` in `scripts/screenshots.cjs`.

## Deployment

On a push to `main`, `pages.yml` tests, builds, then deploys `dist/` to GitHub Pages. The first time, in the repo go to **Settings → Pages → Source** and choose **GitHub Actions**, and check that **Settings → Environments → github-pages** allows deploys from `main`.

### URLs and countries

```
https://sean1093.github.io/travel-buddy/            root: site/index.html, redirects to ./japan/ keeping the #
https://sean1093.github.io/travel-buddy/japan/      Japan version (dist/japan/)
https://sean1093.github.io/travel-buddy/japan/#/s/1.<data>   share link
```

- The root redirect page keeps everything after the `#`, so share links that point at the root can still import data.
- When there is a second country, the root becomes a country picker page (see [roadmap.md](roadmap.md)).

### Local storage

| key | Contents |
|---|---|
| `travelbuddy.japan.profile` | Traveller data (Profile, version 1) |
| `travelbuddy.japan.settings` | Font size, colour, voice |

All country versions share one domain (`sean1093.github.io`), so each version uses its own prefix (`STORE_PREFIX` in `src/lib/store.ts`). `index.html` reads the settings key directly before the page appears, so if you change the prefix, change both places.

The offline cache is named `travel-buddy-v1` (`public/sw.js`). On activation it only clears this app's own old caches (names starting with `travel-buddy-`), so other projects on the same domain are not affected.

### Renaming the repo

If you rename the repo later:

1. GitHub → Settings → General → Repository name.
2. Update the remote URL locally: `git remote set-url origin <new URL>`.
3. Deploy again: push a commit to `main`, or go to Actions → pages and click **Run workflow**. Check that the new URL opens.
4. GitHub Pages does not redirect automatically, so the old URL and old share links will stop working.

## Workflow

Every change follows the same process. Issues, PRs and commit messages are always in English:

1. **Open an issue:** explain why, the scope and the acceptance criteria.
2. **Develop:** make changes on a working branch; check any facts in the content and add sources.
3. **Self-check:** `npm test`, `npm run build`, regenerate the screenshots and look at them.
4. **Open a PR:** say clearly what changed and how you verified it, with `Closes #<issue>`.
5. **Review:** go through the diff item by item and fix any problems; post the result as a comment on the PR.
6. **Merge after CI passes:** `main` deploys automatically.

The first line of a commit message says what was done. The body says why.
