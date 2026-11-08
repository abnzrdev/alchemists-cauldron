import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { collectPrecache } from './build-pwa.mjs';
import { fileURLToPath } from 'node:url';

const output = new URL('../dist/', import.meta.url);
const read = (path) => readFile(new URL(path, output));
const worker = (await read('sw.js')).toString();
const build = JSON.parse(worker.match(/^const BUILD = (.+);\n/)[1]);
const paths = build.assets.map((asset) => asset.path);
assert.equal(new Set(paths).size, paths.length);
assert.deepEqual(
  paths,
  (await collectPrecache(fileURLToPath(output))).map((path) => `./${path}`),
);
for (const { path, integrity } of build.assets) {
  assert.equal(
    integrity,
    `sha256-${createHash('sha256')
      .update(await read(path))
      .digest('base64')}`,
  );
  assert.ok(!/\.map$|test-results|node_modules|\.txt$|sw\.js$/.test(path));
}
const manifest = JSON.parse(await read('manifest.webmanifest'));
assert.equal(manifest.name, "Alchemist's Cauldron");
assert.equal(manifest.short_name, 'Alchemist');
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.id, './');
assert.match(manifest.theme_color, /^#[a-f0-9]{6}$/i);
assert.match(manifest.background_color, /^#[a-f0-9]{6}$/i);
for (const size of [192, 512]) {
  const icon = manifest.icons.find((item) => item.sizes === `${size}x${size}`);
  assert.equal(icon.type, 'image/png');
  assert.equal(icon.purpose, 'any');
  const png = await read(icon.src);
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), size);
  assert.equal(png.readUInt32BE(20), size);
  assert.ok(paths.includes(icon.src));
}
const html = (await read('index.html')).toString();
assert.match(html, /rel="manifest" href="\.\/manifest.webmanifest"/);
for (const base of [
  'http://127.0.0.1:4173/',
  'https://abnzrdev.github.io/alchemists-cauldron/',
]) {
  const scope = new URL(manifest.scope, new URL('manifest.webmanifest', base));
  assert.equal(scope.href, base);
  assert.equal(new URL(manifest.start_url, scope).href, base);
  assert.equal(new URL(manifest.id, scope).href, base);
  assert.equal(new URL('sw.js', base).pathname, `${scope.pathname}sw.js`);
  for (const path of paths) {
    const url = new URL(path, scope);
    assert.equal(url.origin, scope.origin);
    assert.ok(url.pathname.startsWith(scope.pathname));
  }
  for (const [, path] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    assert.ok(paths.includes(path), `Uncached entry reference: ${path}`);
  }
  for (const asset of paths.filter((path) => path.endsWith('.css'))) {
    const css = (await read(asset)).toString();
    for (const [, path] of css.matchAll(/url\(["']?([^\s)"']+)["']?\)/g)) {
      if (path.startsWith('data:')) continue;
      const url = new URL(path, new URL(asset, scope));
      assert.ok(
        paths.some((candidate) => new URL(candidate, scope).href === url.href),
        `Uncached CSS asset: ${url}`,
      );
    }
  }
}
process.stdout.write(
  `PWA artifacts verified: ${paths.length} resources, real 192/512 PNGs, content integrity, and root/project paths.\n`,
);
