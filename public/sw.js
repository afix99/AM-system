// AM System service worker — pass-through only.
// Previously it cached JS bundles aggressively, which left users
// running stale code after deploys. Now its only job is to take over
// from older caching SWs and immediately delete every cache, then
// hand all requests back to the browser's normal fetch.

const VERSION = 'v5-passthrough';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// No 'fetch' listener — every request goes straight to the network.
