const CACHE_NAME = 'presence-v6';

// Obtenir les URLs à mettre en cache dynamiquement selon le scope (compatible GitHub Pages)
function getUrlsToCache(scope) {
  return [
    scope,
    scope + 'index.html',
    scope + 'teacher.html',
    scope + 'student.html',
    scope + 'settings.html',
    scope + 'css/style.css',
    scope + 'js/app.js',
    scope + 'js/common.js',
    scope + 'js/teacher.js',
    scope + 'js/student.js',
    scope + 'js/settings.js',
    scope + 'manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
    'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js'
  ];
}

// Installation du Service Worker
self.addEventListener('install', event => {
  const scope = self.registration.scope;
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert pour scope:', scope);
        return cache.addAll(getUrlsToCache(scope));
      })
      .catch(err => console.error('Erreur de mise en cache:', err))
  );
  // Activer immédiatement sans attendre les onglets existants
  self.skipWaiting();
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
    }).then(() => self.clients.claim())
  );
});

// Stratégie Cache-first avec fallback réseau
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(networkResponse => {
          // Ne pas mettre en cache les requêtes avec des schémas non supportés
          const url = new URL(event.request.url);
          if (url.protocol.startsWith('http')) {
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
        const acceptHeader = event.request.headers.get('accept') || '';
        if (acceptHeader.includes('text/html')) {
          const scope = self.registration.scope;
          return caches.match(scope + 'index.html');
        }
      })
  );
});
