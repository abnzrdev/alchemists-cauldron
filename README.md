# Alchemist's Cauldron

A TypeScript + Vite + SCSS + native DOM game for RS School. Level 1 (US 1.1–1.6) is implemented; Level 2 and Level 3 are not.

## Play

Start Game or Menu > New Game starts a fresh run at the difficulty selected in Menu (Medium by default):

- Six ingredients, each with independent random stock of 2–15. Click a card or focus it and press Enter/Space to spend one stock and add a portion. Exhausted slots stay empty and disabled.
- The cauldron holds at most four ingredients and preserves addition order. Active cards show icon, name, Temperature, Density, Magic Power and stock directly.
- Three bars show summed values, including negatives, with recipe target zones. Brew requires a nonempty mixture. All three sums must be inside their target ranges expanded by ±8.
- Success earns 200 points and 10 seconds, capped at 150, clears the mixture and picks another Medium recipe. Failure loses one life and clears the mixture. Neither restores stock.
- A run starts at 02:30 with three lives. It ends when time or lives reach zero, or when both shelf and cauldron are empty. An empty shelf still permits brewing the final mixture.
- Pause freezes time and conceals the field. Resume preserves recipe, stock and mixture; Exit to Menu discards the run. Hidden tabs pause automatically and require explicit Resume. Help also pauses a run.
- Game Over shows the reason and score. Qualifying results prompt for a 2–15 character name: letters, digits, spaces, underscore or hyphen.
- One Top-10 per difficulty persists locally, sorted by score descending and then earlier result date. Open it from Menu or Game Over. Clear Leaderboard uses an in-app confirmation. Storage errors produce a safe empty view or retry message.

Before starting, six circular frames and the cauldron are empty, Time and Score are 0, and no lives appear. Help opens the rules. Easy, Medium and Hard are selectable before play. Saved-run continuation is pending US 2.2. There are no Level 1 chemical reactions.

## Run locally

Use Node.js 24 and pnpm 12.15.0, pinned in package.json.

```bash
pnpm install
pnpm dev
```

Build with `pnpm build` and preview with `pnpm preview`. Relative production URLs support GitHub project Pages and local preview. The Deploy Level 1 workflow publishes story-2.

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

Review at 375 × 812, 768 × 1024, 1024 × 768, 1440 × 768, 1720 × 800 and 1920 × 1080. Desktop places three slots per side and Help / primary action / Menu across the bottom. Tablet uses three inventory columns; mobile is cauldron-first with two inventory columns and normal vertical scrolling. No horizontal page scrolling is intended from 375px to 1920px.

## Structure and assets

- src/data/: exact ordered eight-ingredient catalogue, twenty recipes and settings. Level 1 uses the first six ingredients and seven Medium recipes. Moon Mist is Easy.
- src/logic/: stock, sums, ranges, brewing, timestamp clock and end conditions.
- src/state/: immutable transitions, pause and application orchestration. main.ts initializes bindings and cleanup.
- src/ui/: native markup, rendering, accessible dialogs, meters and result entry.
- src/storage/: guarded JSON storage and one list under `alchemists-cauldron:leaderboard:level-1`. Earlier saved-run helpers remain preparatory Level 2 interfaces, not an implemented Continue feature.
- src/styles/: SCSS modules and shared tokens, keyboard focus and reduced-motion support.
- public/assets/: separate local fonts, ornaments, SVG symbols, counter/control artwork and transparent bronze cauldron PNG.

No flattened UI image is used. The full-width laboratory uses CSS architecture, gradients, individual candles and lighting. Cauldron, slots, counters and buttons remain independent. Approved empty circular frames are preserved before play; active cards expand for readable statistics. No runtime UI framework or router is used. Playwright is development-only.

## Official references

[Game README and catalogues](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/README.md) · [Common requirements](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/common-requirements.md)

Task specifications: [US 1.1](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_1.1.md), [US 1.2](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_1.2.md), [US 1.3](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_1.3.md), [US 1.4](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_1.4.md), [US 1.5](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_1.5.md), [US 1.6](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/user_story_1.6.md).

[Figma individual-artwork reference](https://www.figma.com/design/1Na01N57qT50ngfEQArtwo/Alchemist-s-Cauldron?node-id=7-3948)

The upstream task checkout stays outside this repository in sibling rsschool-qualifying-stage. Task PRs merge into story-2. The final story-2 → story-1 PR and existing story-1 → main PR remain open for review.

## Difficulty settings (US 2.1)

| Setting          | Easy      | Medium    | Hard     |
| ---------------- | --------- | --------- | -------- |
| Shelf / capacity | 4 / 4     | 6 / 4     | 8 / 5    |
| Time / lives     | 180 / 5   | 150 / 3   | 150 / 3  |
| Tolerance        | 12        | 8         | 5        |
| Reward / bonus   | 100 / 15s | 200 / 10s | 300 / 5s |

The Medium rules described above remain the Level 1 rules. Each difficulty uses its own official recipe pool and leaderboard. The table adds a Difficulty column and filter. Existing Level 1 results remain in the Medium list; clearing one list preserves the others. Difficulty is remembered locally and locked during a run. Reaction counts remain in configuration for Level 3; no reactions run in Level 2.
