# Interface brief implementation

Source: owner's 24-page “המעבדה של מישה — הצעות שיפור לממשק, משחקיות ודו־לשוניות”.

- Preserve existing games, saved sessions, XP and question banks.
- Separate interface language from question/answer translations; Hebrew first with Russian help on demand, configurable by teacher.
- Keep Hebrew **without niqqud**, per owner's explicit response.
- Compact home, daily five-station mission, all-game thirteen-station journey, three game shelves.
- Reusable typography/color/motion tokens and component styles; readable translations and reduced motion.
- Rank progress, truthful badge progress, weekly activity and non-punitive session rewards.
- Companion, optional synthesized sounds, touch numeric keypad and clear exercise actions.
- Manual SVG art only. **Approval gate:** first four stickers and thinking expression, at 512px and 64px alongside the original character; owner approval before remaining twenty stickers and cheering/sleepy expressions (brief pages 17, 23–24). Use existing icons until approval.

The owner approved the first four stickers and thinking expression: “מאשר, המשך באותו סגנון”. The complete 24-sticker set and remaining expressions were then drawn and integrated. The approved sample remains in `artifacts/art-sheet-approved-sample.png`; the full review is `design/art-review.html`.

## Editing

- Questions, options, hints and facts: existing game generators; the Atlas question bank remains `atlas/questions.json`, with its original 80 fixed questions, 10 rounds, source links and separate save key. Regenerate its JS using the existing Atlas bank tooling when editing JSON.
- Interface labels use `ui(P(he,ru))`; educational content uses `bi(P(he,ru))`. Preferences and word speech live in `reading-support.js`.
- Ranks, badge progress, weekly activity and sticker manifest: `rewards.js`. Modal/envelope presentation and focus management: `reward-ui.js`.
- Manual SVG art: `assets/stickers`, `assets/characters`, editable generator `scripts/build-art-set.py`. New art credits are in `assets/ATTRIBUTION.md`.
- Palette/type/motion tokens: `tokens.css`; component ownership is documented in `docs/css-architecture.md`.
- Asset cache version has one source, `release.json`. Run `node scripts/version-assets.mjs` before publishing.

## Validation

New automated checks cover four bilingual widths, on-demand translation and word speech, lossless saved-game migration, rewards and duplicate prevention, modal keyboard focus, 24 local SVG stickers, reduced motion and the compact home. Existing tests also cover full Hebrew/Russian Atlas rounds, two complete 13-game journeys, 4,000 deterministic course exercises, board puzzles, screenshots, automatic difficulty and refresh.

Browser checks use local Chromium against the exact static files published to Vercel; production deployment readiness and served files are checked separately. No claim of a human classroom test or a Hebrew niqqud review is made; the owner chose to keep Hebrew without niqqud.

 Existing copyrighted media credits and PaperCSS license must remain.
