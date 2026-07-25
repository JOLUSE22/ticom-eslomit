const CACHE_NAME = 'ticom-eslomit-v3';
const URLS_TO_CACHE = [
  '/ticom-eslomit/TICOM_Sistema_Gestion_2026.html',
  '/ticom-eslomit/icon-192.png',
  '/ticom-eslomit/icon-512.png',
  '/ticom-eslomit/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js'
];

// Instalación: cachear todos los archivos
self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.allSettled(
        URLS_TO_CACHE.map(function(url) {
          return cache.add(url).catch(function(e) {
            console.warn('SW: no se pudo cachear', url, e);
          });
        })
      );
    })
  );
});

// Activación: limpiar caches viejas
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch: cache-first para el HTML principal, network-first para Firebase
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Firebase y APIs externas: network-first (si falla, no hay cache)
  if (url.includes('firebaseio.com') || 
      url.includes('googleapis.com') || 
      url.includes('gstatic.com/firebasejs')) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }

  // HTML principal y recursos locales: cache-first, actualizar en background
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      var networkFetch = fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() { return null; });

      // Devolver cache inmediatamente, actualizar en background
      return cached || networkFetch;
    })
  );
});

// Mensaje desde la app para forzar actualización
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
