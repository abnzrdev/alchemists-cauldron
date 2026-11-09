import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, sep, extname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));
const workerSource = new URL('./service-worker.js', import.meta.url);
const assetExtensions = new Set([
  '.js',
  '.css',
  '.svg',
  '.png',
  '.webp',
  '.ttf',
  '.woff',
  '.woff2',
  '.ico',
]);

export async function collectPrecache(directory) {
  const files = [];
  async function walk(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const path = resolve(folder, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) {
        const name = relative(directory, path).split(sep).join('/');
        if (
          name === 'index.html' ||
          name === 'manifest.webmanifest' ||
          (/^(assets|icons)\//.test(name) && assetExtensions.has(extname(name)))
        )
          files.push(name);
      }
    }
  }
  await walk(directory);
  return files.sort();
}

export async function buildPwa(directory = resolve(project, 'dist')) {
  const files = await collectPrecache(directory);
  if (
    !files.includes('index.html') ||
    !files.includes('manifest.webmanifest') ||
    !files.some((file) => file.endsWith('.js')) ||
    !files.some((file) => file.endsWith('.css'))
  ) {
    throw new Error(
      'Build the complete Vite application before generating its service worker.',
    );
  }
  const source = await readFile(workerSource, 'utf8');
  const hash = createHash('sha256').update(source);
  const assets = [];
  for (const file of files) {
    const content = await readFile(resolve(directory, file));
    hash.update(file).update('\0').update(content);
    assets.push({
      path: `./${file}`,
      integrity: `sha256-${createHash('sha256').update(content).digest('base64')}`,
    });
  }
  const version = hash.digest('hex').slice(0, 20);
  const configuration = `const BUILD = ${JSON.stringify({ version, assets })};\n`;
  await writeFile(resolve(directory, 'sw.js'), configuration + source);
  return { version, assets };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  await buildPwa();
