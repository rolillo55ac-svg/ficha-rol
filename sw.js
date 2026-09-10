// ==============================================================================
// Service Worker - Krysalis v1.0.0
// Estrategia: Network-First (prioridad red para datos frescos de rol en vivo,
// con respaldo en caché para apertura instantánea y modo sin conexión).
// ==============================================================================

const CACHE_NAME = 'krysalis-app-v1.0.2';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './favicon.ico',
  './favicon.svg',
  './images/krysalis-icon.svg',
  './images/apple-touch-icon.png',
  './images/icon-192.png',
  './images/icon-512.png',
  './images/icon-maskable.png',
  './images/icon-32.png',
  './images/icon-16.png',
  './js/utils.js',
  './js/state.js',
  './js/supabase-client.js',
  './js/auth.js',
  './js/sync.js',
  './js/characters.js',
  './js/combat.js',
  './js/catalog.js',
  './js/bestiary.js',
  './js/maps.js',
  './js/markers.js',
  './js/quests.js',
  './js/three.min.js',
  './js/dice.js',
  './js/ui-modals.js',
  './js/ui-render.js',
  './js/ui-events.js',
  './js/app.js'
];

// Instalación: precachear activos esenciales de la aplicación
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Aviso precacheando algunos activos:', err);
      });
    })
  );
});

// Activación: purgar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Peticiones: Network-First
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Nunca cachear llamadas a APIs de Supabase, WebSockets o métodos no-GET
  if (req.method !== 'GET' || url.hostname.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, resClone).catch(() => {});
          });
        }
        return networkRes;
      })
      .catch(() => {
        // En caso de fallo de red (sin conexión / offline), servir desde caché
        return caches.match(req).then((cachedRes) => {
          if (cachedRes) return cachedRes;
          // Si es navegación HTML, devolver la app raíz
          if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html') || caches.match('./');
          }
        });
      })
  );
});
