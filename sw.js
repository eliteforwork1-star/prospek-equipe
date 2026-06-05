// PROSPEK Service Worker v3.18
const CACHE = 'prospek-v3-20';
const BASE = new URL(self.registration.scope).pathname;
const CORE = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon-180.png',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png'
];

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
            e.request.url.endsWith(BASE)) {
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

// Notification — revenir dans l'app installée au bon chemin GitHub Pages
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = new URL(e.notification.data && e.notification.data.url || './', self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.startsWith(self.location.origin + BASE) && 'focus' in client) {
          return client.focus().then(() => 'navigate' in client ? client.navigate(target) : client);
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(target) : null;
    })
  );
});
