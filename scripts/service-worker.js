// BUILD is injected from actual production output by build-pwa.mjs.
const SCOPE = new URL(self.registration.scope);
const CACHE_PREFIX = `alchemists-cauldron:${SCOPE.href}:`;
const CACHE_NAME = `${CACHE_PREFIX}${BUILD.version}`;
const URLS = BUILD.assets.map((asset) => new URL(asset.path, SCOPE).href);
const PRECACHED = new Set(URLS);
const ENTRY = new URL('./index.html', SCOPE).href;
// Only used for the exact, integrity-verified URLs in this version's precache.
// Bundle requests can send Origin while installation requests do not (Vary: Origin).
const matchPrecached = (cache, url) => cache.match(url, { ignoreVary: true });
const precache = (cache) =>
  cache.addAll(
    BUILD.assets.map(
      (asset) =>
        new Request(new URL(asset.path, SCOPE), {
          cache: 'reload',
          mode: 'same-origin',
          redirect: 'error',
          integrity: asset.integrity,
        }),
    ),
  );
let repair;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        // addAll rejects unsuccessful responses. Failed versions never replace the old cache.
        await precache(cache);
      } catch (error) {
        await caches.delete(CACHE_NAME);
        throw error;
      }
      // Deliberately no skipWaiting: an update must not take over an active run.
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME,
          )
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== 'GET' ||
    url.origin !== SCOPE.origin ||
    !url.pathname.startsWith(SCOPE.pathname)
  )
    return;
  // This game has no client-side routes. Only its two entry URLs are app navigations.
  const navigation =
    request.mode === 'navigate' &&
    (url.pathname === SCOPE.pathname ||
      url.pathname === new URL(ENTRY).pathname);
  if (!navigation && !PRECACHED.has(url.href)) return;
  event.respondWith(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const cached = await matchPrecached(
          cache,
          navigation ? ENTRY : url.href,
        );
        // Keep a version's HTML with its own bundles, including after a deployment.
        if (cached) return cached;
      } catch {
        /* If storage fails, the ordinary online website remains usable. */
      }
      try {
        return await fetch(request);
      } catch {
        return Response.error();
      }
      // Cache misses do not write partial versions or unsuccessful network responses.
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'PWA_STATUS' || !event.ports[0]) return;
  event.waitUntil(
    (async () => {
      let ready = false;
      try {
        const cache = await caches.open(CACHE_NAME);
        const complete = async () => {
          const responses = await Promise.all(
            URLS.map((url) => matchPrecached(cache, url)),
          );
          return responses.every((response) => response?.ok);
        };
        ready = await complete();
        if (!ready && event.data.repair === true) {
          // Refill evicted files when requested online, without deleting any usable entries.
          repair ??= precache(cache).finally(() => {
            repair = undefined;
          });
          await repair;
          ready = await complete();
        }
      } catch {
        /* Storage can be unavailable or evicted. Never claim readiness then. */
      }
      event.ports[0].postMessage({
        type: 'PWA_STATUS',
        ready,
        version: BUILD.version,
      });
    })(),
  );
});
