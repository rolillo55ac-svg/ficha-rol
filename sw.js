// Service Worker - Rol Krysalis 1.0v (Modo Pruebas)
// Modo offline y carga rapida

const CACHE_NAME = 'rol-krysalis-v1.4.126.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './house.css',
  './manifest.json',
  './favicon.ico',
  './favicon.svg',
  './images/krysalis-icon.svg',
  './images/iconos/casa.svg',
  './images/iconos/tiradas.svg',
  './images/iconos/ui.svg',
  './images/iconos/extra/piedra-blanca.webp',
  './images/iconos/extra/piedra-roja.webp',
  './images/iconos/extra/piedra-azul.webp',
  './images/iconos/extra/piedra-verde.webp',
  './images/iconos/extra/piedra-negra.webp',
  './images/iconos/extra/piedra-morada.webp',
  './images/iconos/extra/musica.webp',
  './images/iconos/extra/vibracion.webp',
  './images/iconos/extra/mensaje.webp',
  './images/iconos/extra/flor-lis.webp',
  './images/iconos/extra/cafe.webp',
  './images/iconos/extra/bailarin.webp',
  './images/iconos/barra/pergamino.webp',
  './images/iconos/barra/pergamino-focus.webp',
  './images/iconos/barra/d20.webp',
  './images/iconos/barra/d20-focus.webp',
  './images/iconos/barra/mochila.webp',
  './images/iconos/barra/mochila-focus.webp',
  './images/iconos/barra/balanza.webp',
  './images/iconos/barra/balanza-focus.webp',
  './images/iconos/barra/casa.webp',
  './images/iconos/barra/casa-focus.webp',
  './images/iconos/barra/brujula.webp',
  './images/iconos/barra/brujula-focus.webp',
  './images/iconos/barra/cerebro.webp',
  './images/iconos/barra/cerebro-focus.webp',
  './images/iconos/barra/espantapajaros.webp',
  './images/iconos/barra/espantapajaros-focus.webp',
  './images/iconos/barra/puno.webp',
  './images/iconos/barra/puno-focus.webp',
  './images/iconos/barra/destellos.webp',
  './images/iconos/barra/destellos-focus.webp',
  './images/iconos/barra/bola-cristal.webp',
  './images/iconos/barra/bola-cristal-focus.webp',
  './images/iconos/barra/pocion.webp',
  './images/iconos/barra/pocion-focus.webp',
  './images/iconos/barra/piedras.webp',
  './images/iconos/barra/piedras-focus.webp',
  './images/iconos/barra/diamante.webp',
  './images/iconos/barra/diamante-focus.webp',
  './images/iconos/barra/dragon.webp',
  './images/iconos/barra/dragon-focus.webp',
  './images/iconos/barra/huellas.webp',
  './images/iconos/barra/huellas-focus.webp',
  './images/iconos/barra/estrella.webp',
  './images/iconos/barra/estrella-focus.webp',
  './images/iconos/barra/mapa.webp',
  './images/iconos/barra/mapa-focus.webp',
  './images/iconos/cabecera/d10.webp',
  './images/iconos/cabecera/d10-focus.webp',
  './images/iconos/cabecera/buzon.webp',
  './images/iconos/cabecera/buzon-focus.webp',
  './images/iconos/cabecera/ajustes.webp',
  './images/iconos/cabecera/reloj.webp',
  './images/iconos/cabecera/admin.webp',
  './images/iconos/cabecera/master.webp',
  './images/iconos/cabecera/jugador.webp',
  './images/iconos/ficha/vida.webp',
  './images/iconos/ficha/mana.webp',
  './images/iconos/ficha/escudo.webp',
  './images/iconos/estados/aturdido.webp',
  './images/apple-touch-icon.png',
  './images/monedas/moneda-oro-96.webp',
  './images/monedas/moneda-oro-96.png',
  './images/monedas/moneda-plata-96.webp',
  './images/monedas/moneda-plata-96.png',
  './images/monedas/moneda-gremio-96.webp',
  './images/monedas/moneda-gremio-96.png',
  './images/icon-192.png',
  './images/icon-512.png',
  './images/icon-maskable.png',
  './images/icon-32.png',
  './images/icon-16.png',
  './sounds/ruido_murcielago.wav',
  './assets/audio/ruido_murcielago.wav',
  './sounds/sonido_mochila.mp3',
  './sounds/backpack_open.mp3',
  './sounds/ficha_pergamino.mp3',
  './sounds/mision_brujula.mp3',
  './sounds/habilidades_click.mp3',
  './sounds/entrenamiento_tela.mp3',
  './sounds/combate_espada.mp3',
  './sounds/estados_magia.mp3',
  './sounds/magia_destello.mp3',
  './sounds/alquimia_pocion.mp3',
  './sounds/invocaciones_eco.mp3',
  './sounds/bestiario_paginas.mp3',
  './sounds/extra_dados.mp3',
  './sounds/mundo_viento.mp3',
  './sounds/casa_puerta.mp3',
  './sounds/tiradas_dados.mp3',
  './js/partidas-config.js',
  './js/reglas.js',
  './js/guia.js',
  './js/bienvenida.js',
  './js/utils.js',
  './js/iconos.js',
  './js/state.js',
  './js/supabase-client.js',
  './js/errores.js',
  './js/auth.js',
  './js/sync.js',
  './js/characters.js',
  './js/combat.js',
  './js/catalog.js',
  './js/bestiary.js',
  './js/maps.js',
  './js/markers.js',
  './js/quests.js',
  './js/clock.js',
  './js/mantenimiento.js',
  './js/konva.min.js',
  './js/house-art.js',
  './js/house.js',
  './js/dice.js',
  './js/roll-history.js',
  './js/roll-requests.js',
  './js/lapidary.js',
  './js/cuentas.js',
  './js/gallery.js',
  './js/ui-modals.js',
  './js/ui-render.js',
  './js/ui-events.js',
  './js/levelup.js',
  './js/app.js',
  './js/ui-juice.js'
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

  // Nunca cachear llamadas a APIs de Supabase, version.json, parámetros anti-caché _v ni métodos no-GET
  if (req.method !== 'GET' || url.hostname.includes('supabase.co') || url.pathname.includes('version.json') || url.searchParams.has('_v')) {
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
