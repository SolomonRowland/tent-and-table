// The app moved from /events/ to the site root. This retires the old offline copy on phones that installed it here.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return /^tent-table-/.test(k); }).map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.registration.unregister(); }));
});
