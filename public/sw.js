const CACHE_NAME = 'crm-retarder-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/logo-retarder.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Estrategia: Network first, falling back to cache
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
