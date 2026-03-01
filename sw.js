const CACHE = 'stitch-track-v1';

// Files to cache for offline use
const PRECACHE = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=DM+Sans:wght@400;500;600&display=swap'
];

// Install: cache core files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cache local files immediately; Google Fonts may fail offline — that's fine
      return cache.addAll(['/', '/index.html']).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache first, fall back to network
self.addEventListener('fetch', e => {
  // Don't intercept Google Sheets sync requests — always go to network
  if (e.request.url.includes('script.google.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache successful GET responses for the app shell
        if (e.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // If both cache and network fail, return the cached index.html
        // so the app still loads offline
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
