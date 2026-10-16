const CACHE_NAME = 'gilda-cache-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Ignorar peticiones de extensiones de Chrome o esquemas no HTTP/HTTPS
  if (!url.startsWith('http://') && !url.startsWith('https://')) return;

  // No guardar en cache las peticiones a la API de Supabase para evitar guardar errores 500
  if (url.includes('supabase.co')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
          return networkResponse;
        })
        .catch(() => {
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
    })
  );
});