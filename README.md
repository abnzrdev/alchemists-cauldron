# Alchemist's Cauldron

Artwork review branch: `feat/ingredient-art-potion-liquid`. This follow-up is not published until owner approval. It uses the ten supplied optimized `web-ready/` WebPs from `alchemists-cauldron-ingredient-and-liquid-assets.zip`: eight standalone ingredient illustrations in `public/assets/ingredients/`, plus the emerald liquid and success splash in `public/assets/effects/`. Ingredient buttons retain their native interactions, readable information and accessible names. Start Screen slots remain empty and unchanged. The superseded ingredient SVG and success texture are removed.

The liquid appears only for a nonempty mixture, including paused continuation, and disappears after brewing, pouring out or a reaction that empties the cauldron. A clipped foreground layer reuses the existing cauldron image URL to keep its front rim above the liquid; no duplicate cauldron file is added. Gentle CSS ripples and bubbles pause with the run and respect reduced motion. The new splash plays only after a successful brew. Failure and chemical-reaction textures remain unchanged, as do game rules and save data.

Success combines inner light, rising bubbles, a summoning circle and golden motes; failure combines the eruption texture with the existing controlled shake. Pressure Spike/Steam Burst use blue steam, Black Ice uses the purple vortex, and Magma Flux/Volatile Mix use red eruption. Visuals observe existing activation transitions without changing game rules, finish through CSS animation events and support reduced motion. Native gameplay cards, readable statistics, stock badges and Help/Menu icons remain intact. Menu hides both Continue and its summary when no valid unfinished save exists; valid continuation still opens paused.

A TypeScript + Vite + SCSS + native DOM game for RS School. Levels 1, 2 and all six Level 3 stories are implemented. The approved modular dark fantasy interface is preserved.

## Play

Start Game or Menu > New Game starts a fresh run at the difficulty selected in Menu (Medium by default):

- Four, six or eight ingredients by difficulty, each with independent random stock of 2 to 15. Click, drag into the cauldron, or focus a card and press Enter/Space to spend one stock. Exhausted slots stay empty and disabled.
- The cauldron holds four ingredients on Easy/Medium or five on Hard and preserves addition order. Cards retain icon, name and stock. Easy/Medium show the three statistics directly; Hard shows them in an accessible hover/focus tooltip.
- Three bars show reaction-adjusted values, including negatives, with recipe target zones. Brew requires a nonempty mixture and checks all three values against the selected tolerance (8 on Medium).
- Success earns the selected reward and time bonus, capped at that difficulty's start time (Medium: 200 points, +10 seconds, cap 150). It clears the mixture and picks another recipe from the selected difficulty. Failure loses one life and clears the mixture. Neither restores stock.
- Starting time and lives follow the difficulty table below (Medium: 02:30 and three lives). It ends when time or lives reach zero, or when both shelf and cauldron are empty. An empty shelf still permits brewing the final mixture.
- Pause freezes time and conceals the field. Resume preserves recipe, stock and mixture; Exit to Menu discards the run. Hidden tabs pause automatically and require explicit Resume. Help also pauses a run.
- Game Over shows the reason and score. Qualifying results prompt for a 2–15 character name: letters, digits, spaces, underscore or hyphen.
- One Top-10 per difficulty persists locally, sorted by score descending and then earlier result date. Open it from Menu or Game Over. Clear Leaderboard uses an in-app confirmation. Storage errors produce a safe empty view or retry message.

Before starting, six circular frames and the cauldron are empty, Time and Score are 0, and no lives appear. Help opens the rules. Easy, Medium and Hard are selectable before play. Continue Game restores a valid unfinished save in paused state. There are no chemical reactions in Level 1 or Level 2.

## Run locally

Use Node.js 24 and pnpm 12.15.0, pinned in package.json.

```bash
pnpm install
pnpm dev
```

Build with `pnpm build` and preview with `pnpm preview`. Relative production URLs support GitHub project Pages and local preview. The Deploy Game workflow supports story-3 and story-4; the shared public game is https://abnzrdev.github.io/alchemists-cauldron/.

## Verify

```bash
pnpm build
pnpm lint
pnpm exec prettier --check .
pnpm exec stylelint "src/**/*.{css,scss}"
pnpm exec playwright install chromium
pnpm test
```

`pnpm test:unit` runs pure logic and storage tests with Node's test runner. `pnpm test:browser` runs Playwright interactions. On Windows, PLAYWRIGHT_CHROMIUM_EXECUTABLE may point to an installed Chromium browser. CI installs Chromium. Screenshots/reports stay in ignored test-results/ and playwright-report/.

Review at 375 × 812, 768 × 1024, 1024 × 768, 1440 × 768, 1720 × 800 and 1920 × 1080. Desktop places two, three or four active cards per side according to difficulty and Help / primary action / Menu across the bottom. Tablet uses three inventory columns; mobile is cauldron-first with two inventory columns and normal vertical scrolling. No horizontal page scrolling is intended from 375px to 1920px.

## Structure and assets

- src/data/: exact ordered eight-ingredient catalogue, twenty recipes and settings. Level 1 uses the first six ingredients and seven Medium recipes. Moon Mist is Easy.
- src/logic/: stock, sums, ranges, brewing, timestamp clock and end conditions.
- src/state/: immutable transitions, pause and application orchestration. main.ts initializes bindings and cleanup.
- src/ui/: native markup, rendering, accessible dialogs, meters and result entry.
- src/storage/: guarded versioned saves and independent difficulty leaderboards. The Medium list retains `alchemists-cauldron:leaderboard:level-1` for existing Level 1 results; Easy and Hard have separate keys. Saved runs are validated against the official catalogue and selected rules.
- src/styles/: SCSS modules and shared tokens, keyboard focus and reduced-motion support.
- public/assets/: separate local fonts, ornaments, SVG symbols, counter/control artwork and transparent bronze cauldron PNG.

