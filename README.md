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

Level 1 uses Medium settings exclusively. Easy/Hard and saved-run continuation are reserved for Level 2 and unavailable in the menu. The start screen stays empty until Start Game or Menu?s New Game emits the existing game:start event.

### Ingredient shelf and cauldron (US 1.1)

The first six entries of the full eight-ingredient catalogue become readable native button cards during a run. Each shows its icon, name, signed Temperature, Density, Magic Power, and independently generated stock (2?15). Adding spends one unit and preserves exact addition order, including repeated ingredients. Exhausted slots remain empty and disabled. Four ingredients block further selections; clearing a mixture preserves spent stock. Brewing, parameter bars, the timer, pause, and score submission are subsequent Level 1 tasks.

Pure state transitions live in src/state/game-state.ts, stock generation in src/logic/stock.ts, and DOM presentation in src/ui/shelf.ts. Local SVG symbols supply independent ingredient icons. The approved empty circular frames are restored when returning to the start screen.

Automated verification: pnpm test:unit and pnpm test:browser (Playwright). Install the browser once with pnpm exec playwright install chromium. On Windows, PLAYWRIGHT_CHROMIUM_EXECUTABLE can point to an installed Chromium browser. Responsive browser tests cover 375?1920px and save review screenshots in ignored test-results/.

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

### Cauldron bars (US 1.2)

Three accessible meters show exact ingredient sums, including negative values. Symmetric scales center zero, mark the current value, and display the current Medium recipe target zone. Markers transition smoothly without replacing their DOM nodes, with reduced-motion support. Green glow indicates the unexpanded recipe range. The complete official 20-recipe table is stored locally; Level 1 selects only its seven Medium rows. Brew integration follows in US 1.3.

### Recipe and brewing (US 1.3)

The current recipe panel shows its fantasy name, three target ranges, and live ingredient counter. Select one to four ingredients and press Brew. All three sums must fall inside the target ranges expanded by the fixed Medium tolerance of 8. Success awards 200 points, adds 10 seconds capped at 150, clears the mix and selects another random Medium recipe. Failure spends one life and clears the mix. Neither outcome restores stock. Brew is unavailable before a run and while the mixture is empty. The countdown and final Game Over panel follow in US 1.4.

### Timer and Game Over (US 1.4)

A run begins with 02:30 and three lives. The shrinking bar and MM:SS label use timestamp differences, including delayed callbacks; below 15 seconds the timer pulses red (reduced-motion respected). Runs end for Time is up, No lives left, or Out of ingredients. An empty shelf does not end a run while a mixture can still be brewed. The Game Over dialog shows the reason and score; Play again creates fresh stock, recipe, time and lives. Return to Menu restores the empty Start Screen.

### Pause (US 1.5)

Pause freezes the exact remaining time and blocks ingredient selection and brewing. The field is blurred and inert while the Resume / Exit to Menu dialog is open. Resume continues the same recipe, stock and mixture; Exit to Menu discards the run. Switching to a hidden browser tab pauses automatically and returning requires explicit Resume. Help remains available and pauses the run while the rules are read. Escape in the pause dialog resumes.
