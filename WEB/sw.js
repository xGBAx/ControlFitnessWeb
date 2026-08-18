const CACHE_NAME = 'controlfitness-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/login.html',
    '/cadastro.html',
    '/registro.html',
    '/historico.html',
    '/index.css',
    '/login.css',
    '/registro.css',
    '/historico.css',
    '/firebase-config.js',
    '/login.js',
    '/cadastro.js',
    '/registro.js',
    '/historico.js',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});