No flattened UI image is used. The full-width laboratory uses CSS architecture, gradients, individual candles and lighting. Cauldron, slots, counters and buttons remain independent. Approved empty circular frames are preserved before play; active cards expand for readable statistics. No runtime UI framework or router is used. Playwright is development-only.

## Official references

[Game README and catalogues](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/README.md) · [Common requirements](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/common-requirements.md)

Task specifications: [US 1.1](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_1.1.md), [US 1.2](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_1.2.md), [US 1.3](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_1.3.md), [US 1.4](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_1.4.md), [US 1.5](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_1.5.md), [US 1.6](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_1.6.md).

Level 2 specifications: [US 2.1 — Difficulty Selection](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_2.1.md), [US 2.2 — Auto-save & Continue Game](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_2.2.md).

[Figma individual-artwork reference](https://www.figma.com/design/1Na01N57qT50ngfEQArtwo/Alchemist-s-Cauldron?node-id=7-3948)

The upstream task checkout stays outside this repository in sibling rsschool-qualifying-stage. Level 2 task PRs merge into story-3. The final story-3 → story-2 PR stays unmerged, as do PR #17 (story-2 → story-1) and PR #8 (story-1 → main).

## Difficulty settings (US 2.1)

| Setting          | Easy      | Medium    | Hard     |
| ---------------- | --------- | --------- | -------- |
| Shelf / capacity | 4 / 4     | 6 / 4     | 8 / 5    |
| Time / lives     | 180 / 5   | 150 / 3   | 150 / 3  |
| Tolerance        | 12        | 8         | 5        |
| Reward / bonus   | 100 / 15s | 200 / 10s | 300 / 5s |

Medium preserves the Level 1 rules. Each difficulty uses its own official recipe pool and leaderboard. The table adds a Difficulty column and filter. Existing Level 1 results remain in the Medium list; clearing one list preserves the others. Difficulty is remembered locally and locked during a run. Reaction counts remain in configuration for Level 3; no reactions run in Level 2.

## Auto-save and Continue (US 2.2)

A single unfinished game is saved after ingredient selection, Brew, pause and resume, with timestamp-based time checkpoints once per displayed second. Page hiding pauses and checkpoints the run. The saved fields are difficulty, status, score, remaining time, lives, active recipe, ordered ingredients and exact stock. No running deadline or interval is restored.

Open Menu after reload and choose Continue Game when a valid save exists. It opens paused; Resume starts a fresh deadline from the saved remaining time, so time spent away does not drain the paused run. Changing the next-game difficulty does not alter a continued game. A new game replaces the old save. Exit to Menu and Game Over clear it.

Storage uses alchemists-cauldron:save with a versioned envelope. Missing, malformed, outdated, finished or invalid catalogue data is rejected and removed safely. Unavailable storage never blocks play; a visible message reports when progress cannot be saved. Exact numbers and data come from the official difficulty and recipe tables.

## Level 3 reaction policy (US 3.3)

The owner authorized choosing fixed subsets because the official documents specify only counts. These selections are a project decision, not an official RS School clarification:

- Easy: none.
- Medium: Pressure Spike and Steam Burst.
- Hard: Volatile Mix, Magma Flux and Black Ice.

All 15 official reactions live in a typed, tested catalogue. Enabled triggers read unmodified ingredient totals; simultaneous value effects apply in catalogue order to freshly calculated values. Values are never accumulated into ingredient data. Time/life penalties and clearing occur only on inactive-to-active transitions. The previous ordered mixture determines activation, so continuing a save does not replay penalties; clearing the mixture permits later reactivation. Bars and Brew use the same adjusted values. Help describes the enabled effects.

Click or drag a stocked ingredient into the cauldron. Easy/Medium retain directly visible statistics; Hard shows base statistics on hover or focus while retaining the stock badge. Before play, the six circular slots remain empty.

## Full game controls and review

- Pour Out clears a nonempty mixture for exactly 10 seconds, without losing a life or refunding stock. It is disabled while empty or paused.
- During active play, keys 1 through 8 select ingredients in shelf order, B brews, X pours out and P pauses. Resume with the native Resume button or Escape. Start, paused, Game Over and typing contexts do not process gameplay shortcuts.
- Correct/incorrect brews show short CSS effects, failures shake the padded interface, and ingredient icons float gently. Reduced motion disables shaking/floating and shortens the brew effect. Existing smooth bars and target glow remain.
- Task PRs merge into story-4. The final story-4 to story-3 PR stays open for Cross-Check, alongside PRs #8, #17 and #21. Screenshots are attached manually by the owner; RS App submission is not automated.

[US 3.1](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_3.1.md) | [US 3.2](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_3.2.md) | [US 3.3](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_3.3.md) | [US 3.4](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_3.4.md) | [US 3.5](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_3.5.md) | [US 3.6](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_3.6.md)

Level 3 adds 115 story points (20 + 15 + 35 + 10 + 20 + 15). The official overview states a maximum of 393; its common-requirements subtotal arithmetic is inconsistent (the Level 1 row lists 170 + 30 + 58 while displaying 228). We retain the official maximum and assess only the additional Level 3 stories here.
