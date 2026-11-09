# Four-language localization

This feature makes the existing game usable in English (`en`), Amharic (`am`),
Kazakh (`kk`), and Russian (`ru`). English is the default and fallback. Localization
was chosen to improve access to the game while learning typed internationalization,
Unicode typography, safe preferences, and separation of presentation from game state.

## Implementation and data flow

- `src/i18n/locales/en.ts` defines grouped messages and the canonical key structure.
  `am.ts`, `kk.ts`, and `ru.ts` implement the same `Dictionary` type. Groups cover
  common controls, menu, leaderboard, Help, game, pause, results, ingredients,
  recipes, and reactions. Every dictionary ships in the JavaScript bundle.
- `src/i18n/types.ts` derives dotted `TranslationKey` names and required parameter
  names from English templates using mapped and template literal types. For example,
  `game.lives` requires `count` and `total`.
- `src/i18n/index.ts`: `t` formats plain text; `message` renders an escaped span;
  `attribute` renders escaped accessible attributes; `setMessage` and
  `setAttributeMessage` bind existing DOM elements. Bindings retain the key and
  parameters in `data-i18n*` attributes. `clearMessage` removes obsolete bindings.
  `textBinding` allows valid text-only `<option>` elements without nested markup.
- `ref` retains a translation key inside a dynamic sentence. A saved-run summary
  references its difficulty; active reactions reference their canonical IDs. Those
  names are translated again when the language changes, rather than remaining in
  the previous language. Whole sentence templates determine word order.
- `renderLanguageSelector` supplies labelled native selectors in the menu, pause,
  and game-over dialogs. Native-script language names remain recognizable in every
  locale. `bindLocalization` handles their delegated change event and disposal.
- `setLanguage` changes the presentation preference, updates `<html lang>` and the
  browser title, resolves current text/attribute bindings, synchronizes selectors,
  and emits `languagechange`. Leaderboard dates retain the required fixed
  `DD.MM.YYYY HH:MM` format in every language; timestamps and player names stay intact.
- Subsequent render helpers use the current language immediately. The existing
  `game:exit` event refreshes the detached Start button when it is restored.
  No polling, translation fetches, DOM observer, framework, or runtime dependency
  is required.

Flow: selector → `setLanguage` → preference + document language → existing bindings
→ translated text and attributes. Gameplay continues through its existing controller.

## State, persistence, and fallback

The localization module never imports the game controller, changes its state,
resets its clock, or calls gameplay actions. Switching language updates text nodes
and attributes without replacing controls, dialogs, forms, or their input values.
The pause dialog stays open, and gameplay resumes through the existing Resume action.
Opening pause still pauses the game normally; changing language does not add a reset.

The preference key is `alchemists-cauldron:language`, with a JSON language code.
`loadLanguage` validates the stored value and uses the existing safe JSON storage
helpers. Missing, invalid, corrupt, or inaccessible preferences select English.
Failed writes leave the new language active for the current session and show a
localized warning. Saves, leaderboard keys, canonical IDs/names, recipes, stock,
scoring, and reaction calculations retain their original formats and behavior.

`template` falls back to the English message when a localized entry is missing or
empty. Compilation requires complete dictionaries; terminal checks additionally
compare keys and placeholder sets. `entityKey` validates IDs against known dictionary
keys. Developer exceptions remain diagnostic English; they are not player messages.

## Typography and alternatives

`src/styles/_localization.scss` adds wrapping for translated content, native select
styling consistent with the existing panels, and smaller text within fixed decorative
title/start/counter areas for non-English locales. Font tokens and existing font
shorthands respect the language font. Cyrillic uses system serif fallbacks; Amharic
uses a bundled variable Noto Sans Ethiopic font with more generous card line heights.
The original artwork, animations, layout structure, and game rules are preserved.

