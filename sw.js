// Service Worker - Servisne Procedure
const CACHE_NAME = 'servisne-procedure-v2';

// Relativne putanje (rade na GitHub Pages u podmapi repozitorija)
const urlsToCache = [
  './',
  './index.html',
  './script.js',
  './brandDatabase.json',
  './manifest.json'
];

// Instalacija - precache osnovnih datoteka
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      // Svaku datoteku dodajemo zasebno da jedna koja fali ne sruši cijelu instalaciju
      Promise.all(
        urlsToCache.map(url =>
          cache.add(url).catch(err => console.log('Precache preskočen:', url, err))
        )
      )
    )
  );
});

// Aktivacija - brisanje starih cacheva i preuzimanje kontrole
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names =>
        Promise.all(
          names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch - network first, cache fallback; samo GET s istog origina
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cacheiraj samo uspješne odgovore
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(cached => {
          if (cached) return cached;
          // Navigacija bez interneta i bez cachea -> vrati početnu stranicu
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        })
      )
  );
});
