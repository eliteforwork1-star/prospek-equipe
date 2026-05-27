// PROSPEK Service Worker v1.0
const CACHE = 'prospek-v1';
const CORE = ['/prospek-equipe/', '/prospek-equipe/index.html'];

// Installation
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

// Activation — supprime anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — Network first, cache fallback
self.addEventListener('fetch', e => {
  // API calls: toujours réseau
  if (e.request.url.includes('script.google.com') ||
      e.request.url.includes('googleapis.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Mettre en cache la nouvelle version HTML
        if (e.request.url.includes('index.html') ||
            e.request.url.endsWith('/prospek-equipe/')) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Message de mise à jour
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
