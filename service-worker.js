const CACHE = 'meetly-shell-v3';
// Relative to this script, so the shell works under a sub-path deploy (e.g. /meetly/).
const ASSETS = ['./', './index.html', './lib.js', './app.js', './supabase-config.js',
  './supabase-client.js', './styles.css',
  './manifest.webmanifest', './icons/meetly-icon.svg', './icons/icon-192.png'];
const scope = new URL('./', self.location).href;

self.addEventListener('install', (event) => event.waitUntil(
  // Individual puts: one missing asset must not abort the whole install.
  caches.open(CACHE).then((cache) => Promise.all(ASSETS.map((asset) => cache.add(asset).catch(() => {}))))
    .then(() => self.skipWaiting())
));

self.addEventListener('activate', (event) => event.waitUntil(
  caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim())
));

// Only the static shell is cached. API responses carry guest names, phones and
// e-mail addresses, so they must never be written to Cache Storage.
const isShellAsset = (request) => {
  if (request.method !== 'GET' || request.mode === 'navigate') return false;
  if (!request.url.startsWith(scope)) return false;
  const { pathname } = new URL(request.url);
  if (pathname.endsWith('/service-worker.js')) return false;
  return /\.(?:html|js|css|svg|png|webmanifest)$/.test(pathname);
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./index.html').then((hit) => hit || Response.error())));
    return;
  }
  if (!isShellAsset(request)) return;
  event.respondWith(fetch(request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
    }
    return response;
  }).catch(() => caches.match(request).then((hit) => hit || Response.error())));
});
