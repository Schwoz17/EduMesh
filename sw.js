// RootPath service worker: saves the app on the phone so it opens with no internet.
// Bump VERSION when files change; phones update the next time they are online.
const VERSION = 'rootpath-v5';
const FILES = [
  './', 'index.html', 'app.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png',
  'src/content.js', 'src/algebra.js', 'src/physics.js', 'src/english.js', 'src/pcm.js',
  'src/langs.js', 'src/engine.js', 'src/pack.js', 'src/ussd.js', 'src/router.js',
  'src/call.js', 'src/sms.js', 'src/classroom.js', 'src/voice.js', 'voice/clips/index.json',
];
// Also save the recorded voice clips, so the Nigerian voices work offline too.
const saveClips = (c) => fetch('voice/clips/index.json').then((r) => (r.ok ? r.json() : [])).then((ids) => c.addAll(ids.map((id) => `voice/clips/${id}.mp3`))).catch(() => {});
self.addEventListener('install', (e) => e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES).then(() => saveClips(c))).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('rootpath-') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
// Serve from the phone first (instant, works offline); refresh the copy in the background when online.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Lists that change when new voices are added: always try the network first, use the saved copy only offline.
  if (/\/voice\/(clips\/index\.json|manifest[^/]*\.json|listen\.html)$/.test(new URL(req.url).pathname)) {
    e.respondWith(caches.open(VERSION).then((c) => fetch(req, { cache: 'no-store' }).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => c.match(req, { ignoreSearch: true }).then((hit) => hit || new Response('[]', { headers: { 'Content-Type': 'application/json' } })))));
    return;
  }
  e.respondWith(caches.open(VERSION).then(async (c) => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || (req.mode === 'navigate' && (await c.match('index.html'))) || new Response('Offline', { status: 503 });
  }));
});
