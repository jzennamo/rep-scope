/* Rep Scope service worker — same-origin cache-first, so the app works offline. */
const CACHE = "repscope-669155fb89";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest",
                "./icon-180.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Leave cross-origin alone (the web font). If it fails offline the page just
  // uses its fallback stack, which is a better outcome than a broken response.
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true })
      .then(hit => hit || fetch(e.request).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      }))
      .catch(() => caches.match("./index.html"))
  );
});
