# PWA and offline gameplay

The game can now be installed as a standalone application in supporting browsers.
After its complete production build has been cached, it can reopen and play without
reaching the server. It also remains an ordinary website. Installation and complete
offline gameplay still require the owner's manual acceptance; terminal checks alone
do not establish those browser behaviors.

## How it works

A Progressive Web App (PWA) is a website that adds capabilities such as installation
and offline access through browser standards. A web app manifest supplies the app's
identity and presentation. A service worker is a separate browser-managed script
that can respond to requests when the page or its server is unavailable.

The production data flow is:

1. `pnpm build` type-checks and builds with Vite, then runs `scripts/build-pwa.mjs`.
2. `collectPrecache` inventories the actual output: entry HTML, manifest, JavaScript,
   CSS, local fonts, SVG/PNG/WebP artwork, and installation icons. It excludes maps,
   licenses, test reports, source files, and the worker itself.
3. `buildPwa` hashes these files and the worker template to create a reproducible
   version. Each asset also gets a SHA-256 integrity value. The script writes
   `dist/sw.js` with this inventory and the `scripts/service-worker.js` logic.
4. `src/pwa/register.ts` registers `sw.js` once after page load, only for production
   in a secure, supported browser. HTTPS and loopback development origins such as
   `http://127.0.0.1:4173/` qualify. `pnpm dev` does not register a worker.
5. The worker downloads the complete version into a named cache. The Menu displays
   a localized ready message only after the controlling worker confirms all required
   resources can actually be retrieved successfully from its cache. The query can
   repair evicted entries when online.
6. The worker serves that version's cached HTML and assets. The game continues using
   its existing native DOM, gameplay logic, and localStorage data.

`public/manifest.webmanifest` defines the required name **Alchemist's Cauldron**,
short name **Alchemist**, standalone display, matching colors, and `./` for identity,
start URL, and scope. It references real 192×192 and 512×512 PNGs with purpose `any`.
Those icons resize the existing cauldron artwork against the game's green background;
they do not introduce new artwork or claim maskable support. The optional Windows
script `scripts/create-pwa-icons.ps1` regenerates them using System.Drawing.
`index.html` links the manifest and supplies a theme color; the favicon is unchanged.

## Lifecycle, caching, and updates

A cache is a local collection of request/response pairs. Browser Cache Storage is
used for application resources. It is separate from localStorage, where this game
already stores saves, difficulty, language preferences, and leaderboards. The worker
never reads, migrates, clears, or writes localStorage.

- **Install:** `precache` uses `cache.addAll` with cache-reloading, same-origin,
  redirect-rejecting requests and integrity checks. A missing file, error response,
  redirect, mismatched body, or unavailable storage rejects installation. Only the
  failed new cache is removed; an existing usable version remains.
- **Waiting:** there is no `skipWaiting`, forced reload, or update activation button.
  A successfully downloaded update waits while an older worker controls game pages.
  The Menu explains that all game tabs and installed windows should be closed before
  reopening. Keep DevTools' “Update on reload” unchecked during normal update tests.
- **Activate:** after installation and the normal browser activation rules, the worker
  removes obsolete caches belonging to this exact app scope, then claims clients.
  Another GitHub Pages project, another origin/scope, and unrelated caches are left
  alone. Initial installation can take control without restarting the game.
- **Fetch:** only same-origin GET requests inside the app's directory are considered.
  The known entry URLs (`./` and `./index.html`, with optional query strings) receive
  cached `index.html`. Listed assets are cache-first. Other routes, external requests,
  and non-GET requests are not intercepted. Cache/network failures yield normal
  network fallback or a network-error response; error responses are never cached.
- **Cache matching:** known integrity-verified resources use their exact URL with
  `ignoreVary: true` inside this version's cache. Preview responses have `Vary: Origin`;
  bundle requests can include Origin while precaching requests omit it. Default
  matching previously missed those cached bundles, causing an offline blank screen.
  This exception does not ignore URL query strings or widen the scope/asset allowlist.
- **Readiness/repair:** a `PWA_STATUS` message checks the complete cache inventory.
  It uses the same retrieval helper as fetch and requires successful responses, not
  merely listed cache keys.
  When the page requests online repair, missing entries are refilled atomically with
  the same integrity checks. Failed repair preserves existing entries and reports
  not-ready. Page-show/visibility changes recheck availability. No success is inferred
  merely from registration or `navigator.onLine`.

Vite hashes bundle filenames. Hardcoding those names would miss the next build's
bundles. Reading production output avoids that. Serving cached HTML first keeps its
bundle references with the same cached version, even after a new deployment. Integrity
checks reject files that changed partway through caching a deployment.

The cache name is `alchemists-cauldron:<registration scope URL>:<content version>`.
Updates are checked through normal browser registration with `updateViaCache: 'none'`.
An open game can remain on its older version until every controlled window closes.
After activation, later visits use the new complete cache. Saves remain compatible
because their schema and all game data are unchanged.

## Paths and limitations

