/* Tent & Table: keep the app shell available offline. Data comes from the network; the app keeps its own copy for no-signal use. */
var CACHE = 'tent-table-v35';
var SHELL = ['./', './index.html', './qrcode.js', './data.js', './app.js', '../home/supabase.js', './icon.svg', './manifest.webmanifest'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // network first, so updates show up right away; fall back to the cache offline
  e.respondWith(fetch(e.request).then(function (r) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); return r; }).catch(function () { return caches.match(e.request, { ignoreSearch: true }); }));
});