Font source: [Google Fonts Noto Sans Ethiopic](https://github.com/google/fonts/tree/main/ofl/notosansethiopic).
`public/assets/NotoSansEthiopic.ttf` is distributed with its SIL Open Font License
in `public/assets/NotoSansEthiopic-OFL.txt`. It is served locally, with no font-service
request at runtime. It adds approximately 1.14 MB of font data.

A full i18n library would provide richer pluralization and tooling, but would add a
runtime dependency to this small native DOM application. Component rerendering was
avoided because it could disturb open dialogs, focus, and player input. Translating
canonical game data would couple presentation to persistence, so display names are
looked up by IDs instead. Labels use neutral count forms where practical rather than
a general pluralization engine. Dates use the original fixed local-time format.

## Verification and manual review

Permitted checks: `pnpm build`, `pnpm lint`, `pnpm exec prettier --check .`,
`pnpm exec stylelint "src/**/*.{css,scss}"`, `pnpm test:unit`, and `git diff --check`.
`tests/i18n.test.mjs` checks all dictionaries, canonical name coverage, placeholders,
fallback, preference failures, escaping, and binding updates using lightweight stubs.
Existing unit tests check the game's original calculations and persistence behavior.
These checks do not establish rendered layout, screen-reader behavior, or complete
browser integration. No local browser suite or new Playwright tests were run/added.
The existing GitHub Actions Quality workflow remains intact.

Preview this feature locally:

```sh
git switch feat/creative-localization
pnpm install --frozen-lockfile
pnpm build
pnpm preview --host 127.0.0.1
```

Open the URL printed by Vite (normally `http://127.0.0.1:4173/`). The existing
[public deployment](https://abnzrdev.github.io/alchemists-cauldron/) is not a verified
deployment of this branch. This feature does not change or publish GitHub Pages.

Manual acceptance checklist:

- [ ] In Menu, cycle English → አማርኛ → Қазақша → Русский. Check title, summaries,
      difficulty names, buttons, Help, accessible names, and native select operation.
- [ ] Refresh after each choice; confirm language persistence and correct document lang.
- [ ] Start each difficulty. Add ingredients, inspect stats/Hard tooltips, recipe names,
      target ranges, mixture order, stock, lives, and reaction messages.
- [ ] Pause with a nonempty mixture, note the recipe, stock, score and exact time,
      switch language repeatedly, and confirm the dialog stays open and values remain.
      Resume, brew, and pour out; newly rendered text must use the selected language.
- [ ] Return to the start screen; confirm its restored Start button uses the language.
- [ ] Reload a saved run and continue it in a different language without rerolling it.
- [ ] At Game Over, type a player name, change language, and confirm the name and form
      remain. Check validation, save result, leaderboard filtering/dates, and clear
      confirmation. Existing player names must never be translated.
- [ ] Test desktop and narrow mobile layouts, long ingredient names, Ethiopic glyphs,
      keyboard focus, screen-reader labels, and visible dialogs. Add screenshots to PR.
- [ ] With only the language preference removed, invalid, or malformed, reload and
      confirm English. With storage blocked, confirm the localized warning and that
      the game remains usable; test using a disposable browser profile.

Native-speaker review is advisable for all three translations, especially Amharic
fantasy/alchemy terminology and Kazakh phrasing. Translations were authored directly;
no dedicated translation MCP service was configured. Manual layout and linguistic
review remain pending. PWA installation and offline launch are documented separately
in [pwa-offline.md](pwa-offline.md).

## Five-to-ten-minute presentation

1. **One minute:** explain access for four language communities and why this fits the
   Creative Extension. Show the existing game in English and another language.
2. **Two minutes:** show the dictionary groups and derived keys in `src/i18n/types.ts`.
   Explain `game.success` placeholders and `ref` for translated difficulty/reaction names.
3. **Two minutes:** pause a mixture and switch languages. Show preserved state and
   the selector → bindings data flow; point to `setLanguage` and `bindLocalization`.
4. **One minute:** explain safe localStorage, fallback, escaping, and local fonts.
5. **One-to-two minutes:** demonstrate leaderboard names/dates and discuss terminal
   checks, manual/native-speaker review, alternatives, and known limitations.

Possible curator questions:

- **Does changing language change saved recipes?** No. Canonical data stays unchanged;
  UI code resolves localized names from IDs. The preference has its own storage key.
- **Why not replace English words in the DOM?** Complete sentence templates preserve
  context and grammar. Bindings retain keys and values, not a guessed reverse mapping.
- **How do you avoid restarting a run?** The language handler has no access to game
  state or the clock. It changes only text, attributes, document language, and preference.
- **What if storage fails?** Reads fall back to English. Failed writes keep the selected
  language in memory, show a warning, and leave existing save/score storage untouched.
- **What if a translator misses a variable?** Placeholder comparison fails the focused
  test; missing keys also fail TypeScript. Runtime missing translations use English.
- **Does this support offline installation?** No. Dictionaries and fonts are bundled,
  but offline loading/installability requires the separately reviewed PWA phase.
- **Have all languages been browser-tested?** No. Terminal checks passed; the owner
  performs the requested browser review, and native speakers should review wording.
