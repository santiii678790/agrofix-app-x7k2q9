// Carpeta donde se publica la app ("/" en un servidor propio, "/nombre-del-repo/" en GitHub Pages).
const ROOT = new URL('./', self.location).href;
const CACHE_NAME = 'agrofix-shell-b3c6b761e4df';
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(ROOT, { cache: 'reload' });
    await cache.put(ROOT, response.clone());
    const html = await response.text();
    const bundled = [...html.matchAll(/(?:src|href)="\.\/([^\"]+)"/g)].map(match => ROOT + match[1]);
    await cache.addAll([...new Set([...bundled, 'manifest.webmanifest', 'assets/sql-wasm.wasm', 'assets/icon-192.png', 'assets/icon-512.png', 'assets/campo-agrofix.svg'].map(path => path.startsWith(ROOT) ? path : ROOT + path))]);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('agrofix-shell-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(ROOT, copy)); }
      return response;
    }).catch(async () => (await caches.match(ROOT)) || Response.error()));
    return;
  }
  event.respondWith(caches.match(request).then(cached => {
    const fresh = fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    });
    return cached || fresh;
  }));
});
