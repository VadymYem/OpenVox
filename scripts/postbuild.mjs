import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';

const dist = resolve('dist');
const templatePath = resolve(dist, 'index.html');
const template = await readFile(templatePath, 'utf8');
const publicUrl = (process.env.OPENVOX_PUBLIC_URL || 'https://vadymyem.github.io/OpenVox').replace(/\/+$/, '');
const configuredBase = process.env.OPENVOX_BASE || '/';
const base = configuredBase === '/' ? '/' : `/${configuredBase.replace(/^\/+|\/+$/g, '')}/`;
const today = new Date().toISOString().slice(0, 10);
const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf8'));

const pages = {
  studio: [
    'Voice Studio',
    'Real-time pitch detection, note recognition, microphone calibration, recording and harmony analysis directly in your browser.'
  ],
  academy: [
    'Vocal Academy',
    'Structured vocal training with pitch matching, breath pacing, ear training, rhythm work, sight singing and session planning.'
  ],
  instruments: [
    'Instrument Workshop',
    'Chromatic and instrument tuning, alternate tunings, custom string sets, reference tones and optional MIDI monitoring.'
  ],
  mixer: [
    'Local Multitrack Mixer',
    'Mix imported audio and microphone takes locally with gain, pan, mute, solo, timing offsets, loops and offline WAV export.'
  ],
  'track-lab': [
    'Backing Track Lab',
    'Practice with local backing tracks using pitch-preserving speed control, A–B loops, rehearsal markers and live voice monitoring.'
  ],
  'audio-lab': [
    'Professional Audio Lab',
    'Advanced local microphone routing, DSP, dynamics, generators, visual analysis and offline audio inspection.'
  ],
  progress: [
    'Practice Progress',
    'Track local training sessions, weekly goals, accuracy and category balance without an account.'
  ],
  practice: [
    'Practice Studio',
    'Create vocal exercises, automatic transposition, microphone scoring, teacher share links and portable exercise files.'
  ],
  transcribe: [
    'Voice to Score',
    'Turn live singing or an imported audio file into editable musical notes with local on-device analysis.'
  ],
  analyze: [
    'Vocal Analysis',
    'Measure vocal range, pitch stability and vibrato characteristics locally in your browser.'
  ],
  score: [
    'Score Editor',
    'Edit, quantize, transpose, preview and export vocal scores as MusicXML, MIDI, SVG, PNG or print-ready PDF.'
  ],
  choir: [
    'Choir Studio',
    'Import MIDI or MusicXML, isolate rehearsal parts, select passages, change tempo and score live part practice.'
  ],
  projects: [
    'Local Projects',
    'Manage private OpenVox projects, recordings and portable .openvox archives stored on your own device.'
  ],
  settings: [
    'Settings',
    'Configure language, theme, accessibility, tuning reference, audio processing and analytics preferences for OpenVox Studio.'
  ],
  privacy: ['Privacy', 'Learn how OpenVox Studio processes microphone audio and project data locally on your device.'],
  about: [
    'About OpenVox Studio',
    'OpenVox Studio is an open-source, privacy-first browser toolkit for singers, teachers, choirs and musicians by AuthorChe.'
  ]
};

function replaceTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