Vite still uses `base: './'`. Manifest paths resolve relative to the manifest; worker
registration uses the application's relative base URL and an explicit directory
scope. Generated asset paths resolve relative to `self.registration.scope`. The same
build therefore fits both a local preview root and `/alchemists-cauldron/`. No
root-relative `/sw.js` or `/manifest.webmanifest` is used.

The build currently precaches 45 resources, roughly 4.5 MB. All four dictionaries
are bundled in JavaScript, and fonts/artwork are local. There is no runtime CDN,
translation API, backend, framework, or new runtime dependency.

Important limits:

- An initial complete online cache is necessary. An interrupted/failed first cache
  does not make the game offline-ready. Reconnect and reload to retry.
- Installation UI and eligibility vary by browser, profile policy, and device.
  Use normal Chrome/Edge controls; no custom installation prompt is implemented.
- The browser can evict caches or a user can clear site data. If files are missing,
  online repair is attempted, but offline startup cannot recover unavailable files.
  A deployed newer worker may be needed if the old version is no longer on the server.
- Clearing all site data can also erase saves/preferences/leaderboards because the
  browser removes localStorage. The application itself never clears them for updates.
- The ready indicator is a checked state, not a promise against later browser eviction.
  A cache check/repair that takes over 30 seconds reports not-ready; reopen Menu after
  returning to the game or reload online to check again.
- The game has no client-side routes, so unknown URLs do not receive an app-shell
  fallback. This avoids masking unrelated paths with the game.
- Workbox/Vite PWA plugins were considered. A small native worker and build script
  avoid an additional dependency and make lifecycle/caching decisions explicit.
  Network-first HTML and immediate activation were avoided to protect coherent asset
  versions and active runs.

## Verification performed

Terminal checks passed:

- `pnpm build` (TypeScript, Vite, production worker generation).
- `pnpm lint`, `pnpm exec prettier --check .`,
  `pnpm exec stylelint "src/**/*.{css,scss}"`, and `git diff --check`.
- `pnpm test:unit`: 67 checks, including six isolated PWA checks. These exercise
  deterministic inventory/versioning, scoped fetch behavior at root/project URLs,
  install failure, cleanup boundaries, readiness, eviction/repair, and storage failure.
  The Vary regression reproduces a default bundle lookup miss with differing Origin
  headers, verifies offline retrieval, and rejects unreadable/error cache entries as
  not-ready. It fails against the original worker and passes with the correction.
  Worker event/Cache Storage mocks run in Node; they are not browser lifecycle tests.
- `node scripts/verify-pwa.mjs`: 45 resource paths/content hashes, manifest values,
  real PNG dimensions, cached HTML/CSS references, and root/project URL resolution.
- A temporary production preview HTTP check fetched all 45 resources, verified their
  integrity, and confirmed `sw.js` is served as JavaScript. The preview was then stopped.

No local Playwright/E2E suite, browser automation, or screenshot report was run.
Existing tests and GitHub workflows remain intact; hosted Quality runs its existing
browser tests. Manual installation, offline reopening/gameplay, mobile behavior, and
update behavior remain pending. This document is not evidence that they passed.

