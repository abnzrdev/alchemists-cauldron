import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { buildPwa } from '../scripts/build-pwa.mjs';

const source = await readFile(
  new URL('../scripts/service-worker.js', import.meta.url),
  'utf8',
);
const assets = [
  'index.html',
  'manifest.webmanifest',
  'assets/app-abc.js',
  'assets/game.css',
  'assets/font.ttf',
  'assets/ingredient.webp',
  'icons/app.png',
].map((path) => ({ path: `./${path}`, integrity: 'sha256-test' }));

test('precache generator uses actual output, excludes unrelated files, and versions content reproducibly', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'alchemist-pwa-'));
  try {
    for (const folder of ['assets', 'icons', 'test-results'])
      await mkdir(join(directory, folder));
    for (const { path } of assets) await writeFile(join(directory, path), path);
    for (const path of [
      'assets/game.js.map',
      'assets/LICENSE.txt',
      'test-results/report.html',
    ])
      await writeFile(join(directory, path), 'exclude');
    const initial = await buildPwa(directory);
    assert.deepEqual(
      initial.assets.map((asset) => asset.path),
      assets.map((asset) => asset.path).sort(),
    );
    const original = await readFile(join(directory, 'sw.js'), 'utf8');
    assert.deepEqual(await buildPwa(directory), initial);
    assert.equal(await readFile(join(directory, 'sw.js'), 'utf8'), original);
    await writeFile(join(directory, 'assets/ingredient.webp'), 'new artwork');
    assert.notEqual((await buildPwa(directory)).version, initial.version);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

function workerHarness(
  scope,
  { failInstall = false, storageFailure = false } = {},
) {
  const handlers = {};
  const stores = new Map();
  const prefix = `alchemists-cauldron:${scope}:`;
  stores.set(`${prefix}old`, new Map());
  stores.set('other-app:cache', new Map());
  stores.set('alchemists-cauldron:https://other.example/game/:old', new Map());
  const requests = [];
  const storedRequests = new Map();
  const unreadable = new Set();
  let claims = 0;
  let offline = true;
  const caches = {
    async keys() {
      return [...stores.keys()];
    },
    async delete(name) {
      return stores.delete(name);
    },
    async open(name) {
      if (storageFailure) throw new Error('storage unavailable');
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        async addAll(items) {
          requests.push(...items);
          if (failInstall) throw new Error('missing or mismatched asset');
          for (const request of items) {
            storedRequests.set(request.url, request);
            entries.set(
              request.url,
              new Response(`cached:${request.url}`, {
                headers: { Vary: 'Origin' },
              }),
            );
          }
        },
        async match(request, options = {}) {
          const query =
            typeof request === 'string' ? new Request(request) : request;
          const response = entries.get(query.url);
          if (!response || unreadable.has(query.url)) return undefined;
          if (!options.ignoreVary) {
            const vary = response.headers.get('Vary');
            if (
              vary
                ?.split(',')
                .some(
                  (name) =>
                    new Headers(query.headers).get(name.trim()) !==
                    storedRequests.get(query.url)?.headers.get(name.trim()),
                )
            )
              return undefined;
          }
          return response.clone();
        },
        async keys() {
          return [...entries.keys()].map((url) => new Request(url));
        },
      };
    },
  };
  vm.runInNewContext(source, {
    BUILD: { version: 'current', assets },
    URL,
    Request,
    Response,
    caches,
    self: {
      registration: { scope },
      clients: {
        async claim() {
          claims++;
        },
      },
      addEventListener(type, fn) {
        handlers[type] = fn;
      },
    },
    async fetch(request) {
      if (offline) throw new Error('offline');
      return new Response(`network:${request.url}`);
    },
  });
  async function lifecycle(type) {
    let pending;
    handlers[type]({
      waitUntil(value) {
        pending = value;
      },
    });
    await pending;
  }
  async function status(repair = false) {
    let reply, pending;
    handlers.message({
      data: { type: 'PWA_STATUS', repair },
      ports: [
        {
          postMessage(value) {
            reply = value;
          },
        },
      ],
      waitUntil(value) {
        pending = value;
      },
    });
    await pending;
    return reply;
  }
  function fetchRequest(url, mode = 'navigate', method = 'GET', headers = {}) {
    let pending;
    handlers.fetch({
      request: { url, mode, method, headers: new Headers(headers) },
      respondWith(value) {
        pending = value;
      },
    });
    return pending;
  }
  return {
    lifecycle,
    status,
    fetchRequest,
    stores,
    requests,
    caches,
    unreadable,
    prefix,
    get claims() {
      return claims;
    },
    online() {
      offline = false;
    },
  };
}

