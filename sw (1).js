const CACHE_NAME = 'ticom-eslomit-v4';
const URLS_TO_CACHE = [
  '/ticom-eslomit/TICOM_Sistema_Gestion_2026.html',
  '/ticom-eslomit/icon-192.png',
  '/ticom-eslomit/icon-512.png',
  '/ticom-eslomit/manifest.json'
];

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.allSettled(
        URLS_TO_CACHE.map(function(url) {
          return cache.add(url).catch(function(e) {
            console.warn('SW: no se pudo cachear', url);
          });
        })
      );
    })
  );
});

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

self.addEventListener('fetch', function(event) {
  var req = event.request;

  // NUNCA cachear requests POST o no-GET
  if(req.method !== 'GET') return;

  // NUNCA cachear Firebase, EmailJS ni APIs externas
  var url = req.url;
  if(url.includes('firebaseio.com') ||
     url.includes('emailjs.com') ||
     url.includes('googleapis.com') ||
     url.includes('openweathermap.org') ||
     url.includes('gstatic.com/firebasejs')) {
    return;
  }

  // Cache-first para recursos locales
  event.respondWith(
    caches.match(req).then(function(cached) {
      var networkFetch = fetch(req).then(function(response) {
        if(response && response.status === 200 && req.method === 'GET') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(req, clone);
          });
        }
        return response;
      }).catch(function() { return null; });
      return cached || networkFetch;
    })
  );
});

self.addEventListener('message', function(event) {
  if(event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
