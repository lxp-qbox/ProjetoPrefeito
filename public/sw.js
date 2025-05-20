
// public/sw.js
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Optionally, pre-cache assets here
  // event.waitUntil(caches.open('app-shell-v1').then(cache => {
  //   return cache.addAll(['/', '/offline.html']); // Example: Add an offline page
  // }));
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Optionally, clean up old caches here
  // event.waitUntil(
  //   caches.keys().then(cacheNames => {
  //     return Promise.all(
  //       cacheNames.filter(cacheName => {
  //         // Return true if you want to remove this cache,
  //         // for example, if it's an old version.
  //         return cacheName.startsWith('app-shell-') && cacheName !== 'app-shell-v1';
  //       }).map(cacheName => {
  //         return caches.delete(cacheName);
  //       })
  //     );
  //   })
  // );
});

self.addEventListener('fetch', (event) => {
  // console.log('Service Worker: Fetching ', event.request.url);
  // Basic network-first strategy needed for PWA installability.
  // For full offline support, a more robust caching strategy is required.
  event.respondWith(
    fetch(event.request).catch(() => {
      // If the network fails, you could try to return a cached offline page:
      // return caches.match('/offline.html');
      // For now, just let the browser handle the network error if fetch fails.
      // This basic fetch handler is often enough to make the app installable.
    })
  );
});