The existing [public deployment](https://abnzrdev.github.io/alchemists-cauldron/) is
not a verified deployment of this branch. Pages still deploys only `story-3` and
`story-4`; its configuration and environment were not changed. Review through local
production preview until the owner authorizes deployment.

## Windows Chrome/Edge manual acceptance and screenshot guide

When retesting the cache-matching fix, serve the rebuilt production output online
first and let the new worker install. Close every game tab and installed window,
then reopen online before testing Offline. Do not clear site data: normal waiting
activation preserves saves. In Application, check the active worker's `BUILD.version`
against the cache-name suffix to ensure the corrected version is controlling the app.

1. Run `git switch feat/creative-pwa-offline`, `pnpm install --frozen-lockfile`,
   `pnpm build`, `node scripts/verify-pwa.mjs`, and
   `pnpm preview --host 127.0.0.1 --port 4173 --strictPort`. Open
   **http://127.0.0.1:4173/** in a normal Chrome/Edge profile. Keep this exact host/port;
   `localhost` is a different origin with separate installation/storage.
2. Press **F12 → Application → Manifest**. Check name, standalone display, scope,
   start URL, and both icons. Capture a screenshot of this panel. Under
   **Service workers**, confirm the worker URL ends in `/sw.js`, scope is the app
   directory, and status is activated/running. Leave **Bypass for network** and
   **Update on reload** unchecked. Capture this panel too.
3. Open the game's **Menu** and wait for the localized “Offline files are ready on
   this device” message. Under **Application → Cache Storage**, refresh the list and
   inspect the namespaced cache: HTML, JS/CSS, manifest, icons, fonts and artwork
   should all appear. Do not use Clear site data on a profile with valued saves.
4. Install using the address-bar install icon if shown, or the browser menu:
   Chrome **Cast, save, and share → Install…**; Edge **Apps → Install this site as
   an app** (wording varies). Confirm installation, then launch the standalone app.
   Capture the installed window with its title bar and Start/Menu screen visible.
5. In the installed window, open **F12 → Network**, choose **Offline**, then reload
   normally (**Ctrl+R**, not a cache-bypassing hard reload). Confirm the game opens
   with artwork/fonts. Capture a screenshot with the Offline setting and game visible.
6. For a genuine **closed-app offline launch**, close the app and all browser game
   tabs. Stop the local preview server with **Ctrl+C**, then reopen the installed
   game from Start. DevTools Offline is target-specific and may reset on a new
   window; stopping the preview ensures the origin server cannot serve this test.
   The cached installed game should still open. Do not rebuild while testing it.
7. Play a complete offline run: select each difficulty across separate runs, select
   and drag ingredients, use 1–8/B/X/P shortcuts, brew, trigger available reactions,
   pour out, pause/resume, reach Game Over, validate/save a result, and inspect the
   leaderboard/filter/clear confirmation. Confirm dates stay `DD.MM.YYYY HH:MM`.
8. For **Save and Continue**, pause a run with a nonempty mixture and note difficulty,
   recipe, ingredients/stock, score, and time. Close/reopen or reload offline, open
   Menu → Continue Game, and compare the restored run. **Do not use Exit to Menu**
   for this test: the existing game intentionally discards the save on explicit exit.
9. Offline, cycle **English → አማርኛ → Қазақша → Русский** using Menu or Pause.
   Inspect Help, names, tooltips, feedback, and dialogs. Confirm Ethiopic and Cyrillic
   glyphs and all artwork display. Capture offline Amharic/Kazakh/Russian evidence,
   ideally with the language selector and current game in view.
10. Restart the same preview command, set DevTools Network back to **No throttling**,
    and reload. Check normal play and retained preferences/scores. If an update is
    waiting, close **every** game tab/window, then reopen to activate it. A reload
    alone is not the prescribed update procedure. Capture any update indication.

Owner acceptance checklist (leave unchecked until performed):

- [ ] Manifest/worker/cache inspected and screenshots attached.
- [ ] Installed through Chrome/Edge and launched as a standalone window.
- [ ] Reloaded and reopened with the preview server stopped.
- [ ] Complete offline gameplay, all difficulties and controls checked.
- [ ] Saved and continued the same run offline; leaderboard behavior checked.
- [ ] All four languages, fonts, artwork, Help, and dialogs work offline.
- [ ] Connectivity restored; update lifecycle and saved data retention checked.
- [ ] Public deployment checked only after separate deployment authorization.

## Five-minute curator demonstration

1. **0:00–1:00:** explain why offline access matters, show the manifest and existing
   branding in the installed app, and identify `public/manifest.webmanifest`.
2. **1:00–2:00:** show the ready message and Cache Storage. Explain that the build
   inventories hashed bundles, local fonts/artwork, and bundled languages.
3. **2:00–3:00:** take the app offline, reload, start a run, pause and switch language.
   Explain that the same game logic runs with resources supplied by the worker.
4. **3:00–4:00:** resume saved progress and show the leaderboard. Contrast resource
   Cache Storage with gameplay localStorage. Point to lifecycle handlers in
   `scripts/service-worker.js` and the registration/readiness code.
5. **4:00–5:00:** explain waiting updates, version-specific caches, scope, failure
   handling, terminal evidence, and remaining browser limitations.

## Ten likely questions

1. **Why is it installable?** The manifest supplies identity, start/scope, display,
   and real icons; the browser provides installation controls in a secure context.
2. **What runs when the page is closed?** The browser manages the service worker's
   lifecycle and can start it for relevant events; it is not a permanent background loop.
3. **What does install do?** It precaches every resource for the generated version.
   A failed batch rejects the new installation without deleting the old usable cache.
4. **What does activate do?** It removes only obsolete caches for this exact app scope
   and allows the worker to control clients. It never clears gameplay data.
5. **How does offline navigation work?** Known app entry URLs receive cached index
   HTML. That version's listed assets are also served from its cache.
6. **Why hash assets and versions?** Vite's filenames change across builds; the
   generated inventory discovers them. Content hashes version caches and verify
   downloads so HTML and bundles do not become a mixed deployment.
7. **Why no skipWaiting?** A new worker could otherwise take over a running game
   that still uses old assets. Waiting until all game windows close avoids that.
8. **How are saves preserved?** The existing localStorage code/schema is untouched.
   Cache Storage contains resources, not scores, recipes, or language preference data.
9. **Can it affect other GitHub Pages projects?** Requests and cache cleanup are
   bounded to the registered app directory and its namespaced cache prefix.
10. **What if storage is cleared or the first visit is offline?** Required files may
    be absent, so offline startup is not guaranteed. Reconnect for a complete cache;
    manual deletion of all site data can also erase localStorage saves.

Reference: [Using service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers),
[Cache.addAll](https://developer.mozilla.org/en-US/docs/Web/API/Cache/addAll), and
[manifest scope](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/scope).
