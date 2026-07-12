/* sw.js — minimal service worker for My Research Platform
 *
 * Deliberately does NOT cache the Streamlit app. That app needs a live
 * connection (live prices, Supabase, AI), so serving a stale cached copy
 * would show wrong data — worse than showing nothing.
 *
 * This worker exists to satisfy PWA installability and to cache only the
 * shell (icons + wrapper page), so the splash appears instantly.
 */

const CACHE = 'mrp-shell-v1';
const SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Never intercept the Streamlit app or any API — always go to the network.
  if (url.origin !== self.location.origin) return;

  // Shell files: serve from cache, fall back to network.
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
