# Stylesheet ownership

The PDF interface update removes all five inline style blocks and the final theme override. `index.html` loads the following files in a fixed order:

1. `tokens.css`: the chosen **מחברת המגלים** palette, type scale, spacing, radii, motion durations, and preserved game-specific color swatches. Colors that communicate a board state remain the original colors.
2. `base.css`: local Rubik fonts, reset, shell/header, controls, language boundaries, reading support, and reduced motion.
3. `home.css`, `task.css`, `puzzles.css`, `learning-games.css`, `atlas/atlas.css`, `session-flow.css`, `journey-passport.css`: component rules, including the identity rules that previously lived in `identity-theme.css`.

Add a named token for a new color or font size before using it in a component. Existing `--swatch-*` tokens retain the original diagrams and board colors; the named `--paper`, `--ink`, `--primary`, `--accent`, `--text-secondary`, and `--sheet` tokens are the interface palette. Use `--fs-*` for text sizes and `--t-*` for CSS motion. Interface text has a 14px minimum; question headings remain at least 20px with 1.5 line height.

`.bi` is for bilingual learning content. It stacks Hebrew and Russian along the same edge on small screens. Core question headings use two columns above 900px, with a divider between them. Interface labels come from `ui()` and do not stack two languages inside the same button. `[hidden]` is authoritative so a grid layout cannot accidentally reveal inactive game shelf panels.

`tests/css-architecture.cjs` checks loading order, the selected palette, centralized CSS colors/type/motion values, and custom property references. `tests/bilingual.cjs` checks actual language layouts. `tests/motion.cjs` checks that reduced motion stops browser animations and retains a readable mobile prompt. The remaining game and visual tests still cover the playable interfaces.
