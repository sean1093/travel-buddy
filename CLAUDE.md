# CLAUDE.md

Notes for Claude Code working in this repository. Start with [`README.md`](README.md) and [`docs/README.md`](docs/README.md).

## Language

- Write code comments, commit messages, pull requests, review comments and everything under `docs/` and `README.md` in **English**.
- The app itself stays in Traditional Chinese and Japanese. When a document quotes a UI label, keep the original and add the English meaning, e.g. 我需要幫忙 (I need help).

## Checks

```bash
npm ci
npm test          # content checks, contrast (WCAG AA), unit and component tests
npm run build     # typecheck + build to dist/
CHROMIUM=/opt/pw-browsers/chromium npm run test:e2e   # browser journeys and layout matrix (after build)
```

The test plan is [`docs/testing.md`](docs/testing.md). New behaviour comes with tests at the right layer: logic in `tests/*.test.ts`, DOM behaviour in `tests/ui-*.test.ts` (happy-dom), and anything about layout, real routing, storage or offline in `e2e/`.

For any UI change, also regenerate and look at the screenshots (see [`docs/development.md`](docs/development.md)):

```bash
npm run build && npx vite preview --port 4173 &
CHROMIUM=/opt/pw-browsers/chromium NODE_PATH=$(npm root -g) node scripts/screenshots.cjs scripts/sample-profile.json docs/screenshots
```

UI changes follow [`docs/design.md`](docs/design.md); content changes follow [`docs/content-guide.md`](docs/content-guide.md). If `content-freshness.test.ts` fails, re-check the named entry against its sources and correct it before updating `verified` (content guide §9); never move the date alone, and never raise `REVERIFY_AFTER_DAYS` or push `recheckBy` back to get green. An urgent fix that hits an overdue entry re-checks that entry in the same PR. Add an entry to [`docs/changelog.md`](docs/changelog.md) for every user-visible change.

## Pull request workflow

Every change goes through a pull request, and the pull request is driven all the way to merge:

1. **Open the PR.** Work on a feature branch, push, and open a PR against `main` with an English title and description (what changed, why, how it was verified).
2. **Self-review.** Review the PR's full diff as a strict reviewer would: correctness bugs, edge cases (dark mode, the 特大 / extra-large text size, a phone held sideways, an empty profile), accessibility, consistency with `docs/design.md` and the docs. Use `/code-review` on the PR when it is available.
3. **Fix.** Fix every real finding and push. Reply on any review thread you decide not to fix, saying why.
4. **Verify.** Run `npm test`, `npm run build` and `npm run test:e2e` locally, regenerate screenshots for UI changes and look at them, and wait for CI to pass on the latest commit. Repeat steps 2–4 until the review finds nothing and CI is green.
5. **Merge.** Merge the PR into `main` with a merge commit (the repository's convention). Start the next change from the updated `main`.

Never skip or disable a test to get CI green, and never merge with CI red.
