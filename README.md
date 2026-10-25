# Alchemist's Cauldron

A browser-based potion brewing game developed for the RS School Qualifying Stage.

## Game Goal

Combine magical ingredients to create potions that match the required Temperature, Density, and Magic Power ranges.

Earn points for successful potions while managing limited ingredients, time, and lives.

## Project Stages

- Precondition 1: Project setup and development tooling
- Level 1: Basic playable game
- Level 2: Difficulty selection and save/continue
- Level 3: Advanced gameplay and visual feedback

## Technology Stack

- TypeScript
- Vite
- SCSS
- Native DOM
- pnpm

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Create a production build:

```bash
pnpm build
```

## Status

The Start Screen is implemented with TypeScript, native DOM, and SCSS. Figma
provides individual artwork, fonts, and colors; the final responsive layout is
custom rather than a copy of the original frame.

- Desktop (1024px and wider): compact header, three empty circular inventory slots on
  either side of a centered bronze cauldron, and Help / Start Game / Menu below.
- Tablet (768px to 1023px): centered cauldron, primary action, three-column
  inventory in two rows, then Help and Menu.
- Mobile (375px to 767px): title and zero-valued counters, cauldron,
  Start Game, a two-column inventory, then Help and Menu. The page scrolls normally.

The laboratory covers the full browser width. CSS stonework, an arch, columns,
separate candle sconces, and restrained emerald illumination form the environment.
The desktop UI adapts to viewport height and stays compact on taller screens;
its background continues to fill the viewport. All controls fit at 1024 x 768,
1440 x 768, 1720 x 800, and 1920 x 1080 without vertical scrolling.

Each of the six circular inventory slots is an independent recessed HTML/CSS frame. There
are no visible ingredient names, icons, stock values, or statistics before play.
Hidden content reserves fields for a future expanded detail area containing an
icon, name, Temperature, Density, Magic Power, and stock badge. Expansion behavior
is deliberately deferred to gameplay implementation. No ingredient or brewing logic is implemented.

Asset audit: no composite interface image is used. The transparent cauldron PNG,
frame SVGs, counter icons, circular control ornaments, and candle
SVGs are separate local assets in `public/assets`. The original cauldron scales
without cropping or distortion, with separate empty layers for future contents
and magical effects. The wooden workbench has been removed; a CSS contact shadow
and restrained emerald/bronze light ground the cauldron instead. Ingredient slots
use shared circular-frame styling with thin bronze rings and diamond ornaments,
not six separate images. Desktop diameters range from 120px to 144px. Obsolete
rectangular-frame styles, placeholder assets, and workbench artwork are removed.

Help and Menu open accessible native dialogs. Escape dismisses a dialog and focus
returns to its trigger, including after navigation between panels. Help explains
ingredient stock, recipe ranges, brewing, lives, and the end-of-run conditions.

Menu provides Easy, Medium, and Hard selection (Medium by default), New Game,
Continue Game when a valid unfinished save exists, and a leaderboard. Difficulty
is remembered locally; every setting comes from the official difficulty table in
`src/data/difficulty.ts`. Choosing difficulty does not populate the shelf or
change the initial zero-valued counters.

The leaderboard reads actual local results per difficulty, sorts by descending
score and then earlier date, and shows the Top-10 with name, score, difficulty,
and date (`DD.MM.YYYY HH:MM`). Invalid entries are ignored. Clearing scores needs
an in-panel confirmation and affects only the selected difficulty. There are no
fabricated sample scores. Unavailable or malformed storage never crashes the UI.

### Run integration

The playable run is the next implementation step. Menu actions use these bubbling
events on `#app`; they do not simulate brewing or create fake saves:

- `game:start`: the existing event, now with `detail` containing
  `{ mode: 'new', difficulty, settings }`. Both Start Game and Menu's New Game
  use the same path. The run module should create its initial state and call
  `saveGame` to replace any previous save only once initialization succeeds.
- `game:continue`: `detail` contains `{ difficulty, settings, state }`.
  The validated state is returned with `status: 'paused'`; its saved stock and
  remaining time are preserved. It uses the saved difficulty, independently of
  the choice for a new game.

`src/storage/save.ts` exports `saveGame`, `loadGame`, `clearSave`, and the
`SavedGame` type. The schema includes difficulty, status, score, timeLeft, lives,
activeRecipe, cauldronIngredients, and shelfStock. Continue rejects finished,
exhausted, or malformed states. The new run module will own autosave and lifecycle
updates. Initial Time and Score remain zero, and no life icons are rendered on
the Start Screen.

Storage keys are `alchemists-cauldron:difficulty`, `alchemists-cauldron:save`, and
`alchemists-cauldron:leaderboard:easy|medium|hard`. Leaderboard entries use
`{ name, score, date }`, where `date` is a numeric timestamp. The run's end-of-game
module will submit results; the menu currently reads and clears them safely.

Run all quality checks:

```bash
pnpm build
pnpm lint
pnpm exec prettier --check .
pnpm exec stylelint "src/**/*.{css,scss}"
```

To review, run `pnpm dev` and use browser responsive mode at 375 x 812,
768 x 1024, 1024 x 768, 1440 x 768, 1720 x 800, and 1920 x 1080.
Verify empty circular slots, local artwork, keyboard focus, Help/Menu dialogs, and the
absence of a horizontal page scrollbar.
