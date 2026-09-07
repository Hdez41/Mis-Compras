const CACHE_NAME = 'v-google-sheets-v2'; // Cambiado a v2 para forzar recarga de archivos estáticos
const ASSETS = [
    './',
    './index.html',
    './app.js',
    './style.css',
    './manifest.json',
    './image/Carrito-transformed.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// INTERCEPTOR DE PETICIONES
self.addEventListener('fetch', (e) => {
    // REGLA FUNDAMENTAL: Si el link es de Google, oblígalo a ir directo a internet por datos frescos
    if (e.request.url.includes('://google.com') || e.request.url.includes('google.com')) {
        return; // Al salir aquí, el navegador usa la red normal en vez de la caché congelada
    }

    // Para los archivos locales (html, css, js de la app), usa caché con respaldo de red
    e.respondWith(
        fetch(e.request)
            .then((response) => {
                if (response.status === 200 && e.request.method === 'GET') {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
                }
                return response;
            })
            .catch(() => caches.match(e.request))
    );
});
