// EduMesh service worker: makes the app + textbooks work with no internet.
// Bump VERSION whenever app files change so phones pick up the update next time they are online.
const VERSION = 'v3';
const SHELL = `edumesh-shell-${VERSION}`;
const VENDOR = 'edumesh-vendor-v1'; // the AI runtime library; only cached if Phone AI is used

const SHELL_FILES = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'js/app.js',
  'js/rag.js',
  'js/prompts.js',
  'js/mastery.js',
  'js/engines.js',
  'js/speech.js',
  'js/packs.js',
  'js/teacher.js',
  'js/llm-worker.js',
  'data/curriculum.json',
  'data/quizzes.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  // Only delete OUR old caches. Never touch the model caches the AI library creates.
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('edumesh-') && k !== SHELL && k !== VENDOR).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // model weights etc. are cached by the AI library itself
  if (url.pathname.includes('/ollama/')) return; // live hub traffic, never cache

  if (url.pathname.includes('/vendor/')) {
    event.respondWith(cacheFirst(req, VENDOR));
    return;
  }
  // App shell + data: serve from cache instantly, refresh in the background when online.
  event.respondWith(staleWhileRevalidate(req, event));
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req, event) {
  const cache = await caches.open(SHELL);
  const hit = await cache.match(req, { ignoreSearch: true });
  const network = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);
  if (hit) {
    event.waitUntil(network);
    return hit;
  }
  const res = await network;
  if (res) return res;
  if (req.mode === 'navigate') {
    const shell = await cache.match('index.html');
    if (shell) return shell;
  }
  return new Response('Offline and not cached yet.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
}
