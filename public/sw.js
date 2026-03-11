const CACHE_NAME = 'presence-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/teacher.html',
  '/student.html',
  '/css/style.css',
  '/js/app.js',
  '/js/teacher.js',
  '/js/student.js',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Erreur de mise en cache:', err))
  );
});

// Activation : nettoyer les anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Stratégie Cache-first avec fallback réseau
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(networkResponse => {
          // Ne pas mettre en cache les requêtes avec des schémas non supportés (chrome-extension, etc.)
          const url = new URL(event.request.url);
          if (url.protocol.startsWith('http')) {
            // Mettre en cache les nouvelles ressources
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // Fallback pour les pages HTML
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      })
  );
});