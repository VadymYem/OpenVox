import { access, readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';

const routes = [
  '',
  'studio',
  'academy',
  'practice',
  'instruments',
  'track-lab',
  'mixer',
  'audio-lab',
  'progress',
  'transcribe',
  'analyze',
  'score',
  'choir',
  'projects',
  'settings',
  'privacy',
  'about'
];
const dist = resolve('dist');
const expectedBase = process.env.OPENVOX_BASE || '/';
const normalizedBase = expectedBase === '/' ? '/' : `/${expectedBase.replace(/^\/+|\/+$/g, '')}/`;
const publicUrl = (process.env.OPENVOX_PUBLIC_URL || 'https://vadymyem.github.io/OpenVox').replace(/\/+$/, '');

async function walk(path, visitor) {
  const entries = await readdir(path, { withFileTypes: true });
  for (const entry of entries) {
    const full = resolve(path, entry.name);
    if (entry.isDirectory()) await walk(full, visitor);
    else await visitor(full, entry.name);
  }
}

const required = [
  ...routes.map((route) => (route ? `${route}/index.html` : 'index.html')),
  '404.html',
  '.nojekyll',
  'wasm/openvox_dsp.wasm',
  'worklets/audio-processor.js',
  'pro-lab/dsp-library.js',
  'pro-lab/pro-audio-lab.js',
  'icons/openvox-180.png',
  'icons/openvox-192.png',
  'icons/openvox-512.png',
  'openvox-icon.svg',
  'manifest.webmanifest',
  'sitemap.xml',
  'robots.txt',
  'sw.js'
];

for (const file of required) await access(resolve(dist, file));

const html = await readFile(resolve(dist, 'index.html'), 'utf8');
if (html.includes('%BASE_URL%')) throw new Error('Unresolved Vite base token found in index.html.');
if (!html.includes(`<link rel="canonical" href="${publicUrl}/" />`))
  throw new Error('Home canonical URL is incorrect.');
if (!html.includes('https://www.googletagmanager.com/gtag/js?id=G-6LN7QL6SP2'))
  throw new Error('Google Analytics loader is missing from the production HTML.');
if (!html.includes("gtag('config', 'G-6LN7QL6SP2')"))
  throw new Error('Google Analytics measurement configuration is missing from the production HTML.');
if (!html.includes('data-theme="system"'))
  throw new Error('System theme bootstrap is missing from the production HTML.');
if (!html.includes("primary === 'uk' ? 'uk' : primary === 'de' ? 'de' : 'en'"))
  throw new Error('Automatic interface-language bootstrap is missing from the production HTML.');

const assetDir = resolve(dist, 'assets');
const assetFiles = await readdir(assetDir);
const appBundleName = assetFiles.find((name) => name.startsWith('index-') && name.endsWith('.js'));
if (!appBundleName) throw new Error('Application JavaScript bundle is missing.');
const appBundle = await readFile(resolve(assetDir, appBundleName), 'utf8');
if (!appBundle.includes(normalizedBase) || !appBundle.includes('pro-lab/dsp-library.js'))
  throw new Error('Pro Audio Lab DSP path does not use the configured Pages base.');
if (!appBundle.includes('pro-lab/pro-audio-lab.js'))
  throw new Error('Pro Audio Lab runtime path is missing from the application bundle.');

const manifest = JSON.parse(await readFile(resolve(dist, 'manifest.webmanifest'), 'utf8'));
if (manifest.start_url !== normalizedBase || manifest.scope !== normalizedBase) {
  throw new Error(`PWA base path is incorrect (${manifest.start_url}, ${manifest.scope}).`);
}

const serviceWorker = await readFile(resolve(dist, 'sw.js'), 'utf8');
if (!serviceWorker.includes(`const BASE=${JSON.stringify(normalizedBase)}`))
  throw new Error('Service worker base path is incorrect.');
if (!serviceWorker.includes('/wasm/') || !serviceWorker.includes('/worklets/') || !serviceWorker.includes('/pro-lab/'))
  throw new Error('Service worker runtime revalidation rules are incomplete.');
if (serviceWorker.includes('workbox'))
  throw new Error('Unexpected Workbox runtime detected in the custom service worker.');

const scoreHtml = await readFile(resolve(dist, 'score/index.html'), 'utf8');
if (!scoreHtml.includes('<title>Score Editor — OpenVox Studio</title>'))
  throw new Error('Score route SEO title was not generated.');
if (!scoreHtml.includes(`${publicUrl}/score/`)) throw new Error('Score route canonical URL is incorrect.');

const sitemap = await readFile(resolve(dist, 'sitemap.xml'), 'utf8');
if (!sitemap.includes(`${publicUrl}/studio/`)) throw new Error('Sitemap does not contain the Pages public URL.');

const unexpectedWorkboxFiles = [];
await walk(dist, async (full, name) => {
  if (/^workbox-.*\.js$/i.test(name)) unexpectedWorkboxFiles.push(relative(dist, full));
});
if (unexpectedWorkboxFiles.length)
  throw new Error(`Unexpected Workbox files found: ${unexpectedWorkboxFiles.join(', ')}`);

const sourceMaps = [];
await walk(dist, async (full, name) => {
  if (name.endsWith('.map')) sourceMaps.push(relative(dist, full));
});
if (sourceMaps.length) throw new Error(`Source maps should not be deployed: ${sourceMaps.join(', ')}`);

const wasmSize = (await stat(resolve(dist, 'wasm/openvox_dsp.wasm'))).size;
if (wasmSize < 500) throw new Error('WASM DSP module appears unexpectedly small.');

console.log(
  `Build verification passed: ${routes.length} routes, GitHub Pages base ${normalizedBase}, PWA assets, Pro Audio Lab and WASM verified.`
);
