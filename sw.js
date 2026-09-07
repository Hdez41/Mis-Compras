const CACHE_NAME = 'compras-v4';
const ASSETS = [
  '/Mis-compras/',
  '/Mis-compras/index.html',
  '/Mis-compras/style.css',
  '/Mis-compras/app.js',
  '/Mis-compras/manifest.json',
  '/Mis-compras/image/Carrito-transformed.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); 
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
