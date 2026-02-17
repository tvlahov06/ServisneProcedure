// Service Worker za offline podršku
const CACHE_NAME = 'servisne-procedure-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalacija Service Workera
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache otvoren');
        return cache.addAll(urlsToCache);
      })
  );
});

// Aktivacija Service Workera
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Brišem stari cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch strategija - Network first, pa cache fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Kloniraj response jer je stream i može se koristiti samo jednom
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // Ako nema interneta, vrati iz cache-a
        return caches.match(event.request);
      })
  );
});