test('Vary: Origin bundle lookup succeeds offline despite different request headers; readiness checks actual retrieval', async () => {
  const scope = 'http://127.0.0.1:4173/';
  const worker = workerHarness(scope);
  await worker.lifecycle('install');
  const cache = await worker.caches.open(`${worker.prefix}current`);
  for (const path of ['assets/app-abc.js', 'assets/game.css']) {
    const url = new URL(path, scope).href;
    const request = new Request(url, {
      headers: { Origin: new URL(scope).origin },
    });
    assert.ok(
      (await cache.keys()).some((key) => key.url === url),
      'entry exists',
    );
    assert.equal(
      await cache.match(request),
      undefined,
      'default Vary matching reproduces the original miss',
    );
    assert.equal(
      await (
        await worker.fetchRequest(url, 'cors', 'GET', {
          Origin: new URL(scope).origin,
        })
      ).text(),
      `cached:${url}`,
    );
    worker.unreadable.add(url);
    assert.equal(
      (await worker.status()).ready,
      false,
      'keys alone do not prove readiness',
    );
    worker.unreadable.delete(url);
  }
  const bundle = `${scope}assets/app-abc.js`;
  worker.stores
    .get(`${worker.prefix}current`)
    .set(bundle, new Response('error', { status: 500 }));
  assert.equal(
    (await worker.status()).ready,
    false,
    'unsuccessful cached responses are not ready',
  );
  worker.stores
    .get(`${worker.prefix}current`)
    .set(bundle, new Response('bundle', { headers: { Vary: 'Origin' } }));
  assert.equal((await worker.status()).ready, true);
  assert.equal(
    worker.fetchRequest(`${bundle}?different=version`, 'cors'),
    undefined,
    'exact URL matching still applies',
  );
});

for (const scope of [
  'http://127.0.0.1:4173/',
  'https://abnzrdev.github.io/alchemists-cauldron/',
]) {
  test(`${scope}: installation, offline shell/assets, readiness, eviction and scoped cleanup`, async () => {
    const worker = workerHarness(scope);
    assert.equal((await worker.status()).ready, false);
    await worker.lifecycle('install');
    assert.equal(
      worker.claims,
      0,
      'install must not take control of an active run',
    );
    assert.ok(
      worker.stores.has(`${worker.prefix}old`),
      'old cache survives install',
    );
    assert.equal((await worker.status()).ready, true);
    for (const request of worker.requests) {
      assert.equal(request.cache, 'reload');
      assert.equal(request.redirect, 'error');
      assert.equal(request.mode, 'same-origin');
      assert.equal(request.integrity, 'sha256-test');
      assert.ok(request.url.startsWith(scope));
    }
    for (const path of ['', 'index.html?launch=installed'])
      assert.equal(
        await (await worker.fetchRequest(new URL(path, scope).href)).text(),
        `cached:${scope}index.html`,
      );
    for (const { path } of assets.filter(
      (asset) => asset.path !== './index.html',
    ))
      assert.equal(
        await (
          await worker.fetchRequest(new URL(path, scope).href, 'cors')
        ).text(),
        `cached:${new URL(path, scope).href}`,
      );
    for (const [url, mode, method] of [
      ['https://other.example/font.ttf', 'cors', 'GET'],
      [new URL('../unrelated/', scope).href, 'navigate', 'GET'],
      [new URL('not-a-game-route/', scope).href, 'navigate', 'GET'],
      [scope, 'navigate', 'POST'],
    ])
      assert.equal(worker.fetchRequest(url, mode, method), undefined);
    await worker.lifecycle('activate');
    assert.equal(worker.claims, 1);
    assert.equal(worker.stores.has(`${worker.prefix}old`), false);
    assert.ok(worker.stores.has('other-app:cache'));
    assert.ok(
      worker.stores.has('alchemists-cauldron:https://other.example/game/:old'),
    );
    worker.stores.get(`${worker.prefix}current`).delete(`${scope}index.html`);
    assert.equal((await worker.status()).ready, false);
    assert.equal((await worker.fetchRequest(scope)).type, 'error');
    worker.online();
    assert.equal(
      await (await worker.fetchRequest(scope)).text(),
      `network:${scope}`,
    );
    assert.equal(
      (await worker.status()).ready,
      false,
      'cache misses must not create partial ready versions',
    );
    assert.equal(
      (await worker.status(true)).ready,
      true,
      'online repair restores evicted files',
    );
    assert.equal(
      await (await worker.fetchRequest(scope)).text(),
      `cached:${scope}index.html`,
    );
  });
}

test('failed precache removes only the failed version and leaves the prior usable cache', async () => {
  const worker = workerHarness('https://example.test/game/', {
    failInstall: true,
  });
  await assert.rejects(worker.lifecycle('install'), /missing or mismatched/);
  assert.equal(worker.stores.has(`${worker.prefix}current`), false);
  assert.equal(worker.stores.has(`${worker.prefix}old`), true);
  assert.equal(worker.stores.has('other-app:cache'), true);
  assert.equal(worker.claims, 0);
});

test('storage failures do not claim readiness and allow ordinary network fallback', async () => {
  const worker = workerHarness('https://example.test/game/', {
    storageFailure: true,
  });
  assert.equal((await worker.status()).ready, false);
  worker.online();
  assert.equal(
    await (await worker.fetchRequest('https://example.test/game/')).text(),
    'network:https://example.test/game/',
  );
});