function withSeo(html, route, title, description) {
  const pageTitle = route ? `${title} — OpenVox Studio` : 'OpenVox Studio — Your voice. Understood.';
  const url = route ? `${publicUrl}/${route}/` : `${publicUrl}/`;
  let output = html;
  output = replaceTag(output, /<title>[^<]*<\/title>/, `<title>${pageTitle}</title>`);
  output = replaceTag(
    output,
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${description}" />`
  );
  output = replaceTag(output, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
  output = replaceTag(
    output,
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${pageTitle}" />`
  );
  output = replaceTag(
    output,
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${description}" />`
  );
  output = replaceTag(
    output,
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${url}" />`
  );
  output = replaceTag(
    output,
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${pageTitle}" />`
  );
  output = replaceTag(
    output,
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${description}" />`
  );
  output = output.replace(/"url":\s*"https:\/\/[^\"]+\/OpenVox(?:-Studio)?\/"/, `"url": "${publicUrl}/"`);
  output = output.replace(/"url":\s*"https:\/\/authorche\.top\/openvox\/"/, `"url": "${publicUrl}/"`);
  return output;
}

const homeDescription =
  'OpenVox Studio is a privacy-first browser studio for real-time pitch detection, vocal education, instrument tuning, audio rehearsal, music transcription, score editing and choir practice. Your voice stays on your device.';
await writeFile(templatePath, withSeo(template, '', 'OpenVox Studio', homeDescription));

for (const [route, [title, description]] of Object.entries(pages)) {
  const target = resolve(dist, route);
  await mkdir(target, { recursive: true });
  await writeFile(resolve(target, 'index.html'), withSeo(template, route, title, description));
}

await copyFile(templatePath, resolve(dist, '404.html'));

const routes = ['', ...Object.keys(pages)];
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map((route, index) => {
    const url = route ? `${publicUrl}/${route}/` : `${publicUrl}/`;
    const priority =
      index === 0 ? '1.0' : ['studio', 'academy', 'practice', 'instruments'].includes(route) ? '0.9' : '0.7';
    return `  <url><loc>${url}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
  }),
  '</urlset>',
  ''
].join('\n');
await writeFile(resolve(dist, 'sitemap.xml'), sitemap);
await writeFile(resolve(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${publicUrl}/sitemap.xml\n`);
await writeFile(resolve(dist, '.nojekyll'), '');

const manifest = {
  name: 'OpenVox Studio',
  short_name: 'OpenVox',
  description:
    'Private, local-first voice training, audio analysis, instrument tuning, transcription and rehearsal studio.',
  id: base,
  start_url: base,
  scope: base,
  display: 'standalone',
  display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
  orientation: 'any',
  theme_color: '#030712',
  background_color: '#030712',
  lang: 'en',
  categories: ['music', 'education', 'utilities'],
  icons: [
    { src: `${base}icons/openvox-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: `${base}icons/openvox-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    { src: `${base}openvox-icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
  ],
  shortcuts: [
    {
      name: 'Voice Studio',
      short_name: 'Studio',
      url: `${base}studio/`,
      icons: [{ src: `${base}icons/openvox-192.png`, sizes: '192x192', type: 'image/png' }]
    },
    {
      name: 'Vocal Academy',
      short_name: 'Academy',
      url: `${base}academy/`,
      icons: [{ src: `${base}icons/openvox-192.png`, sizes: '192x192', type: 'image/png' }]
    },
    {
      name: 'Instrument Workshop',
      short_name: 'Tuner',
      url: `${base}instruments/`,
      icons: [{ src: `${base}icons/openvox-192.png`, sizes: '192x192', type: 'image/png' }]
    }
  ]
};
await writeFile(resolve(dist, 'manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);

async function walkFiles(directory, files = []) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const full = resolve(directory, entry.name);
    if (entry.isDirectory()) await walkFiles(full, files);
    else files.push(full);
  }
  return files;
}

const cacheableExtensions = new Set([
  '.html',
  '.js',
  '.css',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.json',
  '.wasm',
  '.xml',
  '.txt',
  '.webmanifest'
]);
const allFiles = await walkFiles(dist);
const cacheEntries = [];
for (const file of allFiles) {
  const rel = relative(dist, file).split(sep).join('/');
  if (rel === 'sw.js' || rel.endsWith('.map') || rel === '.nojekyll') continue;
  const extension = rel.includes('.') ? rel.slice(rel.lastIndexOf('.')).toLowerCase() : '';
  if (!cacheableExtensions.has(extension)) continue;
  const info = await stat(file);
  cacheEntries.push({ rel, size: info.size });
}
cacheEntries.sort((a, b) => a.rel.localeCompare(b.rel));
const revision = createHash('sha256')
  .update(packageJson.version)
  .update(JSON.stringify(cacheEntries))
  .digest('hex')
  .slice(0, 12);
const precache = cacheEntries.map(({ rel }) => `${base}${rel}`);
const serviceWorker = `const CACHE_NAME=${JSON.stringify(`openvox-${packageJson.version}-${revision}`)};
const CACHE_PREFIX='openvox-';
const BASE=${JSON.stringify(base)};
const PRECACHE=${JSON.stringify(precache)};
const INDEX=BASE+'index.html';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(PRECACHE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
async function networkFirst(request){const cache=await caches.open(CACHE_NAME);try{const response=await fetch(request);if(response&&response.ok)await cache.put(request,response.clone());return response;}catch(error){return (await cache.match(request))||(request.mode==='navigate'?await cache.match(INDEX):undefined)||Promise.reject(error);}}
async function cacheFirst(request){const cache=await caches.open(CACHE_NAME);const cached=await cache.match(request);if(cached)return cached;const response=await fetch(request);if(response&&response.ok)await cache.put(request,response.clone());return response;}
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;const runtimeStable=url.pathname.includes('/wasm/')||url.pathname.includes('/worklets/')||url.pathname.includes('/pro-lab/');event.respondWith(request.mode==='navigate'||runtimeStable?networkFirst(request):cacheFirst(request));});
`;
await writeFile(resolve(dist, 'sw.js'), serviceWorker);
