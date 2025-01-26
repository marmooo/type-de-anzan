const CACHE_NAME = "2025-01-27 01:00";
const urlsToCache = [
  "/type-de-anzan/",
  "/type-de-anzan/index.js",
  "/type-de-anzan/mp3/incorrect1.mp3",
  "/type-de-anzan/mp3/end.mp3",
  "/type-de-anzan/mp3/correct3.mp3",
  "/type-de-anzan/favicon/favicon.svg",
  "https://marmooo.github.io/fonts/textar-light.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );
});
